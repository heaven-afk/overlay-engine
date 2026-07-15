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
    const wins = Number(team.wins ?? team.scores?.wins ?? team.winsCount ?? 0);
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
      wins,
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

  // Fixed larger font sizes and heights designed for a 1920x1080 canvas
  const rowHeight = 72;
  const rankFontSize = 24;
  const textFontSize = 24;

  const renderColumn = (colRows: typeof rows, startIndexOffset: number) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Column Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 100px 100px 100px 100px',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(0, 0, 0, 0.45)',
          boxSizing: 'border-box',
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--accent)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            RANK
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            paddingLeft: '24px',
            letterSpacing: '0.05em',
          }}>
            TEAM NAME
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            PL PTS
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            KILLS
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            TOTAL
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            fontFamily: 'var(--heading-font)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            WINS
          </div>
        </div>

        {/* Column Data Rows (Unified grouped container matching reference image) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '12px',
          gap: '10px',
          flexGrow: 1,
          justifyContent: 'flex-start',
        }}>
          {colRows.map((team: any, idx: number) => {
            return (
              <div
                key={team.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px 100px 100px 100px',
                  alignItems: 'stretch',
                  height: `${rowHeight}px`,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--heading-font)',
                  fontWeight: 800,
                  fontSize: `${rankFontSize}px`,
                  color: '#FFF',
                }}>
                  {team.rank}
                </div>

                {/* Team Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '24px',
                  fontSize: `${textFontSize}px`,
                  fontWeight: 800,
                  color: '#FFF',
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: `${textFontSize}px`,
                  fontWeight: 800,
                  color: '#FFF',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {team.placementPoints}
                </div>

                {/* Kills */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: `${textFontSize}px`,
                  fontWeight: 800,
                  color: '#FFF',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {team.kills}
                </div>

                {/* Total Points */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: `${textFontSize + 2}px`,
                  fontWeight: 900,
                  color: '#FFF',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {team.totalPoints}
                </div>

                {/* Wins */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: `${textFontSize}px`,
                  fontWeight: 800,
                  color: '#FFF',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  {team.wins}
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
        : 'radial-gradient(circle at top, rgba(243, 196, 86, 0.08) 0%, rgba(15, 15, 17, 0) 70%), radial-gradient(circle at bottom, rgba(255, 255, 255, 0.02) 0%, rgba(15, 15, 17, 0) 50%)',
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

        {/* Title Block (Centered gold metallic style matching reference image) */}
        <div style={{
          padding: '36px 48px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontSize: '68px',
            fontWeight: 900,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--heading-font)',
            background: 'linear-gradient(to bottom, #FFEFA6 0%, #F5C647 45%, #B88514 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(245, 198, 71, 0.15)',
          }}>
            {graphicTitle || 'OVERALL RANKINGS'}
          </h1>
        </div>

        {/* Split Columns Grid */}
        <div style={{
          flexGrow: 1,
          padding: '16px 48px 80px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
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

        {/* Bottom Banner (Centered text matching reference image approach) */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: '48px',
          right: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
        }}>
          {graphicSubtitle && (
            <div style={{
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'var(--heading-font)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              {graphicSubtitle}
            </div>
          )}
          <div style={{
            width: '100%',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px',
          }} />
        </div>

        <SourceLine styleConfig={styleConfig} />
        <StatsStamp show={showStatsStamp} />
      </div>
    </div>
  );
};
