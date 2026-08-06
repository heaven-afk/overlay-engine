'use client';

import React from 'react';
import { FlexibleTop5Bar, FlexibleTop5TeamData } from '@/components/overlay/FlexibleTop5Bar';
import { COLORS } from '@/lib/overlayDesignTokens';

interface FlexibleTop5GraphicProps {
  data?: any;
  styleConfig?: any;
}

export function FlexibleTop5Graphic({ data = {}, styleConfig }: FlexibleTop5GraphicProps) {
  const showTitle = data.showTitle ?? styleConfig?.showTitle ?? true;
  const rawTeams = data.rows || data.teams || data.results || [
    { teamId: 't1', teamName: 'REMEDIUM INVICTUS', rank: 1, totalPts: 180, avgPlacement: 2.1, rating: 750, placementHistory: [3, 1, 2, 1, 2], trendDelta: 2 },
    { teamId: 't2', teamName: 'KYZON ESPORTS', rank: 2, totalPts: 165, avgPlacement: 3.4, rating: 690, placementHistory: [1, 5, 3, 2, 4], trendDelta: 0 },
    { teamId: 't3', teamName: 'HYPERION SQUAD', rank: 3, totalPts: 150, avgPlacement: 4.2, rating: 640, placementHistory: [4, 2, 6, 3, 5], trendDelta: -1 },
    { teamId: 't4', teamName: 'PARIS CHITAURI', rank: 4, totalPts: 135, avgPlacement: 5.0, rating: 610, placementHistory: [6, 4, 2, 7, 3], trendDelta: 1 },
    { teamId: 't5', teamName: 'VORTEX ONE', rank: 5, totalPts: 120, avgPlacement: 5.8, rating: 580, placementHistory: [2, 8, 5, 6, 8], trendDelta: -2 },
  ];

  const currentPage = data.page || 1;
  const pageSize = 5;
  const startIdx = (currentPage - 1) * pageSize;
  const pageTeams: FlexibleTop5TeamData[] = rawTeams.slice(startIdx, startIdx + pageSize).map((t: any, idx: number) => ({
    id: t.id || t.teamId,
    teamId: t.teamId || t.id,
    teamName: t.teamName || t.name || 'Team',
    logoUrl: t.logoUrl || t.logo || null,
    slot: t.slot || null,
    rank: t.rank || t.analyticsRank || startIdx + idx + 1,
    totalPts: t.totalPts ?? t.points ?? 0,
    avgPlacement: t.avgPlacement ?? null,
    rating: t.rating ?? t.score ?? null,
    placementHistory: t.placementHistory || [],
    trendDelta: t.trendDelta ?? null,
  }));

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
        padding: '60px 40px',
        boxSizing: 'border-box',
        fontFamily: styleConfig?.headingFont ? `'${styleConfig.headingFont}', sans-serif` : "'Inter', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {showTitle && (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: COLORS.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: '4px',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {styleConfig?.graphicTitle || 'TOURNAMENT STANDINGS'}
            </h1>
            <div style={{ fontSize: '14px', color: COLORS.textMuted, marginTop: '6px', letterSpacing: '1px' }}>
              Page {currentPage} of {Math.max(Math.ceil(rawTeams.length / pageSize), 1)}
            </div>
          </div>
        )}

        <div>
          {pageTeams.map((team, idx) => (
            <FlexibleTop5Bar key={team.id || `team-${startIdx + idx}`} team={team} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
