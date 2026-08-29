'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface MglYtLivestandingProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// ── Utility: hex → rgba ────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(192, 192, 192, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 192, g = 192, b = 192;
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

// ── Inline Team Logo with fallback initials ────────────────────────────────────
function TeamLogo({
  logoUrl,
  name,
  size = 84,
  accent,
}: {
  logoUrl?: string | null;
  name?: string;
  size?: number;
  accent: string;
}) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || '??').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'TM';
  const fontSize = Math.round(size * 0.36);
  const radius = '10px';

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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
          padding: '4px',
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
        background: hexToRgba(accent, 0.12),
        border: `1px solid ${hexToRgba(accent, 0.45)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        color: accent,
        fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
        flexShrink: 0,
        letterSpacing: '0.02em',
        textShadow: `0 0 10px ${hexToRgba(accent, 0.5)}`,
      }}
    >
      {initials}
    </div>
  );
}

// ── Rank Badge ─────────────────────────────────────────────────────────────────
function RankBadge({
  rank,
  accent,
  isLight,
}: {
  rank: number;
  accent: string;
  isLight: boolean;
}) {
  const isTop3 = rank <= 3;
  const medalColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const rankColor = isTop3 ? medalColors[rank] : (isLight ? '#555577' : 'rgba(255,255,255,0.6)');

  return (
    <div
      style={{
        width: '44px',
        height: '108px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
          fontSize: isTop3 ? '28px' : '22px',
          fontWeight: 900,
          color: rankColor,
          letterSpacing: '-0.02em',
          textShadow: isTop3 ? `0 0 12px ${rankColor}99` : 'none',
        }}
      >
        {rank}
      </span>
    </div>
  );
}

// ── Fallback mock teams ────────────────────────────────────────────────────────
const DEFAULT_MOCK_TEAMS = [
  { rank: 1, teamName: 'FAZE RAIDERS',       logoUrl: '', totalPts: 248, kills: 62, placementPts: 186 },
  { rank: 2, teamName: '21ST CENTURY',        logoUrl: '', totalPts: 231, kills: 58, placementPts: 173 },
  { rank: 3, teamName: 'DFL ESPORTS',         logoUrl: '', totalPts: 219, kills: 51, placementPts: 168 },
  { rank: 4, teamName: 'PARIS CHITAURI',      logoUrl: '', totalPts: 207, kills: 46, placementPts: 161 },
  { rank: 5, teamName: 'VORTEX ONE',          logoUrl: '', totalPts: 195, kills: 42, placementPts: 153 },
  { rank: 6, teamName: 'REMEDIUM INVICTUS',   logoUrl: '', totalPts: 184, kills: 38, placementPts: 146 },
  { rank: 7, teamName: 'ONYX ESPORTS',        logoUrl: '', totalPts: 172, kills: 34, placementPts: 138 },
  { rank: 8, teamName: 'HORIZON ONE',         logoUrl: '', totalPts: 160, kills: 30, placementPts: 130 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Template Component
// ─────────────────────────────────────────────────────────────────────────────
export const MglYtLivestanding: React.FC<MglYtLivestandingProps> = ({
  data = {},
  styleConfig = {} as TemplateStyleConfig,
  isPreview = false,
}) => {
  const {
    graphicTitle = 'TOP 8 TEAMS',
    graphicSubtitle,
    accentColor = '#C0C0C0',
    colorTheme = 'dark',
    customBackgroundUrl,
    dailyPointsColumn = 'totalPts',
    hybridEraMode = 'collation',
    brandingLogoUrl,
    tournamentLogos = [],
  } = styleConfig;

  const accent = accentColor || '#C0C0C0';
  const isLight = colorTheme === 'light';
  const isCustom = colorTheme === 'custom';

  // ── Resolve teams ──────────────────────────────────────────────────────────
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

  // Slice to Top 8
  const top8 = rawTeams.slice(0, 8).map((t: any, idx: number) => {
    let pts = t.totalPts ?? t.pts ?? t.totalPoints ?? 0;
    if (dailyPointsColumn === 'kills') pts = t.kills ?? 0;
    else if (dailyPointsColumn === 'placementPts') pts = t.placementPts ?? t.placePts ?? 0;

    return {
      rank: t.rank ?? (idx + 1),
      teamName: (t.teamName || t.name || t.clanName || `TEAM ${idx + 1}`).toUpperCase(),
      logoUrl: t.logoUrl || t.logo || null,
      pts,
    };
  });

  // Pad to 8 rows
  while (top8.length < 8) {
    const idx = top8.length;
    top8.push({ rank: idx + 1, teamName: `TEAM ${idx + 1}`, logoUrl: null, pts: 0 });
  }

  // ── Subheader ──────────────────────────────────────────────────────────────
  const resolvedMode = data.hybridEraMode || hybridEraMode || 'collation';
  let defaultSubheader = '';
  if (resolvedMode === 'daily') {
    const dayStr = data.day ? `DAY ${data.day}` : 'DAILY RESULTS';
    const lobbyStr = data.lobby ? ` · LOBBY ${data.lobby}` : '';
    defaultSubheader = `${dayStr}${lobbyStr}`;
  } else {
    defaultSubheader =
      data.selectedGroup && data.selectedGroup !== 'all'
        ? `${data.selectedGroup.toUpperCase()} COLLATION`
        : '';
  }
  const subheaderText = graphicSubtitle || data.graphicSubtitle || defaultSubheader;

  // ── Background resolution ──────────────────────────────────────────────────
  const canvaBg = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const textPrimary   = isLight ? '#0F0F1A' : '#FFFFFF';
  const textMuted     = isLight ? '#55557A' : 'rgba(255,255,255,0.55)';
  const bgBase        = isLight ? '#F2F4F8' : '#080A0F';
  const cardBg        = isLight
    ? 'linear-gradient(90deg, rgba(240,243,250,0.98) 0%, rgba(250,252,255,0.99) 50%, rgba(236,241,250,0.98) 100%)'
    : 'linear-gradient(90deg, rgba(14,18,27,0.96) 0%, rgba(20,25,38,0.94) 50%, rgba(13,17,26,0.96) 100%)';
  const cardBorder    = `1.8px solid ${hexToRgba(accent, isLight ? 0.5 : 0.65)}`;
  const cardShadow    = `0 4px 20px rgba(0,0,0,0.4), 0 0 16px ${hexToRgba(accent, 0.1)}`;
  const headerAccent  = accent;

  // ── Footer logos ───────────────────────────────────────────────────────────
  const mainLogoUrl    = brandingLogoUrl || '';
  const extra1LogoUrl  = tournamentLogos?.[0]?.logoUrl || '';
  const extra2LogoUrl  = tournamentLogos?.[1]?.logoUrl || '';
  const hasMainLogo    = Boolean(mainLogoUrl);
  const hasExtra1      = Boolean(extra1LogoUrl);
  const hasExtra2      = Boolean(extra2LogoUrl);
  const hasAnyLogo     = hasMainLogo || hasExtra1 || hasExtra2;

  return (
    <div
      style={{
        width: '713px',
        height: '2048px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: bgBase,
        fontFamily: 'var(--body-font, "Inter", sans-serif)',
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Google Fonts */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@700;800&display=swap');`,
        }}
      />

      {/* ─── BACKGROUND LAYER ───────────────────────────────────────────────── */}
      {isCustom && customBackgroundUrl && !canvaBg ? (
        <img
          src={customBackgroundUrl}
          alt="Custom Background"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
      ) : isCustom && canvaBg ? (
        <iframe
          src={canvaBg}
          scrolling="no"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 0, pointerEvents: 'none' }}
        />
      ) : isLight ? (
        /* Light theme background */
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse at 50% 0%, #EAECF5 0%, #F4F6FA 55%, #FAFBFD 100%)',
          }}
        >
          {/* Subtle halftone dot grid */}
          <div
            style={{
              position: 'absolute', inset: 0, opacity: 0.06,
              backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />
          {/* Top accent glow */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '420px',
              background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.12)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        /* Dark / metallic black theme background */
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse at 50% 20%, #101420 0%, #080A0F 55%, #030407 100%)',
          }}
        >
          {/* Micro dot grid */}
          <div
            style={{
              position: 'absolute', inset: 0, opacity: 0.055,
              backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px), radial-gradient(${hexToRgba(accent, 1)} 1px, #040408 1px)`,
              backgroundSize: '36px 36px',
              backgroundPosition: '0 0, 18px 18px',
            }}
          />
          {/* Diagonal chrome streak */}
          <div
            style={{
              position: 'absolute', top: '-10%', right: '-45%',
              width: '180%', height: '130%',
              background: `linear-gradient(135deg, transparent 46%, ${hexToRgba(accent, 0.08)} 49%, ${hexToRgba(accent, 0.22)} 50%, ${hexToRgba(accent, 0.07)} 51%, transparent 54%)`,
              transform: 'rotate(-14deg)',
              pointerEvents: 'none',
              filter: 'blur(4px)',
            }}
          />
          {/* Top ambient glow */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '420px',
              background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.14)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom ambient glow */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '600px', height: '500px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${hexToRgba(accent, 0.08)} 0%, transparent 70%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* ─── FOREGROUND CONTENT WRAPPER ──────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: '0 38px',
        }}
      >
        {/* TOP SPACER */}
        <div style={{ height: '310px', flexShrink: 0 }} />

        {/* ─── HEADER ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: '30px',
            width: '100%',
          }}
        >
          {/* Subheader badge */}
          {subheaderText && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 16px',
                borderRadius: '24px',
                backgroundColor: hexToRgba(accent, 0.12),
                border: `1px solid ${hexToRgba(accent, 0.4)}`,
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: isLight ? accent : headerAccent,
                textTransform: 'uppercase',
                fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
                boxShadow: `0 0 14px ${hexToRgba(accent, 0.2)}`,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }}
              />
              {subheaderText}
            </div>
          )}

          {/* Main title */}
          <h1
            style={{
              margin: 0,
              fontSize: '52px',
              fontWeight: 900,
              fontFamily: 'var(--heading-font, "Orbitron", "Rajdhani", sans-serif)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isLight ? '#111122' : '#FFFFFF',
              textShadow: isLight
                ? 'none'
                : `0 0 20px ${hexToRgba(accent, 0.4)}, 0 4px 12px rgba(0,0,0,0.9)`,
              lineHeight: 1.1,
            }}
          >
            {graphicTitle}
          </h1>

          {/* Accent underline bar */}
          <div
            style={{
              marginTop: '10px',
              width: '80px',
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.2)})`,
              boxShadow: `0 0 10px ${hexToRgba(accent, 0.5)}`,
            }}
          />
        </div>

        {/* Column header labels */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '52px',
            paddingRight: '8px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '108px', flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: textMuted,
              fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
              paddingLeft: '20px',
            }}
          >
            TEAM
          </div>
          <div
            style={{
              width: '96px',
              flexShrink: 0,
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: textMuted,
              fontFamily: 'var(--heading-font, "Orbitron", sans-serif)',
            }}
          >
            PTS
          </div>
        </div>

        {/* ─── STANDINGS TABLE (TOP 8 ROWS) ────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
          {top8.map((team, index) => {
            const isFirst  = index === 0;
            const isTop3   = index < 3;

            // First row: stronger accent glow. Others: subtle.
            const rowCardBorder = isFirst
              ? `2px solid ${hexToRgba(accent, 0.95)}`
              : `1.8px solid ${hexToRgba(accent, isLight ? 0.45 : 0.6)}`;
            const rowCardShadow = isFirst
              ? `${cardShadow}, inset 0 0 14px ${hexToRgba(accent, 0.12)}`
              : cardShadow;

            // First-row special card background with subtle accent tint
            const rowCardBg = isFirst
              ? isLight
                ? `linear-gradient(90deg, ${hexToRgba(accent, 0.08)} 0%, rgba(255,255,255,0.98) 50%, ${hexToRgba(accent, 0.06)} 100%)`
                : `linear-gradient(90deg, ${hexToRgba(accent, 0.14)} 0%, rgba(20,26,40,0.97) 45%, ${hexToRgba(accent, 0.10)} 100%)`
              : cardBg;

            return (
              <div
                key={`team-row-${team.rank}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0px',
                  width: '100%',
                  height: '108px',
                  boxSizing: 'border-box',
                }}
              >
                {/* ── Rank Badge ── */}
                <RankBadge rank={team.rank} accent={accent} isLight={isLight} />

                {/* ── Logo Box ── */}
                <div
                  style={{
                    width: '108px',
                    height: '108px',
                    borderRadius: '16px 0 0 16px',
                    border: rowCardBorder,
                    borderRight: 'none',
                    boxShadow: rowCardShadow,
                    background: isLight
                      ? 'rgba(255,255,255,0.95)'
                      : isFirst
                        ? `linear-gradient(135deg, ${hexToRgba(accent, 0.15)} 0%, rgba(16,20,32,0.97) 100%)`
                        : 'rgba(14,18,28,0.96)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  <TeamLogo logoUrl={team.logoUrl} name={team.teamName} size={84} accent={accent} />
                </div>

                {/* ── Team Name Box ── */}
                <div
                  style={{
                    flex: 1,
                    height: '108px',
                    border: rowCardBorder,
                    borderLeft: 'none',
                    borderRight: 'none',
                    boxShadow: rowCardShadow,
                    background: rowCardBg,
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Top-edge glass highlight */}
                  <div
                    style={{
                      position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* First-row left accent bar */}
                  {isFirst && (
                    <div
                      style={{
                        position: 'absolute', left: 0, top: '16px', bottom: '16px',
                        width: '3px',
                        borderRadius: '0 2px 2px 0',
                        background: accent,
                        boxShadow: `0 0 8px ${hexToRgba(accent, 0.7)}`,
                      }}
                    />
                  )}

                  <span
                    style={{
                      fontFamily: 'var(--heading-font, "Orbitron", "Rajdhani", sans-serif)',
                      fontSize: '28px',
                      fontWeight: 900,
                      color: isFirst
                        ? isLight ? '#0F0F22' : '#FFFFFF'
                        : textPrimary,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: isLight
                        ? 'none'
                        : isFirst
                          ? `0 0 16px ${hexToRgba(accent, 0.4)}`
                          : '0 2px 8px rgba(0,0,0,0.8)',
                    }}
                  >
                    {team.teamName}
                  </span>
                </div>

                {/* ── Points Box ── */}
                <div
                  style={{
                    width: '96px',
                    height: '108px',
                    borderRadius: '0 16px 16px 0',
                    border: rowCardBorder,
                    borderLeft: 'none',
                    boxShadow: rowCardShadow,
                    background: isFirst
                      ? isLight
                        ? `linear-gradient(135deg, ${hexToRgba(accent, 0.15)} 0%, rgba(248,250,255,0.98) 100%)`
                        : `linear-gradient(135deg, ${hexToRgba(accent, 0.22)} 0%, rgba(14,18,30,0.97) 100%)`
                      : isLight
                        ? 'rgba(240,243,252,0.98)'
                        : 'rgba(14,18,30,0.96)',
                    backdropFilter: 'blur(12px)',
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
                      fontSize: '38px',
                      fontWeight: 900,
                      color: isTop3
                        ? accent
                        : isLight ? '#111122' : '#FFFFFF',
                      letterSpacing: '0.02em',
                      textShadow: isTop3
                        ? `0 0 16px ${hexToRgba(accent, 0.6)}`
                        : isLight
                          ? 'none'
                          : '0 2px 10px rgba(0,0,0,0.8)',
                    }}
                  >
                    {team.pts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── GLOWING DIVIDER ─────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '2px',
            margin: '36px 0 32px 0',
            background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(accent, 0.35)} 15%, ${hexToRgba(accent, 0.85)} 50%, ${hexToRgba(accent, 0.35)} 85%, transparent 100%)`,
            boxShadow: `0 0 14px ${hexToRgba(accent, 0.5)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: accent,
              transform: 'rotate(45deg)',
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
        </div>

        {/* ─── FOOTER LOGO ZONE ────────────────────────────────────────────── */}
        {/*
          Bottom zone: blank when no logos set.
          Shows: [Main Logo] × [Extra Logo 1] × [Extra Logo 2]
          Logos sourced from brandingLogoUrl and tournamentLogos[0..1].
        */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '48px',
          }}
        >
          {hasAnyLogo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '28px',
                flexWrap: 'nowrap',
              }}
            >
              {/* Main Logo */}
              {hasMainLogo && (
                <img
                  src={mainLogoUrl}
                  alt="Main Logo"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  style={{
                    maxHeight: '130px',
                    maxWidth: '220px',
                    objectFit: 'contain',
                    display: 'block',
                    filter: isLight
                      ? 'drop-shadow(0 2px 12px rgba(0,0,0,0.2))'
                      : 'drop-shadow(0 4px 16px rgba(0,0,0,0.7))',
                  }}
                />
              )}

              {/* Separator 1 */}
              {hasMainLogo && hasExtra1 && (
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 300,
                    color: hexToRgba(accent, 0.6),
                    fontFamily: 'sans-serif',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  ×
                </span>
              )}

              {/* Extra Logo 1 */}
              {hasExtra1 && (
                <img
                  src={extra1LogoUrl}
                  alt="Partner Logo 1"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  style={{
                    maxHeight: '100px',
                    maxWidth: '180px',
                    objectFit: 'contain',
                    display: 'block',
                    filter: isLight
                      ? 'drop-shadow(0 2px 10px rgba(0,0,0,0.15))'
                      : 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))',
                  }}
                />
              )}

              {/* Separator 2 */}
              {hasExtra1 && hasExtra2 && (
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 300,
                    color: hexToRgba(accent, 0.6),
                    fontFamily: 'sans-serif',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  ×
                </span>
              )}

              {/* Extra Logo 2 */}
              {hasExtra2 && (
                <img
                  src={extra2LogoUrl}
                  alt="Partner Logo 2"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  style={{
                    maxHeight: '100px',
                    maxWidth: '180px',
                    objectFit: 'contain',
                    display: 'block',
                    filter: isLight
                      ? 'drop-shadow(0 2px 10px rgba(0,0,0,0.15))'
                      : 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
