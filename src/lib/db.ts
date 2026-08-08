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
  | 'top_5_overall'    // NEW: Top 5 overall standings formatted like daily standings
  | 'hybrid_era_top5'  // NEW: Hybrid Era Top 5 Graphic (Remedium Gaming x Fabrizio Mayowa)
  | 'top5_graphic'     // NEW: Top 5 Graphic — same layout, fully themeable (global use)
  | 'team_roster_kills'// NEW: Team Roster Kill Cards Graphic
  | 'flexible_top5'    // NEW: Flexible Top 5 Graphic (Paginated Standings)
  | 'match_summary';   // NEW: Match Summary Graphic (Lobby / Match Scope)

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
  customMediaType?: 'image' | 'video' | 'gif' | 'auto' | 'canva'; // type of custom media
  customMediaFit?: 'cover' | 'contain' | 'fill'; // how to scale/fit the media in 1920x1080

  // Hybrid Era & Group Stage template specific
  hybridEraMode?: 'daily' | 'collation'; // 'daily' (e.g. AFTER GAME ONE) or 'collation' (e.g. OVERALL COLLATION)
  hybridEraSubheader?: string;          // optional custom subheader badge text (e.g. "AFTER GAME ONE")
  hybridTopRightLogoUrl?: string;       // optional uploaded logo/brand image for top-right corner (replaces text badge)
  selectedGroup?: string;               // group stage filter e.g. 'Qualifiers', 'Finals', 'all'
  selectedMap?: string;                 // map selection e.g. 'Isolated', 'Blackout', 'Rebirth Island', 'none'
  day?: number;                         // day number for lobby/daily templates
  lobby?: number;                       // lobby number for lobby/daily templates
  teamId?: string;                      // selected team ID for team roster kills
  scope?: 'collation' | 'daily';        // scope mode for team roster kills ('collation' or 'daily')
  frameColor?: string;                  // operator-configurable base color for metallic card border
}

export interface OverlayTemplate {
  id?: string;
  name: string;
  templateType: TemplateType;
  styleConfig: TemplateStyleConfig;
  createdAt?: any;
  updatedAt?: any;
}

export interface SlotStateData {
  templateId: string | null;
  fields: Record<string, any>;
  dataShapeType?: TemplateType;
  lastEditedBy?: string;
  lastEditedAt?: any;
  pushedBy?: string;
  pushedAt?: any;
}

export interface TeamMember {
  userId: string;
  email: string;
  role: 'editor' | 'viewer';
  joinedAt?: any;
}

export interface OverlayTeam {
  id?: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt?: any;
  updatedAt?: any;
}

export interface OverlayInvite {
  id?: string;
  teamId: string;
  teamName: string;
  role: 'editor' | 'viewer';
  token: string;
  createdBy: string;
  expiresAt: any;
  status: 'active' | 'accepted' | 'expired';
}

export interface PushHistoryEntry {
  id?: string;
  pushedAt: any;
  pushedBy: string;
  pushedByEmail?: string;
  snapshot: SlotStateData;
}

export interface ScheduledPushEntry {
  id?: string;
  scheduledAt: any;
  snapshot: SlotStateData;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdByEmail?: string;
  createdAt: any;
}

export interface EditLogEntry {
  id?: string;
  timestamp: any;
  userId: string;
  userEmail: string;
  fieldName: string;
  action: string;
}

export interface OverlaySlot {
  id?: string;
  name: string;
  publicRenderToken: string;
  ownerType: 'individual' | 'team';
  ownerId: string;
  teamId?: string | null;
  liveLock?: boolean;

  workspace: SlotStateData;
  published: SlotStateData;

  // Legacy fallback fields for backward compatibility
  dataShapeType?: TemplateType;
  assignedTemplateId?: string | null;
  currentData?: any | null;
  updatedAt?: any;
  slotType?: any;
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

export async function getTournamentGroups(tournamentId: string): Promise<Array<{ id: string; name: string }>> {
  if (!tournamentId) return [];
  try {
    const snap = await getDocs(collection(db, 'tournaments', tournamentId, 'groups'));
    return snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, name: data.groupName || data.name || d.id };
    });
  } catch (err) {
    console.error(`Failed to get groups for tournament ${tournamentId}:`, err);
    return [];
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
    
    // Auto-clean excess unconfigured custom_media duplicates if more than 2 exist
    const customMediaTemplates = list.filter((t) => t.templateType === 'custom_media');
    if (customMediaTemplates.length > 2) {
      // Retain the first 2 or configured ones, delete blank excess duplicates
      const unconfigured = customMediaTemplates.filter(
        (t) => !t.styleConfig?.customMediaUrl && !t.name.includes('(Configured)')
      );
      const toDeleteCount = customMediaTemplates.length - 2;
      const toDelete = unconfigured.slice(0, toDeleteCount);

      for (const t of toDelete) {
        if (t.id) {
          try {
            await deleteDoc(doc(db, 'overlayTemplates', t.id));
          } catch (e) {
            console.error('Error auto-cleaning duplicate custom media:', e);
          }
        }
      }

      // Re-fetch cleaned list
      const freshSnap = await getDocs(collection(db, 'overlayTemplates'));
      list = freshSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    }

    // Only seed default custom media templates if ZERO exist
    if (list.filter((t) => t.templateType === 'custom_media').length === 0) {
      await seedCustomMediaTemplates(2);
      const freshSnap = await getDocs(collection(db, 'overlayTemplates'));
      list = freshSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    }

    // Auto-seed default team_roster_kills, flexible_top5, and match_summary templates if missing
    let seededNewGraphics = false;
    if (list.filter((t) => t.templateType === 'team_roster_kills').length === 0) {
      await seedSingleTemplate('Team Roster Kill Cards', 'team_roster_kills', '#FFD700', 'ROSTER KILL CARDS');
      seededNewGraphics = true;
    }
    if (list.filter((t) => t.templateType === 'flexible_top5').length === 0) {
      await seedSingleTemplate('Flexible Top 5 Standings', 'flexible_top5', '#A855F7', 'TOURNAMENT STANDINGS');
      seededNewGraphics = true;
    }
    if (list.filter((t) => t.templateType === 'match_summary').length === 0) {
      await seedSingleTemplate('Match Summary', 'match_summary', '#FFD700', 'MATCH SUMMARY');
      seededNewGraphics = true;
    }
    if (seededNewGraphics) {
      const freshSnap = await getDocs(collection(db, 'overlayTemplates'));
      list = freshSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTemplate));
    }
    
    return list;
  } catch (err) {
    console.error('Failed to getTemplates:', err);
    return [];
  }
}

export function getBuiltInTemplate(id?: string | null): OverlayTemplate | null {
  if (!id) return null;
  if (id.includes('team_roster_kills')) {
    return {
      id: 'built-in:team_roster_kills',
      name: 'Team Roster Kill Cards',
      templateType: 'team_roster_kills',
      styleConfig: {
        colorTheme: 'dark',
        accentColor: '#FFD700',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        brandingLogoUrl: '',
        brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
        showStatsStamp: true,
        tournamentLogoCount: 1,
        tournamentLogos: [],
        topN: 4,
        showColumns: [],
        graphicTitle: 'ROSTER KILL CARDS',
        graphicSubtitle: 'Match Kills Breakdown',
      },
    } as OverlayTemplate;
  }
  if (id.includes('flexible_top5')) {
    return {
      id: 'built-in:flexible_top5',
      name: 'Flexible Top 5 Standings',
      templateType: 'flexible_top5',
      styleConfig: {
        colorTheme: 'dark',
        accentColor: '#A855F7',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        brandingLogoUrl: '',
        brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
        showStatsStamp: true,
        tournamentLogoCount: 1,
        tournamentLogos: [],
        topN: 5,
        showColumns: [],
        graphicTitle: 'TOURNAMENT STANDINGS',
        graphicSubtitle: 'Paginated Top 5',
      },
    } as OverlayTemplate;
  }
  if (id.includes('match_summary')) {
    return {
      id: 'built-in:match_summary',
      name: 'Match Summary',
      templateType: 'match_summary',
      styleConfig: {
        colorTheme: 'dark',
        accentColor: '#FFD700',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        brandingLogoUrl: '',
        brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
        showStatsStamp: true,
        tournamentLogoCount: 1,
        tournamentLogos: [],
        topN: 3,
        showColumns: [],
        graphicTitle: 'MATCH SUMMARY',
        graphicSubtitle: 'Lobby & Tournament Overview',
      },
    } as OverlayTemplate;
  }
  return null;
}

export async function getTemplate(id: string): Promise<OverlayTemplate | null> {
  const builtIn = getBuiltInTemplate(id);
  if (builtIn) return builtIn;
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

export function normalizeSlot(id: string, data: any): OverlaySlot {
  let dataShapeType: TemplateType = data.dataShapeType;
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

  // Fallback state for legacy slots created before workspace/published split
  const defaultState: SlotStateData = {
    templateId: data.assignedTemplateId ?? null,
    fields: { currentData: data.currentData ?? null },
    dataShapeType: dataShapeType,
    lastEditedBy: data.lastEditedBy || 'system',
    lastEditedAt: data.updatedAt || null,
  };

  const workspace: SlotStateData = data.workspace ? {
    templateId: data.workspace.templateId ?? data.assignedTemplateId ?? null,
    fields: data.workspace.fields ?? { currentData: data.currentData ?? null },
    dataShapeType: data.workspace.dataShapeType || dataShapeType,
    lastEditedBy: data.workspace.lastEditedBy || 'system',
    lastEditedAt: data.workspace.lastEditedAt || null,
  } : defaultState;

  const published: SlotStateData = data.published ? {
    templateId: data.published.templateId ?? data.assignedTemplateId ?? null,
    fields: data.published.fields ?? { currentData: data.currentData ?? null },
    dataShapeType: data.published.dataShapeType || dataShapeType,
    pushedBy: data.published.pushedBy || 'system',
    pushedAt: data.published.pushedAt || null,
  } : defaultState;

  return {
    id,
    name: data.name || 'Untitled Slot',
    publicRenderToken: data.publicRenderToken || '',
    ownerType: data.ownerType || 'individual',
    ownerId: data.ownerId || 'system_owner',
    teamId: data.teamId || null,
    liveLock: Boolean(data.liveLock),

    workspace,
    published,

    dataShapeType: workspace.dataShapeType || published.dataShapeType || dataShapeType,
    assignedTemplateId: published.templateId || workspace.templateId || null,
    currentData: published.fields?.currentData ?? workspace.fields?.currentData ?? null,
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

// ─── PUSH & HISTORY FUNCTIONS ────────────────────────────────────────────────

export async function pushToLive(
  slotId: string,
  user: { uid: string; email: string }
): Promise<void> {
  const slot = await getSlot(slotId);
  if (!slot) throw new Error('Slot not found');

  const snapshot: SlotStateData = {
    templateId: slot.workspace.templateId,
    fields: slot.workspace.fields,
    dataShapeType: slot.workspace.dataShapeType,
    pushedBy: user.email || user.uid,
    pushedAt: Timestamp.now(),
  };

  // 1. Update published state on slot doc
  await updateDoc(doc(db, 'overlaySlots', slotId), {
    published: snapshot,
    updatedAt: Timestamp.now(),
    // Keep legacy top-level currentData & assignedTemplateId in sync for backwards compat
    assignedTemplateId: snapshot.templateId,
    currentData: snapshot.fields?.currentData ?? snapshot.fields,
  });

  // 2. Append to pushHistory subcollection
  await addDoc(collection(db, 'overlaySlots', slotId, 'pushHistory'), {
    pushedAt: Timestamp.now(),
    pushedBy: user.uid,
    pushedByEmail: user.email,
    snapshot,
  });
}

export async function rollbackPush(
  slotId: string,
  snapshot: SlotStateData,
  user: { uid: string; email: string }
): Promise<void> {
  const rollbackSnapshot: SlotStateData = {
    ...snapshot,
    pushedBy: `Rollback by ${user.email || user.uid}`,
    pushedAt: Timestamp.now(),
  };

  await updateDoc(doc(db, 'overlaySlots', slotId), {
    published: rollbackSnapshot,
    updatedAt: Timestamp.now(),
    assignedTemplateId: rollbackSnapshot.templateId,
    currentData: rollbackSnapshot.fields?.currentData ?? rollbackSnapshot.fields,
  });

  await addDoc(collection(db, 'overlaySlots', slotId, 'pushHistory'), {
    pushedAt: Timestamp.now(),
    pushedBy: user.uid,
    pushedByEmail: user.email,
    snapshot: rollbackSnapshot,
  });
}

export async function getPushHistory(slotId: string): Promise<PushHistoryEntry[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'overlaySlots', slotId, 'pushHistory'), orderBy('pushedAt', 'desc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PushHistoryEntry));
  } catch (err) {
    console.error(`Failed to getPushHistory for slot ${slotId}:`, err);
    return [];
  }
}

export async function schedulePush(
  slotId: string,
  scheduledAt: Date,
  user: { uid: string; email: string }
): Promise<string> {
  const slot = await getSlot(slotId);
  if (!slot) throw new Error('Slot not found');

  const snapshot: SlotStateData = {
    templateId: slot.workspace.templateId,
    fields: slot.workspace.fields,
    dataShapeType: slot.workspace.dataShapeType,
  };

  const ref = await addDoc(collection(db, 'overlaySlots', slotId, 'scheduledPushes'), {
    scheduledAt: Timestamp.fromDate(scheduledAt),
    snapshot,
    status: 'pending',
    createdBy: user.uid,
    createdByEmail: user.email,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function cancelScheduledPush(slotId: string, pushId: string): Promise<void> {
  await updateDoc(doc(db, 'overlaySlots', slotId, 'scheduledPushes', pushId), {
    status: 'cancelled',
  });
}

export async function getScheduledPushes(slotId: string): Promise<ScheduledPushEntry[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'overlaySlots', slotId, 'scheduledPushes'), where('status', '==', 'pending'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduledPushEntry));
  } catch (err) {
    console.error(`Failed to getScheduledPushes for slot ${slotId}:`, err);
    return [];
  }
}

export async function logWorkspaceEdit(
  slotId: string,
  user: { uid: string; email: string },
  fieldName: string,
  action = 'updated'
): Promise<void> {
  try {
    await addDoc(collection(db, 'overlaySlots', slotId, 'editLog'), {
      timestamp: Timestamp.now(),
      userId: user.uid,
      userEmail: user.email,
      fieldName,
      action,
    });
  } catch (err) {
    console.error('Failed to log workspace edit:', err);
  }
}

// ─── TEAM & INVITES CRUD (overlayTeams, overlayInvites) ─────────────────────

export async function createTeam(name: string, owner: { uid: string; email: string }): Promise<string> {
  const ref = await addDoc(collection(db, 'overlayTeams'), {
    name,
    ownerId: owner.uid,
    members: [{ userId: owner.uid, email: owner.email, role: 'editor', joinedAt: Timestamp.now() }],
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getTeam(teamId: string): Promise<OverlayTeam | null> {
  try {
    const d = await getDoc(doc(db, 'overlayTeams', teamId));
    return d.exists() ? ({ id: d.id, ...d.data() } as OverlayTeam) : null;
  } catch (err) {
    console.error(`Failed to getTeam ${teamId}:`, err);
    return null;
  }
}

export async function getUserTeams(userId: string): Promise<OverlayTeam[]> {
  try {
    const snap = await getDocs(collection(db, 'overlayTeams'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayTeam));
    return list.filter((t) => t.ownerId === userId || t.members.some((m) => m.userId === userId));
  } catch (err) {
    console.error(`Failed to getUserTeams for ${userId}:`, err);
    return [];
  }
}

export async function createInviteLink(
  teamId: string,
  teamName: string,
  role: 'editor' | 'viewer',
  user: { uid: string; email: string }
): Promise<string> {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

  await addDoc(collection(db, 'overlayInvites'), {
    teamId,
    teamName,
    role,
    token,
    createdBy: user.email || user.uid,
    expiresAt,
    status: 'active',
  });

  return token;
}

export async function getInviteByToken(token: string): Promise<OverlayInvite | null> {
  try {
    const snap = await getDocs(
      query(collection(db, 'overlayInvites'), where('token', '==', token), where('status', '==', 'active'))
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as OverlayInvite;
  } catch (err) {
    console.error(`Failed to getInviteByToken ${token}:`, err);
    return null;
  }
}

export async function getTeamInvites(teamId: string): Promise<OverlayInvite[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'overlayInvites'), where('teamId', '==', teamId), where('status', '==', 'active'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OverlayInvite));
  } catch (err) {
    console.error(`Failed to getTeamInvites ${teamId}:`, err);
    return [];
  }
}

export async function acceptInviteToken(
  token: string,
  user: { uid: string; email: string }
): Promise<{ teamId: string }> {
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error('Invalid or expired invite token');

  const team = await getTeam(invite.teamId);
  if (!team) throw new Error('Team not found');

  // Check if already a member
  if (!team.members.some((m) => m.userId === user.uid)) {
    const updatedMembers = [
      ...team.members,
      { userId: user.uid, email: user.email, role: invite.role, joinedAt: Timestamp.now() },
    ];
    await updateDoc(doc(db, 'overlayTeams', invite.teamId), {
      members: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  }

  // Mark invite as accepted
  if (invite.id) {
    await updateDoc(doc(db, 'overlayInvites', invite.id), { status: 'accepted' });
  }

  return { teamId: invite.teamId };
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

async function seedSingleTemplate(name: string, templateType: TemplateType, accentColor: string, title: string) {
  const defaultTemplate: Omit<OverlayTemplate, 'id'> = {
    name,
    templateType,
    styleConfig: {
      colorTheme: 'dark',
      accentColor,
      headingFont: 'Inter',
      bodyFont: 'Inter',
      brandingLogoUrl: '',
      brandingName: 'HEAVEN STAT ENGINE\nAfrican CODM BR Coverage',
      showStatsStamp: true,
      tournamentLogoCount: 1,
      tournamentLogos: [
        { logoUrl: '', tournamentName: '' }
      ],
      topN: 5,
      showColumns: [],
      graphicTitle: title,
      graphicSubtitle: 'Live Overlay Graphic',
    }
  };

  try {
    await addDoc(collection(db, 'overlayTemplates'), {
      ...defaultTemplate,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (err) {
    console.error(`Failed to seed ${templateType} template:`, err);
  }
}

// ─── STUDIO ROOM TYPES ────────────────────────────────────────────────────────

export interface StudioProject {
  id?: string;
  name: string;
  ownerId: string;
  teamId: string | null;
  sourceLinkToken: string;
  createdAt?: any;
}

export interface StudioPlaylist {
  id?: string;
  slotNumber: number; // 1–6
  name: string;
}

export interface StudioPlaylistItem {
  id?: string;
  templateId: string;
  fields: Record<string, any>;
  order: number;
  savedAt?: any;
}

export interface StudioLiveState {
  templateId: string | null;
  fields: Record<string, any>;
  pushedBy: string;
  pushedAt: any;
}

export interface StudioPushHistoryEntry {
  id?: string;
  pushedAt: any;
  pushedBy: string;
  pushedByEmail?: string;
  snapshot: {
    templateId: string | null;
    fields: Record<string, any>;
  };
}

// ─── STUDIO ROOM CRUD ─────────────────────────────────────────────────────────

function generateStudioToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createStudioProject(
  name: string,
  ownerId: string,
  teamId: string | null = null
): Promise<string> {
  const token = generateStudioToken();

  const ref = await addDoc(collection(db, 'studioProjects'), {
    name,
    ownerId,
    teamId,
    sourceLinkToken: token,
    createdAt: Timestamp.now(),
  });
  const projectId = ref.id;

  // Initialise 6 fixed playlist slots
  const playlistNames = ['Playlist 1', 'Playlist 2', 'Playlist 3', 'Playlist 4', 'Playlist 5', 'Playlist 6'];
  for (let i = 0; i < 6; i++) {
    await addDoc(collection(db, 'studioProjects', projectId, 'playlists'), {
      slotNumber: i + 1,
      name: playlistNames[i],
    });
  }

  // Initialise empty live state document
  await setDoc(doc(db, 'studioProjects', projectId, 'live', 'current'), {
    templateId: null,
    fields: {},
    pushedBy: '',
    pushedAt: null,
  });

  return projectId;
}

export async function getStudioProjects(): Promise<StudioProject[]> {
  try {
    const snap = await getDocs(collection(db, 'studioProjects'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudioProject));
  } catch (err) {
    console.error('Failed to getStudioProjects:', err);
    return [];
  }
}

export async function getStudioProject(projectId: string): Promise<StudioProject | null> {
  try {
    const d = await getDoc(doc(db, 'studioProjects', projectId));
    return d.exists() ? ({ id: d.id, ...d.data() } as StudioProject) : null;
  } catch (err) {
    console.error(`Failed to getStudioProject ${projectId}:`, err);
    return null;
  }
}

export async function getStudioProjectByToken(token: string): Promise<StudioProject | null> {
  try {
    const snap = await getDocs(
      query(collection(db, 'studioProjects'), where('sourceLinkToken', '==', token))
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as StudioProject;
  } catch (err) {
    console.error(`Failed to getStudioProjectByToken ${token}:`, err);
    return null;
  }
}

export async function deleteStudioProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'studioProjects', projectId));
}

export async function getStudioPlaylists(projectId: string): Promise<StudioPlaylist[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'studioProjects', projectId, 'playlists'), orderBy('slotNumber'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudioPlaylist));
  } catch (err) {
    console.error('Failed to getStudioPlaylists:', err);
    return [];
  }
}

export async function updateStudioPlaylistName(
  projectId: string,
  playlistId: string,
  name: string
): Promise<void> {
  if (!name.trim()) return;
  await updateDoc(doc(db, 'studioProjects', projectId, 'playlists', playlistId), {
    name: name.trim(),
  });
}

export async function getStudioPlaylistItems(
  projectId: string,
  playlistId: string
): Promise<StudioPlaylistItem[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'studioProjects', projectId, 'playlists', playlistId, 'items'),
        orderBy('order')
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudioPlaylistItem));
  } catch (err) {
    console.error('Failed to getStudioPlaylistItems:', err);
    return [];
  }
}

export function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

export async function saveStudioPlaylistItem(
  projectId: string,
  playlistId: string,
  item: Omit<StudioPlaylistItem, 'id'>,
  itemId?: string
): Promise<string> {
  const data = sanitizeForFirestore({ ...item, savedAt: Timestamp.now() });
  if (itemId) {
    await setDoc(
      doc(db, 'studioProjects', projectId, 'playlists', playlistId, 'items', itemId),
      data,
      { merge: true }
    );
    return itemId;
  } else {
    const ref = await addDoc(
      collection(db, 'studioProjects', projectId, 'playlists', playlistId, 'items'),
      data
    );
    return ref.id;
  }
}

export async function deleteStudioPlaylistItem(
  projectId: string,
  playlistId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'studioProjects', projectId, 'playlists', playlistId, 'items', itemId)
  );
}

// ─── STUDIO ROOM PUSH / HISTORY ───────────────────────────────────────────────

export async function pushStudioProjectToLive(
  projectId: string,
  templateId: string | null,
  fields: Record<string, any>,
  user: { uid: string; email: string }
): Promise<void> {
  const cleanFields = sanitizeForFirestore(fields || {});
  const liveState: StudioLiveState = {
    templateId,
    fields: cleanFields,
    pushedBy: user.email || user.uid,
    pushedAt: Timestamp.now(),
  };

  // Write live state (onSnapshot in render page picks this up)
  await setDoc(doc(db, 'studioProjects', projectId, 'live', 'current'), liveState);

  // Append to push history
  await addDoc(collection(db, 'studioProjects', projectId, 'pushHistory'), {
    pushedAt: Timestamp.now(),
    pushedBy: user.uid,
    pushedByEmail: user.email,
    snapshot: { templateId, fields: cleanFields },
  });
}

export async function rollbackStudioProject(
  projectId: string,
  snapshot: { templateId: string | null; fields: Record<string, any> },
  user: { uid: string; email: string }
): Promise<void> {
  const cleanFields = sanitizeForFirestore(snapshot.fields || {});
  const liveState: StudioLiveState = {
    templateId: snapshot.templateId,
    fields: cleanFields,
    pushedBy: `Rollback by ${user.email || user.uid}`,
    pushedAt: Timestamp.now(),
  };

  await setDoc(doc(db, 'studioProjects', projectId, 'live', 'current'), liveState);

  await addDoc(collection(db, 'studioProjects', projectId, 'pushHistory'), {
    pushedAt: Timestamp.now(),
    pushedBy: user.uid,
    pushedByEmail: user.email,
    snapshot: { templateId: snapshot.templateId, fields: cleanFields },
  });
}


export async function getStudioProjectPushHistory(projectId: string): Promise<StudioPushHistoryEntry[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'studioProjects', projectId, 'pushHistory'),
        orderBy('pushedAt', 'desc')
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudioPushHistoryEntry));
  } catch (err) {
    console.error('Failed to getStudioProjectPushHistory:', err);
    return [];
  }
}

/** Returns the Firestore DocumentReference for the live state — use with onSnapshot() */
export function getStudioLiveDocRef(projectId: string) {
  return doc(db, 'studioProjects', projectId, 'live', 'current');
}
