import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
  addDoc,
  getDoc,
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const now = Timestamp.now();
    
    // Query all scheduled pushes across slots where status == 'pending'
    const snap = await getDocs(
      query(
        collectionGroup(db, 'scheduledPushes'),
        where('status', '==', 'pending')
      )
    );

    if (snap.empty) {
      return NextResponse.json({ processedCount: 0, message: 'No pending scheduled pushes.' });
    }

    let processedCount = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const scheduledAt: Timestamp = data.scheduledAt;

      // Check if due
      if (scheduledAt && scheduledAt.toMillis() <= now.toMillis()) {
        const slotRef = d.ref.parent.parent;
        if (!slotRef) continue;

        const slotSnap = await getDoc(slotRef);
        if (!slotSnap.exists()) continue;

        const snapshot = data.snapshot;
        const pushedBy = `Scheduled Push (${data.createdByEmail || data.createdBy || 'server'})`;

        const publishedState = {
          ...snapshot,
          pushedBy,
          pushedAt: now,
        };

        // 1. Publish to live slot
        await updateDoc(slotRef, {
          published: publishedState,
          updatedAt: now,
          assignedTemplateId: publishedState.templateId,
          currentData: publishedState.fields?.currentData ?? publishedState.fields,
        });

        // 2. Add to push history
        await addDoc(collection(slotRef, 'pushHistory'), {
          pushedAt: now,
          pushedBy: data.createdBy || 'cron',
          pushedByEmail: data.createdByEmail || 'scheduled-cron',
          snapshot: publishedState,
        });

        // 3. Mark scheduled push as completed
        await updateDoc(d.ref, { status: 'completed' });
        processedCount++;
      }
    }

    return NextResponse.json({ processedCount, message: `Successfully processed ${processedCount} scheduled pushes.` });
  } catch (err: any) {
    console.error('Error processing scheduled pushes:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process scheduled pushes' }, { status: 500 });
  }
}
