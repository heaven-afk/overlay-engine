import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl, cleanEntityName } from './SharedElements';

interface HybridEraTop5Props {
  data: any;
  styleConfig: TemplateStyleConfig;
}

// Inline Team Logo component — renders image if valid HTTP URL, otherwise initials badge
function TeamLogo({ logoUrl, name, size }: { logoUrl?: string | null; name?: string; size: number }) {
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
        backgroundColor: 'rgba(230, 190, 90, 0.12)',
        border: '1px solid rgba(230, 190, 90, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${Math.round(size * 0.38)}px`,
        color: '#E6BE5A',
        fontFamily: '"Orbitron", "Rajdhani", sans-serif',
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}

// Sparkle/Lens Flare SVG component for card top-right accent
function SparkleFlare() {
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
        filter: 'drop-shadow(0 0 6px #E6BE5A)',
        pointerEvents: 'none',
      }}
    >
      <path
        d="M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8L12 0Z"
        fill="url(#sparkleGrad)"
      />
      <defs>
        <radialGradient id="sparkleGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFF2B2" />
          <stop offset="100%" stopColor="#E6BE5A" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Default Remedium Gaming logo badge
function RemediumLogoBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #111115 0%, #1a1610 100%)',
          border: '1px solid rgba(230, 190, 90, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 900,
            fontFamily: '"Orbitron", sans-serif',
            color: '#FF4D12',
            lineHeight: 1,
          }}
        >
          RDM
        </span>
        <span
          style={{
            fontSize: '6px',
            fontWeight: 800,
            fontFamily: 'sans-serif',
            color: '#E6BE5A',
            letterSpacing: '0.1em',
            marginTop: '2px',
          }}
        >
          REMEDIUM
        </span>
      </div>
    </div>
  );
}

// Default Fabrizio Mayowa FM logo shield badge
function FMLogoBadge() {
  return (
    <div
      style={{
        width: '36px',
        height: '42px',
        background: '#0D0D10',
        border: '1.5px solid #FFFFFF',
        borderRadius: '4px 4px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 900,
          fontFamily: '"Orbitron", sans-serif',
          color: '#FFFFFF',
          lineHeight: 1,
          letterSpacing: '0.05em',
        }}
      >
        FM
      </span>
      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
        <div style={{ width: '2px', height: '6px', backgroundColor: '#FFFFFF' }} />
        <div style={{ width: '2px', height: '9px', backgroundColor: '#FFFFFF' }} />
        <div style={{ width: '2px', height: '6px', backgroundColor: '#FFFFFF' }} />
      </div>
    </div>
  );
}

export const HybridEraTop5: React.FC<HybridEraTop5Props> = ({ data, styleConfig }) => {
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
  } = styleConfig;

  // Retrieve raw teams data and strictly slice to top 5 ONLY
  const rawTeams: any[] = data?.rows || data?.teams || data?.results || [];
  const teams = rawTeams.slice(0, 5);

  // Pad to 5 rows if data is missing/empty for clean preview layout
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

  const canvaBgUrl =
    styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
      ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
      : null;

  // Resolve Subheader (Right side tag)
  const groupPrefix = selectedGroup && selectedGroup !== 'all' ? `${selectedGroup.toUpperCase()} — ` : '';
  const mapSuffix = selectedMap && selectedMap !== 'none' ? ` (${selectedMap.toUpperCase()})` : '';
  const resolvedSubheader =
    data?.hybridEraSubheader ||
    data?.graphicSubtitle ||
    data?.subheader ||
    hybridEraSubheader ||
    graphicSubtitle ||
    `${groupPrefix}${hybridEraMode === 'collation' ? 'OVERALL COLLATION' : 'AFTER GAME ONE'}${mapSuffix}`;

  // Resolve Title (Centered main header)
  const resolvedTitle =
    graphicTitle || (hybridEraMode === 'collation' ? 'TOP 5 COLLATED' : 'TOP 5 TEAMS');

  // Helper to extract score display value
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
        backgroundColor: '#050403',
        backgroundImage:
          styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl && !canvaBgUrl
            ? `url(${styleConfig.customBackgroundUrl})`
            : 'radial-gradient(circle at 50% 35%, #18140a 0%, #090704 65%, #000000 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#FFFFFF',
        fontFamily: '"Orbitron", "Rajdhani", "Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Import Orbitron & Rajdhani fonts for esports stencil aesthetic */}
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

      {/* Subtle gold ambient glow overlays */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(230,190,90,0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle at center, rgba(230,190,90,0.08) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 80px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── TOP HEADER SECTION ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Top Left: Custom Branding & Tournament Logos (cleanly rendered if present) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '48px' }}>
            {hasBrandingLogo && (
              <img
                src={brandingLogoUrl}
                alt="Branding"
                style={{ height: '48px', objectFit: 'contain' }}
              />
            )}

            {hasBrandingLogo && hasTourneyLogo && (
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'sans-serif',
                }}
              >
                ✕
              </span>
            )}

            {hasTourneyLogo && (
              <img
                src={tournamentLogos[0].logoUrl}
                alt="Tournament"
                style={{ height: '48px', objectFit: 'contain' }}
              />
            )}
          </div>

          {/* Top Right: Logo image (if uploaded) or text subheader badge fallback */}
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
                  color: '#E6BE5A',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                  textShadow: '0 0 12px rgba(230,190,90,0.3)',
                }}
              >
                {resolvedSubheader}
              </span>
            )}
          </div>
        </div>

        {/* ── CENTER MAIN TITLE ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: '-10px', marginBottom: '10px' }}>
          <h1
            style={{
              fontSize: '66px',
              fontWeight: 900,
              letterSpacing: '0.18em',
              color: '#E6BE5A',
              textTransform: 'uppercase',
              margin: 0,
              fontFamily: '"Orbitron", sans-serif',
              lineHeight: 1,
              textShadow:
                '0 0 25px rgba(230, 190, 90, 0.4), 0 4px 15px rgba(0, 0, 0, 0.95)',
            }}
          >
            {resolvedTitle}
          </h1>
        </div>

        {/* ── TOP 5 TEAM CARDS (5 ROWS STRICTLY) ───────────────────── */}
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
                  background:
                    'linear-gradient(90deg, rgba(35, 27, 14, 0.95) 0%, rgba(65, 52, 26, 0.95) 30%, rgba(85, 68, 33, 0.95) 60%, rgba(40, 31, 16, 0.95) 100%)',
                  border: '1.5px solid rgba(230, 190, 90, 0.75)',
                  boxShadow:
                    'inset 0 1px 1px rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.85), 0 0 18px rgba(212,175,55,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 40px 0 10px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Sparkle flare accent top-right */}
                <SparkleFlare />

                {/* Left Side: Logo + Team Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                  {/* Square Logo Box with Gold Border */}
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '10px',
                      backgroundColor: '#090806',
                      border: '1.5px solid rgba(230, 190, 90, 0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                      flexShrink: 0,
                    }}
                  >
                    <TeamLogo logoUrl={team.logoUrl} name={teamName} size={74} />
                  </div>

                  {/* Team Name */}
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                      textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '850px',
                    }}
                  >
                    {teamName}
                  </span>
                </div>

                {/* Right Side: Score / Points */}
                <span
                  style={{
                    fontSize: '52px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    fontFamily: '"Orbitron", "Rajdhani", monospace',
                    letterSpacing: '0.02em',
                    textShadow:
                      '0 2px 12px rgba(0,0,0,0.9), 0 0 15px rgba(255,255,255,0.2)',
                  }}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── FOOTER TAGLINE ──────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#E6BE5A',
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            R E M E D I U M &nbsp; X &nbsp; F A B . M A Y O W A
          </span>
        </div>
      </div>
    </div>
  );
};
