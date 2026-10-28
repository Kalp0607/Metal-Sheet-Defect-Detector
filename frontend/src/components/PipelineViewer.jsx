import React, { useState } from 'react';
import { Layers, Info } from 'lucide-react';

export default function PipelineViewer({ stages }) {
  if (!stages) return null;

  const stageKeys = Object.keys(stages).sort();
  const [activeStage, setActiveStage] = useState(stageKeys[0] || '');

  const stageDescriptions = {
    '1_contrast_enhanced': {
      title: '1. Luminance Extraction & CLAHE Contrast',
      category: 'Contrast Normalization',
      description: 'Separates luminance (L channel) in LAB color space to neutralize specular lighting reflections. Locally Adaptive Histogram Equalization redistributes regional pixel intensity distributions to amplify faint scratch borders against rolled metallic backgrounds.'
    },
    '2_bilateral_filtered': {
      title: '2. Bilateral Edge-Preserving Filter',
      category: 'Non-Linear Spatial Filtering',
      description: 'Combines a geometric domain Gaussian filter with a photometric range Gaussian filter. This suppresses brushed metal grain texture while preserving steep gradient discontinuities characteristic of cracks and surface pits.'
    },
    '3_edge_map': {
      title: '3. Canny Gradient Magnitude & Derivatives',
      category: 'Differential Edge Detection',
      description: 'Computes spatial image derivatives to derive gradient magnitude and orientation. Non-maximum suppression (NMS) thins wide gradient ridges to single-pixel contours, and hysteresis dual-thresholding links low-gradient hairline fissures to strong defect boundaries.'
    },
    '4_binary_mask': {
      title: '4. Morphological Defect Mask & Gating',
      category: 'Morphological Segmentation',
      description: 'Applies morphological opening to extinguish residual grain speckles, followed by morphological closing to merge disjoint defect segments. Pixel candidates are strictly verified against the dynamic surface noise sigma threshold.'
    }
  };

  const currentMeta = stageDescriptions[activeStage] || {
    title: activeStage,
    category: 'Computer Vision Processing',
    description: 'Intermediate image processing visualization.'
  };

  return (
    <div className="surface-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Layers size={16} color="var(--accent-light)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Algorithm Inspection Pipeline
          </span>
        </div>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          Sequential transformation stages
        </span>
      </div>

      {/* Stage Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.35rem',
        background: 'var(--bg-primary)',
        padding: '0.25rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)'
      }}>
        {stageKeys.map((key, idx) => {
          const isActive = activeStage === key;
          return (
            <button
              key={key}
              onClick={() => setActiveStage(key)}
              style={{
                padding: '0.45rem 0.2rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.71875rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                boxShadow: isActive ? '0 0 10px var(--accent-glow)' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Stage {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Stage Image and Explanation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gap: '0.85rem',
        alignItems: 'center'
      }}>
        {/* Stage Image Display */}
        <div style={{
          background: '#05070a',
          borderRadius: 'var(--radius-sm)',
          padding: '0.35rem',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}>
          {stages[activeStage] && (
            <img
              src={stages[activeStage]}
              alt={activeStage}
              style={{
                maxWidth: '100%',
                maxHeight: '240px',
                borderRadius: '2px',
                objectFit: 'contain'
              }}
            />
          )}
        </div>

        {/* Stage Explanation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentMeta.title}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.6875rem',
            color: 'var(--accent-light)',
            fontWeight: 600
          }}>
            <Info size={12} />
            <span>{currentMeta.category}</span>
          </div>
          <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {currentMeta.description}
          </p>
        </div>
      </div>
    </div>
  );
}
