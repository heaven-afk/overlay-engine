'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TeamRosterKillsGraphic } from '@/components/templates/TeamRosterKillsGraphic';
import { useOverlayState } from '@/hooks/useOverlayState';
import { getTeamKills } from '@/lib/statsApi';

function TeamRosterKillsContent() {
  const searchParams = useSearchParams();
  const { state: overlayState } = useOverlayState();

  const queryTournamentId = searchParams.get('tournamentId');
  const queryTeamId = searchParams.get('teamId');
  const queryScope = searchParams.get('scope') as 'collation' | 'daily' | null;
  const queryDay = searchParams.get('day');
  const queryFrameColor = searchParams.get('frameColor');

  // Resolve params either from real-time Firestore overlay state or URL query params
  const tournamentId = overlayState?.teamRosterKills?.tournamentId || queryTournamentId || '';
  const teamId = overlayState?.teamRosterKills?.teamId || queryTeamId || '';
  const scope: 'collation' | 'daily' = overlayState?.teamRosterKills?.scope || queryScope || 'collation';
  const day = overlayState?.teamRosterKills?.day ?? (queryDay ? parseInt(queryDay, 10) : 1);
  const frameColor = overlayState?.teamRosterKills?.frameColor || queryFrameColor || '#C9A84C';

  const [data, setData] = useState<any>(null);
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

    getTeamKills(tournamentId, teamId, scope, scope === 'daily' ? day : undefined)
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch error in TeamRosterKillsRenderPage:', err);
          setError(err.message || 'Failed to fetch team kills');
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId, teamId, scope, day]);

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: '"Orbitron", sans-serif' }}>
        <span>LOADING TEAM ROSTER KILLS...</span>
      </div>
    );
  }

  if (error || (!data && (!tournamentId || !teamId))) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontFamily: '"Orbitron", sans-serif' }}>
        <h2>NO DATA AVAILABLE</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          {!tournamentId || !teamId ? 'Select a tournament and team in the Studio / Control Dashboard.' : error}
        </p>
      </div>
    );
  }

  return (
    <TeamRosterKillsGraphic
      data={{ ...data, scope, day, tournamentId, teamId }}
      styleConfig={{ frameColor }}
    />
  );
}

export default function TeamRosterKillsRenderPage() {
  return (
    <Suspense fallback={null}>
      <TeamRosterKillsContent />
    </Suspense>
  );
}
