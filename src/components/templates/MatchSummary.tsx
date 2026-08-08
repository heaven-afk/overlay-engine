'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, TeamLogoPlaceholder } from './SharedElements';

export interface MatchSummaryTeam {
  teamId?: string;
  teamName?: string;
  logoUrl?: string | null;
  wins?: number;
  totalPts?: number;
  placementPts?: number;
  kills?: number;
  avgPlacement?: number;
  rank?: number;
  placesGained?: number;
  rankCategory?: string;
}

export interface MatchSummaryData {
  scope?: 'lobby' | 'match';
  day?: number;
  lobby?: number;
  winner?: MatchSummaryTeam | null;
  placementLeader?: MatchSummaryTeam | null;
  killLeader?: MatchSummaryTeam | null;
  top3?: MatchSummaryTeam[];
  biggestMover?: MatchSummaryTeam | null;
  underdogCandidate?: MatchSummaryTeam | null;
  results?: MatchSummaryTeam[];
}

interface MatchSummaryProps {
  data: MatchSummaryData;
  styleConfig: TemplateStyleConfig;
}

export const MatchSummary: React.FC<MatchSummaryProps> = ({ data, styleConfig }) => {
  const scope = data?.scope || 'match';
  const isLobbyScope = scope === 'lobby';

  // Fallback defaults if data is empty (e.g. initial preview)
  const winner = data?.winner || { teamName: 'Vortex One', logoUrl: null, totalPts: 182, kills: 42, wins: 1 };
  const placementLeader = data?.placementLeader || { teamName: 'Legionaries', logoUrl: null, avgPlacement: 2.1, placementPts: 120 };
  const killLeader = data?.killLeader || { teamName: 'Kyzon Esports', logoUrl: null, kills: 38 };
  const top3 = (data?.top3 && data.top3.length > 0) ? data.top3 : [
    { teamName: 'Vortex One', logoUrl: null, totalPts: 182, rank: 1 },
    { teamName: 'Legionaries', logoUrl: null, totalPts: 164, rank: 2 },
    { teamName: 'Kyzon Esports', logoUrl: null, totalPts: 152, rank: 3 },
  ];
  const biggestMover = data?.biggestMover !== undefined ? data.biggestMover : { teamName: 'Team Vortex One', logoUrl: null, placesGained: 5 };
  const underdogCandidate = data?.underdogCandidate !== undefined ? data.underdogCandidate : { teamName: 'Paris Chitauri', logoUrl: null, rankCategory: 'Low Rank' };

  const accentColor = styleConfig?.accentColor || '#FFD700';

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        boxSizing: 'border-box',
        padding: '60px 80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'var(--body-font, sans-serif)',
        color: '#FFFFFF',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(15, 15, 22, 0.95) 0%, rgba(26, 26, 38, 0.98) 100%)',
      }}
    >
      {/* Background Accent Mesh */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}22 0%, rgba(0,0,0,0) 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
        <BrandingHeader styleConfig={styleConfig} />
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--heading-font, sans-serif)',
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: accentColor,
              textTransform: 'uppercase',
            }}
          >
            {styleConfig?.graphicTitle || (isLobbyScope ? 'LOBBY SUMMARY' : 'MATCH SUMMARY')}
          </div>
          <div style={{ fontSize: '16px', color: '#9CA3AF', marginTop: '4px' }}>
            {styleConfig?.graphicSubtitle || (isLobbyScope ? `Day ${data?.day || 1} — Lobby ${data?.lobby || 1}` : 'Overall Performance & Leaderboard')}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', margin: 'auto 0', zIndex: 2 }}>
        
        {/* Section 1: Leader Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isLobbyScope ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '24px',
          }}
        >
          {/* Winner Card */}
          {winner && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${accentColor}44`,
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: accentColor, letterSpacing: '1px', textTransform: 'uppercase' }}>
                🏆 {isLobbyScope ? 'LOBBY WINNER' : 'MATCH WINNER'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <TeamLogoPlaceholder logoUrl={winner.logoUrl} name={winner.teamName} size={36} />
                <span style={{ fontSize: '24px', fontWeight: 800 }}>{winner.teamName || '—'}</span>
              </div>
              <div style={{ fontSize: '18px', color: '#D1D5DB', fontWeight: 600 }}>
                {isLobbyScope ? '1st Place' : `${winner.totalPts ?? 0} total pts`}
              </div>
            </div>
          )}

          {/* Placement Leader Card (Match scope only) */}
          {!isLobbyScope && placementLeader && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #60A5FA',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', letterSpacing: '1px', textTransform: 'uppercase' }}>
                📍 PLACEMENT LEADER
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <TeamLogoPlaceholder logoUrl={placementLeader.logoUrl} name={placementLeader.teamName} size={36} />
                <span style={{ fontSize: '24px', fontWeight: 800 }}>{placementLeader.teamName || '—'}</span>
              </div>
              <div style={{ fontSize: '18px', color: '#D1D5DB', fontWeight: 600 }}>
                {placementLeader.avgPlacement ? `best avg finish (${placementLeader.avgPlacement})` : 'best avg finish'}
              </div>
            </div>
          )}

          {/* Kill Leader Card */}
          {killLeader && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #F87171',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F87171', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🎯 KILL LEADER
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <TeamLogoPlaceholder logoUrl={killLeader.logoUrl} name={killLeader.teamName} size={36} />
                <span style={{ fontSize: '24px', fontWeight: 800 }}>{killLeader.teamName || '—'}</span>
              </div>
              <div style={{ fontSize: '18px', color: '#D1D5DB', fontWeight: 600 }}>
                {isLobbyScope ? `${killLeader.kills ?? 0} kills` : `${killLeader.kills ?? 0} kills today`}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Top 3 List */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
            TOP 3 STANDINGS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {top3.slice(0, 3).map((team, idx) => (
              <div
                key={team.teamId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '16px 20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '20px', fontWeight: 800, color: idx === 0 ? accentColor : '#D1D5DB', width: '28px' }}>
                  {idx + 1}.
                </span>
                <TeamLogoPlaceholder logoUrl={team.logoUrl} name={team.teamName} size={36} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>{team.teamName || '—'}</span>
                  {team.totalPts !== undefined && (
                    <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{team.totalPts} pts</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Callouts (Biggest Mover & Underdog Alert) */}
        {(biggestMover || underdogCandidate) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {biggestMover && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#34D399',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  padding: '12px 20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📈</span>
                <TeamLogoPlaceholder logoUrl={biggestMover.logoUrl} name={biggestMover.teamName} size={36} />
                <span>
                  <strong>{biggestMover.teamName}</strong> jumps +{biggestMover.placesGained ?? 1} places
                </span>
              </div>
            )}

            {underdogCandidate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FBBF24',
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  padding: '12px 20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '20px' }}>💥</span>
                <span>Underdog alert:</span>
                <TeamLogoPlaceholder logoUrl={underdogCandidate.logoUrl} name={underdogCandidate.teamName} size={36} />
                <span>
                  [{underdogCandidate.rankCategory || 'Low Rank'}] <strong>{underdogCandidate.teamName}</strong> finishes Top 3
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Stats Stamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
        <SourceLine styleConfig={styleConfig} />
        <StatsStamp show={styleConfig?.showStatsStamp ?? true} />
      </div>
    </div>
  );
};
