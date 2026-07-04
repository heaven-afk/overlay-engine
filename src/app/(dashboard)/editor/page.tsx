'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTemplates, deleteTemplate, saveTemplate, OverlayTemplate } from '@/lib/db';
import { Plus, Trash, Copy, Edit, Image as ImageIcon, Loader2, AlertTriangle, Layers, Award, User, Users } from 'lucide-react';

export default function TemplateLibrary() {
  const router = useRouter();
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const list = await getTemplates();
      setTemplates(list);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      setActionLoading(id);
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('Error deleting template');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDuplicate(template: OverlayTemplate) {
    if (!template.templateType) {
      alert('Legacy templates cannot be duplicated. Please create a new template.');
      return;
    }
    try {
      setActionLoading(`dup-${template.id}`);
      const newTemplate: Omit<OverlayTemplate, 'id'> = {
        name: `${template.name} (Copy)`,
        templateType: template.templateType,
        styleConfig: JSON.parse(JSON.stringify(template.styleConfig || {})),
      };
      
      const newId = await saveTemplate(newTemplate);
      await loadTemplates();
      router.push(`/editor/${newId}`);
    } catch (err) {
      console.error('Failed to duplicate template:', err);
      alert('Error duplicating template');
    } finally {
      setActionLoading(null);
    }
  }

  const getTemplateTypeIcon = (type?: string) => {
    switch (type) {
      case 'top_standings':
        return <Award style={{ width: '20px', height: '20px', color: '#C9A84C' }} />;
      case 'head_to_head':
        return <Users style={{ width: '20px', height: '20px', color: '#a78bfa' }} />;
      case 'team_profile':
        return <Layers style={{ width: '20px', height: '20px', color: '#38bdf8' }} />;
      case 'player_profile':
        return <User style={{ width: '20px', height: '20px', color: '#34d399' }} />;
      default:
        return <AlertTriangle style={{ width: '20px', height: '20px', color: '#f87171' }} />;
    }
  };

  const getTemplateTypeName = (type?: string) => {
    switch (type) {
      case 'top_standings': return 'Top Standings';
      case 'head_to_head': return 'Head to Head';
      case 'team_profile': return 'Team Profile';
      case 'player_profile': return 'Player Profile';
      default: return 'Legacy Template';
    }
  };

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>Design Templates</h1>
          <p className="page-description" style={{ margin: 0 }}>
            Configure and style premium pre-built broadcast overlays for your live streams.
          </p>
        </div>
        <Link href="/editor/new" className="btn btn-primary">
          <Plus style={{ width: '18px', height: '18px' }} />
          New Template
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-glass)',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <ImageIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: 'rgba(255,255,255,0.1)' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Templates Found</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Create a configured template to begin streaming.</p>
          <Link href="/editor/new" className="btn btn-primary">
            <Plus style={{ width: '18px', height: '18px' }} />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((template) => {
            const isLegacy = !template.templateType;

            return (
              <div key={template.id} className="template-card">
                <div 
                  className="template-card-preview"
                  style={{
                    backgroundColor: isLegacy ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    height: '140px',
                  }}
                >
                  {getTemplateTypeIcon(template.templateType)}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isLegacy ? '#ef4444' : 'var(--text-muted)',
                  }}>
                    {getTemplateTypeName(template.templateType)}
                  </span>
                </div>

                <div className="template-card-content">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h3 className="template-card-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                      {template.name}
                    </h3>
                    {isLegacy && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>
                        Legacy — incompatible
                      </span>
                    )}
                  </div>
                  
                  <div className="template-card-meta" style={{ marginTop: '6px', marginBottom: '1.25rem' }}>
                    {!isLegacy ? (
                      <span>Theme: {template.styleConfig?.colorTheme || 'Dark'} Theme</span>
                    ) : (
                      <span>Old schema detected. Please delete.</span>
                    )}
                  </div>

                  <div className="template-card-actions">
                    {!isLegacy ? (
                      <Link 
                        href={`/editor/${template.id}`} 
                        className="btn btn-secondary btn-sm"
                        style={{ flexGrow: 1, justifyContent: 'center' }}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                        Edit Configuration
                      </Link>
                    ) : (
                      <div style={{ flexGrow: 1 }} />
                    )}

                    <button
                      disabled={actionLoading !== null || isLegacy}
                      onClick={() => handleDuplicate(template)}
                      className="btn btn-secondary btn-sm"
                      title="Duplicate Template"
                    >
                      <Copy style={{ width: '14px', height: '14px' }} />
                    </button>
                    
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => handleDelete(template.id!)}
                      className="btn btn-danger btn-sm"
                      title="Delete Template"
                    >
                      <Trash style={{ width: '14px', height: '14px' }} />
                    </button>
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
