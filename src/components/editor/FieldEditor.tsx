'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { TemplateType, getTournamentGroups } from '@/lib/db';
import {
  getTopStandings,
  getDailyStandings,
  compareEntities,
  getProfile,
  getGlobalRankings,
  getLobbyKills,
  getTeamKills,
} from '@/lib/statsApi';

interface FieldEditorProps {
  /** The template type of the currently selected template */
  templateType: TemplateType | undefined;
  /** Tournaments list — pass in from workspace */
  tournaments: any[];
  /** Called after a successful fetch with the new fields payload */
  onFetched: (fields: Record<string, any>) => void;
  /** Current fields state in studio workspace */
  fields?: Record<string, any>;
  /** Direct field update handler for real-time live editing */
  onFieldsChange?: (updatedFields: Record<string, any>) => void;
}

// ─── Sub-editor: Top / Overall / Hybrid-era Standings ─────────────────────────
function StandingsFetchEditor({
  label,
  tournaments,
  defaultN,
  onFetched,
}: {
  label: string;
  tournaments: any[];
  defaultN: number;
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [tournamentId, setTournamentId] = useState('');
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [customGroupId, setCustomGroupId] = useState('');
  const [type, setType] = useState<'team' | 'player'>('team');
  const [n, setN] = useState(defaultN);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const selectedT = tournaments.find((t) => t.id === tournamentId);
  const isQualifier = Boolean(
    selectedT?.type === 'qualifier' ||
    selectedT?.format === 'qualifier' ||
    selectedT?.isQualifier === true ||
    availableGroups.length > 0
  );

  useEffect(() => {
    if (!tournamentId) {
      setAvailableGroups([]);
      setSelectedGroup('all');
      return;
    }
    getTournamentGroups(tournamentId)
      .then((groups) => {
        setAvailableGroups(groups);
        setSelectedGroup('all');
      })
      .catch(() => {
        setAvailableGroups([]);
        setSelectedGroup('all');
      });
  }, [tournamentId]);

  async function handleFetch() {
    if (!tournamentId) {
      alert('Please select a tournament first.');
      return;
    }

    const activeGroupId = isQualifier
      ? selectedGroup === 'custom'
        ? customGroupId.trim()
        : (selectedGroup === 'all' ? undefined : selectedGroup)
      : undefined;

    try {
      setLoading(true);
      setWarning('');

      const { results } = await getTopStandings(tournamentId, n, type, activeGroupId);

      if (!results || results.length === 0) {
        setWarning(`No standings data available for ${selectedT?.name || tournamentId}${activeGroupId ? ` in group "${activeGroupId}"` : ''}.`);
        return;
      }

      // Build unified data payload satisfying ALL template component expectations
      const payload: Record<string, any> = {
        results,
        rows: results,
        teams: results,
        players: results,
        [`${type}s`]: results,
        selectedGroup: activeGroupId || 'all',
        currentData: {
          results,
          rows: results,
          teams: results,
          players: results,
          [`${type}s`]: results,
          groupId: activeGroupId || 'all',
        },
      };

      // Individual item aliases (e.g., team1, team2 / player1, player2)
      results.forEach((entity: any, i: number) => {
        payload[`${type}${i + 1}`] = entity;
        payload[`row${i + 1}`] = entity;
      });
      if (results[0]) {
        payload[type] = results[0];
      }

      onFetched(payload);
    } catch (err: any) {
      console.error('Standings fetch error:', err);
      alert(`Failed to load statistics: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        {label} (Workspace)
      </span>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={selectStyle}
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} {t.format === 'qualifier' || t.isQualifier ? '(Qualifier)' : '(Standard)'}</option>
          ))}
        </select>

        {isQualifier && (
          <select
            className="select-input"
            style={{ ...selectStyle, flex: 1 }}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="all">All Groups</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
            <option value="custom">✏ Custom Group ID…</option>
          </select>
        )}

        <select
          className="select-input"
          style={{ ...selectStyle, flex: 1 }}
          value={type}
          onChange={(e) => setType(e.target.value as 'team' | 'player')}
        >
          <option value="team">Teams</option>
          <option value="player">Players</option>
        </select>
      </div>

      {isQualifier && selectedGroup === 'custom' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={labelStyle}>Group ID / Name:</label>
          <input
            type="text"
            className="text-input"
            style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            placeholder="e.g. Group A, Qualifiers-1, etc."
            value={customGroupId}
            onChange={(e) => setCustomGroupId(e.target.value)}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={labelStyle}>Top N</label>
        <input
          type="number"
          min={1}
          max={50}
          className="text-input"
          style={{ width: '64px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
        <button
          onClick={handleFetch}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={fetchBtnStyle}
        >
          {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
          Update Draft Data
        </button>
      </div>

      {warning && <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: 0 }}>⚠ {warning}</p>}
    </div>
  );
}

// ─── Sub-editor: Daily Standings ───────────────────────────────────────────────
function DailyFetchEditor({
  tournaments,
  onFetched,
}: {
  tournaments: any[];
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [tournamentId, setTournamentId] = useState('');
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [customGroupId, setCustomGroupId] = useState('');
  const [day, setDay] = useState(1);
  const [mode, setMode] = useState<'full_day' | 'single_lobby'>('full_day');
  const [lobby, setLobby] = useState<number | ''>('');
  const [n, setN] = useState(5);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const selectedT = tournaments.find((t) => t.id === tournamentId);
  const isQualifier = Boolean(
    selectedT?.type === 'qualifier' ||
    selectedT?.format === 'qualifier' ||
    selectedT?.isQualifier === true ||
    availableGroups.length > 0
  );

  // Fetch groups dynamically whenever tournament changes
  useEffect(() => {
    if (!tournamentId) {
      setAvailableGroups([]);
      setSelectedGroup('all');
      return;
    }
    getTournamentGroups(tournamentId)
      .then((groups) => {
        setAvailableGroups(groups);
        setSelectedGroup('all');
      })
      .catch(() => {
        setAvailableGroups([]);
        setSelectedGroup('all');
      });
  }, [tournamentId]);

  async function handleFetch() {
    if (!tournamentId) {
      alert('Please select a tournament first.');
      return;
    }

    const activeGroupId = isQualifier
      ? selectedGroup === 'custom'
        ? customGroupId.trim()
        : (selectedGroup === 'all' ? undefined : selectedGroup)
      : undefined;

    try {
      setLoading(true);
      setWarning('');

      const lobbyNum = mode === 'single_lobby' && lobby !== '' ? Number(lobby) : undefined;
      const data = await getDailyStandings(tournamentId, day, {
        lobby: lobbyNum,
        n,
        groupId: activeGroupId,
      });

      const results = data?.results || (Array.isArray(data) ? data : []);

      if (!results || results.length === 0) {
        setWarning(`No daily standings available for Day ${day}${activeGroupId ? ` in group "${activeGroupId}"` : ''}.`);
      }

      // Payload contains root-level fields AND currentData object for total component compatibility
      const payload: Record<string, any> = {
        ...data,
        results,
        rows: results,
        teams: results,
        players: results,
        selectedGroup: activeGroupId || 'all',
        currentData: {
          ...data,
          results,
          rows: results,
          teams: results,
          players: results,
          groupId: activeGroupId || 'all',
        },
      };

      onFetched(payload);
    } catch (err: any) {
      console.error('Daily standings fetch error:', err);
      alert(`Failed to load daily standings: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch Daily Standings Data (Workspace)
      </span>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={selectStyle}
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} {t.format === 'qualifier' || t.isQualifier ? '(Qualifier)' : '(Standard)'}</option>
          ))}
        </select>

        {isQualifier && (
          <select
            className="select-input"
            style={{ ...selectStyle, flex: 1 }}
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="all">All Groups</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
            <option value="custom">✏ Custom Group ID…</option>
          </select>
        )}
      </div>

      {isQualifier && selectedGroup === 'custom' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={labelStyle}>Group ID / Name:</label>
          <input
            type="text"
            className="text-input"
            style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            placeholder="e.g. Group A, Qualifiers-1, etc."
            value={customGroupId}
            onChange={(e) => setCustomGroupId(e.target.value)}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={labelStyle}>Day</label>
          <input
            type="number" min={1} className="text-input"
            style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            value={day} onChange={(e) => setDay(Number(e.target.value))}
          />
        </div>

        <select className="select-input" style={{ ...selectStyle, flex: 1 }} value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="full_day">Full Day</option>
          <option value="single_lobby">Single Lobby</option>
        </select>

        {mode === 'single_lobby' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={labelStyle}>Lobby</label>
            <input
              type="number" min={1} className="text-input"
              style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={lobby} onChange={(e) => setLobby(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={labelStyle}>Top N</label>
          <input
            type="number" min={1} max={50} className="text-input"
            style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            value={n} onChange={(e) => setN(Number(e.target.value))}
          />
        </div>
      </div>

      <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
        {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
        Update Draft Data
      </button>

      {warning && <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: 0 }}>⚠ {warning}</p>}
    </div>
  );
}

// ─── Sub-editor: Head to Head ──────────────────────────────────────────────────
function H2HFetchEditor({
  tournaments,
  onFetched,
}: {
  tournaments: any[];
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [entityType, setEntityType] = useState<'team' | 'player'>('team');
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [scopeTournamentId, setScopeTournamentId] = useState('');
  const [loading, setLoading] = useState(false);

  const [globalEntities, setGlobalEntities] = useState<any[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    setGlobalEntities([]);
    setTournamentParticipants([]);
    setIdA('');
    setIdB('');
  }, [entityType]);

  // Load global entities and tournament-scoped participants whenever scopeTournamentId changes
  useEffect(() => {
    let active = true;
    async function loadData() {
      setPickerLoading(true);
      try {
        const [globalRes, tourneyRes] = await Promise.all([
          getGlobalRankings(entityType, entityType === 'team' ? 50 : 100).catch(() => ({ results: [] })),
          scopeTournamentId
            ? getTopStandings(scopeTournamentId, 50, entityType).catch(() => ({ results: [] }))
            : Promise.resolve({ results: [] }),
        ]);

        if (!active) return;
        setGlobalEntities(globalRes.results || []);
        setTournamentParticipants(tourneyRes.results || []);
      } catch (err) {
        console.error('Error loading entity pickers:', err);
      } finally {
        if (active) setPickerLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [entityType, scopeTournamentId]);

  async function handleFetch() {
    if (!idA || !idB) { alert('Please select both entities to compare.'); return; }
    try {
      setLoading(true);
      const data = await compareEntities(entityType, idA, idB, scopeTournamentId || undefined);

      const rawA = data.teamA || data.playerA || {};
      const rawB = data.teamB || data.playerB || {};

      const nameA = rawA.teamName || rawA.playerName || rawA.ign || rawA.name || 'Entity A';
      const nameB = rawB.teamName || rawB.playerName || rawB.ign || rawB.name || 'Entity B';

      const entityA = {
        ...rawA,
        teamName: nameA,
        playerName: nameA,
        logoUrl: rawA.logoUrl || rawA.avatarUrl || rawA.playerAvatarUrl || '',
        analytics: {
          PPM: rawA.analytics?.PPM ?? rawA.PPM ?? 0,
          KPM: rawA.analytics?.KPM ?? rawA.KPM ?? 0,
          killPct: rawA.analytics?.killPct ?? rawA.killPct ?? 0,
          winRate: rawA.analytics?.winRate ?? rawA.winRate ?? 0,
          top5Rate: rawA.analytics?.top5Rate ?? rawA.top5Rate ?? 0,
          avgPlace: rawA.analytics?.avgPlace ?? rawA.avgPlace ?? rawA.avgPlacement ?? 0,
          ...rawA.analytics,
        },
      };

      const entityB = {
        ...rawB,
        teamName: nameB,
        playerName: nameB,
        logoUrl: rawB.logoUrl || rawB.avatarUrl || rawB.playerAvatarUrl || '',
        analytics: {
          PPM: rawB.analytics?.PPM ?? rawB.PPM ?? 0,
          KPM: rawB.analytics?.KPM ?? rawB.KPM ?? 0,
          killPct: rawB.analytics?.killPct ?? rawB.killPct ?? 0,
          winRate: rawB.analytics?.winRate ?? rawB.winRate ?? 0,
          top5Rate: rawB.analytics?.top5Rate ?? rawB.top5Rate ?? 0,
          avgPlace: rawB.analytics?.avgPlace ?? rawB.avgPlace ?? rawB.avgPlacement ?? 0,
          ...rawB.analytics,
        },
      };

      onFetched({
        teamA: entityA,
        teamB: entityB,
        playerA: entityA,
        playerB: entityB,
        entityA,
        entityB,
        scope: data.scope || { type: scopeTournamentId ? 'tournament' : 'career' },
        currentData: data,
      });
    } catch (err: any) {
      console.error('H2H fetch error:', err);
      alert(`Failed to load Head to Head data: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const nameKey = entityType === 'team' ? 'teamName' : 'playerName';
  const idKey = entityType === 'team' ? 'teamId' : 'playerId';

  const participantIds = new Set(
    tournamentParticipants.map((p) => p[idKey] || p.id).filter(Boolean)
  );

  const otherEntities = globalEntities.filter(
    (e) => !participantIds.has(e[idKey] || e.id)
  );

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch Head to Head Data (Workspace)
      </span>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select className="select-input" style={{ ...selectStyle, flex: 1 }} value={entityType} onChange={(e) => setEntityType(e.target.value as any)}>
          <option value="team">Teams</option>
          <option value="player">Players</option>
        </select>

        <select className="select-input" style={{ ...selectStyle, flex: 2 }} value={scopeTournamentId} onChange={(e) => setScopeTournamentId(e.target.value)}>
          <option value="">Scope: Career-Wide</option>
          {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={selectStyle}
          value={idA}
          onChange={(e) => setIdA(e.target.value)}
        >
          <option value="">-- Choose Entity A --</option>
          {pickerLoading && <option disabled>Loading entities…</option>}
          {tournamentParticipants.length > 0 && (
            <optgroup label="⚡ Tournament Participants (Active in Selected Event)">
              {tournamentParticipants.map((e: any) => {
                const id = e[idKey] || e.id;
                const name = e[nameKey] || e.ign || e.name;
                return <option key={id} value={id}>🟢 {name} (Played in Event)</option>;
              })}
            </optgroup>
          )}
          <optgroup label={tournamentParticipants.length > 0 ? "🌐 Other Registered Entities" : "Registered Entities"}>
            {otherEntities.map((e: any) => {
              const id = e[idKey] || e.id;
              const name = e[nameKey] || e.ign || e.name;
              return <option key={id} value={id}>{name}</option>;
            })}
          </optgroup>
        </select>

        <select
          className="select-input"
          style={selectStyle}
          value={idB}
          onChange={(e) => setIdB(e.target.value)}
        >
          <option value="">-- Choose Entity B --</option>
          {pickerLoading && <option disabled>Loading entities…</option>}
          {tournamentParticipants.length > 0 && (
            <optgroup label="⚡ Tournament Participants (Active in Selected Event)">
              {tournamentParticipants.map((e: any) => {
                const id = e[idKey] || e.id;
                const name = e[nameKey] || e.ign || e.name;
                return <option key={id} value={id}>🟢 {name} (Played in Event)</option>;
              })}
            </optgroup>
          )}
          <optgroup label={tournamentParticipants.length > 0 ? "🌐 Other Registered Entities" : "Registered Entities"}>
            {otherEntities.map((e: any) => {
              const id = e[idKey] || e.id;
              const name = e[nameKey] || e.ign || e.name;
              return <option key={id} value={id}>{name}</option>;
            })}
          </optgroup>
        </select>
      </div>

      <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
        {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
        Update Draft Data
      </button>
    </div>
  );
}

// ─── Sub-editor: Team / Player Profile ────────────────────────────────────────
function ProfileFetchEditor({
  type,
  tournaments,
  onFetched,
}: {
  type: 'team' | 'player';
  tournaments: any[];
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [globalEntities, setGlobalEntities] = useState<any[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameKey = type === 'team' ? 'teamName' : 'playerName';
  const idKey = type === 'team' ? 'teamId' : 'playerId';

  useEffect(() => {
    let active = true;
    async function loadData() {
      setPickerLoading(true);
      try {
        const [globalRes, tourneyRes] = await Promise.all([
          getGlobalRankings(type, type === 'team' ? 50 : 100).catch(() => ({ results: [] })),
          selectedTournamentId
            ? getTopStandings(selectedTournamentId, 50, type).catch(() => ({ results: [] }))
            : Promise.resolve({ results: [] }),
        ]);

        if (!active) return;
        setGlobalEntities(globalRes.results || []);
        setTournamentParticipants(tourneyRes.results || []);
      } catch (err) {
        console.error('Error loading profile pickers:', err);
      } finally {
        if (active) setPickerLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [type, selectedTournamentId]);

  async function handleFetch() {
    if (!selectedId) { alert(`Please select a ${type} first.`); return; }
    try {
      setLoading(true);
      const data = await getProfile(type, selectedId);
      const merged = { ...data.profile, ...data.careerStats };
      onFetched({
        [type]: merged,
        profile: merged,
        currentData: data,
      });
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      alert(`Failed to load ${type} profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const participantIds = new Set(
    tournamentParticipants.map((p) => p[idKey] || p.id).filter(Boolean)
  );

  const otherEntities = globalEntities.filter(
    (e) => !participantIds.has(e[idKey] || e.id)
  );

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch {type === 'team' ? 'Team' : 'Player'} Profile (Workspace)
      </span>

      <select className="select-input" style={selectStyle} value={selectedTournamentId} onChange={(e) => setSelectedTournamentId(e.target.value)}>
        <option value="">Filter by Tournament (Optional)</option>
        {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <select
        className="select-input"
        style={selectStyle}
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">-- Choose {type === 'team' ? 'Team' : 'Player'} --</option>
        {pickerLoading && <option disabled>Loading entities…</option>}
        {tournamentParticipants.length > 0 && (
          <optgroup label="⚡ Tournament Participants (Active in Selected Event)">
            {tournamentParticipants.map((e: any) => {
              const id = e[idKey] || e.id;
              const name = e[nameKey] || e.ign || e.name;
              return <option key={id} value={id}>🟢 {name} (Played in Event)</option>;
            })}
          </optgroup>
        )}
        <optgroup label={tournamentParticipants.length > 0 ? "🌐 Other Registered Entities" : "Registered Entities"}>
          {otherEntities.map((e: any) => {
            const id = e[idKey] || e.id;
            const name = e[nameKey] || e.ign || e.name;
            return <option key={id} value={id}>{name}</option>;
          })}
        </optgroup>
      </select>

      <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
        {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
        Update Draft Data
      </button>
    </div>
  );
}

// ─── Sub-editor: Hybrid Era Top 5 & Flexible Top 5 (Daily + Collation) ────────
function HybridEraFetchEditor({
  label = 'Fetch Standings Data (Workspace)',
  tournaments,
  defaultN = 5,
  onFetched,
}: {
  label?: string;
  tournaments: any[];
  defaultN?: number;
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [mode, setMode] = useState<'daily' | 'collation'>('daily');
  const [tournamentId, setTournamentId] = useState('');
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [customGroupId, setCustomGroupId] = useState('');
  const [day, setDay] = useState(1);
  const [lobby, setLobby] = useState<number | ''>('');
  const [lobbyMode, setLobbyMode] = useState<'full_day' | 'single_lobby'>('full_day');
  const [n, setN] = useState(defaultN);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  const selectedT = tournaments.find((t) => t.id === tournamentId);
  const isQualifier = Boolean(
    selectedT?.type === 'qualifier' ||
    selectedT?.format === 'qualifier' ||
    selectedT?.isQualifier === true ||
    availableGroups.length > 0
  );

  useEffect(() => {
    if (!tournamentId) { setAvailableGroups([]); setSelectedGroup('all'); return; }
    getTournamentGroups(tournamentId)
      .then((groups) => { setAvailableGroups(groups); setSelectedGroup('all'); })
      .catch(() => { setAvailableGroups([]); setSelectedGroup('all'); });
  }, [tournamentId]);

  async function handleFetch() {
    if (!tournamentId) { alert('Please select a tournament first.'); return; }
    const activeGroupId = isQualifier
      ? selectedGroup === 'custom'
        ? customGroupId.trim()
        : (selectedGroup === 'all' ? undefined : selectedGroup)
      : undefined;

    try {
      setLoading(true);
      setWarning('');

      if (mode === 'daily') {
        const lobbyNum = lobbyMode === 'single_lobby' && lobby !== '' ? Number(lobby) : undefined;
        const data = await getDailyStandings(tournamentId, day, { lobby: lobbyNum, n, groupId: activeGroupId });
        const results = data?.results || (Array.isArray(data) ? data : []);
        if (!results || results.length === 0) {
          setWarning(`No daily standings available for Day ${day}${activeGroupId ? ` in group "${activeGroupId}"` : ''}.`);
        }
        const payload: Record<string, any> = {
          ...data, results, rows: results, teams: results, players: results,
          hybridEraMode: mode,
          day,
          lobbyMode,
          lobby: lobbyMode === 'single_lobby' && lobby !== '' ? Number(lobby) : undefined,
          selectedGroup: activeGroupId || 'all',
          currentData: { ...data, results, rows: results, teams: results, players: results, groupId: activeGroupId || 'all' },
        };
        results.forEach((entity: any, i: number) => { payload[`team${i + 1}`] = entity; payload[`row${i + 1}`] = entity; });
        if (results[0]) payload['team'] = results[0];
        onFetched(payload);
      } else {
        const { results } = await getTopStandings(tournamentId, n, 'team', activeGroupId);
        if (!results || results.length === 0) {
          setWarning(`No standings data available for ${selectedT?.name || tournamentId}${activeGroupId ? ` in group "${activeGroupId}"` : ''}.`);
        }
        const payload: Record<string, any> = {
          results, rows: results, teams: results, players: results,
          hybridEraMode: mode,
          selectedGroup: activeGroupId || 'all',
          currentData: { results, rows: results, teams: results, players: results, groupId: activeGroupId || 'all' },
        };
        results.forEach((entity: any, i: number) => { payload[`team${i + 1}`] = entity; payload[`row${i + 1}`] = entity; });
        if (results[0]) payload['team'] = results[0];
        onFetched(payload);
      }
    } catch (err: any) {
      console.error('Hybrid Era fetch error:', err);
      alert(`Failed to load data: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        {label}
      </span>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setMode('daily')}
          className={`toggle-btn${mode === 'daily' ? ' active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '3px 12px', height: '28px' }}
        >
          Daily Results
        </button>
        <button
          type="button"
          onClick={() => setMode('collation')}
          className={`toggle-btn${mode === 'collation' ? ' active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '3px 12px', height: '28px' }}
        >
          Collation
        </button>
      </div>

      {/* Tournament + Group */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select className="select-input" style={selectStyle} value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} {t.format === 'qualifier' || t.isQualifier ? '(Qualifier)' : '(Standard)'}</option>
          ))}
        </select>

        {isQualifier && (
          <select className="select-input" style={{ ...selectStyle, flex: 1 }} value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">All Groups</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
            <option value="custom">✏ Custom Group ID…</option>
          </select>
        )}
      </div>

      {isQualifier && selectedGroup === 'custom' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={labelStyle}>Group ID / Name:</label>
          <input
            type="text"
            className="text-input"
            style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            placeholder="e.g. Group A, Qualifiers-1, etc."
            value={customGroupId}
            onChange={(e) => setCustomGroupId(e.target.value)}
          />
        </div>
      )}

      {/* Day controls — only shown in Daily mode */}
      {mode === 'daily' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={labelStyle}>Day</label>
            <input
              type="number" min={1} className="text-input"
              style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={day} onChange={(e) => setDay(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <select className="select-input" style={{ ...selectStyle, flex: 1 }} value={lobbyMode} onChange={(e) => setLobbyMode(e.target.value as any)}>
            <option value="full_day">Full Day</option>
            <option value="single_lobby">Single Lobby</option>
          </select>
          {lobbyMode === 'single_lobby' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={labelStyle}>Lobby</label>
              <input
                type="number" min={1} className="text-input"
                style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                value={lobby} onChange={(e) => setLobby(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={labelStyle}>Top N</label>
        <input
          type="number" min={1} max={50} className="text-input"
          style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
          value={n} onChange={(e) => setN(Number(e.target.value))}
        />
        <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
          {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
          Update Draft Data
        </button>
      </div>

      {warning && <p style={{ fontSize: '0.75rem', color: '#fbbf24', margin: 0 }}>⚠ {warning}</p>}
    </div>
  );
}

// ─── Sub-editor: Team Roster Kills ─────────────────────────────────────────────
function TeamRosterKillsFetchEditor({
  tournaments,
  onFetched,
}: {
  tournaments: any[];
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [tournamentId, setTournamentId] = useState('');
  const [scope, setScope] = useState<'lobby' | 'daily' | 'collation'>('lobby');
  const [day, setDay] = useState(1);
  const [lobby, setLobby] = useState(1);
  const [teamId, setTeamId] = useState('');
  const [globalEntities, setGlobalEntities] = useState<any[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTeams() {
      setPickerLoading(true);
      try {
        const [globalRes, tourneyRes] = await Promise.all([
          getGlobalRankings('team', 50).catch(() => ({ results: [] })),
          tournamentId
            ? getTopStandings(tournamentId, 50, 'team').catch(() => ({ results: [] }))
            : Promise.resolve({ results: [] }),
        ]);

        if (!active) return;
        setGlobalEntities(globalRes.results || []);
        setTournamentParticipants(tourneyRes.results || []);
      } catch (err) {
        console.error('Error loading team roster pickers:', err);
      } finally {
        if (active) setPickerLoading(false);
      }
    }
    loadTeams();
    return () => { active = false; };
  }, [tournamentId]);

  async function handleFetch() {
    if (!tournamentId || !teamId) {
      alert('Please select both a tournament and a team.');
      return;
    }
    try {
      setLoading(true);
      const data = scope === 'lobby'
        ? await getLobbyKills(tournamentId, day, lobby, teamId)
        : await getTeamKills(tournamentId, teamId, scope, scope === 'daily' ? day : undefined);
      onFetched({
        ...data,
        tournamentId,
        teamId,
        scope,
        day,
        lobby,
      });
    } catch (err: any) {
      console.error('Roster kills fetch error:', err);
      alert(`Failed to fetch roster kills: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  const participantIds = new Set(
    tournamentParticipants.map((p) => p.teamId || p.id).filter(Boolean)
  );

  const otherEntities = globalEntities.filter(
    (e) => !participantIds.has(e.teamId || e.id)
  );

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch Team Roster Kills (Workspace)
      </span>

      {/* Scope toggle: Lobby vs Daily vs Collation */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setScope('lobby')}
          className={`toggle-btn${scope === 'lobby' ? ' active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '3px 12px', height: '28px' }}
        >
          Lobby
        </button>
        <button
          type="button"
          onClick={() => setScope('daily')}
          className={`toggle-btn${scope === 'daily' ? ' active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '3px 12px', height: '28px' }}
        >
          Daily Results
        </button>
        <button
          type="button"
          onClick={() => setScope('collation')}
          className={`toggle-btn${scope === 'collation' ? ' active' : ''}`}
          style={{ fontSize: '0.75rem', padding: '3px 12px', height: '28px' }}
        >
          Collation
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={selectStyle}
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          className="select-input"
          style={selectStyle}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">-- Choose Team --</option>
          {pickerLoading && <option disabled>Loading teams…</option>}
          {tournamentParticipants.length > 0 && (
            <optgroup label="⚡ Tournament Participants (Active in Selected Event)">
              {tournamentParticipants.map((e: any) => {
                const id = e.teamId || e.id;
                const name = e.teamName || e.name;
                return <option key={id} value={id}>🟢 {name} (Played in Event)</option>;
              })}
            </optgroup>
          )}
          <optgroup label={tournamentParticipants.length > 0 ? "🌐 Other Registered Entities" : "Registered Teams"}>
            {otherEntities.map((e: any) => {
              const id = e.teamId || e.id;
              const name = e.teamName || e.name;
              return <option key={id} value={id}>{name}</option>;
            })}
          </optgroup>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {(scope === 'daily' || scope === 'lobby') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={labelStyle}>Day</label>
            <input
              type="number"
              min={1}
              className="text-input"
              style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </div>
        )}

        {scope === 'lobby' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={labelStyle}>Lobby</label>
            <input
              type="number"
              min={1}
              className="text-input"
              style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
              value={lobby}
              onChange={(e) => setLobby(Number(e.target.value))}
            />
          </div>
        )}

        <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={{ ...fetchBtnStyle, flex: 1 }}>
          {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
          Update Draft Data
        </button>
      </div>
    </div>
  );
}

// ─── Custom Media notice ───────────────────────────────────────────────────────
function CustomMediaEditor() {
  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>Custom Media</span>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
        Custom Media templates display the URL configured in the Template Editor.
        No data fetch is needed — push directly to Livestream.
      </p>
    </div>
  );
}

// ─── Shared style constants ────────────────────────────────────────────────────
const wrapperStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  fontSize: '0.8rem',
  height: '32px',
  flex: 2,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const fetchBtnStyle: React.CSSProperties = {
  height: '32px',
  fontSize: '0.8rem',
  padding: '0 0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const iconStyle: React.CSSProperties = { width: '13px', height: '13px' };

// ─── Sub-editor: Subheader Badge Text Editor ─────────────────────────────────
export function SubheaderBadgeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const presets = [
    'AFTER GAME ONE',
    'AFTER GAME TWO',
    'AFTER GAME THREE',
    'DAY 1 RESULTS',
    'OVERALL COLLATION',
    'GAME 4 STANDINGS',
    'FINALS DAY 2',
    'MATCH 5 LIVE',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <label
        style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: 'var(--text-muted, #94a3b8)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Subheader Badge Text
      </label>
      <input
        type="text"
        className="text-input"
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '0.88rem',
          fontWeight: 700,
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          letterSpacing: '0.04em',
          boxSizing: 'border-box',
        }}
        value={value || ''}
        placeholder="e.g. AFTER GAME ONE"
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              background: 'rgba(236, 72, 153, 0.1)',
              color: '#EC4899',
              cursor: 'pointer',
              fontWeight: 800,
              letterSpacing: '0.03em',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(236, 72, 153, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.4)';
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main FieldEditor export ───────────────────────────────────────────────────
export function FieldEditor({
  templateType,
  tournaments,
  onFetched,
  fields = {},
  onFieldsChange,
}: FieldEditorProps) {
  if (!templateType) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Select a template above to see fetch controls.
      </p>
    );
  }

  const currentSubheader =
    fields?.hybridEraSubheader || fields?.graphicSubtitle || fields?.subheader || '';

  const handleSubheaderChange = (val: string) => {
    const updated = {
      ...fields,
      hybridEraSubheader: val,
      graphicSubtitle: val,
      subheader: val,
    };
    if (onFieldsChange) {
      onFieldsChange(updated);
    } else {
      onFetched(updated);
    }
  };

  const renderFetchControls = () => {
    switch (templateType) {
      case 'top_standings':
        return <StandingsFetchEditor label="Fetch Tournament Standings Data" tournaments={tournaments} defaultN={5} onFetched={onFetched} />;

      case 'overall_rankings_dual_column':
        return <StandingsFetchEditor label="Fetch Overall Rankings Data" tournaments={tournaments} defaultN={20} onFetched={onFetched} />;

      case 'top_5_overall':
        return <StandingsFetchEditor label="Fetch Top 5 Overall Data" tournaments={tournaments} defaultN={5} onFetched={onFetched} />;

      case 'hybrid_era_top5':
      case 'top5_graphic':
        return <HybridEraFetchEditor tournaments={tournaments} onFetched={onFetched} />;

      case 'team_roster_kills':
        return <TeamRosterKillsFetchEditor tournaments={tournaments} onFetched={onFetched} />;

      case 'flexible_top5':
        return <HybridEraFetchEditor label="Fetch Flexible Top 5 Data (Workspace)" tournaments={tournaments} defaultN={100} onFetched={onFetched} />;

      case 'match_summary':
        return <HybridEraFetchEditor label="Fetch Match Summary Data" tournaments={tournaments} defaultN={100} onFetched={onFetched} />;

      case 'daily_standings':
        return <DailyFetchEditor tournaments={tournaments} onFetched={onFetched} />;

      case 'head_to_head':
        return <H2HFetchEditor tournaments={tournaments} onFetched={onFetched} />;

      case 'team_profile':
        return <ProfileFetchEditor type="team" tournaments={tournaments} onFetched={onFetched} />;

      case 'player_profile':
        return <ProfileFetchEditor type="player" tournaments={tournaments} onFetched={onFetched} />;

      case 'custom_media':
        return <CustomMediaEditor />;

      default:
        return (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            No fetch controls available for this template type.
          </p>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {renderFetchControls()}
      <SubheaderBadgeEditor value={currentSubheader} onChange={handleSubheaderChange} />
    </div>
  );
}
