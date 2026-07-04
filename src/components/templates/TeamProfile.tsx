import React from 'react';
import { OverlayTemplate, TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, TeamLogoPlaceholder } from './SharedElements';

interface TeamProfileProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

interface StatCardInfo {
  label: string;
  value: string | number;
  rank?: string | number;
}

export const TeamProfile: React.FC<TeamProfileProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  // Retrieve single team. Slots might push data under currentData.team
  const team = data?.team || data || {};

  // Extract stat card values
  const getCardStats = (): StatCardInfo[] => {
    const totalPts = Number(team.totalPts ?? team.totalPoints ?? team.scores?.totalPts ?? 0);
    const totalKills = Number(team.kills ?? team.scores?.kills ?? 0);
    
    const ppm = Number(team.analytics?.PPM ?? 0);
    const kpm = Number(team.analytics?.KPM ?? 0);
    
    let winRate = team.winRate ?? team.analytics?.winRate ?? 0;
    if (winRate < 1 && winRate > 0) winRate = winRate * 100;
    
    let killPct = team.analytics?.killPct ?? 0;
    if (killPct < 1 && killPct > 0) killPct = killPct * 100;
    
    let top5Rate = team.analytics?.top5Rate ?? 0;
    if (top5Rate < 1 && top5Rate > 0) top5Rate = top5Rate * 100;
    
    const avgPlace = Number(team.analytics?.avgPlace ?? team.avgPlacement ?? 0);

    const overallRank = team.analyticsRank ?? team.scores?.rank ?? 1;

    return [
      { label: 'TOTAL PTS', value: Math.round(totalPts), rank: team.scores?.totalPtsRank || overallRank },
      { label: 'TOTAL KILLS', value: Math.round(totalKills), rank: team.scores?.killsRank || overallRank },
      { label: 'PPM', value: ppm.toFixed(2), rank: team.analyticsRanks?.PPM || overallRank },
      { label: 'KPM', value: kpm.toFixed(2), rank: team.analyticsRanks?.KPM || overallRank },
      { label: 'WIN RATE', value: `${winRate.toFixed(1)}%`, rank: team.analyticsRanks?.winRate || overallRank },
      { label: 'KILL %', value: `${killPct.toFixed(1)}%`, rank: team.analyticsRanks?.killPct || overallRank },
      { label: 'TOP 5 RATE', value: `${top5Rate.toFixed(1)}%`, rank: team.analyticsRanks?.top5Rate || overallRank },
      { label: 'AVG PLACEMENT', value: avgPlace.toFixed(2), rank: team.analyticsRanks?.avgPlace || overallRank },
    ];
  };

  const statCards = getCardStats();

  // Extract Rating Breakdown values
  const ratingPower = Number(team.scores?.POWER ?? team.analytics?.power ?? 75.0);
  const ratingPlacement = Number(team.scores?.PLACEMENT ?? team.analytics?.placement ?? 80.0);
  const ratingConversion = Number(team.scores?.CONVERSION ?? team.analytics?.conversion ?? 70.0);
  const ratingForm = Number(team.scores?.FORM ?? team.analytics?.form ?? 65.0);
  const finalRating = Number(team.scores?.FINAL_RATING ?? 589.6);

  const breakdowns = [
    { label: 'POWER', value: ratingPower },
    { label: 'PLACEMENT', value: ratingPlacement },
    { label: 'CONVERSION', value: ratingConversion },
    { label: 'FORM', value: ratingForm },
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

      {/* Header section (Team Logo and Info) */}
      <div style={{
        padding: '32px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        borderBottom: '1px solid var(--border)',
        boxSizing: 'border-box',
      }}>
        <TeamLogoPlaceholder logoUrl={team.logoUrl} name={team.teamName} size={110} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 800,
            textTransform: 'uppercase',
            margin: 0,
            color: 'var(--text-heading)',
            fontFamily: 'var(--heading-font)',
            letterSpacing: '-0.02em',
          }}>
            {team.teamName || 'UNKNOWN TEAM'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}>
              {team.clanName || 'CLAN'} • {team.tier || 'TIER 1'}
            </span>
            {team.scores?.rankLabel && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--rank-bg)',
                border: '1px solid var(--rank-border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {team.scores.rankLabel}
              </span>
            )}
            {team.identity && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}>
                {team.identity}
              </span>
            )}
          </div>
        </div>
        
        {/* Right side title badge */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {graphicTitle || 'TEAM PROFILE'}
          </span>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}>
            {graphicSubtitle || 'STAT BREAKDOWN'}
          </div>
        </div>
      </div>

      {/* Main Stats Area split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '48px',
        padding: '32px 48px 100px',
        flexGrow: 1,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Left Side: Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
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
                margin: '12px 0',
                fontFamily: 'monospace',
              }}>
                {card.value}
              </div>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}>
                #{card.rank || '1'} IN FIELD
              </div>
            </div>
          ))}
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
            Rating Breakdown
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

          {/* Overall Score footer */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                TEAM RATING
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

            {team.scores?.rankLabel && (
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                backgroundColor: 'var(--accent-muted)',
                color: 'var(--accent)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--accent)',
                fontFamily: 'var(--heading-font)',
              }}>
                {team.scores.rankLabel}
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
