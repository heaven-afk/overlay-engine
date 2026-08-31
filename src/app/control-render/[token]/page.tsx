'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { StudioLiveState } from '@/lib/db';
import { LiveOverlayRenderer } from '@/components/overlay/LiveOverlayRenderer';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ControlRenderPage({ params }: PageProps) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [liveState, setLiveState] = useState<StudioLiveState | null>(null);

  useEffect(() => {
    let unsub = () => {};

    async function init() {
      try {
        const sourcesRef = collection(db, 'controlRoom', 'main', 'sources');

        // First check if token directly matches a document ID
        const directRef = doc(db, 'controlRoom', 'main', 'sources', token);
        const directSnap = await getDoc(directRef).catch(() => null);

        if (directSnap && directSnap.exists()) {
          unsub = onSnapshot(
            directRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setLiveState((data.liveState as StudioLiveState) || null);
              } else {
                setLiveState(null);
              }
              setLoading(false);
            },
            (err) => {
              console.error('ControlRenderPage direct listener error:', err);
              setLoading(false);
            }
          );
          return;
        }

        // Query by renderToken
        const q = query(sourcesRef, where('renderToken', '==', token));
        unsub = onSnapshot(
          q,
          (snap) => {
            if (!snap.empty) {
              const docData = snap.docs[0].data();
              setLiveState((docData.liveState as StudioLiveState) || null);
            } else {
              setLiveState(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error('ControlRenderPage query listener error:', err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('ControlRenderPage init error:', err);
        setLoading(false);
      }
    }

    init();

    return () => {
      unsub();
    };
  }, [token]);

  return <LiveOverlayRenderer liveState={liveState} loading={loading} />;
}
