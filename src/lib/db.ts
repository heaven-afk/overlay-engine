import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

// ─── TYPES ───────────────────────────────────────────────────────────────────

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type TemplateType = 
  | 'top_standings'    // Top N teams standings table
  | 'head_to_head'     // Two teams/players side by side
  | 'team_profile'     // Single team full stat breakdown
  | 'player_profile';  // Single player stats

export type ColorTheme = 'dark' | 'light';

export interface TournamentLogoSlot {
  logoUrl: string;
  tournamentName: string;
}

export interface TemplateStyleConfig {
  // Theme
  colorTheme: ColorTheme;             // 'dark' | 'light'
  accentColor: string;                // hex, default '#C9A84C' (gold)

  // Typography
  headingFont: string;                // Google Font name, default 'Inter'
  bodyFont: string;                   // Google Font name, default 'Inter'

  // Branding
  brandingLogoUrl: string;            // uploaded once, appears on all templates (top-left)
  brandingName: string;               // e.g. "FABRIZIO MAYOWA / African CODM BR Coverage"
  showStatsStamp: boolean;            // "Stats by Heaven" watermark, default true

  // Tournament logos (1–3 slots, designer picks count)
  tournamentLogoCount: 1 | 2 | 3;    // how many tournament logo slots to show
  tournamentLogos: TournamentLogoSlot[]; // array of up to 3

  // Template-specific config
  topN: number;                       // for top_standings: how many rows to show (default 10)
  showColumns: string[];              // which stat columns to show (see column list below)
  graphicTitle: string;               // e.g. "OGR T1 COLLATION", "HEAD TO HEAD"
  graphicSubtitle: string;            // e.g. "Full standings — Top 13 · 2 Events Played"
}

export interface OverlayTemplate {
  id?: string;
  name: string;
  templateType: TemplateType;
  styleConfig: TemplateStyleConfig;
  createdAt?: any;
  updatedAt?: any;
}

export interface OverlaySlot {
  id?: string;
  name: string;
  slotType: 'single_team' | 'standings_table' | 'head_to_head' | 'player_card';
  assignedTemplateId: string | null;
  currentData: any | null;
  publicRenderToken: string;
  updatedAt?: any;
}

// ─── TOURNAMENTS & REGISTRY (READ-ONLY) ───────────────────────────────────────

export async function getTournaments() {
  try {
    const snap = await getDocs(collection(db, 'tournaments'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort in-memory to prevent missing 'createdAt' properties from filtering out documents in Firestore
    return list.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Failed to getTournaments:', err);
    return [];
  }
}

export async function getTournament(id: string) {
  try {
    const d = await getDoc(doc(db, 'tournaments', id));
    return d.exists() ? { id: d.id, ...d.data() } : null;
  } catch (err) {
    console.error(`Failed to getTournament for id ${id}:`, err);
    return null;
  }
}

export async function getTeams() {
  try {
    const snap = await getDocs(collection(db, 'teams'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a: any, b: any) => (a.teamName || '').localeCompare(b.teamName || ''));
  } catch (err) {
    console.error('Failed to getTeams:', err);
    return [];
  }
}

// ─── TEMPLATES CRUD (overlayTemplates) ───────────────────────────────────────

export async function getTemplates(): Promise<OverlayTemplate[]> {
  try {
    const snap = await getDocs(collection(db, 'overlayTemplates'));
    if (snap.empty) {
      await seedDefaultTemplates();
      const freshSnap = await getDocs(collection(db, 'overlayTemplates'));
      return freshSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
  } catch (err) {
    console.error('Failed to getTemplates:', err);
    return [];
  }
}

export async function getTemplate(id: string): Promise<OverlayTemplate | null> {
  try {
    const d = await getDoc(doc(db, 'overlayTemplates', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as OverlayTemplate) : null;
  } catch (err) {
    console.error(`Failed to getTemplate ${id}:`, err);
    return null;
  }
}

export async function saveTemplate(template: Omit<OverlayTemplate, 'id'>, id?: string): Promise<string> {
  const data = {
    ...template,
    updatedAt: Timestamp.now(),
  };

  if (id) {
    await setDoc(doc(db, 'overlayTemplates', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'overlayTemplates'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return ref.id;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, 'overlayTemplates', id));
}

// ─── SLOTS CRUD (overlaySlots) ───────────────────────────────────────────────

export async function getSlots(): Promise<OverlaySlot[]> {
  try {
    const snap = await getDocs(collection(db, 'overlaySlots'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlaySlot));
  } catch (err) {
    console.error('Failed to getSlots:', err);
    return [];
  }
}

export async function getSlot(id: string): Promise<OverlaySlot | null> {
  try {
    const d = await getDoc(doc(db, 'overlaySlots', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as OverlaySlot) : null;
  } catch (err) {
    console.error(`Failed to getSlot ${id}:`, err);
    return null;
  }
}

export async function getSlotByToken(token: string): Promise<OverlaySlot | null> {
  try {
    const snap = await getDocs(
      query(collection(db, 'overlaySlots'), where('publicRenderToken', '==', token))
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as OverlaySlot;
  } catch (err) {
    console.error(`Failed to getSlotByToken ${token}:`, err);
    return null;
  }
}

export async function saveSlot(slot: Omit<OverlaySlot, 'id'>, id?: string): Promise<string> {
  const data = {
    ...slot,
    updatedAt: Timestamp.now(),
  };

  if (id) {
    await setDoc(doc(db, 'overlaySlots', id), data, { merge: true });
    return id;
  } else {
    const ref = await addDoc(collection(db, 'overlaySlots'), data);
    return ref.id;
  }
}

export async function deleteSlot(id: string): Promise<void> {
  await deleteDoc(doc(db, 'overlaySlots', id));
}

// ─── MOCK TEMPLATES SEEDING ──────────────────────────────────────────────────

async function seedDefaultTemplates() {
  const defaultStandingsTemplate: Omit<OverlayTemplate, 'id'> = {
    name: 'Default Top Standings',
    templateType: 'top_standings',
    styleConfig: {
      colorTheme: 'dark',
      accentColor: '#C9A84C',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      brandingLogoUrl: '',
      brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
      showStatsStamp: true,
      tournamentLogoCount: 1,
      tournamentLogos: [
        { logoUrl: '', tournamentName: 'Tournament Alpha' }
      ],
      topN: 10,
      showColumns: ['wins', 'matches', 'events', 'placePts', 'kills', 'totalPts', 'rating', 'ppm', 'kpm', 'killPct', 'avgPlace', 'top3Rate'],
      graphicTitle: 'OGR T1 COLLATION',
      graphicSubtitle: 'Full standings — Top 10 · 2 Events Played'
    }
  };

  try {
    await addDoc(collection(db, 'overlayTemplates'), { 
      ...defaultStandingsTemplate, 
      createdAt: Timestamp.now(), 
      updatedAt: Timestamp.now() 
    });
  } catch (err) {
    console.error('Failed to seed default templates:', err);
  }
}
