import { useState } from 'react';
import api from '../api';
import { Search, Loader2, MapPin, Hash, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const LocalBusinessInsights = () => {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || !city.trim()) return toast.error('Enter business type and city');
    if (count < 1 || count > 50) return toast.error('Count 1-50');
    setLoading(true);
    const toastId = toast.loading('Fetching business insights...');
    try {
      const res = await api.post('/scrape', { keyword, city, count, filters: { requireEmail, requirePhone, requireWebsite } });
      toast.success(res.data.message, { id: toastId });
      setKeyword(''); setCity(''); setCount(10);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed', { id: toastId });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Local Business Insights</h1>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium"><Building size={16} className="inline mr-1"/> Business Type / Keyword</label>
            <input type="text" value={keyword} onChange={e=>setKeyword(e.target.value)} className="w-full border rounded-xl p-3" required/></div>
          <div><label className="block text-sm font-medium"><MapPin size={16} className="inline mr-1"/> City / Location</label>
            <input type="text" value={city} onChange={e=>setCity(e.target.value)} className="w-full border rounded-xl p-3" required/></div>
          <div><label className="block text-sm font-medium"><Hash size={16} className="inline mr-1"/> Number of Results (max 50)</label>
            <input type="number" min="1" max="50" value={count} onChange={e=>setCount(parseInt(e.target.value))} className="w-full border rounded-xl p-3" required/></div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Quality Filters</h3>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={()=>setRequireEmail(!requireEmail)} className={`px-4 py-2 rounded-lg ${requireEmail ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>📧 Must have Email</button>
              <button type="button" onClick={()=>setRequirePhone(!requirePhone)} className={`px-4 py-2 rounded-lg ${requirePhone ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>📞 Must have Phone</button>
              <button type="button" onClick={()=>setRequireWebsite(!requireWebsite)} className={`px-4 py-2 rounded-lg ${requireWebsite ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>🌐 Must have Website</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin"/> : <Search/>}{loading ? 'Fetching...' : 'Get Insights'}</button>
        </form>
      </div>
    </div>
  );
};
export default LocalBusinessInsights;
