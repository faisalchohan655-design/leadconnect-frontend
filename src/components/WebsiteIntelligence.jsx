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

  useEffect(() => { fetchLeads(); }, []);
  const fetchLeads = async () => { setLoading(true); try { const res = await api.get('/leads'); const withWebsite = res.data.filter(l=>l.website); setLeads(withWebsite); setFiltered(withWebsite); } catch(e){ toast.error('Failed'); } finally { setLoading(false); } };
  useEffect(() => { let r = leads; if(filters.search) r = r.filter(l=>l.name.toLowerCase().includes(filters.search.toLowerCase())); if(filters.city) r = r.filter(l=>l.address?.toLowerCase().includes(filters.city.toLowerCase())); if(filters.minRating>0) r = r.filter(l=>(l.rating||0)>=filters.minRating); setFiltered(r); setSelectedIds([]); }, [filters, leads]);

  const extractEmails = async () => {
    if(selectedIds.length===0) return toast.error('Select leads');
    setExtracting(true);
    try {
      const res = await api.post('/email/bulk-extract-from-leads', { leadIds: selectedIds });
      toast.success(`Extracted ${res.data.totalNewEmails} new emails`);
      fetchLeads();
    } catch(e){ toast.error('Extraction failed'); } finally { setExtracting(false); }
  };
  const handleDelete = async () => { if(!window.confirm(`Delete ${selectedIds.length} leads?`)) return; for(const id of selectedIds) await api.delete(`/leads/${id}`); toast.success('Deleted'); fetchLeads(); setSelectedIds([]); };
  const exportExcel = () => { const data = filtered.map(l=>({Name:l.name,Phone:l.phone,Website:l.website,Address:l.address,Rating:l.rating})); const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Leads'); XLSX.writeFile(wb, `leads_${Date.now()}.xlsx`); toast.success('Exported'); };
  const toggleSelectAll = () => { if(selectedIds.length===filtered.length) setSelectedIds([]); else setSelectedIds(filtered.map(l=>l._id)); };
  const toggleSelect = (id) => { if(selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i=>i!==id)); else setSelectedIds([...selectedIds, id]); };
  if(loading) return <div>Loading leads...</div>;

  return (<div className="p-6"><h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">Website Intelligence</h1>
    <div className="flex flex-wrap gap-4 mb-4"><input placeholder="Search name" onChange={e=>setFilters({...filters,search:e.target.value})} className="border rounded-lg p-2 flex-1"/><input placeholder="City" onChange={e=>setFilters({...filters,city:e.target.value})} className="border rounded-lg p-2 flex-1"/><input type="number" placeholder="Min rating" onChange={e=>setFilters({...filters,minRating:parseFloat(e.target.value)})} className="border rounded-lg p-2 w-32"/></div>
    <div className="flex gap-3 mb-6"><button onClick={toggleSelectAll} className="bg-gray-600 text-white px-3 py-1 rounded">Select All</button><button onClick={extractEmails} disabled={extracting} className="bg-blue-600 text-white px-3 py-1 rounded">{extracting?'Extracting...':'Extract Emails'}</button><button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button><button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded">Export Excel</button></div>
    <div className="overflow-x-auto"><table className="min-w-full bg-white rounded-xl shadow"><thead className="bg-gray-100"><tr><th className="p-3">Select</th><th>Name</th><th>Website</th><th>Extracted Email</th><th>Rating</th></tr></thead><tbody>{filtered.map(lead=>(<tr key={lead._id} className="border-t"><td className="p-3"><input type="checkbox" checked={selectedIds.includes(lead._id)} onChange={()=>toggleSelect(lead._id)}/><\/td><td className="p-3">{lead.name}<\/td><td className="p-3"><a href={lead.website} target="_blank" className="text-blue-600 truncate max-w-xs block">{lead.website}<\/a><\/td><td className="p-3">{lead.email||'❌ Not extracted'}<\/td><td className="p-3">{lead.rating||'-'}<\/td><\/tr>))}</tbody>获得</div></div>);
};
export default WebsiteIntelligence;
