import React from 'react';

const EquityCurve = () => {
  // Hardcoded 30-day mock data points trending up to 51926.21
  const data = [
    50000, 50120, 49950, 50300, 50100, 50450, 50600, 50200, 50800, 50750,
    51100, 50900, 51300, 51250, 51400, 51300, 51600, 51450, 51800, 51750,
    51900, 51600, 51750, 51500, 52100, 51950, 52200, 52050, 51800, 51926.21
  ];

  const minVal = 49500;
  const maxVal = 52500;
  const width = 600;
  const height = 200;

  // Generate SVG path points
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - minVal) / (maxVal - minVal)) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  // Area path for gradient fill
  const areaPathD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="mt-4 bg-neutral-50 dark:bg-neutral-900/50 dark:md:bg-white/[0.03] rounded-2xl border border-neutral-200 dark:border-white/[0.06] p-6">
      <h3 className="text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-neutral-500 mb-6">
        EQUITY CURVE
      </h3>
      
      <div className="relative w-full h-auto mb-8">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Optional subtle horizontal dashed lines */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" strokeWidth="1" strokeDasharray="4 4" />

          {/* Area fill */}
          <path 
            d={areaPathD} 
            fill="url(#equityGradient)" 
          />
          
          {/* Line */}
          <path 
            d={pathD} 
            fill="none" 
            className="stroke-emerald-500 dark:stroke-emerald-400" 
            strokeWidth="2" 
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Restrained axis labels */}
        <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
          <span>$50,000</span>
          <span>$51,926</span>
        </div>
      </div>

      <div className="flex justify-start">
        <a 
          href="#"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-300"
        >
          View verified performance &rarr;
        </a>
      </div>
    </div>
  );
};

export default EquityCurve;
