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
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!singleUrl && !bulkUrls) return toast.error('Enter URL(s)');
    setLoading(true);
    const toastId = toast.loading('Extracting emails...');
    try {
      let response;
      if (bulkUrls) {
        const urls = bulkUrls.split('\n').filter(u=>u.trim());
        response = await api.post('/email/bulk-extract', { urls, deep, maxPagesPerUrl: maxPages });
      } else {
        response = await api.post('/email/extract', { url: singleUrl, deep, maxPages });
      }
      setExtracted(response.data.leads || []);
      toast.success(`Found ${response.data.leads?.length || 0} emails`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed', { id: toastId });
    } finally { setLoading(false); }
  };

  const saveToLeads = async () => {
    if (extracted.length === 0) return toast.error('No emails to save');
    try {
      await api.post('/email/save-leads', { leads: extracted });
      toast.success(`Saved ${extracted.length} leads`);
      setExtracted([]);
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(extracted.map(e=>({Email:e.email, Source:e.source, Verified:e.verified})));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Emails'); XLSX.writeFile(wb, `emails_${Date.now()}.xlsx`);
    toast.success('Exported');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Domain Insights</h1>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Single URL" value={singleUrl} onChange={e=>setSingleUrl(e.target.value)} className="border rounded-xl p-2"/>
          <textarea placeholder="Bulk URLs (one per line)" rows="2" value={bulkUrls} onChange={e=>setBulkUrls(e.target.value)} className="border rounded-xl p-2"/>
        </div>
        <div className="flex gap-4 mt-4 items-center">
          <label className="flex items-center gap-2"><input type="checkbox" checked={deep} onChange={()=>setDeep(!deep)}/> Deep crawl (max {maxPages} pages)</label>
          <input type="number" min="1" max="20" value={maxPages} onChange={e=>setMaxPages(parseInt(e.target.value))} className="border rounded p-1 w-20"/>
          <button onClick={handleExtract} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-xl">{loading ? 'Extracting...' : 'Extract Emails'}</button>
        </div>
        {extracted.length > 0 && (
          <div className="mt-6"><button onClick={saveToLeads} className="bg-blue-600 text-white px-3 py-1 rounded">Save to Leads</button><button onClick={exportExcel} className="ml-2 bg-green-600 text-white px-3 py-1 rounded">Export Excel</button><div className="mt-3 text-sm">Found {extracted.length} emails</div><ul className="max-h-64 overflow-auto">{extracted.map((e,i)=><li key={i}>{e.email} {e.verified?'✅':''} <span className="text-xs text-gray-400">{e.source}</span></li>)}</ul></div>
        )}
      </div>
    </div>
  );
};
export default DomainInsights;
