import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Users, Settings, ChevronLeft, ChevronRight, Zap, Facebook, Mail, Globe, MessageCircle, Briefcase } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const items = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/local-business-insights', name: 'Local Business Insights', icon: Map },
    { path: '/social-insights', name: 'Social Insights', icon: Facebook },
    { path: '/domain-insights', name: 'Domain Insights', icon: Mail },
    { path: '/website-intelligence', name: 'Website Intelligence', icon: Globe },
    { path: '/campaign-outreach', name: 'Campaign Outreach', icon: MessageCircle },
    { path: '/conversation-inbox', name: 'Conversation Inbox', icon: Users },
    { path: '/crm-pipeline', name: 'CRM Pipeline', icon: Briefcase },
    { path: '/whatsapp-outreach', name: 'WhatsApp Outreach', icon: FaWhatsapp },
    { path: '/settings', name: 'Settings', icon: Settings }
  ];
  return (
    <div className={`relative transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-indigo-900 to-purple-900 text-white shadow-2xl`}>
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 bg-white text-indigo-900 rounded-full p-1 shadow-md">{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
      <div className="p-5 text-2xl font-bold border-b border-indigo-800 flex items-center justify-center gap-2"><Zap className="w-6 h-6" />{!collapsed && <span>LeadConnect</span>}{collapsed && <span>LC</span>}</div>
      <nav className="mt-8">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-lg ${isActive ? 'bg-indigo-600 shadow-md' : 'hover:bg-indigo-800'} ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={20} />{!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
export default Sidebar;
