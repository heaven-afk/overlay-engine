'use client';

import { useEffect, useState, use } from 'react';
import { getSlotByToken, getTemplate, OverlaySlot, OverlayTemplate, normalizeSlot } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';

// Import templates
import { TopStandings } from '@/components/templates/TopStandings';
import { DailyStandings } from '@/components/templates/DailyStandings';
import { HeadToHead } from '@/components/templates/HeadToHead';
import { TeamProfile } from '@/components/templates/TeamProfile';
import { PlayerProfile } from '@/components/templates/PlayerProfile';

const templateMap = {
  top_standings: TopStandings,
  daily_standings: DailyStandings,
  head_to_head: HeadToHead,
  team_profile: TeamProfile,
  player_profile: PlayerProfile,
};

interface PageProps {
  params: Promise<{ publicRenderToken: string }>;
}

export default function PublicRenderPage({ params }: PageProps) {
  const { publicRenderToken } = use(params);

  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<OverlaySlot | null>(null);
  const [template, setTemplate] = useState<OverlayTemplate | null>(null);
  const [scale, setScale] = useState(1);

  // ─── Scale listener for OBS scaling ──────────────────────────────────────
  useEffect(() => {
    function handleResize() {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(s);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Real-time Firestore listener ─────────────────────────────────────────
  useEffect(() => {
    document.body.classList.add('broadcast-render');

    let unsubscribeSlot = () => {};

    async function initListener() {
      try {
        const s = await getSlotByToken(publicRenderToken);
        if (!s) {
          setLoading(false);
          return;
        }
        setSlot(s);

        if (s.assignedTemplateId) {
          const t = await getTemplate(s.assignedTemplateId);
          setTemplate(t);
        }

        unsubscribeSlot = onSnapshot(doc(db, 'overlaySlots', s.id!), async (snapshot) => {
          if (snapshot.exists()) {
            const data = normalizeSlot(snapshot.id, snapshot.data());
            setSlot(data);

            if (data.assignedTemplateId) {
              const t = await getTemplate(data.assignedTemplateId);
              setTemplate(t);
            } else {
              setTemplate(null);
            }
          }
        });
      } catch (err) {
        console.error('Error starting overlay listener:', err);
      } finally {
        setLoading(false);
      }
    }

    initListener();

    return () => {
      document.body.classList.remove('broadcast-render');
      unsubscribeSlot();
    };
  }, [publicRenderToken]);

  if (loading) return null;
  if (!slot || !template) return <div style={{ color: 'transparent' }} />; // Blank transparent render if unconfigured

  const TemplateComponent = templateMap[template.templateType];
  if (!TemplateComponent) {
    return (
      <div style={{
        color: '#f87171',
        padding: '24px',
        backgroundColor: '#13131a',
        fontFamily: 'sans-serif',
        fontSize: '14px',
      }}>
        Incompatible template type: {template.templateType || 'Legacy template. Please configure a new one.'}
      </div>
    );
  }

  return (
    <div className="broadcast-stage-wrapper" style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: 'transparent', // preserves OBS transparent capture
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `${googleFontsLink(template.styleConfig)}\n${cssVarsForTheme(template.styleConfig)}` }} />
        <TemplateComponent
          data={slot.currentData || {}}
          styleConfig={template.styleConfig}
        />
      </div>
    </div>
  );
}
