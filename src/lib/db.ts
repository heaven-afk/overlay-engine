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

export interface FieldCatalogItem {
  key: string;
  label: string;
  type: 'text' | 'image';
}

export interface FieldBox {
  id: string;
  dataField: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: string;
  boxType: 'text' | 'image';
  
  // Advanced container layout parameters
  staticText?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  elementOpacity?: number;
}

export interface OverlayTemplate {
  id?: string;
  name: string;
  backgroundImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  fieldBoxes: FieldBox[];
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

// ─── FIELD CATALOG (overlayDataFieldCatalog) ─────────────────────────────────

const BASE_CATALOG: FieldCatalogItem[] = [
  // Single team / team reference
  { key: "team.teamName", label: "Team Name", type: "text" },
  { key: "team.logoUrl", label: "Team Logo", type: "image" },
  { key: "team.clanName", label: "Clan Name", type: "text" },
  { key: "team.scores.FINAL_RATING", label: "Team Rating", type: "text" },
  { key: "team.scores.rankLabel", label: "Rank Label (Elite Rank, etc.)", type: "text" },
  { key: "team.identity", label: "Identity (Slayer, Survivalist, etc.)", type: "text" },
  { key: "team.analytics.PPM", label: "Points Per Match", type: "text" },
  { key: "team.analytics.KPM", label: "Kills Per Match", type: "text" },
  { key: "team.analytics.top3Rate", label: "Top 3 Rate", type: "text" },
  { key: "team.analytics.top5Rate", label: "Top 5 Rate", type: "text" },
  { key: "team.labels.formLabel", label: "Form (Red Hot, In Form, etc.)", type: "text" },
  { key: "team.kills", label: "Kills (current match/day)", type: "text" },
  { key: "team.placement", label: "Placement (current match/day)", type: "text" },

  // ── Head to Head ──────────────────────────────────────────────────────────
  { key: "teamA.teamName", label: "H2H Team A Name", type: "text" },
  { key: "teamA.logoUrl", label: "H2H Team A Logo", type: "image" },
  { key: "teamA.clanName", label: "H2H Team A Clan Name", type: "text" },
  { key: "teamA.scores.FINAL_RATING", label: "H2H Team A Rating", type: "text" },
  { key: "teamA.scores.rankLabel", label: "H2H Team A Rank Label", type: "text" },
  { key: "teamA.identity", label: "H2H Team A Identity", type: "text" },
  { key: "teamA.analytics.PPM", label: "H2H Team A PPM", type: "text" },
  { key: "teamA.analytics.KPM", label: "H2H Team A KPM", type: "text" },
  { key: "teamA.labels.formLabel", label: "H2H Team A Form", type: "text" },
  { key: "teamB.teamName", label: "H2H Team B Name", type: "text" },
  { key: "teamB.logoUrl", label: "H2H Team B Logo", type: "image" },
  { key: "teamB.clanName", label: "H2H Team B Clan Name", type: "text" },
  { key: "teamB.scores.FINAL_RATING", label: "H2H Team B Rating", type: "text" },
  { key: "teamB.scores.rankLabel", label: "H2H Team B Rank Label", type: "text" },
  { key: "teamB.identity", label: "H2H Team B Identity", type: "text" },
  { key: "teamB.analytics.PPM", label: "H2H Team B PPM", type: "text" },
  { key: "teamB.analytics.KPM", label: "H2H Team B KPM", type: "text" },
  { key: "teamB.labels.formLabel", label: "H2H Team B Form", type: "text" },
  { key: "scope.type", label: "H2H Scope Type (career / tournament)", type: "text" },
  { key: "scope.tournamentId", label: "H2H Scope Tournament ID", type: "text" },

  // ── Player Card ───────────────────────────────────────────────────────────
  { key: "player.ign", label: "Player IGN", type: "text" },
  { key: "player.professionalName", label: "Player Pro Name", type: "text" },
  { key: "player.teamName", label: "Player Team Name", type: "text" },
  { key: "player.logoUrl", label: "Player Logo / Avatar", type: "image" },
  { key: "player.careerStats.careerKills", label: "Player Career Kills", type: "text" },
  { key: "player.careerStats.avgDamage", label: "Player Avg Damage", type: "text" },
  { key: "player.careerStats.avgKills", label: "Player Avg Kills", type: "text" },
  { key: "player.careerStats.avgPlacement", label: "Player Avg Placement", type: "text" },
  { key: "player.careerStats.winRate", label: "Player Win Rate", type: "text" },
  { key: "player.careerStats.top5Rate", label: "Player Top 5 Rate", type: "text" },
  { key: "player.scores.FINAL_RATING", label: "Player Rating", type: "text" },
  { key: "player.scores.rankLabel", label: "Player Rank Label", type: "text" },
];

// Generate multi-team fields (team1 through team12) for standings templates
const GENERATED_CATALOG: FieldCatalogItem[] = Array.from({ length: 12 }, (_, i) => {
  const num = i + 1;
  return [
    { key: `team${num}.teamName`, label: `Team #${num} Name`, type: "text" as const },
    { key: `team${num}.logoUrl`, label: `Team #${num} Logo`, type: "image" as const },
    { key: `team${num}.clanName`, label: `Team #${num} Clan Name`, type: "text" as const },
    { key: `team${num}.scores.FINAL_RATING`, label: `Team #${num} Rating`, type: "text" as const },
    { key: `team${num}.scores.rankLabel`, label: `Team #${num} Rank Label`, type: "text" as const },
    { key: `team${num}.identity`, label: `Team #${num} Identity`, type: "text" as const },
    { key: `team${num}.analytics.PPM`, label: `Team #${num} PPM`, type: "text" as const },
    { key: `team${num}.analytics.KPM`, label: `Team #${num} KPM`, type: "text" as const },
    { key: `team${num}.labels.formLabel`, label: `Team #${num} Form`, type: "text" as const },
    { key: `team${num}.analyticsRank`, label: `Team #${num} Rank Position`, type: "text" as const },
  ];
}).flat();

const DEFAULT_CATALOG = [...BASE_CATALOG, ...GENERATED_CATALOG];

export async function getFieldCatalog(): Promise<FieldCatalogItem[]> {
  try {
    const d = await getDoc(doc(db, 'overlayDataFieldCatalog', 'catalog'));
    if (d.exists()) {
      return (d.data().fields || []) as FieldCatalogItem[];
    }
    
    await setDoc(doc(db, 'overlayDataFieldCatalog', 'catalog'), { fields: DEFAULT_CATALOG });
    return DEFAULT_CATALOG;
  } catch (err) {
    console.error('Failed to getFieldCatalog:', err);
    return DEFAULT_CATALOG;
  }
}

// ─── MOCK TEMPLATES SEEDING ──────────────────────────────────────────────────

async function seedDefaultTemplates() {
  const headToHead: Omit<OverlayTemplate, 'id'> = {
    name: 'Inbuilt: Head-to-Head matchup',
    backgroundImageUrl: '',
    canvasWidth: 1920,
    canvasHeight: 1080,
    fieldBoxes: [
      // Left Team (Team A)
      {
        id: 'h2h-t1-name',
        dataField: 'teamA.teamName',
        x: 150, y: 180, width: 500, height: 70,
        fontFamily: 'Outfit', fontSize: 44, fontWeight: 'bold',
        color: '#ffffff', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t1-logo',
        dataField: 'teamA.logoUrl',
        x: 300, y: 280, width: 200, height: 200,
        fontFamily: 'Inter', fontSize: 14, fontWeight: 'normal',
        color: '#ffffff', textAlign: 'center', boxType: 'image'
      },
      {
        id: 'h2h-t1-rating',
        dataField: 'teamA.scores.FINAL_RATING',
        x: 150, y: 520, width: 500, height: 60,
        fontFamily: 'Space Grotesk', fontSize: 40, fontWeight: 'bold',
        color: '#8b5cf6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t1-ppm',
        dataField: 'teamA.analytics.PPM',
        x: 150, y: 620, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 28, fontWeight: 'normal',
        color: '#f4f4f6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t1-kpm',
        dataField: 'teamA.analytics.KPM',
        x: 150, y: 710, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 28, fontWeight: 'normal',
        color: '#f4f4f6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t1-form',
        dataField: 'teamA.labels.formLabel',
        x: 150, y: 800, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 24, fontWeight: 'bold',
        color: '#34d399', textAlign: 'center', boxType: 'text'
      },
      
      // Right Team (Team B)
      {
        id: 'h2h-t2-name',
        dataField: 'teamB.teamName',
        x: 1270, y: 180, width: 500, height: 70,
        fontFamily: 'Outfit', fontSize: 44, fontWeight: 'bold',
        color: '#ffffff', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t2-logo',
        dataField: 'teamB.logoUrl',
        x: 1420, y: 280, width: 200, height: 200,
        fontFamily: 'Inter', fontSize: 14, fontWeight: 'normal',
        color: '#ffffff', textAlign: 'center', boxType: 'image'
      },
      {
        id: 'h2h-t2-rating',
        dataField: 'teamB.scores.FINAL_RATING',
        x: 1270, y: 520, width: 500, height: 60,
        fontFamily: 'Space Grotesk', fontSize: 40, fontWeight: 'bold',
        color: '#8b5cf6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t2-ppm',
        dataField: 'teamB.analytics.PPM',
        x: 1270, y: 620, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 28, fontWeight: 'normal',
        color: '#f4f4f6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t2-kpm',
        dataField: 'teamB.analytics.KPM',
        x: 1270, y: 710, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 28, fontWeight: 'normal',
        color: '#f4f4f6', textAlign: 'center', boxType: 'text'
      },
      {
        id: 'h2h-t2-form',
        dataField: 'teamB.labels.formLabel',
        x: 1270, y: 800, width: 500, height: 50,
        fontFamily: 'Inter', fontSize: 24, fontWeight: 'bold',
        color: '#34d399', textAlign: 'center', boxType: 'text'
      }
    ]
  };

  const top5Leaderboard: Omit<OverlayTemplate, 'id'> = {
    name: 'Inbuilt: Top 5 Leaderboard',
    backgroundImageUrl: '',
    canvasWidth: 1920,
    canvasHeight: 1080,
    fieldBoxes: Array.from({ length: 5 }, (_, i) => {
      const num = i + 1;
      const y = 180 + i * 160;
      return [
        {
          id: `top5-rank-${num}`,
          dataField: `team${num}.analyticsRank`,
          x: 250, y, width: 80, height: 60,
          fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 'bold',
          color: '#a78bfa', textAlign: 'center', boxType: 'text' as const
        },
        {
          id: `top5-logo-${num}`,
          dataField: `team${num}.logoUrl`,
          x: 360, y: y - 10, width: 80, height: 80,
          fontFamily: 'Inter', fontSize: 14, fontWeight: 'normal',
          color: '#ffffff', textAlign: 'center', boxType: 'image' as const
        },
        {
          id: `top5-name-${num}`,
          dataField: `team${num}.teamName`,
          x: 480, y, width: 500, height: 60,
          fontFamily: 'Outfit', fontSize: 32, fontWeight: 'bold',
          color: '#ffffff', textAlign: 'left', boxType: 'text' as const
        },
        {
          id: `top5-rating-${num}`,
          dataField: `team${num}.scores.FINAL_RATING`,
          x: 1100, y, width: 250, height: 60,
          fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 'bold',
          color: '#8b5cf6', textAlign: 'right', boxType: 'text' as const
        },
        {
          id: `top5-identity-${num}`,
          dataField: `team${num}.identity`,
          x: 1400, y, width: 250, height: 60,
          fontFamily: 'Inter', fontSize: 24, fontWeight: 'normal',
          color: '#9fa0ac', textAlign: 'left', boxType: 'text' as const
        }
      ];
    }).flat()
  };

  try {
    await Promise.all([
      addDoc(collection(db, 'overlayTemplates'), { 
        ...headToHead, 
        createdAt: Timestamp.now(), 
        updatedAt: Timestamp.now() 
      }),
      addDoc(collection(db, 'overlayTemplates'), { 
        ...top5Leaderboard, 
        createdAt: Timestamp.now(), 
        updatedAt: Timestamp.now() 
      })
    ]);
  } catch (err) {
    console.error('Failed to seed default templates:', err);
  }
}
