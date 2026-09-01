'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTemplates, deleteTemplate, saveTemplate, OverlayTemplate } from '@/lib/db';
import { 
  Plus, Trash, Copy, Edit, Image as ImageIcon, Loader2, AlertTriangle, 
  Layers, Award, User, Users, Video, Columns, Calendar, Trophy, Sparkles 
} from 'lucide-react';

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
      case 'overall_rankings_dual_column':
        return <Columns style={{ width: '20px', height: '20px', color: '#f59e0b' }} />;
      case 'top_5_overall':
        return <Trophy style={{ width: '20px', height: '20px', color: '#fbbf24' }} />;
      case 'top5_graphic':
        return <Trophy style={{ width: '20px', height: '20px', color: '#C9A84C' }} />;
      case 'hybrid_era_top5':
        return <Trophy style={{ width: '20px', height: '20px', color: '#E6BE5A' }} />;
      case 'team_roster_kills':
        return <Users style={{ width: '20px', height: '20px', color: '#FFD700' }} />;
      case 'flexible_top5':
        return <Trophy style={{ width: '20px', height: '20px', color: '#A855F7' }} />;
      case 'pmnc_top15_standings':
        return <Trophy style={{ width: '20px', height: '20px', color: '#E5A93C' }} />;
      case 'mgl_yt_livestanding':
        return <Trophy style={{ width: '20px', height: '20px', color: '#FF9900' }} />;
      case 'match_summary':
        return <Award style={{ width: '20px', height: '20px', color: '#FFD700' }} />;
      case 'daily_standings':
        return <Calendar style={{ width: '20px', height: '20px', color: '#60a5fa' }} />;
      case 'head_to_head':
        return <Users style={{ width: '20px', height: '20px', color: '#a78bfa' }} />;
      case 'team_profile':
        return <Layers style={{ width: '20px', height: '20px', color: '#38bdf8' }} />;
      case 'player_profile':
        return <User style={{ width: '20px', height: '20px', color: '#34d399' }} />;
      case 'custom_media':
        return <Video style={{ width: '20px', height: '20px', color: '#d946ef' }} />;
      default:
        return <AlertTriangle style={{ width: '20px', height: '20px', color: '#f87171' }} />;
    }
  };

  const getTemplateTypeName = (type?: string) => {
    switch (type) {
      case 'top_standings': return 'Top Standings';
      case 'mgl_yt_livestanding': return 'Vertical YT Standing (434x724)';
      case 'pmnc_top15_standings': return 'Esports Top 15 Standings (PMNC)';
      case 'overall_rankings_dual_column': return 'Overall Rankings (Dual Column)';
      case 'top_5_overall': return 'Top 5 Overall Table';
      case 'top5_graphic': return 'Top 5 Graphic (Global)';
      case 'hybrid_era_top5': return 'Hybrid Era Top 5 (RDM x FM)';
      case 'team_roster_kills': return 'Team Roster Kill Cards';
      case 'flexible_top5': return 'Flexible Top 5 (Paginated)';
      case 'match_summary': return 'Match Summary';
      case 'daily_standings': return 'Daily Standings Table';
      case 'head_to_head': return 'Head to Head';
      case 'team_profile': return 'Team Profile';
      case 'player_profile': return 'Player Profile';
      case 'custom_media': return 'Custom Media';
      default: return 'Legacy Template';
    }
  };

  const standardTemplates = templates.filter((t) => t.templateType !== 'custom_media');
  const customMediaTemplates = templates.filter((t) => t.templateType === 'custom_media');

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* ── Top Header ── */}
      <div className="flex-between" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Design & Media Templates
          </h1>
          <p className="page-description" style={{ margin: 0 }}>
            Configure and style broadcast data overlays and custom media graphics for your live stream production.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link 
            href="/editor/new?type=custom_media" 
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)',
              color: '#fff',
              border: '1px solid rgba(217, 70, 239, 0.4)',
              boxShadow: '0 0 16px rgba(217, 70, 239, 0.3)',
              fontWeight: 700,
            }}
          >
            <Video style={{ width: '18px', height: '18px' }} />
            New Custom Media
          </Link>
          <Link href="/editor/new" className="btn btn-primary">
            <Plus style={{ width: '18px', height: '18px' }} />
            New Template
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading templates...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
          {/* ══════════════════════════════════════════════════════════════
              SECTION 1: BROADCAST DESIGN TEMPLATES
             ══════════════════════════════════════════════════════════════ */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-glass)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(201, 168, 76, 0.15)',
                  border: '1px solid rgba(201, 168, 76, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C9A84C',
                }}>
                  <Layers style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Broadcast Design Templates
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}>
                      {standardTemplates.length}
                    </span>
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Standings tables, top rankings, match summaries, and tournament graphics.
                  </span>
                </div>
              </div>

              <Link href="/editor/new" className="btn btn-secondary btn-sm">
                <Plus style={{ width: '14px', height: '14px' }} />
                Add Template
              </Link>
            </div>

            {standardTemplates.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-glass)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <ImageIcon style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.15)' }} />
                <h3 style={{ color: '#fff', marginBottom: '0.25rem', fontSize: '1.1rem' }}>No Broadcast Templates</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Create your first live tournament broadcast overlay.</p>
                <Link href="/editor/new" className="btn btn-primary btn-sm">
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Create Template
                </Link>
              </div>
            ) : (
              <div className="template-grid">
                {standardTemplates.map((template) => {
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
                          gap: '10px',
                          height: '140px',
                          position: 'relative',
                          overflow: 'hidden',
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
                              Legacy
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
                            className="btn btn-secondary btn-sm"
                            title="Delete Template"
                            style={{ color: '#ef4444' }}
                          >
                            {actionLoading === template.id ? (
                              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <Trash style={{ width: '14px', height: '14px' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2: CUSTOM MEDIA OVERLAYS
             ══════════════════════════════════════════════════════════════ */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(217, 70, 239, 0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(217, 70, 239, 0.15)',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d946ef',
                  boxShadow: '0 0 10px rgba(217, 70, 239, 0.25)',
                }}>
                  <Video style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f0abfc' }}>
                    Custom Media Overlays
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(217, 70, 239, 0.15)',
                      color: '#d946ef',
                      fontWeight: 700,
                      border: '1px solid rgba(217, 70, 239, 0.3)',
                    }}>
                      {customMediaTemplates.length}
                    </span>
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Video loops, animated GIFs, static graphic banners, or Canva embeds for fullscreen/backdrop media.
                  </span>
                </div>
              </div>

              <Link 
                href="/editor/new?type=custom_media" 
                className="btn btn-sm"
                style={{
                  background: 'rgba(217, 70, 239, 0.15)',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  color: '#d946ef',
                  fontWeight: 700,
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                Add Custom Media
              </Link>
            </div>

            {customMediaTemplates.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(25, 12, 35, 0.6) 0%, rgba(15, 10, 25, 0.6) 100%)',
                border: '1px dashed rgba(217, 70, 239, 0.3)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}>
                <Video style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'rgba(217, 70, 239, 0.3)' }} />
                <h3 style={{ color: '#fff', marginBottom: '0.25rem', fontSize: '1.1rem' }}>No Custom Media Overlays</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Upload full-screen video loops or image banners for your stream.</p>
                <Link 
                  href="/editor/new?type=custom_media" 
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)',
                    color: '#fff',
                    border: '1px solid rgba(217, 70, 239, 0.4)',
                    fontWeight: 700,
                  }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Create First Custom Media
                </Link>
              </div>
            ) : (
              <div className="template-grid">
                {customMediaTemplates.map((template) => {
                  const mediaUrl = template.styleConfig?.customMediaUrl;
                  const mediaType = template.styleConfig?.customMediaType || 'auto';

                  return (
                    <div 
                      key={template.id} 
                      className="template-card"
                      style={{
                        border: '1px solid rgba(217, 70, 239, 0.35)',
                        boxShadow: '0 0 18px rgba(217, 70, 239, 0.12)',
                        background: 'linear-gradient(135deg, rgba(20, 10, 30, 0.95) 0%, rgba(10, 10, 16, 0.95) 100%)',
                      }}
                    >
                      <div 
                        className="template-card-preview"
                        style={{
                          backgroundColor: 'rgba(217, 70, 239, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          height: '145px',
                          borderBottom: '1px solid rgba(217, 70, 239, 0.2)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {mediaUrl ? (
                          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                            {mediaType === 'video' ? (
                              <video
                                src={mediaUrl}
                                muted
                                loop
                                autoPlay
                                playsInline
                                {...({ referrerPolicy: 'no-referrer' } as any)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt={template.name}
                                referrerPolicy="no-referrer"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
                              />
                            )}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(12, 8, 18, 0.95) 0%, rgba(12, 8, 18, 0.25) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}>
                              <Video style={{ width: '22px', height: '22px', color: '#d946ef', filter: 'drop-shadow(0 0 8px rgba(217,70,239,0.8))' }} />
                              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#f0abfc', letterSpacing: '0.06em' }}>
                                {template.styleConfig?.customMediaType?.toUpperCase() || 'CUSTOM MEDIA'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Video style={{ width: '24px', height: '24px', color: '#d946ef', filter: 'drop-shadow(0 0 8px rgba(217,70,239,0.5))' }} />
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: '#d946ef',
                            }}>
                              Unconfigured Media Slot
                            </span>
                          </>
                        )}
                      </div>

                      <div className="template-card-content">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <h3 className="template-card-title" style={{ fontSize: '1.1rem', margin: 0, color: '#FFFFFF' }}>
                            {template.name}
                          </h3>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            backgroundColor: 'rgba(217, 70, 239, 0.15)',
                            color: '#d946ef',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(217, 70, 239, 0.3)',
                            whiteSpace: 'nowrap',
                          }}>
                            {mediaUrl ? 'Configured' : 'Empty'}
                          </span>
                        </div>
                        
                        <div className="template-card-meta" style={{ marginTop: '6px', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.6)' }}>
                          <span>Fit: {template.styleConfig?.customMediaFit || 'cover'} · Type: {template.styleConfig?.customMediaType || 'auto'}</span>
                        </div>

                        <div className="template-card-actions">
                          <Link 
                            href={`/editor/${template.id}`} 
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              flexGrow: 1, 
                              justifyContent: 'center',
                              borderColor: 'rgba(217, 70, 239, 0.35)',
                              color: '#f0abfc',
                            }}
                          >
                            <Edit style={{ width: '14px', height: '14px' }} />
                            Configure Media
                          </Link>

                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleDuplicate(template)}
                            className="btn btn-secondary btn-sm"
                            title="Duplicate Custom Media"
                            style={{ borderColor: 'rgba(217, 70, 239, 0.35)' }}
                          >
                            <Copy style={{ width: '14px', height: '14px' }} />
                          </button>

                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleDelete(template.id!)}
                            className="btn btn-secondary btn-sm"
                            title="Delete Custom Media"
                            style={{ color: '#ef4444', borderColor: 'rgba(217, 70, 239, 0.2)' }}
                          >
                            {actionLoading === template.id ? (
                              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <Trash style={{ width: '14px', height: '14px' }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
