'use client';

import { useEffect, useState, use } from 'react';
import { getStudioProjectByToken, getTemplate, getBuiltInTemplate, StudioProject, OverlayTemplate, StudioLiveState } from '@/lib/db';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';
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
import { Top5Graphic } from '@/components/templates/Top5Graphic';
import { TeamRosterKillsGraphic } from '@/components/templates/TeamRosterKillsGraphic';
import { FlexibleTop5Graphic } from '@/components/templates/FlexibleTop5Graphic';
import { MatchSummary } from '@/components/templates/MatchSummary';
import { PmncTop15Standings } from '@/components/templates/PmncTop15Standings';

const templateMap: Record<string, React.ComponentType<any>> = {
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
  match_summary: MatchSummary,
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

  // ── Bootstrap: look up project & live state ───────────────────────────────
  useEffect(() => {
    document.body.classList.add('broadcast-render');

    let unsubLive = () => {};
    let unsubTemplate = () => {};

    async function init() {
      try {
        let projectId = token;

        // Helper: start / restart template listener
        const startTemplateListener = (templateId: string) => {
          unsubTemplate();
          const builtIn = getBuiltInTemplate(templateId);
          if (builtIn) {
            setTemplate(builtIn);
            return;
          }
          unsubTemplate = onSnapshot(
            doc(db, 'overlayTemplates', templateId),
            (snap: any) => {
              if (snap.exists()) {
                setTemplate({ id: snap.id, ...snap.data() } as OverlayTemplate);
              } else {
                setTemplate(null);
              }
            },
            (err) => {
              console.error('StudioRenderPage template listener error:', err);
            }
          );
        };

        // Helper: attach live listener for a given projectId
        const attachLiveListener = (pId: string) => {
          const liveRef = getStudioLiveDocRef(pId);
          unsubLive = onSnapshot(
            liveRef,
            (snap) => {
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
              setLoading(false);
            },
            (err) => {
              console.error('StudioRenderPage live listener error:', err);
              setLoading(false);
            }
          );
        };

        // 1. Direct resolution: check if token is already a valid projectId with a live doc
        const directLiveRef = getStudioLiveDocRef(projectId);
        const directSnap = await getDoc(directLiveRef).catch(() => null);

        if (directSnap && directSnap.exists()) {
          setProject({ id: projectId, name: 'Studio Room', ownerId: '', sourceLinkToken: token } as StudioProject);
          attachLiveListener(projectId);
        } else {
          // 2. Query resolution: lookup project by sourceLinkToken
          const proj = await getStudioProjectByToken(token);
          if (proj && proj.id) {
            setProject(proj);
            attachLiveListener(proj.id);
          } else {
            // Fallback: attach live listener directly on token
            setProject({ id: token, name: 'Studio Room', ownerId: '', sourceLinkToken: token } as StudioProject);
            attachLiveListener(token);
          }
        }
      } catch (err) {
        console.error('StudioRenderPage init error:', err);
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
