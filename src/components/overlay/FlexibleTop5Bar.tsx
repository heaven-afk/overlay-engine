'use client';

import React from 'react';
import { TrendArrow } from './TrendArrow';

export interface FlexibleTop5TeamData {
  id?: string;
  teamId: string;
  teamName: string;
  logoUrl?: string | null;
  logo?: string | null;
  slot?: number | string | null;
  rank: number;
  totalPts: number;
  trendDelta?: number | null;
  formLabel?: string | null;
  trend?: 'up' | 'down' | 'flat' | 'new' | null;
  confidence?: 'full' | 'provisional' | 'unranked' | null;
  decayedForm?: number | null;
}

interface FlexibleTop5BarProps {
  team: FlexibleTop5TeamData;
  index: number;
  accent: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  scoreColor: string;
  isLight?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(236, 72, 153, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 236, g = 72, b = 153;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TeamLogo({
  logoUrl,
  name,
  size,
  accent,
}: {
  logoUrl?: string | null;
  name?: string;
  size: number;
  accent: string;
}) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || '??').substring(0, 2).toUpperCase();

  if (isHttp) {
    return (
      <img
        src={logoUrl}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: '8px',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        backgroundColor: hexToRgba(accent, 0.12),
        border: `1px solid ${hexToRgba(accent, 0.4)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${Math.round(size * 0.38)}px`,
        color: accent,
        fontFamily: '"Orbitron", "Rajdhani", sans-serif',
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}

function SparkleFlare({ accent }: { accent: string }) {
  const r = parseInt(accent.replace('#', '').substring(0, 2), 16) || 230;
  const g = parseInt(accent.replace('#', '').substring(2, 4), 16) || 190;
  const b = parseInt(accent.replace('#', '').substring(4, 6), 16) || 90;

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        top: '-10px',
        right: '18px',
        zIndex: 5,
        filter: `drop-shadow(0 0 6px ${accent})`,
        pointerEvents: 'none',
      }}
    >
      <path
        d="M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8L12 0Z"
        fill={`url(#sparkleGrad-${r}${g}${b})`}
      />
      <defs>
        <radialGradient id={`sparkleGrad-${r}${g}${b}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor={accent} stopOpacity={0.8} />
          <stop offset="100%" stopColor={accent} />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function FlexibleTop5Bar({
  team,
  accent,
  cardBg,
  cardBorder,
  textPrimary,
  scoreColor,
  isLight = false,
}: FlexibleTop5BarProps) {
  const rankNumStr = team.rank < 10 ? `0${team.rank}` : `${team.rank}`;
  const logo = team.logoUrl || team.logo || null;
  const isEmpty = !team.teamId || team.teamName.startsWith('TEAM ');

  return (
    <div
      style={{
        width: '1360px',
        height: '102px',
        borderRadius: '12px',
        position: 'relative',
        background: cardBg,
        border: cardBorder,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.7), 0 0 18px ${hexToRgba(accent, 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px 0 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Sparkle accent */}
      <SparkleFlare accent={accent} />

      {/* Left Side: Logo Box + Team Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, minWidth: 0, paddingRight: '20px' }}>
        {/* Logo Box */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '10px',
            backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : '#0B0D12',
            border: `1.5px solid ${hexToRgba(accent, 0.55)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            flexShrink: 0,
          }}
        >
          <TeamLogo logoUrl={logo} name={team.teamName} size={74} accent={accent} />
        </div>

        {/* Team Name */}
        <span
          style={{
            fontSize: '34px',
            fontWeight: 900,
            color: textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            textShadow: isLight ? 'none' : '0 2px 12px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: isEmpty ? 0.4 : 1,
          }}
        >
          {team.teamName}
        </span>
      </div>

      {/* Right Side: Rank Badge -> Trend Arrow -> Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexShrink: 0 }}>
        {/* Absolute Rank Badge Number (RANK 01 before trend arrow) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', opacity: isEmpty ? 0.4 : 1 }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: hexToRgba(accent, 0.75),
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            RANK
          </span>
          <span
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: hexToRgba(accent, 0.95),
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {rankNumStr}
          </span>
        </div>

        {/* Global Form Badge / Trend Arrow */}
        {!isEmpty && (
          <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', justifyContent: 'center' }}>
            {team.formLabel && team.confidence !== 'unranked' ? (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  backgroundColor: team.trend === 'up' ? 'rgba(239,68,68,0.2)' : team.trend === 'down' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
                  color: team.trend === 'up' ? '#ef4444' : team.trend === 'down' ? '#60a5fa' : hexToRgba(accent, 0.9),
                  border: `1px solid ${team.trend === 'up' ? 'rgba(239,68,68,0.4)' : team.trend === 'down' ? 'rgba(59,130,246,0.4)' : hexToRgba(accent, 0.3)}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {team.trend === 'up' ? '🔥' : team.trend === 'down' ? '↘' : '➡'} {team.formLabel}
              </span>
            ) : (
              <TrendArrow delta={team.trendDelta} />
            )}
          </div>
        )}

        {/* Points Score */}
        <span
          style={{
            fontSize: '52px',
            fontWeight: 900,
            color: scoreColor,
            fontFamily: '"Orbitron", "Rajdhani", monospace',
            letterSpacing: '0.02em',
            textShadow: isLight
              ? 'none'
              : '0 2px 12px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.15)',
            opacity: isEmpty ? 0.4 : 1,
            minWidth: '90px',
            textAlign: 'right',
          }}
        >
          {team.totalPts ?? 0}
        </span>
      </div>
    </div>
  );
}
