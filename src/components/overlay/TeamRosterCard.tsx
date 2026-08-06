'use client';

import React from 'react';
import { COLORS, SIZES } from '@/lib/overlayDesignTokens';

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

export function TeamRosterCard({ player }: TeamRosterCardProps) {
  const isEmptySlot = !player.id || player.professionalName === 'Empty Slot' || player.ign === '—' || player.ign === 'EMPTY';

  const initial = (player.professionalName && player.professionalName !== 'Empty Slot' ? player.professionalName : player.ign && player.ign !== '—' ? player.ign : '?')[0].toUpperCase();

  return (
    <div
      style={{
        width: `${SIZES.rosterCardWidth}px`,
        minHeight: `${SIZES.rosterCardHeight}px`,
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 20px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Photo Area */}
      <div
        style={{
          width: `${SIZES.rosterPhotoSize}px`,
          height: `${SIZES.rosterPhotoSize}px`,
          borderRadius: '50%',
          border: isEmptySlot
            ? '2px dashed rgba(255,255,255,0.1)'
            : '3px solid rgba(255, 215, 0, 0.6)',
          boxShadow: isEmptySlot ? 'none' : '0 0 16px rgba(255,215,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,0.03)',
          marginTop: '0px',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        {isEmptySlot ? (
          <div style={{ width: '100%', height: '100%' }} />
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
      <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
          {!isEmptySlot && player.countryEmoji && (
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{player.countryEmoji}</span>
          )}
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: isEmptySlot ? COLORS.textMuted : COLORS.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '190px',
            }}
          >
            {isEmptySlot ? 'EMPTY' : player.professionalName}
          </span>
        </div>

        <div
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
          }}
        >
          {isEmptySlot ? '' : `@${player.ign}`}
        </div>
      </div>

      {/* Thin Divider Line */}
      <div
        style={{
          width: '80%',
          height: '1px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          margin: '16px auto 12px auto',
        }}
      />

      {/* Kill Count Stat */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontSize: '42px',
            fontWeight: 800,
            lineHeight: 1,
            background: isEmptySlot ? 'none' : 'linear-gradient(180deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: isEmptySlot ? 'none' : 'text',
            WebkitTextFillColor: isEmptySlot ? 'rgba(255,255,255,0.4)' : 'transparent',
            color: isEmptySlot ? 'rgba(255,255,255,0.4)' : COLORS.gold,
          }}
        >
          {isEmptySlot ? 0 : player.kills}
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            color: 'rgba(255,255,255,0.4)',
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
