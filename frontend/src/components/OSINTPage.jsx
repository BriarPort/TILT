import React, { useState } from 'react';
import { Search, RefreshCw, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import * as api from '../api';

export default function OSINTPage({ vendors, onVendorsChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState({});

  // Scan a vendor using their stored OSINT URLs
  const handleScan = async (vendorId) => {
    setScanning(prev => ({ ...prev, [vendorId]: true }));
    
    try {
      // Pass vendor ID to the backend which will use stored osint_urls
      const result = await api.scanOSINT(vendorId);
      
      if (result.success) {
        // Reload vendors to get updated OSINT warnings
        onVendorsChange();
        
        if (result.results && result.results.warnings && result.results.warnings.length > 0) {
          // Show success message with warning count
          console.log(`Scan complete. Found ${result.results.warnings.length} warnings.`);
        } else {
          console.log('Scan complete. No warnings found.');
        }
      } else {
        alert('Failed to scan: ' + (result.error || result.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error scanning OSINT:', error);
      alert('Failed to scan: ' + error.message);
    } finally {
      setScanning(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col max-w-6xl mx-auto">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
        <h2 className="text-2xl font-bold text-gray-800 font-poppins-thin">OSINT SECURITY CHECKS</h2>
        <p className="text-gray-500 text-sm">Open Source Intelligence gathering for vendor security posture</p>
      </div>

      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredVendors.map(vendor => {
            const hasWarnings = vendor.osint_warnings && vendor.osint_warnings.length > 0;
            
            return (
              <div 
                key={vendor.id} 
                className={`p-4 border rounded-lg ${
                  hasWarnings ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{vendor.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Status: {vendor.status}</p>
                  {vendor.osint_urls?.primary_domain && (
                    <p className="text-xs text-gray-400 mt-1">Domain: {vendor.osint_urls.primary_domain}</p>
                  )}
                </div>
                  <button
                    onClick={() => handleScan(vendor.id)}
                    disabled={scanning[vendor.id] || !vendor.osint_urls?.primary_domain}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={!vendor.osint_urls?.primary_domain ? 'No primary domain set. Please edit vendor to add OSINT URLs.' : 'Scan vendor using stored OSINT URLs'}
                  >
                    {scanning[vendor.id] ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        Scan Now
                      </>
                    )}
                  </button>
                  {!vendor.osint_urls?.primary_domain && (
                    <p className="text-xs text-amber-600 mt-1">No domain configured</p>
                  )}
                </div>

                {hasWarnings ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <AlertTriangle size={16} />
                      <span>OSINT Warnings Detected ({vendor.osint_warnings.length})</span>
                    </div>
                    {vendor.osint_warnings.map((warning, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-800">{warning.type.toUpperCase()}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            warning.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            warning.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {warning.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{warning.message}</p>
                        <p className="text-xs text-gray-500 mt-1">Source: {warning.source}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={16} />
                    <span className="text-sm">No OSINT warnings detected</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No vendors found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

