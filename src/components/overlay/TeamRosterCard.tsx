'use client';

import React from 'react';

export interface PlayerRosterData {
  id: string | null;
  ign: string;
  professionalName: string;
  country: string | null;
  countryCode?: string; // e.g. "NGA", "USA"
  countryEmoji?: string;
  kills: number;
  photoUrl: string | null;
}

interface TeamRosterCardProps {
  player: PlayerRosterData;
  index: number;
  frameColor?: string;
}

export function TeamRosterCard({ player, index, frameColor = '#D4E82A' }: TeamRosterCardProps) {
  const isEmptySlot = !player.id || player.professionalName === 'Empty Slot' || player.ign === '—' || player.ign === 'EMPTY';

  const initial = (
    player.professionalName && player.professionalName !== 'Empty Slot'
      ? player.professionalName
      : player.ign && player.ign !== '—'
      ? player.ign
      : '?'
  )[0].toUpperCase();

  // Resolve country flag and 3-letter code
  const countryInfo = resolveCountry(player.countryCode || player.country);
  const flagUrl = countryInfo.iso2 ? `https://flagcdn.com/w80/${countryInfo.iso2}.png` : null;
  const displayCode = countryInfo.code;

  // Pad index to 2 digits
  const slotNumber = String(index + 1).padStart(2, '0');

  const accent = isEmptySlot ? 'rgba(255,255,255,0.2)' : frameColor;

  return (
    <div
      style={{
        width: '280px',
        height: '440px',
        position: 'relative',
        flexShrink: 0,
        // card border using outline trick + border-radius clip
        borderRadius: '4px',
        border: `2px solid ${accent}`,
        backgroundColor: '#0C0C0C',
        overflow: 'hidden',
        boxShadow: isEmptySlot
          ? 'none'
          : `0 0 0 1px rgba(0,0,0,0.6), 0 12px 40px rgba(0,0,0,0.85), inset 0 0 80px rgba(0,0,0,0.5)`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Barlow Condensed", "Rajdhani", "Orbitron", sans-serif',
      }}
    >
      {/* ── Corner diamond decorations ── */}
      {!isEmptySlot && (
        <>
          {/* Top-left corner accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '28px', height: '28px',
            borderTop: `3px solid ${accent}`,
            borderLeft: `3px solid ${accent}`,
            zIndex: 20,
          }} />
          {/* Bottom-right corner accent line */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '28px', height: '28px',
            borderBottom: `3px solid ${accent}`,
            borderRight: `3px solid ${accent}`,
            zIndex: 20,
          }} />
        </>
      )}

      {/* ── Slot number badge (top-left) ── */}
      {!isEmptySlot && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 30,
          minWidth: '38px',
          padding: '2px 6px',
          backgroundColor: accent,
          clipPath: 'polygon(0 0, 100% 0, 100% 70%, 92% 100%, 0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '20px',
            fontWeight: 900,
            color: '#000000',
            lineHeight: 1,
            fontFamily: '"Barlow Condensed", "Orbitron", sans-serif',
            letterSpacing: '-0.5px',
          }}>
            {slotNumber}
          </span>
        </div>
      )}

      {/* ── Country flag + code (top-right) ── */}
      {!isEmptySlot && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
        }}>
          {flagUrl && (
            <div style={{
              width: '34px',
              height: '22px',
              borderRadius: '2px',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <img
                src={flagUrl}
                alt={displayCode}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
          {displayCode && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.5px',
              fontFamily: '"Barlow Condensed", sans-serif',
            }}>
              {displayCode}
            </span>
          )}
        </div>
      )}

      {/* ── Photo area ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}>
        {isEmptySlot ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '2px',
          }}>
            EMPTY
          </div>
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
                display: 'block',
              }}
            />
            {/* Gradient overlay — heavier at bottom to blend into name plate */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,10,0.6) 70%, rgba(10,10,10,0.97) 100%)',
            }} />
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(ellipse at 50% 40%, ${accent}25 0%, rgba(10,10,10,0.95) 70%)`,
            color: accent,
            fontWeight: 900,
            fontSize: '80px',
            fontFamily: '"Orbitron", sans-serif',
          }}>
            {initial}
          </div>
        )}

        {/* Subtle diagonal lines overlay for texture */}
        {!isEmptySlot && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 18px,
              rgba(255,255,255,0.012) 18px,
              rgba(255,255,255,0.012) 19px
            )`,
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── Name Plate ── */}
      <div style={{
        backgroundColor: '#0C0C0C',
        padding: '10px 12px 12px 12px',
        borderTop: `1px solid ${isEmptySlot ? 'rgba(255,255,255,0.08)' : accent}40`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1px',
        position: 'relative',
      }}>
        {/* Accent bottom border line */}
        {!isEmptySlot && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${accent} 0%, ${accent}60 60%, transparent 100%)`,
          }} />
        )}

        {/* Professional Name (large) */}
        <span style={{
          fontSize: '26px',
          fontWeight: 900,
          color: isEmptySlot ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
          textTransform: 'uppercase',
          lineHeight: 1,
          letterSpacing: '0.5px',
          fontFamily: '"Barlow Condensed", "Rajdhani", sans-serif',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '256px',
        }}>
          {isEmptySlot ? 'EMPTY SLOT' : player.professionalName}
        </span>

        {/* IGN (small, accent color) */}
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isEmptySlot ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
          letterSpacing: '0.3px',
          fontFamily: '"Barlow Condensed", sans-serif',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '256px',
        }}>
          {isEmptySlot ? '—' : player.ign}
        </span>

        {/* Kills row */}
        {!isEmptySlot && (
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '5px',
            marginTop: '6px',
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: 900,
              color: accent,
              lineHeight: 1,
              fontFamily: '"Barlow Condensed", "Orbitron", sans-serif',
              letterSpacing: '-1px',
            }}>
              {player.kills}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
              paddingBottom: '6px',
            }}>
              KILLS
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function resolveCountry(country: string | null): { iso2: string | null; code: string } {
  if (!country) return { iso2: null, code: '' };
  const clean = country.trim();
  if (clean.length === 2) {
    const iso2 = clean.toLowerCase();
    return { iso2, code: iso2ToCode(iso2) };
  }
  if (clean.length === 3) {
    const iso2 = iso3to2(clean);
    return { iso2, code: clean.toUpperCase() };
  }
  const nameMap: Record<string, { iso2: string; code: string }> = {
    nigeria: { iso2: 'ng', code: 'NGA' },
    ghana: { iso2: 'gh', code: 'GHA' },
    kenya: { iso2: 'ke', code: 'KEN' },
    'south africa': { iso2: 'za', code: 'ZAF' },
    egypt: { iso2: 'eg', code: 'EGY' },
    morocco: { iso2: 'ma', code: 'MAR' },
    senegal: { iso2: 'sn', code: 'SEN' },
    cameroon: { iso2: 'cm', code: 'CMR' },
    'united states': { iso2: 'us', code: 'USA' },
    usa: { iso2: 'us', code: 'USA' },
    'united kingdom': { iso2: 'gb', code: 'GBR' },
    uk: { iso2: 'gb', code: 'GBR' },
    france: { iso2: 'fr', code: 'FRA' },
    germany: { iso2: 'de', code: 'DEU' },
    spain: { iso2: 'es', code: 'ESP' },
    italy: { iso2: 'it', code: 'ITA' },
    brazil: { iso2: 'br', code: 'BRA' },
    argentina: { iso2: 'ar', code: 'ARG' },
    japan: { iso2: 'jp', code: 'JPN' },
    'south korea': { iso2: 'kr', code: 'KOR' },
    korea: { iso2: 'kr', code: 'KOR' },
    philippines: { iso2: 'ph', code: 'PHL' },
    indonesia: { iso2: 'id', code: 'IDN' },
    malaysia: { iso2: 'my', code: 'MYS' },
    thailand: { iso2: 'th', code: 'THA' },
    vietnam: { iso2: 'vn', code: 'VNM' },
    singapore: { iso2: 'sg', code: 'SGP' },
    australia: { iso2: 'au', code: 'AUS' },
    canada: { iso2: 'ca', code: 'CAN' },
  };
  const match = nameMap[clean.toLowerCase()];
  if (match) return match;
  return { iso2: null, code: clean.toUpperCase().slice(0, 3) };
}

function iso3to2(code: string): string | null {
  const map: Record<string, string> = {
    NGA: 'ng', GBR: 'gb', USA: 'us', GHA: 'gh', KEN: 'ke', ZAF: 'za',
    BRA: 'br', ARG: 'ar', IND: 'in', PAK: 'pk', AUS: 'au', CAN: 'ca',
    FRA: 'fr', DEU: 'de', ESP: 'es', ITA: 'it', NLD: 'nl', PRT: 'pt',
    MEX: 'mx', COL: 'co', VEN: 've', PER: 'pe', CHL: 'cl', EGY: 'eg',
    MAR: 'ma', SEN: 'sn', CMR: 'cm', JPN: 'jp', KOR: 'kr', PHL: 'ph',
    IDN: 'id', MYS: 'my', THA: 'th', VNM: 'vn', SGP: 'sg', TUR: 'tr',
    SAU: 'sa', ARE: 'ae', QAT: 'qa', IRQ: 'iq', IRN: 'ir', RUS: 'ru',
    UKR: 'ua', POL: 'pl', SWE: 'se', NOR: 'no', DNK: 'dk', FIN: 'fi',
  };
  return map[code.toUpperCase()] ?? null;
}

function iso2ToCode(code: string): string {
  const map: Record<string, string> = {
    ng: 'NGA', gb: 'GBR', us: 'USA', gh: 'GHA', ke: 'KEN', za: 'ZAF',
    br: 'BRA', ar: 'ARG', in: 'IND', pk: 'PAK', au: 'AUS', ca: 'CAN',
    fr: 'FRA', de: 'DEU', es: 'ESP', it: 'ITA', nl: 'NLD', pt: 'PRT',
    mx: 'MEX', co: 'COL', jp: 'JPN', kr: 'KOR', ph: 'PHL', id: 'IDN',
    my: 'MYS', th: 'THA', vn: 'VNM', sg: 'SGP', tr: 'TUR', sa: 'SAU',
    ae: 'ARE', qa: 'QAT', eg: 'EGY', ma: 'MAR', sn: 'SEN', cm: 'CMR',
  };
  return map[code.toLowerCase()] ?? code.toUpperCase();
}
