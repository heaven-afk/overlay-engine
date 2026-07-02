'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getSlots, getTemplates, saveSlot, deleteSlot,
  getTournaments,
  OverlaySlot, OverlayTemplate,
} from '@/lib/db';
import {
  getTopStandings,
  getGlobalRankings,
  getProfile,
  compareEntities,
} from '@/lib/statsApi';
import {
  Layers, Plus, Link as LinkIcon, Check, Copy,
  Trash, Send, Loader2, Users, User, RefreshCw,
} from 'lucide-react';

// ─── Per-slot configuration state shapes ─────────────────────────────────────

interface StandingsConfig {
  n: number;
  type: 'team' | 'player';
  tournamentId: string;
}

interface H2HConfig {
  idA: string;
  idB: string;
  scopeTournamentId: string; // '' = career-wide
}

interface PlayerCardConfig {
  playerId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlotsDashboard() {
  const [slots, setSlots] = useState<OverlaySlot[]>([]);
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Slot form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotType, setNewSlotType] = useState<'single_team' | 'standings_table' | 'head_to_head' | 'player_card'>('single_team');
  const [creating, setCreating] = useState(false);

  // Push status
  const [pushingId, setPushingId] = useState<string | null>(null);

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Origin for browser links
  const [origin, setOrigin] = useState('');

  // Per-slot configuration state
  const [standingsConfig, setStandingsConfig] = useState<Record<string, StandingsConfig>>({});
  const [h2hConfig, setH2HConfig] = useState<Record<string, H2HConfig>>({});
  const [playerCardConfig, setPlayerCardConfig] = useState<Record<string, PlayerCardConfig>>({});

  // Global pickers data (loaded once, reused across all H2H and player-card slots)
  const [globalTeams, setGlobalTeams] = useState<any[]>([]);
  const [globalPlayers, setGlobalPlayers] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Partial-result warnings keyed by slot id
  const [partialWarning, setPartialWarning] = useState<Record<string, string>>({});

  useEffect(() => {
    setOrigin(window.location.origin);
    loadData();
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

  // Lazily fetch global rankings for H2H and player-card pickers
  async function ensurePickerData() {
    if (globalTeams.length > 0 || globalPlayers.length > 0) return;
    try {
      setPickerLoading(true);
      const [teamsRes, playersRes] = await Promise.all([
        getGlobalRankings('team', 100),
        getGlobalRankings('player', 200),
      ]);
      setGlobalTeams(teamsRes.results ?? []);
      setGlobalPlayers(playersRes.results ?? []);
    } catch (err) {
      console.error('Failed to load global rankings for pickers:', err);
    } finally {
      setPickerLoading(false);
    }
  }

  // Securely generate a random, unguessable render token
  function generateToken() {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (dec) => dec.toString(16).padStart(2, '0')).join('');
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlotName.trim()) return;

    try {
      setCreating(true);
      const newSlot: Omit<OverlaySlot, 'id'> = {
        name: newSlotName,
        slotType: newSlotType,
        assignedTemplateId: null,
        currentData: null,
        publicRenderToken: generateToken(),
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
      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: templateId || null,
        currentData: slot.currentData,
        publicRenderToken: slot.publicRenderToken,
      };
      await saveSlot(updatedSlot, slotId);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, assignedTemplateId: templateId } : s))
      );
    } catch (err) {
      console.error('Error assigning template:', err);
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

  // ─── PART 3 — Standings push (team or player, configurable N) ──────────────

  async function pushTournamentStandings(slot: OverlaySlot) {
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

      const { results } = await getTopStandings(tournamentId, n, type);

      if (!results || results.length === 0) {
        setPartialWarning((prev) => ({
          ...prev,
          [slot.id!]: `No ${type} data available for this tournament yet.`,
        }));
        return;
      }

      if (results.length < n) {
        setPartialWarning((prev) => ({
          ...prev,
          [slot.id!]: `Only ${results.length} of ${n} requested ${type}s have data yet.`,
        }));
      }

      // Build payload: indexed entities + convenience aliases
      const payload: Record<string, any> = { [`${type}s`]: results };
      results.forEach((entity: any, i: number) => {
        payload[`${type}${i + 1}`] = entity;
      });
      if (results[0]) payload[type] = results[0];

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: payload,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, currentData: payload } : s)));
    } catch (err) {
      console.error('Error pushing standings:', err);
      alert('Failed to push live statistics. Check that the Stats API is reachable and the API key is configured.');
    } finally {
      setPushingId(null);
    }
  }

  // ─── PART 5 — Head to Head push ─────────────────────────────────────────────

  async function pushHeadToHead(slot: OverlaySlot) {
    const cfg = h2hConfig[slot.id!];
    if (!cfg?.idA || !cfg?.idB) {
      alert('Please select both Team A and Team B.');
      return;
    }
    if (cfg.idA === cfg.idB) {
      alert('Team A and Team B must be different.');
      return;
    }

    try {
      setPushingId(slot.id!);

      const data = await compareEntities(
        'team',
        cfg.idA,
        cfg.idB,
        cfg.scopeTournamentId || undefined
      );

      // Normalise: the API returns teamA/teamB or may return them under other keys
      const payload = {
        teamA: data.teamA ?? data.playerA ?? {},
        teamB: data.teamB ?? data.playerB ?? {},
        scope: data.scope ?? { type: cfg.scopeTournamentId ? 'tournament' : 'career' },
      };

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: payload,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, currentData: payload } : s)));
    } catch (err) {
      console.error('Error pushing H2H:', err);
      alert('Failed to push Head to Head data. Check that the Stats API is reachable and both team IDs exist.');
    } finally {
      setPushingId(null);
    }
  }

  // ─── PART 6 — Player Card push ───────────────────────────────────────────────

  async function pushPlayerCard(slot: OverlaySlot) {
    const cfg = playerCardConfig[slot.id!];
    if (!cfg?.playerId) {
      alert('Please select a player first.');
      return;
    }

    try {
      setPushingId(slot.id!);

      const { profile, careerStats } = await getProfile('player', cfg.playerId);
      const payload = { player: { ...profile, careerStats } };

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: payload,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, currentData: payload } : s)));
    } catch (err) {
      console.error('Error pushing player card:', err);
      alert('Failed to push Player Card data. Check that the Stats API is reachable and the player ID exists.');
    } finally {
      setPushingId(null);
    }
  }

  // ─── Clear data ───────────────────────────────────────────────────────────────

  async function clearSlotData(slot: OverlaySlot) {
    try {
      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: null,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, currentData: null } : s))
      );
    } catch (err) {
      console.error('Error clearing data:', err);
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Helper — set standings config for a slot ────────────────────────────────

  function updateStandingsConfig(slotId: string, patch: Partial<StandingsConfig>) {
    const defaults: StandingsConfig = { n: 5, type: 'team', tournamentId: '' };
    setStandingsConfig((prev) => ({
      ...prev,
      [slotId]: { ...defaults, ...prev[slotId], ...patch },
    }));
  }

  function updateH2HConfig(slotId: string, patch: Partial<H2HConfig>) {
    const defaults: H2HConfig = { idA: '', idB: '', scopeTournamentId: '' };
    setH2HConfig((prev) => ({
      ...prev,
      [slotId]: { ...defaults, ...prev[slotId], ...patch },
    }));
  }

  function updatePlayerCardConfig(slotId: string, patch: Partial<PlayerCardConfig>) {
    const defaults: PlayerCardConfig = { playerId: '' };
    setPlayerCardConfig((prev) => ({
      ...prev,
      [slotId]: { ...defaults, ...prev[slotId], ...patch },
    }));
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────

  function renderPushControls(slot: OverlaySlot) {
    const isPushing = pushingId === slot.id;

    if (slot.slotType === 'standings_table' || slot.slotType === 'single_team') {
      const cfg = standingsConfig[slot.id!] ?? { n: 5, type: 'team', tournamentId: '' };
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
            Push Live Tournament Data
          </span>

          {/* Tournament picker */}
          <select
            className="select-input"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            value={cfg.tournamentId}
            onChange={(e) => updateStandingsConfig(slot.id!, { tournamentId: e.target.value })}
          >
            <option value="">-- Choose Tournament --</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* N + type controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Top</span>
              <input
                type="number"
                min={1}
                max={20}
                value={cfg.n}
                onChange={(e) => updateStandingsConfig(slot.id!, { n: Math.max(1, Number(e.target.value)) })}
                style={{
                  width: '48px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.8rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  textAlign: 'center',
                }}
              />
            </div>

            <select
              className="select-input"
              style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem', height: '28px', flex: 1 }}
              value={cfg.type}
              onChange={(e) => updateStandingsConfig(slot.id!, { type: e.target.value as 'team' | 'player' })}
            >
              <option value="team">Teams</option>
              <option value="player">Players</option>
            </select>

            <button
              onClick={() => pushTournamentStandings(slot)}
              className="btn btn-primary btn-sm"
              style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              disabled={isPushing}
            >
              {isPushing ? (
                <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send style={{ width: '13px', height: '13px' }} />
              )}
              Push
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

    if (slot.slotType === 'head_to_head') {
      const cfg = h2hConfig[slot.id!] ?? { idA: '', idB: '', scopeTournamentId: '' };

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="slot-control-label" style={{ margin: 0, fontWeight: 600 }}>
              Head to Head
            </span>
            {pickerLoading && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Loader2 style={{ width: '11px', height: '11px', animation: 'spin 1s linear infinite' }} />
                Loading teams…
              </span>
            )}
          </div>

          {/* Team A picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Team A</span>
            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={cfg.idA}
              onFocus={ensurePickerData}
              onChange={(e) => updateH2HConfig(slot.id!, { idA: e.target.value })}
            >
              <option value="">-- Select Team A --</option>
              {globalTeams.map((t: any) => (
                <option key={t.teamId ?? t.id} value={t.teamId ?? t.id}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>

          {/* Team B picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Team B</span>
            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={cfg.idB}
              onFocus={ensurePickerData}
              onChange={(e) => updateH2HConfig(slot.id!, { idB: e.target.value })}
            >
              <option value="">-- Select Team B --</option>
              {globalTeams
                .filter((t: any) => (t.teamId ?? t.id) !== cfg.idA)
                .map((t: any) => (
                  <option key={t.teamId ?? t.id} value={t.teamId ?? t.id}>
                    {t.teamName}
                  </option>
                ))}
            </select>
          </div>

          {/* Optional tournament scope */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Scope to Tournament <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — leave blank for career)</span>
            </span>
            <select
              className="select-input"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={cfg.scopeTournamentId}
              onChange={(e) => updateH2HConfig(slot.id!, { scopeTournamentId: e.target.value })}
            >
              <option value="">Career (all tournaments)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => pushHeadToHead(slot)}
            className="btn btn-primary btn-sm"
            style={{ height: '32px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}
            disabled={isPushing || !cfg.idA || !cfg.idB}
          >
            {isPushing ? (
              <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Users style={{ width: '13px', height: '13px' }} />
            )}
            Push Comparison
          </button>
        </div>
      );
    }

    if (slot.slotType === 'player_card') {
      const cfg = playerCardConfig[slot.id!] ?? { playerId: '' };

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="slot-control-label" style={{ margin: 0, fontWeight: 600 }}>
              Player Card
            </span>
            {pickerLoading && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Loader2 style={{ width: '11px', height: '11px', animation: 'spin 1s linear infinite' }} />
                Loading players…
              </span>
            )}
          </div>

          <select
            className="select-input"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            value={cfg.playerId}
            onFocus={ensurePickerData}
            onChange={(e) => updatePlayerCardConfig(slot.id!, { playerId: e.target.value })}
          >
            <option value="">-- Select Player --</option>
            {globalPlayers.map((p: any) => (
              <option key={p.playerId ?? p.id} value={p.playerId ?? p.id}>
                {p.ign ?? p.professionalName ?? p.playerId ?? p.id}
                {p.teamName ? ` (${p.teamName})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => pushPlayerCard(slot)}
            className="btn btn-primary btn-sm"
            style={{ height: '32px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}
            disabled={isPushing || !cfg.playerId}
          >
            {isPushing ? (
              <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <User style={{ width: '13px', height: '13px' }} />
            )}
            Push Player Card
          </button>
        </div>
      );
    }

    return null;
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>Live Slots Management</h1>
          <p className="page-description" style={{ margin: 0 }}>
            Assign templates to broadcast channels and grab OBS Browser Source URLs.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Slot
        </button>
      </div>

      {/* INLINE NEW SLOT FORM */}
      {showAddForm && (
        <form
          onSubmit={handleCreateSlot}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div className="property-field" style={{ flexGrow: 1, minWidth: '240px' }}>
            <span className="slot-control-label">Slot Name</span>
            <input
              type="text"
              className="text-input"
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              placeholder="e.g. Daily Standings Overlay, Match Head-to-Head"
              required
            />
          </div>

          <div className="property-field" style={{ minWidth: '180px' }}>
            <span className="slot-control-label">Data Shape Type</span>
            <select
              className="select-input"
              value={newSlotType}
              onChange={(e: any) => setNewSlotType(e.target.value)}
            >
              <option value="single_team">Single Team Card</option>
              <option value="standings_table">Standings Table</option>
              <option value="head_to_head">Head to Head</option>
              <option value="player_card">Player Card</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Save Slot'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading slots...</span>
        </div>
      ) : slots.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-glass)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <Layers style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: 'rgba(255,255,255,0.1)' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Active Slots</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Create a slot mapping to bind templates with live stream data feeds.</p>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus style={{ width: '18px', height: '18px' }} />
            Create First Slot
          </button>
        </div>
      ) : (
        <div className="slot-list">
          {slots.map((slot) => {
            const renderUrl = `${origin}/render/${slot.publicRenderToken}`;
            const isCopied = copiedId === slot.id;

            return (
              <div key={slot.id} className="slot-card">
                <div className="slot-header">
                  <div className="slot-title-group">
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit' }}>{slot.name}</h3>
                    <span className="slot-badge">
                      {slot.slotType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot.id!)}
                    className="element-action-btn"
                    style={{ color: '#ef4444' }}
                    title="Delete Slot"
                  >
                    <Trash style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>

                <div className="slot-grid">
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Template assignment */}
                    <div className="slot-control-group">
                      <span className="slot-control-label">Assigned Template</span>
                      <select
                        className="select-input"
                        value={slot.assignedTemplateId || ''}
                        onChange={(e) => handleAssignTemplate(slot.id!, e.target.value || null)}
                      >
                        <option value="">-- No template assigned (blank overlay) --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.canvasWidth}x{t.canvasHeight})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* OBS URL */}
                    <div className="slot-control-group">
                      <span className="slot-control-label">OBS Browser Source URL</span>
                      <div className="copy-url-box">
                        <div className="copy-url-text">{renderUrl}</div>
                        <button
                          onClick={() => copyToClipboard(renderUrl, slot.id!)}
                          className="copy-url-btn"
                          title="Copy Link"
                        >
                          {isCopied ? (
                            <Check style={{ width: '14px', height: '14px', color: '#10b981' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Paste this URL directly into OBS Studio with dimensions matching the template.
                      </span>
                    </div>

                    {/* Push controls — varies by slot type */}
                    {renderPushControls(slot)}

                    {/* Clear data */}
                    {slot.currentData && (
                      <button
                        onClick={() => clearSlotData(slot)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.45rem 0.75rem', alignSelf: 'flex-start' }}
                      >
                        Clear Data
                      </button>
                    )}
                  </div>

                  {/* Right Column: Live Data Payload preview */}
                  <div className="slot-control-group">
                    <span className="slot-control-label">Live Data Stream Preview</span>
                    {slot.currentData ? (
                      <pre className="preview-json-box" style={{ maxHeight: '315px' }}>
                        {JSON.stringify(slot.currentData, null, 2)}
                      </pre>
                    ) : (
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        height: '240px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                      }}>
                        Waiting for live broadcast push...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
