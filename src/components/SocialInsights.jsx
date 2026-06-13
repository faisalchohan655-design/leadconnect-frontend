import { useState } from 'react';
import api from '../api';
import { FaFacebook, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SocialInsights = () => {
  const [pageUrl, setPageUrl] = useState('');
  const [requireEmail, setRequireEmail] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pageUrl.trim()) return toast.error('Enter Facebook Page URL');
    setLoading(true);
    const toastId = toast.loading('Fetching page insights...');
    try {
      const res = await api.post('/facebook', { pageUrl, filters: { requireEmail, requirePhone, requireWebsite } });
      toast.success(res.data.message, { id: toastId });
      setPageUrl('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed', { id: toastId });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">Social Insights</h1>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium"><FaFacebook className="inline mr-1"/> Facebook Page URL</label>
            <input type="text" value={pageUrl} onChange={e=>setPageUrl(e.target.value)} className="w-full border rounded-xl p-3" placeholder="https://facebook.com/example" required/></div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Quality Filters</h3>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={()=>setRequireEmail(!requireEmail)} className={`px-4 py-2 rounded-lg ${requireEmail ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>📧 Must have Email</button>
              <button type="button" onClick={()=>setRequirePhone(!requirePhone)} className={`px-4 py-2 rounded-lg ${requirePhone ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>📞 Must have Phone</button>
              <button type="button" onClick={()=>setRequireWebsite(!requireWebsite)} className={`px-4 py-2 rounded-lg ${requireWebsite ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>🌐 Must have Website</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl flex items-center justify-center gap-2">{loading ? '⏳' : <FaSearch/>} {loading ? 'Fetching...' : 'Get Page Insights'}</button>
        </form>
      </div>
    </div>
  );
};
export default SocialInsights;
