import { useEffect, useState } from 'react';
import api from '../api';
import { FaWhatsapp, FaEnvelope, FaTrash, FaCheckSquare, FaSquare, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const CampaignOutreach = () => {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', city: '', minRating: 0, source: 'all' });

  useEffect(() => {
    api.get('/leads')
      .then(res => { setLeads(res.data); setFiltered(res.data); setLoading(false); })
      .catch(() => toast.error('Failed to load leads'));
  }, []);

  useEffect(() => {
    let r = leads;
    if (filters.search) r = r.filter(l => l.name?.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.city) r = r.filter(l => l.address?.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.minRating > 0) r = r.filter(l => (l.rating || 0) >= filters.minRating);
    if (filters.source !== 'all') r = r.filter(l => (l.source || 'google').toLowerCase() === filters.source.toLowerCase());
    setFiltered(r);
    setSelected([]);
  }, [filters, leads]);

  const deleteLead = async (id) => {
    if (window.confirm('Delete this lead?')) {
      await api.delete(`/leads/${id}`);
      setLeads(leads.filter(l => l._id !== id));
      toast.success('Deleted');
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} leads?`)) return;
    for (const id of selected) await api.delete(`/leads/${id}`);
    setLeads(leads.filter(l => !selected.includes(l._id)));
    setSelected([]);
    toast.success(`${selected.length} leads deleted`);
  };

  const bulkWhatsApp = () => {
    const withPhone = leads.filter(l => selected.includes(l._id) && l.phone);
    if (withPhone.length === 0) return toast.error('No phone numbers');
    withPhone.forEach(l => window.open(`https://wa.me/${l.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello from LeadConnect')}`));
    toast.success(`Opened ${withPhone.length} chats`);
  };

  const bulkEmail = () => {
    const withEmail = leads.filter(l => selected.includes(l._id) && l.email);
    if (withEmail.length === 0) return toast.error('No emails');
    window.location.href = `mailto:${withEmail.map(l => l.email).join(',')}?subject=Business%20Opportunity`;
    toast.success(`Opened email client for ${withEmail.length} leads`);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const headers = ['Name', 'Phone', 'Email', 'Rating', 'Source'];
    const rows = filtered.map(l => [
      l.name || '',
      l.phone || '',
      l.email || '',
      l.rating || '',
      l.source || 'Google'
    ]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const escapedRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      csvContent += escapedRow + '\n';
    });
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_leads_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportExcel = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const data = filtered.map(l => ({
      Name: l.name || '',
      Phone: l.phone || '',
      Email: l.email || '',
      Rating: l.rating || '',
      Source: l.source || 'Google'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CampaignLeads');
    XLSX.writeFile(wb, `campaign_leads_${Date.now()}.xlsx`);
    toast.success('Excel exported');
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(l => l._id));
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
    else setSelected([...selected, id]);
  };

  if (loading) return <div className="p-6 text-center">Loading leads...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6">Campaign Outreach</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium">Min Rating</label>
            <input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} className="w-full" />
            <span className="text-sm">{filters.minRating}★</span>
          </div>
          <div>
            <label className="block text-sm font-medium">City</label>
            <input type="text" placeholder="e.g., Karachi" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="border rounded-lg p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Search by name</label>
            <input type="text" placeholder="Business name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="border rounded-lg p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Lead Source</label>
            <select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })} className="border rounded-lg p-2 w-full">
              <option value="all">All</option>
              <option value="google">Google Maps</option>
              <option value="facebook">Facebook</option>
              <option value="email_extracted">Email Extractor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow p-3 mb-6 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaCheckSquare /> Select All</button>
          <button onClick={bulkWhatsApp} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaWhatsapp /> WhatsApp</button>
          <button onClick={bulkEmail} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaEnvelope /> Email</button>
          <button onClick={bulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaTrash /> Delete</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaFileCsv /> CSV</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaFileExcel /> Excel</button>
        </div>
        <div className="text-sm font-medium">{selected.length} selected / {filtered.length} total</div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 w-10"><button onClick={toggleSelectAll}>{selected.length === filtered.length ? <FaCheckSquare /> : <FaSquare />}</button></th>
              <th className="text-left p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Source</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead._id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} />
                </td>
                <td className="p-3 font-medium max-w-xs truncate">{lead.name || '-'}</td>
                <td className="p-3">{lead.phone || '-'}</td>
                <td className="p-3">{lead.email || '-'}</td>
                <td className="p-3">{lead.rating || '-'}</td>
                <td className="p-3">{lead.source || 'Google'}</td>
                <td className="p-3 flex gap-2">
                  {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:text-green-800" title="WhatsApp">📱</a>}
                  {lead.email && <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800" title="Email">✉️</a>}
                  <button onClick={() => deleteLead(lead._id)} className="text-red-500 hover:text-red-700" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-10 text-gray-500">No leads match the current filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignOutreach;
