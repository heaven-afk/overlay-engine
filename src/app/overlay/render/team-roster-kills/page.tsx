'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeamRosterCard, PlayerRosterData } from '@/components/overlay/TeamRosterCard';
import { useOverlayState } from '@/hooks/useOverlayState';
import { COLORS } from '@/lib/overlayDesignTokens';
import { getLobbyKills } from '@/lib/statsApi';

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

    getLobbyKills(tournamentId, day, lobby, teamId)
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch error in TeamRosterKillsRenderPage:', err);
          setError(err.message || 'Failed to fetch lobby kills');
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
        padding: '24px 40px 24px 40px',
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
            {data.team.logo ? (
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
                <img src={data.team.logo} alt={data.team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              {data.team.name}
            </span>

            {/* Slot Badge Pill */}
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
                  marginLeft: '8px',
                }}
              >
                SLOT {data.team.slot}
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
