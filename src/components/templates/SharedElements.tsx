import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';

interface SharedProps {
  styleConfig: TemplateStyleConfig;
}

export function getCanvaEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Regex to match canva.com/design/xxx/yyy/view or canva.com/design/xxx/view
  // Supporting view, watch, play, edit paths
  const match = url.match(/https?:\/\/(?:www\.)?canva\.com\/design\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?\/(?:view|watch|edit|play|design)/);
  if (match) {
    const designId = match[1];
    const slug = match[2];
    if (slug) {
      return `https://www.canva.com/design/${designId}/${slug}/view?embed`;
    }
    return `https://www.canva.com/design/${designId}/view?embed`;
  }
  return null;
}

export const BrandingHeader: React.FC<SharedProps> = ({ styleConfig }) => {
  const { brandingLogoUrl, brandingName, tournamentLogoCount, tournamentLogos } = styleConfig;

  // Split branding name by newline, slash or pipe, default fallback
  const nameParts = brandingName 
    ? (brandingName.includes('\n') ? brandingName.split('\n') : brandingName.includes('/') ? brandingName.split('/') : brandingName.split('|'))
    : ['HEAVEN STAT ENGINE', 'LIVE OVERLAY'];
  const orgName = (nameParts[0] || '').trim();
  const mainTitle = (nameParts[1] || '').trim();

  const logosToShow = (tournamentLogos || []).slice(0, tournamentLogoCount || 1);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: '16px 48px',
      borderBottom: '1px solid var(--border)',
      background: 'linear-gradient(to bottom, var(--bg-card), transparent)',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      {/* Left side branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {brandingLogoUrl ? (
          getCanvaEmbedUrl(brandingLogoUrl) ? (
            <iframe
              src={getCanvaEmbedUrl(brandingLogoUrl)!}
              scrolling="no"
              style={{
                width: '72px',
                height: '72px',
                border: 'none',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <img 
              src={brandingLogoUrl} 
              alt="logo" 
              style={{
                width: '72px',
                height: '72px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            />
          )
        ) : (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '4px',
            backgroundColor: 'var(--accent)',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '20px',
            color: '#000',
          }}>
            ✦
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--accent)',
            fontFamily: 'var(--heading-font)',
          }}>
            {orgName}
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-heading)',
            fontFamily: 'var(--heading-font)',
          }}>
            {mainTitle}
          </span>
        </div>
      </div>

      {/* Right side tournament logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {logosToShow.map((slot, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}>
            {slot.logoUrl ? (
              getCanvaEmbedUrl(slot.logoUrl) ? (
                <iframe
                  src={getCanvaEmbedUrl(slot.logoUrl)!}
                  scrolling="no"
                  style={{
                    height: '32px',
                    width: '60px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <img 
                  src={slot.logoUrl} 
                  alt={slot.tournamentName || `tourney-${index}`} 
                  style={{
                    height: '32px',
                    maxWidth: '60px',
                    objectFit: 'contain',
                  }}
                />
              )
            ) : null}
            {slot.tournamentName && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                fontFamily: 'var(--body-font)',
              }}>
                {slot.tournamentName}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatsStamp: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '48px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.15em',
      color: 'var(--text-muted)',
      fontFamily: 'var(--body-font)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      textTransform: 'uppercase',
    }}>
      STATS BY HEAVEN <span style={{ color: 'var(--accent)' }}>✦</span>
    </div>
  );
};

interface SourceLineProps extends SharedProps {
  customText?: string;
}

export const SourceLine: React.FC<SourceLineProps> = ({ styleConfig, customText }) => {
  const { tournamentLogoCount, tournamentLogos } = styleConfig;

  const names = customText 
    ? [customText] 
    : (tournamentLogos || [])
        .slice(0, tournamentLogoCount)
        .map(l => l.tournamentName)
        .filter(Boolean);

  const displayText = names.length > 0 ? names.join(' · ') : 'LIVE STAT ENGINE';

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '48px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.15em',
      color: 'var(--text-muted)',
      fontFamily: 'var(--body-font)',
      textTransform: 'uppercase',
    }}>
      SOURCE · <span style={{ color: 'var(--text-primary)' }}>{displayText}</span>
    </div>
  );
};

interface RankBadgeProps {
  rank: number;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
  const isTop3 = rank >= 1 && rank <= 3;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isTop3 ? '36px' : '32px',
      height: isTop3 ? '36px' : '32px',
      borderRadius: '50%',
      fontFamily: 'var(--heading-font)',
      fontWeight: 800,
      fontSize: isTop3 ? '16px' : '14px',
      color: isTop3 ? 'var(--accent)' : 'var(--text-muted)',
      border: isTop3 ? '2px solid var(--accent)' : '1px solid var(--rank-border)',
      backgroundColor: isTop3 ? 'var(--accent-muted)' : 'var(--rank-bg)',
      boxShadow: isTop3 ? '0 0 10px var(--accent-muted)' : 'none',
      boxSizing: 'border-box',
    }}>
      {rank}
    </div>
  );
};

interface LogoProps {
  logoUrl?: string;
  size?: number;
  name?: string;
}

export const TeamLogoPlaceholder: React.FC<LogoProps> = ({ logoUrl, size = 36, name = '' }) => {
  // Only render an img if the URL is a valid absolute http(s) URL.
  // Bare filenames like "Legion.png" will 404 and should fall back to initials.
  const isValidUrl = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  if (isValidUrl) {
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
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            pointerEvents: 'none',
          }}
        />
      );
    }
    return (
      <img 
        src={logoUrl} 
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          borderRadius: '4px',
          border: '1px solid var(--border)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: `${Math.round(size * 0.4)}px`,
      color: 'var(--text-muted)',
      fontFamily: 'var(--body-font)',
    }}>
      {name ? name.substring(0, 2).toUpperCase() : '??'}
    </div>
  );
};
