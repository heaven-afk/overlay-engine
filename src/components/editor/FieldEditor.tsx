'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import type { TemplateType } from '@/lib/db';
import {
  getTopStandings,
  getDailyStandings,
  compareEntities,
  getProfile,
  getGlobalRankings,
} from '@/lib/statsApi';

interface FieldEditorProps {
  /** The template type of the currently selected template */
  templateType: TemplateType | undefined;
  /** Tournaments list — pass in from workspace (already loaded there) */
  tournaments: any[];
  /** Called after a successful fetch with the new fields payload */
  onFetched: (fields: Record<string, any>) => void;
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
  const [groupId, setGroupId] = useState('all');
  const [type, setType] = useState<'team' | 'player'>('team');
  const [n, setN] = useState(defaultN);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');

  async function handleFetch() {
    if (!tournamentId) { alert('Please select a tournament first.'); return; }
    try {
      setLoading(true);
      setWarning('');
      const { results } = await getTopStandings(tournamentId, n, type, groupId === 'all' ? undefined : groupId);
      if (!results || results.length === 0) {
        setWarning(`No ${type} data available for this tournament yet.`);
        return;
      }
      const payload: Record<string, any> = {
        [`${type}s`]: results,
        currentData: { [`${type}s`]: results },
      };
      results.forEach((entity: any, i: number) => { payload[`${type}${i + 1}`] = entity; });
      if (results[0]) payload[type] = results[0];
      onFetched(payload);
    } catch (err) {
      console.error('Standings fetch error:', err);
      alert('Failed to load statistics from Heaven Stat Engine.');
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
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          className="select-input"
          style={{ ...selectStyle, flex: 1 }}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          <option value="all">All Groups</option>
          <option value="Qualifiers">Qualifiers</option>
          <option value="Finals">Finals</option>
        </select>

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

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={labelStyle}>Top N</label>
        <input
          type="number"
          min={1}
          max={20}
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
  const [groupId, setGroupId] = useState('all');
  const [day, setDay] = useState(1);
  const [mode, setMode] = useState<'full_day' | 'single_lobby'>('full_day');
  const [lobby, setLobby] = useState<number | ''>('');
  const [n, setN] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    if (!tournamentId) { alert('Please select a tournament first.'); return; }
    try {
      setLoading(true);
      const lobbyNum = mode === 'single_lobby' && lobby !== '' ? Number(lobby) : undefined;
      const data = await getDailyStandings(tournamentId, day, {
        lobby: lobbyNum,
        n,
        groupId: groupId === 'all' ? undefined : groupId,
      });
      onFetched({ currentData: data });
    } catch (err) {
      console.error('Daily standings fetch error:', err);
      alert('Failed to load daily standings from Heaven Stat Engine.');
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
        <select className="select-input" style={selectStyle} value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="select-input" style={{ ...selectStyle, flex: 1 }} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="all">All Groups</option>
          <option value="Qualifiers">Qualifiers</option>
          <option value="Finals">Finals</option>
        </select>
      </div>

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
            type="number" min={1} max={20} className="text-input"
            style={{ width: '56px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
            value={n} onChange={(e) => setN(Number(e.target.value))}
          />
        </div>
      </div>

      <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
        {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
        Update Draft Data
      </button>
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

  // Global entity lists for the pickers
  const [entities, setEntities] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    setEntities([]);
    setIdA('');
    setIdB('');
  }, [entityType]);

  async function loadEntities() {
    if (entities.length > 0) return;
    try {
      setPickerLoading(true);
      const { results } = await getGlobalRankings(entityType, entityType === 'team' ? 50 : 100);
      setEntities(results || []);
    } catch {
      // ignore
    } finally {
      setPickerLoading(false);
    }
  }

  async function handleFetch() {
    if (!idA || !idB) { alert('Please select both entities to compare.'); return; }
    try {
      setLoading(true);
      const data = await compareEntities(entityType, idA, idB, scopeTournamentId || undefined);
      const entityA = data.teamA || data.playerA;
      const entityB = data.teamB || data.playerB;
      onFetched({ entityA, entityB, scope: data.scope, currentData: data });
    } catch (err) {
      console.error('H2H fetch error:', err);
      alert('Failed to load Head to Head data from Heaven Stat Engine.');
    } finally {
      setLoading(false);
    }
  }

  const nameKey = entityType === 'team' ? 'teamName' : 'playerName';
  const idKey = entityType === 'team' ? 'teamId' : 'playerId';

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch Head to Head Data (Workspace)
      </span>

      <select className="select-input" style={selectStyle} value={entityType} onChange={(e) => setEntityType(e.target.value as any)}>
        <option value="team">Teams</option>
        <option value="player">Players</option>
      </select>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={selectStyle}
          value={idA}
          onFocus={loadEntities}
          onChange={(e) => setIdA(e.target.value)}
        >
          <option value="">-- Entity A --</option>
          {pickerLoading && <option disabled>Loading…</option>}
          {entities.map((e: any) => <option key={e[idKey]} value={e[idKey]}>{e[nameKey]}</option>)}
        </select>

        <select
          className="select-input"
          style={selectStyle}
          value={idB}
          onFocus={loadEntities}
          onChange={(e) => setIdB(e.target.value)}
        >
          <option value="">-- Entity B --</option>
          {pickerLoading && <option disabled>Loading…</option>}
          {entities.map((e: any) => <option key={e[idKey]} value={e[idKey]}>{e[nameKey]}</option>)}
        </select>
      </div>

      <select className="select-input" style={selectStyle} value={scopeTournamentId} onChange={(e) => setScopeTournamentId(e.target.value)}>
        <option value="">Scope: Career-Wide</option>
        {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

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
  onFetched,
}: {
  type: 'team' | 'player';
  onFetched: (fields: Record<string, any>) => void;
}) {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameKey = type === 'team' ? 'teamName' : 'playerName';
  const idKey = type === 'team' ? 'teamId' : 'playerId';

  async function loadEntities() {
    if (entities.length > 0) return;
    try {
      setPickerLoading(true);
      const { results } = await getGlobalRankings(type, type === 'team' ? 50 : 100);
      setEntities(results || []);
    } catch {
      // ignore
    } finally {
      setPickerLoading(false);
    }
  }

  async function handleFetch() {
    if (!selectedId) { alert(`Please select a ${type} first.`); return; }
    try {
      setLoading(true);
      const data = await getProfile(type, selectedId);
      onFetched({ [type]: { ...data.profile, ...data.careerStats }, currentData: data });
    } catch (err) {
      console.error('Profile fetch error:', err);
      alert(`Failed to load ${type} profile from Heaven Stat Engine.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <span className="slot-control-label" style={{ margin: 0, fontWeight: 700 }}>
        Fetch {type === 'team' ? 'Team' : 'Player'} Profile (Workspace)
      </span>

      <select
        className="select-input"
        style={selectStyle}
        value={selectedId}
        onFocus={loadEntities}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">-- Choose {type === 'team' ? 'Team' : 'Player'} --</option>
        {pickerLoading && <option disabled>Loading…</option>}
        {entities.map((e: any) => <option key={e[idKey]} value={e[idKey]}>{e[nameKey]}</option>)}
      </select>

      <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm" style={fetchBtnStyle}>
        {loading ? <Loader2 className="animate-spin" style={iconStyle} /> : <RefreshCw style={iconStyle} />}
        Update Draft Data
      </button>
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

// ─── Main FieldEditor export ───────────────────────────────────────────────────
export function FieldEditor({ templateType, tournaments, onFetched }: FieldEditorProps) {
  if (!templateType) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Select a template above to see fetch controls.
      </p>
    );
  }

  switch (templateType) {
    case 'top_standings':
      return <StandingsFetchEditor label="Fetch Tournament Standings Data" tournaments={tournaments} defaultN={5} onFetched={onFetched} />;

    case 'overall_rankings_dual_column':
      return <StandingsFetchEditor label="Fetch Overall Rankings Data" tournaments={tournaments} defaultN={20} onFetched={onFetched} />;

    case 'top_5_overall':
      return <StandingsFetchEditor label="Fetch Top 5 Overall Data" tournaments={tournaments} defaultN={5} onFetched={onFetched} />;

    case 'hybrid_era_top5':
      return <StandingsFetchEditor label="Fetch Hybrid Era Top 5 Data" tournaments={tournaments} defaultN={5} onFetched={onFetched} />;

    case 'daily_standings':
      return <DailyFetchEditor tournaments={tournaments} onFetched={onFetched} />;

    case 'head_to_head':
      return <H2HFetchEditor tournaments={tournaments} onFetched={onFetched} />;

    case 'team_profile':
      return <ProfileFetchEditor type="team" onFetched={onFetched} />;

    case 'player_profile':
      return <ProfileFetchEditor type="player" onFetched={onFetched} />;

    case 'custom_media':
      return <CustomMediaEditor />;

    default:
      return (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          No fetch controls available for this template type.
        </p>
      );
  }
}
