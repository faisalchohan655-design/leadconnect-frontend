import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LocalBusinessInsights from './components/LocalBusinessInsights';
import SocialInsights from './components/SocialInsights';
import DomainInsights from './components/DomainInsights';
import WebsiteIntelligence from './components/WebsiteIntelligence';
import CampaignOutreach from './components/CampaignOutreach';
import ConversationInbox from './components/ConversationInbox';
import CRMPipeline from './components/CRMPipeline';
import WhatsAppOutreach from './components/WhatsAppOutreach';
import Settings from './components/Settings';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/local-business-insights" element={<LocalBusinessInsights />} />
            <Route path="/social-insights" element={<SocialInsights />} />
            <Route path="/domain-insights" element={<DomainInsights />} />
            <Route path="/website-intelligence" element={<WebsiteIntelligence />} />
            <Route path="/campaign-outreach" element={<CampaignOutreach />} />
            <Route path="/conversation-inbox" element={<ConversationInbox />} />
            <Route path="/crm-pipeline" element={<CRMPipeline />} />
            <Route path="/whatsapp-outreach" element={<WhatsAppOutreach />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </div>
    </BrowserRouter>
  );
}

export default App;
