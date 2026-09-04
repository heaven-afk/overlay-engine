'use client';

import React from 'react';
import { TemplateStyleConfig } from '@/lib/db';
import { BrandingHeader, StatsStamp, SourceLine, getCanvaEmbedUrl } from './SharedElements';

interface PlayerStatsHorizontalProps {
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

// ── Player Photo / Avatar ──────────────────────────────────────────────────────
function PlayerPhoto({
  photoUrl,
  name,
  accent,
  height,
}: {
  photoUrl?: string | null;
  name?: string;
  accent: string;
  height: number;
}) {
  const isHttp = photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'));
  const initials = (name || '?')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase() || 'P1';

  if (isHttp) {
    const canvaUrl = getCanvaEmbedUrl(photoUrl);
    if (canvaUrl) {
      return (
        <iframe
          src={canvaUrl}
          scrolling="no"
          style={{
            width: '100%',
            height: `${height}px`,
            border: 'none',
            overflow: 'hidden',
            backgroundColor: hexToRgba(accent, 0.06),
            pointerEvents: 'none',
            display: 'block',
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
          width: '100%',
          height: `${height}px`,
          objectFit: 'cover',
          objectPosition: 'top center',
          display: 'block',
        }}
      />
    );
  }

  // Initials fallback — large cinematic placeholder
  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(ellipse at 50% 40%, ${hexToRgba(accent, 0.18)} 0%, rgba(0,0,0,0) 70%)`,
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Initials ring */}
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `conic-gradient(${accent} 0deg, ${hexToRgba(accent, 0.1)} 200deg, ${accent} 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 50px ${hexToRgba(accent, 0.25)}, 0 0 100px ${hexToRgba(accent, 0.1)}`,
          padding: '4px',
        }}
      >
        <div
          style={{
            width: '172px',
            height: '172px',
            borderRadius: '50%',
            background: 'rgba(8,10,15,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            fontWeight: 900,
            color: accent,
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
  isHighlight = false,
  isLight = false,
}: {
  label: string;
  value: string;
  accent: string;
  isHighlight?: boolean;
  isLight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderRadius: '14px',
        background: isHighlight
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.2)} 0%, rgba(255,255,255,0.04) 100%)`
          : isLight
          ? 'rgba(255,255,255,0.72)'
          : 'rgba(255,255,255,0.04)',
        border: isHighlight
          ? `1.5px solid ${hexToRgba(accent, 0.7)}`
          : isLight
          ? '1px solid rgba(0,0,0,0.08)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isHighlight
          ? `0 0 28px ${hexToRgba(accent, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '110px',
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
          background: isHighlight
            ? `linear-gradient(90deg, transparent, ${hexToRgba(accent, 0.5)}, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
      />
      {/* Highlight corner glow */}
      {isHighlight && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60px',
            height: '60px',
            background: `radial-gradient(circle at top right, ${hexToRgba(accent, 0.25)}, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <span
        style={{
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isHighlight ? accent : isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
          fontFamily: '"Inter", sans-serif',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '44px',
          fontWeight: 900,
          color: isHighlight ? '#ffffff' : accent,
          fontFamily: '"Inter", sans-serif',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginTop: '12px',
          textShadow: isHighlight ? `0 0 28px ${hexToRgba(accent, 0.5)}` : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Template ──────────────────────────────────────────────────────────────
export const PlayerStatsHorizontal: React.FC<PlayerStatsHorizontalProps> = ({
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
    showStatsStamp = true,
    graphicTitle = 'PLAYER STATS',
  } = styleConfig;

  const accent = accentColor || '#C9A84C';
  const isLight = colorTheme === 'light';
  const isCustom = colorTheme === 'custom';

  // ── Data extraction ──────────────────────────────────────────────────────────
  const player = data?.player || data?.profile || data || {};
  const career = player.careerStats || data?.careerStats || {};

  // Stats level
  const statsLevel: 'career' | 'tournament' | 'daily' =
    data?.statsLevel || (player.scope === 'career' ? 'career' : 'tournament');

  const selectedDayNum = data?.selectedDay ? Number(data.selectedDay) : null;
  const dayHistory: any[] = Array.isArray(player.dayHistory) ? player.dayHistory : [];
  const dayData = selectedDayNum
    ? dayHistory.find((d: any) => d.dayNum === selectedDayNum) ?? dayHistory[dayHistory.length - 1] ?? null
    : null;

  // ── Identity ─────────────────────────────────────────────────────────────────
  const professionalName =
    player.professionalName || player.playerName || player.ign || 'PRO PLAYER';
  const teamName = player.teamName || career.teamName || 'NO TEAM';
  const country = player.country || 'N/A';
  const photoUrl = player.photoUrl || null;

  // ── Level badge ───────────────────────────────────────────────────────────────
  const levelLabel =
    statsLevel === 'career'
      ? 'CAREER STATS'
      : statsLevel === 'daily'
      ? selectedDayNum
        ? `DAY ${selectedDayNum} STATS`
        : 'DAILY STATS'
      : player.tournamentName
      ? `${player.tournamentName.toUpperCase()} STATS`
      : 'TOURNAMENT STATS';

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
    const pct = Number(player.killsContributionPct ?? 0);
    sixthLabel = 'KILLS CONTRIB %';
    sixthValue = pct > 0 ? `${pct.toFixed(1)}%` : '—';
  } else if (statsLevel === 'tournament') {
    totalKills = Number(player.totalKills ?? 0);
    matchesPlayed = Number(player.totalMatches ?? 0);
    killsPerMatch = Number(player.kpm ?? player.killsPerMatch ?? player.analytics?.KPM ?? 0);
    avgDamage = Number(player.dpm ?? player.avgDamage ?? player.analytics?.DPM ?? 0);
    avgAccuracy = Number(player.avgAccuracy ?? career.avgAccuracy ?? 0);
    const pct = Number(player.killsContributionPct ?? 0);
    sixthLabel = 'KILLS CONTRIB %';
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

  const stats = [
    { label: 'TOTAL KILLS', value: totalKills > 0 ? Math.round(totalKills).toLocaleString() : '—', highlight: true },
    { label: 'MATCHES PLAYED', value: matchesPlayed > 0 ? String(matchesPlayed) : '—', highlight: false },
    { label: 'KILLS / MATCH', value: killsPerMatch > 0 ? killsPerMatch.toFixed(2) : '—', highlight: false },
    { label: 'AVG DAMAGE', value: avgDamage > 0 ? Math.round(avgDamage).toLocaleString() : '—', highlight: false },
    { label: 'AVG ACCURACY', value: avgAccuracy > 0 ? `${avgAccuracy.toFixed(1)}%` : '—', highlight: false },
    { label: sixthLabel, value: sixthValue, highlight: false },
  ];

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const canvaBgUrl = isCustom && customBackgroundUrl ? getCanvaEmbedUrl(customBackgroundUrl) : null;
  const bgPrimary = isLight ? '#F2F4F8' : '#080A0F';
  const textPrimary = isLight ? '#0F0F1A' : '#FFFFFF';
  const textMuted = isLight ? '#55557A' : 'rgba(255,255,255,0.5)';

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: bgPrimary,
        backgroundImage: isCustom && customBackgroundUrl && !canvaBgUrl
          ? `url(${customBackgroundUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textPrimary,
        fontFamily: '"Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`,
        }}
      />

      {/* Custom background canvas iframe */}
      {canvaBgUrl && (
        <iframe
          src={canvaBgUrl}
          scrolling="no"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 0, pointerEvents: 'none' }}
        />
      )}
      {isCustom && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 0 }} />
      )}

      {/* Dark theme background layers */}
      {!isCustom && !isLight && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 65% 50%, #10131C 0%, #080A0F 60%, #030407 100%)' }} />
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
          {/* Right-side accent glow */}
          <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(accent, 0.06)} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
          {/* Top accent sweep */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '300px', background: `linear-gradient(180deg, ${hexToRgba(accent, 0.05)} 0%, transparent 100%)`, pointerEvents: 'none' }} />
        </div>
      )}
      {!isCustom && isLight && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 65% 50%, #EAECF5 0%, #F4F6FA 60%, #FAFBFD 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(${hexToRgba(accent, 1)} 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
        </div>
      )}

      {/* ── CONTENT WRAPPER ───────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <BrandingHeader styleConfig={styleConfig} />

        {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* ── LEFT: Player Face Card ──────────────────────────────────── */}
          <div
            style={{
              width: '520px',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Photo fills the panel */}
            <PlayerPhoto
              photoUrl={photoUrl}
              name={professionalName}
              accent={accent}
              height={960}
            />

            {/* Gradient overlay — fades photo into background on right edge */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent 55%, ${bgPrimary} 100%)`,
                pointerEvents: 'none',
              }}
            />
            {/* Bottom overlay for identity block */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '280px',
                background: `linear-gradient(0deg, ${isLight ? 'rgba(242,244,248,0.98)' : 'rgba(8,10,15,0.95)'} 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Identity block overlaid at bottom of photo */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0 36px 28px 36px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Accent bar */}
              <div
                style={{
                  width: '44px',
                  height: '3px',
                  borderRadius: '2px',
                  background: accent,
                  boxShadow: `0 0 10px ${hexToRgba(accent, 0.6)}`,
                  marginBottom: '4px',
                }}
              />

              <h1
                style={{
                  margin: 0,
                  fontSize: '36px',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: isLight ? '#0F0F1A' : '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: 1.05,
                  textShadow: isLight ? 'none' : `0 2px 16px rgba(0,0,0,0.8), 0 0 20px ${hexToRgba(accent, 0.2)}`,
                }}
              >
                {professionalName}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ color: accent }}>{teamName}</span>
                <span style={{ color: hexToRgba(accent, 0.4) }}>•</span>
                <span style={{ color: textMuted }}>{country}</span>
              </div>
            </div>

            {/* Left edge accent bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '10%',
                bottom: '10%',
                width: '3px',
                background: `linear-gradient(180deg, transparent, ${accent}, transparent)`,
                boxShadow: `0 0 12px ${hexToRgba(accent, 0.5)}`,
              }}
            />
          </div>

          {/* ── RIGHT: Stats Panel ──────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '32px 60px 32px 48px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '28px',
                paddingBottom: '20px',
                borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: accent,
                    fontFamily: '"Inter", sans-serif',
                    textShadow: `0 0 14px ${hexToRgba(accent, 0.4)}`,
                  }}
                >
                  {graphicTitle}
                </span>
              </div>

              {/* Level badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 16px',
                  borderRadius: '24px',
                  backgroundColor: hexToRgba(accent, 0.1),
                  border: `1px solid ${hexToRgba(accent, 0.4)}`,
                  boxShadow: `0 0 16px ${hexToRgba(accent, 0.15)}`,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: accent,
                    boxShadow: `0 0 8px ${accent}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: accent,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {levelLabel}
                </span>
              </div>
            </div>

            {/* 6 stat cards — 3×2 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '16px',
                flex: 1,
                alignContent: 'stretch',
              }}
            >
              {stats.map((s, i) => (
                <StatCard
                  key={i}
                  label={s.label}
                  value={s.value}
                  accent={accent}
                  isHighlight={s.highlight}
                  isLight={isLight}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SourceLine styleConfig={styleConfig} />
      <StatsStamp show={showStatsStamp} />
    </div>
  );
};
