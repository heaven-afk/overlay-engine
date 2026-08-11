'use client';

import React, { useEffect, useState } from 'react';
import { TeamRosterCard, PlayerRosterData } from '@/components/overlay/TeamRosterCard';
import { getTeamKills, getLobbyKills } from '@/lib/statsApi';

interface TeamRosterKillsGraphicProps {
  data?: any;
  styleConfig?: any;
  isPreview?: boolean;
}

export function TeamRosterKillsGraphic({ data = {}, styleConfig, isPreview = false }: TeamRosterKillsGraphicProps) {
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isEditorPreview = isPreview || Boolean(styleConfig?.isPreview);

  const tournamentId = data.tournamentId || styleConfig?.tournamentId || '';
  const teamId = data.teamId || styleConfig?.teamId || '';
  const scope: 'lobby' | 'daily' | 'collation' = data.scope || styleConfig?.scope || 'lobby';
  const day = data.day || styleConfig?.day || 1;
  const lobby = data.lobby || styleConfig?.lobby || 1;

  // Visual config
  const frameColor = styleConfig?.frameColor || styleConfig?.accentColor || '#D4E82A';
  const leagueLogoUrl = styleConfig?.leagueLogoUrl || data.leagueLogoUrl || '';
  const leagueSubtitle = styleConfig?.leagueSubtitle || data.leagueSubtitle || '';
  const teamTagline = styleConfig?.teamTagline || data.teamTagline || '';

  useEffect(() => {
    if (data.players && data.team) {
      setResolvedData(data);
      return;
    }

    if (!tournamentId || !teamId) {
      setResolvedData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchPromise = scope === 'lobby'
      ? getLobbyKills(tournamentId, day, lobby, teamId)
      : getTeamKills(tournamentId, teamId, scope, scope === 'daily' ? day : undefined);

    fetchPromise
      .then((json) => {
        if (isMounted) {
          setResolvedData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId, teamId, scope, day, lobby, data]);

  // ── Mock Data ──────────────────────────────────────────────────────────────
  const mockTeam = {
    id: 't_sample',
    name: data.teamName || 'AETHER ESPORTS',
    logo: data.logoUrl || data.logo || null,
    tagline: teamTagline || 'WE DON\'T FOLLOW. WE DOMINATE.',
    currentRank: 1,
    totalKills: 145,
  };

  const mockPlayers: PlayerRosterData[] = [
    { id: 'p1', ign: 'RomaBR',    professionalName: 'ROMA',       country: 'NG', countryCode: 'NGA', kills: 48, photoUrl: null },
    { id: 'p2', ign: 'DannyCODM', professionalName: 'DANNY',      country: 'NG', countryCode: 'NGA', kills: 42, photoUrl: null },
    { id: 'p3', ign: 'LekeB_',    professionalName: 'LEKE B',     country: 'NG', countryCode: 'NGA', kills: 37, photoUrl: null },
    { id: 'p4', ign: 'Alch3mist', professionalName: 'ALCHEMIST',  country: 'NG', countryCode: 'NGA', kills: 18, photoUrl: null },
  ];

  const team = resolvedData?.team || data.team || (isEditorPreview ? mockTeam : null);
  const players: PlayerRosterData[] = resolvedData?.players || data.players || (isEditorPreview ? mockPlayers : []);
  const totalKills = team?.totalKills ?? players.reduce((sum: number, p: any) => sum + (p.kills || 0), 0);

  // Day / scope label
  const scopeLabel = scope === 'lobby'
    ? `DAY ${day}`
    : scope === 'daily'
    ? `DAY ${day}`
    : 'SEASON';

  if (!team && !loading) {
    return (
      <div style={{
        width: '1920px', height: '1080px',
        backgroundColor: 'transparent',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Barlow Condensed", "Orbitron", sans-serif',
      }}>
        <div style={{
          padding: '32px 48px',
          background: 'rgba(10, 10, 15, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: frameColor, marginBottom: '8px', letterSpacing: '2px' }}>
            NO TEAM ROSTER DATA AVAILABLE
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Select a tournament and team in the Studio or Template Editor.
          </div>
        </div>
      </div>
    );
  }

  const teamName = team?.name || team?.teamName || 'TEAM NAME';
  const teamLogo = team?.logo || team?.logoUrl || null;
  const resolvedTagline = team?.tagline || teamTagline || '';

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: '#080808',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Barlow Condensed", "Rajdhani", "Orbitron", sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Load Barlow Condensed font ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,600;1,700&display=swap');
      `}} />

      {/* ── Background hexagonal/grid texture ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, rgba(212,232,42,0.06) 0%, transparent 60%),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.015) 40px,
            rgba(255,255,255,0.015) 41px
          )
        `,
        pointerEvents: 'none',
      }} />

      {/* ── Subtle radial vignette ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── PREVIEW MODE Badge ── */}
      {isEditorPreview && (
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 999,
          padding: '6px 14px',
          backgroundColor: 'rgba(234, 179, 8, 0.95)',
          color: '#000',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '1.5px',
          borderRadius: '6px',
          fontFamily: '"Orbitron", sans-serif',
          textTransform: 'uppercase',
        }}>
          PREVIEW MODE
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TOP SECTION
      ════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: '40px 60px 0 60px',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── League Logo (top-left, optional) ── */}
        <div style={{
          width: '130px',
          minHeight: '80px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {leagueLogoUrl ? (
            <img
              src={leagueLogoUrl}
              alt="League Logo"
              style={{
                maxWidth: '120px',
                maxHeight: '100px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
              }}
            />
          ) : null}
        </div>

        {/* ── Center: Day badge + league subtitle + team name + tagline ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0px',
        }}>
          {/* Day label row with horizontal decorators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            marginBottom: '10px',
          }}>
            {/* Left line + dots */}
            <DotLineDivider color={frameColor} side="left" />

            {/* Day badge */}
            <div style={{
              background: '#080808',
              border: `2px solid ${frameColor}`,
              borderRadius: '4px',
              padding: '4px 28px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '22px',
                fontWeight: 900,
                color: frameColor,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontFamily: '"Barlow Condensed", "Orbitron", sans-serif',
              }}>
                {scopeLabel}
              </span>
            </div>

            {/* Right line + dots */}
            <DotLineDivider color={frameColor} side="right" />
          </div>

          {/* League subtitle */}
          {leagueSubtitle && (
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
              marginBottom: '12px',
            }}>
              {leagueSubtitle}
            </div>
          )}

          {/* Team logo + name row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* Team logo */}
            {teamLogo && (
              <img
                src={teamLogo}
                alt={teamName}
                style={{
                  width: '90px',
                  height: '90px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 20px rgba(212,232,42,0.35))',
                }}
              />
            )}

            {/* Team name */}
            <span style={{
              fontSize: teamName.length > 16 ? '68px' : '82px',
              fontWeight: 900,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              lineHeight: 0.95,
              letterSpacing: teamName.length > 14 ? '-1px' : '0px',
              fontFamily: '"Barlow Condensed", sans-serif',
              textShadow: '0 4px 30px rgba(0,0,0,0.7)',
            }}>
              {teamName}
            </span>
          </div>

          {/* Tagline */}
          {resolvedTagline && (
            <div style={{
              fontSize: '17px',
              fontWeight: 600,
              color: frameColor,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontStyle: 'italic',
              marginTop: '6px',
              opacity: 0.9,
            }}>
              {resolvedTagline}
            </div>
          )}
        </div>

        {/* ── Right spacer (mirrors league logo side) ── */}
        <div style={{ width: '130px', flexShrink: 0 }} />
      </div>

      {/* ── Thin accent divider ── */}
      <div style={{
        marginTop: '18px',
        marginLeft: '60px',
        marginRight: '60px',
        height: '1px',
        background: `linear-gradient(90deg, transparent 0%, ${frameColor}50 20%, ${frameColor}80 50%, ${frameColor}50 80%, transparent 100%)`,
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }} />

      {/* ════════════════════════════════════════════════════════
          PLAYER CARDS ROW
      ════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        padding: '28px 60px 0 60px',
        position: 'relative',
        zIndex: 10,
      }}>
        {players.slice(0, 4).map((player, idx) => (
          <TeamRosterCard
            key={player.id || `empty-${idx}`}
            player={player}
            index={idx}
            frameColor={frameColor}
          />
        ))}

        {/* Fill empty slots if fewer than 4 */}
        {players.length < 4 && Array.from({ length: 4 - players.length }).map((_, i) => (
          <TeamRosterCard
            key={`placeholder-${i}`}
            player={{
              id: null,
              ign: 'EMPTY',
              professionalName: 'Empty Slot',
              country: null,
              kills: 0,
              photoUrl: null,
            }}
            index={players.length + i}
            frameColor={frameColor}
          />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TOTAL KILLS BAR
      ════════════════════════════════════════════════════════ */}
      <div style={{
        marginTop: '20px',
        marginBottom: '0px',
        padding: '0 60px',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }}>
        {/* Thin rule above */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent 100%)`,
          marginBottom: '14px',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
        }}>
          {/* Left decorators + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <KillsDecoratorDots color={frameColor} />
            <span style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
            }}>
              TEAM TOTAL KILLS
            </span>
          </div>

          {/* Kill count pill */}
          <div style={{
            background: frameColor,
            borderRadius: '4px',
            padding: '2px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${frameColor}55`,
          }}>
            <span style={{
              fontSize: '58px',
              fontWeight: 900,
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '-1px',
              fontFamily: '"Barlow Condensed", "Orbitron", sans-serif',
            }}>
              {totalKills}
            </span>
          </div>

          {/* Right label + decorators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
            }}>
              KILLS
            </span>
            <KillsDecoratorDots color={frameColor} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          FOOTER — HSC branding
      ════════════════════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        paddingBottom: '28px',
        paddingTop: '14px',
      }}>
        {/* Thin rule */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '60px', right: '60px',
          height: '1px',
          background: 'rgba(255,255,255,0.06)',
        }} />

        {/* HSC logo mark */}
        <div style={{
          width: '28px',
          height: '28px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '9px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.5px',
            fontFamily: '"Barlow Condensed", sans-serif',
          }}>
            HSC
          </span>
        </div>

        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          fontFamily: '"Barlow Condensed", sans-serif',
        }}>
          HEAVEN STAT CENTER
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DotLineDivider({ color, side }: { color: string; side: 'left' | 'right' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexDirection: side === 'left' ? 'row-reverse' : 'row',
    }}>
      {/* Dots */}
      {[8, 5, 3].map((size, i) => (
        <div key={i} style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.4 + i * 0.2,
          flexShrink: 0,
        }} />
      ))}
      {/* Line */}
      <div style={{
        width: '80px',
        height: '2px',
        background: `linear-gradient(${side === 'left' ? '90deg' : '270deg'}, transparent 0%, ${color}80 100%)`,
      }} />
    </div>
  );
}

function KillsDecoratorDots({ color }: { color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: color,
          opacity: i / 6,
        }} />
      ))}
      <div style={{
        width: '40px',
        height: '1px',
        backgroundColor: `${color}50`,
      }} />
    </div>
  );
}
