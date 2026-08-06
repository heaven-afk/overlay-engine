import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export interface OverlayStatePayload {
  updatedAt?: any;
  updatedBy?: string;
  activeTemplate?: 'team-roster-kills' | 'flexible-top5' | string;
  teamRosterKills?: {
    tournamentId: string;
    day: number;
    lobby: number;
    teamId: string;
  };
  flexibleTop5?: {
    tournamentId: string;
    page: number;
    showTitle: boolean;
  };
}

export function useOverlayState() {
  const [state, setState] = useState<OverlayStatePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'overlayState', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          setState(snapshot.data() as OverlayStatePayload);
        } else {
          setState(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to overlayState:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateState = async (payload: Partial<OverlayStatePayload>) => {
    try {
      await setDoc(
        doc(db, 'overlayState', 'current'),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error updating overlayState:', err);
      throw err;
    }
  };

  return { state, loading, updateState };
}
