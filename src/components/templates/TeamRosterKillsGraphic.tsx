'use client';

import React, { useEffect, useState } from 'react';
import { TeamRosterCard, PlayerRosterData } from '@/components/overlay/TeamRosterCard';
import { COLORS, ANIMATION } from '@/lib/overlayDesignTokens';

interface TeamRosterKillsGraphicProps {
  data?: any;
  styleConfig?: any;
}

export function TeamRosterKillsGraphic({ data = {}, styleConfig }: TeamRosterKillsGraphicProps) {
  const [resolvedData, setResolvedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tournamentId = data.tournamentId || '';
  const day = data.day || 1;
  const lobby = data.lobby || 1;
  const teamId = data.teamId || '';

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

    const apiKey = process.env.NEXT_PUBLIC_OVERLAY_API_KEY || 'heaven-overlay-secret';
    const baseUrl = process.env.NEXT_PUBLIC_HEAVEN_API_BASE_URL || 'http://localhost:3000';

    fetch(`${baseUrl}/api/overlay/lobby-kills?tournamentId=${tournamentId}&day=${day}&lobby=${lobby}&teamId=${teamId}`, {
      headers: {
        'x-overlay-api-key': apiKey,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
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
  }, [tournamentId, day, lobby, teamId, data]);

  const team = resolvedData?.team || data.team || {
    name: data.teamName || 'SAMPLE TEAM',
    logo: data.logoUrl || null,
    slot: data.slot || null,
  };

  const players: PlayerRosterData[] = resolvedData?.players || data.players || [
    { id: 'p1', ign: 'PlayerOne', professionalName: 'Pro One', country: 'NG', countryEmoji: '🇳🇬', kills: 8, photoUrl: null },
    { id: 'p2', ign: 'PlayerTwo', professionalName: 'Pro Two', country: 'US', countryEmoji: '🇺🇸', kills: 5, photoUrl: null },
    { id: 'p3', ign: 'PlayerThree', professionalName: 'Pro Three', country: 'BR', countryEmoji: '🇧🇷', kills: 3, photoUrl: null },
    { id: 'p4', ign: 'PlayerFour', professionalName: 'Pro Four', country: 'IN', countryEmoji: '🇮🇳', kills: 1, photoUrl: null },
  ];

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
        padding: '24px 40px 24px 40px',
        boxSizing: 'border-box',
        fontFamily: styleConfig?.headingFont ? `'${styleConfig.headingFont}', sans-serif` : "'Inter', sans-serif",
      }}
    >
      {/* Team Header (inline row, above cards, centered as one unit) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '12px',
        }}
      >
        {/* Team Logo */}
        {team.logo ? (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={team.logo} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : null}

        {/* Team Name */}
        <span
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: COLORS.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          {team.name}
        </span>

        {/* Slot Badge Pill */}
        {team.slot && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              color: styleConfig?.accentColor || COLORS.gold,
              border: `1px solid rgba(255, 215, 0, 0.3)`,
              letterSpacing: '1px',
              marginLeft: '8px',
            }}
          >
            SLOT {team.slot}
          </span>
        )}
      </div>

      {/* Cards Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: '20px',
          width: '100%',
          maxWidth: '1200px',
        }}
      >
        {players.map((player, idx) => (
          <TeamRosterCard key={player.id || `empty-${idx}`} player={player} index={idx} />
        ))}
      </div>
    </div>
  );
}
