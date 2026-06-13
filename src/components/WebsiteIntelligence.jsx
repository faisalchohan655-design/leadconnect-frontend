import { useEffect, useState } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const WebsiteIntelligence = () => {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filters, setFilters] = useState({ search: '', city: '', minRating: 0 });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      const withWebsite = res.data.filter(l => l.website);
      setLeads(withWebsite);
      setFiltered(withWebsite);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let r = leads;
    if (filters.search) r = r.filter(l => l.name.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.city) r = r.filter(l => l.address?.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.minRating > 0) r = r.filter(l => (l.rating || 0) >= filters.minRating);
    setFiltered(r);
    setSelectedIds([]);
  }, [filters, leads]);

  const copyToClipboard = (text, label = 'URL') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copySelectedUrls = () => {
    const selectedLeads = filtered.filter(l => selectedIds.includes(l._id));
    if (selectedLeads.length === 0) return toast.error('No leads selected');
    const urls = selectedLeads.map(l => l.website).join('\n');
    copyToClipboard(urls, `${selectedLeads.length} URLs`);
  };

  const extractEmails = async () => {
    if (selectedIds.length === 0) return toast.error('Select leads');
    setExtracting(true);
    try {
      const res = await api.post('/email/bulk-extract-from-leads', { leadIds: selectedIds });
      toast.success(`Extracted ${res.data.totalNewEmails} new emails`);
      fetchLeads();
    } catch (err) {
      toast.error('Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} leads?`)) return;
    for (const id of selectedIds) await api.delete(`/leads/${id}`);
    toast.success(`${selectedIds.length} leads deleted`);
    fetchLeads();
    setSelectedIds([]);
  };

  const exportExcel = () => {
    const data = filtered.map(l => ({
      Name: l.name,
      Phone: l.phone,
      Website: l.website,
      Address: l.address,
      Rating: l.rating,
      ExtractedEmail: l.email || 'Not extracted'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WebsiteLeads');
    XLSX.writeFile(wb, `website_leads_${Date.now()}.xlsx`);
    toast.success('Exported');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(l => l._id));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  if (loading) return <div className="p-6 text-center">Loading leads...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">Website Intelligence</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="border rounded-lg p-2 flex-1"
          />
          <input
            type="text"
            placeholder="City filter"
            value={filters.city}
            onChange={e => setFilters({ ...filters, city: e.target.value })}
            className="border rounded-lg p-2 flex-1"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm">Min Rating:</span>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minRating}
              onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              className="w-32"
            />
            <span>{filters.minRating}★</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-3 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
        <button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1 rounded">Select All</button>
        <button onClick={extractEmails} disabled={extracting} className="bg-blue-600 text-white px-3 py-1 rounded">
          {extracting ? 'Extracting...' : '📧 Extract Emails'}
        </button>
        <button onClick={copySelectedUrls} className="bg-cyan-600 text-white px-3 py-1 rounded">📋 Copy Selected URLs</button>
        <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded">🗑️ Delete</button>
        <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded">📊 Export Excel</button>
        <span className="text-sm ml-auto">{selectedIds.length} selected / {filtered.length} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Select</th>
              <th className="text-left">Name</th>
              <th>Website</th>
              <th>Extracted Email</th>
              <th>Phone</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead._id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input type="checkbox" checked={selectedIds.includes(lead._id)} onChange={() => toggleSelect(lead._id)} />
                </td>
                <td className="p-3 font-medium">{lead.name}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-xs block">
                      {lead.website}
                    </a>
                    <button
                      onClick={() => copyToClipboard(lead.website, 'Website URL')}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy URL"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="p-3">{lead.email || '❌ Not extracted'}</td>
                <td className="p-3">{lead.phone || '-'}</td>
                <td className="p-3">{lead.rating || '-'}</td>
                <td className="p-3">
                  <button onClick={() => copyToClipboard(lead.website, 'URL')} className="text-gray-500 hover:text-gray-700 mr-2" title="Copy URL">📋</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-6">No leads with website found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WebsiteIntelligence;
