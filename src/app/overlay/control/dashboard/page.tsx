'use client';

import React, { useState, useEffect } from 'react';
import { useOverlayState } from '@/hooks/useOverlayState';
import { Monitor, Send, ChevronLeft, ChevronRight, Copy, ExternalLink, CheckCircle2, Layers } from 'lucide-react';

export default function OverlayControlDashboardPage() {
  const { state: overlayState, updateState } = useOverlayState();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Panel A State (Team Roster Kills)
  const [tournamentId, setTournamentId] = useState('');
  const [scope, setScope] = useState<'collation' | 'daily'>('collation');
  const [day, setDay] = useState(1);
  const [teamId, setTeamId] = useState('');
  const [sendingRoster, setSendingRoster] = useState(false);

  // Panel B State (Flexible Top 5)
  const [top5TournamentId, setTop5TournamentId] = useState('');
  const [top5Mode, setTop5Mode] = useState<'daily' | 'collation'>('daily');
  const [top5Day, setTop5Day] = useState(1);
  const [top5LobbyMode, setTop5LobbyMode] = useState<'full_day' | 'single_lobby'>('full_day');
  const [top5Lobby, setTop5Lobby] = useState<number | ''>('');
  const [top5Page, setTop5Page] = useState(1);
  const [showTitle, setShowTitle] = useState(true);
  const [sendingTop5, setSendingTop5] = useState(false);

  // Hydrate local state from Firestore overlayState on initial load
  useEffect(() => {
    if (overlayState?.teamRosterKills) {
      setTournamentId(overlayState.teamRosterKills.tournamentId || '');
      setScope((overlayState.teamRosterKills.scope as any) || 'collation');
      setDay(overlayState.teamRosterKills.day || 1);
      setTeamId(overlayState.teamRosterKills.teamId || '');
    }

    if (overlayState?.flexibleTop5) {
      setTop5TournamentId(overlayState.flexibleTop5.tournamentId || '');
      setTop5Mode(overlayState.flexibleTop5.mode || 'daily');
      setTop5Day(overlayState.flexibleTop5.day || 1);
      setTop5LobbyMode(overlayState.flexibleTop5.lobbyMode || 'full_day');
      setTop5Lobby(overlayState.flexibleTop5.lobby || '');
      setTop5Page(overlayState.flexibleTop5.page || 1);
      setShowTitle(overlayState.flexibleTop5.showTitle ?? true);
    }
  }, [overlayState]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rosterRenderUrl = `${origin}/overlay/render/team-roster-kills?tournamentId=${tournamentId}&teamId=${teamId}&scope=${scope}${scope === 'daily' ? `&day=${day}` : ''}`;
  const top5RenderUrl = `${origin}/overlay/render/flexible-top5?tournamentId=${top5TournamentId}&mode=${top5Mode}&day=${top5Day}&lobbyMode=${top5LobbyMode}${top5Lobby ? `&lobby=${top5Lobby}` : ''}&showTitle=${showTitle ? '1' : '0'}`;

  const handleSendRoster = async () => {
    if (!tournamentId || !teamId) {
      showToast('Please enter both Tournament ID and Team ID', 'error');
      return;
    }
    setSendingRoster(true);
    try {
      await updateState({
        activeTemplate: 'team-roster-kills',
        teamRosterKills: { tournamentId, scope, day, teamId },
      });
      showToast(`Team Roster Kills (${scope.toUpperCase()}) pushed to broadcast render!`, 'success');
    } catch (err: any) {
      showToast('Failed to update overlay state: ' + err.message, 'error');
    } finally {
      setSendingRoster(false);
    }
  };

  const handleSendTop5 = async (overridePage?: number) => {
    const targetPage = overridePage ?? top5Page;
    if (!top5TournamentId) {
      showToast('Please enter Tournament ID for Top 5', 'error');
      return;
    }
    setSendingTop5(true);
    try {
      await updateState({
        activeTemplate: 'flexible-top5',
        flexibleTop5: {
          tournamentId: top5TournamentId,
          mode: top5Mode,
          day: top5Day,
          lobbyMode: top5LobbyMode,
          lobby: top5LobbyMode === 'single_lobby' && top5Lobby !== '' ? Number(top5Lobby) : undefined,
          page: targetPage,
          showTitle,
        },
      });
      setTop5Page(targetPage);
      showToast(`Flexible Top 5 (${top5Mode.toUpperCase()}, Page ${targetPage}) pushed to broadcast render!`, 'success');
    } catch (err: any) {
      showToast('Failed to update overlay state: ' + err.message, 'error');
    } finally {
      setSendingTop5(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} URL copied to clipboard!`, 'success');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a14',
        color: '#ffffff',
        padding: '40px 24px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Floating Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              backgroundColor: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#FFD700', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Monitor size={28} />
              Broadcast Overlay Control Center
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0 0', fontSize: '14px' }}>
              Real-time studio operator dashboard for Team Roster Kill Cards and Flexible Top 5 templates
            </p>
          </div>
          {overlayState?.activeTemplate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ADE80', color: '#4ADE80', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Live: {overlayState.activeTemplate}
            </div>
          )}
        </div>

        {/* Controllers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '28px' }}>
          {/* Panel A: Team Roster Kill Cards */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,35,0.95), rgba(10,10,20,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <Layers style={{ color: '#FFD700' }} size={22} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Team Roster Kill Cards</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Scope Mode Toggle: Collation vs Daily */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Scope Mode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setScope('collation')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid ' + (scope === 'collation' ? '#FFD700' : 'rgba(255,255,255,0.15)'),
                      background: scope === 'collation' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: scope === 'collation' ? '#FFD700' : '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Collation (Tournament)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('daily')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid ' + (scope === 'daily' ? '#FFD700' : 'rgba(255,255,255,0.15)'),
                      background: scope === 'daily' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: scope === 'daily' ? '#FFD700' : '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Daily Results
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Tournament ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. tour_abc123"
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              {scope === 'daily' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Day</label>
                  <input
                    type="number"
                    min={1}
                    value={day}
                    onChange={(e) => setDay(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Team ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. team_nova"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <button
                onClick={handleSendRoster}
                disabled={sendingRoster}
                style={{
                  marginTop: '10px',
                  padding: '12px 20px',
                  backgroundColor: '#FFD700',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s, opacity 0.15s',
                }}
              >
                <Send size={18} />
                {sendingRoster ? 'Sending...' : 'Push Roster Kills to Render'}
              </button>

              {/* URL Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => copyToClipboard(rosterRenderUrl, 'Roster Kills Render')}
                  style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Copy size={14} /> Copy OBS URL
                </button>
                <a
                  href={rosterRenderUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            </div>
          </div>

          {/* Panel B: Flexible Top 5 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,35,0.95), rgba(10,10,20,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <Layers style={{ color: '#A855F7' }} size={22} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Flexible Top 5 Standings</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Mode Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Standings Mode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTop5Mode('daily')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: top5Mode === 'daily' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: top5Mode === 'daily' ? '#C084FC' : 'rgba(255,255,255,0.7)',
                      fontWeight: top5Mode === 'daily' ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Daily Results
                  </button>
                  <button
                    type="button"
                    onClick={() => setTop5Mode('collation')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: top5Mode === 'collation' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: top5Mode === 'collation' ? '#C084FC' : 'rgba(255,255,255,0.7)',
                      fontWeight: top5Mode === 'collation' ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Collation (Overall)
                  </button>
                </div>
              </div>

              {/* Day & Lobby controls — only when Daily mode selected */}
              {top5Mode === 'daily' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Day</label>
                    <input
                      type="number"
                      min={1}
                      value={top5Day}
                      onChange={(e) => setTop5Day(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Scope</label>
                    <select
                      value={top5LobbyMode}
                      onChange={(e) => setTop5LobbyMode(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                    >
                      <option value="full_day">Full Day</option>
                      <option value="single_lobby">Single Lobby</option>
                    </select>
                  </div>
                  {top5LobbyMode === 'single_lobby' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Lobby</label>
                      <input
                        type="number"
                        min={1}
                        value={top5Lobby}
                        onChange={(e) => setTop5Lobby(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Page Controls (5 Teams / Page)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleSendTop5(Math.max(top5Page - 1, 1))}
                    disabled={top5Page <= 1}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <ChevronLeft size={16} /> Prev 5
                  </button>

                  <span style={{ fontSize: '15px', fontWeight: 700, padding: '0 12px', minWidth: '70px', textAlign: 'center' }}>
                    Page {top5Page}
                  </span>

                  <button
                    onClick={() => handleSendTop5(top5Page + 1)}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    Next 5 <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Title Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="showTitleToggle"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="showTitleToggle" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                  Display &quot;TOURNAMENT STANDINGS&quot; Header Title
                </label>
              </div>

              <button
                onClick={() => handleSendTop5()}
                disabled={sendingTop5}
                style={{
                  marginTop: '10px',
                  padding: '12px 20px',
                  backgroundColor: '#A855F7',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send size={18} />
                {sendingTop5 ? 'Sending...' : 'Push Top 5 to Render'}
              </button>

              {/* URL Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => copyToClipboard(top5RenderUrl, 'Flexible Top 5 Render')}
                  style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Copy size={14} /> Copy OBS URL
                </button>
                <a
                  href={top5RenderUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
