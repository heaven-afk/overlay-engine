'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KImage, Text as KText, Transformer, Rect, Group } from 'react-konva';

// Helper to resolve nested object keys from a dot-path string
export function resolveDotPath(obj: any, path: string): string {
  if (!obj || !path) return '';

  // Handle index paths like team1.teamName, team5.scores.FINAL_RATING
  const match = path.match(/^team(\d+)\.(.+)$/);
  if (match) {
    const index = parseInt(match[1], 10) - 1; // 0-indexed offset
    const subPath = match[2];
    
    // Attempt to locate team data at the specified index within the container
    let teamData = null;
    if (obj[`team${match[1]}`]) {
      // Structure: { team1: { ... }, team2: { ... } }
      teamData = obj[`team${match[1]}`];
    } else if (Array.isArray(obj) && obj[index]) {
      // Structure: [ { ... }, { ... } ]
      teamData = obj[index];
    } else if (obj.teams && Array.isArray(obj.teams) && obj.teams[index]) {
      // Structure: { teams: [ { ... }, { ... } ] }
      teamData = obj.teams[index];
    }
    
    if (teamData) {
      return resolveDotPath(teamData, subPath);
    }
    return '';
  }

  // Standard single team fields (starts with team.XXX)
  const normalizedPath = path.startsWith('team.') ? path.slice(5) : path;
  
  const parts = normalizedPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return '';
    current = current[part];
  }
  return current != null ? String(current) : '';
}

// Hook to load image elements inside Canvas
function useCanvasImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load image in canvas:', src);
      setImage(null);
    };
  }, [src]);

  return image;
}

// Custom wrapper for Konva Image
// Custom helper to load and render image inside container group
const LogoImageHelper = ({ 
  src, 
  x, 
  y, 
  width, 
  height 
}: { 
  src: string; 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
}) => {
  const image = useCanvasImage(src);
  
  if (!image) {
    return (
      <Group x={x} y={y}>
        <Rect
          width={width}
          height={height}
          fill="rgba(255, 255, 255, 0.04)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={1}
          cornerRadius={4}
        />
        <KText
          text="Image"
          fontSize={11}
          fill="#9fa0ac"
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  }

  return <KImage image={image} x={x} y={y} width={width} height={height} />;
};

interface CanvasEditorProps {
  backgroundImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  fieldBoxes: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangeBoxes: (boxes: any[]) => void;
  previewData: any;
}

export default function CanvasEditor({
  backgroundImageUrl,
  canvasWidth,
  canvasHeight,
  fieldBoxes,
  selectedId,
  onSelect,
  onChangeBoxes,
  previewData,
}: CanvasEditorProps) {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  
  // Create mapping of shape references
  const shapeRefs = useRef<Record<string, React.RefObject<any>>>({});

  // Ensure references exist for all fieldBoxes
  fieldBoxes.forEach((box) => {
    if (!shapeRefs.current[box.id]) {
      shapeRefs.current[box.id] = React.createRef();
    }
  });

  const bgImage = useCanvasImage(backgroundImageUrl);

  // Update Konva Transformer selection
  useEffect(() => {
    if (!transformerRef.current) return;

    if (selectedId) {
      const selectedNodeRef = shapeRefs.current[selectedId];
      const selectedNode = selectedNodeRef?.current;
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, fieldBoxes]);

  // Handle click on empty space of stage to deselect
  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
      onSelect(null);
    }
  };

  // Keyboard shortcut to delete field boxes (Delete / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Prevent trigger if typing in an input field
        const activeEl = document.activeElement;
        if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'SELECT' || activeEl?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        const updated = fieldBoxes.filter((b) => b.id !== selectedId);
        onChangeBoxes(updated);
        onSelect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, fieldBoxes, onChangeBoxes, onSelect]);

  const handleBoxChange = (id: string, newAttrs: { x: number; y: number; width: number; height: number }) => {
    const updated = fieldBoxes.map((box) => {
      if (box.id === id) {
        return { ...box, ...newAttrs };
      }
      return box;
    });
    onChangeBoxes(updated);
  };

  return (
    <div className="editor-canvas-scrollbox" style={{ width: canvasWidth, height: canvasHeight }}>
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        ref={stageRef}
      >
        <Layer>
          {/* Background image / canvas default backdrop */}
          {bgImage ? (
            <KImage
              name="background"
              image={bgImage}
              width={canvasWidth}
              height={canvasHeight}
              x={0}
              y={0}
            />
          ) : (
            <Rect
              name="background"
              width={canvasWidth}
              height={canvasHeight}
              fill="#18181b"
              x={0}
              y={0}
            />
          )}

          {/* Render overlay elements */}
          {fieldBoxes.map((box) => {
            const isSelected = box.id === selectedId;
            const ref = shapeRefs.current[box.id];
            const padding = box.padding || 0;
            const elementOpacity = box.elementOpacity ?? 1;
            
            // Resolve text contents (supporting static values)
            let textContent = '';
            if (box.boxType === 'text') {
              const rawVal = resolveDotPath(previewData, box.dataField);
              textContent = box.staticText || rawVal || `[${box.dataField.replace('team.', '')}]`;
            }

            return (
              <Group
                key={box.id}
                ref={ref}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                onClick={() => onSelect(box.id)}
                onTap={() => onSelect(box.id)}
                draggable
                opacity={elementOpacity}
                onDragEnd={(e) => {
                  handleBoxChange(box.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                    width: box.width,
                    height: box.height,
                  });
                }}
                onTransformEnd={() => {
                  const node = ref.current;
                  if (node) {
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    handleBoxChange(box.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(5, node.width() * scaleX),
                      height: Math.max(5, node.height() * scaleY),
                    });
                  }
                }}
              >
                {/* 1. Background Container Card (Rect) */}
                {(box.backgroundColor || box.borderColor) && (
                  <Rect
                    x={0}
                    y={0}
                    width={box.width}
                    height={box.height}
                    fill={box.backgroundColor || 'transparent'}
                    stroke={box.borderColor || 'transparent'}
                    strokeWidth={box.borderWidth || 0}
                    cornerRadius={box.borderRadius || 0}
                    opacity={box.backgroundOpacity ?? 1}
                  />
                )}

                {/* 2. Inner Padded Bounded Content */}
                {box.boxType === 'image' ? (
                  <LogoImageHelper
                    src={resolveDotPath(previewData, box.dataField) || '/placeholder-logo.svg'}
                    x={padding}
                    y={padding}
                    width={Math.max(2, box.width - 2 * padding)}
                    height={Math.max(2, box.height - 2 * padding)}
                  />
                ) : (
                  <KText
                    text={textContent}
                    x={padding}
                    y={padding}
                    width={Math.max(2, box.width - 2 * padding)}
                    height={Math.max(2, box.height - 2 * padding)}
                    fontSize={box.fontSize || 16}
                    fontFamily={box.fontFamily || 'Inter'}
                    fontStyle={`${box.fontWeight === 'bold' ? 'bold' : ''} ${box.fontStyle === 'italic' ? 'italic' : ''}`.trim() || 'normal'}
                    fill={box.color || '#ffffff'}
                    align={box.textAlign || 'left'}
                    verticalAlign="middle"
                  />
                )}
              </Group>
            );
          })}

          {/* Konva Transformer selection boundary box */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Set bounds limit to prevent negative sizing
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={false} // Disable rotation for standard data alignment boxes
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          />
        </Layer>
      </Stage>
    </div>
  );
}
