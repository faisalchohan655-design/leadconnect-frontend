import { useState } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const DomainInsights = () => {
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [deep, setDeep] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!singleUrl && !bulkUrls) return toast.error('Enter URL(s)');
    setLoading(true);
    const toastId = toast.loading('Extracting emails...');
    try {
      let response;
      if (bulkUrls) {
        const urls = bulkUrls.split('\n').filter(u => u.trim());
        if (urls.length === 0) throw new Error('No valid URLs');
        response = await api.post('/email/bulk-extract', { urls, deep, maxPagesPerUrl: maxPages });
      } else {
        response = await api.post('/email/extract', { url: singleUrl, deep, maxPages });
      }
      const leads = response.data.leads || [];
      setExtracted(leads);
      setSelected([]);
      toast.success(`Found ${leads.length} emails`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Extraction failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const saveSelectedToLeads = async () => {
    if (selected.length === 0) return toast.error('No emails selected');
    const leadsToSave = extracted.filter((_, idx) => selected.includes(idx));
    try {
      await api.post('/email/save-leads', { leads: leadsToSave });
      toast.success(`Saved ${leadsToSave.length} leads to database`);
      // Remove saved ones from the list? Optional: ask user
      setExtracted(extracted.filter((_, idx) => !selected.includes(idx)));
      setSelected([]);
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const deleteSelected = () => {
    if (selected.length === 0) return toast.error('No emails selected');
    if (!window.confirm(`Delete ${selected.length} emails from this list?`)) return;
    setExtracted(extracted.filter((_, idx) => !selected.includes(idx)));
    setSelected([]);
    toast.success(`${selected.length} emails removed`);
  };

  const exportCSV = () => {
    if (extracted.length === 0) return toast.error('No data to export');
    const dataToExport = selected.length ? selected.map(idx => extracted[idx]) : extracted;
    const headers = ['Email', 'Source', 'Verified', 'Phone'];
    const rows = dataToExport.map(e => [e.email, e.source, e.verified ? 'Yes' : 'No', e.phone || '']);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const escaped = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      csvContent += escaped + '\n';
    });
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domain_insights_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportExcel = () => {
    if (extracted.length === 0) return toast.error('No data to export');
    const dataToExport = selected.length ? selected.map(idx => extracted[idx]) : extracted;
    const sheetData = dataToExport.map(e => ({
      Email: e.email,
      Source: e.source,
      Verified: e.verified ? 'Yes' : 'No',
      Phone: e.phone || ''
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DomainInsights');
    XLSX.writeFile(wb, `domain_insights_${Date.now()}.xlsx`);
    toast.success('Excel exported');
  };

  const toggleSelectAll = () => {
    if (selected.length === extracted.length) setSelected([]);
    else setSelected(extracted.map((_, idx) => idx));
  };

  const toggleSelect = (idx) => {
    if (selected.includes(idx)) setSelected(selected.filter(i => i !== idx));
    else setSelected([...selected, idx]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Domain Insights</h1>

      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Single URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={singleUrl}
              onChange={e => setSingleUrl(e.target.value)}
              className="w-full border rounded-xl p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bulk URLs (one per line)</label>
            <textarea
              rows="3"
              placeholder="https://site1.com\nhttps://site2.com"
              value={bulkUrls}
              onChange={e => setBulkUrls(e.target.value)}
              className="w-full border rounded-xl p-2"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deep} onChange={e => setDeep(e.target.checked)} />
            Deep crawl (max {maxPages} pages)
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={maxPages}
            onChange={e => setMaxPages(parseInt(e.target.value))}
            className="border rounded p-1 w-20"
          />
          <button
            onClick={handleExtract}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Extracting...' : 'Extract Emails'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {extracted.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow p-3 mb-6 flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg">Select All</button>
              <button onClick={saveSelectedToLeads} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg">💾 Save Selected to Leads</button>
              <button onClick={deleteSelected} className="bg-red-600 text-white px-3 py-1.5 rounded-lg">🗑️ Delete Selected</button>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-gray-600 text-white px-3 py-1.5 rounded-lg">📄 CSV</button>
              <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1.5 rounded-lg">📊 Excel</button>
            </div>
            <div className="text-sm">{selected.length} selected / {extracted.length} total</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Select</th>
                  <th className="text-left">Email</th>
                  <th>Source</th>
                  <th>Verified</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {extracted.map((lead, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.includes(idx)} onChange={() => toggleSelect(idx)} />
                    </td>
                    <td className="p-3 font-medium break-all">{lead.email}</td>
                    <td className="p-3 max-w-xs truncate">{lead.source}</td>
                    <td className="p-3">{lead.verified ? '✅ Yes' : '❌ No'}</td>
                    <td className="p-3">{lead.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DomainInsights;
