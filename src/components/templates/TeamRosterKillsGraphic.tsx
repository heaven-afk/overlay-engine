'use client';

import React, { useEffect, useState } from 'react';
import { TeamRosterCard, PlayerRosterData } from '@/components/overlay/TeamRosterCard';
import { getTeamKills } from '@/lib/statsApi';

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
  const scope: 'collation' | 'daily' = data.scope || styleConfig?.scope || 'collation';
  const day = data.day || styleConfig?.day || 1;
  const frameColor = styleConfig?.frameColor || styleConfig?.accentColor || '#C9A84C';

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

    getTeamKills(tournamentId, teamId, scope, scope === 'daily' ? day : undefined)
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
  }, [tournamentId, teamId, scope, day, data]);

  const mockTeam = {
    id: 't_sample',
    name: data.teamName || 'SAMPLE TEAM',
    logo: data.logoUrl || data.logo || null,
    currentRank: 1,
    totalKills: 47,
  };

  const mockPlayers: PlayerRosterData[] = [
    { id: 'p1', ign: 'PlayerOne', professionalName: 'Pro One', country: 'NG', kills: 18, photoUrl: null },
    { id: 'p2', ign: 'PlayerTwo', professionalName: 'Pro Two', country: 'US', kills: 14, photoUrl: null },
    { id: 'p3', ign: 'PlayerThree', professionalName: 'Pro Three', country: 'BR', kills: 9, photoUrl: null },
    { id: 'p4', ign: 'PlayerFour', professionalName: 'Pro Four', country: 'IN', kills: 6, photoUrl: null },
  ];

  const hasResolvedData = Boolean(resolvedData || (data.players && data.team));
  const team = resolvedData?.team || data.team || (isEditorPreview ? mockTeam : null);
  const players: PlayerRosterData[] = resolvedData?.players || data.players || (isEditorPreview ? mockPlayers : []);

  if (!team && !loading) {
    return (
      <div
        style={{
          width: '1920px',
          height: '1080px',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Orbitron", sans-serif',
        }}
      >
        <div
          style={{
            padding: '32px 48px',
            background: 'rgba(10, 10, 15, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#C9A84C', marginBottom: '8px', letterSpacing: '2px' }}>
            NO TEAM ROSTER KILLS DATA AVAILABLE
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Select a tournament and team in the Studio or Broadcast Control Dashboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 40px 20px 40px',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: styleConfig?.headingFont ? `'${styleConfig.headingFont}', sans-serif` : '"Orbitron", "Rajdhani", sans-serif',
      }}
    >
      {/* PREVIEW MODE Badge */}
      {isEditorPreview && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            zIndex: 100,
            padding: '6px 14px',
            backgroundColor: 'rgba(234, 179, 8, 0.95)',
            color: '#000000',
            fontWeight: 900,
            fontSize: '12px',
            letterSpacing: '1.5px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontFamily: '"Orbitron", sans-serif',
            textTransform: 'uppercase',
          }}
        >
          PREVIEW MODE (SAMPLE DATA)
        </div>
      )}
      {/* Team Header (inline row, above cards, centered as one unit) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          gap: '16px',
          background: 'rgba(10, 10, 15, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '40px',
          padding: '10px 28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Team Logo */}
        {team.logo && (
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `2px solid ${frameColor}`,
            }}
          >
            <img src={team.logo} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Team Name */}
        <span
          style={{
            fontSize: '26px',
            fontWeight: 900,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          {team.name}
        </span>

        {/* Dot Divider */}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '22px' }}>·</span>

        {/* Rank Chip */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '1px',
          }}
        >
          RANK <span style={{ color: frameColor }}>#{team.currentRank}</span>
        </span>

        {/* Dot Divider */}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '22px' }}>·</span>

        {/* Total Kills Chip */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '1px',
          }}
        >
          <span style={{ color: frameColor }}>{team.totalKills}</span> KILLS {scope === 'daily' ? `(DAY ${day})` : '(TOTAL)'}
        </span>
      </div>

      {/* Cards Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: '24px',
          width: '100%',
          maxWidth: '1360px',
        }}
      >
        {players.slice(0, 4).map((player, idx) => (
          <TeamRosterCard
            key={player.id || `empty-${idx}`}
            player={player}
            index={idx}
            frameColor={frameColor}
          />
        ))}
      </div>
    </div>
  );
}
