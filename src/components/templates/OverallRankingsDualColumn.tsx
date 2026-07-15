import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, getCanvaEmbedUrl } from './SharedElements';

interface OverallRankingsDualColumnProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

export const OverallRankingsDualColumn: React.FC<OverallRankingsDualColumnProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  // Retrieve flat list of rows (accepts 'rows', 'teams', or 'results')
  const rawRows = data?.rows || data?.teams || data?.results || [];

  // Map each raw row to the standardized structure
  const rows = rawRows.map((team: any, index: number) => {
    const rank = team.rank ?? (index + 1);
    const teamName = team.teamName || team.clanName || `Team ${index + 1}`;
    const placementPoints = Number(team.placementPoints ?? team.placementPts ?? team.placePts ?? team.scores?.placementPts ?? 0);
    const kills = Number(team.kills ?? team.scores?.kills ?? 0);
    const totalPoints = Number(
      team.totalPoints ?? 
      team.totalPts ?? 
      team.scores?.totalPts ?? 
      (placementPoints + kills)
    );

    return {
      rank,
      teamName,
      placementPoints,
      kills,
      totalPoints,
      id: team.id || team.teamId || index,
    };
  });

  // Split logic: ceil(totalTeams / 2) for the left column, rest for the right column
  const total = rows.length;
  const midpoint = Math.ceil(total / 2);
  const leftColumnRows = rows.slice(0, midpoint);
  const rightColumnRows = rows.slice(midpoint);

  const canvaBgUrl = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
    ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
    : null;

  // Dynamic row sizing for best fit
  const maxRowsPerCol = Math.max(1, leftColumnRows.length);
  // Available height for content: ~700px. Calculate dynamic row height
  const rowHeight = Math.min(54, Math.floor(700 / maxRowsPerCol));
  const rankFontSize = Math.min(14, Math.max(11, Math.floor(rowHeight * 0.35)));
  const textFontSize = Math.min(15, Math.max(12, Math.floor(rowHeight * 0.35)));

  // Title renderer highlighting logic matching other templates
  const renderTitle = (text: string) => {
    if (!text) return null;
    const bracketMatch = text.match(/\[(.*?)\]/);
    if (bracketMatch) {
      const parts = text.split(bracketMatch[0]);
      return (
        <>
          {parts[0]}<span style={{ color: 'var(--accent)' }}>{bracketMatch[1]}</span>{parts[1]}
        </>
      );
    }
    const starMatch = text.match(/\*(.*?)\*/);
    if (starMatch) {
      const parts = text.split(starMatch[0]);
      return (
        <>
          {parts[0]}<span style={{ color: 'var(--accent)' }}>{starMatch[1]}</span>{parts[1]}
        </>
      );
    }
    const words = text.split(' ');
    if (words.length <= 1) {
      return <span style={{ color: 'var(--accent)' }}>{text}</span>;
    }
    const lastWord = words.pop();
    return (
      <>
        {words.join(' ')} <span style={{ color: 'var(--accent)' }}>{lastWord}</span>
      </>
    );
  };

  const renderColumn = (colRows: typeof rows, startIndexOffset: number) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Column Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px minmax(180px, 1fr) 80px 80px 90px',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '2px solid var(--accent)',
          background: 'rgba(255, 255, 255, 0.01)',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
          }}>
            RANK
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            paddingLeft: '12px',
          }}>
            TEAM NAME
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'right',
          }}>
            PL PTS
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'right',
          }}>
            KILLS
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
          }}>
            TOTAL
          </div>
        </div>

        {/* Column Data Rows */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          marginTop: '6px',
          flexGrow: 1,
          justifyContent: 'flex-start',
        }}>
          {colRows.map((team: any, idx: number) => {
            const index = startIndexOffset + idx;
            const isAlternative = index % 2 === 1;
            const isTop3 = team.rank <= 3;

            return (
              <div
                key={team.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px minmax(180px, 1fr) 80px 80px 90px',
                  alignItems: 'center',
                  height: `${rowHeight}px`,
                  backgroundColor: isAlternative ? 'var(--bg-row-alt)' : 'var(--bg-row)',
                  borderLeft: isTop3 ? '3.5px solid var(--accent)' : '3.5px solid transparent',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  borderTop: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Rank Badge */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isTop3 ? '28px' : '24px',
                    height: isTop3 ? '28px' : '24px',
                    borderRadius: '50%',
                    fontFamily: 'var(--heading-font)',
                    fontWeight: 800,
                    fontSize: `${rankFontSize}px`,
                    color: isTop3 ? 'var(--accent)' : 'var(--text-muted)',
                    border: isTop3 ? '1.5px solid var(--accent)' : '1px solid var(--rank-border)',
                    backgroundColor: isTop3 ? 'var(--accent-muted)' : 'var(--rank-bg)',
                    boxSizing: 'border-box',
                  }}>
                    {team.rank}
                  </div>
                </div>

                {/* Team Name */}
                <div style={{
                  paddingLeft: '12px',
                  fontSize: `${textFontSize}px`,
                  fontWeight: 700,
                  color: 'var(--text-heading)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {team.teamName}
                </div>

                {/* Placement Points */}
                <div style={{
                  fontSize: `${textFontSize}px`,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}>
                  {team.placementPoints}
                </div>

                {/* Kills */}
                <div style={{
                  fontSize: `${textFontSize}px`,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}>
                  {team.kills}
                </div>

                {/* Total Points (Score Box) */}
                <div style={{
                  fontSize: `${textFontSize + 1}px`,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)', // Darker score box
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'stretch',
                  borderLeft: '1px solid var(--border)',
                  boxSizing: 'border-box',
                }}>
                  {team.totalPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      {/* Canva background iframe */}
      {canvaBgUrl && (
        <iframe
          src={canvaBgUrl}
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            border: 'none', zIndex: 0, pointerEvents: 'none',
          }}
        />
      )}

      {/* Scrim overlay for custom background */}
      {styleConfig.colorTheme === 'custom' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.58)',
          zIndex: 0,
        }} />
      )}

      {/* Content wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <BrandingHeader styleConfig={styleConfig} />

        {/* Title Block */}
        <div style={{
          padding: '24px 72px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontSize: '44px',
            fontWeight: 800,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '-0.025em',
            color: 'var(--text-heading)',
            fontFamily: 'var(--heading-font)',
          }}>
            {renderTitle(graphicTitle || 'OVERALL RANKINGS')}
          </h1>
          {graphicSubtitle && (
            <p style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              margin: 0,
              letterSpacing: '0.02em',
            }}>
              {graphicSubtitle}
            </p>
          )}
        </div>

        {/* Split Columns Grid */}
        <div style={{
          flexGrow: 1,
          padding: '0 72px 64px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '54px',
          boxSizing: 'border-box',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* Left Column */}
          <div style={{ minHeight: 0 }}>
            {leftColumnRows.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--text-muted)',
                fontSize: '16px',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
              }}>
                No rankings data pushed to this slot yet
              </div>
            ) : (
              renderColumn(leftColumnRows, 0)
            )}
          </div>

          {/* Right Column */}
          <div style={{ minHeight: 0 }}>
            {rightColumnRows.length > 0 && renderColumn(rightColumnRows, midpoint)}
          </div>
        </div>

        <SourceLine styleConfig={styleConfig} />
        <StatsStamp show={showStatsStamp} />
      </div>
    </div>
  );
};
