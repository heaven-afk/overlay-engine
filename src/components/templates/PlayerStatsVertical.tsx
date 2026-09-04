'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { getCanvaEmbedUrl } from './SharedElements';

interface PlayerStatsVerticalProps {
  data?: any;
  styleConfig?: TemplateStyleConfig;
  isPreview?: boolean;
}

// ── Utility ────────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(201, 168, 76, ${alpha})`;
  const clean = hex.replace('#', '');
  let r = 201, g = 168, b = 76;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Player Avatar (photo or initials fallback) ─────────────────────────────────
function PlayerAvatar({
  photoUrl,
  name,
  size,
  accent,
}: {
  photoUrl?: string | null;
  name?: string;
  size: number;
  accent: string;
}) {
  const isHttp = photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'));
  const initials = (name || '?')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase() || 'P1';
  const fontSize = Math.round(size * 0.3);

  if (isHttp) {
    const canvaUrl = getCanvaEmbedUrl(photoUrl);
    if (canvaUrl) {
      return (
        <iframe
          src={canvaUrl}
          scrolling="no"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            border: 'none',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: hexToRgba(accent, 0.1),
            pointerEvents: 'none',
            flexShrink: 0,
          }}
        />
      );
    }
    return (
      <img
        src={photoUrl}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }

  // Initials fallback
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${hexToRgba(accent, 0.22)}, ${hexToRgba(accent, 0.06)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: `${fontSize}px`,
        color: accent,
        letterSpacing: '0.03em',
        flexShrink: 0,
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {initials}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
  isHighlight = false,
}: {
  label: string;
  value: string;
  accent: string;
  isHighlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '10px',
        background: isHighlight
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)} 0%, rgba(255,255,255,0.03) 100%)`
          : 'rgba(255,255,255,0.04)',
        border: isHighlight
          ? `1px solid ${hexToRgba(accent, 0.6)}`
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isHighlight
          ? `0 0 14px ${hexToRgba(accent, 0.12)}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        boxSizing: 'border-box',
        minHeight: '68px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top shimmer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        }}
      />
      <span
        style={{
          fontSize: '8.5px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isHighlight ? accent : 'rgba(255,255,255,0.45)',
          fontFamily: '"Inter", sans-serif',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '22px',
          fontWeight: 900,
          color: isHighlight ? '#ffffff' : accent,
          fontFamily: '"Inter", monospace',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginTop: '6px',
          textShadow: isHighlight ? `0 0 18px ${hexToRgba(accent, 0.5)}` : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Template ──────────────────────────────────────────────────────────────
export const PlayerStatsVertical: React.FC<PlayerStatsVerticalProps> = ({
  data = {},
  styleConfig = {} as TemplateStyleConfig,
  isPreview = false,
}) => {
  const {
    accentColor = '#C9A84C',
    colorTheme = 'dark',
    customBackgroundUrl,
    brandingLogoUrl,
    tournamentLogos = [],
    graphicTitle = 'PLAYER STATS',
    showStatsStamp = true,
  } = styleConfig;

  const accent = accentColor || '#C9A84C';
  const isLight = colorTheme === 'light';
  const isCustom = colorTheme === 'custom';

  // ── Data extraction ──────────────────────────────────────────────────────────
  const player = data?.player || data?.profile || data || {};
  const career = player.careerStats || data?.careerStats || {};

  // Stats level: Career / Tournament / Daily
  const statsLevel: 'career' | 'tournament' | 'daily' =
    data?.statsLevel || (player.scope === 'career' ? 'career' : 'tournament');

  // For daily: use selected day from dayHistory
  const selectedDayNum = data?.selectedDay ? Number(data.selectedDay) : null;
  const dayHistory: any[] = Array.isArray(player.dayHistory) ? player.dayHistory : [];
  const dayData = selectedDayNum
    ? dayHistory.find((d: any) => d.dayNum === selectedDayNum) ?? dayHistory[dayHistory.length - 1] ?? null
    : dayHistory[dayHistory.length - 1] ?? null;

  // ── Identity ─────────────────────────────────────────────────────────────────
  const professionalName =
    player.professionalName || player.playerName || player.ign || 'PRO PLAYER';
  const teamName = player.teamName || career.teamName || 'NO TEAM';
  const country = player.country || 'N/A';
  const countryCode = player.countryCode || player.country || '';
  const photoUrl = player.photoUrl || null;

  // ── Level badge label ─────────────────────────────────────────────────────────
  const levelLabel =
    statsLevel === 'career'
      ? 'CAREER'
      : statsLevel === 'daily'
      ? selectedDayNum
        ? `DAY ${selectedDayNum}`
        : 'DAILY'
      : player.tournamentName
      ? player.tournamentName.toUpperCase()
      : 'TOURNAMENT';

  // ── Stats computation ─────────────────────────────────────────────────────────
  let totalKills: number,
    matchesPlayed: number,
    killsPerMatch: number,
    avgDamage: number,
    avgAccuracy: number,
    sixthLabel: string,
    sixthValue: string;

  if (statsLevel === 'daily' && dayData) {
    totalKills = Number(dayData.kills ?? 0);
    matchesPlayed = Number(dayData.matches ?? 0);
    killsPerMatch = matchesPlayed > 0 ? totalKills / matchesPlayed : 0;
    avgDamage = Number(dayData.avgDamage ?? 0);
    avgAccuracy = Number(player.avgAccuracy ?? career.avgAccuracy ?? 0);
    const pct = Number(dayData.killShare ?? dayData.killsContributionPct ?? player.killShare ?? player.killsContributionPct ?? 0);
    sixthLabel = 'KILL SHARE';
    sixthValue = pct > 0 ? `${pct.toFixed(1)}%` : '—';
  } else if (statsLevel === 'tournament') {
    totalKills = Number(player.totalKills ?? 0);
    matchesPlayed = Number(player.totalMatches ?? 0);
    killsPerMatch = Number(player.kpm ?? player.killsPerMatch ?? player.analytics?.KPM ?? 0);
    avgDamage = Number(player.dpm ?? player.avgDamage ?? player.analytics?.DPM ?? 0);
    avgAccuracy = Number(player.avgAccuracy ?? career.avgAccuracy ?? 0);
    const pct = Number(
      player.killShare ??
      player.killsContributionPct ??
      player.analytics?.killShare ??
      player.analytics?.killContribution ??
      player.analytics?.killPct ??
      0
    );
    sixthLabel = 'KILL SHARE';
    sixthValue = pct > 0 ? `${pct.toFixed(1)}%` : '—';
  } else {
    // Career
    totalKills = Number(player.totalKills ?? player.careerKills ?? career.careerKills ?? 0);
    matchesPlayed = Number(player.totalMatches ?? player.careerMatches ?? career.careerMatches ?? 0);
    killsPerMatch = Number(player.kpm ?? career.avgKills ?? career.avgKillsPerMatch ?? 0);
    avgDamage = Number(player.dpm ?? career.avgDamage ?? career.avgDamagePerMatch ?? 0);
    avgAccuracy = Number(player.avgAccuracy ?? career.avgAccuracy ?? 0);
    const kpe = Number(player.killsPerEvent ?? 0);
    sixthLabel = 'KILLS / EVENT';
    sixthValue = kpe > 0 ? kpe.toFixed(1) : '—';
  }

  const fmt = (n: number, decimals = 2) =>
    n > 0 ? (decimals === 0 ? Math.round(n).toLocaleString() : n.toFixed(decimals)) : '—';

  const stats = [
    { label: 'TOTAL KILLS', value: totalKills > 0 ? Math.round(totalKills).toLocaleString() : '—', highlight: true },
    { label: 'MATCHES PLAYED', value: matchesPlayed > 0 ? String(matchesPlayed) : '—', highlight: false },
    { label: 'KILLS / MATCH', value: fmt(killsPerMatch, 2), highlight: false },
    { label: 'AVG DAMAGE', value: avgDamage > 0 ? Math.round(avgDamage).toLocaleString() : '—', highlight: false },
    { label: 'AVG ACCURACY', value: avgAccuracy > 0 ? `${avgAccuracy.toFixed(1)}%` : '—', highlight: false },
    { label: sixthLabel, value: sixthValue, highlight: false },
  ];

  // ── Background ────────────────────────────────────────────────────────────────
  const canvaBg = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;
  const bgBase = isLight ? '#F2F4F8' : '#080A0F';
  const textPrimary = isLight ? '#0F0F1A' : '#FFFFFF';
  const textMuted = isLight ? '#55557A' : 'rgba(255,255,255,0.5)';

  // ── Logos ─────────────────────────────────────────────────────────────────────
  const mainLogo = brandingLogoUrl || '';
  const partnerLogo = tournamentLogos?.[0]?.logoUrl || '';

  return (
    <div
      style={{
        width: '434px',
        height: '724px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: bgBase,
        fontFamily: '"Inter", sans-serif',
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`,
        }}
      />

      {/* ── BACKGROUND ─────────────────────────────────────────────────────── */}
      {isCustom && customBackgroundUrl && !canvaBg ? (
        <img
          src={customBackgroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
      ) : isCustom && canvaBg ? (
        <iframe
          src={canvaBg}
          scrolling="no"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 0, pointerEvents: 'none' }}
        />
      ) : isLight ? (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse at 50% 0%, #EAECF5 0%, #F4F6FA 60%, #FAFBFD 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.055, backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '260px', background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.1)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 50% 20%, #10131C 0%, #080A0F 55%, #030407 100%)' }}>
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px)`, backgroundSize: '22px 22px' }} />
          {/* Diagonal streak */}
          <div style={{ position: 'absolute', top: '-10%', right: '-45%', width: '180%', height: '130%', background: `linear-gradient(135deg, transparent 46%, ${hexToRgba(accent, 0.06)} 49%, ${hexToRgba(accent, 0.15)} 50%, ${hexToRgba(accent, 0.05)} 51%, transparent 54%)`, transform: 'rotate(-12deg)', filter: 'blur(2px)', pointerEvents: 'none' }} />
          {/* Top glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '280px', background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.13)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          {/* Bottom glow */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '340px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(accent, 0.07)} 0%, transparent 70%)`, filter: 'blur(24px)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: '22px 20px 16px 20px',
        }}
      >
        {/* ── TITLE BAR ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: accent,
              fontFamily: '"Inter", sans-serif',
              textShadow: `0 0 10px ${hexToRgba(accent, 0.4)}`,
            }}
          >
            {graphicTitle}
          </span>

          {/* Level badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '20px',
              backgroundColor: hexToRgba(accent, 0.12),
              border: `1px solid ${hexToRgba(accent, 0.45)}`,
              boxShadow: `0 0 8px ${hexToRgba(accent, 0.2)}`,
            }}
          >
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: accent,
                boxShadow: `0 0 5px ${accent}`,
              }}
            />
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: accent,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {levelLabel}
            </span>
          </div>
        </div>

        {/* ── PLAYER IDENTITY ─────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* Avatar ring */}
          <div
            style={{
              padding: '3px',
              borderRadius: '50%',
              background: `conic-gradient(${accent} 0deg, ${hexToRgba(accent, 0.15)} 220deg, ${accent} 360deg)`,
              boxShadow: `0 0 24px ${hexToRgba(accent, 0.3)}, 0 0 60px ${hexToRgba(accent, 0.1)}`,
            }}
          >
            <div
              style={{
                padding: '2px',
                borderRadius: '50%',
                backgroundColor: bgBase,
              }}
            >
              <PlayerAvatar
                photoUrl={photoUrl}
                name={professionalName}
                size={112}
                accent={accent}
              />
            </div>
          </div>

          {/* Name + team + country */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: isLight ? '#0F0F1A' : '#FFFFFF',
                fontFamily: '"Inter", sans-serif',
                textShadow: isLight ? 'none' : `0 0 16px ${hexToRgba(accent, 0.35)}`,
                lineHeight: 1.1,
              }}
            >
              {professionalName}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 700,
                color: textMuted,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: accent }}>{teamName}</span>
              {countryCode && (
                <>
                  <span style={{ color: hexToRgba(accent, 0.4) }}>•</span>
                  <span>{country}</span>
                </>
              )}
            </div>
          </div>

          {/* Accent divider */}
          <div
            style={{
              width: '60px',
              height: '2px',
              borderRadius: '1px',
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 8px ${hexToRgba(accent, 0.5)}`,
            }}
          />
        </div>

        {/* ── 6 STAT CARDS (2×3 grid) ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            flex: 1,
          }}
        >
          {stats.map((s, i) => (
            <StatCard
              key={i}
              label={s.label}
              value={s.value}
              accent={accent}
              isHighlight={s.highlight}
            />
          ))}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mainLogo && (
              <img
                src={mainLogo}
                alt=""
                style={{ maxHeight: '28px', maxWidth: '72px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
              />
            )}
            {partnerLogo && (
              <img
                src={partnerLogo}
                alt=""
                style={{ maxHeight: '24px', maxWidth: '60px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
              />
            )}
          </div>

          {/* Stats stamp */}
          {showStatsStamp && (
            <span
              style={{
                fontSize: '7.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: hexToRgba(accent, 0.5),
              }}
            >
              Stats by Heaven
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
