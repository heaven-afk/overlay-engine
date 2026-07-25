'use client';

import { useEffect, useState } from 'react';
import {
  getUserTeams, createTeam, createInviteLink, getTeamInvites,
  OverlayTeam, OverlayInvite
} from '@/lib/db';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Users, UserPlus, Shield, Copy, Check, Plus, Loader2, Link as LinkIcon, UserCheck } from 'lucide-react';

export default function TeamsDashboard() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [teams, setTeams] = useState<OverlayTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // New Team Modal/Form state
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Selected Team & Invites state
  const [selectedTeam, setSelectedTeam] = useState<OverlayTeam | null>(null);
  const [teamInvites, setTeamInvites] = useState<OverlayInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Generated Link Copy state
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingRole, setGeneratingRole] = useState<'editor' | 'viewer' | null>(null);

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) {
        loadUserTeams(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function loadUserTeams(uid: string) {
    try {
      setLoading(true);
      const list = await getUserTeams(uid);
      setTeams(list);
      if (list.length > 0 && !selectedTeam) {
        selectTeam(list[0]);
      }
    } catch (err) {
      console.error('Failed to load user teams:', err);
    } finally {
      setLoading(false);
    }
  }

  async function selectTeam(team: OverlayTeam) {
    setSelectedTeam(team);
    setGeneratedInviteUrl('');
    if (!team.id) return;
    try {
      setLoadingInvites(true);
      const invs = await getTeamInvites(team.id);
      setTeamInvites(invs);
    } catch (err) {
      console.error('Failed to load team invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamNameInput.trim() || !currentUser) return;

    try {
      setCreatingTeam(true);
      const tid = await createTeam(teamNameInput.trim(), {
        uid: currentUser.uid,
        email: currentUser.email || '',
      });
      setTeamNameInput('');
      setShowAddTeam(false);
      await loadUserTeams(currentUser.uid);
      const updatedList = await getUserTeams(currentUser.uid);
      const created = updatedList.find((t) => t.id === tid);
      if (created) selectTeam(created);
    } catch (err: any) {
      alert(`Failed to create team: ${err?.message || 'Unknown error'}`);
    } finally {
      setCreatingTeam(false);
    }
  }

  async function handleGenerateInviteLink(role: 'editor' | 'viewer') {
    if (!selectedTeam?.id || !currentUser) return;

    try {
      setGeneratingRole(role);
      const token = await createInviteLink(
        selectedTeam.id,
        selectedTeam.name,
        role,
        { uid: currentUser.uid, email: currentUser.email || '' }
      );
      const fullUrl = `${origin}/invite/${token}`;
      setGeneratedInviteUrl(fullUrl);
      const updatedInvites = await getTeamInvites(selectedTeam.id);
      setTeamInvites(updatedInvites);
    } catch (err: any) {
      alert(`Failed to generate invite link: ${err?.message || 'Unknown error'}`);
    } finally {
      setGeneratingRole(null);
    }
  }

  function handleCopyInviteUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem', width: '24px', height: '24px' }} />
        <p>Loading Team Workspaces & Invites...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header */}
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
            <Users style={{ width: '28px', height: '28px', color: '#d946ef' }} />
            <span>Teams & Collaborator Invites</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Manage broadcast teams, member permissions, and generate role-based invite tokens.
          </p>
        </div>

        <button
          onClick={() => setShowAddTeam(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Create New Team</span>
        </button>
      </div>

      {/* New Team Modal */}
      {showAddTeam && (
        <div style={{
          backgroundColor: '#121218',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Create Broadcast Production Team</h3>
          <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Main Stage Broadcast Crew"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="button" onClick={() => setShowAddTeam(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creatingTeam} className="btn btn-primary">
              {creatingTeam ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>
      )}

      {teams.length === 0 ? (
        <div style={{
          backgroundColor: '#121218',
          border: '1px dashed var(--border)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <Users style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Teams Created Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create a team to invite co-producers, graphics operators, and viewers to collaborate on shared live slots.
          </p>
          <button onClick={() => setShowAddTeam(true)} className="btn btn-primary">
            Create Your First Team
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Teams Sidebar */}
          <div style={{
            backgroundColor: '#121218',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Your Production Teams
            </span>
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              const isOwner = team.ownerId === currentUser?.uid;

              return (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(217,70,239,0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(217,70,239,0.4)' : '1px solid transparent',
                    color: isSelected ? '#d946ef' : '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem' }}>{team.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {team.members?.length || 1} Member{team.members?.length === 1 ? '' : 's'} • {isOwner ? 'Owner' : 'Member'}
                    </div>
                  </div>
                  {isOwner && <Shield style={{ width: '14px', height: '14px', color: '#d946ef' }} title="Team Owner" />}
                </button>
              );
            })}
          </div>

          {/* Selected Team Details & Invite Generator */}
          {selectedTeam && (
            <div style={{
              backgroundColor: '#121218',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 800 }}>{selectedTeam.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Team Owner ID: {selectedTeam.ownerId}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleGenerateInviteLink('editor')}
                    className="btn btn-primary btn-sm"
                    disabled={generatingRole === 'editor'}
                    style={{ backgroundColor: '#d946ef', borderColor: '#d946ef', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <UserPlus style={{ width: '13px', height: '13px' }} />
                    <span>Invite Editor</span>
                  </button>
                  <button
                    onClick={() => handleGenerateInviteLink('viewer')}
                    className="btn btn-secondary btn-sm"
                    disabled={generatingRole === 'viewer'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <UserPlus style={{ width: '13px', height: '13px' }} />
                    <span>Invite Viewer</span>
                  </button>
                </div>
              </div>

              {/* Newly Generated Link Box */}
              {generatedInviteUrl && (
                <div style={{
                  backgroundColor: 'rgba(217,70,239,0.08)',
                  border: '1px solid rgba(217,70,239,0.3)',
                  padding: '1rem',
                  borderRadius: '10px',
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d946ef', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <LinkIcon style={{ width: '14px', height: '14px' }} />
                    <span>Role Invitation Link Generated! Share this link with your team member:</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="text-input"
                      readOnly
                      value={generatedInviteUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => handleCopyInviteUrl(generatedInviteUrl)}
                      className="btn btn-primary"
                      style={{ backgroundColor: '#d946ef', borderColor: '#d946ef', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {copiedLink ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserCheck style={{ width: '16px', height: '16px', color: '#4ade80' }} />
                  <span>Team Members ({selectedTeam.members?.length || 1})</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedTeam.members || []).map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.email || m.userId}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UID: {m.userId}</div>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: m.role === 'editor' ? 'rgba(217,70,239,0.15)' : 'rgba(255,255,255,0.06)',
                        color: m.role === 'editor' ? '#d946ef' : 'var(--text-muted)',
                      }}>
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Invite Links List */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <LinkIcon style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                  <span>Active Invite Links ({teamInvites.length})</span>
                </h3>

                {loadingInvites ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading active invites...</p>
                ) : teamInvites.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No pending active invite links.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {teamInvites.map((inv) => {
                      const url = `${origin}/invite/${inv.token}`;
                      return (
                        <div
                          key={inv.id}
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#d946ef', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {url}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Role: <strong>{inv.role}</strong> • Created by {inv.createdBy}
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyInviteUrl(url)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Copy Link
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
