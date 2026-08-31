'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getBuiltInTemplate, OverlayTemplate, StudioLiveState } from '@/lib/db';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';

// Template component imports
import { TopStandings } from '@/components/templates/TopStandings';
import { DailyStandings } from '@/components/templates/DailyStandings';
import { HeadToHead } from '@/components/templates/HeadToHead';
import { TeamProfile } from '@/components/templates/TeamProfile';
import { PlayerProfile } from '@/components/templates/PlayerProfile';
import { CustomMedia } from '@/components/templates/CustomMedia';
import { OverallRankingsDualColumn } from '@/components/templates/OverallRankingsDualColumn';
import { Top5Overall } from '@/components/templates/Top5Overall';
import { HybridEraTop5 } from '@/components/templates/HybridEraTop5';
import { Top5Graphic } from '@/components/templates/Top5Graphic';
import { TeamRosterKillsGraphic } from '@/components/templates/TeamRosterKillsGraphic';
import { FlexibleTop5Graphic } from '@/components/templates/FlexibleTop5Graphic';
import { MatchSummary } from '@/components/templates/MatchSummary';
import { PmncTop15Standings } from '@/components/templates/PmncTop15Standings';
import { MglYtLivestanding } from '@/components/templates/MglYtLivestanding';

export const templateComponentMap: Record<string, React.ComponentType<any>> = {
  top_standings: TopStandings,
  overall_rankings_dual_column: OverallRankingsDualColumn,
  top_5_overall: Top5Overall,
  hybrid_era_top5: HybridEraTop5,
  top5_graphic: Top5Graphic,
  daily_standings: DailyStandings,
  head_to_head: HeadToHead,
  team_profile: TeamProfile,
  player_profile: PlayerProfile,
  custom_media: CustomMedia,
  team_roster_kills: TeamRosterKillsGraphic,
  flexible_top5: FlexibleTop5Graphic,
  pmnc_top15_standings: PmncTop15Standings,
  mgl_yt_livestanding: MglYtLivestanding,
  match_summary: MatchSummary,
};

interface LiveOverlayRendererProps {
  liveState: StudioLiveState | null;
  loading?: boolean;
}

export function LiveOverlayRenderer({ liveState, loading = false }: LiveOverlayRendererProps) {
  const [template, setTemplate] = useState<OverlayTemplate | null>(null);
  const [scale, setScale] = useState(1);

  // ── Auto-scale to window dimensions (OBS Browser Source) ──────────────────
  useEffect(() => {
    function handleResize() {
      const isMgl = template?.templateType === 'mgl_yt_livestanding';
      const targetW = isMgl ? 713 : 1920;
      const targetH = isMgl ? 2048 : 1080;
      const s = Math.min(window.innerWidth / targetW, window.innerHeight / targetH);
      setScale(s);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [template?.templateType]);

  // ── Real-time template configuration listener ────────────────────────────
  useEffect(() => {
    document.body.classList.add('broadcast-render');

    if (!liveState?.templateId) {
      setTemplate(null);
      return;
    }

    const templateId = liveState.templateId;
    const builtIn = getBuiltInTemplate(templateId);
    if (builtIn) {
      setTemplate(builtIn);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'overlayTemplates', templateId),
      (snap) => {
        if (snap.exists()) {
          setTemplate({ id: snap.id, ...snap.data() } as OverlayTemplate);
        } else {
          setTemplate(null);
        }
      },
      (err) => {
        console.error('LiveOverlayRenderer template listener error:', err);
      }
    );

    return () => unsub();
  }, [liveState?.templateId]);

  if (loading) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  if (!liveState?.templateId || !template) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const Component = templateComponentMap[template.templateType];
  if (!Component) {
    return <div style={{ width: '100vw', height: '100vh', background: 'transparent' }} />;
  }

  const isMgl = template.templateType === 'mgl_yt_livestanding';
  const width = isMgl ? 713 : 1920;
  const height = isMgl ? 2048 : 1080;

  return (
    <>
      <style>{`
        ${googleFontsLink(template.styleConfig)}
        ${cssVarsForTheme(template.styleConfig)}
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
          }}
        >
          <Component
            data={liveState.fields}
            styleConfig={template.styleConfig}
            isPreview={false}
          />
        </div>
      </div>
    </>
  );
}
