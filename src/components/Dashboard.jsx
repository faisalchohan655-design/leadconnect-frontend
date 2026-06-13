import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api';
import { Users, Star, Phone, Globe, Award, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, withPhone: 0, withWebsite: 0, highRated: 0 });

  useEffect(() => {
    api.get('/leads')
      .then(res => {
        setLeads(res.data);
        const total = res.data.length;
        const avgRating = total ? (res.data.reduce((s, l) => s + (l.rating || 0), 0) / total).toFixed(1) : 0;
        const withPhone = res.data.filter(l => l.phone && l.phone.trim()).length;
        const withWebsite = res.data.filter(l => l.website && l.website.trim()).length;
        const highRated = res.data.filter(l => (l.rating || 0) >= 4).length;
        setStats({ total, avgRating, withPhone, withWebsite, highRated });
      })
      .catch(console.error);
  }, []);

  // Last 7 days data
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0,10);
  });
  const chartData = last7Days.map(date => ({
    date: date.slice(5),
    count: leads.filter(l => l.createdAt?.split('T')[0] === date).length
  }));

  const pieData = [
    { name: 'With Phone', value: stats.withPhone },
    { name: 'No Phone', value: stats.total - stats.withPhone }
  ];
  const COLORS = ['#4f46e5', '#9ca3af'];

  const ratingData = [
    { rating: '1★', count: leads.filter(l => Math.floor(l.rating || 0) === 1).length },
    { rating: '2★', count: leads.filter(l => Math.floor(l.rating || 0) === 2).length },
    { rating: '3★', count: leads.filter(l => Math.floor(l.rating || 0) === 3).length },
    { rating: '4★', count: leads.filter(l => Math.floor(l.rating || 0) === 4).length },
    { rating: '5★', count: leads.filter(l => Math.floor(l.rating || 0) === 5).length },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Leads</p><p className="text-3xl font-bold text-gray-800">{stats.total}</p></div><div className="bg-indigo-100 p-3 rounded-full"><Users className="w-6 h-6 text-indigo-600" /></div></div>
        <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between"><div><p className="text-gray-500 text-sm">Avg Rating</p><p className="text-3xl font-bold text-gray-800">{stats.avgRating}★</p></div><div className="bg-yellow-100 p-3 rounded-full"><Star className="w-6 h-6 text-yellow-600" /></div></div>
        <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between"><div><p className="text-gray-500 text-sm">With Phone</p><p className="text-3xl font-bold text-gray-800">{stats.withPhone}</p></div><div className="bg-green-100 p-3 rounded-full"><Phone className="w-6 h-6 text-green-600" /></div></div>
        <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between"><div><p className="text-gray-500 text-sm">With Website</p><p className="text-3xl font-bold text-gray-800">{stats.withWebsite}</p></div><div className="bg-blue-100 p-3 rounded-full"><Globe className="w-6 h-6 text-blue-600" /></div></div>
        <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between"><div><p className="text-gray-500 text-sm">4+ Stars</p><p className="text-3xl font-bold text-gray-800">{stats.highRated}</p></div><div className="bg-purple-100 p-3 rounded-full"><Award className="w-6 h-6 text-purple-600" /></div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-lg"><h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Leads (Last 7 Days)</h2><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#4f46e5" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-white p-5 rounded-2xl shadow-lg"><h2 className="text-xl font-semibold mb-4">Phone Availability</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label><Cell fill={COLORS[0]} /><Cell fill={COLORS[1]} /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        <div className="bg-white p-5 rounded-2xl shadow-lg lg:col-span-2"><h2 className="text-xl font-semibold mb-4">Rating Distribution</h2><ResponsiveContainer width="100%" height={250}><BarChart data={ratingData}><XAxis dataKey="rating" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#f59e0b" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};

export default Dashboard;

