import { Clock } from 'lucide-react';

const ComingSoon = ({ feature, description }) => (
  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-indigo-200 p-10 text-center">
    <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
      <Clock className="w-10 h-10 text-indigo-600" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">{feature}</h3>
    <p className="text-gray-500 max-w-md mx-auto">{description || 'Part of our upcoming Phase 2/3. Upgrade to Pro for early access.'}</p>
    <div className="mt-4 inline-flex items-center gap-1 text-indigo-600 text-sm font-medium"><Clock size={14} /> Coming soon</div>
  </div>
);
export default ComingSoon;
