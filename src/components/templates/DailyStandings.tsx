import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, getCanvaEmbedUrl } from './SharedElements';

interface DailyStandingsProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

// Resolve which points value to show + header label
function resolvePoints(team: any, col: string): { value: string; label: string } {
  switch (col) {
    case 'kills':
      return { value: String(team.kills ?? 0), label: 'TOTAL KILLS' };
    case 'placementPts':
      return { value: String(team.placementPts ?? team.placePts ?? 0), label: 'PLACE PTS' };
    case 'totalPts':
    default:
      return { value: String(team.totalPts ?? 0), label: 'TOTAL PTS' };
  }
}

// Inline logo — renders an img if it's a valid http/https URL, otherwise an initials badge
function TeamLogo({ logoUrl, name, size }: { logoUrl?: string | null; name?: string; size: number }) {
  const isHttp = logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://'));
  const initials = (name || '??').substring(0, 2).toUpperCase();
  const fontSize = Math.round(size * 0.38);
  const radius = size >= 80 ? '10px' : '6px';

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
          borderRadius: radius,
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: radius,
      backgroundColor: 'rgba(201,168,76,0.15)',
      border: '1px solid rgba(201,168,76,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: `${fontSize}px`,
      color: 'var(--accent)',
      fontFamily: 'var(--heading-font)',
      flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  );
}

export const DailyStandings: React.FC<DailyStandingsProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, topN, showStatsStamp, dailyPointsColumn = 'totalPts' } = styleConfig;

  const rawTeams: any[] = data?.results || [];
  const teams = rawTeams.slice(0, topN || 8);

  const canvaBgUrl = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
    ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
    : null;

  // Derive the column label from the first team (or fallback)
  const colMeta = resolvePoints(teams[0] ?? {}, dailyPointsColumn);

  // How many rows — drive row height dynamically so they fill the space
  const rowCount = teams.length || 1;
  // Available height after header, title, footer ≈ 800px
  const rowHeight = Math.min(110, Math.floor(760 / rowCount));
  const logoSize = Math.max(44, Math.min(72, rowHeight - 24));
  const rankFontSize = Math.min(52, Math.max(30, rowHeight - 12));
  const nameFontSize = Math.min(34, Math.max(20, rowHeight - 30));
  const ptsFontSize = Math.min(40, Math.max(24, rowHeight - 22));

  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl && !canvaBgUrl
        ? `url(${styleConfig.customBackgroundUrl})`
        : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'var(--text-primary)',
      fontFamily: 'var(--body-font)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Canva iframe background */}
      {canvaBgUrl && (
        <iframe
          src={canvaBgUrl}
          scrolling="no"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            border: 'none', zIndex: 0, pointerEvents: 'none',
          }}
        />
      )}

      {/* Dark scrim over custom background */}
      {styleConfig.colorTheme === 'custom' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 0,
        }} />
      )}

      {/* Content layer */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        <BrandingHeader styleConfig={styleConfig} />

        {/* ── Title ───────────────────────────────────────────── */}
        <div style={{
          padding: '20px 72px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          flexShrink: 0,
          borderBottom: '2px solid var(--accent)',
        }}>
          <div>
            <h1 style={{
              fontSize: '52px',
              fontWeight: 900,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              fontFamily: 'var(--heading-font)',
              lineHeight: 1,
            }}>
              {graphicTitle || 'DAILY STANDINGS'}
            </h1>
            <p style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--accent)',
              margin: '6px 0 0',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {graphicSubtitle || 'DAY COLLATED RESULTS'}
            </p>
          </div>
          {/* Column legend badge */}
          <div style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#000',
            backgroundColor: 'var(--accent)',
            padding: '6px 18px',
            borderRadius: '6px',
            alignSelf: 'center',
          }}>
            {colMeta.label}
          </div>
        </div>

        {/* ── Rows ─────────────────────────────────────────────── */}
        <div style={{
          flexGrow: 1,
          padding: '20px 72px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {teams.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--text-muted)',
              fontSize: '20px',
              border: '1px dashed var(--border)',
              borderRadius: '12px',
            }}>
              No daily standings data available
            </div>
          ) : (
            teams.map((team: any, index: number) => {
              const rank = team.rank ?? index + 1;
              const isTop3 = rank <= 3;
              const pts = resolvePoints(team, dailyPointsColumn);
              const accentColor = 'var(--accent)';
              const dimBorder = 'rgba(255,255,255,0.12)';
              const rowBg = isTop3
                ? 'linear-gradient(90deg, rgba(201,168,76,0.15) 0%, rgba(0, 0, 0, 0.65) 100%)'
                : 'rgba(0, 0, 0, 0.55)';

              return (
                <div
                  key={team.teamId || index}
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    height: `${rowHeight}px`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: isTop3 ? `1.5px solid ${accentColor}` : `1px solid ${dimBorder}`,
                    background: rowBg,
                    boxSizing: 'border-box',
                    boxShadow: isTop3 ? '0 2px 20px rgba(201,168,76,0.12)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  {/* ── Rank ── */}
                  <div style={{
                    width: '130px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isTop3 ? 'rgba(201,168,76,0.22)' : 'rgba(0, 0, 0, 0.65)',
                    borderRight: isTop3 ? `2px solid ${accentColor}` : `1px solid ${dimBorder}`,
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: `${rankFontSize}px`,
                      fontWeight: 900,
                      fontFamily: 'var(--heading-font)',
                      color: isTop3 ? accentColor : 'rgba(255,255,255,0.55)',
                      lineHeight: 1,
                    }}>
                      {rank}
                    </span>
                  </div>

                  {/* ── Team Logo + Name ── */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '22px',
                    padding: '0 32px',
                    overflow: 'hidden',
                  }}>
                    <TeamLogo logoUrl={team.logoUrl} name={team.teamName} size={logoSize} />
                    <span style={{
                      fontSize: `${nameFontSize}px`,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--heading-font)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {team.teamName || team.clanName || `Team ${rank}`}
                    </span>
                  </div>

                  {/* ── Points ── */}
                  <div style={{
                    width: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isTop3 ? 'rgba(201,168,76,0.18)' : 'rgba(0, 0, 0, 0.45)',
                    borderLeft: isTop3 ? `2px solid ${accentColor}` : `1px solid ${dimBorder}`,
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: `${ptsFontSize}px`,
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: isTop3 ? accentColor : '#FFFFFF',
                      letterSpacing: '-0.02em',
                    }}>
                      {pts.value}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <SourceLine styleConfig={styleConfig} />
        <StatsStamp show={showStatsStamp} />
      </div>
    </div>
  );
};
