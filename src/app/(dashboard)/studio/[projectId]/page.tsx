'use client';

import { useEffect, useState, useCallback, use, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStudioProject, getStudioPlaylists, getStudioPlaylistItems,
  saveStudioPlaylistItem, deleteStudioPlaylistItem,
  pushStudioProjectToLive, rollbackStudioProject,
  getStudioProjectPushHistory, getStudioLiveDocRef,
  getTemplates, getTournaments, updateStudioPlaylistName,
  getBuiltInTemplate,
  StudioProject, StudioPlaylist, StudioPlaylistItem,
  StudioLiveState, StudioPushHistoryEntry, OverlayTemplate,
} from '@/lib/db';
import { trackPresence, subscribeToSlotPresence, PresenceUser } from '@/lib/presence';
import { FieldEditor } from '@/components/editor/FieldEditor';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';

// Template components
import { TopStandings } from '@/components/templates/TopStandings';
import { DailyStandings } from '@/components/templates/DailyStandings';
import { HeadToHead } from '@/components/templates/HeadToHead';
import { TeamProfile } from '@/components/templates/TeamProfile';
import { PlayerProfile } from '@/components/templates/PlayerProfile';
import { CustomMedia } from '@/components/templates/CustomMedia';
import { OverallRankingsDualColumn } from '@/components/templates/OverallRankingsDualColumn';
import { Top5Overall } from '@/components/templates/Top5Overall';
import { HybridEraTop5 } from '@/components/templates/HybridEraTop5';
import { Top5Graphic } from '@/components/templates/Top5Graphic';
import { TeamRosterKillsGraphic } from '@/components/templates/TeamRosterKillsGraphic';
import { FlexibleTop5Graphic } from '@/components/templates/FlexibleTop5Graphic';
import { MatchSummary } from '@/components/templates/MatchSummary';

import {
  ArrowLeft, Clapperboard, Send, Save, History, Copy,
  Check, Loader2, Plus, Trash, RotateCcw, Radio, Eye,
  MonitorPlay, Users as UsersIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ListMusic, X, Pencil,
} from 'lucide-react';

// ─── Template component map ───────────────────────────────────────────────────
const templateComponentMap: Record<string, React.ComponentType<any>> = {
  top_standings: TopStandings,
  overall_rankings_dual_column: OverallRankingsDualColumn,
  top_5_overall: Top5Overall,
  hybrid_era_top5: HybridEraTop5,
  top5_graphic: Top5Graphic,
  daily_standings: DailyStandings,
  head_to_head: HeadToHead,
  team_profile: TeamProfile,
  player_profile: PlayerProfile,
  custom_media: CustomMedia,
  team_roster_kills: TeamRosterKillsGraphic,
  flexible_top5: FlexibleTop5Graphic,
  match_summary: MatchSummary,
};

// ─── Display dimensions ───────────────────────────────────────────────────────
const PREVIEW_W = 392;
const PREVIEW_H = Math.round(PREVIEW_W * (1080 / 1920));
const PREVIEW_SCALE = PREVIEW_W / 1920;

const LIVE_W = 468;
const LIVE_H = Math.round(LIVE_W * (1080 / 1920));
const LIVE_SCALE = LIVE_W / 1920;

// ─── Inline template renderer ─────────────────────────────────────────────────
function InlineRender({
  template,
  fields,
  width,
  height,
  scale,
  label,
  labelColor,
  isLive = false,
}: {
  template: OverlayTemplate | null;
  fields: Record<string, any>;
  width: number;
  height: number;
  scale: number;
  label: string;
  labelColor: string;
  isLive?: boolean;
}) {
  const Component = template ? templateComponentMap[template.templateType] : null;
  const isEmpty = !template;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Screen label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isLive && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444',
            display: 'inline-block',
            animation: 'studio-pulse 2s ease-in-out infinite',
          }} />
        )}
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: labelColor,
        }}>{label}</span>
      </div>

      {/* Canvas wrapper */}
      <div style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '8px',
        border: isLive
          ? '1px solid rgba(239,68,68,0.4)'
          : '1px dashed rgba(255,255,255,0.12)',
        background: '#060609',
        boxShadow: isLive ? '0 0 20px rgba(239,68,68,0.12)' : 'none',
        flexShrink: 0,
      }}>
        {isEmpty ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '8px', color: 'rgba(255,255,255,0.15)',
            fontSize: '0.75rem',
          }}>
            {isLive ? <Radio style={{ width: '24px', height: '24px' }} /> : <Eye style={{ width: '24px', height: '24px' }} />}
            <span>{isLive ? 'Nothing on air' : 'Select a template to preview'}</span>
          </div>
        ) : (
          <div style={{
            width: '1920px',
            height: '1080px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            {template && (
              <style
                dangerouslySetInnerHTML={{
                  __html: `${googleFontsLink(template.styleConfig)}\n${cssVarsForTheme(template.styleConfig)}`,
                }}
              />
            )}
            {Component && <Component data={fields} styleConfig={template!.styleConfig} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Playlist Item Row ────────────────────────────────────────────────────────
function PlaylistItemRow({
  item,
  template,
  isSelected,
  isOnLive,
  onSelect,
  onDelete,
}: {
  item: StudioPlaylistItem;
  template?: OverlayTemplate;
  isSelected: boolean;
  isOnLive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
        border: isSelected
          ? '1px solid rgba(139,92,246,0.4)'
          : '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isSelected ? '#a78bfa' : 'var(--text-primary)',
        }}>
          {template?.name || 'Unknown Template'}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {template?.templateType?.replace(/_/g, ' ')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {isOnLive && (
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '3px',
            background: '#ef4444',
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>LIVE</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px', color: 'rgba(255,255,255,0.3)',
            borderRadius: '4px', transition: 'color 0.15s ease',
            display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)')}
          title="Remove from playlist"
        >
          <X style={{ width: '11px', height: '11px' }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function StudioWorkspace({ params }: PageProps) {
  const { projectId } = use(params);
  const { user } = useAuth();

  // Core data
  const [project, setProject] = useState<StudioProject | null>(null);
  const [playlists, setPlaylists] = useState<StudioPlaylist[]>([]);
  const [playlistItems, setPlaylistItems] = useState<Record<string, StudioPlaylistItem[]>>({});
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [liveState, setLiveState] = useState<StudioLiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // UI state
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewFields, setPreviewFields] = useState<Record<string, any>>({});

  // Actions
  const [pushing, setPushing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedOBS, setCopiedOBS] = useState(false);
  const [origin, setOrigin] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Playlist renaming state
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState('');
  const [renaming, setRenaming] = useState(false);

  function handleStartRename(pl: StudioPlaylist, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingPlaylistId(pl.id!);
    setEditingPlaylistName(pl.name);
  }

  async function handleSaveRename(playlistId: string) {
    if (!editingPlaylistName.trim()) {
      setEditingPlaylistId(null);
      return;
    }
    try {
      setRenaming(true);
      await updateStudioPlaylistName(projectId, playlistId, editingPlaylistName.trim());
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, name: editingPlaylistName.trim() } : p))
      );
    } catch (err: any) {
      alert(`Rename failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setRenaming(false);
      setEditingPlaylistId(null);
    }
  }

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<StudioPushHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Presence
  const [presence, setPresence] = useState<PresenceUser[]>([]);

  // Helper to resolve virtual built-in templates
  const resolveTemplate = (idOrType: string | null) => {
    if (!idOrType) return null;
    const found = templates.find((t) => t.id === idOrType);
    if (found) return found;
    return getBuiltInTemplate(idOrType);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const previewTemplate = useMemo(
    () => resolveTemplate(previewTemplateId),
    [templates, previewTemplateId]
  );

  const liveTemplate = useMemo(
    () => resolveTemplate(liveState?.templateId || null),
    [templates, liveState?.templateId]
  );

  const activeItems = useMemo(
    () => (activePlaylistId ? playlistItems[activePlaylistId] || [] : []),
    [activePlaylistId, playlistItems]
  );

  // Check if a playlist item matches live exactly
  const isItemOnLive = useCallback(
    (item: StudioPlaylistItem): boolean => {
      if (!liveState?.templateId) return false;
      return (
        item.templateId === liveState.templateId &&
        JSON.stringify(item.fields) === JSON.stringify(liveState.fields)
      );
    },
    [liveState]
  );

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [proj, pls, tmplts, tournamentsList] = await Promise.all([
          getStudioProject(projectId),
          getStudioPlaylists(projectId),
          getTemplates(),
          getTournaments(),
        ]);
        if (!proj) return;
        setTournaments(tournamentsList);
        setProject(proj);
        setTemplates(tmplts);

        // Sort by slotNumber
        const sorted = [...pls].sort((a, b) => a.slotNumber - b.slotNumber);
        setPlaylists(sorted);

        // Set active playlist to first
        if (sorted.length > 0) {
          const firstId = sorted[0].id!;
          setActivePlaylistId(firstId);
          // Load items for all playlists
          const itemsMap: Record<string, StudioPlaylistItem[]> = {};
          await Promise.all(
            sorted.map(async (pl) => {
              const items = await getStudioPlaylistItems(projectId, pl.id!);
              itemsMap[pl.id!] = items;
            })
          );
          setPlaylistItems(itemsMap);
        }
      } catch (err) {
        console.error('Failed to init studio workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [projectId]);

  // ── Real-time live state listener ──────────────────────────────────────────
  useEffect(() => {
    const liveRef = getStudioLiveDocRef(projectId);
    const unsub = onSnapshot(liveRef, (snap) => {
      if (snap.exists()) {
        setLiveState(snap.data() as StudioLiveState);
      } else {
        setLiveState(null);
      }
    });
    return () => unsub();
  }, [projectId]);

  // ── Presence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !projectId) return;
    const cleanPresence = trackPresence(projectId, { uid: user.uid, email: user.email || '' });
    const unsubPresence = subscribeToSlotPresence(projectId, setPresence);
    return () => {
      cleanPresence();
      unsubPresence();
    };
  }, [user, projectId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSelectItem(item: StudioPlaylistItem) {
    setSelectedItemId(item.id!);
    setPreviewTemplateId(item.templateId);
    setPreviewFields(item.fields);
  }

  async function handleSaveToPlaylist() {
    if (!activePlaylistId || !previewTemplateId) {
      alert('Select a template and a playlist slot before saving.');
      return;
    }
    try {
      setSaving(true);
      const currentItems = playlistItems[activePlaylistId] || [];
      const maxOrder = currentItems.reduce((m, i) => Math.max(m, i.order), 0);
      const item: Omit<StudioPlaylistItem, 'id'> = {
        templateId: previewTemplateId,
        fields: previewFields,
        order: selectedItemId
          ? (currentItems.find((i) => i.id === selectedItemId)?.order ?? maxOrder)
          : maxOrder + 1,
      };
      const savedId = await saveStudioPlaylistItem(projectId, activePlaylistId, item, selectedItemId || undefined);

      // Refresh items for this playlist
      const updated = await getStudioPlaylistItems(projectId, activePlaylistId);
      setPlaylistItems((prev) => ({ ...prev, [activePlaylistId]: updated }));
      setSelectedItemId(savedId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1800);
    } catch (err: any) {
      alert(`Save failed: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handlePushToLive() {
    if (!previewTemplateId || !user) {
      alert('Select a template in Preview before pushing to live.');
      return;
    }
    try {
      setPushing(true);
      await pushStudioProjectToLive(
        projectId,
        previewTemplateId,
        previewFields,
        { uid: user.uid, email: user.email || '' }
      );
      // liveState updates via onSnapshot
    } catch (err: any) {
      alert(`Push failed: ${err?.message}`);
    } finally {
      setPushing(false);
    }
  }

  async function handleDeleteItem(playlistId: string, itemId: string) {
    if (!confirm('Remove this item from the playlist?')) return;
    try {
      await deleteStudioPlaylistItem(projectId, playlistId, itemId);
      const updated = await getStudioPlaylistItems(projectId, playlistId);
      setPlaylistItems((prev) => ({ ...prev, [playlistId]: updated }));
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err?.message}`);
    }
  }

  async function openHistory() {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const hist = await getStudioProjectPushHistory(projectId);
      setHistoryList(hist);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleRollback(entry: StudioPushHistoryEntry) {
    if (!confirm('Rollback the live output to this historical state?')) return;
    if (!user) return;
    try {
      setRollingBack(true);
      await rollbackStudioProject(
        projectId,
        entry.snapshot,
        { uid: user.uid, email: user.email || '' }
      );
      setShowHistory(false);
    } catch (err: any) {
      alert(`Rollback failed: ${err?.message}`);
    } finally {
      setRollingBack(false);
    }
  }

  function handleCopyOBS() {
    if (!project) return;
    navigator.clipboard.writeText(`${origin}/studio-render/${project.id}`);
    setCopiedOBS(true);
    setTimeout(() => setCopiedOBS(false), 2000);
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const panelHeader: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: '0.75rem',
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 74px)', gap: '0.75rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" style={{ width: '22px', height: '22px' }} />
        <span>Loading Studio Room…</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Project not found.</p>
        <Link href="/studio" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>← Back to Studio Room</Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Pulse animation */}
      <style>{`
        @keyframes studio-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 74px)', overflow: 'hidden' }}>

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/studio"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)')}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Studio Room
            </Link>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clapperboard style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{project.name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Presence */}
            {presence.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>● Online:</span>
                {presence.slice(0, 4).map((m) => (
                  <span
                    key={m.userId}
                    title={`${m.name} (${m.email})${m.editingField ? ` — editing ${m.editingField}` : ''}`}
                    style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      background: m.editingField ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)',
                      color: m.editingField ? '#a78bfa' : 'var(--text-muted)',
                      padding: '2px 7px', borderRadius: '4px',
                    }}
                  >
                    {m.name}{m.editingField ? ' ✍' : ''}
                  </span>
                ))}
                {presence.length > 4 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{presence.length - 4}</span>}
              </div>
            )}

            <button
              onClick={openHistory}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
            >
              <History style={{ width: '13px', height: '13px' }} />
              History
            </button>

            <button
              onClick={handleCopyOBS}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: copiedOBS ? '#4ade80' : undefined }}
            >
              {copiedOBS ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
              {copiedOBS ? 'Copied!' : 'Copy OBS URL'}
            </button>
          </div>
        </div>

        {/* ── 3-Column Workspace ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '256px 1fr 504px',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}>

          {/* ── LEFT: Playlist Sidebar ── */}
          <div style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(8,8,12,0.6)',
          }}>
            {/* Playlist tabs */}
            <div style={{
              padding: '12px 12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              paddingBottom: '10px',
              flexShrink: 0,
            }}>
              <div style={panelHeader}>
                <ListMusic style={{ width: '11px', height: '11px', display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Playlists
              </div>
              {playlists.map((pl) => {
                const isActive = pl.id === activePlaylistId;
                const isEditing = pl.id === editingPlaylistId;
                const items = playlistItems[pl.id!] || [];

                if (isEditing) {
                  return (
                    <div
                      key={pl.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 6px',
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.4)',
                        borderRadius: '7px',
                      }}
                    >
                      <input
                        type="text"
                        value={editingPlaylistName}
                        onChange={(e) => setEditingPlaylistName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(pl.id!);
                          if (e.key === 'Escape') setEditingPlaylistId(null);
                        }}
                        autoFocus
                        className="text-input"
                        style={{
                          fontSize: '0.8rem',
                          padding: '3px 6px',
                          height: '26px',
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(pl.id!)}
                        disabled={renaming}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: '#4ade80',
                          display: 'flex',
                        }}
                        title="Save Name"
                      >
                        <Check style={{ width: '13px', height: '13px' }} />
                      </button>
                      <button
                        onClick={() => setEditingPlaylistId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: 'var(--text-muted)',
                          display: 'flex',
                        }}
                        title="Cancel"
                      >
                        <X style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={pl.id}
                    onClick={() => setActivePlaylistId(pl.id!)}
                    style={{
                      background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                      borderRadius: '7px',
                      padding: '7px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      transition: 'all 0.15s ease',
                      color: isActive ? '#a78bfa' : 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '6px' }}>
                      {pl.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => handleStartRename(pl, e)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '2px', color: 'rgba(255,255,255,0.3)',
                          borderRadius: '4px', display: 'inline-flex',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#a78bfa')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)')}
                        title="Rename playlist"
                      >
                        <Pencil style={{ width: '11px', height: '11px' }} />
                      </button>
                      <span style={{
                        fontSize: '0.65rem',
                        background: isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        color: isActive ? '#a78bfa' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}>{items.length}</span>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Playlist items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {activeItems.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
                  No items yet.<br />
                  <span style={{ fontSize: '0.72rem' }}>Configure the Preview &amp; click<br />"Save to Playlist"</span>
                </div>
              ) : (
                activeItems.map((item) => (
                  <PlaylistItemRow
                    key={item.id}
                    item={item}
                    template={templates.find((t) => t.id === item.templateId)}
                    isSelected={selectedItemId === item.id}
                    isOnLive={isItemOnLive(item)}
                    onSelect={() => handleSelectItem(item)}
                    onDelete={() => handleDeleteItem(activePlaylistId!, item.id!)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── CENTER: Preview + Editor ── */}
          <div style={{
            overflowY: 'auto',
            padding: '1.25rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-secondary)',
          }}>

            {/* Preview Screen */}
            <InlineRender
              template={previewTemplate}
              fields={previewFields}
              width={PREVIEW_W}
              height={PREVIEW_H}
              scale={PREVIEW_SCALE}
              label="Preview Screen"
              labelColor="var(--text-muted)"
              isLive={false}
            />

            {/* Preview Page Controls — ONLY shown when Flexible Top 5 is active in Preview */}
            {previewTemplate?.templateType === 'flexible_top5' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '-4px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Preview Page:</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', background: 'rgba(168,85,247,0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                    {previewFields.page || 1}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={(previewFields.page || 1) <= 1}
                    onClick={() => setPreviewFields((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: (previewFields.page || 1) <= 1 ? 'not-allowed' : 'pointer',
                      opacity: (previewFields.page || 1) <= 1 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev Page (Preview)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFields((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(168,85,247,0.3)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Next Page (Preview) <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="slot-control-label" style={{ marginBottom: '6px' }}>Visual Template</label>
              <select
                className="select-input"
                value={previewTemplateId || ''}
                onChange={(e) => {
                  setPreviewTemplateId(e.target.value || null);
                  setPreviewFields({});
                  setSelectedItemId(null);
                }}
              >
                <option value="">— Select Template —</option>
                <optgroup label="✨ Default Built-in Templates">
                  <option value="built-in:team_roster_kills">Team Roster Kill Cards (Default)</option>
                  <option value="built-in:flexible_top5">Flexible Top 5 Standings (Default)</option>
                  <option value="built-in:match_summary">Match Summary (Default)</option>
                </optgroup>
                <optgroup label="📁 Saved Templates Library">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.templateType})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Field Editor */}
            {previewTemplate && (
              <div style={{
                background: 'rgba(10,10,16,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '1rem',
              }}>
                <div style={{ ...panelHeader, marginBottom: '10px' }}>Fetch Data & Live Controls</div>
                <FieldEditor
                  templateType={previewTemplate.templateType}
                  tournaments={tournaments}
                  fields={previewFields}
                  onFieldsChange={(updated: Record<string, any>) => setPreviewFields(updated)}
                  onFetched={(fetchedFields) => setPreviewFields((prev) => ({ ...prev, ...fetchedFields }))}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveToPlaylist}
                disabled={saving || !previewTemplateId || !activePlaylistId}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center', minWidth: '140px' }}
              >
                {saving ? (
                  <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                ) : saveSuccess ? (
                  <Check style={{ width: '14px', height: '14px', color: '#4ade80' }} />
                ) : (
                  <Save style={{ width: '14px', height: '14px' }} />
                )}
                <span>{saveSuccess ? 'Saved!' : selectedItemId ? 'Update in Playlist' : 'Save to Playlist'}</span>
              </button>

              <button
                onClick={handlePushToLive}
                disabled={pushing || !previewTemplateId}
                className="btn btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  flex: 1, justifyContent: 'center', minWidth: '160px',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  borderColor: '#dc2626',
                  boxShadow: '0 0 20px rgba(239,68,68,0.25)',
                }}
              >
                {pushing ? (
                  <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Send style={{ width: '14px', height: '14px' }} />
                )}
                <span>{pushing ? 'Pushing…' : 'Push to Livestream'}</span>
              </button>
            </div>

            {/* Push context hint */}
            {selectedItemId && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Editing playlist item. Pushing to Livestream does not require saving to playlist first.
              </p>
            )}
          </div>

          {/* ── RIGHT: Live Screen ── */}
          <div style={{
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'rgba(6,6,10,0.7)',
          }}>

            <InlineRender
              template={liveTemplate}
              fields={liveState?.fields || {}}
              width={LIVE_W}
              height={LIVE_H}
              scale={LIVE_SCALE}
              label="Live Output"
              labelColor="#ef4444"
              isLive={true}
            />

            {/* Live Page Controls — ONLY shown when Flexible Top 5 is active on Live Output */}
            {liveTemplate?.templateType === 'flexible_top5' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '-4px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Live Page (ON AIR):</span>
                  <span style={{ fontSize: '0.85rem', color: '#fff', background: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>
                    {liveState?.fields?.page || 1}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={(liveState?.fields?.page || 1) <= 1 || pushing}
                    onClick={async () => {
                      if (!liveState?.templateId || !user) return;
                      const currentPage = liveState.fields?.page || 1;
                      const targetPage = Math.max(1, currentPage - 1);
                      try {
                        setPushing(true);
                        await pushStudioProjectToLive(
                          projectId,
                          liveState.templateId,
                          { ...liveState.fields, page: targetPage },
                          { uid: user.uid, email: user.email || '' }
                        );
                      } catch (err: any) {
                        alert(`Page update failed: ${err?.message}`);
                      } finally {
                        setPushing(false);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: ((liveState?.fields?.page || 1) <= 1 || pushing) ? 'not-allowed' : 'pointer',
                      opacity: ((liveState?.fields?.page || 1) <= 1 || pushing) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev Page (Live)
                  </button>
                  <button
                    type="button"
                    disabled={pushing}
                    onClick={async () => {
                      if (!liveState?.templateId || !user) return;
                      const currentPage = liveState.fields?.page || 1;
                      const targetPage = currentPage + 1;
                      try {
                        setPushing(true);
                        await pushStudioProjectToLive(
                          projectId,
                          liveState.templateId,
                          { ...liveState.fields, page: targetPage },
                          { uid: user.uid, email: user.email || '' }
                        );
                      } catch (err: any) {
                        alert(`Page update failed: ${err?.message}`);
                      } finally {
                        setPushing(false);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ef4444',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: pushing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Next Page (Live) <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Live state info */}
            {liveState?.templateId && (
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  On Air
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {liveTemplate?.name || 'Unknown template'}
                </div>
                {liveState.pushedBy && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Pushed by {liveState.pushedBy}
                    {liveState.pushedAt?.toDate && ` · ${liveState.pushedAt.toDate().toLocaleTimeString()}`}
                  </div>
                )}
              </div>
            )}

            {/* Load live into preview */}
            {liveState?.templateId && (
              <button
                onClick={() => {
                  setPreviewTemplateId(liveState.templateId);
                  setPreviewFields(liveState.fields || {});
                  setSelectedItemId(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
              >
                <MonitorPlay style={{ width: '12px', height: '12px' }} />
                Load Live into Preview
              </button>
            )}

            {/* OBS Source Link info */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                OBS Browser Source
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.45)',
                wordBreak: 'break-all',
                lineHeight: 1.5,
              }}>
                {origin}/studio-render/{project.id}
              </div>
              <button
                onClick={handleCopyOBS}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: copiedOBS ? '#4ade80' : undefined }}
              >
                {copiedOBS ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                {copiedOBS ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORY MODAL ── */}
      {showHistory && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#121218',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            maxWidth: '620px', width: '100%',
            padding: '24px',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                Push History &amp; Rollback
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                Loading history…
              </div>
            ) : historyList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pushes recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {historyList.map((entry, i) => {
                  const tmpl = templates.find((t) => t.id === entry.snapshot.templateId);
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: i === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                        border: i === 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {i === 0 && <span style={{ fontSize: '0.6rem', background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>CURRENT</span>}
                          {tmpl?.name || entry.snapshot.templateId || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {entry.pushedByEmail || entry.pushedBy} · {entry.pushedAt?.toDate ? entry.pushedAt.toDate().toLocaleString() : '—'}
                        </div>
                      </div>
                      {i > 0 && (
                        <button
                          onClick={() => handleRollback(entry)}
                          disabled={rollingBack}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                        >
                          {rollingBack ? <Loader2 className="animate-spin" style={{ width: '12px', height: '12px' }} /> : <RotateCcw style={{ width: '12px', height: '12px' }} />}
                          Rollback
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowHistory(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
