import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl, cleanEntityName } from './SharedElements';

interface Top5GraphicProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

// Inline Team Logo — renders image if valid HTTP URL, otherwise initials badge
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

// Sparkle/Lens Flare SVG — accent-coloured
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

// ── Utility: hex → rgba ────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(201, 168, 76, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 201, g = 168, b = 76;
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

export const Top5Graphic: React.FC<Top5GraphicProps> = ({ data, styleConfig }) => {
  const {
    graphicTitle,
    graphicSubtitle,
    hybridEraMode = 'daily',
    hybridEraSubheader,
    dailyPointsColumn = 'totalPts',
    brandingLogoUrl,
    tournamentLogos,
    hybridTopRightLogoUrl,
    selectedGroup,
    selectedMap,
    accentColor,
    colorTheme,
    customBackgroundUrl,
  } = styleConfig;

  // Resolved accent — fallback to gold if unset
  const accent = accentColor || '#C9A84C';
  const isLight = colorTheme === 'light';
  const isCustom = colorTheme === 'custom';

  // Resolve background
  const canvaBgUrl =
    isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;

  // Text colours adapt to theme
  const textPrimary = isLight ? '#111118' : '#FFFFFF';
  const textMuted = isLight ? '#555566' : 'rgba(255,255,255,0.65)';

  // Background styles
  let bgColor = isLight ? '#F5F0E8' : '#050403';
  let bgImage: string | undefined;

  if (isCustom && customBackgroundUrl && !canvaBgUrl) {
    bgImage = `url(${customBackgroundUrl})`;
  } else if (!isLight) {
    bgImage = 'radial-gradient(circle at 50% 35%, #18140a 0%, #090704 65%, #000000 100%)';
  } else {
    bgImage = 'radial-gradient(circle at 50% 20%, #f5f0e8 0%, #e8e0cc 55%, #d4c8a8 100%)';
  }

  // Card background gradient
  const cardBg = isLight
    ? 'linear-gradient(90deg, rgba(235,228,210,0.98) 0%, rgba(245,240,228,0.98) 50%, rgba(230,222,200,0.98) 100%)'
    : 'linear-gradient(90deg, rgba(20,16,8,0.96) 0%, rgba(38,30,14,0.96) 30%, rgba(48,38,18,0.96) 60%, rgba(22,17,9,0.96) 100%)';

  // Card border
  const cardBorder = `1.5px solid ${hexToRgba(accent, 0.75)}`;

  // Score colour
  const scoreColor = isLight ? '#111118' : '#FFFFFF';

  // Retrieve raw teams data and strictly slice to top 5
  const rawTeams: any[] = data?.rows || data?.teams || data?.results || [];
  const teams = rawTeams.slice(0, 5);

  // Pad to 5 rows for clean preview layout
  const displayTeams = Array.from({ length: 5 }, (_, i) => {
    if (teams[i]) return teams[i];
    return {
      rank: i + 1,
      teamName: `TEAM ${i + 1}`,
      logoUrl: '',
      totalPoints: 0,
      totalPts: 0,
      kills: 0,
      placementPts: 0,
    };
  });

  // Resolve subheader text (top-right badge)
  const groupPrefix =
    selectedGroup && selectedGroup !== 'all' ? `${selectedGroup.toUpperCase()} — ` : '';
  const mapSuffix =
    selectedMap && selectedMap !== 'none' ? ` (${selectedMap.toUpperCase()})` : '';
  const resolvedSubheader =
    hybridEraSubheader ||
    graphicSubtitle ||
    `${groupPrefix}${hybridEraMode === 'collation' ? 'OVERALL COLLATION' : 'AFTER GAME ONE'}${mapSuffix}`;

  // Resolve main title
  const resolvedTitle =
    graphicTitle || (hybridEraMode === 'collation' ? 'TOP 5 COLLATED' : 'TOP 5 TEAMS');

  // Extract score value based on selected column
  const getScoreValue = (team: any) => {
    if (dailyPointsColumn === 'kills') {
      return team.kills ?? team.scores?.kills ?? 0;
    }
    if (dailyPointsColumn === 'placementPts') {
      return team.placementPoints ?? team.placementPts ?? team.scores?.placementPts ?? 0;
    }
    return team.totalPoints ?? team.totalPts ?? team.scores?.totalPts ?? 0;
  };

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
      {/* Google Fonts: Orbitron & Rajdhani */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@700;800&display=swap');`,
        }}
      />

      {/* Canva background iframe */}
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

      {/* Custom background scrim */}
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

      {/* Accent ambient glow overlays */}
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
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '700px',
          height: '700px',
          background: `radial-gradient(circle at center, ${hexToRgba(accent, 0.07)} 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Main Content */}
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
          {/* Top Left: Branding & Tournament Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '48px' }}>
            {hasBrandingLogo && (
              <img
                src={brandingLogoUrl}
                alt="Branding"
                referrerPolicy="no-referrer"
                style={{ height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
              />
            )}

            {hasBrandingLogo && hasTourneyLogo && (
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: textMuted,
                  fontFamily: 'sans-serif',
                }}
              >
                ✕
              </span>
            )}

            {hasTourneyLogo && (
              <img
                src={tournamentLogos![0].logoUrl}
                alt="Tournament"
                referrerPolicy="no-referrer"
                style={{ height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
              />
            )}

            {/* Fallback org name if no logos */}
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
                {styleConfig.brandingName?.split('\n')[0] || 'LIVE BROADCAST'}
              </span>
            )}
          </div>

          {/* Top Right: custom logo image or subheader badge */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {hybridTopRightLogoUrl ? (
              <img
                src={hybridTopRightLogoUrl}
                alt="Top-right brand logo"
                referrerPolicy="no-referrer"
                style={{
                  maxHeight: '80px',
                  maxWidth: '240px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))',
                }}
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

        {/* ── MAIN TITLE ────────────────────────────────────────────── */}
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
          {displayTeams.map((team: any, index: number) => {
            const rawName = team.teamName || team.clanName || `TEAM ${index + 1}`;
            const teamName = cleanEntityName(rawName);
            const score = getScoreValue(team);

            return (
              <div
                key={team.teamId || team.id || index}
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
                  padding: '0 40px 0 10px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Sparkle accent */}
                <SparkleFlare accent={accent} />

                {/* Left Side: Logo + Team Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                  {/* Logo Box */}
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '10px',
                      backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : '#090806',
                      border: `1.5px solid ${hexToRgba(accent, 0.65)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      flexShrink: 0,
                    }}
                  >
                    <TeamLogo logoUrl={team.logoUrl} name={teamName} size={74} accent={accent} />
                  </div>

                  {/* Team Name */}
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: 900,
                      color: textPrimary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                      textShadow: isLight ? 'none' : '0 2px 12px rgba(0,0,0,0.9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '850px',
                    }}
                  >
                    {teamName}
                  </span>
                </div>

                {/* Right Side: Score */}
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
                  }}
                >
                  {score}
                </span>
              </div>
            );
          })}
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
            {styleConfig.brandingName
              ? styleConfig.brandingName.replace('\n', ' · ').toUpperCase()
              : 'LIVE BROADCAST'}
          </span>
        </div>
      </div>
    </div>
  );
};
