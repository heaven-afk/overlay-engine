'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  getTemplate, saveTemplate, getTournaments,
  getFieldCatalog, FieldBox, FieldCatalogItem, OverlayTemplate 
} from '@/lib/db';
import { getTopStandings } from '@/lib/statsApi';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc } from 'firebase/firestore';
import { ArrowLeft, Save, Upload, Loader2, Play, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import StylePanel from '@/components/editor/StylePanel';

// Dynamically import CanvasEditor with SSR disabled since react-konva relies on browser window/canvas
const CanvasEditor = dynamic(() => import('@/components/editor/CanvasEditor'), { ssr: false });

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default function TemplateBuilderPage({ params }: PageProps) {
  const router = useRouter();
  const { templateId: rawTemplateId } = use(params);
  const isNew = rawTemplateId === 'new';

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Template State
  const [templateId, setTemplateId] = useState<string>('');
  const [name, setName] = useState('Untitled Template');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [fieldBoxes, setFieldBoxes] = useState<FieldBox[]>([]);
  
  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reference Preview Data
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [previewTeams, setPreviewTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [previewTeamData, setPreviewTeamData] = useState<any | null>(null);

  // Static Catalog
  const [catalog, setCatalog] = useState<FieldCatalogItem[]>([]);

  // Initialize
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Fetch Field Catalog & Tournaments
        const [cat, tourneys] = await Promise.all([
          getFieldCatalog(),
          getTournaments()
        ]);
        setCatalog(cat);
        setTournaments(tourneys);

        if (tourneys.length > 0) {
          setSelectedTournamentId(tourneys[0].id);
        }

        // 2. Load template details if editing
        if (!isNew) {
          setTemplateId(rawTemplateId);
          const template = await getTemplate(rawTemplateId);
          if (template) {
            setName(template.name);
            setBackgroundImageUrl(template.backgroundImageUrl || '');
            setCanvasWidth(template.canvasWidth || 1920);
            setCanvasHeight(template.canvasHeight || 1080);
            setFieldBoxes(template.fieldBoxes || []);
          } else {
            alert('Template not found');
            router.push('/editor');
          }
        } else {
          // Pre-generate document ID for Storage path consistency
          const newId = doc(collection(db, 'overlayTemplates')).id;
          setTemplateId(newId);
        }
      } catch (err) {
        console.error('Error loading template designer:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [rawTemplateId, isNew, router]);

  // Load preview data when preview tournament changes
  // Calls the Stats API (getTopStandings) so the editor previews real computed data,
  // not locally-fabricated placeholder numbers.
  useEffect(() => {
    if (!selectedTournamentId) return;

    async function loadPreviewStats() {
      try {
        const { results } = await getTopStandings(selectedTournamentId, 12, 'team');
        if (results && results.length > 0) {
          setPreviewTeams(results);
          setSelectedTeamId(results[0].teamId ?? results[0].id);
          setPreviewTeamData(results[0]);
        } else {
          // No data from Stats API yet — show honest empty state
          setPreviewTeams([]);
          setPreviewTeamData(null);
        }
      } catch (err) {
        // Stats API not configured or unreachable — leave preview empty
        console.warn('Preview stats unavailable (Stats API not reachable or not configured):', err);
        setPreviewTeams([]);
        setPreviewTeamData(null);
      }
    }

    loadPreviewStats();
  }, [selectedTournamentId]);

  // Update preview team object when dropdown selection changes
  useEffect(() => {
    if (!selectedTeamId) return;
    const team = previewTeams.find((t) => t.teamId === selectedTeamId);
    if (team) {
      setPreviewTeamData(team);
    }
  }, [selectedTeamId, previewTeams]);

  // Upload background file to Firebase Storage
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const storagePath = `templates/backgrounds/${templateId || 'new'}_bg.${fileExt}`;
      const imageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(imageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setBackgroundImageUrl(downloadUrl);
    } catch (err) {
      console.error('Failed to upload background image:', err);
      alert('Upload failed: Ensure Firebase Storage is configured.');
    } finally {
      setUploading(false);
    }
  };

  // Add field box on canvas
  const handleAddBox = (item: FieldCatalogItem) => {
    const newBox: FieldBox = {
      id: Math.random().toString(36).substring(2, 9),
      dataField: item.key,
      x: 100,
      y: 100,
      width: item.type === 'image' ? 120 : 220,
      height: item.type === 'image' ? 120 : 50,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'left',
      boxType: item.type,
    };
    
    setFieldBoxes((prev) => [...prev, newBox]);
    setSelectedId(newBox.id);
  };

  // Download canvas preview as PNG
  const handleDownload = async () => {
    const canvasEl = document.getElementById('overlay-canvas-preview');
    if (!canvasEl) return;

    try {
      const screenshot = await html2canvas(canvasEl, {
        backgroundColor: null, // preserve transparency
        scale: 2,              // 2x for high-DPI / retina quality
        useCORS: true,         // allow cross-origin images (team logos from Firebase Storage)
        allowTaint: false,
      });

      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_overlay.png`;
      link.href = screenshot.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to export PNG. Ensure preview data is loaded.');
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }

    try {
      setSaving(true);
      const payload: Omit<OverlayTemplate, 'id'> = {
        name,
        backgroundImageUrl,
        canvasWidth,
        canvasHeight,
        fieldBoxes: fieldBoxes.map((box) => ({
          ...box,
          fontStyle: (box as any).fontStyle || 'normal', // Ensure default matches schema
        })),
      };

      await saveTemplate(payload, templateId);
      router.push('/editor');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Template Editor...</span>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 74px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* EDITOR ACTION BAR */}
      <div className="flex-between" style={{ padding: '0.75rem 2rem', background: '#0a0a0f', borderBottom: '1px solid var(--border-glass)', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/editor" className="btn btn-secondary btn-sm" title="Back to library">
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </Link>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {isNew ? 'New Template' : 'Edit Template'}
          </span>
        </div>

        {/* Live Preview Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="editor-preview-selector">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview Tourney:</span>
            <select 
              value={selectedTournamentId} 
              onChange={(e) => setSelectedTournamentId(e.target.value)}
            >
              {tournaments.length === 0 && <option value="">No tournaments found</option>}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {previewTeams.length > 0 && (
            <div className="editor-preview-selector">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team:</span>
              <select 
                value={selectedTeamId} 
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {previewTeams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    #{t.analyticsRank || '?'} {t.teamName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Background control */}
          <label className="btn btn-secondary btn-sm" style={{ margin: 0 }}>
            {uploading ? (
              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
            ) : (
              <Upload style={{ width: '14px', height: '14px' }} />
            )}
            Background
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleUploadBackground} 
              disabled={uploading}
            />
          </label>

          {/* Download PNG Button */}
          <button onClick={handleDownload} className="btn btn-secondary btn-sm">
            <Download style={{ width: '14px', height: '14px' }} />
            Download PNG
          </button>

          {/* Save Button */}
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" style={{ width: '14px', height: '14px' }} />
            ) : (
              <Save style={{ width: '14px', height: '14px' }} />
            )}
            Save Template
          </button>
        </div>
      </div>

      {/* EDITOR SPLIT WORKSPACE */}
      <div className="editor-root" style={{ flexGrow: 1 }}>
        
        {/* Stage Container */}
        <div className="editor-canvas-container" id="overlay-canvas-preview">
          <CanvasEditor
            backgroundImageUrl={backgroundImageUrl}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            fieldBoxes={fieldBoxes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeBoxes={setFieldBoxes}
            previewData={{
              team: previewTeamData || {},
              team1: previewTeams[0] || {},
              team2: previewTeams[1] || {},
              team3: previewTeams[2] || {},
              team4: previewTeams[3] || {},
              team5: previewTeams[4] || {},
              teams: previewTeams
            }}
          />
        </div>

        {/* Sidebar Style Controls */}
        <StylePanel
          templateName={name}
          setTemplateName={setName}
          canvasWidth={canvasWidth}
          setCanvasWidth={setCanvasWidth}
          canvasHeight={canvasHeight}
          setCanvasHeight={setCanvasHeight}
          backgroundImageUrl={backgroundImageUrl}
          setBackgroundImageUrl={setBackgroundImageUrl}
          fieldBoxes={fieldBoxes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChangeBoxes={setFieldBoxes}
          catalog={catalog}
          onAddBox={handleAddBox}
        />
        
      </div>
    </div>
  );
}
