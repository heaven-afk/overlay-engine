'use client';

import React from 'react';
import { TemplateStyleConfig, TeamSlotData, TeamSlotItem } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface TeamSlotVerticalProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// ── Default Mock Teams (12 Teams for Vertical Layout) ──────────────────────
const DEFAULT_TEAMS_VERTICAL: TeamSlotItem[] = [
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
  size = 46,
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
        borderRadius: '7px',
        background: isRedEsports
          ? 'rgba(0, 0, 0, 0.45)'
          : 'linear-gradient(145deg, rgba(25, 25, 35, 0.9) 0%, rgba(10, 10, 16, 0.95) 100%)',
        border: `1px solid ${isRedEsports ? 'rgba(255, 255, 255, 0.25)' : hexToRgba(accent, 0.35)}`,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 6px rgba(0, 0, 0, 0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexShrink: 0,
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
              borderRadius: '5px',
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
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
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
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

export const TeamSlotVertical: React.FC<TeamSlotVerticalProps> = ({
  data,
  styleConfig,
  isPreview = false,
}) => {
  const accent = styleConfig?.accentColor || '#EF4444';
  const headingFont = styleConfig?.headingFont || 'Outfit';
  const bodyFont = styleConfig?.bodyFont || 'Inter';

  // Resolved Teams Array
  const rawTeams: any[] = (Array.isArray(data?.teams) && data.teams.length > 0)
    ? data.teams
    : (Array.isArray(data?.results) && data.results.length > 0)
      ? data.results
      : (Array.isArray(styleConfig?.teamSlotCustomTeams) && styleConfig.teamSlotCustomTeams.length > 0)
        ? styleConfig.teamSlotCustomTeams
        : DEFAULT_TEAMS_VERTICAL;

  const title = data?.title || styleConfig?.graphicTitle || 'MEET THE TEAMS';
  const subtitle = data?.subtitle || styleConfig?.graphicSubtitle || `${rawTeams.length} TEAMS CONFIRMED`;
  const categoryTag = data?.categoryTag || styleConfig?.teamSlotCategoryTag || styleConfig?.brandingName || 'TOURNAMENT PARTICIPANTS';
  const sponsorText = data?.sponsorText || styleConfig?.teamSlotSponsorText || 'SPONSORED BY';
  const sponsorName = data?.sponsorName || styleConfig?.teamSlotSponsorName || 'RUNESTONE';
  const sponsorLogoUrl = data?.sponsorLogoUrl || styleConfig?.teamSlotSponsorLogoUrl;
  const cardStyle = data?.cardStyle || styleConfig?.teamSlotCardStyle || 'dark_gold';
  const showSlotNumbers = data?.showSlotNumbers ?? styleConfig?.teamSlotShowSlotNumbers ?? true;
  const slotPrefix = data?.slotPrefix || styleConfig?.teamSlotSlotPrefix || 'SLOT';

  // Slice to max 16 for clean vertical fit
  const displayTeams = rawTeams.slice(0, 16);
  const count = displayTeams.length;

  // Responsive sizing based on team count to distribute vertically
  const isCompact = count > 10;
  const logoSize = isCompact ? 44 : 50;
  const cardMinHeight = isCompact ? '48px' : '56px';
  const gridGap = count <= 8 ? '10px' : count <= 12 ? '8px' : '6px';

  return (
    <div
      className="broadcast-canvas"
      style={{
        width: '434px',
        height: '724px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: `'${bodyFont}', sans-serif`,
        color: '#fff',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 16px 14px 16px',
        background: styleConfig?.customBackgroundUrl
          ? `linear-gradient(180deg, rgba(6, 6, 10, 0.75) 0%, rgba(6, 6, 10, 0.95) 100%), url(${styleConfig.customBackgroundUrl}) center/cover no-repeat`
          : `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.28)} 0%, rgba(10, 10, 15, 0.97) 65%),
             radial-gradient(ellipse at 50% 100%, ${hexToRgba(accent, 0.12)} 0%, #07070a 85%)`,
      }}
    >
      {/* Background Decorative Esports Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Header Section */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: count <= 10 ? '10px' : '6px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ width: '12px', height: '2px', background: accent }} />
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: accent,
              fontFamily: `'${headingFont}', sans-serif`,
            }}
          >
            {categoryTag}
          </span>
          <span style={{ width: '12px', height: '2px', background: accent }} />
        </div>

        <h1
          style={{
            fontFamily: `'${headingFont}', sans-serif`,
            fontSize: count > 12 ? '22px' : '24px',
            fontWeight: 900,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.15,
            background: 'linear-gradient(180deg, #FFFFFF 20%, #E2E8F0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: '2px 0 0 0',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Teams Grid (2 Columns) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: gridGap,
          flex: 1,
          alignContent: 'center',
        }}
      >
        {displayTeams.map((team, idx) => {
          const isRedEsports = cardStyle === 'red_esports';
          const isDarkGold = cardStyle === 'dark_gold';

          // Safe data extraction (support both name and teamName from Heaven Stat Engine)
          const teamName = team.name || team.teamName || team.clanName || `Team ${idx + 1}`;
          const logoUrl = team.logoUrl || team.logo || team.logo_url || '';
          const tag = team.tag || (team.clanName ? team.clanName : '');
          const slot = team.slot ?? team.slotNumber ?? (idx + 1);

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: cardMinHeight,
                boxSizing: 'border-box',
                ...(isRedEsports
                  ? {
                      background: `linear-gradient(145deg, ${hexToRgba(accent, 0.85)} 0%, ${hexToRgba(accent, 0.4)} 100%)`,
                      border: `1px solid ${hexToRgba(accent, 0.9)}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                    }
                  : isDarkGold
                  ? {
                      background: 'linear-gradient(180deg, rgba(22, 22, 30, 0.88) 0%, rgba(12, 12, 18, 0.95) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.09)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }
                  : {
                      background: 'rgba(18, 18, 24, 0.8)',
                      border: `1px solid ${hexToRgba(accent, 0.28)}`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                    }),
              }}
            >
              {/* Corner Frame Accents for Dark Gold / Sleek style */}
              {!isRedEsports && (
                <>
                  <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '5px', height: '5px', borderTop: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}`, borderTopLeftRadius: '3px' }} />
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '5px', height: '5px', borderTop: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}`, borderTopRightRadius: '3px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '5px', height: '5px', borderBottom: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}`, borderBottomLeftRadius: '3px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '5px', height: '5px', borderBottom: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}`, borderBottomRightRadius: '3px' }} />
                </>
              )}

              {/* Square Team Logo Tile */}
              <SquareTeamLogo
                logoUrl={logoUrl}
                name={teamName}
                size={logoSize}
                accent={accent}
                isRedEsports={isRedEsports}
              />

              {/* Team Info & Slot Meta */}
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* Top Meta Line: Slot Badge & Region Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {showSlotNumbers && (
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 900,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        lineHeight: 1.1,
                        background: isRedEsports ? 'rgba(0, 0, 0, 0.4)' : hexToRgba(accent, 0.2),
                        border: `1px solid ${isRedEsports ? 'rgba(255, 255, 255, 0.3)' : hexToRgba(accent, 0.5)}`,
                        color: isRedEsports ? '#FFFFFF' : accent,
                        flexShrink: 0,
                      }}
                    >
                      {slotPrefix} {String(slot).padStart(2, '0')}
                    </span>
                  )}
                  {tag && (
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        color: isRedEsports ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tag}
                    </span>
                  )}
                </div>

                {/* Team Name */}
                <div
                  style={{
                    fontFamily: `'${headingFont}', sans-serif`,
                    fontSize: isCompact ? '11px' : '12px',
                    fontWeight: 900,
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
                  }}
                  title={teamName}
                >
                  {teamName}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '8px',
          marginTop: count <= 10 ? '10px' : '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
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
              style={{ height: '15px', objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fff',
                fontFamily: `'${headingFont}', sans-serif`,
              }}
            >
              {sponsorName}
            </span>
          )}
        </div>

        {styleConfig?.showStatsStamp !== false && (
          <div
            style={{
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.06em',
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
