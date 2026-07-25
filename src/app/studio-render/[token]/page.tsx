'use client';

import { useEffect, useState, use } from 'react';
import { getStudioProjectByToken, getTemplate, StudioProject, OverlayTemplate, StudioLiveState } from '@/lib/db';
import { db } from '@/lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { getStudioLiveDocRef } from '@/lib/db';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';

// Template components
import { TopStandings } from '@/components/templates/TopStandings';
import { DailyStandings } from '@/components/templates/DailyStandings';
import { HeadToHead } from '@/components/templates/HeadToHead';
import { TeamProfile } from '@/components/templates/TeamProfile';
import { PlayerProfile } from '@/components/templates/PlayerProfile';
import { CustomMedia } from '@/components/templates/CustomMedia';
import { OverallRankingsDualColumn } from '@/components/templates/OverallRankingsDualColumn';
import { Top5Overall } from '@/components/templates/Top5Overall';
import { HybridEraTop5 } from '@/components/templates/HybridEraTop5';

const templateMap: Record<string, React.ComponentType<any>> = {
  top_standings: TopStandings,
  overall_rankings_dual_column: OverallRankingsDualColumn,
  top_5_overall: Top5Overall,
  hybrid_era_top5: HybridEraTop5,
  daily_standings: DailyStandings,
  head_to_head: HeadToHead,
  team_profile: TeamProfile,
  player_profile: PlayerProfile,
  custom_media: CustomMedia,
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function StudioRenderPage({ params }: PageProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [liveState, setLiveState] = useState<StudioLiveState | null>(null);
  const [template, setTemplate] = useState<OverlayTemplate | null>(null);
  const [scale, setScale] = useState(1);

  // ── Scale to window (OBS Browser Source) ──────────────────────────────────
  useEffect(() => {
    function handleResize() {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(s);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Bootstrap: look up project by source-link token ───────────────────────
  useEffect(() => {
    document.body.classList.add('broadcast-render');

    let unsubLive = () => {};
    let unsubTemplate = () => {};

    async function init() {
      try {
        const proj = await getStudioProjectByToken(token);
        if (!proj) {
          setLoading(false);
          return;
        }
        setProject(proj);

        // Helper: start / restart template listener
        const startTemplateListener = (templateId: string) => {
          unsubTemplate();
          unsubTemplate = onSnapshot(
            doc(db, 'overlayTemplates', templateId),
            (snap: any) => {
              if (snap.exists()) {
                setTemplate({ id: snap.id, ...snap.data() } as OverlayTemplate);
              } else {
                setTemplate(null);
              }
            }
          );
        };

        // Listen to studioProjects/{id}/live/current
        const liveRef = getStudioLiveDocRef(proj.id!);
        unsubLive = onSnapshot(liveRef, (snap) => {
          if (snap.exists()) {
            const state = snap.data() as StudioLiveState;
            setLiveState(state);
            if (state.templateId) {
              startTemplateListener(state.templateId);
            } else {
              unsubTemplate();
              setTemplate(null);
            }
          } else {
            setLiveState(null);
            unsubTemplate();
            setTemplate(null);
          }
        });
      } catch (err) {
        console.error('StudioRenderPage init error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      document.body.classList.remove('broadcast-render');
      unsubLive();
      unsubTemplate();
    };
  }, [token]);

  if (loading) return null;
  if (!project) return <div style={{ color: 'transparent' }} />;

  const TemplateComponent = template ? templateMap[template.templateType] : null;
  const fields = liveState?.fields || {};
  const isVisible = Boolean(template && TemplateComponent);

  return (
    <div
      className="broadcast-stage-wrapper"
      style={{ width: '100vw', height: '100vh', backgroundColor: 'transparent', overflow: 'hidden', position: 'relative' }}
    >
      <div
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: isVisible ? 1 : 0,
          // Same transition as Live Slot render page for consistent on-air feel
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {template && TemplateComponent && (
          <>
            <style
              dangerouslySetInnerHTML={{
                __html: `${googleFontsLink(template.styleConfig)}\n${cssVarsForTheme(template.styleConfig)}`,
              }}
            />
            <TemplateComponent data={fields} styleConfig={template.styleConfig} />
          </>
        )}
      </div>
    </div>
  );
}
