'use client';

import React from 'react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { ANIMATION, COLORS, SIZES } from '@/lib/overlayDesignTokens';

export interface PlayerRosterData {
  id: string | null;
  ign: string;
  professionalName: string;
  country: string | null;
  countryEmoji: string;
  kills: number;
  photoUrl: string | null;
}

interface TeamRosterCardProps {
  player: PlayerRosterData;
  index: number;
}

export function TeamRosterCard({ player, index }: TeamRosterCardProps) {
  const animatedKills = useAnimatedNumber(player.kills, ANIMATION.countUpDuration);
  const isEmptySlot = !player.id || player.professionalName === 'Empty Slot' || player.ign === '—';

  const initial = (player.professionalName || player.ign || '?')[0].toUpperCase();

  return (
    <div
      style={{
        width: `${SIZES.rosterCardWidth}px`,
        minHeight: `${SIZES.rosterCardHeight}px`,
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        animation: `cardFadeIn 600ms ${ANIMATION.easeOutExpo} ${index * ANIMATION.cardStagger}ms forwards`,
        opacity: 0,
        transform: 'translateY(40px)',
      }}
    >
      <style jsx>{`
        @keyframes cardFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Photo Area */}
      <div
        style={{
          width: `${SIZES.rosterPhotoSize}px`,
          height: `${SIZES.rosterPhotoSize}px`,
          borderRadius: '50%',
          border: isEmptySlot
            ? '2px dashed rgba(255,255,255,0.2)'
            : `3px solid rgba(255, 215, 0, 0.6)`,
          boxShadow: isEmptySlot ? 'none' : '0 0 16px rgba(255,215,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.03)',
          marginBottom: '20px',
          flexShrink: 0,
        }}
      >
        {isEmptySlot ? (
          <span style={{ fontSize: '42px', opacity: 0.3 }}>{player.countryEmoji || '🏳️'}</span>
        ) : player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.professionalName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, rgba(10,10,20,0.8) 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '44px',
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Player Identity */}
      <div style={{ textAlign: 'center', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px' }}>{player.countryEmoji || '🏳️'}</span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: isEmptySlot ? COLORS.textMuted : COLORS.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px',
            }}
          >
            {isEmptySlot ? '—' : player.professionalName}
          </span>
        </div>

        <div
          style={{
            fontSize: '14px',
            color: COLORS.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
          }}
        >
          {isEmptySlot ? 'EMPTY' : `@${player.ign}`}
        </div>
      </div>

      {/* Kill Count Stat */}
      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '16px' }}>
        <div
          style={{
            fontSize: '44px',
            fontWeight: 800,
            lineHeight: 1,
            background: isEmptySlot ? 'none' : COLORS.goldGradient,
            WebkitBackgroundClip: isEmptySlot ? 'none' : 'text',
            WebkitTextFillColor: isEmptySlot ? COLORS.textMuted : 'transparent',
            color: isEmptySlot ? COLORS.textMuted : COLORS.gold,
          }}
        >
          {isEmptySlot ? 0 : animatedKills}
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            color: COLORS.textSecondary,
            marginTop: '6px',
            textTransform: 'uppercase',
          }}
        >
          KILLS
        </div>
      </div>
    </div>
  );
}
