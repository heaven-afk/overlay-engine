'use client';

import { FieldBox, FieldCatalogItem, OverlayTemplate } from '@/lib/db';
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Trash, ArrowUp, ArrowDown, Plus, Layers
} from 'lucide-react';

interface StylePanelProps {
  templateName: string;
  setTemplateName: (val: string) => void;
  canvasWidth: number;
  setCanvasWidth: (val: number) => void;
  canvasHeight: number;
  setCanvasHeight: (val: number) => void;
  backgroundImageUrl: string;
  setBackgroundImageUrl: (val: string) => void;
  
  fieldBoxes: FieldBox[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangeBoxes: (boxes: FieldBox[]) => void;
  catalog: FieldCatalogItem[];
  onAddBox: (catalogItem: FieldCatalogItem) => void;
}

export default function StylePanel({
  templateName,
  setTemplateName,
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  backgroundImageUrl,
  setBackgroundImageUrl,
  fieldBoxes,
  selectedId,
  onSelect,
  onChangeBoxes,
  catalog,
  onAddBox,
}: StylePanelProps) {
  
  const selectedBox = fieldBoxes.find((b) => b.id === selectedId) || null;

  const handleUpdateBox = (attrs: Partial<FieldBox>) => {
    if (!selectedId) return;
    const updated = fieldBoxes.map((box) => {
      if (box.id === selectedId) {
        return { ...box, ...attrs };
      }
      return box;
    });
    onChangeBoxes(updated);
  };

  const handleDeleteBox = (id: string) => {
    const updated = fieldBoxes.filter((box) => box.id !== id);
    onChangeBoxes(updated);
    if (selectedId === id) {
      onSelect(null);
    }
  };

  const handleZIndex = (direction: 'front' | 'back') => {
    if (!selectedId) return;
    const boxIndex = fieldBoxes.findIndex((b) => b.id === selectedId);
    if (boxIndex === -1) return;

    const newBoxes = [...fieldBoxes];
    const [targetBox] = newBoxes.splice(boxIndex, 1);

    if (direction === 'front') {
      // Bring to front means push to end of array so it renders last (on top)
      newBoxes.push(targetBox);
    } else {
      // Send to back means unshift to start of array so it renders first (on bottom)
      newBoxes.unshift(targetBox);
    }
    onChangeBoxes(newBoxes);
  };

  // Group catalog items for structured display
  const groupedCatalog = catalog.reduce((groups, item) => {
    let group = 'General';
    if (item.key.includes('analytics')) group = 'Analytics';
    else if (item.key.includes('scores') || item.key.includes('labels')) group = 'Identity & Labels';
    else if (item.key.includes('logoUrl')) group = 'Media';
    else group = 'Core Stats';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, FieldCatalogItem[]>);

  return (
    <div className="editor-sidebar">
      {/* SECTION 1: SELECTED ELEMENT CONFIG */}
      {selectedBox ? (
        <>
          <div>
            <div className="flex-between">
              <span className="sidebar-section-title" style={{ margin: 0 }}>Field Properties</span>
              <button 
                onClick={() => handleDeleteBox(selectedBox.id)} 
                className="element-action-btn"
                style={{ color: '#ef4444' }}
                title="Delete Field"
              >
                <Trash style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            
            <div style={{ marginTop: '1rem' }} className="property-field">
              <span className="property-label">Bound Data Source</span>
              <select
                className="select-input"
                value={selectedBox.dataField}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    handleUpdateBox({ 
                      dataField: '',
                      boxType: 'text',
                      staticText: selectedBox.staticText || 'Custom Label'
                    });
                  } else {
                    const item = catalog.find(c => c.key === val);
                    if (item) {
                      handleUpdateBox({ 
                        dataField: item.key,
                        boxType: item.type 
                      });
                    }
                  }
                }}
              >
                <option value="">(Static Label - Custom Text)</option>
                {catalog.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label} ({item.key})
                  </option>
                ))}
              </select>
            </div>

            {selectedBox.boxType === 'text' && !selectedBox.dataField && (
              <div style={{ marginTop: '0.75rem' }} className="property-field">
                <span className="property-label">Static Label Text</span>
                <input
                  type="text"
                  className="text-input"
                  value={selectedBox.staticText || ''}
                  onChange={(e) => handleUpdateBox({ staticText: e.target.value })}
                  placeholder="Enter static text (e.g. VS, PPM, Standings)"
                />
              </div>
            )}
          </div>

          <div>
            <span className="sidebar-section-title">Geometry</span>
            <div className="property-grid">
              <div className="property-field">
                <span className="property-label">X Position</span>
                <input
                  type="number"
                  className="text-input"
                  value={Math.round(selectedBox.x)}
                  onChange={(e) => handleUpdateBox({ x: Number(e.target.value) })}
                />
              </div>
              <div className="property-field">
                <span className="property-label">Y Position</span>
                <input
                  type="number"
                  className="text-input"
                  value={Math.round(selectedBox.y)}
                  onChange={(e) => handleUpdateBox({ y: Number(e.target.value) })}
                />
              </div>
              <div className="property-field">
                <span className="property-label">Width</span>
                <input
                  type="number"
                  className="text-input"
                  value={Math.round(selectedBox.width)}
                  onChange={(e) => handleUpdateBox({ width: Number(e.target.value) })}
                />
              </div>
              <div className="property-field">
                <span className="property-label">Height</span>
                <input
                  type="number"
                  className="text-input"
                  value={Math.round(selectedBox.height)}
                  onChange={(e) => handleUpdateBox({ height: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }} className="property-field">
              <span className="property-label">Layer Order (Z-Index)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleZIndex('front')}
                  className="btn btn-secondary btn-sm"
                  style={{ flexGrow: 1, justifyContent: 'center' }}
                >
                  <ArrowUp style={{ width: '14px', height: '14px' }} />
                  Bring to Front
                </button>
                <button
                  onClick={() => handleZIndex('back')}
                  className="btn btn-secondary btn-sm"
                  style={{ flexGrow: 1, justifyContent: 'center' }}
                >
                  <ArrowDown style={{ width: '14px', height: '14px' }} />
                  Send to Back
                </button>
              </div>
            </div>
          </div>

          {selectedBox.boxType === 'text' && (
            <div>
              <span className="sidebar-section-title">Typography</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="property-field">
                  <span className="property-label">Font Family</span>
                  <select
                    className="select-input"
                    value={selectedBox.fontFamily || 'Inter'}
                    onChange={(e) => handleUpdateBox({ fontFamily: e.target.value })}
                  >
                    <option value="Inter">Inter (Sans-serif)</option>
                    <option value="Outfit">Outfit (Display)</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Cinzel">Cinzel (Roman Serif)</option>
                    <option value="Impact">Impact (Bold Header)</option>
                    <option value="Arial">Arial</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                <div className="property-grid">
                  <div className="property-field">
                    <span className="property-label">Font Size</span>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedBox.fontSize || 16}
                      onChange={(e) => handleUpdateBox({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div className="property-field">
                    <span className="property-label">Text Color</span>
                    <input
                      type="color"
                      className="color-picker-input"
                      value={selectedBox.color || '#ffffff'}
                      onChange={(e) => handleUpdateBox({ color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="property-grid">
                  <div className="property-field">
                    <span className="property-label">Weight & Style</span>
                    <div className="toggle-group">
                      <button
                        className={`toggle-btn ${selectedBox.fontWeight === 'bold' ? 'active' : ''}`}
                        onClick={() => handleUpdateBox({ fontWeight: selectedBox.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      >
                        <Bold style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                      </button>
                      <button
                        className={`toggle-btn ${(selectedBox as any).fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => handleUpdateBox({ fontStyle: (selectedBox as any).fontStyle === 'italic' ? 'normal' : 'italic' } as any)}
                      >
                        <Italic style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                      </button>
                    </div>
                  </div>

                  <div className="property-field">
                    <span className="property-label">Alignment</span>
                    <div className="toggle-group">
                      <button
                        className={`toggle-btn ${selectedBox.textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => handleUpdateBox({ textAlign: 'left' })}
                      >
                        <AlignLeft style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                      </button>
                      <button
                        className={`toggle-btn ${selectedBox.textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => handleUpdateBox({ textAlign: 'center' })}
                      >
                        <AlignCenter style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                      </button>
                      <button
                        className={`toggle-btn ${selectedBox.textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => handleUpdateBox({ textAlign: 'right' })}
                      >
                        <AlignRight style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* CONTAINER CARD STYLING */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
            <span className="sidebar-section-title">Container Styling</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Background Color & Opacity */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.04)' 
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer', 
                  marginBottom: selectedBox.backgroundColor ? '0.75rem' : 0 
                }}>
                  <input 
                    type="checkbox"
                    checked={!!selectedBox.backgroundColor}
                    onChange={(e) => {
                      handleUpdateBox({
                        backgroundColor: e.target.checked ? '#181824' : '',
                        backgroundOpacity: e.target.checked ? 0.8 : 1
                      });
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enable Background Fill</span>
                </label>
                
                {selectedBox.backgroundColor && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="property-grid">
                      <div className="property-field">
                        <span className="property-label">Fill Color</span>
                        <input 
                          type="color"
                          className="color-picker-input"
                          value={selectedBox.backgroundColor || '#181824'}
                          onChange={(e) => handleUpdateBox({ backgroundColor: e.target.value })}
                        />
                      </div>
                      <div className="property-field">
                        <span className="property-label">Fill Opacity ({Math.round((selectedBox.backgroundOpacity ?? 1) * 100)}%)</span>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={selectedBox.backgroundOpacity ?? 0.8}
                          onChange={(e) => handleUpdateBox({ backgroundOpacity: Number(e.target.value) })}
                          style={{ width: '100%', height: '32px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Border Color & Width */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.04)' 
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer', 
                  marginBottom: selectedBox.borderColor ? '0.75rem' : 0 
                }}>
                  <input 
                    type="checkbox"
                    checked={!!selectedBox.borderColor}
                    onChange={(e) => {
                      handleUpdateBox({
                        borderColor: e.target.checked ? '#8b5cf6' : '',
                        borderWidth: e.target.checked ? 2 : 0
                      });
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enable Border Outline</span>
                </label>
                
                {selectedBox.borderColor && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="property-grid">
                      <div className="property-field">
                        <span className="property-label">Outline Color</span>
                        <input 
                          type="color"
                          className="color-picker-input"
                          value={selectedBox.borderColor || '#8b5cf6'}
                          onChange={(e) => handleUpdateBox({ borderColor: e.target.value })}
                        />
                      </div>
                      <div className="property-field">
                        <span className="property-label">Border Width (px)</span>
                        <input 
                          type="number"
                          min="1"
                          max="20"
                          className="text-input"
                          value={selectedBox.borderWidth || 2}
                          onChange={(e) => handleUpdateBox({ borderWidth: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Padding, Corner Radius, and Opacity */}
              <div className="property-grid">
                <div className="property-field">
                  <span className="property-label">Corner Radius (px)</span>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    className="text-input"
                    value={selectedBox.borderRadius || 0}
                    onChange={(e) => handleUpdateBox({ borderRadius: Number(e.target.value) })}
                  />
                </div>
                <div className="property-field">
                  <span className="property-label">Padding (px)</span>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    className="text-input"
                    value={selectedBox.padding || 0}
                    onChange={(e) => handleUpdateBox({ padding: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="property-field">
                <span className="property-label">Element Opacity ({Math.round((selectedBox.elementOpacity ?? 1) * 100)}%)</span>
                <input 
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedBox.elementOpacity ?? 1}
                  onChange={(e) => handleUpdateBox({ elementOpacity: Number(e.target.value) })}
                  style={{ width: '100%', height: '32px' }}
                />
              </div>

            </div>
          </div>

          {/* ANIMATION SECTION */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
            <span className="sidebar-section-title">Animation</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="property-field">
                <span className="property-label">Entrance</span>
                <select
                  className="select-input"
                  value={selectedBox.entranceAnimation || 'none'}
                  onChange={(e) => handleUpdateBox({ entranceAnimation: e.target.value as any })}
                >
                  <option value="none">None</option>
                  <option value="fadeIn">Fade In</option>
                  <option value="slideInLeft">Slide In — Left</option>
                  <option value="slideInRight">Slide In — Right</option>
                  <option value="slideInUp">Slide In — Up</option>
                  <option value="slideInDown">Slide In — Down</option>
                  <option value="scaleIn">Scale In</option>
                  <option value="bounceIn">Bounce In</option>
                </select>
              </div>

              {(selectedBox.entranceAnimation && selectedBox.entranceAnimation !== 'none') && (
                <div className="property-grid">
                  <div className="property-field">
                    <span className="property-label">Duration (ms)</span>
                    <input
                      type="number"
                      className="text-input"
                      min={100}
                      max={2000}
                      step={50}
                      value={selectedBox.entranceDuration ?? 400}
                      onChange={(e) => handleUpdateBox({ entranceDuration: Number(e.target.value) })}
                    />
                  </div>
                  <div className="property-field">
                    <span className="property-label">Delay (ms)</span>
                    <input
                      type="number"
                      className="text-input"
                      min={0}
                      max={3000}
                      step={50}
                      value={selectedBox.entranceDelay ?? 0}
                      onChange={(e) => handleUpdateBox({ entranceDelay: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div className="property-field" style={{ marginTop: '0.25rem' }}>
                <span className="property-label">On Update</span>
                <select
                  className="select-input"
                  value={selectedBox.updateAnimation || 'none'}
                  onChange={(e) => handleUpdateBox({ updateAnimation: e.target.value as any })}
                >
                  <option value="none">None</option>
                  <option value="countUp">Count Up (numbers only)</option>
                  <option value="pulse">Pulse</option>
                  <option value="flash">Flash</option>
                  <option value="flip">Flip</option>
                </select>
              </div>

              {(selectedBox.updateAnimation && selectedBox.updateAnimation !== 'none') && (
                <div className="property-field">
                  <span className="property-label">Update Duration (ms)</span>
                  <input
                    type="number"
                    className="text-input"
                    min={100}
                    max={2000}
                    step={50}
                    value={selectedBox.updateDuration ?? 300}
                    onChange={(e) => handleUpdateBox({ updateDuration: Number(e.target.value) })}
                  />
                </div>
              )}

            </div>
          </div>
        </>
      ) : (
        <>
          {/* SECTION 2: TEMPLATE PROPERTIES & CATALOG */}
          <div>
            <span className="sidebar-section-title">Template Details</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="property-field">
                <span className="property-label">Template Name</span>
                <input
                  type="text"
                  className="text-input"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="E.g. Daily Top 5 Overlay"
                />
              </div>

              <div className="property-field">
                <span className="property-label">Background Image URL</span>
                <input
                  type="text"
                  className="text-input"
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  placeholder="Paste direct image URL"
                />
              </div>

              <div className="property-grid">
                <div className="property-field">
                  <span className="property-label">Canvas Width</span>
                  <input
                    type="number"
                    className="text-input"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Number(e.target.value))}
                  />
                </div>
                <div className="property-field">
                  <span className="property-label">Canvas Height</span>
                  <input
                    type="number"
                    className="text-input"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="sidebar-section-title">Add Data Field</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span className="property-label" style={{ fontSize: '0.75rem' }}>Select a field key to place on the canvas:</span>
              <select
                className="select-input"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    const item = catalog.find((c) => c.key === e.target.value);
                    if (item) onAddBox(item);
                    e.target.value = ''; // Reset select state
                  }
                }}
              >
                <option value="" disabled>-- Choose a data field --</option>
                {Object.entries(groupedCatalog).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="sidebar-section-title">Placed Fields ({fieldBoxes.length})</span>
            {fieldBoxes.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No fields placed. Select a field above to start.
              </div>
            ) : (
              <div className="elements-list">
                {fieldBoxes.map((box) => {
                  const catalogItem = catalog.find((c) => c.key === box.dataField);
                  return (
                    <div 
                      key={box.id} 
                      className={`element-item ${selectedId === box.id ? 'active' : ''}`}
                      onClick={() => onSelect(box.id)}
                    >
                      <span className="element-item-name" title={box.dataField}>
                        {catalogItem ? catalogItem.label : box.dataField.replace('team.', '')}
                      </span>
                      <div className="element-item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBox(box.id);
                          }}
                          className="element-action-btn"
                          style={{ color: 'rgba(239, 68, 68, 0.6)' }}
                          title="Delete Field"
                        >
                          <Trash style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
