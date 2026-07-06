import React from 'react';
import { OverlayTemplate, TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, TeamLogoPlaceholder } from './SharedElements';

interface HeadToHeadProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

interface StatComparison {
  name: string;
  valA: number;
  valB: number;
  displayA: string;
  displayB: string;
  isLowerBetter?: boolean;
}

export const HeadToHead: React.FC<HeadToHeadProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  const teamA = data?.teamA || {};
  const teamB = data?.teamB || {};

  // Extract raw values safely
  const getVal = (team: any, key: string) => {
    if (!team) return 0;
    switch (key) {
      case 'totalPts':
        return Number(team.totalPts ?? team.totalPoints ?? team.scores?.totalPts ?? 0);
      case 'rating':
        return Number(team.scores?.FINAL_RATING ?? 0);
      case 'ppm':
        return Number(team.analytics?.PPM ?? 0);
      case 'kpm':
        return Number(team.analytics?.KPM ?? 0);
      case 'killPct': {
        const p = team.analytics?.killPct ?? 0;
        return p < 1 ? p * 100 : p;
      }
      case 'winRate': {
        const w = team.winRate ?? team.analytics?.winRate;
        if (w !== undefined) return w < 1 ? w * 100 : w;
        const matches = Number(team.matches ?? 0);
        const wins = Number(team.wins ?? 0);
        return matches > 0 ? (wins / matches) * 100 : 0;
      }
      case 'top5Rate': {
        const t5 = team.analytics?.top5Rate ?? 0;
        return t5 < 1 ? t5 * 100 : t5;
      }
      case 'avgPlace':
        return Number(team.analytics?.avgPlace ?? team.avgPlacement ?? 0);
      default:
        return 0;
    }
  };

  // Compile list of stats
  const statsList: StatComparison[] = [
    {
      name: 'Total Points',
      valA: getVal(teamA, 'totalPts'),
      valB: getVal(teamB, 'totalPts'),
      displayA: String(Math.round(getVal(teamA, 'totalPts'))),
      displayB: String(Math.round(getVal(teamB, 'totalPts'))),
    },
    {
      name: 'Rating',
      valA: getVal(teamA, 'rating'),
      valB: getVal(teamB, 'rating'),
      displayA: getVal(teamA, 'rating').toFixed(1),
      displayB: getVal(teamB, 'rating').toFixed(1),
    },
    {
      name: 'PPM',
      valA: getVal(teamA, 'ppm'),
      valB: getVal(teamB, 'ppm'),
      displayA: getVal(teamA, 'ppm').toFixed(2),
      displayB: getVal(teamB, 'ppm').toFixed(2),
    },
    {
      name: 'KPM',
      valA: getVal(teamA, 'kpm'),
      valB: getVal(teamB, 'kpm'),
      displayA: getVal(teamA, 'kpm').toFixed(2),
      displayB: getVal(teamB, 'kpm').toFixed(2),
    },
    {
      name: 'Kill %',
      valA: getVal(teamA, 'killPct'),
      valB: getVal(teamB, 'killPct'),
      displayA: `${getVal(teamA, 'killPct').toFixed(1)}%`,
      displayB: `${getVal(teamB, 'killPct').toFixed(1)}%`,
    },
    {
      name: 'Win Rate',
      valA: getVal(teamA, 'winRate'),
      valB: getVal(teamB, 'winRate'),
      displayA: `${getVal(teamA, 'winRate').toFixed(1)}%`,
      displayB: `${getVal(teamB, 'winRate').toFixed(1)}%`,
    },
    {
      name: 'Top 5 Rate',
      valA: getVal(teamA, 'top5Rate'),
      valB: getVal(teamB, 'top5Rate'),
      displayA: `${getVal(teamA, 'top5Rate').toFixed(1)}%`,
      displayB: `${getVal(teamB, 'top5Rate').toFixed(1)}%`,
    },
    {
      name: 'Avg Placement',
      valA: getVal(teamA, 'avgPlace'),
      valB: getVal(teamB, 'avgPlace'),
      displayA: getVal(teamA, 'avgPlace').toFixed(2),
      displayB: getVal(teamB, 'avgPlace').toFixed(2),
      isLowerBetter: true,
    },
  ];

  // Count wins to highlight overall winner
  let winsA = 0;
  let winsB = 0;

  statsList.forEach(stat => {
    if (stat.valA === stat.valB) return;
    if (stat.isLowerBetter) {
      if (stat.valA < stat.valB && stat.valA > 0) winsA++;
      else if (stat.valB < stat.valA && stat.valB > 0) winsB++;
    } else {
      if (stat.valA > stat.valB) winsA++;
      else winsB++;
    }
  });

  const overallWinner = winsA === winsB ? null : winsA > winsB ? 'A' : 'B';

  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--body-font)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      <BrandingHeader styleConfig={styleConfig} />

      {/* Title */}
      <div style={{
        padding: '20px 48px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <h1 style={{
          fontSize: '38px',
          fontWeight: 800,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--accent)',
          fontFamily: 'var(--heading-font)',
        }}>
          {graphicTitle || 'HEAD TO HEAD'}
        </h1>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          {graphicSubtitle || 'TEAM COMPARISON'}
        </p>
      </div>

      {/* Main content grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: '24px 64px 56px',
        flexGrow: 1,
        boxSizing: 'border-box',
        gap: '40px',
        minHeight: 0,
      }}>
        {/* Team A Card */}
        <div style={{
          flex: '1',
          maxWidth: '340px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: overallWinner === 'A' ? '2px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: overallWinner === 'A' ? '0 0 30px var(--accent-muted)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
        }}>
          {overallWinner === 'A' && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '10px',
              fontWeight: 800,
              backgroundColor: 'var(--accent)',
              color: '#000',
              padding: '4px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em',
            }}>
              WINNER
            </div>
          )}
          <TeamLogoPlaceholder logoUrl={teamA.logoUrl} name={teamA.teamName} size={110} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--text-heading)',
            marginTop: '20px',
            marginBottom: '12px',
            textAlign: 'center',
            fontFamily: 'var(--heading-font)',
          }}>
            {teamA.teamName || 'TEAM A'}
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {teamA.scores?.rankLabel && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--rank-bg)',
                border: '1px solid var(--rank-border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {teamA.scores.rankLabel}
              </span>
            )}
            {teamA.identity && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {teamA.identity}
              </span>
            )}
          </div>
        </div>

        {/* VS Separator & Comparison Table */}
        <div style={{
          flex: '2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Comparisons Table */}
          <div style={{
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '24px 32px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {statsList.map((stat) => {
              // Calculate proportion for comparison bars
              let pctA = 0;
              let pctB = 0;
              const { valA, valB, isLowerBetter } = stat;

              if (valA > 0 || valB > 0) {
                if (isLowerBetter) {
                  // Invert avg placement (lower is better)
                  const invA = valA > 0 ? 1 / valA : 0.001;
                  const invB = valB > 0 ? 1 / valB : 0.001;
                  const total = invA + invB;
                  pctA = (invA / total) * 100;
                  pctB = (invB / total) * 100;
                } else {
                  const total = valA + valB;
                  pctA = (valA / total) * 100;
                  pctB = (valB / total) * 100;
                }
              }

              // Determine winner of this stat
              const isWinnerA = isLowerBetter 
                ? (valA < valB && valA > 0) 
                : (valA > valB);
              const isWinnerB = isLowerBetter 
                ? (valB < valA && valB > 0) 
                : (valB > valA);

              const colorA = isWinnerA ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)';
              const colorB = isWinnerB ? 'var(--accent)' : 'rgba(255, 255, 255, 0.15)';

              return (
                <div key={stat.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '36px',
                }}>
                  {/* Team A value */}
                  <div style={{
                    width: '90px',
                    textAlign: 'right',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isWinnerA ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: 'monospace',
                  }}>
                    {stat.displayA}
                  </div>

                  {/* Comparison Bar */}
                  <div style={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0 24px',
                    boxSizing: 'border-box',
                  }}>
                    {/* Stat Label */}
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      letterSpacing: '0.05em',
                      fontFamily: 'var(--heading-font)',
                    }}>
                      {stat.name}
                    </div>
                    {/* Double Bar */}
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    }}>
                      {/* Left bar (A) - fills right to left */}
                      <div style={{
                        width: '50%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        background: 'rgba(255, 255, 255, 0.01)',
                      }}>
                        <div style={{
                          width: `${pctA}%`,
                          height: '100%',
                          backgroundColor: colorA,
                          borderRadius: '4px 0 0 4px',
                          boxShadow: isWinnerA ? '0 0 8px var(--accent)' : 'none',
                        }} />
                      </div>
                      {/* Divider */}
                      <div style={{ width: '2px', backgroundColor: 'var(--bg-card)' }} />
                      {/* Right bar (B) - fills left to right */}
                      <div style={{
                        width: '50%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        background: 'rgba(255, 255, 255, 0.01)',
                      }}>
                        <div style={{
                          width: `${pctB}%`,
                          height: '100%',
                          backgroundColor: colorB,
                          borderRadius: '0 4px 4px 0',
                          boxShadow: isWinnerB ? '0 0 8px var(--accent)' : 'none',
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Team B value */}
                  <div style={{
                    width: '90px',
                    textAlign: 'left',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isWinnerB ? 'var(--accent)' : 'var(--text-primary)',
                    fontFamily: 'monospace',
                  }}>
                    {stat.displayB}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team B Card */}
        <div style={{
          flex: '1',
          maxWidth: '340px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: overallWinner === 'B' ? '2px solid var(--accent)' : '1px solid var(--border)',
          boxShadow: overallWinner === 'B' ? '0 0 30px var(--accent-muted)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          position: 'relative',
        }}>
          {overallWinner === 'B' && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '10px',
              fontWeight: 800,
              backgroundColor: 'var(--accent)',
              color: '#000',
              padding: '4px 8px',
              borderRadius: '4px',
              letterSpacing: '0.05em',
            }}>
              WINNER
            </div>
          )}
          <TeamLogoPlaceholder logoUrl={teamB.logoUrl} name={teamB.teamName} size={110} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--text-heading)',
            marginTop: '20px',
            marginBottom: '12px',
            textAlign: 'center',
            fontFamily: 'var(--heading-font)',
          }}>
            {teamB.teamName || 'TEAM B'}
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {teamB.scores?.rankLabel && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--rank-bg)',
                border: '1px solid var(--rank-border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {teamB.scores.rankLabel}
              </span>
            )}
            {teamB.identity && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {teamB.identity}
              </span>
            )}
          </div>
        </div>
      </div>

      <SourceLine styleConfig={styleConfig} />
      <StatsStamp show={showStatsStamp} />
    </div>
  );
};
