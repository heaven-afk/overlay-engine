'use client';

import { useEffect, useState, use } from 'react';
import { getStudioProjectByToken, StudioProject, StudioLiveState, getStudioLiveDocRef } from '@/lib/db';
import { onSnapshot, getDoc } from 'firebase/firestore';
import { LiveOverlayRenderer } from '@/components/overlay/LiveOverlayRenderer';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function StudioRenderPage({ params }: PageProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [, setProject] = useState<StudioProject | null>(null);
  const [liveState, setLiveState] = useState<StudioLiveState | null>(null);

  useEffect(() => {
    let unsubLive = () => {};

    async function init() {
      try {
        const projectId = token;

        const attachLiveListener = (pId: string) => {
          const liveRef = getStudioLiveDocRef(pId);
          unsubLive = onSnapshot(
            liveRef,
            (snap) => {
              if (snap.exists()) {
                setLiveState(snap.data() as StudioLiveState);
              } else {
                setLiveState(null);
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
      unsubLive();
    };
  }, [token]);

  return <LiveOverlayRenderer liveState={liveState} loading={loading} />;
}
