'use client';

import React from 'react';
import { COLORS } from '@/lib/overlayDesignTokens';

interface TrendArrowProps {
  delta?: number | null; // Positive = moved up, Negative = moved down
}

export function TrendArrow({ delta }: TrendArrowProps) {
  if (delta === undefined || delta === null) {
    return <span style={{ color: COLORS.trendNeutral, fontSize: '16px', fontWeight: 600 }}>—</span>;
  }

  if (delta > 0) {
    return (
      <span
        style={{
          color: COLORS.trendUp,
          fontSize: '16px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ▲ {delta}
      </span>
    );
  }

  if (delta < 0) {
    return (
      <span
        style={{
          color: COLORS.trendDown,
          fontSize: '16px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ▼ {Math.abs(delta)}
      </span>
    );
  }

  return (
    <span
      style={{
        color: COLORS.trendNeutral,
        fontSize: '16px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      ● 0
    </span>
  );
}
