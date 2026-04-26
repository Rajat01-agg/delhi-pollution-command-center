import React, { useState } from 'react';
import { 
  Droplets, 
  Car, 
  Hammer, 
  Users, 
  Zap, 
  X, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { PRIORITY_WARDS } from '../constants';

const ActionsPanel: React.FC = () => {
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDeployClick = () => {
    if (selectedWard) {
      setShowModal(true);
    } else {
      alert("Please select a ward first.");
    }
  };

  const confirmDeployment = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setShowModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const getWardDetails = () => {
    return PRIORITY_WARDS.find(w => w.name.toLowerCase().includes(selectedWard)) || 
           { name: 'Selected Ward', currentAQI: 350, aqiStatus: 'Very Poor', zone: 'Delhi' };
  };

  const wardDetails = getWardDetails();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-[60] flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-bold">Deployment Successful</p>
            <p className="text-sm">Action ID #ACT-2024-889 logged.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-serif-heading">
            Quick Actions
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Select ward to enable actions
          </span>
        </div>
        
        {/* Ward Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Ward
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 pr-10 shadow-sm"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              <option value="" className="text-gray-500">Select ward...</option>
              <option value="rohini">Rohini (AQI: 412 - Critical)</option>
              <option value="dwarka">Dwarka (AQI: 327 - High)</option>
              <option value="najafgarh">Najafgarh (AQI: 298 - Moderate)</option>
              <option value="anand vihar">Anand Vihar (AQI: 425 - Severe)</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          
          {/* Deploy Sprinklers */}
          <button className="p-4 border-2 border-blue-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900">Deploy Sprinklers</span>
            </div>
            <p className="text-xs text-gray-600">
              Activate water sprinklers for dust suppression
            </p>
          </button>
          
          {/* Traffic Control */}
          <button className="p-4 border-2 border-orange-100 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Car className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-900">Traffic Control</span>
            </div>
            <p className="text-xs text-gray-600">
              Deploy traffic police at key junctions
            </p>
          </button>
          
          {/* Construction Ban */}
          <button className="p-4 border-2 border-red-100 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Hammer className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-semibold text-gray-900">Construction Ban</span>
            </div>
            <p className="text-xs text-gray-600">
              Halt all construction activities
            </p>
          </button>
          
          {/* Air Quality Teams */}
          <button className="p-4 border-2 border-green-100 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-semibold text-gray-900">Dispatch Teams</span>
            </div>
            <p className="text-xs text-gray-600">
              Send field inspection teams
            </p>
          </button>
          
        </div>
        
        {/* Custom Action */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Action
          </label>
          <textarea 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            rows={3}
            placeholder="Describe custom intervention (e.g., Deploy 20 road sweepers on Ring Road)..."
          ></textarea>
        </div>
        
        {/* Deploy Button */}
        <button 
          onClick={handleDeployClick}
          className={`w-full py-3 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 shadow-sm transition-all
            ${selectedWard 
              ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md' 
              : 'bg-gray-400 cursor-not-allowed'}`}
          disabled={!selectedWard}
        >
          <Zap className="h-5 w-5 fill-current" />
          Deploy Actions Now
        </button>
        
        {/* Impact Tracking Toggle */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Track Impact</p>
            <p className="text-xs text-gray-500">
              Monitor AQI changes after deployment
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
      </div>

      {/* ACTION DEPLOYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden">
            
            {/* Loading Overlay */}
            {isDeploying && (
              <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-800">Processing Deployment...</p>
                <p className="text-sm text-gray-500">Contacting field units</p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Action Deployment
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" /> Deployment Summary
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>Target Ward:</strong> {wardDetails.name} ({wardDetails.zone})</p>
                <p><strong>Current AQI:</strong> <span className="text-red-600 font-bold">{wardDetails.currentAQI} ({wardDetails.aqiStatus})</span></p>
                <p><strong>Selected Actions:</strong></p>
                <ul className="list-disc list-inside ml-4 text-gray-600">
                  <li>Deploy 15 water sprinklers</li>
                  <li>Traffic control at 3 major junctions</li>
                </ul>
                <div className="mt-3 pt-2 border-t border-blue-200 flex justify-between font-medium">
                  <span>Estimated Cost:</span>
                  <span>₹45,000</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Expected Impact:</span>
                  <span className="text-green-600">-20 to -30 AQI (4 hrs)</span>
                </div>
              </div>
            </div>

            {/* Notification Options */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Notifications</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-600">Notify field teams via SMS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-600">Auto-post to social media</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-600">Track impact (monitor AQI for 24 hours)</span>
                </label>
              </div>
            </div>

            {/* Authorization */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authorization Code <span className="text-gray-400 font-normal">(for audit trail)</span>
              </label>
              <input 
                type="password"
                placeholder="Enter your authorization code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeployment}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Zap className="h-4 w-4 fill-current" />
                Confirm & Deploy
              </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 leading-snug">
                This action will be logged for audit purposes. Field teams will be 
                notified immediately and citizens will receive alerts via enabled channels.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPanel;