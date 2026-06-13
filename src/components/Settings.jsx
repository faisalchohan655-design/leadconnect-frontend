const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <p className="text-gray-600">API Endpoint: <code className="bg-gray-100 p-1 rounded">{import.meta.env.VITE_API_URL}</code></p>
        <p className="text-gray-500 mt-4">Subscription and team management coming in Phase 2.</p>
      </div>
    </div>
  );
};
export default Settings;
