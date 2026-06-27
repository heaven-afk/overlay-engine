'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTemplates, deleteTemplate, saveTemplate, OverlayTemplate } from '@/lib/db';
import { Plus, Trash, Copy, Edit, Image as ImageIcon, Loader2 } from 'lucide-react';

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
    try {
      setActionLoading(`dup-${template.id}`);
      const newTemplate: Omit<OverlayTemplate, 'id'> = {
        name: `${template.name} (Copy)`,
        backgroundImageUrl: template.backgroundImageUrl,
        canvasWidth: template.canvasWidth || 1920,
        canvasHeight: template.canvasHeight || 1080,
        fieldBoxes: template.fieldBoxes.map((box) => ({
          ...box,
          id: Math.random().toString(36).substring(2, 9),
        })),
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

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1>Design Templates</h1>
          <p className="page-description" style={{ margin: 0 }}>
            Create, manage, and visual-edit graphic overlays for your live streams.
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
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start by creating your first broadcast design template.</p>
          <Link href="/editor/new" className="btn btn-primary">
            <Plus style={{ width: '18px', height: '18px' }} />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div 
                className="template-card-preview"
                style={{
                  backgroundImage: template.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : 'none',
                }}
              >
                {!template.backgroundImageUrl && (
                  <div className="template-card-preview-empty">
                    <ImageIcon style={{ width: '24px', height: '24px', opacity: 0.3, margin: '0 auto 4px' }} />
                    <span>No Background Image</span>
                  </div>
                )}
              </div>
              <div className="template-card-content">
                <h3 className="template-card-title">{template.name}</h3>
                <div className="template-card-meta">
                  {template.canvasWidth} x {template.canvasHeight} px • {template.fieldBoxes?.length || 0} fields
                </div>
                <div className="template-card-actions">
                  <Link 
                    href={`/editor/${template.id}`} 
                    className="btn btn-secondary btn-sm"
                    style={{ flexGrow: 1, justifyContent: 'center' }}
                  >
                    <Edit style={{ width: '14px', height: '14px' }} />
                    Edit Design
                  </Link>
                  <button
                    disabled={actionLoading !== null}
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
          ))}
        </div>
      )}
    </div>
  );
}
