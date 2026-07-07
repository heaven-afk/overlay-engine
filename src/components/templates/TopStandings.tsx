import React from 'react';
import { OverlayTemplate, TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, RankBadge, TeamLogoPlaceholder, getCanvaEmbedUrl } from './SharedElements';

interface TopStandingsProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

const COLUMN_HEADERS: Record<string, string> = {
  wins: 'WINS',
  matches: 'MATCH',
  events: 'EVENTS',
  placePts: 'PLACE',
  kills: 'KILLS',
  totalPts: 'TOTAL PTS',
  rating: 'RATING',
  ppm: 'PPM',
  kpm: 'KPM',
  killPct: 'KILL%',
  avgPlace: 'AVG PL.',
  top3Rate: 'TOP3%',
  top5Rate: 'TOP5%',
  rankLabel: 'RANK',
  identity: 'IDENTITY',
};

function resolveColumnValue(team: any, colKey: string): string {
  if (!team) return '';
  switch (colKey) {
    case 'wins':
      return String(team.wins ?? 0);
    case 'matches':
      return String(team.matches ?? 0);
    case 'events':
      return String(team.events ?? 0);
    case 'placePts':
      return String(team.placementPts ?? team.placementPoints ?? team.scores?.placementPts ?? 0);
    case 'kills':
      return String(team.kills ?? 0);
    case 'totalPts':
      return String(team.totalPts ?? team.totalPoints ?? team.scores?.totalPts ?? 0);
    case 'rating': {
      const val = team.scores?.FINAL_RATING;
      return val !== undefined ? Number(val).toFixed(1) : '0.0';
    }
    case 'ppm': {
      const val = team.analytics?.PPM;
      return val !== undefined ? Number(val).toFixed(2) : '0.00';
    }
    case 'kpm': {
      const val = team.analytics?.KPM;
      return val !== undefined ? Number(val).toFixed(2) : '0.00';
    }
    case 'killPct': {
      let val = team.analytics?.killPct;
      if (val === undefined) return '0.0%';
      if (typeof val === 'number') {
        const displayVal = val < 1 ? val * 100 : val;
        return `${displayVal.toFixed(1)}%`;
      }
      return `${val}%`;
    }
    case 'avgPlace': {
      const val = team.analytics?.avgPlace;
      return val !== undefined ? Number(val).toFixed(2) : '0.00';
    }
    case 'top3Rate': {
      let val = team.analytics?.top3Rate;
      if (val === undefined) return '0.0%';
      if (typeof val === 'number') {
        const displayVal = val < 1 ? val * 100 : val;
        return `${displayVal.toFixed(1)}%`;
      }
      return `${val}%`;
    }
    case 'top5Rate': {
      let val = team.analytics?.top5Rate;
      if (val === undefined) return '0.0%';
      if (typeof val === 'number') {
        const displayVal = val < 1 ? val * 100 : val;
        return `${displayVal.toFixed(1)}%`;
      }
      return `${val}%`;
    }
    case 'rankLabel':
      return team.scores?.rankLabel || '-';
    case 'identity':
      return team.identity || '-';
    default:
      return '';
  }
}

export const TopStandings: React.FC<TopStandingsProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, topN, showColumns, showStatsStamp } = styleConfig;

  // Retrieve teams from currentData. Can fallback to data.results if standings were pushed directly as array
  const rawTeams = data?.teams || data?.results || [];
  const teams = rawTeams.slice(0, topN || 10);

  // Render graphic title with keyword highlighted (wrapped in *word*, [word], or just the last word)
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

  // Build grid columns style dynamically
  const columnsList = showColumns || ['wins', 'matches', 'events', 'placePts', 'kills', 'totalPts', 'rating', 'ppm', 'kpm', 'killPct', 'avgPlace', 'top3Rate'];
  const gridTemplate = `64px minmax(240px, 4fr) ${columnsList.map(col => 
    col === 'identity' ? 'minmax(140px, 1.8fr)' : col === 'rankLabel' ? 'minmax(110px, 1.4fr)' : 'minmax(80px, 1fr)'
  ).join(' ')}`;

  const canvaBgUrl = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
    ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
    : null;

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

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <BrandingHeader styleConfig={styleConfig} />

        {/* Title block */}
        <div style={{
          padding: '20px 48px 12px',
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
            {renderTitle(graphicTitle)}
          </h1>
          <p style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            margin: 0,
            letterSpacing: '0.02em',
          }}>
            {graphicSubtitle}
          </p>
        </div>

        {/* Table grid container */}
        <div style={{
          flexGrow: 1,
          padding: '0 48px 52px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '2px solid var(--accent)',
            background: 'rgba(255, 255, 255, 0.01)',
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              fontFamily: 'var(--heading-font)',
              textAlign: 'center',
            }}>
              RK
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              fontFamily: 'var(--heading-font)',
              paddingLeft: '12px',
            }}>
              TEAM
            </div>
            {columnsList.map((col) => (
              <div 
                key={col} 
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--heading-font)',
                  textAlign: (col === 'identity' || col === 'rankLabel') ? 'left' : 'right',
                  paddingLeft: (col === 'identity' || col === 'rankLabel') ? '12px' : '0',
                }}
              >
                {COLUMN_HEADERS[col] || col.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            marginTop: '4px',
            flexGrow: 1,
            justifyContent: 'space-between',
            minHeight: 0,
          }}>
            {teams.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                color: 'var(--text-muted)',
                fontSize: '16px',
              }}>
                No standings data pushed to this slot yet
              </div>
            ) : (
              teams.map((team: any, index: number) => {
                const rank = index + 1;
                const isAlternative = index % 2 === 1;
                const isTop3 = rank <= 3;

                return (
                  <div 
                    key={team.id || team.teamId || index} 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: gridTemplate,
                      alignItems: 'center',
                      padding: '10px 16px',
                      backgroundColor: isAlternative ? 'var(--bg-row-alt)' : 'var(--bg-row)',
                      borderLeft: isTop3 ? '3px solid var(--accent)' : '3px solid transparent',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Rank */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <RankBadge rank={rank} />
                    </div>

                    {/* Team Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      paddingLeft: '12px',
                    }}>
                      <TeamLogoPlaceholder logoUrl={team.logoUrl} name={team.teamName} size={36} />
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--text-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {team.teamName}
                      </span>
                    </div>

                    {/* Columns */}
                    {columnsList.map((col) => {
                      const value = resolveColumnValue(team, col);
                      const isTotalPts = col === 'totalPts';
                      const isRating = col === 'rating';
                      const textAccent = (isTotalPts || isRating);

                      return (
                        <div 
                          key={col} 
                          style={{
                            fontSize: isRating ? '16px' : '14px',
                            fontWeight: textAccent ? 800 : 500,
                            color: textAccent ? 'var(--accent)' : 'var(--text-primary)',
                            textAlign: (col === 'identity' || col === 'rankLabel') ? 'left' : 'right',
                            fontFamily: (col === 'identity' || col === 'rankLabel') ? 'var(--body-font)' : 'monospace',
                            paddingLeft: (col === 'identity' || col === 'rankLabel') ? '12px' : '0',
                            letterSpacing: (col === 'identity' || col === 'rankLabel') ? '0' : '0.05em',
                          }}
                        >
                          {value}
                        </div>
                      );
                    })}
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
