'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface PmncTop15StandingsProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// Inline Team Logo with fallback initials
function TeamLogo({ logoUrl, name, size = 38 }: { logoUrl?: string | null; name?: string; size?: number }) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || '??').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'TM';
  const fontSize = Math.round(size * 0.38);
  const radius = '6px';

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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(229, 169, 60, 0.35)',
          padding: '2px',
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
        backgroundColor: 'rgba(229, 169, 60, 0.18)',
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
      }}
    >
      {initials}
    </div>
  );
}

// Side Decorative Ribbon / African-Esports Graphic Sash
function SideRibbon() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '110px',
        left: '28px',
        width: '44px',
        height: '780px',
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Flowing woven motif */}
      <svg width="44" height="780" viewBox="0 0 44 780" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#801B14" />
            <stop offset="40%" stopColor="#C43825" />
            <stop offset="70%" stopColor="#E5A93C" />
            <stop offset="100%" stopColor="#1B1713" />
          </linearGradient>
          <pattern id="tribalPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="#E5A93C" opacity="0.35" />
            <circle cx="10" cy="10" r="3" fill="#FFFFFF" opacity="0.5" />
          </pattern>
        </defs>
        {/* Woven flowing path */}
        <path
          d="M22 10 C38 60 4 120 22 180 C40 240 4 300 22 360 C40 420 4 480 22 540 C40 600 4 660 22 720 C32 750 22 770 22 770"
          stroke="url(#ribbonGrad)"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          d="M22 10 C38 60 4 120 22 180 C40 240 4 300 22 360 C40 420 4 480 22 540 C40 600 4 660 22 720 C32 750 22 770 22 770"
          stroke="url(#tribalPattern)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M22 10 C38 60 4 120 22 180 C40 240 4 300 22 360 C40 420 4 480 22 540 C40 600 4 660 22 720 C32 750 22 770 22 770"
          stroke="#E5A93C"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

export const PmncTop15Standings: React.FC<PmncTop15StandingsProps> = ({
  data = {},
  styleConfig = {} as TemplateStyleConfig,
  isPreview = false,
}) => {
  const {
    graphicTitle = 'OVERALL STANDINGS',
    graphicSubtitle,
    stageBadgeText,
    accentColor = '#E5A93C',
    colorTheme = 'dark',
    customBackgroundUrl,
    brandingLogoUrl,
    brandingName = 'PUBG MOBILE\nESPORTS',
    tournamentLogos = [],
    showStatsStamp = true,
    topN = 15,
    showSideRibbon = true,
    sponsorFooterText = 'KRAFTON · LEVEL INFINITE · LIGHTSPEED STUDIOS · INFINIX',
  } = styleConfig;

  // Resolve team dataset
  const resolvedTeamsArray =
    (Array.isArray(data?.rows) && data.rows.length > 0)
      ? data.rows
      : (Array.isArray(data?.teams) && data.teams.length > 0)
        ? data.teams
        : (Array.isArray(data?.results) && data.results.length > 0)
          ? data.results
          : (Array.isArray(data?.currentData?.results) && data.currentData.results.length > 0)
            ? data.currentData.results
            : null;

  // Mock data for preview if empty
  const mockTeams = Array.from({ length: 32 }, (_, i) => {
    const names = [
      'REVAN BLOOD', 'NO PRESSURE', 'FALLEN RUTHLESS', 'FURIOUS 9', 'PUZE ESPORTS',
      'RESCUE ESPORTS', '4 TITANS', 'EXCESS POWER', 'INHAILTEMPO', 'RUSH ESPORTS',
      'AURA ESPORTS', 'NULL VANTA ESPORTS', 'RELENTLESS7 ESP', 'CLUTCH GODS', 'RED WOLVES',
      'NGX ESPORTS', 'ONE TAKE ESPORT', 'MBAVU E-SPORTS', 'NEMESYS PRIME', '4PF ESPORTS',
      'TEAM EXECUTE', 'THE SNIPERS ESPORTS', 'ZERO ESPORT', 'DEADLY ESPORTS', 'RELENTLESS ESPO',
      'BLACK REIGN ESP', 'APEX PREDATOR', 'TRAILBLAZERS', 'MTF ESPORTS', 'FTG ESPORTS',
      'CALLME', 'NJEGE | MASANSE',
    ];
    const winsArr = [1, 2, 0, 3, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const plcArr = [32, 34, 28, 31, 21, 18, 15, 15, 17, 20, 19, 15, 7, 12, 15, 11, 8, 11, 10, 10, 4, 2, 5, 5, 6, 4, 1, 4, 2, 2, 0, 0];
    const elimArr = [74, 63, 57, 47, 49, 48, 31, 30, 27, 22, 16, 20, 24, 18, 13, 15, 18, 12, 13, 11, 10, 11, 7, 5, 3, 5, 8, 4, 2, 1, 3, 3];
    const plc = plcArr[i] ?? Math.max(0, 30 - i);
    const elim = elimArr[i] ?? Math.max(0, 70 - i * 2);

    return {
      rank: i + 1,
      teamId: `t-${i + 1}`,
      teamName: names[i] || `TEAM ${i + 1}`,
      logoUrl: '',
      wins: winsArr[i] ?? 0,
      placementPoints: plc,
      placementPts: plc,
      placePts: plc,
      kills: elim,
      eliminations: elim,
      totalPoints: plc + elim,
      totalPts: plc + elim,
    };
  });

  const rawTeams: any[] = resolvedTeamsArray || mockTeams;

  // Flexibility: Team count & Pagination support
  const pageSize = Number(topN) || 15;
  const activePage = Number(data?.page || styleConfig.page || 1);
  const rankOffset = styleConfig.rankOffset !== undefined
    ? Number(styleConfig.rankOffset)
    : (activePage - 1) * pageSize;

  const startIdx = (activePage - 1) * pageSize;
  const pageSlice = rawTeams.slice(startIdx, startIdx + pageSize);

  // Map rows with sanitized fields
  const rows = pageSlice.map((team: any, index: number) => {
    const calculatedRank = team.rank !== undefined ? Number(team.rank) : (rankOffset + index + 1);
    const teamName = (team.teamName || team.name || team.clanName || `TEAM ${calculatedRank}`).toUpperCase();
    const logoUrl = team.logoUrl || team.logo || null;
    const wins = Number(team.wins ?? team.scores?.wins ?? team.winsCount ?? 0);
    const placementPts = Number(team.placementPoints ?? team.placementPts ?? team.placePts ?? team.scores?.placementPts ?? 0);
    const kills = Number(team.kills ?? team.eliminations ?? team.scores?.kills ?? 0);
    const totalPts = Number(team.totalPoints ?? team.totalPts ?? team.scores?.totalPts ?? (placementPts + kills));

    return {
      rank: calculatedRank,
      teamName,
      logoUrl,
      wins,
      placementPts,
      kills,
      totalPts,
    };
  });

  // Dynamic row sizing for seamless fit in 1080p
  const rowCount = Math.max(rows.length, 1);
  // Total container available height ≈ 730px
  const rowHeight = Math.min(50, Math.max(38, Math.floor(700 / rowCount)));
  const logoSize = Math.max(28, Math.min(36, rowHeight - 6));
  const fontSize = Math.min(18, Math.max(14, Math.floor(rowHeight * 0.42)));
  const rankFontSize = Math.min(20, Math.max(15, Math.floor(rowHeight * 0.45)));

  // Theme styling
  const isCustom = colorTheme === 'custom';
  const isLight = colorTheme === 'light';
  const canvaBgUrl = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;

  const resolvedStageBadge = stageBadgeText || graphicSubtitle || (data?.day ? `PMNC GROUP STAGE - DAY ${data.day}` : 'PMNC KENYA GROUP STAGE - DAY 2');

  const brandingParts = brandingName
    ? (brandingName.includes('\n') ? brandingName.split('\n') : brandingName.split('/'))
    : ['PUBG MOBILE', 'ESPORTS'];
  const brandOrg = (brandingParts[0] || 'PUBG MOBILE').trim();
  const brandSub = (brandingParts[1] || 'ESPORTS').trim();

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "var(--body-font, 'Inter', sans-serif)",
        color: '#FFFFFF',
        backgroundColor: '#0F0B08',
        backgroundImage: isCustom && customBackgroundUrl && !canvaBgUrl
          ? `url(${customBackgroundUrl})`
          : 'radial-gradient(ellipse at 50% 15%, #502A10 0%, #2A1608 45%, #120A04 85%, #080402 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Canva iframe embed */}
      {canvaBgUrl && (
        <iframe
          src={canvaBgUrl}
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Atmospheric lighting layers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% -10%, rgba(229, 169, 60, 0.28) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Optional Side Decorative Sash / Tribal Ribbon */}
      {showSideRibbon && <SideRibbon />}

      {/* Main Content Layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 70px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── TOP HEADER SECTION ────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          {/* Top Left: Organizer / Brand Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
            {brandingLogoUrl ? (
              <img
                src={brandingLogoUrl}
                alt="Brand"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{
                  height: '70px',
                  maxWidth: '140px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '8px 14px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '2px solid rgba(229, 169, 60, 0.7)',
                  borderRadius: '6px',
                  boxShadow: '0 0 16px rgba(229, 169, 60, 0.25)',
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: '#FFFFFF',
                    lineHeight: '1.1',
                    fontFamily: "var(--heading-font, 'Impact', sans-serif)",
                  }}
                >
                  {brandOrg}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: '#E5A93C',
                    textTransform: 'uppercase',
                  }}
                >
                  {brandSub}
                </span>
              </div>
            )}
          </div>

          {/* Top Center: Stage Pill & Main Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {/* Stage Badge Pill */}
            {resolvedStageBadge && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 22px',
                  backgroundColor: 'rgba(18, 12, 8, 0.88)',
                  border: '1.5px solid rgba(229, 169, 60, 0.65)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#F4DEB3',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontFamily: "var(--heading-font, 'Inter', sans-serif)",
                  }}
                >
                  {resolvedStageBadge}
                </span>
              </div>
            )}

            {/* Huge Hero Title */}
            <h1
              style={{
                fontSize: '52px',
                fontWeight: 900,
                lineHeight: '1',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: "var(--heading-font, 'Impact', 'Arial Black', sans-serif)",
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F5E5C9 45%, #E5A93C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.8))',
              }}
            >
              {graphicTitle}
            </h1>
          </div>

          {/* Top Right: Tournament Championship Crest / Logo Slot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '220px' }}>
            {tournamentLogos && tournamentLogos[0]?.logoUrl ? (
              <img
                src={tournamentLogos[0].logoUrl}
                alt="Tournament"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{
                  height: '76px',
                  maxWidth: '140px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 14px',
                  background: 'radial-gradient(circle, rgba(229,169,60,0.2) 0%, rgba(20,12,6,0.85) 100%)',
                  border: '1.5px solid rgba(229, 169, 60, 0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#E5A93C', letterSpacing: '0.15em' }}>
                  NATIONAL
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.08em' }}>
                  CHAMPIONSHIP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN LEADERBOARD TABLE CARD ─────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1460px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(240, 222, 185, 0.88)',
            border: '2px solid rgba(229, 169, 60, 0.75)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75), inset 0 0 30px rgba(229, 169, 60, 0.15)',
            position: 'relative',
          }}
        >
          {/* Table Header Bar (Dark Umber) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 140px 140px 140px 170px',
              alignItems: 'center',
              backgroundColor: '#26160A',
              borderBottom: '2px solid #E5A93C',
              padding: '10px 24px',
              boxSizing: 'border-box',
              color: '#F4DEB3',
              fontFamily: "var(--heading-font, 'Inter', sans-serif)",
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: 'center' }}>RANK</div>
            <div style={{ paddingLeft: '16px' }}>TEAM</div>
            <div style={{ textAlign: 'center' }}>WINS</div>
            <div style={{ textAlign: 'center' }}>PLC.PTS</div>
            <div style={{ textAlign: 'center' }}>KILLS</div>
            <div style={{ textAlign: 'center', color: '#E5A93C' }}>TOT.PTS</div>
          </div>

          {/* Table Rows Container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '4px 0',
              boxSizing: 'border-box',
            }}
          >
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={`${row.rank}-${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 140px 140px 140px 170px',
                    alignItems: 'center',
                    height: `${rowHeight}px`,
                    padding: '0 24px',
                    boxSizing: 'border-box',
                    backgroundColor: isEven ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    borderBottom: idx === rows.length - 1 ? 'none' : '1px solid rgba(80, 45, 18, 0.12)',
                    color: '#1F140A',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${rankFontSize}px`,
                      fontWeight: 900,
                      fontFamily: "var(--heading-font, 'Impact', 'Arial Black', sans-serif)",
                      letterSpacing: '0.04em',
                      color: row.rank <= 3 ? '#9A2E12' : '#331F10',
                    }}
                  >
                    #{row.rank}
                  </div>

                  {/* Team Logo & Name */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      paddingLeft: '16px',
                      minWidth: 0,
                    }}
                  >
                    <TeamLogo logoUrl={row.logoUrl} name={row.teamName} size={logoSize} />
                    <span
                      style={{
                        fontSize: `${fontSize}px`,
                        fontWeight: 900,
                        fontFamily: "var(--heading-font, 'Impact', 'Arial Black', sans-serif)",
                        letterSpacing: '0.04em',
                        color: '#1B1108',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.teamName}
                    </span>
                  </div>

                  {/* Wins */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${fontSize}px`,
                      fontWeight: 800,
                      color: row.wins > 0 ? '#1B1108' : '#7D6A56',
                    }}
                  >
                    {row.wins > 0 ? row.wins : '-'}
                  </div>

                  {/* Placement Points */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${fontSize}px`,
                      fontWeight: 800,
                      color: row.placementPts > 0 ? '#1B1108' : '#7D6A56',
                    }}
                  >
                    {row.placementPts > 0 ? row.placementPts : '-'}
                  </div>

                  {/* Kills */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${fontSize}px`,
                      fontWeight: 800,
                      color: row.kills > 0 ? '#1B1108' : '#7D6A56',
                    }}
                  >
                    {row.kills > 0 ? row.kills : '-'}
                  </div>

                  {/* Total Points (Bold & Highlighted) */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${fontSize + 3}px`,
                      fontWeight: 900,
                      fontFamily: "var(--heading-font, 'Impact', 'Arial Black', sans-serif)",
                      letterSpacing: '0.02em',
                      color: '#9A2E12',
                    }}
                  >
                    {row.totalPts > 0 ? row.totalPts : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER / SPONSORS BAR ────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1460px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            padding: '0 8px',
            boxSizing: 'border-box',
          }}
        >
          {/* Sponsors brand line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: '#F4DEB3',
                textTransform: 'uppercase',
                fontFamily: "var(--heading-font, 'Inter', sans-serif)",
                textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              }}
            >
              {sponsorFooterText}
            </span>
          </div>

          {/* Stats Stamp / Watermark */}
          {showStatsStamp && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.15em',
                color: 'rgba(244, 222, 179, 0.75)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              STATS BY HEAVEN <span style={{ color: '#E5A93C' }}>✦</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
