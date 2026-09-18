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
  { name: '100 Thieves', tag: 'NA', logoUrl: '' },
  { name: 'TYLOO', tag: 'CN', logoUrl: '' },
  { name: 'Karmine Corp', tag: 'EMEA', logoUrl: '' },
  { name: 'Global Esports', tag: 'PAC', logoUrl: '' },
  { name: 'LOUD', tag: 'BR', logoUrl: '' },
  { name: 'JD Gaming', tag: 'CN', logoUrl: '' },
  { name: 'Team Liquid', tag: 'EMEA', logoUrl: '' },
  { name: 'NS RedForce', tag: 'KR', logoUrl: '' },
  { name: 'NRG', tag: 'NA', logoUrl: '' },
  { name: 'EDward Gaming', tag: 'CN', logoUrl: '' },
  { name: 'FUT Esports', tag: 'EMEA', logoUrl: '' },
  { name: 'Paper Rex', tag: 'PAC', logoUrl: '' },
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

function TeamLogoImage({ logoUrl, name, size = 32, accent }: { logoUrl?: string; name: string; size?: number; accent: string }) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || 'TM')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase() || 'TM';

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
            borderRadius: '6px',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        />
      );
    }
    return (
      <img
        src={logoUrl}
        alt={name}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        background: hexToRgba(accent, 0.15),
        border: `1px solid ${hexToRgba(accent, 0.4)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.4)}px`,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
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

  // Resolved Data
  const teams: TeamSlotItem[] = (Array.isArray(data?.teams) && data.teams.length > 0)
    ? data.teams
    : (Array.isArray(styleConfig?.teamSlotCustomTeams) && styleConfig.teamSlotCustomTeams.length > 0)
      ? styleConfig.teamSlotCustomTeams
      : DEFAULT_TEAMS_VERTICAL;

  const title = data?.title || styleConfig?.graphicTitle || 'MEET THE TEAMS';
  const subtitle = data?.subtitle || styleConfig?.graphicSubtitle || `${teams.length} TEAMS CONFIRMED`;
  const categoryTag = data?.categoryTag || styleConfig?.teamSlotCategoryTag || styleConfig?.brandingName || 'TOURNAMENT PARTICIPANTS';
  const sponsorText = data?.sponsorText || styleConfig?.teamSlotSponsorText || 'SPONSORED BY';
  const sponsorName = data?.sponsorName || styleConfig?.teamSlotSponsorName || 'RUNESTONE';
  const sponsorLogoUrl = data?.sponsorLogoUrl || styleConfig?.teamSlotSponsorLogoUrl;
  const cardStyle = data?.cardStyle || styleConfig?.teamSlotCardStyle || 'dark_gold';

  // For 434x724, 2 columns is ideal
  const displayTeams = teams.slice(0, 16); // max 16 for clean vertical fit
  const count = displayTeams.length;

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
        padding: '20px 18px 16px 18px',
        background: styleConfig?.customBackgroundUrl
          ? `linear-gradient(180deg, rgba(6, 6, 10, 0.7) 0%, rgba(6, 6, 10, 0.95) 100%), url(${styleConfig.customBackgroundUrl}) center/cover no-repeat`
          : `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.25)} 0%, rgba(10, 10, 15, 0.96) 65%),
             radial-gradient(ellipse at 50% 100%, ${hexToRgba(accent, 0.12)} 0%, #07070a 80%)`,
      }}
    >
      {/* Background Decorative Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Header Section */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '12px', height: '2px', background: accent }} />
          <span style={{
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: accent,
            fontFamily: `'${headingFont}', sans-serif`,
          }}>
            {categoryTag}
          </span>
          <span style={{ width: '12px', height: '2px', background: accent }} />
        </div>

        <h1 style={{
          fontFamily: `'${headingFont}', sans-serif`,
          fontSize: '24px',
          fontWeight: 900,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1.15,
          background: 'linear-gradient(180deg, #FFFFFF 20%, #E2E8F0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
        }}>
          {title}
        </h1>

        <p style={{
          margin: '3px 0 0 0',
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.6)',
        }}>
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
          gap: count > 12 ? '6px' : '8px',
          flex: 1,
          alignContent: 'center',
        }}
      >
        {displayTeams.map((team, idx) => {
          const isRedEsports = cardStyle === 'red_esports';
          const isDarkGold = cardStyle === 'dark_gold';
          const isCompact = count > 12;

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: '8px',
                padding: isCompact ? '6px 8px' : '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: isCompact ? '40px' : '48px',
                ...(isRedEsports ? {
                  background: `linear-gradient(145deg, ${hexToRgba(accent, 0.8)} 0%, ${hexToRgba(accent, 0.35)} 100%)`,
                  border: `1px solid ${hexToRgba(accent, 0.85)}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                } : isDarkGold ? {
                  background: 'linear-gradient(180deg, rgba(22, 22, 30, 0.85) 0%, rgba(12, 12, 18, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                } : {
                  background: 'rgba(18, 18, 24, 0.75)',
                  border: `1px solid ${hexToRgba(accent, 0.25)}`,
                }),
              }}
            >
              {/* Corner Frame Accents */}
              {!isRedEsports && (
                <>
                  <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '5px', height: '5px', borderTop: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}`, borderTopLeftRadius: '3px' }} />
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '5px', height: '5px', borderTop: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}`, borderTopRightRadius: '3px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '5px', height: '5px', borderBottom: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}`, borderBottomLeftRadius: '3px' }} />
                  <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '5px', height: '5px', borderBottom: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}`, borderBottomRightRadius: '3px' }} />
                </>
              )}

              {/* Team Logo */}
              <TeamLogoImage
                logoUrl={team.logoUrl}
                name={team.name}
                size={isCompact ? 28 : 34}
                accent={accent}
              />

              {/* Team Info */}
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: `'${headingFont}', sans-serif`,
                    fontSize: isCompact ? '11px' : '12px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {team.name}
                </div>
                {team.tag && (
                  <div
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: isRedEsports ? 'rgba(255,255,255,0.8)' : accent,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginTop: '1px',
                    }}
                  >
                    {team.tag}
                  </div>
                )}
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
          paddingTop: '10px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            {sponsorText}
          </span>
          {sponsorLogoUrl ? (
            <img
              src={sponsorLogoUrl}
              alt="Sponsor"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{ height: '16px', objectFit: 'contain' }}
            />
          ) : (
            <span style={{
              fontSize: '10.5px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fff',
              fontFamily: `'${headingFont}', sans-serif`,
            }}>
              {sponsorName}
            </span>
          )}
        </div>

        {styleConfig?.showStatsStamp !== false && (
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.35)',
          }}>
            Overlay Engine
          </div>
        )}
      </div>
    </div>
  );
};
