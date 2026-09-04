'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getControlRoomMainRef,
  initControlRoomMainIfNotExists,
  addControlRoomSource,
  deleteControlRoomSource,
  updateControlRoomSourceName,
  pushControlRoomSourceLive,
  updateControlRoomBroadcastAll,
  fanOutBroadcastAllToSources,
  getTemplates,
  getTournaments,
  getBuiltInTemplate,
  ControlRoomMainDoc,
  ControlRoomSource,
  OverlayTemplate,
  StudioLiveState,
} from '@/lib/db';
import { FieldEditor } from '@/components/editor/FieldEditor';
import { templateComponentMap } from '@/components/overlay/LiveOverlayRenderer';
import { googleFontsLink, cssVarsForTheme } from '@/lib/fonts';
import {
  Radio,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Tv,
  Cast,
  Pencil,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Send,
  Sparkles,
  Eye,
  Maximize2,
  X,
  Layers,
  MonitorPlay,
} from 'lucide-react';

// Mini preview dimensions
const CARD_PREVIEW_W = 340;
const CARD_PREVIEW_H = Math.round(CARD_PREVIEW_W * (1080 / 1920));
const CARD_PREVIEW_SCALE = CARD_PREVIEW_W / 1920;

// ── Mini inline template renderer with Preview / Program support ─────────────
function MiniRender({
  template,
  fields,
  isLive = false,
  mode = 'preview',
  onExpand,
  emptyMessage,
}: {
  template: OverlayTemplate | null;
  fields: Record<string, any>;
  isLive?: boolean;
  mode?: 'preview' | 'program';
  onExpand?: () => void;
  emptyMessage?: string;
}) {
  const Component = template ? templateComponentMap[template.templateType] : null;
  const isMgl = template?.templateType === 'mgl_yt_livestanding' || template?.templateType === 'player_stats_vertical';
  const targetW = isMgl ? 434 : 1920;
  const targetH = isMgl ? 724 : 1080;
  const fitScale = isMgl
    ? Math.min(CARD_PREVIEW_W / targetW, CARD_PREVIEW_H / targetH)
    : CARD_PREVIEW_SCALE;

  const isProgramMode = mode === 'program' || isLive;
  const borderColor = isProgramMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(168, 85, 247, 0.5)';
  const badgeColor = isProgramMode ? '#f87171' : '#c084fc';
  const badgeBg = isProgramMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)';

  if (!template || !Component) {
    return (
      <div
        style={{
          width: `${CARD_PREVIEW_W}px`,
          height: `${CARD_PREVIEW_H}px`,
          backgroundColor: '#07070a',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          position: 'relative',
        }}
      >
        <Tv style={{ width: '20px', height: '20px', opacity: 0.4 }} />
        <span>{emptyMessage || (isProgramMode ? 'Off Air / No Template' : 'Select a template to preview')}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${CARD_PREVIEW_W}px`,
        height: `${CARD_PREVIEW_H}px`,
        backgroundColor: '#000000',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '6px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isProgramMode ? '0 0 12px rgba(239, 68, 68, 0.2)' : '0 0 12px rgba(168, 85, 247, 0.15)',
      }}
    >
      <style>{`
        ${googleFontsLink(template.styleConfig)}
        ${cssVarsForTheme(template.styleConfig)}
      `}</style>

      {/* Screen Mode Indicator Badge */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: badgeBg,
          backdropFilter: 'blur(4px)',
          border: `1px solid ${borderColor}`,
          color: badgeColor,
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: isProgramMode ? '#ef4444' : '#a855f7',
          }}
        />
        {isProgramMode ? 'Live Program' : 'Staged Preview'}
      </div>

      {/* Expand Fullscreen Button */}
      {onExpand && (
        <button
          onClick={onExpand}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
          title="Open expanded preview"
        >
          <Maximize2 style={{ width: '12px', height: '12px' }} />
        </button>
      )}

      <div
        style={{
          width: `${targetW}px`,
          height: `${targetH}px`,
          transform: `scale(${fitScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <Component data={fields} styleConfig={template.styleConfig} isPreview={true} />
      </div>
    </div>
  );
}

// ── High-Definition Fullscreen / Expanded Preview Modal ──────────────────────
function HDPreviewModal({
  isOpen,
  onClose,
  title,
  template,
  fields,
  isLive = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  template: OverlayTemplate | null;
  fields: Record<string, any>;
  isLive?: boolean;
}) {
  const [bgMode, setBgMode] = useState<'dark' | 'checker' | 'transparent'>('dark');
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.6);

  const isMgl = template?.templateType === 'mgl_yt_livestanding' || template?.templateType === 'player_stats_vertical';
  const targetW = isMgl ? 434 : 1920;
  const targetH = isMgl ? 724 : 1080;

  useEffect(() => {
    if (!isOpen || !containerRef) return;
    function update() {
      if (!containerRef) return;
      const availW = Math.max(200, containerRef.clientWidth - 48);
      const availH = Math.max(200, containerRef.clientHeight - 48);
      const s = Math.min(availW / targetW, availH / targetH);
      setScale(Math.min(1, Math.max(0.15, s)));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen, containerRef, targetW, targetH]);

  if (!isOpen) return null;

  const Component = template ? templateComponentMap[template.templateType] : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 4, 8, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(12, 14, 22, 0.95)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
              border: isLive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
              color: isLive ? '#f87171' : '#c084fc',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#ef4444' : '#a855f7',
                boxShadow: `0 0 6px ${isLive ? '#ef4444' : '#a855f7'}`,
              }}
            />
            {isLive ? 'PROGRAM / LIVE OUTPUT' : 'PREVIEW / STAGED DRAFT'}
          </div>

          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
            {title}
          </h2>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({template?.name || 'No Template'} · {targetW}×{targetH} · {Math.round(scale * 100)}% scale)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Background switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '2px',
              fontSize: '0.72rem',
            }}
          >
            <button
              onClick={() => setBgMode('dark')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: bgMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: bgMode === 'dark' ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Dark
            </button>
            <button
              onClick={() => setBgMode('checker')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: bgMode === 'checker' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: bgMode === 'checker' ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setBgMode('transparent')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: bgMode === 'transparent' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: bgMode === 'transparent' ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Transparent
            </button>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
            title="Close preview"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        ref={setContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: bgMode === 'dark'
            ? '#050609'
            : bgMode === 'checker'
              ? '#141620'
              : 'transparent',
          backgroundImage: bgMode === 'checker'
            ? 'linear-gradient(45deg, #1c1f2e 25%, transparent 25%), linear-gradient(-45deg, #1c1f2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f2e 75%), linear-gradient(-45deg, transparent 75%, #1c1f2e 75%)'
            : 'none',
          backgroundSize: bgMode === 'checker' ? '24px 24px' : 'auto',
          backgroundPosition: bgMode === 'checker' ? '0 0, 0 12px, 12px -12px, -12px 0px' : 'auto',
        }}
      >
        {!template || !Component ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <Tv style={{ width: '48px', height: '48px', opacity: 0.3 }} />
            <span style={{ fontSize: '0.9rem' }}>No template active to preview</span>
          </div>
        ) : (
          <div
            style={{
              width: `${Math.round(targetW * scale)}px`,
              height: `${Math.round(targetH * scale)}px`,
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0,0,0,0.5)',
              border: isLive ? '2px solid rgba(239, 68, 68, 0.6)' : '2px solid rgba(168, 85, 247, 0.6)',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${targetW}px`,
                height: `${targetH}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
              }}
            >
              <style>{`
                ${googleFontsLink(template.styleConfig)}
                ${cssVarsForTheme(template.styleConfig)}
              `}</style>
              <Component data={fields} styleConfig={template.styleConfig} isPreview={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlRoomPage() {
  const { user, loading: authLoading } = useAuth();

  // Access Verification State
  const [accessChecked, setAccessChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Data State
  const [loadingData, setLoadingData] = useState(true);
  const [mainDoc, setMainDoc] = useState<ControlRoomMainDoc | null>(null);
  const [sources, setSources] = useState<ControlRoomSource[]>([]);
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Master Broadcast All State (when ON)
  const [masterTemplateId, setMasterTemplateId] = useState<string>('');
  const [masterFields, setMasterFields] = useState<Record<string, any>>({});
  const [masterPushing, setMasterPushing] = useState(false);
  const [masterPreviewMode, setMasterPreviewMode] = useState<'preview' | 'program'>('preview');

  // Per-Source Local Edit State (when Broadcast All is OFF)
  const [localSourceEdits, setLocalSourceEdits] = useState<
    Record<string, { templateId: string; fields: Record<string, any>; pushing?: boolean; copied?: boolean }>
  >({});

  // Per-Source Preview vs Program mode switcher state
  const [sourcePreviewModes, setSourcePreviewModes] = useState<Record<string, 'preview' | 'program'>>({});

  // Fullscreen / Expanded HD Preview Modal State
  const [previewModalData, setPreviewModalData] = useState<{
    isOpen: boolean;
    title: string;
    template: OverlayTemplate | null;
    fields: Record<string, any>;
    isLive?: boolean;
  } | null>(null);

  // Editing Name State
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // Delete Confirmation Modal
  const [deletingSource, setDeletingSource] = useState<ControlRoomSource | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Origin for copy links
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // ── Step 0: Server-side Access Verification ────────────────────────────────
  useEffect(() => {
    let active = true;

    async function verify() {
      if (authLoading) return;
      if (!user) {
        if (active) {
          setIsOwner(false);
          setAccessChecked(true);
        }
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/control-room/verify-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (active) {
            setIsOwner(Boolean(data.allowed));
            setAccessChecked(true);
          }
        } else {
          if (active) {
            setIsOwner(false);
            setAccessChecked(true);
          }
        }
      } catch (err) {
        console.error('Failed to verify access:', err);
        if (active) {
          setIsOwner(false);
          setAccessChecked(true);
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // ── Step 1: Initialize & Real-time Listeners ─────────────────────────────────
  useEffect(() => {
    if (!isOwner || !user) return;

    let unsubMain = () => {};
    let unsubSources = () => {};

    async function init() {
      try {
        const userEmail = user?.email || 'admin';
        await initControlRoomMainIfNotExists(userEmail);

        // Load templates and tournaments
        const [tplList, tourneyList] = await Promise.all([
          getTemplates(),
          getTournaments().catch(() => []),
        ]);
        setTemplates(tplList);
        setTournaments(tourneyList);

        // Listen to controlRoom/main
        unsubMain = onSnapshot(getControlRoomMainRef(), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as ControlRoomMainDoc;
            setMainDoc(data);
            setMasterTemplateId(data.broadcastTemplateId || '');
            setMasterFields(data.broadcastFields || {});
          }
        });

        // Listen to controlRoom/main/sources
        const sourcesQ = query(
          collection(db, 'controlRoom', 'main', 'sources'),
          orderBy('createdAt', 'asc')
        );
        unsubSources = onSnapshot(sourcesQ, (snap) => {
          const sList = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ControlRoomSource[];
          setSources(sList);

          // Seed local edits state for newly seen sources if missing
          setLocalSourceEdits((prev) => {
            const next = { ...prev };
            sList.forEach((src) => {
              if (src.id && !next[src.id]) {
                next[src.id] = {
                  templateId: src.liveState?.templateId || '',
                  fields: src.liveState?.fields || {},
                };
              }
            });
            return next;
          });

          setLoadingData(false);
        });
      } catch (err) {
        console.error('Failed to initialize control room:', err);
        setLoadingData(false);
      }
    }

    init();

    return () => {
      unsubMain();
      unsubSources();
    };
  }, [isOwner, user]);

  // ── Templates Lookup Map ───────────────────────────────────────────────────
  const templateLookup = useMemo(() => {
    const map = new Map<string, OverlayTemplate>();
    templates.forEach((t) => {
      if (t.id) map.set(t.id, t);
    });
    return map;
  }, [templates]);

  function getTemplateObj(templateId: string | null | undefined): OverlayTemplate | null {
    if (!templateId) return null;
    return getBuiltInTemplate(templateId) || templateLookup.get(templateId) || null;
  }

  // ── Action: Toggle Broadcast All ───────────────────────────────────────────
  async function handleToggleBroadcastAll(enabled: boolean) {
    if (!user) return;
    try {
      const userEmail = user.email || 'admin';
      const targetTemplateId = masterTemplateId || (templates[0]?.id || 'built-in:flexible_top5');
      await updateControlRoomBroadcastAll(enabled, targetTemplateId, masterFields, userEmail);
    } catch (err: any) {
      alert(`Failed to toggle Broadcast All: ${err?.message}`);
    }
  }

  // ── Action: Master Broadcast All Edit (Fan-out live) ────────────────────────
  async function handleMasterFieldsChange(updatedFields: Record<string, any>) {
    setMasterFields(updatedFields);
    if (mainDoc?.broadcastAllEnabled && user) {
      const userEmail = user.email || 'admin';
      await updateControlRoomBroadcastAll(true, masterTemplateId, updatedFields, userEmail);
    }
  }

  async function handleMasterTemplateChange(newTemplateId: string) {
    setMasterTemplateId(newTemplateId);
    if (mainDoc?.broadcastAllEnabled && user) {
      const userEmail = user.email || 'admin';
      await updateControlRoomBroadcastAll(true, newTemplateId, masterFields, userEmail);
    }
  }

  async function handleMasterManualPush() {
    if (!user || !masterTemplateId) return;
    setMasterPushing(true);
    try {
      const userEmail = user.email || 'admin';
      await fanOutBroadcastAllToSources(masterTemplateId, masterFields, userEmail);
      await updateControlRoomBroadcastAll(true, masterTemplateId, masterFields, userEmail);
    } catch (err: any) {
      alert(`Failed to fan out broadcast: ${err?.message}`);
    } finally {
      setMasterPushing(false);
    }
  }

  // ── Action: Add Source ─────────────────────────────────────────────────────
  async function handleAddSource() {
    if (!user) return;
    try {
      const userEmail = user.email || 'admin';
      const nextIndex = sources.length + 1;
      const defaultName = `Feed ${String.fromCharCode(64 + nextIndex)}`;
      const defaultTemplateId = mainDoc?.broadcastAllEnabled
        ? mainDoc.broadcastTemplateId
        : templates[0]?.id || 'built-in:flexible_top5';
      const defaultFields = mainDoc?.broadcastAllEnabled ? mainDoc.broadcastFields : {};

      await addControlRoomSource(defaultName, userEmail, defaultTemplateId, defaultFields);
    } catch (err: any) {
      alert(`Failed to add source: ${err?.message}`);
    }
  }

  // ── Action: Rename Source ──────────────────────────────────────────────────
  async function handleSaveSourceName(sourceId: string) {
    if (!editingNameValue.trim()) return;
    try {
      await updateControlRoomSourceName(sourceId, editingNameValue.trim());
      setEditingSourceId(null);
    } catch (err: any) {
      alert(`Failed to rename source: ${err?.message}`);
    }
  }

  // ── Action: Push Individual Source Live (When Broadcast All is OFF) ────────
  async function handlePushSourceLive(sourceId: string) {
    if (!user) return;
    const editState = localSourceEdits[sourceId];
    if (!editState?.templateId) return;

    setLocalSourceEdits((prev) => ({
      ...prev,
      [sourceId]: { ...prev[sourceId], pushing: true },
    }));

    try {
      const userEmail = user.email || 'admin';
      await pushControlRoomSourceLive(
        sourceId,
        editState.templateId,
        editState.fields,
        userEmail
      );
    } catch (err: any) {
      alert(`Failed to push to live: ${err?.message}`);
    } finally {
      setLocalSourceEdits((prev) => ({
        ...prev,
        [sourceId]: { ...prev[sourceId], pushing: false },
      }));
    }
  }

  // ── Action: Delete Source ──────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!deletingSource?.id) return;
    setDeletingLoading(true);
    try {
      await deleteControlRoomSource(deletingSource.id);
      setDeletingSource(null);
    } catch (err: any) {
      alert(`Failed to delete source: ${err?.message}`);
    } finally {
      setDeletingLoading(false);
    }
  }

  // ── Action: Copy OBS Link ──────────────────────────────────────────────────
  function handleCopySourceLink(sourceId: string, token: string) {
    const url = `${origin}/control-render/${token}`;
    navigator.clipboard.writeText(url);
    setLocalSourceEdits((prev) => ({
      ...prev,
      [sourceId]: { ...prev[sourceId], copied: true },
    }));
    setTimeout(() => {
      setLocalSourceEdits((prev) => ({
        ...prev,
        [sourceId]: { ...prev[sourceId], copied: false },
      }));
    }, 2000);
  }

  // ── Access Guard Handling ──────────────────────────────────────────────────
  if (!accessChecked || authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 74px)',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: '#a855f7' }} />
        <span style={{ fontSize: '0.9rem' }}>Verifying control room credentials...</span>
      </div>
    );
  }

  // If not the authorized owner, return Next.js 404
  if (!isOwner) {
    notFound();
  }

  if (loadingData) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 74px)',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: '#a855f7' }} />
        <span style={{ fontSize: '0.9rem' }}>Initializing Multi-Source Control Room...</span>
      </div>
    );
  }

  const broadcastAllOn = Boolean(mainDoc?.broadcastAllEnabled);
  const masterTemplateObj = getTemplateObj(masterTemplateId);

  return (
    <div style={{ minHeight: 'calc(100vh - 74px)', backgroundColor: '#07070b', color: '#FFFFFF', paddingBottom: '4rem' }}>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(10, 10, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(126,34,206,0.4) 100%)',
              border: '1px solid rgba(168,85,247,0.5)',
              color: '#c084fc',
            }}
          >
            <Radio style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em' }}>
                Control Room
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: broadcastAllOn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                  border: broadcastAllOn ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(168, 85, 247, 0.4)',
                  color: broadcastAllOn ? '#f87171' : '#c084fc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {broadcastAllOn ? 'Broadcast All Active' : `${sources.length} Independent Sources`}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Master multi-source live overlay orchestration with live preview mode
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Broadcast All Master Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: broadcastAllOn ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: broadcastAllOn ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Cast style={{ width: '16px', height: '16px', color: broadcastAllOn ? '#ef4444' : 'var(--text-muted)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: broadcastAllOn ? '#fca5a5' : '#FFFFFF' }}>
                Broadcast All (Master Mode)
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {broadcastAllOn ? 'Simultaneously driving all sources' : 'Sources operate independently'}
              </span>
            </div>
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '42px',
                height: '22px',
                cursor: 'pointer',
                marginLeft: '6px',
              }}
            >
              <input
                type="checkbox"
                checked={broadcastAllOn}
                onChange={(e) => handleToggleBroadcastAll(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: broadcastAllOn ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                  transition: '0.2s ease',
                  borderRadius: '22px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    left: broadcastAllOn ? '22px' : '3px',
                    bottom: '3px',
                    backgroundColor: '#FFFFFF',
                    transition: '0.2s ease',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  }}
                />
              </span>
            </label>
          </div>

          {/* Add Source Button */}
          <button
            onClick={handleAddSource}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1720px', margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* ── BROADCAST ALL MASTER CONTROL PANEL ─────────────────────────────── */}
        {broadcastAllOn && (
          <div
            style={{
              marginBottom: '2rem',
              borderRadius: '12px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(180deg, rgba(30, 10, 15, 0.7) 0%, rgba(15, 8, 12, 0.9) 100%)',
              padding: '1.25rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    boxShadow: '0 0 8px #ef4444',
                  }}
                />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fca5a5', letterSpacing: '0.04em' }}>
                  MASTER BROADCAST ALL CONTROLLER
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  (Driving {sources.length} active source render URLs live)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleMasterManualPush}
                  disabled={masterPushing || !masterTemplateId}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.8rem',
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {masterPushing ? (
                    <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <Send style={{ width: '14px', height: '14px' }} />
                  )}
                  <span>Re-Push to All Sources</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
              {/* Master Preview Screen with Mode Switcher */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', width: `${CARD_PREVIEW_W}px` }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '2px',
                      gap: '2px',
                    }}
                  >
                    <button
                      onClick={() => setMasterPreviewMode('preview')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: masterPreviewMode === 'preview' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                        color: masterPreviewMode === 'preview' ? '#c084fc' : 'var(--text-muted)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye style={{ width: '12px', height: '12px' }} />
                      <span>Preview (Draft)</span>
                    </button>
                    <button
                      onClick={() => setMasterPreviewMode('program')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: masterPreviewMode === 'program' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                        color: masterPreviewMode === 'program' ? '#f87171' : 'var(--text-muted)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <span>Program (Live All)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setPreviewModalData({
                        isOpen: true,
                        title: `Master Controller - ${masterPreviewMode === 'preview' ? 'Staged Preview' : 'Live Program Output'}`,
                        template: masterTemplateObj,
                        fields: masterFields,
                        isLive: masterPreviewMode === 'program',
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fca5a5',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                    title="Expand full HD preview"
                  >
                    <Maximize2 style={{ width: '12px', height: '12px' }} />
                    <span>Expand</span>
                  </button>
                </div>

                <MiniRender
                  template={masterTemplateObj}
                  fields={masterFields}
                  isLive={masterPreviewMode === 'program'}
                  mode={masterPreviewMode}
                  onExpand={() => {
                    setPreviewModalData({
                      isOpen: true,
                      title: `Master Controller - ${masterPreviewMode === 'preview' ? 'Staged Preview' : 'Live Program Output'}`,
                      template: masterTemplateObj,
                      fields: masterFields,
                      isLive: masterPreviewMode === 'program',
                    });
                  }}
                />
              </div>

              {/* Master Config & Field Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="property-field">
                  <span className="property-label" style={{ color: '#fca5a5' }}>
                    Master Template Selection
                  </span>
                  <select
                    className="select-input"
                    value={masterTemplateId}
                    onChange={(e) => handleMasterTemplateChange(e.target.value)}
                    style={{ border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <option value="">-- Select Master Template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.templateType})
                      </option>
                    ))}
                  </select>
                </div>

                {masterTemplateObj && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                    }}
                  >
                    <FieldEditor
                      templateType={masterTemplateObj.templateType}
                      tournaments={tournaments}
                      fields={masterFields}
                      onFieldsChange={handleMasterFieldsChange}
                      onFetched={(fetched) => handleMasterFieldsChange({ ...masterFields, ...fetched })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SOURCES LIST / CARDS ───────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Broadcast Sources ({sources.length})
            </span>
          </div>

          {sources.length === 0 ? (
            <div
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                backgroundColor: 'rgba(15, 15, 22, 0.5)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <Tv style={{ width: '36px', height: '36px', color: 'var(--text-muted)', opacity: 0.5 }} />
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>No Sources Configured</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Add a broadcast source to generate an OBS browser source render URL.
                </p>
              </div>
              <button onClick={handleAddSource} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus style={{ width: '16px', height: '16px' }} />
                <span>Add First Source</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              {sources.map((source) => {
                const sourceId = source.id || '';
                const liveTemplateObj = getTemplateObj(source.liveState?.templateId);
                const localEdit = localSourceEdits[sourceId] || {
                  templateId: source.liveState?.templateId || '',
                  fields: source.liveState?.fields || {},
                };
                const editTemplateObj = getTemplateObj(localEdit.templateId);
                const currentMode = sourcePreviewModes[sourceId] || 'preview';
                const isEditingName = editingSourceId === sourceId;
                const renderUrl = `${origin}/control-render/${source.renderToken}`;

                // Display template and fields based on selected mode
                const displayTemplate = currentMode === 'preview' ? editTemplateObj : liveTemplateObj;
                const displayFields = currentMode === 'preview' ? localEdit.fields : (source.liveState?.fields || {});

                return (
                  <div
                    key={sourceId}
                    style={{
                      borderRadius: '12px',
                      backgroundColor: 'rgba(14, 16, 23, 0.95)',
                      border: broadcastAllOn
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {/* Card Header Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        backgroundColor: 'rgba(20, 24, 34, 0.8)',
                      }}
                    >
                      {/* Name editor */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEditingName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              className="text-input"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSourceName(sourceId);
                                if (e.key === 'Escape') setEditingSourceId(null);
                              }}
                              autoFocus
                              style={{ padding: '2px 8px', fontSize: '0.85rem', width: '160px' }}
                            />
                            <button
                              onClick={() => handleSaveSourceName(sourceId)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px' }}
                            >
                              <Check style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '0.02em' }}>
                              {source.name}
                            </span>
                            <button
                              onClick={() => {
                                setEditingSourceId(sourceId);
                                setEditingNameValue(source.name);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                              }}
                              title="Rename source"
                            >
                              <Pencil style={{ width: '12px', height: '12px' }} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* On-air status & Delete button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {source.liveState?.templateId ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                              }}
                            />
                            {liveTemplateObj?.name || 'LIVE'}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            OFF AIR
                          </span>
                        )}

                        <button
                          onClick={() => setDeletingSource(source)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove source"
                        >
                          <Trash2 style={{ width: '14px', height: '14px', color: '#f87171' }} />
                        </button>
                      </div>
                    </div>

                    {/* OBS Browser Source URL Bar */}
                    <div
                      style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: 'rgba(10, 12, 17, 0.6)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          OBS URL:
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {renderUrl}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleCopySourceLink(sourceId, source.renderToken)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {localEdit.copied ? (
                            <>
                              <Check style={{ width: '12px', height: '12px', color: '#4ade80' }} />
                              <span style={{ color: '#4ade80' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy style={{ width: '12px', height: '12px' }} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <a
                          href={renderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px', display: 'flex', alignItems: 'center' }}
                          title="Open render window"
                        >
                          <ExternalLink style={{ width: '12px', height: '12px' }} />
                        </a>
                      </div>
                    </div>

                    {/* Card Body: Live Preview & Editor */}
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Preview / Program Mode Switcher & Expand */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', width: `${CARD_PREVIEW_W}px` }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '2px',
                              gap: '2px',
                            }}
                          >
                            <button
                              onClick={() => setSourcePreviewModes((prev) => ({ ...prev, [sourceId]: 'preview' }))}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentMode === 'preview' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                                color: currentMode === 'preview' ? '#c084fc' : 'var(--text-muted)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye style={{ width: '12px', height: '12px' }} />
                              <span>Preview (Draft)</span>
                            </button>
                            <button
                              onClick={() => setSourcePreviewModes((prev) => ({ ...prev, [sourceId]: 'program' }))}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: currentMode === 'program' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                                color: currentMode === 'program' ? '#f87171' : 'var(--text-muted)',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: source.liveState?.templateId ? '#ef4444' : 'var(--text-muted)',
                                }}
                              />
                              <span>Program (Live)</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setPreviewModalData({
                                isOpen: true,
                                title: `${source.name} - ${currentMode === 'preview' ? 'Staged Preview' : 'Live Program Output'}`,
                                template: displayTemplate,
                                fields: displayFields,
                                isLive: currentMode === 'program',
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                            title="Expand full HD preview"
                          >
                            <Maximize2 style={{ width: '12px', height: '12px' }} />
                            <span>Expand</span>
                          </button>
                        </div>

                        {/* Mini Screen Render */}
                        <MiniRender
                          template={displayTemplate}
                          fields={displayFields}
                          isLive={currentMode === 'program'}
                          mode={currentMode}
                          emptyMessage={currentMode === 'preview' ? 'Select a template below to preview' : 'Off Air / No Active Live Template'}
                          onExpand={() => {
                            setPreviewModalData({
                              isOpen: true,
                              title: `${source.name} - ${currentMode === 'preview' ? 'Staged Preview' : 'Live Program Output'}`,
                              template: displayTemplate,
                              fields: displayFields,
                              isLive: currentMode === 'program',
                            });
                          }}
                        />
                      </div>

                      {/* Controls Mode */}
                      {broadcastAllOn ? (
                        <div
                          style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px dashed rgba(239, 68, 68, 0.3)',
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5' }}>
                            ⚡ Driven by Master Broadcast All
                          </span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            This source is currently locked and mirroring the Master Controller in real time.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div className="property-field">
                            <span className="property-label">Source Template</span>
                            <select
                              className="select-input"
                              value={localEdit.templateId}
                              onChange={(e) => {
                                const newTpl = e.target.value;
                                setLocalSourceEdits((prev) => ({
                                  ...prev,
                                  [sourceId]: { ...prev[sourceId], templateId: newTpl },
                                }));
                              }}
                            >
                              <option value="">-- Off Air / Select Template --</option>
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {editTemplateObj && (
                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '0.75rem',
                              }}
                            >
                              <FieldEditor
                                templateType={editTemplateObj.templateType}
                                tournaments={tournaments}
                                fields={localEdit.fields}
                                onFieldsChange={(updated) => {
                                  setLocalSourceEdits((prev) => ({
                                    ...prev,
                                    [sourceId]: { ...prev[sourceId], fields: updated },
                                  }));
                                }}
                                onFetched={(fetched) => {
                                  setLocalSourceEdits((prev) => ({
                                    ...prev,
                                    [sourceId]: {
                                      ...prev[sourceId],
                                      fields: { ...prev[sourceId].fields, ...fetched },
                                    },
                                  }));
                                }}
                              />
                            </div>
                          )}

                          <button
                            onClick={() => handlePushSourceLive(sourceId)}
                            disabled={localEdit.pushing || !localEdit.templateId}
                            className="btn btn-primary"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '0.5rem 1rem',
                              fontWeight: 800,
                            }}
                          >
                            {localEdit.pushing ? (
                              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <Send style={{ width: '14px', height: '14px' }} />
                            )}
                            <span>Push {source.name} to Live</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── HD FULLSCREEN / EXPANDED PREVIEW MODAL ─────────────────────────── */}
      {previewModalData && (
        <HDPreviewModal
          isOpen={previewModalData.isOpen}
          onClose={() => setPreviewModalData(null)}
          title={previewModalData.title}
          template={previewModalData.template}
          fields={previewModalData.fields}
          isLive={previewModalData.isLive}
        />
      )}

      {/* ── DELETE SOURCE CONFIRMATION MODAL ──────────────────────────────── */}
      {deletingSource && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#12141c',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <AlertTriangle style={{ width: '22px', height: '22px' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fca5a5' }}>
                Remove Broadcast Source?
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
              Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>{deletingSource.name}</strong>?
            </p>

            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.78rem',
                color: '#fca5a5',
                marginBottom: '1.25rem',
                lineHeight: '1.4',
              }}
            >
              ⚠️ <strong>Warning:</strong> This will immediately invalidate the render URL:{' '}
              <code style={{ fontSize: '0.72rem', backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 4px', borderRadius: '4px' }}>
                /control-render/{deletingSource.renderToken}
              </code>
              . Any active OBS / Streamlabs browser sources pointed at this link will go blank.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingSource(null)}
                disabled={deletingLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingLoading}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {deletingLoading ? (
                  <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                )}
                <span>Delete Source</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
