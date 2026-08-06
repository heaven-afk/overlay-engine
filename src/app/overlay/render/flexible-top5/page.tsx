'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlexibleTop5Bar, FlexibleTop5TeamData } from '@/components/overlay/FlexibleTop5Bar';
import { useOverlayState } from '@/hooks/useOverlayState';
import { COLORS } from '@/lib/overlayDesignTokens';

function FlexibleTop5Content() {
  const searchParams = useSearchParams();
  const { state: overlayState } = useOverlayState();

  const queryTournamentId = searchParams.get('tournamentId');
  const queryPage = searchParams.get('page');
  const queryShowTitle = searchParams.get('showTitle');

  const tournamentId = queryTournamentId || overlayState?.flexibleTop5?.tournamentId || '';
  const currentPage = queryPage ? parseInt(queryPage, 10) : overlayState?.flexibleTop5?.page || 1;
  const showTitle = queryShowTitle !== null ? queryShowTitle === '1' || queryShowTitle === 'true' : overlayState?.flexibleTop5?.showTitle ?? true;

  const [allTeams, setAllTeams] = useState<FlexibleTop5TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const apiKey = process.env.NEXT_PUBLIC_OVERLAY_API_KEY || 'heaven-overlay-secret';
    const baseUrl = process.env.NEXT_PUBLIC_HEAVEN_API_BASE_URL || 'http://localhost:3000';

    fetch(`${baseUrl}/api/overlay/standings/top?tournamentId=${tournamentId}&n=100&type=team&includeHistory=1`, {
      headers: {
        'x-overlay-api-key': apiKey,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          const results = json.results || json.standings || [];
          const mapped: FlexibleTop5TeamData[] = results.map((t: any, idx: number) => ({
            id: t.id || t.teamId,
            teamId: t.teamId || t.id,
            teamName: t.teamName || t.name || 'Team',
            logoUrl: t.logoUrl || t.logo || null,
            slot: t.slot || null,
            rank: t.rank || t.analyticsRank || idx + 1,
            totalPts: t.totalPts ?? t.points ?? 0,
            avgPlacement: t.avgPlacement ?? (t.matchesPlayed > 0 ? (t.placementPts || 0) / t.matchesPlayed : null),
            rating: t.rating ?? t.score ?? null,
            placementHistory: t.placementHistory || [],
            trendDelta: t.trendDelta ?? null,
          }));
          setAllTeams(mapped);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch error in FlexibleTop5RenderPage:', err);
          setError(err.message);
          setAllTeams([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  const pageSize = 5;
  const totalPages = Math.max(Math.ceil(allTeams.length / pageSize), 1);
  const validatedPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIdx = (validatedPage - 1) * pageSize;
  const pageTeams = allTeams.slice(startIdx, startIdx + pageSize);

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
        padding: '40px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '120px', color: COLORS.textMuted }}>
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
            <span style={{ letterSpacing: '2px', fontSize: '14px', fontWeight: 600 }}>LOADING STANDINGS...</span>
          </div>
        )}

        {/* Error / Empty State */}
        {!loading && (error || !tournamentId || allTeams.length === 0) && (
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
              NO STANDINGS DATA
            </div>
            <div style={{ fontSize: '14px', color: COLORS.textMuted }}>
              {!tournamentId
                ? 'Select a tournament in the Overlay Dashboard or pass query params.'
                : error || 'No standings available for this tournament.'}
            </div>
          </div>
        )}

        {/* Title Header (Optional toggle) */}
        {!loading && allTeams.length > 0 && showTitle && (
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: COLORS.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '4px',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              TOURNAMENT STANDINGS
            </h1>
            <div style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '4px', letterSpacing: '1px' }}>
              Page {validatedPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Standings Bars List */}
        {!loading && pageTeams.length > 0 && (
          <div key={`page-${validatedPage}`}>
            {pageTeams.map((team, idx) => (
              <FlexibleTop5Bar key={team.id || `team-${startIdx + idx}`} team={team} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlexibleTop5RenderPage() {
  return (
    <Suspense fallback={null}>
      <FlexibleTop5Content />
    </Suspense>
  );
}
