import React from 'react';
import RiskMatrix from './RiskMatrix';
import VendorCard from './VendorCard';

// Main dashboard component that shows the risk matrix and vendor cards
// Vendors are sorted with flagged vendors (OSINT warnings, ransomware, etc.) at the top
export default function Dashboard({ vendors = [], onVendorClick }) {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top section with the risk matrix visualization */}
      <div className="flex-1 min-h-[500px] flex flex-col items-center mb-24">
        <div className="mb-4 pl-12 w-full max-w-xl">
          {/* Subtitle uses Poppins Thin in all caps */}
          <h3 className="text-lg font-bold text-gray-700 font-poppins-thin">INHERITED RISK LANDSCAPE</h3>
          <p className="text-sm text-gray-500">
            Visualizing Inherent Risk vs. Preparedness. 
            <span className="ml-2 text-blue-600 font-medium">Blue = High Vulnerability</span>
          </p>
        </div>
        {/* The 5x5 risk matrix with vendor dots */}
        {/* pb-20 ensures space for IMPACT label (40px below matrix) + text height + margin */}
        <div className="flex-1 flex items-center justify-center pb-20 w-full">
          <RiskMatrix vendors={vendors} />
        </div>
      </div>

      {/* All vendors section - flagged vendors appear at top due to sorting */}
      <div className="h-auto pb-8 mt-16">
        {/* Subtitle uses Poppins Thin in all caps */}
        {/* Positioned to start below IMPACT axis label (which is 40px below matrix + padding) */}
        <h3 className="text-lg font-bold text-gray-700 mb-4 font-poppins-thin pl-20">
          REGISTERED THIRD PARTIES
        </h3>
        {/* Grid of vendor cards - sorted with flagged vendors first */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-20">
          {vendors.map(v => (
            <VendorCard key={v.id} vendor={v} onClick={onVendorClick} />
          ))}
        </div>
        {/* Empty state if no vendors exist */}
        {vendors.length === 0 && (
          <div className="text-center py-12 text-gray-500 mt-8 pl-20">
            <p>No vendors registered yet.</p>
            <p className="text-sm mt-2">Click the + icon to add your first vendor assessment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

