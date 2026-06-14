import { useEffect, useState } from 'react';
import api from '../api';
import { FaWhatsapp, FaEnvelope, FaTrash, FaCheckSquare, FaSquare, FaFileExcel, FaFileCsv, FaStar, FaRegStar, FaEdit, FaSave, FaTimes, FaPhone } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const CampaignOutreach = () => {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingContact, setEditingContact] = useState(null);
  const [tempContactName, setTempContactName] = useState('');
  const [filters, setFilters] = useState({ search: '', city: '', minRating: 0, source: 'all' });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      setLeads(res.data);
      setFiltered(res.data);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let r = leads;
    if (filters.search) r = r.filter(l => l.name?.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.city) r = r.filter(l => l.address?.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.minRating > 0) r = r.filter(l => (l.rating || 0) >= filters.minRating);
    if (filters.source !== 'all') r = r.filter(l => (l.source || 'google').toLowerCase() === filters.source.toLowerCase());
    setFiltered(r);
    setSelected([]);
    setCurrentPage(1);
  }, [filters, leads]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentLeads = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Status options
  const statusOptions = ['Untouched', 'Contacted', 'Qualified', 'Not Interested'];
  const getStatusColor = (status) => {
    switch(status) {
      case 'Untouched': return 'bg-gray-100 text-gray-700';
      case 'Contacted': return 'bg-blue-100 text-blue-700';
      case 'Qualified': return 'bg-green-100 text-green-700';
      case 'Not Interested': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/leads/${id}`, { status: newStatus });
      setLeads(leads.map(l => l._id === id ? { ...l, status: newStatus } : l));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const updateContactPerson = async (id, name) => {
    try {
      await api.patch(`/leads/${id}`, { contactPerson: name });
      setLeads(leads.map(l => l._id === id ? { ...l, contactPerson: name } : l));
      toast.success('Contact name saved');
    } catch (err) {
      toast.error('Failed to save');
    }
  };

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

  const bulkEmail = () => {
    const withEmail = leads.filter(l => selected.includes(l._id) && l.email);
    if (withEmail.length === 0) return toast.error('No emails selected');
    window.location.href = `mailto:${withEmail.map(l => l.email).join(',')}?subject=Business%20Opportunity`;
    toast.success(`Opened email client for ${withEmail.length} leads`);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const headers = ['Name', 'Contact Person', 'Phone', 'Email', 'Rating', 'Status', 'Source'];
    const rows = filtered.map(l => [l.name, l.contactPerson || '', l.phone, l.email, l.rating, l.status || 'Untouched', l.source || 'Google']);
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
      ContactPerson: l.contactPerson || '',
      Phone: l.phone,
      Email: l.email,
      Rating: l.rating,
      Status: l.status || 'Untouched',
      Source: l.source || 'Google'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CampaignLeads');
    XLSX.writeFile(wb, `campaign_leads_${Date.now()}.xlsx`);
    toast.success('Excel exported');
  };

  const toggleSelectAll = () => {
    if (selected.length === currentLeads.length) setSelected([]);
    else setSelected(currentLeads.map(l => l._id));
  };

  const toggleSelect = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
    else setSelected([...selected, id]);
  };

  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < fullStars ? <FaStar className="text-yellow-400 w-3 h-3" /> :
             i === fullStars && hasHalf ? <FaStar className="text-yellow-400 w-3 h-3 opacity-50" /> :
             <FaRegStar className="text-gray-300 w-3 h-3" />}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-6 text-center">Loading leads...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6">Campaign Outreach</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label>Min Rating</label><input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} className="w-full" /><span>{filters.minRating}★</span></div>
          <div><label>City</label><input type="text" placeholder="e.g., Karachi" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} className="border rounded-lg p-2 w-full" /></div>
          <div><label>Search by name</label><input type="text" placeholder="Business name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="border rounded-lg p-2 w-full" /></div>
          <div><label>Lead Source</label><select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })} className="border rounded-lg p-2 w-full"><option value="all">All</option><option value="google">Google Maps</option><option value="facebook">Facebook</option><option value="email_extracted">Email Extractor</option></select></div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow p-3 mb-6 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"><FaCheckSquare size={16} /> Select All</button>
          <button onClick={bulkEmail} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"><FaEnvelope size={16} /> Email</button>
          <button onClick={bulkDelete} className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"><FaTrash size={16} /> Delete</button>
          <button onClick={exportCSV} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"><FaFileCsv size={16} /> CSV</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"><FaFileExcel size={16} /> Excel</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button onClick={() => setViewMode('cards')} className={`px-3 py-1 rounded text-sm ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Cards</button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Table</button>
          </div>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded p-1 text-sm"><option>5</option><option>10</option><option>20</option><option>50</option></select>
          <div className="text-sm">{selected.length} selected / {filtered.length} total</div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentLeads.map(lead => (
            <div key={lead._id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} className="w-4 h-4" />
                  <h3 className="font-bold text-md leading-tight">{lead.name}</h3>
                </div>
                <StarRating rating={lead.rating} />
              </div>
              <p className="text-gray-500 text-xs truncate">{lead.address || 'No address'}</p>

              {/* Contact Person - Editable */}
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-gray-400">Contact:</span>
                {editingContact === lead._id ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={tempContactName} onChange={e => setTempContactName(e.target.value)} className="border rounded p-0.5 text-xs w-24" autoFocus />
                    <button onClick={() => { updateContactPerson(lead._id, tempContactName); setEditingContact(null); }} className="text-green-600"><FaSave size={12} /></button>
                    <button onClick={() => setEditingContact(null)} className="text-red-600"><FaTimes size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">{lead.contactPerson || '—'}</span>
                    <button onClick={() => { setEditingContact(lead._id); setTempContactName(lead.contactPerson || ''); }} className="text-gray-400 hover:text-gray-600"><FaEdit size={10} /></button>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-3">
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:text-green-800" title="WhatsApp">
                      <FaWhatsapp size={24} />
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800" title="Email">
                      <FaEnvelope size={24} />
                    </a>
                  )}
                  <button onClick={() => deleteLead(lead._id)} className="text-red-500 hover:text-red-700" title="Delete">
                    <FaTrash size={22} />
                  </button>
                </div>

                {/* Status Dropdown */}
                <select
                  value={lead.status || 'Untouched'}
                  onChange={e => updateStatus(lead._id, e.target.value)}
                  className={`text-xs rounded-full px-2 py-1 ${getStatusColor(lead.status || 'Untouched')} border-0 cursor-pointer`}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {lead.phone && (
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <FaPhone size={10} /> {lead.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3"><button onClick={toggleSelectAll}>{selected.length === currentLeads.length ? <FaCheckSquare size={16} /> : <FaSquare size={16} />}</button></th>
                <th className="text-left">Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.map(lead => (
                <tr key={lead._id} className="border-t hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} /></td>
                  <td className="p-3 font-medium">{lead.name}</td>
                  <td className="p-3">{lead.contactPerson || '—'}</td>
                  <td className="p-3">{lead.phone || '-'}</td>
                  <td className="p-3">{lead.email || '-'}</td>
                  <td className="p-3"><StarRating rating={lead.rating} />{lead.rating || '-'}</td>
                  <td className="p-3">
                    <select value={lead.status || 'Untouched'} onChange={e => updateStatus(lead._id, e.target.value)} className={`text-xs rounded-full px-2 py-1 ${getStatusColor(lead.status || 'Untouched')} border-0`}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 flex gap-2 items-center">
                    {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600"><FaWhatsapp size={22} /></a>}
                    {lead.email && <a href={`mailto:${lead.email}`} className="text-blue-600"><FaEnvelope size={22} /></a>}
                    <button onClick={() => deleteLead(lead._id)} className="text-red-500"><FaTrash size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
};

export default CampaignOutreach;
