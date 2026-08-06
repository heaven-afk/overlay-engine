'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeamRosterCard, PlayerRosterData } from '@/components/overlay/TeamRosterCard';
import { useOverlayState } from '@/hooks/useOverlayState';
import { ANIMATION, COLORS } from '@/lib/overlayDesignTokens';

interface LobbyKillsResponse {
  tournamentId: string;
  day: number;
  lobby: number;
  team: {
    id: string;
    name: string;
    logo: string | null;
    slot: number | string | null;
  };
  players: PlayerRosterData[];
}

function TeamRosterKillsContent() {
  const searchParams = useSearchParams();
  const { state: overlayState } = useOverlayState();

  const queryTournamentId = searchParams.get('tournamentId');
  const queryDay = searchParams.get('day');
  const queryLobby = searchParams.get('lobby');
  const queryTeamId = searchParams.get('teamId');

  // Resolve params either from URL query params or real-time Firestore overlay state
  const tournamentId = queryTournamentId || overlayState?.teamRosterKills?.tournamentId || '';
  const day = queryDay ? parseInt(queryDay, 10) : overlayState?.teamRosterKills?.day || 1;
  const lobby = queryLobby ? parseInt(queryLobby, 10) : overlayState?.teamRosterKills?.lobby || 1;
  const teamId = queryTeamId || overlayState?.teamRosterKills?.teamId || '';

  const [data, setData] = useState<LobbyKillsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId || !teamId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const apiKey = process.env.NEXT_PUBLIC_OVERLAY_API_KEY || 'heaven-overlay-secret';
    const baseUrl = process.env.NEXT_PUBLIC_HEAVEN_API_BASE_URL || 'http://localhost:3000';

    fetch(`${baseUrl}/api/overlay/lobby-kills?tournamentId=${tournamentId}&day=${day}&lobby=${lobby}&teamId=${teamId}`, {
      headers: {
        'x-overlay-api-key': apiKey,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('No match results found');
          throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch error in TeamRosterKillsRenderPage:', err);
          setError(err.message);
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId, day, lobby, teamId]);

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '60px 40px 40px 40px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Loading Skeleton */}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '100px', color: COLORS.textMuted }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: `3px solid ${COLORS.gold}`,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto',
            }}
          />
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <span style={{ letterSpacing: '2px', fontSize: '14px', fontWeight: 600 }}>LOADING ROSTER KILLS...</span>
        </div>
      )}

      {/* Error / Empty State */}
      {!loading && (error || !data || !tournamentId || !teamId) && (
        <div
          style={{
            marginTop: '120px',
            padding: '32px 48px',
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.borderSubtle}`,
            borderRadius: '16px',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.gold, marginBottom: '8px', letterSpacing: '2px' }}>
            NO DATA AVAILABLE
          </div>
          <div style={{ fontSize: '14px', color: COLORS.textMuted }}>
            {!tournamentId || !teamId
              ? 'Select a tournament and team in the Overlay Dashboard or pass query params.'
              : error || 'No lobby kill results found for the selected team.'}
          </div>
        </div>
      )}

      {/* Team Header & Roster Cards */}
      {!loading && data && (
        <>
          {/* Team Header (above cards, centered) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '36px',
              animation: `headerFadeIn 400ms ${ANIMATION.easeOutExpo} forwards`,
            }}
          >
            <style jsx>{`
              @keyframes headerFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1.0); }
              }
            `}</style>

            {/* Team Logo */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${COLORS.gold}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              {data.team.logo ? (
                <img src={data.team.logo} alt={data.team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px', fontWeight: 800, color: COLORS.gold }}>
                  {(data.team.name || '?')[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Team Name + Slot Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }}
              >
                {data.team.name}
              </span>
              {data.team.slot && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 215, 0, 0.15)',
                    color: COLORS.gold,
                    border: `1px solid rgba(255, 215, 0, 0.3)`,
                    letterSpacing: '1px',
                  }}
                >
                  SLOT {data.team.slot}
                </span>
              )}
            </div>
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
            {data.players.map((player, idx) => (
              <TeamRosterCard key={player.id || `empty-${idx}`} player={player} index={idx} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeamRosterKillsRenderPage() {
  return (
    <Suspense fallback={null}>
      <TeamRosterKillsContent />
    </Suspense>
  );
}
