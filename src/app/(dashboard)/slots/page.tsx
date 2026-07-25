'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getSlots, getTemplates, saveSlot, deleteSlot,
  getTournaments, pushToLive, rollbackPush, schedulePush,
  cancelScheduledPush, getPushHistory, getScheduledPushes,
  createTeam, getUserTeams, createInviteLink, logWorkspaceEdit,
  OverlaySlot, OverlayTemplate, TemplateType, PushHistoryEntry,
  ScheduledPushEntry, OverlayTeam, SlotStateData
} from '@/lib/db';
import {
  getTopStandings,
  getGlobalRankings,
  getProfile,
  compareEntities,
  getDailyStandings,
} from '@/lib/statsApi';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { trackPresence, subscribeToSlotPresence, PresenceUser } from '@/lib/presence';
import {
  Layers, Plus, Link as LinkIcon, Check, Copy,
  Trash, Send, Loader2, Users, User as UserIcon, RefreshCw,
  Clock, History, Lock, Unlock, Eye, ShieldAlert,
  ChevronRight, Calendar, AlertTriangle, ArrowRight, UserPlus
} from 'lucide-react';

// ─── Per-slot configuration state shapes ─────────────────────────────────────

interface DailyStandingsConfig {
  tournamentId: string;
  day: number;
  mode: 'full_day' | 'single_lobby';
  lobby: number | '';
  n: number;
  groupId?: string;
}

interface TeamProfileConfig {
  teamId: string;
}

interface StandingsConfig {
  n: number;
  type: 'team' | 'player';
  tournamentId: string;
  groupId?: string;
}

interface H2HConfig {
  idA: string;
  idB: string;
  scopeTournamentId: string; // '' = career-wide
}

interface PlayerCardConfig {
  playerId: string;
}

export default function SlotsDashboard() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [slots, setSlots] = useState<OverlaySlot[]>([]);
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<OverlayTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<'visual' | 'json'>('visual');

  // New Slot form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newDataShapeType, setNewDataShapeType] = useState<TemplateType>('top_standings');
  const [newOwnerType, setNewOwnerType] = useState<'individual' | 'team'>('individual');
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // Push status & Modal states
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  // Modals state
  const [diffModalSlot, setDiffModalSlot] = useState<OverlaySlot | null>(null);
  const [liveLockConfirmed, setLiveLockConfirmed] = useState(false);

  const [historyModalSlot, setHistoryModalSlot] = useState<OverlaySlot | null>(null);
  const [historyList, setHistoryList] = useState<PushHistoryEntry[]>([]);

  const [scheduleModalSlot, setScheduleModalSlot] = useState<OverlaySlot | null>(null);
  const [scheduledList, setScheduledList] = useState<ScheduledPushEntry[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');

  const [teamModalSlot, setTeamModalSlot] = useState<OverlaySlot | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [createdInviteUrl, setCreatedInviteUrl] = useState('');

  // Per-slot configuration state
  const [standingsConfig, setStandingsConfig] = useState<Record<string, StandingsConfig>>({});
  const [dailyConfig, setDailyConfig] = useState<Record<string, DailyStandingsConfig>>({});
  const [teamProfileConfig, setTeamProfileConfig] = useState<Record<string, TeamProfileConfig>>({});
  const [h2hConfig, setH2HConfig] = useState<Record<string, H2HConfig>>({});
  const [playerCardConfig, setPlayerCardConfig] = useState<Record<string, PlayerCardConfig>>({});

  // Global pickers data
  const [globalTeams, setGlobalTeams] = useState<any[]>([]);
  const [globalPlayers, setGlobalPlayers] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Partial-result warnings
  const [partialWarning, setPartialWarning] = useState<Record<string, string>>({});

  // Presence tracking per slot id
  const [slotPresence, setSlotPresence] = useState<Record<string, PresenceUser[]>>({});

  useEffect(() => {
    setOrigin(window.location.origin);
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) {
        getUserTeams(u.uid).then(setUserTeams).catch(() => {});
      }
    });
    loadData();
    return () => unsub();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [slotsList, templatesList, tournamentsList] = await Promise.all([
        getSlots(),
        getTemplates(),
        getTournaments(),
      ]);
      setSlots(slotsList);
      setTemplates(templatesList);
      setTournaments(tournamentsList);
    } catch (err) {
      console.error('Failed to load slots/templates:', err);
    } finally {
      setLoading(false);
    }
  }

  // Subscribe to RTDB presence for each slot
  useEffect(() => {
    if (!currentUser || slots.length === 0) return;

    const unsubs: Array<() => void> = [];

    // Track active user presence on current dashboard
    slots.forEach((slot) => {
      if (!slot.id) return;
      const cleanPresence = trackPresence(slot.id, { uid: currentUser.uid, email: currentUser.email || '' });
      const unsubSub = subscribeToSlotPresence(slot.id, (members) => {
        setSlotPresence((prev) => ({ ...prev, [slot.id!]: members }));
      });
      unsubs.push(cleanPresence, unsubSub);
    });

    return () => unsubs.forEach((fn) => fn());
  }, [currentUser, slots]);

  async function ensurePickerData() {
    if (globalTeams.length > 0 || globalPlayers.length > 0) return;
    try {
      setPickerLoading(true);
      const [teamsRes, playersRes] = await Promise.all([
        getGlobalRankings('team', 50).catch(() => ({ results: [] })),
        getGlobalRankings('player', 100).catch(() => ({ results: [] })),
      ]);
      setGlobalTeams(teamsRes.results || []);
      setGlobalPlayers(playersRes.results || []);
    } catch (err) {
      console.error('Error fetching global rankings for pickers:', err);
    } finally {
      setPickerLoading(false);
    }
  }

  function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlotName.trim()) return;

    try {
      setCreating(true);
      const uid = currentUser?.uid || 'guest';
      const initialWorkspace: SlotStateData = {
        templateId: null,
        fields: {},
        dataShapeType: newDataShapeType,
        lastEditedBy: currentUser?.email || uid,
        lastEditedAt: new Date().toISOString(),
      };
      const initialPublished: SlotStateData = {
        templateId: null,
        fields: {},
        dataShapeType: newDataShapeType,
        pushedBy: 'none',
        pushedAt: null,
      };

      const newSlot: Omit<OverlaySlot, 'id'> = {
        name: newSlotName,
        dataShapeType: newDataShapeType,
        assignedTemplateId: null,
        currentData: null,
        publicRenderToken: generateToken(),
        ownerType: newOwnerType,
        ownerId: uid,
        teamId: newOwnerType === 'team' ? newTeamId || null : null,
        liveLock: false,
        workspace: initialWorkspace,
        published: initialPublished,
      };

      await saveSlot(newSlot);
      setNewSlotName('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      console.error('Error creating slot:', err);
      alert('Failed to create slot');
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignTemplate(slotId: string, templateId: string | null) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    try {
      const updatedWorkspace: SlotStateData = {
        ...slot.workspace,
        templateId: templateId || null,
        lastEditedBy: currentUser?.email || currentUser?.uid || 'user',
        lastEditedAt: new Date().toISOString(),
      };

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        ...slot,
        assignedTemplateId: templateId || null,
        workspace: updatedWorkspace,
      };

      await saveSlot(updatedSlot, slotId);
      if (currentUser) {
        logWorkspaceEdit(slotId, { uid: currentUser.uid, email: currentUser.email || '' }, 'assignedTemplateId');
      }
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, assignedTemplateId: templateId, workspace: updatedWorkspace } : s))
      );
    } catch (err) {
      console.error('Error assigning template:', err);
    }
  }

  async function handleToggleLiveLock(slot: OverlaySlot) {
    if (!slot.id) return;
    try {
      const newLock = !slot.liveLock;
      await saveSlot({ ...slot, liveLock: newLock }, slot.id);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, liveLock: newLock } : s)));
    } catch (err) {
      console.error('Error toggling live lock:', err);
    }
  }

  // Update workspace data helpers
  async function updateSlotWorkspaceFields(slot: OverlaySlot, payload: Record<string, any>) {
    if (!slot.id) return;
    const updatedWorkspace: SlotStateData = {
      ...slot.workspace,
      fields: payload,
      lastEditedBy: currentUser?.email || currentUser?.uid || 'user',
      lastEditedAt: new Date().toISOString(),
    };

    const updatedSlot: Omit<OverlaySlot, 'id'> = {
      ...slot,
      workspace: updatedWorkspace,
    };

    await saveSlot(updatedSlot, slot.id);
    if (currentUser) {
      logWorkspaceEdit(slot.id, { uid: currentUser.uid, email: currentUser.email || '' }, 'workspaceData');
    }
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, workspace: updatedWorkspace } : s)));
  }

  // ─── PUSH TO LIVE ACTIONS ──────────────────────────────────────────────────

  async function confirmPushToLive() {
    if (!diffModalSlot?.id || !currentUser) return;
    if (diffModalSlot.liveLock && !liveLockConfirmed) {
      alert('Live Lock is active! Please check the confirmation checkbox to push during a live broadcast.');
      return;
    }

    try {
      setPushingId(diffModalSlot.id);
      await pushToLive(diffModalSlot.id, { uid: currentUser.uid, email: currentUser.email || '' });
      setDiffModalSlot(null);
      setLiveLockConfirmed(false);
      await loadData();
    } catch (err: any) {
      console.error('Error pushing to live:', err);
      alert(`Push to Live failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPushingId(null);
    }
  }

  async function openHistoryModal(slot: OverlaySlot) {
    if (!slot.id) return;
    setHistoryModalSlot(slot);
    const hist = await getPushHistory(slot.id);
    setHistoryList(hist);
  }

  async function handleRollbackItem(entry: PushHistoryEntry) {
    if (!historyModalSlot?.id || !currentUser) return;
    if (!confirm('Are you sure you want to rollback the live broadcast output to this historical state?')) return;

    try {
      setPushingId(historyModalSlot.id);
      await rollbackPush(historyModalSlot.id, entry.snapshot, { uid: currentUser.uid, email: currentUser.email || '' });
      setHistoryModalSlot(null);
      await loadData();
    } catch (err: any) {
      console.error('Rollback failed:', err);
      alert(`Rollback failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPushingId(null);
    }
  }

  async function openScheduleModal(slot: OverlaySlot) {
    if (!slot.id) return;
    setScheduleModalSlot(slot);
    const list = await getScheduledPushes(slot.id);
    setScheduledList(list);
  }

  async function handleCreateScheduledPush() {
    if (!scheduleModalSlot?.id || !currentUser || !scheduleTime) return;
    const targetDate = new Date(scheduleTime);
    if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
      alert('Please select a valid future date and time.');
      return;
    }

    try {
      await schedulePush(scheduleModalSlot.id, targetDate, { uid: currentUser.uid, email: currentUser.email || '' });
      setScheduleTime('');
      const list = await getScheduledPushes(scheduleModalSlot.id);
      setScheduledList(list);
    } catch (err: any) {
      alert(`Failed to schedule push: ${err?.message || 'Unknown error'}`);
    }
  }

  async function handleCancelScheduledPush(pushId: string) {
    if (!scheduleModalSlot?.id) return;
    try {
      await cancelScheduledPush(scheduleModalSlot.id, pushId);
      const list = await getScheduledPushes(scheduleModalSlot.id);
      setScheduledList(list);
    } catch (err: any) {
      alert('Failed to cancel scheduled push');
    }
  }

  async function handleCreateTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim() || !currentUser) return;
    try {
      const tid = await createTeam(newTeamName.trim(), { uid: currentUser.uid, email: currentUser.email || '' });
      setNewTeamName('');
      const teams = await getUserTeams(currentUser.uid);
      setUserTeams(teams);
      if (newOwnerType === 'team') setNewTeamId(tid);
    } catch (err: any) {
      alert(`Failed to create team: ${err?.message || 'Unknown error'}`);
    }
  }

  async function handleGenerateInvite(role: 'editor' | 'viewer') {
    if (!teamModalSlot?.teamId || !currentUser) return;
    try {
      const team = userTeams.find((t) => t.id === teamModalSlot.teamId);
      const token = await createInviteLink(
        teamModalSlot.teamId,
        team?.name || 'Overlay Team',
        role,
        { uid: currentUser.uid, email: currentUser.email || '' }
      );
      setCreatedInviteUrl(`${origin}/invite/${token}`);
    } catch (err: any) {
      alert(`Failed to generate invite: ${err?.message || 'Unknown error'}`);
    }
  }

  // ─── Data Push Config Generators ──────────────────────────────────────────

  async function fetchTournamentStandingsData(slot: OverlaySlot) {
    const cfg = standingsConfig[slot.id!];
    const tournamentId = cfg?.tournamentId;
    const n = cfg?.n ?? 5;
    const type = cfg?.type ?? 'team';

    if (!tournamentId) {
      alert('Please select a tournament first.');
      return;
    }

    try {
      setPushingId(slot.id!);
      setPartialWarning((prev) => ({ ...prev, [slot.id!]: '' }));
      const { results } = await getTopStandings(tournamentId, n, type, cfg?.groupId);

      if (!results || results.length === 0) {
        setPartialWarning((prev) => ({
          ...prev,
          [slot.id!]: `No ${type} data available for this tournament yet.`,
        }));
        return;
      }

      const payload: Record<string, any> = {
        results,
        rows: results,
        teams: results,
        players: results,
        [`${type}s`]: results,
        currentData: {
          results,
          rows: results,
          teams: results,
          players: results,
          [`${type}s`]: results,
        },
      };
      results.forEach((entity: any, i: number) => {
        payload[`${type}${i + 1}`] = entity;
        payload[`row${i + 1}`] = entity;
      });
      if (results[0]) payload[type] = results[0];

      await updateSlotWorkspaceFields(slot, payload);
    } catch (err) {
      console.error('Error fetching standings:', err);
      alert('Failed to load live statistics from Stats API.');
    } finally {
      setPushingId(null);
    }
  }

  async function fetchDailyStandingsData(slot: OverlaySlot) {
    const cfg = dailyConfig[slot.id!];
    const tournamentId = cfg?.tournamentId;
    const day = cfg?.day ?? 1;
    const mode = cfg?.mode ?? 'full_day';
    const lobby = mode === 'single_lobby' && cfg?.lobby !== '' ? Number(cfg.lobby) : undefined;
    const n = cfg?.n ?? 5;

    if (!tournamentId) {
      alert('Please select a tournament first.');
      return;
    }

    try {
      setPushingId(slot.id!);
      const data = await getDailyStandings(tournamentId, day, { lobby, n, groupId: cfg?.groupId });
      const results = data?.results || (Array.isArray(data) ? data : []);
      const payload: Record<string, any> = {
        ...data,
        results,
        rows: results,
        teams: results,
        players: results,
        currentData: data,
      };
      await updateSlotWorkspaceFields(slot, payload);
    } catch (err) {
      console.error('Error fetching daily standings:', err);
      alert('Failed to load daily standings.');
    } finally {
      setPushingId(null);
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Are you sure you want to delete this slot? All live OBS targets will go offline.')) return;
    try {
      await deleteSlot(slotId);
      await loadData();
    } catch (err) {
      console.error('Error deleting slot:', err);
    }
  }

  function handleCopyUrl(slotId: string, publicRenderToken: string) {
    const url = `${origin}/render/${publicRenderToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slotId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ─── Render Slot Controls Form ──────────────────────────────────────────────

  function renderSlotControls(slot: OverlaySlot) {
    const dataShape = slot.dataShapeType;
    const isPushing = pushingId === slot.id;

    if (dataShape === 'top_standings' || dataShape === 'overall_rankings_dual_column' || dataShape === 'top_5_overall' || dataShape === 'hybrid_era_top5') {
      const defaultN = dataShape === 'overall_rankings_dual_column' ? 20 : 5;
      const cfg = standingsConfig[slot.id!] ?? { n: defaultN, type: 'team', tournamentId: '' };
      const warning = partialWarning[slot.id!];

      return (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <span className="slot-control-label" style={{ margin: 0, fontWeight: 600 }}>
            Fetch Tournament Data (Workspace)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px', flex: 2 }}
              value={cfg.tournamentId}
              onChange={(e) => setStandingsConfig((prev) => ({ ...prev, [slot.id!]: { ...cfg, tournamentId: e.target.value } }))}
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px', flex: 1 }}
              value={cfg.groupId || 'all'}
              onChange={(e) => setStandingsConfig((prev) => ({ ...prev, [slot.id!]: { ...cfg, groupId: e.target.value } }))}
            >
              <option value="all">All Groups</option>
              <option value="Qualifiers">Qualifiers</option>
              <option value="Finals">Finals</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => fetchTournamentStandingsData(slot)}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              disabled={isPushing}
            >
              {isPushing ? <Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} /> : <RefreshCw style={{ width: '13px', height: '13px' }} />}
              Update Draft Data
            </button>
          </div>

          {warning && (
            <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: 0 }}>
              ⚠ {warning}
            </p>
          )}
        </div>
      );
    }

    if (dataShape === 'daily_standings') {
      const cfg = dailyConfig[slot.id!] ?? { tournamentId: '', day: 1, mode: 'full_day', lobby: '', n: 5 };
      return (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <span className="slot-control-label" style={{ margin: 0, fontWeight: 600 }}>
            Fetch Daily Standings Data (Workspace)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px', flex: 2 }}
              value={cfg.tournamentId}
              onChange={(e) => setDailyConfig((prev) => ({ ...prev, [slot.id!]: { ...cfg, tournamentId: e.target.value } }))}
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px', flex: 1 }}
              value={cfg.groupId || 'all'}
              onChange={(e) => setDailyConfig((prev) => ({ ...prev, [slot.id!]: { ...cfg, groupId: e.target.value } }))}
            >
              <option value="all">All Groups</option>
              <option value="Qualifiers">Qualifiers</option>
              <option value="Finals">Finals</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => fetchDailyStandingsData(slot)}
              className="btn btn-secondary btn-sm"
              style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              disabled={isPushing}
            >
              {isPushing ? <Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} /> : <RefreshCw style={{ width: '13px', height: '13px' }} />}
              Update Draft Data
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem', width: '24px', height: '24px' }} />
        <p>Loading Live Slot Workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* ── Header Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers style={{ width: '28px', height: '28px', color: '#d946ef' }} />
            <span>Live Broadcast Slots & Workspace</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Manage draft edits, explicit Push to Live actions, scheduled push queues, and team collaboration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Create New Slot</span>
          </button>
        </div>
      </div>

      {/* ── Add Slot Modal/Form ── */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#121218',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Configure New Broadcast Slot</h3>
          <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label className="slot-control-label">Slot Name</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Main Broadcast Standings"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  required
                />
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="slot-control-label">Data Shape</label>
                <select
                  className="select-input"
                  value={newDataShapeType}
                  onChange={(e) => setNewDataShapeType(e.target.value as TemplateType)}
                >
                  <option value="top_standings">Top Standings Table</option>
                  <option value="hybrid_era_top5">Hybrid Era Top 5 Graphic</option>
                  <option value="daily_standings">Daily Standings</option>
                  <option value="overall_rankings_dual_column">Overall Rankings Dual Column</option>
                  <option value="top_5_overall">Top 5 Overall</option>
                  <option value="head_to_head">Head to Head</option>
                  <option value="team_profile">Team Profile</option>
                  <option value="player_profile">Player Profile</option>
                  <option value="custom_media">Custom Media</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="slot-control-label">Ownership Model</label>
                <select
                  className="select-input"
                  value={newOwnerType}
                  onChange={(e) => setNewOwnerType(e.target.value as 'individual' | 'team')}
                >
                  <option value="individual">Individual (Private)</option>
                  <option value="team">Team (Shared Workspace)</option>
                </select>
              </div>
            </div>

            {newOwnerType === 'team' && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="slot-control-label">Select Team</label>
                  <select
                    className="select-input"
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                  >
                    <option value="">-- Choose Existing Team --</option>
                    {userTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Or enter new team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    style={{ width: '220px' }}
                  />
                  <button type="button" onClick={handleCreateTeamSubmit} className="btn btn-secondary btn-sm">
                    Create Team
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Creating Slot...' : 'Create Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Slot Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {slots.map((slot) => {
          const activeTemplate = templates.find((t) => t.id === (slot.workspace?.templateId || slot.assignedTemplateId));
          const publishedTemplate = templates.find((t) => t.id === slot.published?.templateId);
          const hasUnpushedEdits =
            JSON.stringify(slot.workspace?.fields || {}) !== JSON.stringify(slot.published?.fields || {}) ||
            slot.workspace?.templateId !== slot.published?.templateId;

          const onlinePresence = slotPresence[slot.id!] || [];

          return (
            <div
              key={slot.id}
              style={{
                backgroundColor: '#121218',
                border: hasUnpushedEdits ? '1px solid #d946ef' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                boxShadow: hasUnpushedEdits ? '0 0 20px rgba(217,70,239,0.15)' : 'none',
              }}
            >
              {/* Top Row: Title + Ownership + Live Lock Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{slot.name}</h3>
                    {slot.liveLock && (
                      <span title="Live Lock Active" style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                        <Lock style={{ width: '14px', height: '14px' }} />
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 700,
                    }}>
                      Shape: {slot.dataShapeType}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: slot.ownerType === 'team' ? 'rgba(217,70,239,0.15)' : 'rgba(255,255,255,0.06)',
                      color: slot.ownerType === 'team' ? '#d946ef' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      {slot.ownerType === 'team' ? 'Team Shared' : 'Individual'}
                    </span>
                  </div>
                </div>

                {/* Lock Toggle & Actions */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleToggleLiveLock(slot)}
                    title={slot.liveLock ? 'Unlock slot' : 'Lock slot to prevent accidental live pushes'}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: slot.liveLock ? '#ef4444' : 'var(--text-muted)',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {slot.liveLock ? <Lock style={{ width: '12px', height: '12px' }} /> : <Unlock style={{ width: '12px', height: '12px' }} />}
                    <span>{slot.liveLock ? 'Locked' : 'Lock'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(slot.id!)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', color: '#ef4444' }}
                    title="Delete Slot"
                  >
                    <Trash style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>

              {/* Online Presence Avatars Bar */}
              {onlinePresence.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>● Online:</span>
                  {onlinePresence.map((m) => (
                    <span
                      key={m.userId}
                      title={`${m.name} (${m.email})${m.editingField ? ` — editing ${m.editingField}` : ''}`}
                      style={{
                        fontSize: '0.7rem',
                        color: m.editingField ? '#d946ef' : '#fff',
                        fontWeight: 600,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {m.name} {m.editingField ? `✍` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Assigned Visual Template Selector */}
              <div>
                <label className="slot-control-label">Visual Template</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={slot.workspace?.templateId || slot.assignedTemplateId || ''}
                  onChange={(e) => handleAssignTemplate(slot.id!, e.target.value || null)}
                >
                  <option value="">-- No Template Assigned (Blank Output) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.templateType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Config Form */}
              {renderSlotControls(slot)}

              {/* Status Banner: Draft (Workspace) vs Published (Live) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: hasUnpushedEdits ? 'rgba(217,70,239,0.08)' : 'rgba(34,197,94,0.08)',
                border: hasUnpushedEdits ? '1px solid rgba(217,70,239,0.3)' : '1px solid rgba(34,197,94,0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginTop: '4px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: hasUnpushedEdits ? '#d946ef' : '#4ade80',
                      textTransform: 'uppercase',
                    }}>
                      {hasUnpushedEdits ? '● Draft Unpushed Changes' : '✓ Live & In Sync'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Pushed: {slot.published?.pushedBy ? `${slot.published.pushedBy}` : 'Never pushed'}
                  </div>
                </div>

                {/* Explicit Push To Live Button */}
                <button
                  onClick={() => setDiffModalSlot(slot)}
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: hasUnpushedEdits ? '#d946ef' : '#22c55e',
                    borderColor: hasUnpushedEdits ? '#d946ef' : '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 800,
                  }}
                >
                  <Send style={{ width: '13px', height: '13px' }} />
                  <span>Push to Live</span>
                </button>
              </div>

              {/* Bottom Actions: History, Schedule, Invites, OBS Link */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border)',
                paddingTop: '0.75rem',
                marginTop: 'auto',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openHistoryModal(slot)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="View Push History Log & Rollback"
                  >
                    <History style={{ width: '12px', height: '12px' }} />
                    <span>History</span>
                  </button>

                  <button
                    onClick={() => openScheduleModal(slot)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Schedule Future Push Queue"
                  >
                    <Clock style={{ width: '12px', height: '12px' }} />
                    <span>Schedule</span>
                  </button>

                  {slot.ownerType === 'team' && slot.teamId && (
                    <button
                      onClick={() => setTeamModalSlot(slot)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#d946ef' }}
                      title="Manage Team Members & Invites"
                    >
                      <UserPlus style={{ width: '12px', height: '12px' }} />
                      <span>Invite</span>
                    </button>
                  )}
                </div>

                {/* OBS Browser Source Copy Button */}
                <button
                  onClick={() => handleCopyUrl(slot.id!, slot.publicRenderToken)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === slot.id ? <Check style={{ width: '12px', height: '12px', color: '#4ade80' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                  <span>{copiedId === slot.id ? 'Copied!' : 'Copy OBS URL'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── DIFF PREVIEW MODAL ── */}
      {diffModalSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#121218',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send style={{ width: '20px', height: '20px', color: '#d946ef' }} />
              <span>Confirm Push to Live Output</span>
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Review the differences between the current live broadcast output and your new draft workspace state before confirming.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Current Live Output
                </span>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '180px', overflowY: 'auto' }}>
                  {JSON.stringify(diffModalSlot.published?.fields || {}, null, 2)}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(217,70,239,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(217,70,239,0.3)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Proposed New Draft State
                </span>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '180px', overflowY: 'auto' }}>
                  {JSON.stringify(diffModalSlot.workspace?.fields || {}, null, 2)}
                </div>
              </div>
            </div>

            {diffModalSlot.liveLock && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.4)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <ShieldAlert style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} />
                <label style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={liveLockConfirmed}
                    onChange={(e) => setLiveLockConfirmed(e.target.checked)}
                  />
                  <span><strong>Live Lock Active:</strong> I confirm this push is safe for live broadcast.</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setDiffModalSlot(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={confirmPushToLive}
                disabled={Boolean(diffModalSlot.liveLock && !liveLockConfirmed)}
                className="btn btn-primary"
                style={{ backgroundColor: '#d946ef', borderColor: '#d946ef' }}
              >
                Confirm & Push Live Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY LOG & ROLLBACK MODAL ── */}
      {historyModalSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#121218',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History style={{ width: '20px', height: '20px', color: '#d946ef' }} />
              <span>Push History Log & Rollback ({historyModalSlot.name})</span>
            </h3>

            {historyList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No historical pushes recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {historyList.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {entry.pushedByEmail || entry.pushedBy}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {entry.pushedAt?.toDate ? entry.pushedAt.toDate().toLocaleString() : 'Timestamp unavailable'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRollbackItem(entry)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Rollback to This State
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setHistoryModalSlot(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULED PUSH MODAL ── */}
      {scheduleModalSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#121218',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            maxWidth: '550px',
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock style={{ width: '20px', height: '20px', color: '#d946ef' }} />
              <span>Schedule Future Push Queue</span>
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label className="slot-control-label">Select Target Date & Time</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="datetime-local"
                  className="text-input"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button onClick={handleCreateScheduledPush} className="btn btn-primary">
                  Queue Push
                </button>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', margin: '0 0 10px 0', color: 'var(--text-muted)' }}>Pending Queued Pushes</h4>
            {scheduledList.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No pushes currently queued for this slot.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {scheduledList.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>{item.scheduledAt?.toDate ? item.scheduledAt.toDate().toLocaleString() : ''}</strong>
                    </div>
                    <button onClick={() => handleCancelScheduledPush(item.id!)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setScheduleModalSlot(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM INVITE MODAL ── */}
      {teamModalSlot && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#121218',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#d946ef' }} />
              <span>Team Invites & Collaboration</span>
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => handleGenerateInvite('editor')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                Generate Editor Link
              </button>
              <button onClick={() => handleGenerateInvite('viewer')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                Generate Viewer Link
              </button>
            </div>

            {createdInviteUrl && (
              <div style={{ backgroundColor: 'rgba(217,70,239,0.1)', border: '1px solid rgba(217,70,239,0.3)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d946ef', display: 'block', marginBottom: '4px' }}>Invite Link Generated:</span>
                <input type="text" className="text-input" readOnly value={createdInviteUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setTeamModalSlot(null); setCreatedInviteUrl(''); }} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
