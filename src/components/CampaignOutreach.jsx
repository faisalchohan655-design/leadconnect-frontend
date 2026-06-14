import { useEffect, useState } from 'react';
import api from '../api';
import { FaWhatsapp, FaEnvelope, FaTrash, FaCheckSquare, FaSquare, FaFileExcel, FaFileCsv, FaCopy } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const CampaignOutreach = () => {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', city: '', minRating: 0, source: 'all' });
  const [showGuide, setShowGuide] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState('');

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

  // NEW: Copy numbers for WhatsApp Broadcast
  const copyForWhatsAppBroadcast = () => {
    const selectedLeads = filtered.filter(l => selected.includes(l._id) && l.phone);
    if (selectedLeads.length === 0) return toast.error('No phone numbers selected');
    if (selectedLeads.length > 15) {
      toast.error(`You selected ${selectedLeads.length} leads. Max 15 for WhatsApp broadcast. Please select fewer.`);
      return;
    }
    // Format numbers for WhatsApp (one per line, with country code)
    const formattedNumbers = selectedLeads.map(l => {
      let phone = l.phone.replace(/\D/g, '');
      if (!phone.startsWith('92') && !phone.startsWith('+92')) {
        if (phone.startsWith('0')) phone = '92' + phone.substring(1);
        else if (phone.length === 10) phone = '92' + phone;
      }
      if (!phone.startsWith('+')) phone = '+' + phone;
      return phone;
    }).join('\n');
    
    navigator.clipboard.writeText(formattedNumbers);
    setCopiedNumbers(formattedNumbers);
    setShowGuide(true);
    toast.success(`${selectedLeads.length} numbers copied!`);
  };

  const bulkEmail = () => {
    const withEmail = leads.filter(l => selected.includes(l._id) && l.email);
    if (withEmail.length === 0) return toast.error('No emails selected');
    window.location.href = `mailto:${withEmail.map(l => l.email).join(',')}?subject=Business%20Opportunity`;
    toast.success(`Opened email client for ${withEmail.length} leads`);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const headers = ['Name', 'Phone', 'Email', 'Rating', 'Source'];
    const rows = filtered.map(l => [l.name, l.phone, l.email, l.rating, l.source || 'Google']);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const escaped = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      csvContent += escaped + '\n';
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
    const data = filtered.map(l => ({
      Name: l.name,
      Phone: l.phone,
      Email: l.email,
      Rating: l.rating,
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
            <label>Min Rating</label>
            <input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} className="w-full" />
            <span>{filters.minRating}★</span>
          </div>
          <div>
            <label>City</label>
            <input type="text" placeholder="e.g., Karachi" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="border rounded-lg p-2 w-full" />
          </div>
          <div>
            <label>Search by name</label>
            <input type="text" placeholder="Business name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="border rounded-lg p-2 w-full" />
          </div>
          <div>
            <label>Lead Source</label>
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
          <button onClick={copyForWhatsAppBroadcast} className="bg-cyan-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaCopy /> Copy for WhatsApp Broadcast</button>
          <button onClick={bulkEmail} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaEnvelope /> Email</button>
          <button onClick={bulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaTrash /> Delete</button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaFileCsv /> CSV</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><FaFileExcel /> Excel</button>
        </div>
        <div className="text-sm">{selected.length} selected / {filtered.length} total</div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">📋 Numbers Copied!</h2>
            <p className="text-gray-600 mb-3">Follow these steps to send WhatsApp broadcast:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
              <li>Open <strong>WhatsApp</strong> on your phone or Web</li>
              <li>Go to <strong>Chats → New Broadcast</strong></li>
              <li>Long‑press / paste the numbers</li>
              <li>Write your message and <strong>Send</strong></li>
            </ol>
            <div className="bg-gray-100 p-2 rounded mb-4 text-xs font-mono break-all">
              {copiedNumbers.split('\n').slice(0, 3).map((n, i) => <div key={i}>{n}</div>)}
              {copiedNumbers.split('\n').length > 3 && <div>...</div>}
            </div>
            <button onClick={() => setShowGuide(false)} className="w-full bg-indigo-600 text-white py-2 rounded-lg">Got it</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3"><button onClick={toggleSelectAll}>{selected.length === filtered.length ? <FaCheckSquare /> : <FaSquare />}</button></th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Rating</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead._id} className="border-t">
                <td className="p-3"><input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} /></td>
                <td className="p-3 font-medium">{lead.name}</td>
                <td className="p-3">{lead.phone || '-'}</td>
                <td className="p-3">{lead.email || '-'}</td>
                <td className="p-3">{lead.rating || '-'}</td>
                <td className="p-3">{lead.source || 'Google'}</td>
                <td className="p-3 flex gap-2">
                  {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600">📱</a>}
                  {lead.email && <a href={`mailto:${lead.email}`} className="text-blue-600">✉️</a>}
                  <button onClick={() => deleteLead(lead._id)} className="text-red-500">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignOutreach;
