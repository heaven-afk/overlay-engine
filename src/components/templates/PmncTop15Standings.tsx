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
function TeamLogo({
  logoUrl,
  name,
  size = 38,
  isLight = false,
}: {
  logoUrl?: string | null;
  name?: string;
  size?: number;
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
          backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.5)',
          border: isLight ? '1px solid rgba(229, 169, 60, 0.5)' : '1px solid rgba(229, 169, 60, 0.4)',
          padding: '2px',
          boxSizing: 'border-box',
          flexShrink: 0,
          display: 'block',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
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
        backgroundColor: isLight ? 'rgba(229, 169, 60, 0.15)' : 'rgba(229, 169, 60, 0.2)',
        border: '1px solid rgba(229, 169, 60, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${fontSize}px`,
        color: isLight ? '#9A6208' : '#F5D07E',
        fontFamily: "var(--heading-font, 'Outfit', sans-serif)",
        flexShrink: 0,
        letterSpacing: '0.02em',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
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
        top: '100px',
        left: '24px',
        width: '46px',
        height: '800px',
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.7))',
      }}
    >
      <svg width="46" height="800" viewBox="0 0 46 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pmncRibbonGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7A1510" />
            <stop offset="35%" stopColor="#C43825" />
            <stop offset="65%" stopColor="#F5B338" />
            <stop offset="100%" stopColor="#1E120A" />
          </linearGradient>
          <pattern id="pmncTribalPattern" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 11 L11 0 L22 11 L11 22 Z" fill="#F5B338" opacity="0.4" />
            <circle cx="11" cy="11" r="3.5" fill="#FFFFFF" opacity="0.6" />
          </pattern>
        </defs>
        <path
          d="M23 10 C40 60 6 120 23 180 C40 240 6 300 23 360 C40 420 6 480 23 540 C40 600 6 660 23 720 C34 755 23 785 23 785"
          stroke="url(#pmncRibbonGrad)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M23 10 C40 60 6 120 23 180 C40 240 6 300 23 360 C40 420 6 480 23 540 C40 600 6 660 23 720 C34 755 23 785 23 785"
          stroke="url(#pmncTribalPattern)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M23 10 C40 60 6 120 23 180 C40 240 6 300 23 360 C40 420 6 480 23 540 C40 600 6 660 23 720 C34 755 23 785 23 785"
          stroke="#F5B338"
          strokeWidth="2.5"
          strokeDasharray="5 5"
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
    headingFont = 'Outfit',
    bodyFont = 'Inter',

    // PMNC Specific Additions
    pmncBackgroundMode,
    pmncTopLeftLogoUrl,
    pmncTopLeftTitle,
    pmncTopLeftSubtitle,
    pmncTopLeftFont,
    pmncTopLeftTitleSize = 20,
    pmncTopLeftSubtitleSize = 12,
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
    pmncTitleFontSize = 48,
    pmncStageBadgeFont,
    pmncStageBadgeFontSize = 14,
    pmncTableFont,
    pmncTableFontSize,
  } = styleConfig;

  // Resolve Background Mode: 'dark' | 'white' | 'custom'
  const resolvedBgMode: 'dark' | 'white' | 'custom' =
    pmncBackgroundMode || (colorTheme === 'light' ? 'white' : colorTheme === 'custom' ? 'custom' : 'dark');

  const isDark = resolvedBgMode === 'dark';
  const isWhite = resolvedBgMode === 'white';
  const isCustom = resolvedBgMode === 'custom';

  const canvaBgUrl = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;

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

  // Pagination & Team Count
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

  // Dynamic row sizing for 1080p fit
  const rowCount = Math.max(rows.length, 1);
  const rowHeight = Math.min(48, Math.max(36, Math.floor(690 / rowCount)));
  const logoSize = Math.max(26, Math.min(34, rowHeight - 6));
  const autoFontSize = Math.min(18, Math.max(13, Math.floor(rowHeight * 0.42)));
  const rankFontSize = Math.min(20, Math.max(14, Math.floor(rowHeight * 0.45)));
  const teamFontSize = pmncTableFontSize ? Number(pmncTableFontSize) : autoFontSize;

  const resolvedStageBadge =
    stageBadgeText ||
    graphicSubtitle ||
    (data?.day ? `PMNC GROUP STAGE - DAY ${data.day}` : 'PMNC KENYA GROUP STAGE - DAY 2');

  // Parse Branding default parts
  const brandingParts = brandingName
    ? (brandingName.includes('\n') ? brandingName.split('\n') : brandingName.split('/'))
    : ['PUBG MOBILE', 'ESPORTS'];
  const defaultBrandOrg = (brandingParts[0] || 'PUBG MOBILE').trim();
  const defaultBrandSub = (brandingParts[1] || 'ESPORTS').trim();

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
        color: isWhite ? '#18120C' : '#FFFFFF',
        backgroundColor: isWhite ? '#F8F6F2' : '#0B0704',
        backgroundImage: isCustom && customBackgroundUrl && !canvaBgUrl
          ? `url(${customBackgroundUrl})`
          : isWhite
            ? 'radial-gradient(ellipse at 50% 0%, #FFFFFF 0%, #F5EFE6 45%, #EBE2D3 80%, #DFD4C2 100%)'
            : 'radial-gradient(ellipse at 50% 12%, #381C0A 0%, #1E1006 40%, #0D0703 75%, #050302 100%)',
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

      {/* Atmospheric Broadcast Lighting */}
      {isDark && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% -10%, rgba(229, 169, 60, 0.32) 0%, transparent 65%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        </>
      )}

      {isWhite && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% -10%, rgba(229, 169, 60, 0.18) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(235,226,211,0.5) 70%, rgba(215,200,180,0.75) 100%)',
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
            background: 'linear-gradient(to bottom, rgba(10,6,3,0.3) 0%, rgba(10,6,3,0.7) 60%, rgba(5,3,1,0.92) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Decorative Ribbon Sash */}
      {showSideRibbon && <SideRibbon />}

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
          padding: '22px 65px 18px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── TOP HEADER SECTION ────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1480px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            gap: '20px',
          }}
        >
          {/* Top Left: Premium HUD Card (Logo + Text Box) */}
          <div
            style={{
              minWidth: '280px',
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
                  padding: '8px 16px',
                  background: isWhite
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(246, 240, 230, 0.92) 100%)'
                    : 'linear-gradient(135deg, rgba(24, 15, 9, 0.88) 0%, rgba(12, 8, 4, 0.92) 100%)',
                  border: '1.5px solid rgba(229, 169, 60, 0.6)',
                  borderLeft: '4px solid #E5A93C',
                  borderRadius: '8px',
                  boxShadow: isWhite
                    ? '0 6px 20px rgba(0, 0, 0, 0.08), inset 0 0 12px rgba(229, 169, 60, 0.12)'
                    : '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(229, 169, 60, 0.18)',
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
                      height: '48px',
                      maxWidth: '110px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))',
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
                          color: isWhite ? '#1F140A' : '#FFFFFF',
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
                          letterSpacing: '0.18em',
                          color: '#E5A93C',
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
                  padding: '4px 22px',
                  backgroundColor: isWhite ? 'rgba(35, 22, 12, 0.95)' : 'rgba(20, 12, 6, 0.92)',
                  border: '1.5px solid rgba(229, 169, 60, 0.75)',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(229, 169, 60, 0.25)',
                }}
              >
                <span
                  style={{
                    fontSize: `${pmncStageBadgeFontSize}px`,
                    fontWeight: 900,
                    color: '#F4DEB3',
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
                background: isWhite
                  ? 'linear-gradient(180deg, #381C0A 0%, #1A0D04 55%, #E5A93C 100%)'
                  : 'linear-gradient(180deg, #FFFFFF 0%, #F8E7C8 40%, #E5A93C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: isWhite ? 'none' : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.85))',
              }}
            >
              {graphicTitle}
            </h1>
          </div>

          {/* Top Right: Premium HUD Card (Text Box + Logo) */}
          <div
            style={{
              minWidth: '280px',
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
                  padding: '8px 16px',
                  background: isWhite
                    ? 'linear-gradient(135deg, rgba(246, 240, 230, 0.92) 0%, rgba(255, 255, 255, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(12, 8, 4, 0.92) 0%, rgba(24, 15, 9, 0.88) 100%)',
                  border: '1.5px solid rgba(229, 169, 60, 0.6)',
                  borderRight: '4px solid #E5A93C',
                  borderRadius: '8px',
                  boxShadow: isWhite
                    ? '0 6px 20px rgba(0, 0, 0, 0.08), inset 0 0 12px rgba(229, 169, 60, 0.12)'
                    : '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(229, 169, 60, 0.18)',
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
                          color: isWhite ? '#1F140A' : '#FFFFFF',
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
                          letterSpacing: '0.16em',
                          color: '#E5A93C',
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
                      height: '48px',
                      maxWidth: '110px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))',
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
            maxWidth: '1480px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isWhite
              ? 'rgba(255, 255, 255, 0.94)'
              : 'rgba(244, 226, 192, 0.92)',
            border: '2px solid rgba(229, 169, 60, 0.85)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: isWhite
              ? '0 12px 35px rgba(0, 0, 0, 0.15), inset 0 0 24px rgba(229, 169, 60, 0.12)'
              : '0 14px 44px rgba(0, 0, 0, 0.8), inset 0 0 32px rgba(229, 169, 60, 0.2)',
            position: 'relative',
          }}
        >
          {/* Table Header Bar (Dark Umber / Espresso with Metallic Trim) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 140px 140px 140px 170px',
              alignItems: 'center',
              backgroundColor: '#201208',
              borderBottom: '2.5px solid #E5A93C',
              padding: '9px 24px',
              boxSizing: 'border-box',
              color: '#F4DEB3',
              fontFamily: `'${tableFont}', sans-serif`,
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ textAlign: 'center' }}>RANK</div>
            <div style={{ paddingLeft: '16px' }}>TEAM</div>
            <div style={{ textAlign: 'center' }}>WINS</div>
            <div style={{ textAlign: 'center' }}>PLC.PTS</div>
            <div style={{ textAlign: 'center' }}>KILLS</div>
            <div style={{ textAlign: 'center', color: '#F5B338' }}>TOT.PTS</div>
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
                    backgroundColor: isTop1
                      ? 'rgba(229, 169, 60, 0.18)'
                      : isEven
                        ? 'rgba(0, 0, 0, 0.035)'
                        : 'transparent',
                    borderBottom: idx === rows.length - 1 ? 'none' : '1px solid rgba(80, 45, 18, 0.12)',
                    color: '#1A1108',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Rank Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isTop1 ? (
                      <div
                        style={{
                          padding: '2px 14px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #FFE89E 0%, #D89828 50%, #9A6208 100%)',
                          color: '#2A1700',
                          fontSize: `${rankFontSize}px`,
                          fontWeight: 900,
                          fontFamily: `'${tableFont}', sans-serif`,
                          letterSpacing: '0.04em',
                          boxShadow: '0 2px 8px rgba(216, 152, 40, 0.5)',
                        }}
                      >
                        #1
                      </div>
                    ) : isTop2 ? (
                      <div
                        style={{
                          padding: '2px 14px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 55%, #64748B 100%)',
                          color: '#1E293B',
                          fontSize: `${rankFontSize}px`,
                          fontWeight: 900,
                          fontFamily: `'${tableFont}', sans-serif`,
                          letterSpacing: '0.04em',
                          boxShadow: '0 2px 8px rgba(100, 116, 139, 0.3)',
                        }}
                      >
                        #2
                      </div>
                    ) : isTop3 ? (
                      <div
                        style={{
                          padding: '2px 14px',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #FDBA74 0%, #C2410C 55%, #7C2D12 100%)',
                          color: '#FFFFFF',
                          fontSize: `${rankFontSize}px`,
                          fontWeight: 900,
                          fontFamily: `'${tableFont}', sans-serif`,
                          letterSpacing: '0.04em',
                          boxShadow: '0 2px 8px rgba(194, 65, 12, 0.35)',
                        }}
                      >
                        #3
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: `${rankFontSize}px`,
                          fontWeight: 900,
                          fontFamily: `'${tableFont}', sans-serif`,
                          letterSpacing: '0.04em',
                          color: '#422814',
                        }}
                      >
                        #{row.rank}
                      </span>
                    )}
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
                    <TeamLogo logoUrl={row.logoUrl} name={row.teamName} size={logoSize} isLight={isWhite} />
                    <span
                      style={{
                        fontSize: `${teamFontSize}px`,
                        fontWeight: 900,
                        fontFamily: `'${tableFont}', sans-serif`,
                        letterSpacing: '0.04em',
                        color: '#180E06',
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
                      color: row.wins > 0 ? '#180E06' : '#8A7561',
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
                      color: row.placementPts > 0 ? '#180E06' : '#8A7561',
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
                      color: row.kills > 0 ? '#180E06' : '#8A7561',
                    }}
                  >
                    {row.kills > 0 ? row.kills : '-'}
                  </div>

                  {/* Total Points (Prominently Highlighted) */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: `${autoFontSize + 3}px`,
                      fontWeight: 900,
                      fontFamily: `'${tableFont}', sans-serif`,
                      letterSpacing: '0.02em',
                      color: '#A3290D',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
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
            maxWidth: '1480px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '10px',
            padding: '0 8px',
            boxSizing: 'border-box',
          }}
        >
          {/* Sponsors brand line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: isWhite ? '#4D3622' : '#F4DEB3',
                textTransform: 'uppercase',
                fontFamily: `'${headingFont || 'Outfit'}', sans-serif`,
                textShadow: isWhite ? 'none' : '0 2px 6px rgba(0,0,0,0.8)',
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
                color: isWhite ? 'rgba(77, 54, 34, 0.85)' : 'rgba(244, 222, 179, 0.85)',
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
