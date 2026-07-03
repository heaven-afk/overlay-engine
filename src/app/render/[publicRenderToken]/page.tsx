'use client';

import { useEffect, useState, useRef, use } from 'react';
import { getSlotByToken, getTemplate, OverlaySlot, OverlayTemplate, FieldBox } from '@/lib/db';
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

// ─── useCountUp hook ─────────────────────────────────────────────────────────
// Interpolates from 0 to targetValue over duration ms using requestAnimationFrame.
// Returns the current display value as a number.
// Re-runs whenever targetValue changes (detects change via a generation counter).

function useCountUp(targetValue: number, duration: number, generation: number): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any in-flight animation
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (targetValue - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // generation is used as a trigger to re-run countUp when the value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue, duration, generation]);

  return display;
}

// ─── AnimatedFieldBox ─────────────────────────────────────────────────────────
// Sub-component so each field box can safely call useEffect and useCountUp
// (hooks cannot be called conditionally inside .map()).

interface AnimatedFieldBoxProps {
  box: FieldBox;
  resolvedValue: string;
  animatedIds: React.MutableRefObject<Set<string>>;
  updateTrigger: number | undefined; // timestamp when update was triggered
}

function AnimatedFieldBox({ box, resolvedValue, animatedIds, updateTrigger }: AnimatedFieldBoxProps) {
  const padding = box.padding || 0;
  const elementOpacity = box.elementOpacity ?? 1;
  const bgStyle = box.backgroundColor
    ? hexToRgba(box.backgroundColor, box.backgroundOpacity ?? 1)
    : 'transparent';
  const borderStyle = box.borderColor
    ? `${box.borderWidth || 1}px solid ${box.borderColor}`
    : 'none';

  // ── Entrance animation ───────────────────────────────────────────────────
  const hasPlayed = animatedIds.current.has(box.id);
  const hasEntrance = !!box.entranceAnimation && box.entranceAnimation !== 'none';
  const entranceDuration = box.entranceDuration ?? 400;
  const entranceDelay = box.entranceDelay ?? 0;

  const entranceStyle: React.CSSProperties =
    !hasPlayed && hasEntrance
      ? {
          animation: `${box.entranceAnimation} ${entranceDuration}ms ease forwards`,
          animationDelay: `${entranceDelay}ms`,
          opacity: 0, // start hidden; animation brings it in
        }
      : {};

  // Mark entrance as played after it finishes (delay + duration)
  useEffect(() => {
    if (!hasEntrance) {
      animatedIds.current.add(box.id);
      return;
    }
    const timer = setTimeout(() => {
      animatedIds.current.add(box.id);
    }, entranceDelay + entranceDuration + 50); // +50ms buffer
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update animation ─────────────────────────────────────────────────────
  const hasUpdate = !!box.updateAnimation && box.updateAnimation !== 'none';
  const updateDuration = box.updateDuration ?? 300;

  // Key-based animation re-trigger: changing the key on the inner content div
  // forces React to remount it, which resets the CSS animation.
  const updateKey = updateTrigger ?? 0;

  const updateStyle: React.CSSProperties =
    hasUpdate && updateTrigger && box.updateAnimation !== 'countUp'
      ? {
          animation: `${box.updateAnimation} ${updateDuration}ms ease`,
          animationFillMode: 'forwards',
        }
      : {};

  // ── countUp (numeric update animation) ──────────────────────────────────
  const isCountUp = box.updateAnimation === 'countUp';
  const numericTarget = isCountUp && !isNaN(Number(resolvedValue)) && resolvedValue !== ''
    ? Number(resolvedValue)
    : 0;
  // Generation counter increments each time a new update is triggered
  const [countGeneration, setCountGeneration] = useState(0);
  const prevUpdateKey = useRef(0);

  useEffect(() => {
    if (isCountUp && updateTrigger && updateTrigger !== prevUpdateKey.current) {
      prevUpdateKey.current = updateTrigger;
      setCountGeneration((g) => g + 1);
    }
  }, [updateTrigger, isCountUp]);

  const countDisplay = useCountUp(numericTarget, updateDuration, countGeneration);

  // Determine what text to actually display
  const isNumericValue = !isNaN(Number(resolvedValue)) && resolvedValue !== '';
  const textContent = (() => {
    if (box.staticText) return box.staticText;
    if (isCountUp && isNumericValue && countGeneration > 0) {
      // During count-up animation, show interpolated value
      return String(countDisplay);
    }
    return resolvedValue || '';
  })();

  // ── Shared container style ───────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
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
    ...entranceStyle,
  };

  // ── Image box ─────────────────────────────────────────────────────────────
  if (box.boxType === 'image') {
    const logoSrc = resolvedValue || '/placeholder-logo.svg';
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src={logoSrc}
          alt=""
          key={updateKey}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.3s ease',
            ...updateStyle,
          }}
        />
      </div>
    );
  }

  // ── Text box ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        ...containerStyle,
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
        // Smooth CSS transition when non-animated style values update live
        transition: 'color 0.3s ease, font-size 0.3s ease, background 0.3s ease',
      }}
    >
      {/* Inner span carries update animation so entrance/update don't conflict */}
      <span key={updateKey} style={updateStyle}>
        {textContent}
      </span>
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ publicRenderToken: string }>;
}

export default function PublicRenderPage({ params }: PageProps) {
  const { publicRenderToken } = use(params);

  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<OverlaySlot | null>(null);
  const [template, setTemplate] = useState<OverlayTemplate | null>(null);

  // Tracks which box IDs have already played their entrance animation
  const animatedIds = useRef<Set<string>>(new Set());

  // Tracks previous resolved values per box ID (for update detection)
  const prevValues = useRef<Record<string, string>>({});

  // Timestamp-keyed triggers — changing the value forces CSS animation re-play
  const [updateTriggers, setUpdateTriggers] = useState<Record<string, number>>({});

  // ── Real-time Firestore listener ─────────────────────────────────────────
  useEffect(() => {
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

  // ── Detect value changes and trigger update animations ───────────────────
  useEffect(() => {
    if (!slot?.currentData || !template?.fieldBoxes) return;

    const newTriggers: Record<string, number> = {};

    template.fieldBoxes.forEach((box) => {
      const newVal = String(resolveDotPath(slot.currentData, box.dataField) ?? '');
      const prevVal = prevValues.current[box.id];

      if (
        prevVal !== undefined &&
        prevVal !== newVal &&
        box.updateAnimation &&
        box.updateAnimation !== 'none'
      ) {
        newTriggers[box.id] = Date.now(); // unique timestamp forces animation re-trigger
      }

      prevValues.current[box.id] = newVal;
    });

    if (Object.keys(newTriggers).length > 0) {
      setUpdateTriggers((prev) => ({ ...prev, ...newTriggers }));
    }
  }, [slot?.currentData, template?.fieldBoxes]);

  if (loading) return null;
  if (!slot || !template) return null;

  return (
    <div className="broadcast-stage-wrapper">
      {/* Inject animation keyframes once */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { opacity: 1; transform: scale(1.1); }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes flip {
          0%   { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg);  opacity: 1; }
        }
      `}</style>

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
        {(template.fieldBoxes || []).map((box) => {
          const resolvedValue = String(resolveDotPath(slot.currentData, box.dataField) ?? '');
          return (
            <AnimatedFieldBox
              key={box.id}
              box={box}
              resolvedValue={resolvedValue}
              animatedIds={animatedIds}
              updateTrigger={updateTriggers[box.id]}
            />
          );
        })}
      </div>
    </div>
  );
}
