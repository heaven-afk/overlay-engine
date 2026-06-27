'use client';

import { useEffect, useState, use } from 'react';
import { getSlotByToken, getTemplate, OverlaySlot, OverlayTemplate } from '@/lib/db';
import { resolveDotPath } from '@/components/editor/CanvasEditor';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Helper to convert hex colors and opacity into CSS rgba string
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return 'transparent';
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

interface PageProps {
  params: Promise<{ publicRenderToken: string }>;
}

export default function PublicRenderPage({ params }: PageProps) {
  const { publicRenderToken } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<OverlaySlot | null>(null);
  const [template, setTemplate] = useState<OverlayTemplate | null>(null);
  
  // Real-time Firestore document listener
  useEffect(() => {
    // Add transparent style class to body for OBS compositing
    document.body.classList.add('broadcast-render');
    
    let unsubscribeSlot = () => {};

    async function initListener() {
      try {
        const s = await getSlotByToken(publicRenderToken);
        if (!s) {
          setLoading(false);
          return;
        }
        setSlot(s);

        if (s.assignedTemplateId) {
          const t = await getTemplate(s.assignedTemplateId);
          setTemplate(t);
        }

        // Setup real-time listener for current data changes
        unsubscribeSlot = onSnapshot(doc(db, 'overlaySlots', s.id!), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as OverlaySlot;
            setSlot(data);
          }
        });
      } catch (err) {
        console.error('Error starting overlay listener:', err);
      } finally {
        setLoading(false);
      }
    }

    initListener();

    return () => {
      document.body.classList.remove('broadcast-render');
      unsubscribeSlot();
    };
  }, [publicRenderToken]);

  if (loading) {
    return null; // Keep screen fully blank while loading resources
  }

  if (!slot || !template) {
    return null; // Empty screen if slot not configured correctly (OBS safe)
  }

  return (
    <div className="broadcast-stage-wrapper">
      <div 
        style={{
          position: 'relative',
          width: `${template.canvasWidth || 1920}px`,
          height: `${template.canvasHeight || 1080}px`,
          backgroundImage: template.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'top left',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'transparent',
        }}
      >
        {/* Render styled, bound field boxes */}
        {(template.fieldBoxes || []).map((box) => {
          const resolvedValue = resolveDotPath(slot.currentData, box.dataField);
          const padding = box.padding || 0;
          const elementOpacity = box.elementOpacity ?? 1;
          const bgStyle = box.backgroundColor 
            ? hexToRgba(box.backgroundColor, box.backgroundOpacity ?? 1) 
            : 'transparent';
          
          const borderStyle = box.borderColor 
            ? `${box.borderWidth || 1}px solid ${box.borderColor}` 
            : 'none';

          if (box.boxType === 'image') {
            const logoSrc = resolvedValue || '/placeholder-logo.svg';
            return (
              <div
                key={box.id}
                style={{
                  position: 'absolute',
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  background: bgStyle,
                  border: borderStyle,
                  borderRadius: `${box.borderRadius || 0}px`,
                  padding: `${padding}px`,
                  opacity: elementOpacity,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'opacity 0.3s ease',
                  }}
                />
              </div>
            );
          }

          // Text Elements
          const textContent = box.staticText || resolvedValue || '';
          return (
            <div
              key={box.id}
              style={{
                position: 'absolute',
                left: `${box.x}px`,
                top: `${box.y}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
                background: bgStyle,
                border: borderStyle,
                borderRadius: `${box.borderRadius || 0}px`,
                padding: `${padding}px`,
                opacity: elementOpacity,
                boxSizing: 'border-box',
                
                fontSize: `${box.fontSize || 16}px`,
                fontFamily: `${box.fontFamily || 'Inter'}, sans-serif`,
                fontWeight: box.fontWeight || 'normal',
                fontStyle: (box as any).fontStyle || 'normal',
                color: box.color || '#ffffff',
                textAlign: (box.textAlign as any) || 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 
                  box.textAlign === 'center' ? 'center' : 
                  box.textAlign === 'right' ? 'flex-end' : 'flex-start',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                // Add smooth CSS transition when values update live
                transition: 'color 0.3s ease, font-size 0.3s ease, background 0.3s ease',
              }}
            >
              {textContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
