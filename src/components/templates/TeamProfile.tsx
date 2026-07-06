import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, TeamLogoPlaceholder } from './SharedElements';

interface TeamProfileProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

/** Safely read a number from multiple candidate values. Returns 0 when none found. */
const num = (...vals: any[]): number => {
  for (const v of vals) {
    const n = Number(v);
    if (v !== undefined && v !== null && v !== '' && !isNaN(n)) return n;
  }
  return 0;
};

/** Normalise a rate that might be stored as 0–1 or 0–100. */
const toPercent = (v: any): number => {
  const n = num(v);
  return n > 0 && n <= 1 ? n * 100 : n;
};

/** Format number with decimals; returns '—' for zero. */
const fmt = (n: number, decimals = 1): string =>
  n === 0 ? '—' : n.toFixed(decimals);

// ─── Component ────────────────────────────────────────────────────────────────

export const TeamProfile: React.FC<TeamProfileProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  // The API returns { profile: {...}, careerStats: {...} }
  // page.tsx merges them as { team: { ...profile, careerStats } }
  const team = data?.team || data || {};
  const career = team.careerStats || {};

  // ── Core stats ──────────────────────────────────────────────────────────────
  const totalPts   = num(team.totalPts, team.totalPoints, team.scores?.totalPts, career.totalPts);
  const totalKills = num(team.kills, team.scores?.kills, career.kills);
  const wins       = num(team.wins, career.wins);
  const matches    = num(team.matches, career.matches);
  const ppm        = num(team.analytics?.PPM, team.analytics?.ppm, team.ppm, career.ppm);
  const kpm        = num(team.analytics?.KPM, team.analytics?.kpm, team.kpm, career.kpm);
  const winRate    = toPercent(team.analytics?.winRate ?? team.winRate ?? career.winRate);
  const killPct    = toPercent(team.analytics?.killPct ?? team.killPct ?? career.killPct);
  const top5Rate   = toPercent(team.analytics?.top5Rate ?? team.top5Rate ?? career.top5Rate);
  const avgPlace   = num(team.analytics?.avgPlace, team.avgPlacement, career.avgPlacement);

  // ── Rating breakdown ─────────────────────────────────────────────────────────
  const ratingPower      = num(team.scores?.POWER,      team.analytics?.power);
  const ratingPlacement  = num(team.scores?.PLACEMENT,  team.analytics?.placement);
  const ratingConversion = num(team.scores?.CONVERSION, team.analytics?.conversion);
  const ratingForm       = num(team.scores?.FORM,       team.analytics?.form);
  const finalRating      = num(team.scores?.FINAL_RATING, team.rating);
  const hasRatings = ratingPower > 0 || ratingPlacement > 0 || ratingConversion > 0 || ratingForm > 0;

  const breakdowns = [
    { label: 'POWER',      value: ratingPower },
    { label: 'PLACEMENT',  value: ratingPlacement },
    { label: 'CONVERSION', value: ratingConversion },
    { label: 'FORM',       value: ratingForm },
  ];

  // ── Ranks ────────────────────────────────────────────────────────────────────
  const overallRank = num(team.analyticsRank, team.scores?.rank, team.rank);
  const ranks = {
    totalPts: num(team.scores?.totalPtsRank, team.scores?.ptsRank, overallRank) || null,
    kills:    num(team.scores?.killsRank, overallRank) || null,
    ppm:      num(team.analyticsRanks?.PPM, team.analyticsRanks?.ppm) || null,
    kpm:      num(team.analyticsRanks?.KPM, team.analyticsRanks?.kpm) || null,
    winRate:  num(team.analyticsRanks?.winRate) || null,
    killPct:  num(team.analyticsRanks?.killPct) || null,
    top5Rate: num(team.analyticsRanks?.top5Rate) || null,
    avgPlace: num(team.analyticsRanks?.avgPlace) || null,
  };

  // ── Tournament history ───────────────────────────────────────────────────────
  const tournaments: any[] = (
    career.tournaments ??
    career.tournamentHistory ??
    team.tournaments ??
    []
  ).slice(0, 4);

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'TOTAL PTS',   value: totalPts   > 0 ? String(Math.round(totalPts))   : '—', rank: ranks.totalPts },
    { label: 'TOTAL KILLS', value: totalKills > 0 ? String(Math.round(totalKills)) : '—', rank: ranks.kills },
    { label: 'WINS',        value: wins       > 0 ? String(Math.round(wins))       : '—', rank: null },
    { label: 'MATCHES',     value: matches    > 0 ? String(Math.round(matches))    : '—', rank: null },
    { label: 'PPM',         value: ppm   > 0 ? fmt(ppm, 2)                         : '—', rank: ranks.ppm },
    { label: 'KPM',         value: kpm   > 0 ? fmt(kpm, 2)                         : '—', rank: ranks.kpm },
    { label: 'WIN RATE',    value: winRate  > 0 ? `${fmt(winRate)}%`               : '—', rank: ranks.winRate },
    { label: 'TOP 5 RATE',  value: top5Rate > 0 ? `${fmt(top5Rate)}%`              : '—', rank: ranks.top5Rate },
    { label: 'KILL %',      value: killPct  > 0 ? `${fmt(killPct)}%`               : '—', rank: ranks.killPct },
    { label: 'AVG PLACE',   value: avgPlace > 0 ? fmt(avgPlace, 2)                 : '—', rank: ranks.avgPlace },
  ];

  // ── Badges row ───────────────────────────────────────────────────────────────
  const metaBadges: { label: string; accent?: boolean }[] = [];
  if (team.scores?.rankLabel) metaBadges.push({ label: team.scores.rankLabel });
  if (team.identity)          metaBadges.push({ label: team.identity, accent: true });
  if (team.tier)              metaBadges.push({ label: team.tier });

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

      {/* ── Team hero row ─────────────────────────────────────────── */}
      <div style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        borderBottom: '1px solid var(--border)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <TeamLogoPlaceholder logoUrl={team.logoUrl} name={team.teamName} size={100} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 800,
            textTransform: 'uppercase',
            margin: 0,
            color: 'var(--text-heading)',
            fontFamily: 'var(--heading-font)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>
            {team.teamName || 'UNKNOWN TEAM'}
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {team.clanName && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {team.clanName}
              </span>
            )}
            {metaBadges.map((b, i) => (
              <span key={i} style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '6px',
                backgroundColor: b.accent ? 'var(--accent-muted)' : 'var(--rank-bg)',
                color: b.accent ? 'var(--accent)' : 'var(--text-primary)',
                border: b.accent ? 'none' : '1px solid var(--rank-border)',
                textTransform: 'uppercase',
              }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Graphic label — top right */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {graphicTitle || 'TEAM PROFILE'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {graphicSubtitle || 'STAT BREAKDOWN'}
          </div>
        </div>
      </div>

      {/* ── Main body ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: tournaments.length > 0 ? '1fr 360px' : '1fr',
        gap: '28px',
        padding: '24px 48px 56px',
        flexGrow: 1,
        boxSizing: 'border-box',
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* ── Left: Stat cards + Rating breakdown ─────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>

          {/* Stat cards — 5 columns × 2 rows */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '12px',
            flexShrink: 0,
          }}>
            {statCards.map((card, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                minHeight: '90px',
              }}>
                <div style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--heading-font)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: card.value === '—' ? 'var(--text-muted)' : 'var(--accent)',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  margin: '8px 0 4px',
                }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {card.rank ? `#${card.rank} IN FIELD` : '\u00a0'}
                </div>
              </div>
            ))}
          </div>

          {/* Rating breakdown */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            padding: '20px 28px',
            boxSizing: 'border-box',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '14px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '10px',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'var(--text-heading)',
                letterSpacing: '0.08em',
                fontFamily: 'var(--heading-font)',
              }}>
                Rating Breakdown
              </span>
              {finalRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
                    {finalRating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 1000 TEAM RATING</span>
                </div>
              )}
            </div>

            {hasRatings ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {breakdowns.map((b) => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '100px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--heading-font)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {b.label}
                    </span>
                    <div style={{
                      flexGrow: 1,
                      height: '10px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, b.value))}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '5px',
                        boxShadow: '0 0 8px var(--accent-muted)',
                      }} />
                    </div>
                    <span style={{
                      width: '48px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: b.value > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                    }}>
                      {b.value > 0 ? b.value.toFixed(1) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                Rating breakdown not available for this scope
              </div>
            )}

            {/* Rank label badge */}
            {team.scores?.rankLabel && (
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
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
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Tournament history (only if data exists) ──────── */}
        {tournaments.length > 0 && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            padding: '20px 24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
              letterSpacing: '0.08em',
              fontFamily: 'var(--heading-font)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '10px',
              flexShrink: 0,
            }}>
              Tournament History
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {tournaments.map((t: any, i: number) => {
                const tName    = t.tournament ?? t.tournamentName ?? t.name ?? `Event ${i + 1}`;
                const tKills   = num(t.kills);
                const tMatches = num(t.matches);
                const tKpm     = num(t.kpm, t.KPM);
                const tRating  = num(t.rating, t.FINAL_RATING);
                const tPts     = num(t.totalPts, t.points);
                const tPlace   = num(t.avgPlace, t.avgPlacement);

                return (
                  <div key={i} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--heading-font)',
                    }}>
                      {tName}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {[
                        { label: 'KILLS',     value: tKills   > 0 ? String(Math.round(tKills))   : '—' },
                        { label: 'MATCHES',   value: tMatches > 0 ? String(Math.round(tMatches)) : '—' },
                        { label: 'KPM',       value: tKpm     > 0 ? tKpm.toFixed(2)              : '—' },
                        { label: 'TOTAL PTS', value: tPts     > 0 ? String(Math.round(tPts))     : '—' },
                        { label: 'AVG PLACE', value: tPlace   > 0 ? tPlace.toFixed(1)            : '—' },
                        { label: 'RATING',    value: tRating  > 0 ? tRating.toFixed(1)           : '—' },
                      ].map((s, si) => (
                        <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                            {s.label}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: s.value === '—' ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SourceLine styleConfig={styleConfig} />
      <StatsStamp show={showStatsStamp} />
    </div>
  );
};
