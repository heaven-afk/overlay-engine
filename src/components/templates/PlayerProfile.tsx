import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, getCanvaEmbedUrl } from './SharedElements';

interface PlayerProfileProps {
  data: any;
  styleConfig: TemplateStyleConfig;
}

interface StatCardInfo {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ data, styleConfig }) => {
  const { graphicTitle, graphicSubtitle, showStatsStamp } = styleConfig;

  // Retrieve player data. Slots push data under currentData.player or root
  const player = data?.player || data || {};
  const career = player.careerStats || {};

  const isTournamentScope =
    player.scope === 'tournament' ||
    Boolean(player.tournamentId) ||
    (Array.isArray(player.dayHistory) && player.dayHistory.length > 0);

  // ── Stat values extraction ──────────────────────────────────────────────────
  const totalKills = Number(
    player.totalKills ??
    player.careerKills ??
    career.careerKills ??
    career.totalKills ??
    player.kills ??
    0
  );

  const totalMatches = Number(
    player.totalMatches ??
    player.careerMatches ??
    career.careerMatches ??
    player.matches ??
    0
  );

  const kpm = Number(
    player.analytics?.KPM ??
    player.killsPerMatch ??
    career.avgKillsPerMatch ??
    player.avgKillsPerMatch ??
    career.avgKills ??
    player.avgKills ??
    player.kpm ??
    (totalMatches > 0 ? totalKills / totalMatches : 0)
  );

  const dpm = Number(
    player.analytics?.DPM ??
    player.avgDamage ??
    career.avgDamagePerMatch ??
    player.avgDamagePerMatch ??
    career.avgDamage ??
    player.dpm ??
    0
  );

  let winRate = Number(
    player.analytics?.winRate ??
    career.winRate ??
    player.winRate ??
    0
  );
  if (winRate > 0 && winRate <= 1) winRate *= 100;

  let top5Rate = Number(
    player.analytics?.top5Rate ??
    career.top5Rate ??
    player.top5Rate ??
    0
  );
  if (top5Rate > 0 && top5Rate <= 1) top5Rate *= 100;

  const avgPlace = Number(
    player.analytics?.avgPlacement ??
    career.avgPlacement ??
    career.avgRankedPosition ??
    player.avgPlacement ??
    player.avgPlace ??
    0
  );

  const avgAccuracy = Number(
    player.avgAccuracy ??
    player.totalAccuracy ??
    career.avgAccuracy ??
    0
  );

  // 6 Stat cards configured dynamically based on scope
  const getCardStats = (): StatCardInfo[] => {
    return [
      {
        label: 'TOTAL KILLS',
        value: Math.round(totalKills),
        sublabel: totalMatches > 0 ? `${totalMatches} Matches` : undefined,
        highlight: true,
      },
      {
        label: 'KPM (KILLS / M)',
        value: kpm > 0 ? kpm.toFixed(2) : '0.00',
        sublabel: isTournamentScope ? 'Tournament Avg' : 'Career Avg',
      },
      {
        label: 'DPM (DMG / M)',
        value: dpm > 0 ? Math.round(dpm).toLocaleString() : '—',
        sublabel: 'Avg Damage',
      },
      {
        label: 'WIN RATE',
        value: winRate > 0 ? `${winRate.toFixed(1)}%` : totalMatches > 0 ? `${totalMatches} GP` : '0.0%',
        sublabel: winRate > 0 ? 'Vic. Royales' : 'Matches Played',
      },
      {
        label: isTournamentScope ? 'TOP 5 RATE' : (avgAccuracy > 0 ? 'ACCURACY' : 'TOP 5 RATE'),
        value: isTournamentScope
          ? `${top5Rate.toFixed(1)}%`
          : (avgAccuracy > 0 ? `${avgAccuracy.toFixed(1)}%` : `${top5Rate.toFixed(1)}%`),
        sublabel: isTournamentScope ? 'Placement %' : (avgAccuracy > 0 ? 'Shot Accuracy' : 'Placement %'),
      },
      {
        label: 'AVG PLACEMENT',
        value: avgPlace > 0 ? `#${avgPlace.toFixed(1)}` : '—',
        sublabel: avgPlace > 0 ? 'Finish Pos.' : undefined,
      },
    ];
  };

  const statCards = getCardStats();

  // ── Ratings Extraction ──────────────────────────────────────────────────────
  const ratingPower = Number(player.scores?.POWER ?? player.analytics?.power ?? 0);
  const ratingPlacement = Number(player.scores?.PLACEMENT ?? player.analytics?.placement ?? 0);
  const ratingConversion = Number(player.scores?.CONVERSION ?? player.analytics?.conversion ?? 0);
  const ratingForm = Number(player.scores?.FORM ?? player.analytics?.form ?? 0);
  
  let finalRating = Number(
    player.scores?.FINAL_RATING ??
    (player.scores?.RATING ? player.scores.RATING * 10 : undefined) ??
    player.rating ??
    0
  );

  const hasRatings = ratingPower > 0 || ratingPlacement > 0 || ratingConversion > 0 || ratingForm > 0 || finalRating > 0;

  const breakdowns = [
    { label: 'POWER', value: ratingPower, weight: 'Fragging capability' },
    { label: 'PLACEMENT', value: ratingPlacement, weight: 'End-game survival' },
    { label: 'CONVERSION', value: ratingConversion, weight: 'Points execution' },
    { label: 'FORM', value: ratingForm, weight: 'Current momentum' },
  ];

  // ── History Rows (Adaptive: Day Breakdown vs Tournament History) ────────────
  const dayList: any[] = Array.isArray(player.dayHistory) && player.dayHistory.length > 0
    ? player.dayHistory
    : [];

  const tourneyList: any[] = Array.isArray(player.careerHistory) && player.careerHistory.length > 0
    ? player.careerHistory
    : Array.isArray(career.tournaments) && career.tournaments.length > 0
    ? career.tournaments
    : [];

  const canvaBgUrl = styleConfig.colorTheme === 'custom' && styleConfig.customBackgroundUrl
    ? getCanvaEmbedUrl(styleConfig.customBackgroundUrl)
    : null;

  // Metadata labels
  const ignDisplay = player.currentIGN || player.ign || 'PLAYER IGN';
  const proNameDisplay = player.professionalName || player.playerName || player.ign || 'PRO PLAYER';
  const teamDisplay = player.teamName || career.teamName || 'NO TEAM';
  const classDisplay = player.classBadge || player.class || player.category || career.lastClass || 'SLAYER';
  const deviceDisplay = player.deviceModel || player.currentDeviceModel || player.device || 'N/A';
  const regionDisplay = player.region || 'Africa';
  const countryDisplay = player.country || 'N/A';

  const defaultSub = isTournamentScope
    ? `TOURNAMENT METRICS — ${player.tournamentName || 'ACTIVE EVENT'}`
    : 'CAREER METRICS — ALL TIME';

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

      {/* Semi-transparent dark overlay */}
      {styleConfig.colorTheme === 'custom' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
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

        {/* ── Header section (Player IGN and Info) ── */}
        <div style={{
          padding: '22px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)',
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Player Avatar Emblem / Badge */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--accent)',
              fontFamily: 'var(--heading-font)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {ignDisplay.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <h1 style={{
                fontSize: '50px',
                fontWeight: 900,
                textTransform: 'uppercase',
                margin: 0,
                color: 'var(--text-heading)',
                fontFamily: 'var(--heading-font)',
                letterSpacing: '-0.02em',
                lineHeight: '1',
              }}>
                {ignDisplay}
              </h1>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {proNameDisplay} • <strong style={{ color: 'var(--text-primary)' }}>{teamDisplay}</strong>
                </span>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(217, 70, 239, 0.3)',
                  letterSpacing: '0.05em',
                }}>
                  {classDisplay}
                </span>

                {player.identity && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-primary)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}>
                    {player.identity}
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: '2px',
              }}>
                <span>{deviceDisplay}</span>
                <span>•</span>
                <span>{regionDisplay}</span>
                <span>•</span>
                <span>{countryDisplay}</span>
                {player.rankedTier && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{player.rankedTier}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side title details */}
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 900,
              color: 'var(--accent)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              {graphicTitle || 'PLAYER PROFILE'}
            </span>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '4px',
              letterSpacing: '0.05em',
            }}>
              {graphicSubtitle || defaultSub}
            </div>
          </div>
        </div>

        {/* ── Main Stats Area split ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: '36px',
          padding: '24px 48px 48px',
          flexGrow: 1,
          boxSizing: 'border-box',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Left Side: Stat Cards & Performance History Table */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: 0,
          }}>
            {/* Stat Cards Grid (6 cards) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
            }}>
              {statCards.map((card, index) => (
                <div 
                  key={index}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: card.highlight ? '1px solid rgba(217, 70, 239, 0.4)' : '1px solid var(--border)',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    background: card.highlight
                      ? 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'var(--bg-card)',
                    boxShadow: card.highlight ? '0 0 15px rgba(217, 70, 239, 0.15)' : undefined,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: card.highlight ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily: 'var(--heading-font)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      {card.label}
                    </span>
                    {card.sublabel && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {card.sublabel}
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '34px',
                    fontWeight: 900,
                    color: card.highlight ? '#ffffff' : 'var(--accent)',
                    margin: '6px 0 0',
                    fontFamily: 'monospace',
                    letterSpacing: '-0.02em',
                  }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance History Table (Adaptive) */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              flexGrow: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: 'var(--text-heading)',
                  fontFamily: 'var(--heading-font)',
                  letterSpacing: '0.06em',
                }}>
                  {isTournamentScope ? 'Tournament Match Breakdown' : 'Career Tournament History'}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {isTournamentScope ? 'Day-by-Day Performance' : 'Ranked Events'}
                </span>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.2fr',
                fontSize: '10px',
                fontWeight: 800,
                color: 'var(--text-muted)',
                padding: '6px 10px',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>{isTournamentScope ? 'Stage / Day' : 'Tournament'}</div>
                <div style={{ textAlign: 'right' }}>Kills</div>
                <div style={{ textAlign: 'right' }}>Matches</div>
                <div style={{ textAlign: 'right' }}>KPM</div>
                <div style={{ textAlign: 'right' }}>{isTournamentScope ? 'Avg Dmg' : 'Rating'}</div>
              </div>

              {/* Table rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto', flexGrow: 1, marginTop: '6px' }}>
                {isTournamentScope && dayList.length > 0 ? (
                  dayList.map((row: any, i: number) => (
                    <div 
                      key={i} 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.2fr',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 10px',
                        backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {row.day}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.kills ?? 0}</div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.matches ?? 0}</div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>
                        {row.kpm}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {row.avgDamage ? row.avgDamage.toLocaleString() : '—'}
                      </div>
                    </div>
                  ))
                ) : tourneyList.length > 0 ? (
                  tourneyList.map((row: any, i: number) => (
                    <div 
                      key={i} 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.2fr',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '8px 10px',
                        backgroundColor: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>
                        {row.tournament || row.name || 'Tournament'}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.kills ?? 0}</div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.matches ?? 0}</div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {Number(row.kpm ?? 0).toFixed(2)}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 800 }}>
                        {Number(row.rating ?? 0).toFixed(0)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}>
                    No tournament match records found for this player.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Player Rating Breakdown & Badges */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '26px 32px',
            boxSizing: 'border-box',
          }}>
            {/* Header */}
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--text-heading)',
                letterSpacing: '0.08em',
                fontFamily: 'var(--heading-font)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Performance Rating Breakdown</span>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                  {isTournamentScope ? 'TOURNAMENT SCORES' : 'CAREER METRICS'}
                </span>
              </div>

              {/* Breakdown progress bars */}
              {hasRatings ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  margin: '22px 0',
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
                        alignItems: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--heading-font)',
                        letterSpacing: '0.05em',
                      }}>
                        <span>{b.label}</span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 800 }}>
                          {b.value > 0 ? b.value.toFixed(1) : '0.0'}
                        </span>
                      </div>
                      {/* Progress bar with glow */}
                      <div style={{
                        height: '10px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, b.value))}%`,
                          height: '100%',
                          backgroundColor: 'var(--accent)',
                          borderRadius: '5px',
                          boxShadow: '0 0 10px var(--accent-muted)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                  Rating breakdown calculating...
                </div>
              )}
            </div>

            {/* Score & Badges Footer */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  OVERALL PLAYER RATING
                </span>
                <div style={{
                  fontSize: '38px',
                  fontWeight: 900,
                  color: 'var(--accent)',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  letterSpacing: '-0.02em',
                }}>
                  {finalRating > 0 ? finalRating.toFixed(1) : (kpm * 100).toFixed(1)}{' '}
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>/ 1000</span>
                </div>
              </div>

              {/* Dynamic tag badges */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                paddingTop: '14px',
              }}>
                {player.labels?.playstyle && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}>
                    {player.labels.playstyle}
                  </span>
                )}

                {player.labels?.powerLabel && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: 'var(--accent-muted)',
                    color: 'var(--accent)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}>
                    {player.labels.powerLabel}
                  </span>
                )}

                {player.labels?.formLabel && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}>
                    {player.labels.formLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SourceLine styleConfig={styleConfig} />
      <StatsStamp show={showStatsStamp} />
    </div>
  );
};
