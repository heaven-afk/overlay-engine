'use client';

import React from 'react';
import { SIZES, COLORS } from '@/lib/overlayDesignTokens';

interface SparklineProps {
  data?: number[];
  width?: number;
  height?: number;
}

export function Sparkline({
  data = [],
  width = SIZES.top5SparklineWidth,
  height = SIZES.top5SparklineHeight,
}: SparklineProps) {
  const padding = 6;

  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} style={{ opacity: 0.2 }}>
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke={COLORS.textMuted}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  // Determine trend color from average of last 3 matches
  const recent = data.slice(-3);
  const avgRecent = recent.reduce((sum, val) => sum + val, 0) / recent.length;

  let strokeColor = COLORS.trendDown; // red
  if (avgRecent <= 3) {
    strokeColor = COLORS.trendUp; // green
  } else if (avgRecent <= 6) {
    strokeColor = '#FACC15'; // yellow
  }

  // Invert Y logic: placement 1 is at top (padding), max placement is at bottom (height - padding)
  const maxVal = Math.max(...data, 16);
  const minVal = 1;

  const pointsArray = data.map((val, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    // Lower placement value = closer to top (padding)
    const norm = (val - minVal) / Math.max(maxVal - minVal, 1);
    const y = padding + norm * (height - padding * 2);
    return { x, y };
  });

  const pointsString = pointsArray.map((p) => `${p.x},${p.y}`).join(' ');

  const firstX = pointsArray[0].x;
  const lastX = pointsArray[pointsArray.length - 1].x;
  const fillPolygonString = `${firstX},${height} ${pointsString} ${lastX},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polygon points={fillPolygonString} fill={strokeColor} fillOpacity="0.15" />
      <polyline
        points={pointsString}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Circle dot on latest point */}
      <circle
        cx={pointsArray[pointsArray.length - 1].x}
        cy={pointsArray[pointsArray.length - 1].y}
        r="3.5"
        fill={strokeColor}
      />
    </svg>
  );
}
