import React, { useState } from 'react';

export default function HeroBorrowingChart({ yearlyStats, onYearChange, className, style }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!yearlyStats || !yearlyStats.monthly) {
    return null;
  }

  const { year, monthly, totalThisYear = 0, availableYears = [year] } = yearlyStats;

  // Calculate suitable Y-axis scale based on max value
  const maxBorrow = Math.max(...monthly.map((m) => m.count || 0), 0);
  let maxY = 10;
  if (maxBorrow <= 5) maxY = 5;
  else if (maxBorrow <= 10) maxY = 10;
  else if (maxBorrow <= 15) maxY = 15;
  else if (maxBorrow <= 20) maxY = 20;
  else if (maxBorrow <= 25) maxY = 25;
  else maxY = Math.ceil(maxBorrow / 5) * 5;

  // Generate ticks for Y-axis
  const step = maxY <= 10 ? (maxY <= 5 ? 5 : 5) : Math.ceil(maxY / 5);
  const yTicks = [];
  for (let val = 0; val <= maxY; val += step) {
    yTicks.push(val);
  }

  // SVG Chart Dimensions
  const svgWidth = 360;
  const svgHeight = 94;
  const paddingLeft = 26;
  const paddingRight = 14;
  const paddingTop = 6;
  const paddingBottom = 19;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Official System Palette (Maroon #9E0D0D graduating to Gold/Amber #EAB308)
  const systemColors = [
    '#7F0A0A', // Jan: Deep Maroon
    '#8F0C0C', // Feb
    '#9E0D0D', // Mar: Primary System Maroon
    '#AE1313', // Apr
    '#BD1A1A', // May: Ruby Crimson
    '#CD261B', // Jun
    '#DC3818', // Jul: Burnt Orange
    '#E24E14', // Aug
    '#C26309', // Sep: Ochre
    '#D97706', // Oct: Amber
    '#EAB308', // Nov: System Gold
    '#F59E0B', // Dec: Warm Gold
  ];

  // Map 12 months to coordinates
  const points = monthly.map((item, idx) => {
    const x = paddingLeft + (idx / 11) * chartWidth;
    const y = paddingTop + chartHeight - ((item.count || 0) / maxY) * chartHeight;
    return {
      x,
      y,
      monthNum: idx + 1,
      monthName: item.month,
      count: item.count || 0,
      color: systemColors[idx] || '#9E0D0D',
    };
  });

  // Generate SVG polyline path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Generate Area Fill Path
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`;

  const currentYr = new Date().getFullYear();
  const yearList = Array.from(
    new Set([
      ...(availableYears || []),
      year,
      currentYr,
      currentYr - 1,
      currentYr - 2,
      currentYr - 3,
      currentYr - 4,
    ])
  )
    .filter((y) => typeof y === 'number' && !isNaN(y))
    .sort((a, b) => b - a);

  return (
    <div
      className={className || "w-full md:w-[340px] lg:w-[375px] bg-white rounded-xl py-1.5 px-3 shadow-md border border-slate-100 select-none text-slate-800"}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold" style={{ color: '#1E2A4A', fontFamily: "'Manrope', sans-serif" }}>
            Borrowing Chart
          </h3>
          <select
            value={year}
            onChange={(e) => onYearChange && onYearChange(Number(e.target.value))}
            className="bg-slate-100 text-[#9E0D0D] text-xs font-bold rounded-md px-2 py-0.5 border border-slate-200 outline-none cursor-pointer hover:bg-slate-200 hover:border-slate-300 transition-colors shadow-2xs"
          >
            {yearList.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-xs font-black text-[#9E0D0D]">
            {totalThisYear} {totalThisYear === 1 ? 'book' : 'books'}
          </span>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="relative">
        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-7 px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-semibold rounded shadow-md pointer-events-none z-30 transition-all flex items-center gap-1 border border-slate-700"
            style={{
              left: `${Math.min(Math.max(points[hoveredIdx].x - 30, 0), svgWidth - 80)}px`,
            }}
          >
            <span className="text-[#EAB308] font-bold">
              {points[hoveredIdx].monthName}:
            </span>
            <span>
              {points[hoveredIdx].count} {points[hoveredIdx].count === 1 ? 'book' : 'books'}
            </span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* System Palette Gradient for the Line (Maroon to Amber Gold) */}
            <linearGradient id="systemLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9E0D0D" />
              <stop offset="35%" stopColor="#B91C1C" />
              <stop offset="65%" stopColor="#DC2626" />
              <stop offset="85%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>

            {/* System Maroon Area Glow */}
            <linearGradient id="systemAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9E0D0D" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#EAB308" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines and Y-Axis labels */}
          {yTicks.map((tick) => {
            const yPos = paddingTop + chartHeight - (tick / maxY) * chartHeight;
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={svgWidth - paddingRight}
                  y2={yPos}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 5}
                  y={yPos + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  fontWeight="600"
                  fontFamily="'Inter', sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid Lines and X-Axis Month Labels */}
          {points.map((p, idx) => {
            const isCurrentMonth = year === new Date().getFullYear() && idx === new Date().getMonth();
            const isHovered = hoveredIdx === idx;
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={paddingTop + chartHeight}
                  stroke="#f8fafc"
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={paddingTop + chartHeight + 13}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={isHovered ? '#9E0D0D' : isCurrentMonth ? '#9E0D0D' : '#64748b'}
                  fontWeight={isHovered || isCurrentMonth ? '800' : '600'}
                  fontFamily="'Inter', sans-serif"
                >
                  {p.monthName}
                </text>
                {isCurrentMonth && (
                  <circle
                    cx={p.x}
                    cy={paddingTop + chartHeight + 19}
                    r="1.5"
                    fill="#9E0D0D"
                  />
                )}
              </g>
            );
          })}

          {/* Soft Glowing Area Fill Underneath Line */}
          <path d={areaD} fill="url(#systemAreaGradient)" />

          {/* Official System Palette Line (Maroon to Gold Gradient) */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#systemLineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Square Data Markers in System Colors */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const size = isHovered ? 8 : 6.5;
            return (
              <g
                key={`point-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Transparent wider hit area */}
                <circle cx={p.x} cy={p.y} r="10" fill="transparent" />

                {/* Square Node with System Color and White Outline */}
                <rect
                  x={p.x - size / 2}
                  y={p.y - size / 2}
                  width={size}
                  height={size}
                  fill={isHovered ? '#9E0D0D' : p.color}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? '2' : '1.5'}
                  style={{
                    filter: isHovered
                      ? 'drop-shadow(0 0 6px rgba(158, 13, 13, 0.7))'
                      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                  }}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
