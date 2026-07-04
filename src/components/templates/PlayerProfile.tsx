import React from 'react';
import { OverlayTemplate, TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine } from './SharedElements';

interface PlayerProfileProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

interface StatCardInfo {
  label: string;
  value: string | number;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  // Retrieve single player. Slots push data under currentData.player
  const player = data?.player || data || {};

  // Extract stat card values
  const getCardStats = (): StatCardInfo[] => {
    const totalKills = Number(player.careerStats?.careerKills ?? player.careerStats?.totalKills ?? player.careerKills ?? 0);
    const kpm = Number(player.careerStats?.avgKills ?? player.avgKills ?? player.kpm ?? 0);
    const dpm = Number(player.careerStats?.avgDamage ?? player.avgDamage ?? player.dpm ?? 0);
    
    let winRate = player.careerStats?.winRate ?? player.winRate ?? 0;
    if (winRate < 1 && winRate > 0) winRate = winRate * 100;

    let top5Rate = player.careerStats?.top5Rate ?? player.top5Rate ?? 0;
    if (top5Rate < 1 && top5Rate > 0) top5Rate = top5Rate * 100;

    const avgPlace = Number(player.careerStats?.avgPlacement ?? player.avgPlacement ?? player.avgPlace ?? 0);

    return [
      { label: 'TOTAL KILLS', value: Math.round(totalKills) },
      { label: 'KPM', value: kpm.toFixed(2) },
      { label: 'DPM', value: dpm.toFixed(0) },
      { label: 'WIN RATE', value: `${winRate.toFixed(1)}%` },
      { label: 'TOP 5 RATE', value: `${top5Rate.toFixed(1)}%` },
      { label: 'AVG PLACEMENT', value: avgPlace.toFixed(2) },
    ];
  };

  const statCards = getCardStats();

  // Extract Rating Breakdown values
  const ratingPower = Number(player.scores?.POWER ?? player.analytics?.power ?? 70.0);
  const ratingConversion = Number(player.scores?.CONVERSION ?? player.analytics?.conversion ?? 75.0);
  const ratingForm = Number(player.scores?.FORM ?? player.analytics?.form ?? 60.0);
  const finalRating = Number(player.scores?.FINAL_RATING ?? 625.0);

  const breakdowns = [
    { label: 'POWER', value: ratingPower },
    { label: 'CONVERSION', value: ratingConversion },
    { label: 'FORM', value: ratingForm },
  ];

  // Career History
  const historyList = player.careerStats?.tournaments || player.careerHistory || [
    { tournament: 'African BR Championship', kills: 48, matches: 6, kpm: 8.0, rating: 620 },
    { tournament: 'Heaven Invitational S1', kills: 35, matches: 5, kpm: 7.0, rating: 590 }
  ];

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

      {/* Header section (Player IGN and Info) */}
      <div style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontSize: '54px',
            fontWeight: 800,
            textTransform: 'uppercase',
            margin: 0,
            color: 'var(--text-heading)',
            fontFamily: 'var(--heading-font)',
            letterSpacing: '-0.02em',
            lineHeight: '1',
          }}>
            {player.ign || 'PLAYER IGN'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}>
              {player.professionalName || 'PRO PLAYER'} • {player.teamName || 'NO TEAM'}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              padding: '4px 10px',
              borderRadius: '6px',
              textTransform: 'uppercase',
            }}>
              {player.classBadge || player.class || 'SLAYER'}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}>
            {player.device || 'N/A'} • {player.region || 'N/A'} • {player.country || 'N/A'}
          </div>
        </div>

        {/* Right side title details */}
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {graphicTitle || 'PLAYER PROFILE'}
          </span>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}>
            {graphicSubtitle || 'CAREER METRICS'}
          </div>
        </div>
      </div>

      {/* Main Stats Area split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: '40px',
        padding: '32px 48px 100px',
        flexGrow: 1,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Left Side: Stat Cards & Career History Table */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Stat Cards Grid (6 cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            {statCards.map((card, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--heading-font)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  margin: '8px 0 0',
                  fontFamily: 'monospace',
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Career History Table */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            flexGrow: 1,
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
              fontFamily: 'var(--heading-font)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px',
              marginBottom: '12px',
            }}>
              Career History
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: '4px 8px',
                textTransform: 'uppercase',
              }}>
                <div>Tournament</div>
                <div style={{ textAlign: 'right' }}>Kills</div>
                <div style={{ textAlign: 'right' }}>Matches</div>
                <div style={{ textAlign: 'right' }}>KPM</div>
                <div style={{ textAlign: 'right' }}>Rating</div>
              </div>

              {historyList.map((row: any, i: number) => (
                <div 
                  key={i} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '8px',
                    backgroundColor: i % 2 === 1 ? 'var(--bg-row-alt)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.tournament || row.name || 'Tournament'}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.kills ?? 0}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.matches ?? 0}</div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {Number(row.kpm ?? 0).toFixed(2)}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>
                    {Number(row.rating ?? 0).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Rating Breakdown */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '24px 32px',
          boxSizing: 'border-box',
        }}>
          {/* Header */}
          <div style={{
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--text-heading)',
            letterSpacing: '0.05em',
            fontFamily: 'var(--heading-font)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
          }}>
            Player Rating Breakdown
          </div>

          {/* Breakdown bars */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            margin: '20px 0',
          }}>
            {breakdowns.map((b) => (
              <div key={b.label} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--heading-font)',
                  letterSpacing: '0.05em',
                }}>
                  <span>{b.label}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {b.value.toFixed(2)}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, b.value))}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '4px',
                    boxShadow: '0 0 8px var(--accent-muted)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Score & Labels */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                PLAYER RATING
              </span>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: 'var(--accent)',
                marginTop: '4px',
                fontFamily: 'monospace',
              }}>
                {finalRating.toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/ 1000</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              paddingTop: '12px',
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}>
                {player.identity || 'SLAYER'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--rank-bg)',
                border: '1px solid var(--rank-border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}>
                {player.labels?.powerLabel || 'POWER OUTSTANDING'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--rank-bg)',
                border: '1px solid var(--rank-border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}>
                {player.labels?.formLabel || 'RED HOT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SourceLine styleConfig={styleConfig} />
      <StatsStamp show={showStatsStamp} />
    </div>
  );
};
