import React, { useState, useRef } from 'react';
import { Layers, ZoomIn, ZoomOut, Tag } from 'lucide-react';

export default function ImageCanvas({
  imageData,
  annotatedData,
  imageWidth,
  imageHeight,
  defects,
  selectedDefectId,
  onSelectDefect,
  hoveredDefectId,
  onHoverDefect
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive', 'rendered', 'raw'
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef(null);

  const defectHexMap = {
    'Crack': '#f43f5e',
    'Scratch': '#f59e0b',
    'Pitting/Pore': '#ec4899',
    'Roll Mark': '#eab308',
    'Inclusion': '#a855f7'
  };

  const currentDisplayImage =
    viewMode === 'rendered' && annotatedData
      ? annotatedData
      : imageData;

  return (
    <div className="surface-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
          <button
            onClick={() => setViewMode('interactive')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'interactive' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'interactive' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.71875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Interactive Overlay
          </button>
          <button
            onClick={() => setViewMode('rendered')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'rendered' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'rendered' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.71875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            OpenCV Rendered
          </button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: viewMode === 'raw' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'raw' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.71875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Raw Surface
          </button>
        </div>

        {/* Toggles & Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {viewMode === 'interactive' && (
            <>
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className="btn-secondary"
                style={{
                  padding: '0.28rem 0.55rem',
                  fontSize: '0.71875rem',
                  borderColor: showBoxes ? 'var(--accent-border)' : 'var(--border-subtle)',
                  color: showBoxes ? 'var(--accent-light)' : 'var(--text-muted)'
                }}
                title="Toggle Bounding Boxes"
              >
                <Layers size={13} />
                <span>Boxes</span>
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="btn-secondary"
                style={{
                  padding: '0.28rem 0.55rem',
                  fontSize: '0.71875rem',
                  borderColor: showLabels ? 'var(--accent-border)' : 'var(--border-subtle)',
                  color: showLabels ? 'var(--accent-light)' : 'var(--text-muted)'
                }}
                title="Toggle Defect Labels"
              >
                <Tag size={13} />
                <span>Labels</span>
              </button>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
              className="btn-secondary"
              style={{ padding: '0.28rem 0.45rem' }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.71875rem', fontFamily: 'var(--font-mono)', minWidth: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="btn-secondary"
              style={{ padding: '0.28rem 0.45rem' }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            {zoomLevel !== 1 && (
              <button
                onClick={() => setZoomLevel(1)}
                className="btn-secondary"
                style={{ padding: '0.28rem 0.45rem', fontSize: '0.6875rem' }}
                title="Reset Scale"
              >
                1:1
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflow: 'auto',
          background: '#05070a',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '420px',
          maxHeight: '660px',
          position: 'relative',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{
          position: 'relative',
          display: 'inline-block',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.12s ease'
        }}>
          {/* Base Metal Sheet Photograph */}
          <img
            src={currentDisplayImage}
            alt="Metal Sheet"
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '2px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
            }}
          />

          {/* Precision SVG Overlay */}
          {viewMode === 'interactive' && showBoxes && imageWidth > 0 && imageHeight > 0 && (
            <svg
              viewBox={`0 0 ${imageWidth} ${imageHeight}`}
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <filter id="subtleCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.75" />
                </filter>
              </defs>

              {defects.map((defect) => {
                const [x, y, w, h] = defect.bbox;
                const isSelected = selectedDefectId === defect.id;
                const isHovered = hoveredDefectId === defect.id;
                const hexColor = defectHexMap[defect.type] || '#38bdf8';

                return (
                  <g
                    key={defect.id}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => onSelectDefect(defect.id)}
                    onMouseEnter={() => onHoverDefect(defect.id)}
                    onMouseLeave={() => onHoverDefect(null)}
                  >
                    {/* Bounding Box Rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill={isSelected || isHovered ? `${hexColor}25` : 'transparent'}
                      stroke={hexColor}
                      strokeWidth={isSelected || isHovered ? 2.5 : 1.75}
                      strokeDasharray={isSelected ? '4 2' : 'none'}
                      filter={isSelected || isHovered ? 'url(#subtleCyanGlow)' : 'none'}
                      rx={2}
                      ry={2}
                    />

                    {/* Corner Reticle Markers */}
                    {(isSelected || isHovered) && (
                      <>
                        <line x1={x - 3} y1={y} x2={x + 8} y2={y} stroke={hexColor} strokeWidth={2.5} />
                        <line x1={x} y1={y - 3} x2={x} y2={y + 8} stroke={hexColor} strokeWidth={2.5} />
                        <line x1={x + w + 3} y1={y} x2={x + w - 8} y2={y} stroke={hexColor} strokeWidth={2.5} />
                        <line x1={x + w} y1={y - 3} x2={x + w} y2={y + 8} stroke={hexColor} strokeWidth={2.5} />
                      </>
                    )}

                    {/* Defect Label Tag */}
                    {showLabels && (
                      <g transform={`translate(${x}, ${Math.max(18, y)})`}>
                        <rect
                          x={0}
                          y={-16}
                          width={Math.max(80, defect.type.length * 7.5 + 40)}
                          height={16}
                          fill={hexColor}
                          rx={2}
                          ry={2}
                        />
                        <text
                          x={4}
                          y={-4}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          #{defect.index} {defect.type} ({Math.round(defect.confidence * 100)}%)
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.71875rem',
        color: 'var(--text-muted)'
      }}>
        <span>
          Native Dimensions: <strong style={{ color: 'var(--text-secondary)' }}>{imageWidth} x {imageHeight} px</strong>
        </span>
        <span>
          Overlay Scaling: <strong style={{ color: 'var(--accent-light)' }}>SVG Vector Normalized</strong>
        </span>
      </div>
    </div>
  );
}
