import React from 'react';
import { Layers, CheckCircle2, AlertOctagon, Clock, Images } from 'lucide-react';

export default function BatchGallery({
  batchResults,
  activeImageIndex,
  onSelectImage,
  batchTimeMs,
  totalDefects
}) {
  if (!batchResults || batchResults.length <= 1) return null;

  return (
    <div className="surface-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Batch Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Images size={16} color="var(--accent-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Batch Inspection Queue ({batchResults.length} Images)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.71875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Total Batch Defects: <strong style={{ color: totalDefects > 0 ? 'var(--color-scratch)' : 'var(--color-clean)' }}>{totalDefects}</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Concurrent Speed: <strong style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>{batchTimeMs} ms</strong>
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Thumbnails Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
        gap: '0.55rem',
        overflowX: 'auto',
        paddingBottom: '0.2rem'
      }}>
        {batchResults.map((result, idx) => {
          const isActive = idx === activeImageIndex;
          const isClean = result.defect_count === 0;

          return (
            <div
              key={idx}
              onClick={() => onSelectImage(idx)}
              style={{
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-surface-hover)' : 'var(--bg-primary)',
                border: `1px solid ${isActive ? 'var(--accent-light)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease',
                boxShadow: isActive ? '0 0 10px var(--accent-glow)' : 'none',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Thumbnail Image */}
              <img
                src={result.annotated_image || result.original_image}
                alt={result.filename}
                style={{
                  width: '100%',
                  height: '70px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                  marginBottom: '0.35rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              />

              {/* Title & Status */}
              <div style={{
                fontSize: '0.71875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {result.filename}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '0.2rem',
                fontSize: '0.65rem'
              }}>
                <span style={{
                  color: isClean ? 'var(--color-clean)' : 'var(--color-scratch)',
                  fontWeight: 600
                }}>
                  {isClean ? 'Clean' : `${result.defect_count} defects`}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {result.processing_time_ms}ms
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
