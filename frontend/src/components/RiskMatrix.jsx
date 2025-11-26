import React, { useState } from 'react';

// Individual dot on the risk matrix representing one vendor
// Color changes from black (0% vulnerable) to blue (100% vulnerable) based on vulnerability score
const RiskDot = ({ x, y, vulnerability, label, onHover, onLeave }) => {
  // Calculate blue value for RGB color (0-255 based on vulnerability percentage)
  const blueVal = Math.floor((vulnerability / 100) * 255);
  const color = `rgb(0, 0, ${blueVal})`;
  // Position on the matrix based on impact (x-axis) and likelihood (y-axis)
  const left = `${(x / 5) * 100}%`;
  const bottom = `${(y / 5) * 100}%`;

  return (
    <div 
      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 translate-y-1/2 transition-all duration-500 hover:scale-125 hover:z-50 cursor-pointer"
      style={{ left, bottom, backgroundColor: color }}
      onMouseEnter={() => onHover({ x, y, label })}
      onMouseLeave={onLeave}
    />
  );
};

// The 5x5 risk matrix visualization
// Shows vendors positioned by impact (x) and likelihood (y)
// Color indicates vulnerability level (black = secure, blue = vulnerable)
export default function RiskMatrix({ vendors = [] }) {
  const [hoveredDot, setHoveredDot] = useState(null);

  const handleDotHover = (dotInfo) => {
    setHoveredDot(dotInfo);
  };

  const handleDotLeave = () => {
    setHoveredDot(null);
  };

  // Calculate tooltip position based on dot location
  const getTooltipPosition = () => {
    if (!hoveredDot) return null;
    
    const { x, y } = hoveredDot;
    const isTopHalf = y > 2.5;
    const isLeftEdge = x < 1;
    const isRightEdge = x > 4;
    const isBottomEdge = y < 1;
    const isTopEdge = y > 4;
    
    // Calculate position as percentage of the matrix container
    const leftPercent = (x / 5) * 100;
    const bottomPercent = (y / 5) * 100;
    
    // Horizontal positioning: adjust for edges to keep tooltip close to dot
    let leftOffset = '-50%'; // Default center alignment
    if (isLeftEdge) {
      leftOffset = '0%'; // Align to left edge of tooltip at dot position
    } else if (isRightEdge) {
      leftOffset = '-100%'; // Align to right edge of tooltip at dot position
    }
    
    // Vertical positioning: adjust for edges to keep tooltip close to dot
    let verticalOffset = isTopHalf ? -4 : 4; // Default offset in percentage
    if (isTopEdge) {
      verticalOffset = -2; // Closer to dot when at top edge
    } else if (isBottomEdge) {
      verticalOffset = 2; // Closer to dot when at bottom edge
    }
    
    return {
      left: `${leftPercent}%`,
      bottom: `${100 - bottomPercent + verticalOffset}%`,
      transform: `translateX(${leftOffset})`
    };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <div className="relative w-full aspect-square max-w-xl mx-auto bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-12 overflow-visible">
      {/* Y-axis label for likelihood - positioned outside the graph but visible */}
      <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-gray-400 font-bold tracking-widest text-sm font-poppins-thin whitespace-nowrap">LIKELIHOOD</div>
      {/* X-axis label for impact */}
      <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-gray-400 font-bold tracking-widest text-sm font-poppins-thin">IMPACT</div>
      {/* Vulnerability scale bar on the left showing color gradient */}
      <div className="absolute -left-16 top-0 bottom-0 w-4 flex flex-col items-center">
        {/* 0% label above the gradient */}
        <span className="text-[10px] text-gray-800 font-bold mb-1">0%</span>
        {/* Gradient bar */}
        <div className="flex-1 w-4 rounded-full border border-gray-300 overflow-hidden relative flex flex-col justify-center items-center">
          {/* Gradient from black (0% vulnerable) to blue (100% vulnerable) */}
          <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, black, #0066FF)' }} />
          <span className="relative z-10 text-[10px] text-white font-bold -rotate-90 whitespace-nowrap font-poppins-thin">VULNERABILITY</span>
        </div>
        {/* 100% label below the gradient */}
        <span className="text-[10px] text-gray-800 font-bold mt-1">100%</span>
      </div>
      {/* The actual matrix with gradient background */}
      <div 
        className="w-full h-full rounded-lg relative overflow-hidden"
        style={{
          // Gradient zones: green (low risk), yellow (medium), orange (high), red (critical)
          background: `
            radial-gradient(circle at bottom left, #dcfce7 0%, transparent 40%),
            radial-gradient(circle at bottom right, #fef9c3 0%, transparent 40%),
            radial-gradient(circle at top left, #ffedd5 0%, transparent 40%),
            radial-gradient(circle at top right, #fee2e2 0%, transparent 50%),
            linear-gradient(to top right, #22c55e, #eab308, #f97316, #ef4444)
          `,
          opacity: 0.8
        }}
      >
        {/* Grid lines dividing the 5x5 matrix */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
          {[...Array(25)].map((_, i) => <div key={i} className="border-r border-t border-white/20"></div>)}
        </div>
        {/* Render a dot for each vendor */}
        {vendors.map((v) => (
          <RiskDot 
            key={v.id} 
            x={v.impact} 
            y={v.likelihood} 
            vulnerability={v.vulnerability || 50} 
            label={v.name}
            onHover={handleDotHover}
            onLeave={handleDotLeave}
          />
        ))}
      </div>
      {/* Tooltip rendered outside the overflow-hidden container */}
      {hoveredDot && tooltipPos && (
        <div 
          className="absolute px-2 py-1 bg-black text-white text-xs font-bold rounded whitespace-nowrap shadow-xl z-50 pointer-events-none"
          style={{
            left: tooltipPos.left,
            bottom: tooltipPos.bottom,
            transform: tooltipPos.transform
          }}
        >
          {hoveredDot.label}
        </div>
      )}
    </div>
  );
}

