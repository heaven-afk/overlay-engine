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
  { name: 'G2 Esports', tag: 'NA', logoUrl: '' },
  { name: 'XLG Esports', tag: 'CN', logoUrl: '' },
  { name: 'Team Vitality', tag: 'EMEA', logoUrl: '' },
  { name: 'T1', tag: 'PAC', logoUrl: '' },
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

// ── Team Logo Helper ────────────────────────────────────────────────────────
function TeamLogoImage({ logoUrl, name, size = 56, accent }: { logoUrl?: string; name: string; size?: number; accent: string }) {
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
            borderRadius: '8px',
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
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
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
        borderRadius: '10px',
        background: hexToRgba(accent, 0.15),
        border: `1.5px solid ${hexToRgba(accent, 0.4)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.38)}px`,
        color: '#fff',
        letterSpacing: '0.05em',
        boxShadow: `0 0 12px ${hexToRgba(accent, 0.2)}`,
        flexShrink: 0,
      }}
    >
      {initials}
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

  // Resolved Data
  const teams: TeamSlotItem[] = (Array.isArray(data?.teams) && data.teams.length > 0)
    ? data.teams
    : (Array.isArray(styleConfig?.teamSlotCustomTeams) && styleConfig.teamSlotCustomTeams.length > 0)
      ? styleConfig.teamSlotCustomTeams
      : DEFAULT_TEAMS;

  const title = data?.title || styleConfig?.graphicTitle || 'ALL TEAMS CONFIRMED';
  const subtitle = data?.subtitle || styleConfig?.graphicSubtitle || `${teams.length} TEAMS • 1 CHAMPION`;
  const categoryTag = data?.categoryTag || styleConfig?.teamSlotCategoryTag || styleConfig?.brandingName || 'VALORANT CHAMPIONS • SHANGHAI';
  const footerText = data?.footerText || styleConfig?.teamSlotFooterText || 'SHANGHAI AWAITS • LIVE BROADCAST';
  const sponsorText = data?.sponsorText || styleConfig?.teamSlotSponsorText || 'SPONSORED BY';
  const sponsorName = data?.sponsorName || styleConfig?.teamSlotSponsorName || 'RUNESTONE';
  const sponsorLogoUrl = data?.sponsorLogoUrl || styleConfig?.teamSlotSponsorLogoUrl;
  const cardStyle = data?.cardStyle || styleConfig?.teamSlotCardStyle || 'dark_gold'; // 'red_esports' | 'dark_gold' | 'sleek_dark'

  // Dynamic grid setup based on team count
  const count = teams.length;
  let cols = 4;
  if (count <= 6) cols = 3;
  else if (count <= 8) cols = 4;
  else if (count <= 12) cols = 4;
  else if (count <= 16) cols = 4;
  else cols = 5;

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
        padding: '48px 72px 42px 72px',
        background: styleConfig?.customBackgroundUrl
          ? `linear-gradient(180deg, rgba(6, 6, 10, 0.7) 0%, rgba(6, 6, 10, 0.9) 100%), url(${styleConfig.customBackgroundUrl}) center/cover no-repeat`
          : `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.22)} 0%, rgba(10, 10, 14, 0.96) 60%),
             radial-gradient(ellipse at 50% 100%, ${hexToRgba(accent, 0.15)} 0%, #08080c 70%)`,
      }}
    >
      {/* Background Decorative Esports Grids / Slits */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 15% 50%, ${hexToRgba(accent, 0.08)} 0%, transparent 35%),
            radial-gradient(circle at 85% 50%, ${hexToRgba(accent, 0.08)} 0%, transparent 35%),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Section */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: '24px' }}>
        {/* Eyebrow Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            width: '24px',
            height: '2px',
            background: accent,
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            fontFamily: `'${headingFont}', sans-serif`,
          }}>
            {categoryTag}
          </span>
          <span style={{
            width: '24px',
            height: '2px',
            background: accent,
          }} />
        </div>

        {/* Main Title */}
        <h1 style={{
          fontFamily: `'${headingFont}', sans-serif`,
          fontSize: '56px',
          fontWeight: 900,
          letterSpacing: '-0.015em',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1.1,
          background: 'linear-gradient(180deg, #FFFFFF 20%, #E2E8F0 65%, #CBD5E1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))',
        }}>
          {title}
        </h1>

        {/* Subtitle / Counter */}
        <p style={{
          margin: '6px 0 0 0',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.65)',
        }}>
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
          gap: count > 16 ? '14px' : '18px',
          width: '100%',
          maxWidth: '1720px',
          margin: '0 auto',
          flex: 1,
          alignContent: 'center',
        }}
      >
        {teams.map((team, idx) => {
          const isRedEsports = cardStyle === 'red_esports';
          const isDarkGold = cardStyle === 'dark_gold';

          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                borderRadius: isRedEsports ? '12px' : '14px',
                padding: count > 16 ? '10px 14px' : '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: count > 16 ? '95px' : '110px',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                ...(isRedEsports ? {
                  background: `linear-gradient(145deg, ${hexToRgba(accent, 0.85)} 0%, ${hexToRgba(accent, 0.4)} 100%)`,
                  border: `1.5px solid ${hexToRgba(accent, 0.9)}`,
                  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                } : isDarkGold ? {
                  background: 'linear-gradient(180deg, rgba(22, 22, 30, 0.85) 0%, rgba(12, 12, 18, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                } : {
                  background: 'rgba(18, 18, 24, 0.75)',
                  border: `1px solid ${hexToRgba(accent, 0.25)}`,
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

              {/* Tag / Region Badge */}
              {team.tag && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isRedEsports ? '#fff' : accent,
                    backgroundColor: isRedEsports ? 'rgba(0,0,0,0.35)' : hexToRgba(accent, 0.12),
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${isRedEsports ? 'rgba(255,255,255,0.2)' : hexToRgba(accent, 0.3)}`,
                  }}
                >
                  {team.tag}
                </span>
              )}

              {/* Team Logo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: count > 16 ? '48px' : '56px',
              }}>
                <TeamLogoImage
                  logoUrl={team.logoUrl}
                  name={team.name}
                  size={count > 16 ? 48 : 56}
                  accent={accent}
                />
              </div>

              {/* Team Name */}
              <div
                style={{
                  fontFamily: `'${headingFont}', sans-serif`,
                  fontSize: count > 16 ? '13px' : '15px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%',
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                  padding: isRedEsports ? '4px 8px' : '0',
                  borderRadius: isRedEsports ? '6px' : '0',
                  background: isRedEsports ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                }}
              >
                {team.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '18px',
          marginTop: '20px',
        }}
      >
        {/* Left Side: Slogan / Tournament Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: accent,
            boxShadow: `0 0 8px ${accent}`,
          }} />
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            {footerText}
          </span>
        </div>

        {/* Center / Right: Sponsor Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.15em',
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
              style={{ height: '24px', objectFit: 'contain' }}
            />
          ) : (
            <span style={{
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#fff',
              fontFamily: `'${headingFont}', sans-serif`,
            }}>
              {sponsorName}
            </span>
          )}
        </div>

        {/* Stats Stamp Watermark */}
        {styleConfig?.showStatsStamp !== false && (
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
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
