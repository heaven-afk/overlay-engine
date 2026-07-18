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
  | 'daily_standings'   // NEW
  | 'head_to_head'     // Two teams/players side by side
  | 'team_profile'     // Single team full stat breakdown
  | 'player_profile'   // Single player stats
  | 'custom_media'     // NEW: Media-based Custom Template
  | 'overall_rankings_dual_column' // NEW: Overall rankings in a dual column format
  | 'top_5_overall';   // NEW: Top 5 overall standings formatted like daily standings

export type ColorTheme = 'dark' | 'light' | 'custom';

export interface TournamentLogoSlot {
  logoUrl: string;
  tournamentName: string;
}

export interface TemplateStyleConfig {
  // Theme
  colorTheme: ColorTheme;             // 'dark' | 'light' | 'custom'
  accentColor: string;                // hex, default '#C9A84C' (gold)
  customBackgroundUrl?: string;       // image URL for 'custom' theme (upload or paste)

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

  // Daily standings specific
  dailyStandingsDay?: number;           // which day to show
  dailyStandingsLobby?: number | null;  // null = all lobbies that day, number = specific lobby
  dailyStandingsMode?: 'full_day' | 'single_lobby'; // toggle between modes
  dailyPointsColumn?: 'totalPts' | 'kills' | 'placementPts'; // which value to show in Points column
  
  // Custom Media template specific
  customMediaUrl?: string;            // URL or base64 of custom uploaded video/gif/image
  customMediaType?: 'image' | 'video' | 'gif'; // type of custom media
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
  dataShapeType: TemplateType;        // what KIND of data this slot currently holds
  assignedTemplateId: string | null;  // which visual template renders it (independent of data shape)
  currentData: any | null;
  publicRenderToken: string;
  updatedAt?: any;
  slotType?: any;                     // keeping for fallback/migration purposes
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
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    
    // Ensure exactly 2 custom_media templates exist
    const customMediaTemplates = list.filter((t) => t.templateType === 'custom_media');
    if (customMediaTemplates.length < 2) {
      await seedCustomMediaTemplates(2 - customMediaTemplates.length);
      const freshSnap = await getDocs(collection(db, 'overlayTemplates'));
      list = freshSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    }
    
    return list;
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
  const t = await getTemplate(id);
  if (t && t.templateType === 'custom_media') {
    throw new Error('Custom Media templates cannot be deleted.');
  }
  await deleteDoc(doc(db, 'overlayTemplates', id));
}

// ─── SLOTS CRUD (overlaySlots) ───────────────────────────────────────────────

export function normalizeSlot(id: string, data: any): OverlaySlot {
  let dataShapeType = data.dataShapeType;
  if (!dataShapeType) {
    const st = data.slotType;
    if (st === 'standings_table' || st === 'single_team') {
      dataShapeType = 'top_standings';
    } else if (st === 'head_to_head') {
      dataShapeType = 'head_to_head';
    } else if (st === 'player_card') {
      dataShapeType = 'player_profile';
    } else {
      dataShapeType = 'top_standings';
    }
  }
  return {
    id,
    name: data.name,
    dataShapeType,
    assignedTemplateId: data.assignedTemplateId,
    currentData: data.currentData,
    publicRenderToken: data.publicRenderToken,
    updatedAt: data.updatedAt,
    slotType: data.slotType || (dataShapeType === 'top_standings' ? 'standings_table' : dataShapeType === 'head_to_head' ? 'head_to_head' : 'player_card'),
  };
}

export async function getSlots(): Promise<OverlaySlot[]> {
  try {
    const snap = await getDocs(collection(db, 'overlaySlots'));
    return snap.docs.map((d) => normalizeSlot(d.id, d.data()));
  } catch (err) {
    console.error('Failed to getSlots:', err);
    return [];
  }
}

export async function getSlot(id: string): Promise<OverlaySlot | null> {
  try {
    const d = await getDoc(doc(db, 'overlaySlots', id));
    return d.exists() ? normalizeSlot(d.id, d.data()) : null;
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
    return normalizeSlot(d.id, d.data());
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

async function seedCustomMediaTemplates(countNeeded: number) {
  for (let i = 0; i < countNeeded; i++) {
    const defaultCustomMedia: Omit<OverlayTemplate, 'id'> = {
      name: `Custom Media Slot ${i + 1}`,
      templateType: 'custom_media',
      styleConfig: {
        colorTheme: 'custom',
        accentColor: '#d946ef', // premium purple/pink accent
        headingFont: 'Outfit',
        bodyFont: 'Outfit',
        brandingLogoUrl: '',
        brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
        showStatsStamp: false,
        tournamentLogoCount: 1,
        tournamentLogos: [
          { logoUrl: '', tournamentName: '' }
        ],
        topN: 1,
        showColumns: [],
        graphicTitle: 'LIVE MEDIA BROADCAST',
        graphicSubtitle: 'Custom Graphics Slot',
        customMediaUrl: '',
        customMediaType: 'image',
      }
    };
    try {
      await addDoc(collection(db, 'overlayTemplates'), {
        ...defaultCustomMedia,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Failed to seed custom media template:', err);
    }
  }
}

