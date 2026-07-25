'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  createStudioProject, getStudioProjects, deleteStudioProject,
  getUserTeams, StudioProject, OverlayTeam,
} from '@/lib/db';
import {
  Clapperboard, Plus, Trash, Copy, Check, Loader2,
  ArrowRight, Users, User as UserIcon, FolderOpen, Link as LinkIcon,
} from 'lucide-react';

export default function StudioRoomIndex() {
  const router = useRouter();
  const { user } = useAuth();

  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [userTeams, setUserTeams] = useState<OverlayTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOwnerType, setNewOwnerType] = useState<'individual' | 'team'>('individual');
  const [newTeamId, setNewTeamId] = useState('');

  // Copy OBS URL feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      getUserTeams(user.uid).then(setUserTeams).catch(() => {});
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const list = await getStudioProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load studio projects:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      setCreating(true);
      const teamId = newOwnerType === 'team' && newTeamId ? newTeamId : null;
      const projectId = await createStudioProject(newName.trim(), user.uid, teamId);
      setNewName('');
      setShowForm(false);
      router.push(`/studio/${projectId}`);
    } catch (err: any) {
      alert(`Failed to create project: ${err?.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone. The OBS source link will go offline.`)) return;
    try {
      await deleteStudioProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      alert(`Failed to delete: ${err?.message || 'Unknown error'}`);
    }
  }

  function handleCopyOBS(project: StudioProject) {
    const url = `${origin}/studio-render/${project.sourceLinkToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(project.id!);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filter to show only projects owned by current user (or team-shared ones)
  const myProjects = user
    ? projects.filter((p) => p.ownerId === user.uid || userTeams.some((t) => t.id === p.teamId))
    : [];

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clapperboard style={{ width: '28px', height: '28px', color: '#a78bfa' }} />
            Studio Room
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Project-based broadcast control with playlists and a Preview / Live workflow.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          New Project
        </button>
      </div>

      {/* ── Create Project Form ── */}
      {showForm && (
        <div style={{
          backgroundColor: '#121218',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 0 30px rgba(139,92,246,0.1)',
        }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#a78bfa' }}>
            Create New Studio Project
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '240px' }}>
                <label className="slot-control-label">Project Name</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Worlds 2025 Broadcast Deck"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label className="slot-control-label">Ownership</label>
                <select
                  className="select-input"
                  value={newOwnerType}
                  onChange={(e) => setNewOwnerType(e.target.value as 'individual' | 'team')}
                >
                  <option value="individual">Individual (Private)</option>
                  <option value="team">Team (Shared)</option>
                </select>
              </div>
              {newOwnerType === 'team' && (
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label className="slot-control-label">Team</label>
                  <select
                    className="select-input"
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Team --</option>
                    {userTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? <><Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} /> Creating…</> : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Project List ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" style={{ width: '22px', height: '22px' }} />
          Loading projects…
        </div>
      ) : myProjects.length === 0 ? (
        <div style={{
          background: 'rgba(10,10,15,0.6)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <FolderOpen style={{ width: '3rem', height: '3rem', margin: '0 auto 1.25rem', color: 'rgba(167,139,250,0.3)' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>No Studio Projects Yet</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create your first project to set up playlists, a Preview screen, and a dedicated OBS source link.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus style={{ width: '16px', height: '16px' }} />
            Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {myProjects.map((project) => {
            const obsUrl = `${origin}/studio-render/${project.sourceLinkToken}`;
            const isTeam = !!project.teamId;
            const isCopied = copiedId === project.id;

            return (
              <div
                key={project.id}
                style={{
                  backgroundColor: '#111117',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.3)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(139,92,246,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Project Name + Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>{project.name}</h3>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isTeam ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isTeam ? '#a78bfa' : 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {isTeam ? <Users style={{ width: '10px', height: '10px' }} /> : <UserIcon style={{ width: '10px', height: '10px' }} />}
                      {isTeam ? 'Team Shared' : 'Individual'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id!, project.name)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', color: '#ef4444', flexShrink: 0 }}
                    title="Delete Project"
                  >
                    <Trash style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>

                {/* OBS URL Box */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <LinkIcon style={{ width: '12px', height: '12px', color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {obsUrl}
                  </span>
                  <button
                    onClick={() => handleCopyOBS(project)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isCopied ? '#4ade80' : 'var(--text-muted)', transition: 'color 0.2s', flexShrink: 0 }}
                    title="Copy OBS Browser Source URL"
                  >
                    {isCopied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                  </button>
                </div>

                {/* Open Workspace */}
                <Link
                  href={`/studio/${project.id}`}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  Open Workspace
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
