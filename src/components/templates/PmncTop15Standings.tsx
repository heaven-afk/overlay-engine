'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface PmncTop15StandingsProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(229, 169, 60, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 229, g = 169, b = 60;
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

// Inline Team Logo with fallback initials
function TeamLogo({
  logoUrl,
  name,
  size = 36,
  accent = '#E5A93C',
  isLight = false,
}: {
  logoUrl?: string | null;
  name?: string;
  size?: number;
  accent?: string;
  isLight?: boolean;
}) {
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
          backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.4)',
          border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
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
        backgroundColor: hexToRgba(accent, isLight ? 0.12 : 0.16),
        border: `1px solid ${hexToRgba(accent, isLight ? 0.4 : 0.45)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${fontSize}px`,
        color: accent,
        fontFamily: "var(--heading-font, 'Outfit', sans-serif)",
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
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
    sponsorFooterText = 'KRAFTON · LEVEL INFINITE · LIGHTSPEED STUDIOS · INFINIX',
    headingFont = 'Outfit',
    bodyFont = 'Inter',

    // PMNC Customizations
    pmncBackgroundMode,
    pmncTopLeftLogoUrl,
    pmncTopLeftTitle,
    pmncTopLeftSubtitle,
    pmncTopLeftFont,
    pmncTopLeftTitleSize = 18,
    pmncTopLeftSubtitleSize = 11,
    pmncTopLeftShowLogo = true,
    pmncTopLeftShowText = true,

    pmncTopRightLogoUrl,
    pmncTopRightTitle,
    pmncTopRightSubtitle,
    pmncTopRightFont,
    pmncTopRightTitleSize = 18,
    pmncTopRightSubtitleSize = 11,
    pmncTopRightShowLogo = true,
    pmncTopRightShowText = true,

    pmncTitleFont,
    pmncTitleFontSize = 46,
    pmncStageBadgeFont,
    pmncStageBadgeFontSize = 13,
    pmncTableFont,
    pmncTableFontSize,
  } = styleConfig;

  // Global theme resolution matching Top 5 Graphic
  const resolvedBgMode: 'dark' | 'light' | 'custom' =
    (pmncBackgroundMode === 'white' || colorTheme === 'light')
      ? 'light'
      : (pmncBackgroundMode === 'custom' || colorTheme === 'custom')
        ? 'custom'
        : 'dark';

  const isDark = resolvedBgMode === 'dark';
  const isLight = resolvedBgMode === 'light';
  const isCustom = resolvedBgMode === 'custom';

  const accent = accentColor || '#E5A93C';
  const canvaBgUrl = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;

  // Background styles
  let bgColor = isLight ? '#F8FAFC' : '#040406';
  let bgImage: string | undefined;

  if (isCustom && customBackgroundUrl && !canvaBgUrl) {
    bgImage = `url(${customBackgroundUrl})`;
  } else if (isLight) {
    bgImage = 'radial-gradient(circle at 50% 20%, #F8FAFC 0%, #E2E8F0 55%, #CBD5E1 100%)';
  } else {
    // Pure Obsidian Dark Gradient matching Global Top 5
    bgImage = 'radial-gradient(ellipse at 50% 25%, #12151F 0%, #08090E 55%, #020204 100%)';
  }

  // Card Backgrounds
  const cardBg = isLight
    ? 'rgba(255, 255, 255, 0.96)'
    : 'linear-gradient(180deg, rgba(14, 16, 23, 0.95) 0%, rgba(8, 10, 14, 0.98) 100%)';

  const cardBorder = isLight
    ? '1px solid rgba(0, 0, 0, 0.08)'
    : '1px solid rgba(255, 255, 255, 0.09)';

  const tableHeaderBg = isLight
    ? '#F1F5F9'
    : 'linear-gradient(90deg, rgba(20, 24, 34, 0.98) 0%, rgba(15, 18, 26, 0.98) 100%)';

  const tableHeaderBorder = `2px solid ${accent}`;

  const textPrimary = isLight ? '#0F172A' : '#FFFFFF';
  const textMuted = isLight ? '#64748B' : '#94A3B8';

  // Resolve Team Dataset
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

  // Mock data for preview
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

  // Pagination & Team Count
  const pageSize = Number(topN) || 15;
  const activePage = Number(data?.page || styleConfig.page || 1);
  const rankOffset = styleConfig.rankOffset !== undefined
    ? Number(styleConfig.rankOffset)
    : (activePage - 1) * pageSize;

  const startIdx = (activePage - 1) * pageSize;
  const pageSlice = rawTeams.slice(startIdx, startIdx + pageSize);

  // Map rows
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

  // Dynamic row sizing for 1080p fit
  const rowCount = Math.max(rows.length, 1);
  const rowHeight = Math.min(48, Math.max(36, Math.floor(690 / rowCount)));
  const logoSize = Math.max(26, Math.min(34, rowHeight - 6));
  const autoFontSize = Math.min(17, Math.max(13, Math.floor(rowHeight * 0.42)));
  const rankFontSize = Math.min(21, Math.max(15, Math.floor(rowHeight * 0.46)));
  const teamFontSize = pmncTableFontSize ? Number(pmncTableFontSize) : autoFontSize;

  const resolvedStageBadge =
    stageBadgeText ||
    graphicSubtitle ||
    (data?.day ? `STAGE ${data.day}` : '');

  // Parse Branding default parts
  const brandingParts = brandingName
    ? (brandingName.includes('\n') ? brandingName.split('\n') : brandingName.split('/'))
    : ['HEAVEN STAT ENGINE', 'AFRICAN CODM BR COVERAGE'];
  const defaultBrandOrg = (brandingParts[0] || 'HEAVEN STAT ENGINE').trim();
  const defaultBrandSub = (brandingParts[1] || 'AFRICAN CODM BR COVERAGE').trim();

  // Top Left values
  const leftLogo = pmncTopLeftLogoUrl !== undefined ? pmncTopLeftLogoUrl : brandingLogoUrl;
  const leftTitle = pmncTopLeftTitle !== undefined ? pmncTopLeftTitle : defaultBrandOrg;
  const leftSubtitle = pmncTopLeftSubtitle !== undefined ? pmncTopLeftSubtitle : defaultBrandSub;
  const leftFont = pmncTopLeftFont || headingFont || 'Outfit';

  // Top Right values
  const rightLogo = pmncTopRightLogoUrl !== undefined ? pmncTopRightLogoUrl : (tournamentLogos?.[0]?.logoUrl || '');
  const rightTitle = pmncTopRightTitle !== undefined ? pmncTopRightTitle : 'PMNC 2024';
  const rightSubtitle = pmncTopRightSubtitle !== undefined ? pmncTopRightSubtitle : 'CHAMPIONSHIP';
  const rightFont = pmncTopRightFont || headingFont || 'Outfit';

  // Center Title & Stage Font
  const centerTitleFont = pmncTitleFont || headingFont || 'Impact';
  const stageBadgeFont = pmncStageBadgeFont || headingFont || 'Outfit';
  const tableFont = pmncTableFont || headingFont || 'Impact';

  // Collect Google Fonts to dynamically inject
  const fontsToLoad = [
    headingFont,
    bodyFont,
    pmncTopLeftFont,
    pmncTopRightFont,
    pmncTitleFont,
    pmncStageBadgeFont,
    pmncTableFont,
  ]
    .filter(Boolean)
    .map((f) => f!.trim().replace(/ /g, '+'));
  const uniqueFonts = [...new Set(fontsToLoad)];
  const fontsImportUrl = uniqueFonts.length > 0
    ? `https://fonts.googleapis.com/css2?${uniqueFonts.map((f) => `family=${f}:wght@400;600;700;800;900`).join('&')}&display=swap`
    : null;

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: `var(--body-font, '${bodyFont || 'Inter'}', sans-serif)`,
        color: textPrimary,
        backgroundColor: bgColor,
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dynamic Google Fonts loader */}
      {fontsImportUrl && (
        <style>{`@import url('${fontsImportUrl}');`}</style>
      )}

      {/* Canva Background Iframe */}
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

      {/* Atmospheric lighting */}
      {isDark && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% -5%, ${hexToRgba(accent, 0.22)} 0%, transparent 65%)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.9) 100%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        </>
      )}

      {isCustom && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(4, 4, 6, 0.72)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Main Broadcast Layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 80px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── TOP HEADER SECTION ────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1540px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            gap: '24px',
          }}
        >
          {/* Top Left: Clean HUD Box (No Discord embed thick borders) */}
          <div
            style={{
              minWidth: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            {(pmncTopLeftShowLogo && leftLogo) || (pmncTopLeftShowText && (leftTitle || leftSubtitle)) ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '7px 14px',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.85)'
                    : 'rgba(16, 19, 27, 0.75)',
                  border: isLight
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  boxShadow: isLight
                    ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Top Left Logo */}
                {pmncTopLeftShowLogo && leftLogo && (
                  <img
                    src={leftLogo}
                    alt="Brand Logo"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{
                      height: '42px',
                      maxWidth: '100px',
                      objectFit: 'contain',
                    }}
                  />
                )}

                {/* Top Left Text Box */}
                {pmncTopLeftShowText && (leftTitle || leftSubtitle) && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {leftTitle && (
                      <span
                        style={{
                          fontSize: `${pmncTopLeftTitleSize}px`,
                          fontWeight: 900,
                          letterSpacing: '0.06em',
                          color: textPrimary,
                          lineHeight: '1.15',
                          fontFamily: `'${leftFont}', sans-serif`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {leftTitle}
                      </span>
                    )}
                    {leftSubtitle && (
                      <span
                        style={{
                          fontSize: `${pmncTopLeftSubtitleSize}px`,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          color: accent,
                          textTransform: 'uppercase',
                          fontFamily: `'${leftFont}', sans-serif`,
                          marginTop: '2px',
                        }}
                      >
                        {leftSubtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Top Center: Stage Pill & Main Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              flex: 1,
            }}
          >
            {/* Stage Badge Pill */}
            {resolvedStageBadge && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 18px',
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${hexToRgba(accent, 0.6)}`,
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: `${pmncStageBadgeFontSize}px`,
                    fontWeight: 900,
                    color: isLight ? '#0F172A' : '#F1F5F9',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontFamily: `'${stageBadgeFont}', sans-serif`,
                  }}
                >
                  {resolvedStageBadge}
                </span>
              </div>
            )}

            {/* Hero Title */}
            <h1
              style={{
                fontSize: `${pmncTitleFontSize}px`,
                fontWeight: 900,
                lineHeight: '1.05',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: `'${centerTitleFont}', sans-serif`,
                background: isLight
                  ? 'linear-gradient(180deg, #0F172A 0%, #334155 100%)'
                  : `linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 50%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: isLight ? 'none' : 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.75))',
              }}
            >
              {graphicTitle}
            </h1>
          </div>

          {/* Top Right: Clean HUD Box (No Discord embed thick borders) */}
          <div
            style={{
              minWidth: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {(pmncTopRightShowLogo && rightLogo) || (pmncTopRightShowText && (rightTitle || rightSubtitle)) ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '7px 14px',
                  background: isLight
                    ? 'rgba(255, 255, 255, 0.85)'
                    : 'rgba(16, 19, 27, 0.75)',
                  border: isLight
                    ? '1px solid rgba(0, 0, 0, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  boxShadow: isLight
                    ? '0 2px 8px rgba(0, 0, 0, 0.05)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Top Right Text Box */}
                {pmncTopRightShowText && (rightTitle || rightSubtitle) && (
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', minWidth: 0 }}>
                    {rightTitle && (
                      <span
                        style={{
                          fontSize: `${pmncTopRightTitleSize}px`,
                          fontWeight: 900,
                          letterSpacing: '0.08em',
                          color: textPrimary,
                          lineHeight: '1.15',
                          fontFamily: `'${rightFont}', sans-serif`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {rightTitle}
                      </span>
                    )}
                    {rightSubtitle && (
                      <span
                        style={{
                          fontSize: `${pmncTopRightSubtitleSize}px`,
                          fontWeight: 800,
                          letterSpacing: '0.14em',
                          color: accent,
                          textTransform: 'uppercase',
                          fontFamily: `'${rightFont}', sans-serif`,
                          marginTop: '2px',
                        }}
                      >
                        {rightSubtitle}
                      </span>
                    )}
                  </div>
                )}

                {/* Top Right Logo */}
                {pmncTopRightShowLogo && rightLogo && (
                  <img
                    src={rightLogo}
                    alt="Tournament Crest"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{
                      height: '42px',
                      maxWidth: '100px',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── MAIN LEADERBOARD TABLE CARD ─────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1540px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 12, 17, 0.96)',
            background: cardBg,
            border: cardBorder,
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: isLight
              ? '0 10px 30px rgba(0, 0, 0, 0.08)'
              : '0 16px 48px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            position: 'relative',
          }}
        >
          {/* Table Header Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 140px 140px 140px 160px',
              alignItems: 'center',
              background: tableHeaderBg,
              borderBottom: tableHeaderBorder,
              padding: '9px 24px',
              boxSizing: 'border-box',
              color: isLight ? '#475569' : '#94A3B8',
              fontFamily: `'${tableFont}', sans-serif`,
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: 'center' }}>RANK</div>
            <div style={{ paddingLeft: '16px' }}>TEAM</div>
            <div style={{ textAlign: 'center' }}>WINS</div>
            <div style={{ textAlign: 'center' }}>PLC.PTS</div>
            <div style={{ textAlign: 'center' }}>KILLS</div>
            <div style={{ textAlign: 'center', color: accent }}>TOT.PTS</div>
          </div>

          {/* Table Rows Container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2px 0',
              boxSizing: 'border-box',
            }}
          >
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const isTop1 = row.rank === 1;
              const isTop2 = row.rank === 2;
              const isTop3 = row.rank === 3;

              // Rank text color: Clean numbers (no # symbol)
              const rankColor = isTop1
                ? accent
                : isTop2
                  ? (isLight ? '#334155' : '#E2E8F0')
                  : isTop3
                    ? (isLight ? '#9A3412' : '#F97316')
                    : textMuted;

              return (
                <div
                  key={`${row.rank}-${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 140px 140px 140px 160px',
                    alignItems: 'center',
                    height: `${rowHeight}px`,
                    padding: '0 24px',
                    boxSizing: 'border-box',
                    backgroundColor: isTop1
                      ? hexToRgba(accent, isLight ? 0.08 : 0.08)
                      : isEven
                        ? (isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.015)')
                        : 'transparent',
                    borderBottom: idx === rows.length - 1 ? 'none' : (isLight ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid rgba(255, 255, 255, 0.035)'),
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Clean Numeric Rank (No '#' symbol, no bulky badges) */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${rankFontSize}px`,
                      fontWeight: isTop1 || isTop2 || isTop3 ? 900 : 800,
                      fontFamily: `'${tableFont}', sans-serif`,
                      letterSpacing: '0.02em',
                      color: rankColor,
                    }}
                  >
                    {row.rank}
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
                    <TeamLogo
                      logoUrl={row.logoUrl}
                      name={row.teamName}
                      size={logoSize}
                      accent={accent}
                      isLight={isLight}
                    />
                    <span
                      style={{
                        fontSize: `${teamFontSize}px`,
                        fontWeight: 900,
                        fontFamily: `'${tableFont}', sans-serif`,
                        letterSpacing: '0.04em',
                        color: textPrimary,
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
                      fontSize: `${autoFontSize}px`,
                      fontWeight: 800,
                      color: row.wins > 0 ? textPrimary : textMuted,
                    }}
                  >
                    {row.wins > 0 ? row.wins : '-'}
                  </div>

                  {/* Placement Points */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${autoFontSize}px`,
                      fontWeight: 800,
                      color: row.placementPts > 0 ? textPrimary : textMuted,
                    }}
                  >
                    {row.placementPts > 0 ? row.placementPts : '-'}
                  </div>

                  {/* Kills */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${autoFontSize}px`,
                      fontWeight: 800,
                      color: row.kills > 0 ? textPrimary : textMuted,
                    }}
                  >
                    {row.kills > 0 ? row.kills : '-'}
                  </div>

                  {/* Total Points (Bold accent highlight) */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${autoFontSize + 3}px`,
                      fontWeight: 900,
                      fontFamily: `'${tableFont}', sans-serif`,
                      letterSpacing: '0.02em',
                      color: accent,
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
            maxWidth: '1540px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '10px',
            padding: '0 4px',
            boxSizing: 'border-box',
          }}
        >
          {/* Sponsors brand line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: textMuted,
                textTransform: 'uppercase',
                fontFamily: `'${headingFont || 'Outfit'}', sans-serif`,
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
                letterSpacing: '0.16em',
                color: textMuted,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              STATS BY HEAVEN <span style={{ color: accent }}>✦</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
