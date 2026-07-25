import { rtdb } from './firebase';
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
} from 'firebase/database';

export interface PresenceUser {
  userId: string;
  name: string;
  email: string;
  editingField: string | null;
  lastSeen: number;
}

/**
 * Register user presence in RTDB for a given slot.
 * Automatically cleans up upon tab close or network disconnect via onDisconnect().
 */
export function trackPresence(
  slotId: string,
  user: { uid: string; email: string },
  editingField: string | null = null
): () => void {
  if (!slotId || !user?.uid) return () => {};

  const userPresenceRef = ref(rtdb, `presence/${slotId}/${user.uid}`);

  const presenceData = {
    userId: user.uid,
    name: user.email.split('@')[0] || 'User',
    email: user.email,
    editingField,
    lastSeen: serverTimestamp(),
  };

  // 1. Setup onDisconnect cleanup
  onDisconnect(userPresenceRef).remove();

  // 2. Set current online status
  set(userPresenceRef, presenceData).catch((err) => {
    console.error('Failed to set presence in RTDB:', err);
  });

  // Return cleanup handler
  return () => {
    set(userPresenceRef, null).catch(() => {});
  };
}

/**
 * Update the active editing field for the presence user.
 */
export function updateActiveField(
  slotId: string,
  userId: string,
  editingField: string | null
) {
  if (!slotId || !userId) return;
  const fieldRef = ref(rtdb, `presence/${slotId}/${userId}/editingField`);
  set(fieldRef, editingField).catch(() => {});
}

/**
 * Subscribe to real-time online members for a given slot.
 */
export function subscribeToSlotPresence(
  slotId: string,
  onUpdate: (members: PresenceUser[]) => void
): () => void {
  if (!slotId) return () => {};
  const slotPresenceRef = ref(rtdb, `presence/${slotId}`);

  const callback = (snapshot: any) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }
    const val = snapshot.val();
    const members: PresenceUser[] = Object.values(val || {});
    onUpdate(members);
  };

  onValue(slotPresenceRef, callback);

  return () => {
    off(slotPresenceRef, 'value', callback);
  };
}
