'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlexibleTop5Graphic } from '@/components/templates/FlexibleTop5Graphic';
import { useOverlayState } from '@/hooks/useOverlayState';
import { COLORS } from '@/lib/overlayDesignTokens';
import { getTopStandings } from '@/lib/statsApi';

function FlexibleTop5Content() {
  const searchParams = useSearchParams();
  const { state: overlayState } = useOverlayState();

  const queryTournamentId = searchParams.get('tournamentId');
  const queryPage = searchParams.get('page');

  const tournamentId = queryTournamentId || overlayState?.flexibleTop5?.tournamentId || '';
  const currentPage = queryPage ? parseInt(queryPage, 10) : overlayState?.flexibleTop5?.page || 1;

  const [allTeams, setAllTeams] = useState<any[]>([]);
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

    getTopStandings(tournamentId, 100, 'team')
      .then((json) => {
        if (isMounted) {
          const results = (json as any).results || (json as any).standings || [];
          setAllTeams(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Fetch error in FlexibleTop5RenderPage:', err);
          setError(err.message || 'Failed to fetch standings');
          setAllTeams([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', color: COLORS.textMuted }}>
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

      {/* Render Full Graphic */}
      {!loading && allTeams.length > 0 && (
        <div style={{ transform: 'scale(1)', transformOrigin: 'center' }}>
          <FlexibleTop5Graphic data={{ rows: allTeams, page: currentPage }} />
        </div>
      )}
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
