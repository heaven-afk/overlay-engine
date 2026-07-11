import React from 'react';
import { OverlayTemplate, TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, TeamLogoPlaceholder, getCanvaEmbedUrl } from './SharedElements';

interface DailyStandingsProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

export const DailyStandings: React.FC<DailyStandingsProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, topN, showStatsStamp } = styleConfig;

  // Retrieve teams from currentData
  const rawTeams = data?.results || [];
  const teams = rawTeams.slice(0, topN || 5);

  const canvaBgUrl = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
    ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
    : null;

  const bgStyle = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl && !canvaBgUrl
    ? {
        backgroundImage: `url(${styleConfig.customBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        backgroundColor: 'var(--bg-primary)',
      };

  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      ...bgStyle,
      color: 'var(--text-primary)',
      fontFamily: 'var(--body-font)',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
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

      {/* Semi-transparent dark overlay for custom backgrounds to ensure readability */}
      {styleConfig.colorTheme === 'custom' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          zIndex: 0,
        }} />
      )}

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <BrandingHeader styleConfig={styleConfig} />

        {/* Title Block (Aligned Right to look clean & highlight layout) */}
        <div style={{
          padding: '24px 64px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 900,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#FFFFFF',
            fontFamily: 'var(--heading-font)',
          }}>
            {graphicTitle || 'DAILY STANDINGS'}
          </h1>
          <p style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--accent)',
            margin: 0,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {graphicSubtitle || 'DAY COLLATED RESULTS'}
          </p>
        </div>

        {/* Table/Cards Container */}
        <div style={{
          flexGrow: 1,
          padding: '0 64px 64px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 200px',
            alignItems: 'center',
            padding: '12px 24px',
            boxSizing: 'border-box',
            marginBottom: '8px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              fontFamily: 'var(--heading-font)',
              textAlign: 'center',
              letterSpacing: '0.1em',
            }}>
              RANK
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              fontFamily: 'var(--heading-font)',
              paddingLeft: '32px',
              letterSpacing: '0.1em',
            }}>
              TEAM NAME
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              fontFamily: 'var(--heading-font)',
              textAlign: 'center',
              letterSpacing: '0.1em',
            }}>
              PTS
            </div>
          </div>

          {/* Data Rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexGrow: 1,
            justifyContent: 'flex-start',
            minHeight: 0,
          }}>
            {teams.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                color: 'var(--text-muted)',
                fontSize: '18px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
              }}>
                No daily standings data pushed to this slot yet
              </div>
            ) : (
              teams.map((team: any, index: number) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const borderOpacity = 0.3;

                return (
                  <div
                    key={team.teamId || index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr 200px',
                      alignItems: 'stretch',
                      minHeight: '100px',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Rank Cell */}
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      border: `2px solid var(--accent)`,
                      borderColor: isTop3 ? 'var(--accent)' : `rgba(255, 255, 255, ${borderOpacity})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isTop3 ? 'var(--accent)' : '#FFFFFF',
                      borderRadius: '8px 0 0 8px',
                    }}>
                      {rank}
                    </div>

                    {/* Team Name & Logo Cell */}
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      borderTop: `2px solid rgba(255, 255, 255, ${borderOpacity})`,
                      borderBottom: `2px solid rgba(255, 255, 255, ${borderOpacity})`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      paddingLeft: '32px',
                    }}>
                      <TeamLogoPlaceholder logoUrl={team.logoUrl} name={team.teamName} size={48} />
                      <span style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {team.teamName}
                      </span>
                    </div>

                    {/* Points Cell */}
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      border: `2px solid var(--accent)`,
                      borderColor: isTop3 ? 'var(--accent)' : `rgba(255, 255, 255, ${borderOpacity})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      borderRadius: '0 8px 8px 0',
                    }}>
                      {team.totalPts ?? 0}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <SourceLine styleConfig={styleConfig} />
        <StatsStamp show={showStatsStamp} />
      </div>
    </div>
  );
};
