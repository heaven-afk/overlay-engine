'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface MglYtLivestandingProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// Inline Team Logo with fallback initials
function TeamLogo({ logoUrl, name, size = 52 }: { logoUrl?: string | null; name?: string; size?: number }) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || '??').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'TM';
  const fontSize = Math.round(size * 0.38);
  const radius = '8px';

  if (isHttp) {
    const canvaUrl = getCanvaEmbedUrl(logoUrl);
    if (canvaUrl) {
      return (
        <iframe
          src={canvaUrl}
          scrolling="no"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: 'none',
            borderRadius: radius,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        />
      );
    }
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
          borderRadius: radius,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '3px',
          boxSizing: 'border-box',
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
        borderRadius: radius,
        background: 'linear-gradient(135deg, rgba(229, 169, 60, 0.25) 0%, rgba(20, 24, 36, 0.8) 100%)',
        border: '1px solid rgba(229, 169, 60, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        color: '#E5A93C',
        fontFamily: 'var(--heading-font, sans-serif)',
        flexShrink: 0,
        letterSpacing: '0.02em',
        textShadow: '0 0 10px rgba(229, 169, 60, 0.6)',
      }}
    >
      {initials}
    </div>
  );
}

// Carry1st Vector Logo Component
function Carry1stLogo({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {/* Cyan/Blue Circular Mark */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="carry1stGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0091FF" />
          </linearGradient>
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Outer Glowing Arc */}
        <circle cx="50" cy="50" r="44" stroke="url(#carry1stGrad)" strokeWidth="11" strokeLinecap="round" strokeDasharray="210 60" transform="rotate(-30 50 50)" filter="url(#cyanGlow)" />
        {/* Inner stylized C mark */}
        <path
          d="M 58 32 C 43 32 34 40 34 50 C 34 60 43 68 58 68"
          stroke="#00E5FF"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="58" cy="50" r="5" fill="#00E5FF" />
      </svg>
      <span
        style={{
          color: '#FFFFFF',
          fontFamily: 'var(--heading-font, "Inter", sans-serif)',
          fontWeight: 800,
          fontSize: `${Math.round(size * 0.95)}px`,
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span style={{ color: '#00E5FF' }}>Carry</span>1st
      </span>
    </div>
  );
}

// 3D Metallic MGL Circuit Emblem
function MglEmblem({ customLogoUrl, size = 310 }: { customLogoUrl?: string | null; size?: number }) {
  const isCustom = customLogoUrl && (customLogoUrl.startsWith('http://') || customLogoUrl.startsWith('https://'));

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      {/* Outer ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: '10px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 120, 0, 0.35) 0%, rgba(229, 169, 60, 0.15) 50%, transparent 75%)',
          filter: 'blur(20px)',
          zIndex: 1,
        }}
      />

      {/* Embedded Custom Logo or Default High-Fidelity 3D MGL Circuit Vector */}
      {isCustom ? (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            padding: '16px',
            boxSizing: 'border-box',
            background: 'radial-gradient(circle at 35% 35%, #2A1D13 0%, #120D08 60%, #060504 100%)',
            border: '6px solid #B87B31',
            boxShadow: '0 0 25px rgba(255, 140, 0, 0.6), inset 0 0 20px rgba(255, 140, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={customLogoUrl}
            alt="MGL Emblem"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            style={{
              width: '82%',
              height: '82%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(255, 160, 0, 0.7))',
            }}
          />
        </div>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 30px rgba(255, 120, 0, 0.45))' }}
        >
          <defs>
            {/* Metallic Gold/Bronze Ring Gradients */}
            <radialGradient id="metalBevel" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#F5D089" />
              <stop offset="25%" stopColor="#B3782E" />
              <stop offset="55%" stopColor="#5E3710" />
              <stop offset="80%" stopColor="#9C6524" />
              <stop offset="100%" stopColor="#2D1908" />
            </radialGradient>
            <linearGradient id="innerBronzeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#301E11" />
              <stop offset="50%" stopColor="#170F09" />
              <stop offset="100%" stopColor="#080503" />
            </linearGradient>
            <linearGradient id="neonOrangeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFAE33" />
              <stop offset="50%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#D93800" />
            </linearGradient>
            <filter id="circuitGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="deepBevel">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Outer Heavy Metallic Beveled Ring */}
          <circle cx="160" cy="160" r="148" stroke="url(#metalBevel)" strokeWidth="14" fill="url(#innerBronzeGrad)" />
          <circle cx="160" cy="160" r="139" stroke="#FFA32B" strokeWidth="2.5" strokeDasharray="18 8 6 8" opacity="0.85" filter="url(#circuitGlow)" />
          <circle cx="160" cy="160" r="132" stroke="#4A2B0E" strokeWidth="3" />

          {/* Inner Dark Textured Core */}
          <circle cx="160" cy="160" r="128" fill="#120D08" />

          {/* Background Circuit Grid Lines */}
          <g opacity="0.35" stroke="#FF7700" strokeWidth="1.2">
            <path d="M 70 160 H 120 L 140 140" />
            <path d="M 250 160 H 200 L 180 180" />
            <path d="M 160 70 V 110 L 140 130" />
            <path d="M 160 250 V 210 L 180 190" />
            <circle cx="70" cy="160" r="3" fill="#FF8800" />
            <circle cx="250" cy="160" r="3" fill="#FF8800" />
            <circle cx="160" cy="70" r="3" fill="#FF8800" />
            <circle cx="160" cy="250" r="3" fill="#FF8800" />
          </g>

          {/* Stylized MGL Monogram / Metallic Circuit 3D Letters */}
          <g filter="url(#deepBevel)">
            {/* Letter 'M' (Left) */}
            <path
              d="M 88 215 V 105 L 128 165 L 148 135 L 148 215"
              stroke="#543010"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 88 215 V 105 L 128 165 L 148 135 L 148 215"
              stroke="url(#metalBevel)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 'M' Neon Circuit Trace */}
            <path
              d="M 88 215 V 105 L 128 165 L 148 135 L 148 215"
              stroke="url(#neonOrangeGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#circuitGlow)"
            />

            {/* Letter 'G' (Right) */}
            <path
              d="M 232 125 C 218 100 185 98 165 118 C 145 138 145 182 165 202 C 185 222 222 220 232 195 V 162 H 195"
              stroke="#543010"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 232 125 C 218 100 185 98 165 118 C 145 138 145 182 165 202 C 185 222 222 220 232 195 V 162 H 195"
              stroke="url(#metalBevel)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 'G' Neon Circuit Trace */}
            <path
              d="M 232 125 C 218 100 185 98 165 118 C 145 138 145 182 165 202 C 185 222 222 220 232 195 V 162 H 195"
              stroke="url(#neonOrangeGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#circuitGlow)"
            />

            {/* Center Nexus Connector */}
            <path
              d="M 148 185 L 172 205 L 195 190"
              stroke="url(#neonOrangeGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#circuitGlow)"
            />
          </g>

          {/* Circuit nodes / accent glowing dots */}
          <circle cx="88" cy="105" r="4.5" fill="#FFE299" filter="url(#circuitGlow)" />
          <circle cx="128" cy="165" r="4.5" fill="#FFE299" filter="url(#circuitGlow)" />
          <circle cx="232" cy="162" r="4.5" fill="#FFE299" filter="url(#circuitGlow)" />
          <circle cx="195" cy="162" r="4.5" fill="#FFE299" filter="url(#circuitGlow)" />
        </svg>
      )}
    </div>
  );
}

// Fallback Default Mock Teams (Matching image names & layout)
const DEFAULT_MOCK_TEAMS = [
  { rank: 1, teamName: 'FAZE RAIDERS', logoUrl: '', totalPts: 200, kills: 48, placementPts: 152 },
  { rank: 2, teamName: '21ST CENTURY', logoUrl: '', totalPts: 200, kills: 45, placementPts: 155 },
  { rank: 3, teamName: 'DFL', logoUrl: '', totalPts: 200, kills: 42, placementPts: 158 },
  { rank: 4, teamName: 'PARIS CHITAURI', logoUrl: '', totalPts: 200, kills: 38, placementPts: 162 },
  { rank: 5, teamName: 'VORTEX ONE', logoUrl: '', totalPts: 200, kills: 35, placementPts: 165 },
  { rank: 6, teamName: 'REMEDIUM INVICTUS', logoUrl: '', totalPts: 200, kills: 32, placementPts: 168 },
  { rank: 7, teamName: 'ONYX ESPORTS', logoUrl: '', totalPts: 200, kills: 30, placementPts: 170 },
  { rank: 8, teamName: 'HORIZON ONE', logoUrl: '', totalPts: 200, kills: 28, placementPts: 172 },
  { rank: 9, teamName: 'BOMBANA', logoUrl: '', totalPts: 200, kills: 25, placementPts: 175 },
  { rank: 10, teamName: 'HYPERION SQUAD', logoUrl: '', totalPts: 195, kills: 22, placementPts: 173 },
];

export const MglYtLivestanding: React.FC<MglYtLivestandingProps> = ({
  data = {},
  styleConfig = {} as TemplateStyleConfig,
  isPreview = false,
}) => {
  const {
    graphicTitle = 'TOP 10 TEAMS',
    graphicSubtitle,
    accentColor = '#E5A93C',
    customBackgroundUrl,
    dailyPointsColumn = 'totalPts',
    hybridEraMode = 'collation',
    sponsorFooterText = 'Powered by Carry1st',
    brandingLogoUrl,
  } = styleConfig;

  // Resolve teams array (from rows, results, teams, or players)
  const resolvedTeamsArray: any[] =
    (Array.isArray(data.rows) && data.rows.length > 0)
      ? data.rows
      : (Array.isArray(data.results) && data.results.length > 0)
        ? data.results
        : (Array.isArray(data.teams) && data.teams.length > 0)
          ? data.teams
          : (Array.isArray(data.players) && data.players.length > 0)
            ? data.players
            : (Array.isArray(data.currentData?.results) && data.currentData.results.length > 0)
              ? data.currentData.results
              : [];

  const rawTeams = resolvedTeamsArray.length > 0 ? resolvedTeamsArray : DEFAULT_MOCK_TEAMS;

  // Slice to Top 10 teams
  const top10 = rawTeams.slice(0, 10).map((t, idx) => {
    // Resolve Points based on dailyPointsColumn
    let pts = t.totalPts ?? t.pts ?? t.totalPoints ?? 0;
    if (dailyPointsColumn === 'kills') {
      pts = t.kills ?? 0;
    } else if (dailyPointsColumn === 'placementPts') {
      pts = t.placementPts ?? t.placePts ?? 0;
    }

    return {
      rank: t.rank ?? (idx + 1),
      teamName: (t.teamName || t.name || t.clanName || `TEAM ${idx + 1}`).toUpperCase(),
      logoUrl: t.logoUrl || t.logo || null,
      pts: pts,
    };
  });

  // Ensure full 10 rows filled
  while (top10.length < 10) {
    const idx = top10.length;
    top10.push({
      rank: idx + 1,
      teamName: `TEAM ${idx + 1}`,
      logoUrl: null,
      pts: 0,
    });
  }

  // Active mode & subheader
  const resolvedMode = data.hybridEraMode || hybridEraMode || 'collation';
  let defaultSubheader = '';
  if (resolvedMode === 'daily') {
    const dayStr = data.day ? `DAY ${data.day}` : 'DAILY RESULTS';
    const lobbyStr = data.lobby ? ` · LOBBY ${data.lobby}` : '';
    defaultSubheader = `${dayStr}${lobbyStr}`;
  } else {
    defaultSubheader = data.selectedGroup && data.selectedGroup !== 'all' ? `${data.selectedGroup.toUpperCase()} COLLATION` : '';
  }

  const subheaderText = graphicSubtitle || data.graphicSubtitle || defaultSubheader;

  const canvaBg = customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;
  const borderGold = accentColor || '#E5A93C';

  return (
    <div
      style={{
        width: '713px',
        height: '2048px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#07090E',
        fontFamily: 'var(--body-font, "Inter", sans-serif)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── BACKGROUND LAYER: Sci-Fi Atmosphere + Orange Laser Beams ─── */}
      {customBackgroundUrl && !canvaBg ? (
        <img
          src={customBackgroundUrl}
          alt="Custom Background"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      ) : canvaBg ? (
        <iframe
          src={canvaBg}
          scrolling="no"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: 'radial-gradient(ellipse at 50% 25%, #141724 0%, #0B0E17 55%, #05060A 100%)',
          }}
        >
          {/* Subtle Technical Grid / Circuit Lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              backgroundImage: 'radial-gradient(#E5A93C 1px, transparent 1px), radial-gradient(#E5A93C 1px, #07090E 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px',
            }}
          />

          {/* Sci-Fi Diagonal Light Streaks / Orange Laser */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              right: '-40%',
              width: '180%',
              height: '140%',
              background: 'linear-gradient(135deg, transparent 46%, rgba(255, 110, 0, 0.18) 49%, rgba(255, 170, 40, 0.45) 50%, rgba(255, 90, 0, 0.15) 51%, transparent 54%)',
              transform: 'rotate(-12deg)',
              pointerEvents: 'none',
              filter: 'blur(3px)',
            }}
          />

          {/* Ambient Warm Smoke / Nebula Glow */}
          <div
            style={{
              position: 'absolute',
              top: '65%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 120, 0, 0.14) 0%, rgba(229, 169, 60, 0.05) 50%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Atmospheric Glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '350px',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 140, 0, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* ─── FOREGROUND CONTENT WRAPPER ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: '0 40px',
          justifyContent: 'space-between',
        }}
      >
        {/* TOP SPACER / ARENA CEILING */}
        <div style={{ height: '360px', flexShrink: 0 }} />

        {/* ─── SECTION 1: HEADER TITLE ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: '26px',
            width: '100%',
          }}
        >
          {/* Subheader / Stage Badge if present */}
          {subheaderText && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(229, 169, 60, 0.15)',
                border: '1px solid rgba(229, 169, 60, 0.4)',
                marginBottom: '10px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#FFB833',
                textTransform: 'uppercase',
                fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
                boxShadow: '0 0 12px rgba(229, 169, 60, 0.25)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF9900', boxShadow: '0 0 8px #FF9900' }} />
              {subheaderText}
            </div>
          )}

          {/* Main Title: TOP 10 TEAMS */}
          <h1
            style={{
              margin: 0,
              fontSize: '44px',
              fontWeight: 800,
              fontFamily: 'var(--heading-font, "Orbitron", "Rajdhani", sans-serif)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFA826',
              textShadow: '0 0 18px rgba(255, 150, 0, 0.65), 0 0 35px rgba(255, 100, 0, 0.35)',
              lineHeight: 1.1,
            }}
          >
            {graphicTitle}
          </h1>
        </div>

        {/* ─── SECTION 2: STANDINGS TABLE (TOP 10 ROWS) ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
          }}
        >
          {top10.map((team, index) => {
            const isFirst = index === 0;
            const rowBorderColor = isFirst ? 'rgba(255, 190, 60, 0.95)' : 'rgba(229, 169, 60, 0.75)';
            const rowShadow = isFirst
              ? '0 0 15px rgba(255, 180, 40, 0.35), inset 0 0 10px rgba(255, 180, 40, 0.15)'
              : '0 0 10px rgba(229, 169, 60, 0.15), inset 0 0 8px rgba(229, 169, 60, 0.08)';

            return (
              <div
                key={`team-row-${team.rank}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  height: '74px',
                  boxSizing: 'border-box',
                }}
              >
                {/* ── BOX 1: TEAM LOGO ── */}
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '14px',
                    border: `1.8px solid ${rowBorderColor}`,
                    boxShadow: rowShadow,
                    backgroundColor: isFirst ? 'rgba(26, 22, 16, 0.88)' : 'rgba(12, 15, 24, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  <TeamLogo logoUrl={team.logoUrl} name={team.teamName} size={54} />
                </div>

                {/* ── BOX 2: TEAM NAME ── */}
                <div
                  style={{
                    flex: 1,
                    height: '74px',
                    borderRadius: '14px',
                    border: `1.8px solid ${rowBorderColor}`,
                    boxShadow: rowShadow,
                    background: isFirst
                      ? 'linear-gradient(90deg, rgba(34, 26, 16, 0.92) 0%, rgba(45, 34, 20, 0.85) 50%, rgba(30, 22, 14, 0.92) 100%)'
                      : 'linear-gradient(90deg, rgba(14, 18, 28, 0.92) 0%, rgba(22, 28, 44, 0.82) 50%, rgba(14, 18, 28, 0.92) 100%)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 20px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Subtle Sci-Fi Gloss Highlight on top edge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '10%',
                      right: '10%',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
                    }}
                  />

                  <span
                    style={{
                      fontFamily: 'var(--heading-font, "Orbitron", "Rajdhani", sans-serif)',
                      fontSize: '23px',
                      fontWeight: 800,
                      color: isFirst ? '#FFF4E0' : '#FFFFFF',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: isFirst
                        ? '0 0 14px rgba(255, 180, 40, 0.65)'
                        : '0 0 10px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {team.teamName}
                  </span>
                </div>

                {/* ── BOX 3: POINTS VALUE ── */}
                <div
                  style={{
                    width: '84px',
                    height: '74px',
                    borderRadius: '14px',
                    border: `1.8px solid ${rowBorderColor}`,
                    boxShadow: rowShadow,
                    background: isFirst
                      ? 'linear-gradient(135deg, rgba(38, 28, 16, 0.94) 0%, rgba(24, 18, 10, 0.94) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 20, 32, 0.92) 0%, rgba(10, 13, 22, 0.92) 100%)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--heading-font, "Orbitron", "Rajdhani", sans-serif)',
                      fontSize: '28px',
                      fontWeight: 800,
                      color: isFirst ? '#FFCC4D' : '#FFFFFF',
                      letterSpacing: '0.04em',
                      textShadow: isFirst
                        ? '0 0 14px rgba(255, 200, 50, 0.7)'
                        : '0 0 10px rgba(229, 169, 60, 0.4)',
                    }}
                  >
                    {team.pts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── SECTION 3: CENTER GLOWING DIVIDER LINE ─── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '2px',
            margin: '24px 0 18px 0',
            background: 'linear-gradient(90deg, transparent 0%, rgba(229, 169, 60, 0.4) 20%, rgba(255, 170, 40, 0.95) 50%, rgba(229, 169, 60, 0.4) 80%, transparent 100%)',
            boxShadow: '0 0 12px rgba(255, 160, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#FFAE33',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 10px #FF9900',
            }}
          />
        </div>

        {/* ─── SECTION 4: 3D METALLIC MGL CIRCUIT EMBLEM ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '10px 0 20px 0',
          }}
        >
          <MglEmblem customLogoUrl={brandingLogoUrl} size={305} />
        </div>

        {/* ─── SECTION 5: FOOTER (POWERED BY CARRY1ST) ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            paddingBottom: '46px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.85)',
              fontFamily: 'var(--body-font, "Inter", sans-serif)',
              letterSpacing: '0.02em',
            }}
          >
            Powered by
          </span>
          <Carry1stLogo size={32} />
        </div>
      </div>
    </div>
  );
};
