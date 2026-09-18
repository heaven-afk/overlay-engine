'use client';

import React from 'react';
import { TemplateStyleConfig, TeamSlotData, TeamSlotItem } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface TeamSlotHorizontalProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// ── Default Mock Teams (16 Teams) ──────────────────────────────────────────
const DEFAULT_TEAMS: TeamSlotItem[] = [
  { name: '100 Thieves', tag: 'NA', slot: 1, logoUrl: '' },
  { name: 'TYLOO', tag: 'CN', slot: 2, logoUrl: '' },
  { name: 'Karmine Corp', tag: 'EMEA', slot: 3, logoUrl: '' },
  { name: 'Global Esports', tag: 'PAC', slot: 4, logoUrl: '' },
  { name: 'LOUD', tag: 'BR', slot: 5, logoUrl: '' },
  { name: 'JD Gaming', tag: 'CN', slot: 6, logoUrl: '' },
  { name: 'Team Liquid', tag: 'EMEA', slot: 7, logoUrl: '' },
  { name: 'NS RedForce', tag: 'KR', slot: 8, logoUrl: '' },
  { name: 'NRG', tag: 'NA', slot: 9, logoUrl: '' },
  { name: 'EDward Gaming', tag: 'CN', slot: 10, logoUrl: '' },
  { name: 'FUT Esports', tag: 'EMEA', slot: 11, logoUrl: '' },
  { name: 'Paper Rex', tag: 'PAC', slot: 12, logoUrl: '' },
  { name: 'G2 Esports', tag: 'NA', slot: 13, logoUrl: '' },
  { name: 'XLG Esports', tag: 'CN', slot: 14, logoUrl: '' },
  { name: 'Team Vitality', tag: 'EMEA', slot: 15, logoUrl: '' },
  { name: 'T1', tag: 'PAC', slot: 16, logoUrl: '' },
];

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(239, 68, 68, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 239, g = 68, b = 68;
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

/**
 * Square Logo Container with crisp framing and fallback initials
 */
function SquareTeamLogo({
  logoUrl,
  name,
  size = 70,
  accent,
  isRedEsports = false,
}: {
  logoUrl?: string;
  name: string;
  size?: number;
  accent: string;
  isRedEsports?: boolean;
}) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || 'TM')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase() || 'TM';

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '10px',
        background: isRedEsports
          ? 'rgba(0, 0, 0, 0.45)'
          : 'linear-gradient(145deg, rgba(25, 25, 35, 0.9) 0%, rgba(10, 10, 16, 0.95) 100%)',
        border: `1.5px solid ${isRedEsports ? 'rgba(255, 255, 255, 0.3)' : hexToRgba(accent, 0.4)}`,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.45)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isHttp ? (
        getCanvaEmbedUrl(logoUrl) ? (
          <iframe
            src={getCanvaEmbedUrl(logoUrl)!}
            scrolling="no"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '7px',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <img
            src={logoUrl}
            alt={name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            style={{
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))',
            }}
          />
        )
      ) : (
        <span
          style={{
            fontSize: `${Math.round(size * 0.38)}px`,
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: isRedEsports ? '#FFFFFF' : accent,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export const TeamSlotHorizontal: React.FC<TeamSlotHorizontalProps> = ({
  data,
  styleConfig,
  isPreview = false,
}) => {
  const accent = styleConfig?.accentColor || '#EF4444';
  const headingFont = styleConfig?.headingFont || 'Outfit';
  const bodyFont = styleConfig?.bodyFont || 'Inter';

  // Resolved Data (support both teams array and raw results from Heaven Stat Engine)
  const rawTeams: any[] = (Array.isArray(data?.teams) && data.teams.length > 0)
    ? data.teams
    : (Array.isArray(data?.results) && data.results.length > 0)
      ? data.results
      : (Array.isArray(styleConfig?.teamSlotCustomTeams) && styleConfig.teamSlotCustomTeams.length > 0)
        ? styleConfig.teamSlotCustomTeams
        : DEFAULT_TEAMS;

  const title = data?.title || styleConfig?.graphicTitle || 'ALL TEAMS CONFIRMED';
  const subtitle = data?.subtitle || styleConfig?.graphicSubtitle || `${rawTeams.length} TEAMS • 1 CHAMPION`;
  const categoryTag = data?.categoryTag || styleConfig?.teamSlotCategoryTag || styleConfig?.brandingName || 'VALORANT CHAMPIONS • SHANGHAI';
  const footerText = data?.footerText || styleConfig?.teamSlotFooterText || 'SHANGHAI AWAITS • LIVE BROADCAST';
  const sponsorText = data?.sponsorText || styleConfig?.teamSlotSponsorText || 'SPONSORED BY';
  const sponsorName = data?.sponsorName || styleConfig?.teamSlotSponsorName || 'RUNESTONE';
  const sponsorLogoUrl = data?.sponsorLogoUrl || styleConfig?.teamSlotSponsorLogoUrl;
  const cardStyle = data?.cardStyle || styleConfig?.teamSlotCardStyle || 'dark_gold';
  const showSlotNumbers = data?.showSlotNumbers ?? styleConfig?.teamSlotShowSlotNumbers ?? true;
  const slotPrefix = data?.slotPrefix || styleConfig?.teamSlotSlotPrefix || 'SLOT';

  const teams = rawTeams.slice(0, 20); // max 20 teams
  const count = teams.length;

  // Compute balanced grid columns & card sizing
  let cols = 4;
  if (count <= 10) {
    cols = 5;
  } else if (count <= 12) {
    cols = 4;
  } else if (count <= 16) {
    cols = 4;
  } else {
    cols = 5;
  }

  const logoSize = count > 16 ? 58 : 68;
  const cardMinHeight = count > 16 ? '125px' : '140px';

  return (
    <div
      className="broadcast-canvas"
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: `'${bodyFont}', sans-serif`,
        color: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 80px 40px 80px',
        background: styleConfig?.customBackgroundUrl
          ? `linear-gradient(180deg, rgba(6, 6, 10, 0.75) 0%, rgba(6, 6, 10, 0.95) 100%), url(${styleConfig.customBackgroundUrl}) center/cover no-repeat`
          : `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.28)} 0%, rgba(10, 10, 15, 0.97) 65%),
             radial-gradient(ellipse at 50% 100%, ${hexToRgba(accent, 0.12)} 0%, #07070a 85%)`,
      }}
    >
      {/* Background Decorative Tech Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        {/* Category Tag Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ width: '24px', height: '2px', background: accent }} />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: accent,
              fontFamily: `'${headingFont}', sans-serif`,
            }}
          >
            {categoryTag}
          </span>
          <span style={{ width: '24px', height: '2px', background: accent }} />
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontFamily: `'${headingFont}', sans-serif`,
            fontSize: '52px',
            fontWeight: 900,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.1,
            background: 'linear-gradient(180deg, #FFFFFF 20%, #E2E8F0 65%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))',
          }}
        >
          {title}
        </h1>

        {/* Subtitle / Counter */}
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Teams Grid Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: count > 16 ? '12px' : '16px',
          width: '100%',
          maxWidth: count <= 10 ? '1500px' : '1720px',
          margin: '0 auto',
          flex: 1,
          alignContent: 'center',
        }}
      >
        {teams.map((team, idx) => {
          const isRedEsports = cardStyle === 'red_esports';
          const isDarkGold = cardStyle === 'dark_gold';

          // Safe data resolution (supports both name and teamName from Heaven Stat Engine)
          const teamName = team.name || team.teamName || team.clanName || `Team ${idx + 1}`;
          const logoUrl = team.logoUrl || team.logo || team.logo_url || '';
          const tag = team.tag || (team.clanName ? team.clanName : '');
          const slot = team.slot ?? team.slotNumber ?? (idx + 1);

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: isRedEsports ? '12px' : '14px',
                padding: '14px 16px 12px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: cardMinHeight,
                boxSizing: 'border-box',
                ...(isRedEsports
                  ? {
                      background: `linear-gradient(145deg, ${hexToRgba(accent, 0.88)} 0%, ${hexToRgba(accent, 0.42)} 100%)`,
                      border: `1.5px solid ${hexToRgba(accent, 0.9)}`,
                      boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                    }
                  : isDarkGold
                  ? {
                      background: 'linear-gradient(180deg, rgba(22, 22, 30, 0.88) 0%, rgba(12, 12, 18, 0.96) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.09)',
                      boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    }
                  : {
                      background: 'rgba(18, 18, 24, 0.8)',
                      border: `1px solid ${hexToRgba(accent, 0.28)}`,
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                    }),
              }}
            >
              {/* Corner Frame Accents for Dark Gold / Sleek style */}
              {!isRedEsports && (
                <>
                  <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '8px', height: '8px', borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderTopLeftRadius: '4px' }} />
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderTopRightRadius: '4px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '8px', height: '8px', borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, borderBottomLeftRadius: '4px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, borderBottomRightRadius: '4px' }} />
                </>
              )}

              {/* Slot Number Pill Badge (Top-Left) */}
              {showSlotNumbers && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '10px',
                    fontSize: '10.5px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isRedEsports ? '#FFFFFF' : accent,
                    backgroundColor: isRedEsports ? 'rgba(0, 0, 0, 0.45)' : hexToRgba(accent, 0.18),
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: `1px solid ${isRedEsports ? 'rgba(255, 255, 255, 0.25)' : hexToRgba(accent, 0.4)}`,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {slotPrefix} {String(slot).padStart(2, '0')}
                </span>
              )}

              {/* Tag / Region Badge (Top-Right) */}
              {tag && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isRedEsports ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: isRedEsports ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${isRedEsports ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'}`,
                  }}
                >
                  {tag}
                </span>
              )}

              {/* Square Team Logo */}
              <SquareTeamLogo
                logoUrl={logoUrl}
                name={teamName}
                size={logoSize}
                accent={accent}
                isRedEsports={isRedEsports}
              />

              {/* Team Nameplate */}
              <div
                style={{
                  fontFamily: `'${headingFont}', sans-serif`,
                  fontSize: count > 16 ? '13px' : '15px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: '92%',
                  color: '#FFFFFF',
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                  marginTop: '2px',
                }}
                title={teamName}
              >
                {teamName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '18px',
          marginTop: '16px',
        }}
      >
        {/* Left: Tournament Slogan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: `'${headingFont}', sans-serif`,
            }}
          >
            {footerText}
          </span>
        </div>

        {/* Center: Sponsor Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {sponsorText}
          </span>
          {sponsorLogoUrl ? (
            <img
              src={sponsorLogoUrl}
              alt="Sponsor"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{ height: '26px', objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#fff',
                fontFamily: `'${headingFont}', sans-serif`,
              }}
            >
              {sponsorName}
            </span>
          )}
        </div>

        {/* Right: Stats Watermark */}
        {styleConfig?.showStatsStamp !== false && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            Overlay Engine
          </div>
        )}
      </div>
    </div>
  );
};
