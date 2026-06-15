import { useState } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FaFacebook, FaLinkedin, FaInstagram, FaReddit, FaTiktok, FaSearch, FaDownload, FaSave, FaTrash, FaWhatsapp, FaEnvelope, FaEye, FaCheckSquare, FaSquare } from 'react-icons/fa';

const SocialInsights = () => {
  // State
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [searchType, setSearchType] = useState('url');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(10);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Platform configuration
  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'bg-blue-600', endpoint: '/social/facebook' },
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'bg-blue-800', endpoint: '/social/linkedin' },
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'bg-pink-600', endpoint: '/social/instagram' },
    { id: 'reddit', name: 'Reddit', icon: FaReddit, color: 'bg-orange-600', endpoint: '/social/reddit' },
    { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: 'bg-black', endpoint: '/social/tiktok' }
  ];

  const platformIcons = {
    facebook: FaFacebook,
    linkedin: FaLinkedin,
    instagram: FaInstagram,
    reddit: FaReddit,
    tiktok: FaTiktok
  };

  // Handle search
  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a URL, keyword, or location');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Searching ${activePlatform}...`);

    try {
      // Build request payload
      const payload = {
        platform: activePlatform,
        searchType,
        query: query.trim(),
        count,
        deepCrawl,
        verifiedOnly
      };

      // Call backend (SociaVault integration)
      const response = await api.post('/social/search', payload);
      const leads = response.data.results || [];

      // Add platform info to each lead
      const enrichedLeads = leads.map(lead => ({
        ...lead,
        platform: activePlatform,
        source: `${activePlatform}_insights`
      }));

      setResults(enrichedLeads);
      setSelectedLeads([]);
      setCurrentPage(1);
      toast.success(`Found ${leads.length} leads on ${activePlatform}`, { id: toastId });
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.error || 'Search failed. Please check your API key.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Save selected leads to database
  const saveToLeads = async () => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }

    const leadsToSave = results.filter((_, idx) => selectedLeads.includes(idx));
    setLoading(true);
    try {
      await api.post('/leads/bulk', { leads: leadsToSave });
      toast.success(`Saved ${leadsToSave.length} leads to database`);
      setSelectedLeads([]);
    } catch (error) {
      toast.error('Failed to save leads');
    } finally {
      setLoading(false);
    }
  };

  // Delete selected leads (from current results only)
  const deleteSelected = () => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }
    const newResults = results.filter((_, idx) => !selectedLeads.includes(idx));
    setResults(newResults);
    setSelectedLeads([]);
    toast.success(`${selectedLeads.length} leads removed from results`);
  };

  // Export to CSV
  const exportCSV = () => {
    if (filteredResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Name', 'Platform', 'Email', 'Phone', 'Website', 'Followers', 'Rating', 'Source URL'];
    const rows = filteredResults.map(r => [
      r.name || '',
      r.platform,
      r.email || '',
      r.phone || '',
      r.website || '',
      r.followers || 0,
      r.rating || 0,
      r.sourceUrl || ''
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const escaped = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      csvContent += escaped + '\n';
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social_insights_${activePlatform}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // Export to Excel
  const exportExcel = () => {
    if (filteredResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    const data = filteredResults.map(r => ({
      Name: r.name || '',
      Platform: r.platform,
      Email: r.email || '',
      Phone: r.phone || '',
      Website: r.website || '',
      Followers: r.followers || 0,
      Rating: r.rating || 0,
      'Source URL': r.sourceUrl || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SocialLeads');
    XLSX.writeFile(wb, `social_insights_${activePlatform}_${Date.now()}.xlsx`);
    toast.success('Excel exported');
  };

  // Individual actions
  const openWhatsApp = (phone) => {
    if (!phone) {
      toast.error('No phone number available');
      return;
    }
    const number = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const openEmail = (email) => {
    if (!email) {
      toast.error('No email available');
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredResults.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredResults.map((_, idx) => idx));
    }
  };

  const toggleSelect = (idx) => {
    if (selectedLeads.includes(idx)) {
      setSelectedLeads(selectedLeads.filter(i => i !== idx));
    } else {
      setSelectedLeads([...selectedLeads, idx]);
    }
  };

  // Pagination
  const filteredResults = results.filter(r => filterPlatform === 'all' || r.platform === filterPlatform);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentResults = filteredResults.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const PlatformIcon = platformIcons[activePlatform] || FaSearch;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Social Insights
      </h1>
      <p className="text-gray-500 mb-6">Professional social media intelligence for lead generation</p>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setActivePlatform(platform.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
              activePlatform === platform.id
                ? `${platform.color} text-white shadow-lg scale-105`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <platform.icon size={18} />
            <span className="font-medium">{platform.name}</span>
          </button>
        ))}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Search Type Toggle */}
        <div className="flex gap-4 mb-4">
          {['url', 'keyword', 'location'].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value={type}
                checked={searchType === type}
                onChange={() => setSearchType(type)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm font-medium capitalize">{type}</span>
            </label>
          ))}
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <PlatformIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter ${activePlatform} ${searchType}...`}
              className="w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Leads:</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="border rounded-lg p-2 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deepCrawl}
              onChange={(e) => setDeepCrawl(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Deep Crawl (Multiple Pages)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Verified Email Only</span>
          </label>

          {results.length > 0 && (
            <div className="ml-auto">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="border rounded-lg p-2 text-sm"
              >
                <option value="all">All Platforms</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <FaSearch size={18} />
          )}
          {loading ? 'Searching...' : 'Get Insights'}
        </button>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <>
          {/* Action Bar */}
          <div className="bg-white rounded-xl shadow p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleSelectAll}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              >
                {selectedLeads.length === filteredResults.length ? <FaCheckSquare size={14} /> : <FaSquare size={14} />}
                Select All
              </button>
              <button
                onClick={saveToLeads}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              >
                <FaSave size={14} /> Save to Leads
              </button>
              <button
                onClick={deleteSelected}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              >
                <FaTrash size={14} /> Delete
              </button>
              <button
                onClick={exportCSV}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              >
                <FaDownload size={14} /> CSV
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
              >
                <FaDownload size={14} /> Excel
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded-lg p-1 text-sm"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-500">
                {selectedLeads.length} selected / {filteredResults.length} total
              </span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 w-10">
                    <button onClick={toggleSelectAll}>
                      {selectedLeads.length === filteredResults.length ? <FaCheckSquare size={16} /> : <FaSquare size={16} />}
                    </button>
                  </th>
                  <th className="text-left p-3">Name</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Website</th>
                  <th className="p-3">Followers</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map((lead, idx) => {
                  const actualIdx = filteredResults.indexOf(lead);
                  return (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(actualIdx)}
                          onChange={() => toggleSelect(actualIdx)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3 font-medium">{lead.name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${platforms.find(p => p.id === lead.platform)?.color || 'bg-gray-100'} text-white`}>
                          {lead.platform}
                        </span>
                      </td>
                      <td className="p-3">{lead.email || '-'}</td>
                      <td className="p-3">{lead.phone || '-'}</td>
                      <td className="p-3">
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit
                          </a>
                        ) : '-'}
                      </td>
                      <td className="p-3">{lead.followers?.toLocaleString() || '-'}</td>
                      <td className="p-3">
                        {lead.rating ? `${lead.rating}★` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 items-center">
                          {lead.phone && (
                            <button onClick={() => openWhatsApp(lead.phone)} className="text-green-600 hover:text-green-800" title="WhatsApp">
                              <FaWhatsapp size={20} />
                            </button>
                          )}
                          {lead.email && (
                            <button onClick={() => openEmail(lead.email)} className="text-blue-600 hover:text-blue-800" title="Email">
                              <FaEnvelope size={20} />
                            </button>
                          )}
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800" title="Website">
                              <FaEye size={18} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
              >
                ◀ Prev
              </button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SocialInsights;
