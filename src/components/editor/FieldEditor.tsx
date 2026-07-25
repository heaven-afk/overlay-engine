'use client';

import { useState, useEffect } from 'react';
import type { TemplateType } from '@/lib/db';

interface FieldEditorProps {
  templateType: TemplateType | undefined;
  fields: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '5px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(15, 15, 25, 0.9)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'var(--text-primary)',
  padding: '0.45rem 0.7rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.2s ease',
};

export function FieldEditor({ templateType, fields, onChange }: FieldEditorProps) {
  const [mode, setMode] = useState<'quick' | 'json'>('quick');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const hasQuickForm = ['head_to_head', 'team_profile', 'player_profile'].includes(templateType || '');

  useEffect(() => {
    setJsonText(JSON.stringify(fields, null, 2));
    setJsonError('');
  }, [fields]);

  function handleJsonChange(val: string) {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError('');
      onChange(parsed);
    } catch {
      setJsonError('Invalid JSON — not saved until fixed');
    }
  }

  /** Deep set a value at a dot-separated path within fields */
  function updateField(path: string[], value: any) {
    const updated = JSON.parse(JSON.stringify(fields));
    let obj = updated;
    for (let i = 0; i < path.length - 1; i++) {
      if (!obj[path[i]] || typeof obj[path[i]] !== 'object') obj[path[i]] = {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
    onChange(updated);
  }

  function getStr(path: string[]): string {
    let obj: any = fields;
    for (const key of path) {
      if (!obj || typeof obj !== 'object') return '';
      obj = obj[key];
    }
    return obj != null && typeof obj !== 'object' ? String(obj) : '';
  }

  function QuickInput({
    label,
    path,
    placeholder,
    type = 'text',
    step,
  }: {
    label: string;
    path: string[];
    placeholder?: string;
    type?: string;
    step?: string;
  }) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <input
          style={inputStyle}
          type={type}
          step={step}
          placeholder={placeholder}
          value={getStr(path)}
          onChange={(e) => updateField(path, type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        />
      </div>
    );
  }

  function renderQuickForm() {
    switch (templateType) {
      case 'head_to_head':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0 0 4px 0', lineHeight: 1.5 }}>
              Quick-fill entity names and key stats. Use JSON mode for full data.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <QuickInput label="Entity A — Name" path={['entityA', 'teamName']} placeholder="e.g. Team Liquid" />
              <QuickInput label="Entity B — Name" path={['entityB', 'teamName']} placeholder="e.g. Team Vitality" />
              <QuickInput label="Entity A — Kills" path={['entityA', 'kills']} placeholder="0" type="number" />
              <QuickInput label="Entity B — Kills" path={['entityB', 'kills']} placeholder="0" type="number" />
              <QuickInput label="Entity A — Total Pts" path={['entityA', 'totalPts']} placeholder="0" type="number" />
              <QuickInput label="Entity B — Total Pts" path={['entityB', 'totalPts']} placeholder="0" type="number" />
              <QuickInput label="Entity A — Wins" path={['entityA', 'wins']} placeholder="0" type="number" />
              <QuickInput label="Entity B — Wins" path={['entityB', 'wins']} placeholder="0" type="number" />
            </div>
            <QuickInput label="Scope / Comparison Label" path={['scopeName']} placeholder="e.g. Tournament Overall" />
          </div>
        );

      case 'team_profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <QuickInput label="Team Name" path={['team', 'teamName']} placeholder="e.g. Team Liquid" />
              <QuickInput label="Team Tag" path={['team', 'teamTag']} placeholder="e.g. TL" />
              <QuickInput label="Total Points" path={['team', 'totalPts']} placeholder="0" type="number" />
              <QuickInput label="Total Kills" path={['team', 'kills']} placeholder="0" type="number" />
              <QuickInput label="Wins" path={['team', 'wins']} placeholder="0" type="number" />
              <QuickInput label="Matches Played" path={['team', 'matches']} placeholder="0" type="number" />
            </div>
          </div>
        );

      case 'player_profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <QuickInput label="Player Name" path={['player', 'playerName']} placeholder="e.g. s1mple" />
              <QuickInput label="Team Tag" path={['player', 'teamTag']} placeholder="e.g. TL" />
              <QuickInput label="Total Points" path={['player', 'totalPts']} placeholder="0" type="number" />
              <QuickInput label="Total Kills" path={['player', 'kills']} placeholder="0" type="number" />
              <QuickInput label="K/D Ratio" path={['player', 'kdr']} placeholder="0.00" type="number" step="0.01" />
              <QuickInput label="Avg. Placement" path={['player', 'avgPlace']} placeholder="0.0" type="number" step="0.1" />
            </div>
          </div>
        );

      default:
        return (
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Enter field data as JSON. This is passed directly as <code>data</code> to the template component.
          </p>
        );
    }
  }

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.2s ease',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  });

  const showJson = mode === 'json' || !hasQuickForm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {hasQuickForm && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={modeTabStyle(mode === 'quick')} onClick={() => setMode('quick')}>Quick Fields</button>
          <button style={modeTabStyle(mode === 'json')} onClick={() => setMode('json')}>JSON</button>
        </div>
      )}

      {!showJson && renderQuickForm()}

      {showJson && (
        <div>
          {!hasQuickForm && renderQuickForm()}
          <label style={{ ...labelStyle, marginBottom: '6px' }}>Field Data (JSON)</label>
          <textarea
            style={{
              ...inputStyle,
              fontFamily: '"Fira Code", "Cascadia Code", monospace',
              fontSize: '0.75rem',
              minHeight: '130px',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={'{\n  "teams": []\n}'}
            spellCheck={false}
          />
          {jsonError && (
            <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '5px' }}>⚠ {jsonError}</p>
          )}
        </div>
      )}
    </div>
  );
}
