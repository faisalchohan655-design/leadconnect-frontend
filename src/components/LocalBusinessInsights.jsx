import { useState } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Search, Loader2, MapPin, Hash, Building, Trash2, Download } from 'lucide-react';

const LocalBusinessInsights = () => {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [filters, setFilters] = useState({ minRating: 0, cityFilter: '', search: '' });

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || !city.trim()) return toast.error('Enter business type and city');
    if (count < 1 || count > 50) return toast.error('Count must be 1–50');
    setLoading(true);
    const toastId = toast.loading('Fetching business insights...');
    try {
      const res = await api.post('/scrape', {
        keyword, city, count,
        filters: { requireEmail, requirePhone, requireWebsite }
      });
      const scrapedLeads = res.data.leads || [];
      setLeads(scrapedLeads);
      toast.success(`Found ${scrapedLeads.length} businesses`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Delete single lead
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setLeads(leads.filter(l => l._id !== id));
      setSelectedIds(selectedIds.filter(i => i !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedIds.length === 0) return toast.error('No leads selected');
    if (!window.confirm(`Delete ${selectedIds.length} leads?`)) return;
    for (const id of selectedIds) {
      await api.delete(`/leads/${id}`);
    }
    setLeads(leads.filter(l => !selectedIds.includes(l._id)));
    setSelectedIds([]);
    toast.success(`${selectedIds.length} leads deleted`);
  };

  // Filter leads on the frontend
  const filteredLeads = leads.filter(lead => {
    if (filters.minRating > 0 && (lead.rating || 0) < filters.minRating) return false;
    if (filters.cityFilter && !(lead.address || '').toLowerCase().includes(filters.cityFilter.toLowerCase())) return false;
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    if (filteredLeads.length === 0) return toast.error('No data to export');
    const headers = ['Name', 'Phone', 'Email', 'Website', 'Address', 'Rating'];
    const rows = filteredLeads.map(l => [l.name, l.phone, l.email, l.website, l.address, l.rating]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business_insights_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // Export Excel
  const exportExcel = () => {
    if (filteredLeads.length === 0) return toast.error('No data to export');
    const data = filteredLeads.map(l => ({
      Name: l.name,
      Phone: l.phone,
      Email: l.email,
      Website: l.website,
      Address: l.address,
      Rating: l.rating
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BusinessLeads');
    XLSX.writeFile(wb, `business_insights_${Date.now()}.xlsx`);
    toast.success('Excel exported');
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) setSelectedIds([]);
    else setSelectedIds(filteredLeads.map(l => l._id));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Local Business Insights</h1>

      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <form onSubmit={handleScrape} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Business Type / Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="w-full border rounded-xl p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City / Location</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border rounded-xl p-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Number of Results (max 50)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={e => setCount(parseInt(e.target.value))}
              className="w-full border rounded-xl p-2"
              required
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requireEmail} onChange={() => setRequireEmail(!requireEmail)} />
              Must have Email
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requirePhone} onChange={() => setRequirePhone(!requirePhone)} />
              Must have Phone
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requireWebsite} onChange={() => setRequireWebsite(!requireWebsite)} />
              Must have Website
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            {loading ? 'Fetching...' : 'Get Insights'}
          </button>
        </form>
      </div>

      {/* Display Results */}
      {leads.length > 0 && (
        <>
          {/* Filters for displayed results */}
          <div className="bg-white p-4 rounded-xl shadow mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500">Min Rating</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-32"
                />
                <span className="ml-2 text-sm">{filters.minRating}★</span>
              </div>
              <div>
                <label className="block text-xs text-gray-500">City (in address)</label>
                <input
                  type="text"
                  placeholder="e.g., Karachi"
                  value={filters.cityFilter}
                  onChange={e => setFilters({ ...filters, cityFilter: e.target.value })}
                  className="border rounded p-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Search by name</label>
                <input
                  type="text"
                  placeholder="Business name"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  className="border rounded p-1"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl shadow mb-4">
            <div className="flex gap-2">
              <button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1 rounded">Select All</button>
              <button onClick={bulkDelete} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"><Trash2 size={16} /> Delete</button>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><Download size={16} /> CSV</button>
              <button onClick={exportExcel} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><Download size={16} /> Excel</button>
            </div>
            <div className="text-sm">{selectedIds.length} selected / {filteredLeads.length} total</div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Select</th>
                  <th className="text-left">Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Address</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead._id} className="border-t">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(lead._id)} onChange={() => toggleSelect(lead._id)} />
                    </td>
                    <td className="p-3 font-medium">{lead.name}</td>
                    <td className="p-3">{lead.phone || '-'}</td>
                    <td className="p-3">{lead.email || '-'}</td>
                    <td className="p-3">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Visit
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-3 max-w-xs truncate">{lead.address || '-'}</td>
                    <td className="p-3">{lead.rating || '-'}</td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(lead._id)} className="text-red-500 hover:text-red-700">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="text-center p-6 text-gray-500">No leads match the current filters</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LocalBusinessInsights;
