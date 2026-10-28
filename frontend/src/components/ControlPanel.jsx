import React from 'react';
import { Sliders, RotateCcw, Play } from 'lucide-react';

export default function ControlPanel({
  contrastSensitivity,
  setContrastSensitivity,
  edgeSensitivity,
  setEdgeSensitivity,
  minArea,
  setMinArea,
  onApply,
  isProcessing
}) {
  const handleReset = () => {
    setContrastSensitivity(1.0);
    setEdgeSensitivity(1.0);
    setMinArea(50);
  };

  return (
    <div className="surface-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={15} color="var(--accent-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Algorithm Parameter Tuning
          </span>
        </div>
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.6875rem'
          }}
          title="Reset Parameters to Default"
        >
          <RotateCcw size={11} />
          <span>Defaults</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Contrast Sensitivity Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71875rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contrast Sensitivity</span>
            <strong style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
              {contrastSensitivity.toFixed(1)}x
            </strong>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={contrastSensitivity}
            onChange={(e) => setContrastSensitivity(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            <span>0.4x (Mild)</span>
            <span>1.0x</span>
            <span>2.5x (High)</span>
          </div>
        </div>

        {/* Edge Sensitivity Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71875rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Edge & Canny Sensitivity</span>
            <strong style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
              {edgeSensitivity.toFixed(1)}x
            </strong>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={edgeSensitivity}
            onChange={(e) => setEdgeSensitivity(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            <span>0.4x (Coarse)</span>
            <span>1.0x</span>
            <span>2.5x (Fine)</span>
          </div>
        </div>

        {/* Minimum Defect Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71875rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Min Defect Area</span>
            <strong style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
              {minArea} px²
            </strong>
          </div>
          <input
            type="range"
            min="20"
            max="400"
            step="10"
            value={minArea}
            onChange={(e) => setMinArea(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            <span>20 px²</span>
            <span>200 px²</span>
            <span>400 px²</span>
          </div>
        </div>

        {/* Re-analyze Action Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={onApply}
            disabled={isProcessing}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Play size={13} />
            <span>Re-analyze Surface</span>
          </button>
        </div>
      </div>
    </div>
  );
}
