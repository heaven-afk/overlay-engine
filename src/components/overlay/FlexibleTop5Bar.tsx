'use client';

import React from 'react';
import { Sparkline } from './Sparkline';
import { TrendArrow } from './TrendArrow';
import { getRankColor } from '@/lib/getRankColor';
import { ANIMATION, COLORS, SIZES } from '@/lib/overlayDesignTokens';

export interface FlexibleTop5TeamData {
  id?: string;
  teamId: string;
  teamName: string;
  logoUrl?: string | null;
  logo?: string | null;
  slot?: number | string | null;
  rank: number;
  totalPts: number;
  avgPlacement?: number | null;
  rating?: number | null;
  placementHistory?: number[];
  trendDelta?: number | null;
}

interface FlexibleTop5BarProps {
  team: FlexibleTop5TeamData;
  index: number;
}

export function FlexibleTop5Bar({ team, index }: FlexibleTop5BarProps) {
  const accentColor = getRankColor(team.rank);
  const formattedRank = team.rank < 10 ? `#0${team.rank}` : `#${team.rank}`;
  const logo = team.logoUrl || team.logo || null;

  return (
    <div
      style={{
        width: '100%',
        height: `${SIZES.top5BarHeight}px`,
        marginBottom: '12px',
        borderRadius: '12px',
        background: COLORS.barBg,
        borderLeft: `4px solid ${accentColor}`,
        borderTop: `1px solid ${COLORS.borderSubtle}`,
        borderRight: `1px solid ${COLORS.borderSubtle}`,
        borderBottom: `1px solid ${COLORS.borderSubtle}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        boxSizing: 'border-box',
        animation: `barSlideIn ${ANIMATION.slideDuration}ms ${ANIMATION.easeOutExpo} ${index * ANIMATION.barStagger}ms forwards`,
        opacity: 0,
        transform: 'translateX(60px)',
      }}
    >
      <style jsx>{`
        @keyframes barSlideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* 1. Absolute Rank Badge */}
      <div
        style={{
          width: `${SIZES.top5RankWidth}px`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'flex-start',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary }}>
          {formattedRank}
        </span>
      </div>

      {/* 2. Team Logo */}
      <div
        style={{
          width: `${SIZES.top5LogoSize}px`,
          height: `${SIZES.top5LogoSize}px`,
          borderRadius: '50%',
          margin: '0 16px',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={team.teamName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '18px', fontWeight: 700, color: COLORS.gold }}>
            {(team.teamName || '?')[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* 3. Team Identity */}
      <div
        style={{
          width: `${SIZES.top5IdentityWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: COLORS.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {team.teamName}
        </span>
        <span style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
          {team.slot ? `Slot ${team.slot}` : 'Team Roster'}
        </span>
      </div>

      {/* 4. Sparkline Graph */}
      <div
        style={{
          width: `${SIZES.top5SparklineWidth}px`,
          height: `${SIZES.top5SparklineHeight}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkline data={team.placementHistory || []} />
      </div>

      {/* 5. Key Stats Cluster */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '24px',
          paddingRight: '16px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: COLORS.textPrimary }}>
            {team.totalPts ?? 0}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textMuted, letterSpacing: '1px' }}>
            PTS
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: COLORS.textPrimary }}>
            {team.avgPlacement != null ? team.avgPlacement.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textMuted, letterSpacing: '1px' }}>
            AVG
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
              background: COLORS.goldGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {team.rating != null ? team.rating.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: COLORS.textMuted, letterSpacing: '1px' }}>
            RATING
          </div>
        </div>
      </div>

      {/* 6. Trend Arrow */}
      <div
        style={{
          width: `${SIZES.top5TrendWidth}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TrendArrow delta={team.trendDelta} />
      </div>
    </div>
  );
}
