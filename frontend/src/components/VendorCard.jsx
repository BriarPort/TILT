import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

// Vendor card component
// Displays vendor info with OSINT warning indicators
// The border colour changes based on OSINT severity (red for ransomware, yellow for SSL/DMARC)
export default function VendorCard({ vendor, onClick }) {
  // Helper function to extract OSINT results from vendor object
  // This is inside the component because it's only used here
  // TO FIX: If we start using this logic elsewhere, move it to a utility
  function getOSINTResults() {
    if (vendor.osintResults) {
      return vendor.osintResults;
    }
    
    // Parse from warnings if osintResults doesn't exist
    // This is a bit hacky but works for now
    if (vendor.osint_warnings && Array.isArray(vendor.osint_warnings)) {
      const ransomwareWarning = vendor.osint_warnings.find(w => w.type === 'ransomware');
      const sslWarning = vendor.osint_warnings.find(w => w.type === 'ssl');
      const dmarcWarning = vendor.osint_warnings.find(w => w.type === 'dmarc');
      
      return {
        ransomware: ransomwareWarning ? true : null,
        ssl: sslWarning ? (sslWarning.message.includes('expired') ? 'F' : sslWarning.severity === 'High' ? 'C' : 'B') : null,
        dmarc: dmarcWarning ? false : null
      };
    }
    
    return { ransomware: null, ssl: null, dmarc: null };
  }
  
  const osint = getOSINTResults();
  const hasWarnings = vendor.osint_warnings && vendor.osint_warnings.length > 0;
  const hasRansomware = osint.ransomware === true;
  const hasSSLWarning = osint.ssl === 'F' || osint.ssl === 'C';
  const hasDMARCWarning = osint.dmarc === false;
  
  // Determine border colour based on OSINT severity
  // Red = ransomware found (critical), yellow = SSL/DMARC issues (warning)
  let borderClass = 'border-gray-100';
  if (hasRansomware) {
    borderClass = 'border-red-500 border-2';
  } else if (hasSSLWarning || hasDMARCWarning) {
    borderClass = 'border-yellow-400 border-2';
  } else if (hasWarnings) {
    borderClass = 'border-red-300 border-2';
  }
  
  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow h-full cursor-pointer ${borderClass}`}
      onClick={() => onClick && onClick(vendor)}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-800 leading-tight">{vendor.name}</h3>
            {/* Status badge with colour coding */}
            <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
              vendor.status === 'Active' ? 'text-green-600' : 
              vendor.status === 'New' ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {vendor.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* OSINT indicators: red pulsing dot for ransomware, yellow for SSL/DMARC */}
            {hasRansomware && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" title="Ransomware Leak Found - Critical Risk" />
            )}
            {(hasSSLWarning || hasDMARCWarning) && !hasRansomware && (
              <div className="w-3 h-3 bg-yellow-400 rounded-full" title="SSL/DMARC Warning" />
            )}
            {/* Vulnerability indicator: black to blue based on vulnerability percentage */}
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: `rgb(0, 0, ${Math.floor((vendor.vulnerability / 100) * 255)})`}} 
              title={`Vulnerability: ${vendor.vulnerability}%`}
            />
          </div>
        </div>
        
        {/* Show OSINT warnings if they exist and not acknowledged */}
        {hasWarnings && !vendor.osint_acknowledged && (
          <div className={`mb-2 p-2 border rounded ${
            hasRansomware ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex items-center gap-1 text-xs font-bold ${
              hasRansomware ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <AlertTriangle size={12} />
              <span>OSINT WARNINGS: {vendor.osint_warnings.length}</span>
            </div>
            {/* Show first 2 warnings to keep the card from getting too tall */}
            {vendor.osint_warnings.slice(0, 2).map((warning, idx) => (
              <div key={idx} className={`text-xs mt-1 ml-4 ${
                hasRansomware ? 'text-red-600' : 'text-yellow-600'
              }`}>
                • {warning.message}
              </div>
            ))}
          </div>
        )}
        {/* Show brief indicator if acknowledged */}
        {hasWarnings && vendor.osint_acknowledged && (
          <div className={`mb-2 p-1.5 border rounded ${
            hasRansomware ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex items-center gap-1 text-xs ${
              hasRansomware ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <AlertTriangle size={10} />
              <span>OSINT warnings acknowledged</span>
            </div>
          </div>
        )}
        
        {/* Weakness and strength sections */}
        <div className="space-y-2 text-sm mt-2">
          {vendor.weakness && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="leading-tight text-xs">{vendor.weakness}</span>
            </div>
          )}
          {vendor.strength && (
            <div className="flex items-start gap-2 text-green-700 bg-green-50 p-2 rounded">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span className="leading-tight text-xs">{vendor.strength}</span>
            </div>
          )}
        </div>
      </div>
      {/* Footer with impact and likelihood scores */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Imp: {vendor.impact?.toFixed(1) || 'N/A'}</span>
        <span>Lik: {vendor.likelihood?.toFixed(1) || 'N/A'}</span>
      </div>
    </div>
  );
}
