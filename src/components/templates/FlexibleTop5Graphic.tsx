'use client';

import React from 'react';
import { FlexibleTop5Bar, FlexibleTop5TeamData } from '@/components/overlay/FlexibleTop5Bar';
import { getCanvaEmbedUrl } from './SharedElements';

interface FlexibleTop5GraphicProps {
  data?: any;
  styleConfig?: any;
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

export function FlexibleTop5Graphic({ data = {}, styleConfig = {} }: FlexibleTop5GraphicProps) {
  const {
    graphicTitle,
    graphicSubtitle,
    brandingLogoUrl,
    tournamentLogos,
    hybridTopRightLogoUrl,
    accentColor,
    colorTheme,
    customBackgroundUrl,
    brandingName,
  } = styleConfig;

  const defaultAccent = '#EC4899';
  const accent = (!accentColor || accentColor === '#C9A84C') ? defaultAccent : accentColor;
  const isLight = colorTheme === 'light';
  const isCustom = colorTheme === 'custom';

  const canvaBgUrl = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;
  const textPrimary = isLight ? '#111118' : '#FFFFFF';
  const textMuted = isLight ? '#555566' : 'rgba(255,255,255,0.65)';

  let bgColor = isLight ? '#F5F7FA' : '#040406';
  let bgImage: string | undefined;

  if (isCustom && customBackgroundUrl && !canvaBgUrl) {
    bgImage = `url(${customBackgroundUrl})`;
  } else if (!isLight) {
    bgImage = 'radial-gradient(ellipse at 50% 35%, #12141C 0%, #08090E 60%, #020204 100%)';
  } else {
    bgImage = 'radial-gradient(circle at 50% 20%, #F8FAFC 0%, #E2E8F0 55%, #CBD5E1 100%)';
  }

  const cardBg = isLight
    ? 'linear-gradient(90deg, rgba(240,243,248,0.98) 0%, rgba(248,250,252,0.98) 50%, rgba(235,240,245,0.98) 100%)'
    : 'linear-gradient(90deg, rgba(12,14,19,0.96) 0%, rgba(20,24,33,0.96) 35%, rgba(26,31,43,0.96) 65%, rgba(13,15,21,0.96) 100%)';

  const cardBorder = `1.5px solid ${hexToRgba(accent, 0.55)}`;
  const scoreColor = isLight ? '#111118' : '#FFFFFF';

  const rawTeams: any[] = data.rows || data.teams || data.results || data.currentData?.results || [
    { teamId: 't1', teamName: 'REMEDIUM INVICTUS', rank: 1, totalPts: 180, trendDelta: 2 },
    { teamId: 't2', teamName: 'KYZON ESPORTS', rank: 2, totalPts: 165, trendDelta: 0 },
    { teamId: 't3', teamName: 'HYPERION SQUAD', rank: 3, totalPts: 150, trendDelta: -1 },
    { teamId: 't4', teamName: 'PARIS CHITAURI', rank: 4, totalPts: 135, trendDelta: 1 },
    { teamId: 't5', teamName: 'VORTEX ONE', rank: 5, totalPts: 120, trendDelta: -2 },
  ];

  const currentPage = data.page || 1;
  const pageSize = 5;
  const totalPages = Math.max(Math.ceil(rawTeams.length / pageSize), 1);
  const startIdx = (currentPage - 1) * pageSize;

  const pageSlice = rawTeams.slice(startIdx, startIdx + pageSize);

  const displayTeams: FlexibleTop5TeamData[] = Array.from({ length: 5 }, (_, i) => {
    const item = pageSlice[i];
    if (item) {
      return {
        id: item.id || item.teamId,
        teamId: item.teamId || item.id,
        teamName: item.teamName || item.name || `TEAM ${startIdx + i + 1}`,
        logoUrl: item.logoUrl || item.logo || null,
        slot: item.slot || null,
        rank: item.rank || startIdx + i + 1,
        totalPts: item.totalPts ?? item.points ?? 0,
        trendDelta: item.trendDelta ?? null,
      };
    }
    return {
      teamId: '',
      teamName: `TEAM ${startIdx + i + 1}`,
      logoUrl: null,
      rank: startIdx + i + 1,
      totalPts: 0,
      trendDelta: null,
    };
  });

  const resolvedMode = data.hybridEraMode || styleConfig.hybridEraMode || 'daily';
  const selectedGroup = data.selectedGroup || styleConfig.selectedGroup;
  const selectedMap = data.selectedMap || styleConfig.selectedMap;
  const groupPrefix = selectedGroup && selectedGroup !== 'all' ? `${selectedGroup.toUpperCase()} — ` : '';
  const mapSuffix = selectedMap && selectedMap !== 'none' ? ` (${selectedMap.toUpperCase()})` : '';

  let defaultSubheaderText = 'LIVE OVERLAY GRAPHIC';
  if (resolvedMode === 'collation') {
    defaultSubheaderText = `${groupPrefix}OVERALL COLLATION${mapSuffix}`;
  } else {
    const dayStr = data.day ? `DAY ${data.day}` : '';
    const lobbyStr = data.lobby ? `LOBBY ${data.lobby}` : '';
    const lobbyDetail = dayStr || lobbyStr ? `${dayStr}${dayStr && lobbyStr ? ' · ' : ''}${lobbyStr}` : 'AFTER GAME ONE';
    defaultSubheaderText = `${groupPrefix}${lobbyDetail}${mapSuffix}`;
  }

  const resolvedSubheader =
    data.hybridEraSubheader ||
    data.graphicSubtitle ||
    data.subheader ||
    styleConfig.hybridEraSubheader ||
    graphicSubtitle ||
    defaultSubheaderText;

  const resolvedTitle =
    graphicTitle ||
    data.graphicTitle ||
    (resolvedMode === 'collation' ? 'TOP 5 COLLATED' : 'TOURNAMENT STANDINGS');
  const hasBrandingLogo = Boolean(brandingLogoUrl);
  const hasTourneyLogo = Boolean(tournamentLogos && tournamentLogos[0]?.logoUrl);

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: bgColor,
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textPrimary,
        fontFamily: '"Orbitron", "Rajdhani", "Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@700;800&display=swap');`,
        }}
      />

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

      {isCustom && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.52)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '400px',
          background: `radial-gradient(ellipse at center, ${hexToRgba(accent, 0.1)} 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 80px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── TOP HEADER ────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '48px' }}>
            {hasBrandingLogo && (
              <img
                src={brandingLogoUrl}
                alt="Branding"
                referrerPolicy="no-referrer"
                style={{ height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
              />
            )}
            {hasBrandingLogo && hasTourneyLogo && <span style={{ fontSize: '18px', fontWeight: 700, color: textMuted }}>✕</span>}
            {hasTourneyLogo && (
              <img
                src={tournamentLogos![0].logoUrl}
                alt="Tournament"
                referrerPolicy="no-referrer"
                style={{ height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
              />
            )}
            {!hasBrandingLogo && !hasTourneyLogo && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: textMuted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: '"Orbitron", sans-serif',
                }}
              >
                {brandingName?.split('\n')[0] || 'HEAVEN STAT ENGINE'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {hybridTopRightLogoUrl ? (
              <img
                src={hybridTopRightLogoUrl}
                alt="Brand logo"
                referrerPolicy="no-referrer"
                style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                  textShadow: `0 0 12px ${hexToRgba(accent, 0.3)}`,
                }}
              >
                {resolvedSubheader}
              </span>
            )}
          </div>
        </div>

        {/* ── MAIN TITLE & SUBTITLE ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: '-10px', marginBottom: '10px' }}>
          <h1
            style={{
              fontSize: '66px',
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: accent,
              textTransform: 'uppercase',
              margin: 0,
              fontFamily: '"Orbitron", sans-serif',
              lineHeight: 1,
              textShadow: `0 0 25px ${hexToRgba(accent, 0.4)}, 0 4px 15px rgba(0, 0, 0, 0.95)`,
            }}
          >
            {resolvedTitle}
          </h1>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: textMuted,
              marginTop: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            }}
          >
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* ── TEAM CARDS (5 ROWS) ───────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {displayTeams.map((team, index) => (
            <FlexibleTop5Bar
              key={team.id || `team-${startIdx + index}`}
              team={team}
              index={index}
              accent={accent}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textPrimary={textPrimary}
              scoreColor={scoreColor}
              isLight={isLight}
            />
          ))}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              textShadow: `0 2px 8px ${hexToRgba(accent, 0.3)}`,
            }}
          >
            {brandingName ? brandingName.replace('\n', ' · ').toUpperCase() : 'HEAVEN STAT ENGINE · LIVE BROADCAST'}
          </span>
        </div>
      </div>
    </div>
  );
}
