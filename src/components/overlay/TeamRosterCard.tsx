'use client';

import React from 'react';

export interface PlayerRosterData {
  id: string | null;
  ign: string;
  professionalName: string;
  country: string | null;
  countryEmoji?: string;
  kills: number;
  photoUrl: string | null;
}

interface TeamRosterCardProps {
  player: PlayerRosterData;
  index: number;
  frameColor?: string;
}

export function TeamRosterCard({ player, frameColor = '#C9A84C' }: TeamRosterCardProps) {
  const isEmptySlot = !player.id || player.professionalName === 'Empty Slot' || player.ign === '—' || player.ign === 'EMPTY';

  const initial = (
    player.professionalName && player.professionalName !== 'Empty Slot'
      ? player.professionalName
      : player.ign && player.ign !== '—'
      ? player.ign
      : '?'
  )[0].toUpperCase();

  const flagUrl = player.country && player.country.length === 2
    ? `https://flagcdn.com/w80/${player.country.toLowerCase()}.png`
    : null;

  // Chamfered card shape: cut top-right & bottom-left corners at 45°
  const chamferClipPath = 'polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)';

  const metallicBorderGradient = `linear-gradient(135deg, ${frameColor}66 0%, ${frameColor} 30%, #FFFFFF 65%, ${frameColor}88 100%)`;

  return (
    <div
      style={{
        width: '300px',
        height: '420px',
        position: 'relative',
        clipPath: chamferClipPath,
        background: isEmptySlot ? 'rgba(255,255,255,0.1)' : metallicBorderGradient,
        padding: '5px', // Creates 5px metallic border width
        boxSizing: 'border-box',
        boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
        flexShrink: 0,
      }}
    >
      {/* Inner Card Background */}
      <div
        style={{
          width: '100%',
          height: '100%',
          clipPath: chamferClipPath,
          backgroundColor: '#0A0A0F',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Photo Area (Top 60–65% of card: 255px tall) */}
        <div
          style={{
            width: '100%',
            height: '255px',
            position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isEmptySlot ? (
            <div
              style={{
                width: '85%',
                height: '85%',
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: '8px',
              }}
            />
          ) : player.photoUrl ? (
            <>
              <img
                src={player.photoUrl}
                alt={player.professionalName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
              {/* Bottom Vignette Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,15,0.85) 100%)',
                }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(ellipse at 50% 40%, ${frameColor}33 0%, rgba(10,10,15,0.95) 75%)`,
                color: frameColor,
                fontWeight: 900,
                fontSize: '72px',
                fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}
            >
              {initial}
            </div>
          )}

          {/* Flag Badge overlapping photo & name plate */}
          {!isEmptySlot && flagUrl && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '14px',
                width: '36px',
                height: '24px',
                borderRadius: '3px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                zIndex: 10,
              }}
            >
              <img
                src={flagUrl}
                alt={player.country || 'Flag'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        {/* Name Plate */}
        <div
          style={{
            padding: '12px 16px 6px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '65px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 900,
              color: isEmptySlot ? 'rgba(255,255,255,0.4)' : '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '260px',
            }}
          >
            {isEmptySlot ? 'EMPTY SLOT' : player.professionalName}
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              marginTop: '2px',
              fontFamily: '"Rajdhani", sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '260px',
            }}
          >
            {isEmptySlot ? '—' : `@${player.ign}`}
          </span>
        </div>

        {/* Thin Divider Line */}
        <div
          style={{
            width: '80%',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            margin: '0 auto',
          }}
        />

        {/* Stat Readout */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '8px',
          }}
        >
          <span
            style={{
              fontSize: '36px',
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: '"Orbitron", sans-serif',
              background: isEmptySlot ? 'none' : `linear-gradient(180deg, ${frameColor} 0%, #FFA500 100%)`,
              WebkitBackgroundClip: isEmptySlot ? 'none' : 'text',
              WebkitTextFillColor: isEmptySlot ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: isEmptySlot ? 'rgba(255,255,255,0.3)' : frameColor,
            }}
          >
            {isEmptySlot ? 0 : player.kills}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            KILLS
          </span>
        </div>
      </div>
    </div>
  );
}
