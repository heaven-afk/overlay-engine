'use client';

import { useEffect, useState } from 'react';
import { 
  getSlots, getTemplates, saveSlot, deleteSlot,
  getTournaments, getTournamentAnalytics, getTeams,
  OverlaySlot, OverlayTemplate 
} from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Layers, Plus, Link as LinkIcon, Check, Copy, 
  Trash, RefreshCw, Send, Loader2, Play
} from 'lucide-react';

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

  // Selected tournament tracking per slot
  const [selectedTourneyId, setSelectedTourneyId] = useState<Record<string, string>>({});
  const [pushingId, setPushingId] = useState<string | null>(null);

  // Copy status mapping
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulation loading state
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  // Origin for browser links
  const [origin, setOrigin] = useState('');

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
        getTournaments()
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

  // Securely generate a random, unguessable render token
  function generateToken() {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
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

  // Pushes actual live statistics from Firebase database
  async function pushRealTournamentData(slot: OverlaySlot) {
    const tourneyId = selectedTourneyId[slot.id!];
    if (!tourneyId) {
      alert('Please select a tournament from the dropdown first.');
      return;
    }

    try {
      setPushingId(slot.id!);
      const analytics = await getTournamentAnalytics(tourneyId);
      
      let standings: any[] = analytics;
      
      // Fallback: If no match results exist for this tournament yet, load global teams registry
      if (!standings || standings.length === 0) {
        const globalTeams = await getTeams();
        standings = globalTeams.map((t: any, i) => ({
          teamId: t.id,
          teamName: t.teamName,
          clanName: t.clanName || '',
          logoUrl: t.logoUrl || '',
          wins: 0,
          matches: 0,
          placementPts: 0,
          kills: 0,
          damage: 0,
          bonusPts: 0,
          totalPts: 0,
          analytics: {
            PPM: 0,
            KPM: 0,
            avgPlace: 0,
            killPct: 0,
            placementEfficiency: 0,
            top3Rate: 0,
            top5Rate: 0,
            winRate: 0,
          },
          scores: {
            POWER: 50,
            PLACEMENT: 50,
            CONVERSION: 50,
            FORM: 50,
            TEAM_RATING: 50,
            FINAL_RATING: 500,
            rankLabel: 'Challenger',
          },
          labels: {
            playstyle: 'Standard',
            powerLabel: 'Standard',
            placementLabel: 'Standard',
            conversionLabel: 'Standard',
            formLabel: 'Steady',
          },
          identity: 'Challenger',
          analyticsRank: i + 1,
          killsCurrent: 0,
          placementCurrent: 0
        }));
      }

      const team1 = standings[0] || {};
      const team2 = standings[1] || {};
      const team3 = standings[2] || {};
      const team4 = standings[3] || {};
      const team5 = standings[4] || {};

      const realPayload = {
        team: team1,
        team1,
        team2,
        team3,
        team4,
        team5,
        teams: standings
      };

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: realPayload,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      setSlots((prev) => 
        prev.map((s) => (s.id === slot.id ? { ...s, currentData: realPayload } : s))
      );
    } catch (err) {
      console.error('Error pushing tournament standings:', err);
      alert('Failed to push live statistics.');
    } finally {
      setPushingId(null);
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to simulate pushing fake broadcast data to test the overlay live
  async function simulateDataPush(slot: OverlaySlot) {
    try {
      setSimulatingId(slot.id!);
      
      const team1 = {
        teamId: 'mgl-mock-team-1',
        teamName: 'Nova Slayers',
        clanName: 'NOVA GAMING',
        logoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop',
        wins: 4,
        matches: 12,
        placementPts: 140,
        kills: 92,
        damage: 18450,
        bonusPts: 10,
        totalPts: 334,
        analytics: {
          PPM: 27.83,
          KPM: 7.67,
          avgPlace: 3.25,
          killPct: 55.09,
          placementEfficiency: 11.67,
          top3Rate: 66.67,
          top5Rate: 83.33,
          winRate: 33.33,
        },
        scores: {
          POWER: 88.5,
          PLACEMENT: 91.2,
          CONVERSION: 82.4,
          FORM: 89.0,
          TEAM_RATING: 87.9,
          FINAL_RATING: 879,
          rankLabel: 'Elite Rank',
        },
        labels: {
          playstyle: 'Aggressive Clutch',
          powerLabel: 'Elite',
          placementLabel: 'Dominant',
          conversionLabel: 'Clutch',
          formLabel: 'Red Hot',
        },
        identity: 'Slayer',
        analyticsRank: 1,
        killsCurrent: 14,
        placementCurrent: 2
      };

      const team2 = {
        teamId: 'mgl-mock-team-2',
        teamName: 'Apex Predators',
        clanName: 'APEX ESPORTS',
        logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop',
        wins: 3,
        matches: 12,
        placementPts: 120,
        kills: 80,
        damage: 16200,
        bonusPts: 5,
        totalPts: 285,
        analytics: {
          PPM: 23.75,
          KPM: 6.67,
          avgPlace: 4.12,
          killPct: 56.14,
          placementEfficiency: 10.00,
          top3Rate: 50.00,
          top5Rate: 75.00,
          winRate: 25.00,
        },
        scores: {
          POWER: 81.2,
          PLACEMENT: 82.0,
          CONVERSION: 78.5,
          FORM: 84.2,
          TEAM_RATING: 81.2,
          FINAL_RATING: 812,
          rankLabel: 'Top Rank',
        },
        labels: {
          playstyle: 'Balanced',
          powerLabel: 'Strong',
          placementLabel: 'Controlled',
          conversionLabel: 'Efficient',
          formLabel: 'In Form',
        },
        identity: 'Balanced',
        analyticsRank: 2,
        killsCurrent: 10,
        placementCurrent: 4
      };

      const team3 = {
        teamId: 'mgl-mock-team-3',
        teamName: 'Cobra Esports',
        clanName: 'COBRA CLAN',
        logoUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=120&auto=format&fit=crop',
        wins: 2,
        matches: 12,
        placementPts: 105,
        kills: 72,
        damage: 14900,
        bonusPts: 0,
        totalPts: 249,
        analytics: {
          PPM: 20.75,
          KPM: 6.00,
          avgPlace: 5.05,
          killPct: 57.83,
          placementEfficiency: 8.75,
          top3Rate: 41.67,
          top5Rate: 66.67,
          winRate: 16.67,
        },
        scores: {
          POWER: 75.0,
          PLACEMENT: 76.4,
          CONVERSION: 70.2,
          FORM: 78.0,
          TEAM_RATING: 74.8,
          FINAL_RATING: 748,
          rankLabel: 'Pro Rank',
        },
        labels: {
          playstyle: 'Defensive',
          powerLabel: 'Strong',
          placementLabel: 'Stable',
          conversionLabel: 'Average',
          formLabel: 'Steady',
        },
        identity: 'Survivalist',
        analyticsRank: 3,
        killsCurrent: 6,
        placementCurrent: 5
      };

      const team4 = {
        teamId: 'mgl-mock-team-4',
        teamName: 'Shadow Mercs',
        clanName: 'SHADOWS',
        logoUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=120&auto=format&fit=crop',
        wins: 1,
        matches: 12,
        placementPts: 85,
        kills: 60,
        damage: 12100,
        bonusPts: 0,
        totalPts: 205,
        analytics: {
          PPM: 17.08,
          KPM: 5.00,
          avgPlace: 6.20,
          killPct: 58.54,
          placementEfficiency: 7.08,
          top3Rate: 33.33,
          top5Rate: 58.33,
          winRate: 8.33,
        },
        scores: {
          POWER: 65.4,
          PLACEMENT: 64.5,
          CONVERSION: 60.1,
          FORM: 68.4,
          TEAM_RATING: 64.5,
          FINAL_RATING: 645,
          rankLabel: 'Pro Rank',
        },
        labels: {
          playstyle: 'Balanced',
          powerLabel: 'Strong',
          placementLabel: 'Stable',
          conversionLabel: 'Average',
          formLabel: 'Steady',
        },
        identity: 'Balanced',
        analyticsRank: 4,
        killsCurrent: 8,
        placementCurrent: 6
      };

      const team5 = {
        teamId: 'mgl-mock-team-5',
        teamName: 'Alpha Wolves',
        clanName: 'WOLVES',
        logoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop',
        wins: 1,
        matches: 12,
        placementPts: 70,
        kills: 52,
        damage: 10450,
        bonusPts: 0,
        totalPts: 174,
        analytics: {
          PPM: 14.50,
          KPM: 4.33,
          avgPlace: 7.15,
          killPct: 59.77,
          placementEfficiency: 5.83,
          top3Rate: 25.00,
          top5Rate: 50.00,
          winRate: 8.33,
        },
        scores: {
          POWER: 58.0,
          PLACEMENT: 57.2,
          CONVERSION: 56.4,
          FORM: 60.5,
          TEAM_RATING: 57.5,
          FINAL_RATING: 575,
          rankLabel: 'Mid Rank',
        },
        labels: {
          playstyle: 'Defensive',
          powerLabel: 'Balanced',
          placementLabel: 'Stable',
          conversionLabel: 'Average',
          formLabel: 'Steady',
        },
        identity: 'Survivalist',
        analyticsRank: 5,
        killsCurrent: 4,
        placementCurrent: 8
      };

      const mockTeamData = {
        team: team1,
        team1,
        team2,
        team3,
        team4,
        team5,
        teams: [team1, team2, team3, team4, team5]
      };

      const updatedSlot: Omit<OverlaySlot, 'id'> = {
        name: slot.name,
        slotType: slot.slotType,
        assignedTemplateId: slot.assignedTemplateId,
        currentData: mockTeamData,
        publicRenderToken: slot.publicRenderToken,
      };

      await saveSlot(updatedSlot, slot.id);
      
      // Update local state
      setSlots((prev) => 
        prev.map((s) => (s.id === slot.id ? { ...s, currentData: mockTeamData } : s))
      );
    } catch (err) {
      console.error('Error simulating push:', err);
      alert('Failed to simulate data push');
    } finally {
      setSimulatingId(null);
    }
  }

  // Clear data from a slot
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
            flexWrap: 'wrap'
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
          color: 'var(--text-muted)'
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
                      {slot.slotType.replace('_', ' ').toUpperCase()}
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
                  {/* Left Column: Link template & settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                    {/* SELECT REAL TOURNAMENT STANDINGS FOR LIVE PUSH */}
                    <div style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <span className="slot-control-label" style={{ margin: 0, fontWeight: 600 }}>Push Real Tournament Data</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                          className="select-input"
                          style={{ flexGrow: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                          value={selectedTourneyId[slot.id!] || ''}
                          onChange={(e) => setSelectedTourneyId(prev => ({ ...prev, [slot.id!]: e.target.value }))}
                        >
                          <option value="">-- Choose Tournament --</option>
                          {tournaments.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => pushRealTournamentData(slot)}
                          className="btn btn-primary btn-sm"
                          style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          disabled={pushingId === slot.id}
                        >
                          {pushingId === slot.id ? (
                            <Loader2 className="animate-spin" style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Send style={{ width: '13px', height: '13px' }} />
                          )}
                          Push
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => simulateDataPush(slot)}
                        className="btn btn-secondary btn-sm"
                        disabled={simulatingId === slot.id}
                        style={{ flexGrow: 1 }}
                      >
                        {simulatingId === slot.id ? (
                          <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                        ) : (
                          <Play style={{ width: '14px', height: '14px' }} />
                        )}
                        Simulate Mock Data
                      </button>

                      {slot.currentData && (
                        <button
                          onClick={() => clearSlotData(slot)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.45rem 0.75rem' }}
                          title="Clear current data"
                        >
                          Clear Data
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Data Payload inspect */}
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
                        fontSize: '0.85rem'
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
