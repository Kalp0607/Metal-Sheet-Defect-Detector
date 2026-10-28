import React from 'react';
import { X, BookOpen } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const topics = [
    {
      category: 'Regional Contrast Normalization',
      title: 'Contrast-Limited Adaptive Histogram Equalization (CLAHE)',
      detail: 'Industrial metal sheets frequently present severe illumination gradients and specular reflections. CLAHE subdivides the image into contextual grid tiles and redistributes local histogram distributions with an adaptive clip limit. This amplifies low-contrast defect contours (such as shallow scratches and faint roll marks) without oversaturating surrounding reflective metal.'
    },
    {
      category: 'Non-Linear Noise Suppression',
      title: 'Bilateral Edge-Preserving Spatial Filtering',
      detail: 'Standard linear Gaussian filters blur both noise and defect edges simultaneously. The bilateral filter incorporates two Gaussian functions: a geometric spatial proximity kernel and a photometric radiometric intensity difference kernel. This selectively smooths high-frequency brushed metal grain texture while preserving sharp defect boundaries with high structural fidelity.'
    },
    {
      category: 'Illumination Correction',
      title: 'Separable Gaussian Background Field Compensation',
      detail: 'Exploiting the mathematical 1D separability of 2D Gaussian kernels, a wide low-frequency illumination baseline field is computed and subtracted from the luminance channel. This neutralizes directional lighting gradients and specular hotspot rings across rolled metal sheets.'
    },
    {
      category: 'Differential Edge Localization',
      title: 'Canny Gradient Magnitude & Hysteresis Edge Linking',
      detail: 'Detects thin fractures and hairline scratches by calculating discrete spatial derivatives (Ix, Iy), gradient magnitude M = sqrt(Ix^2 + Iy^2), and gradient orientation. Non-maximum suppression (NMS) reduces wide gradient ridges down to single-pixel paths, while dual-threshold hysteresis links weak edge fragments to strong defect contours.'
    },
    {
      category: 'False-Positive Elimination',
      title: 'Dynamic Noise-Floor Sigma Gating & Morphology',
      detail: 'To prevent false detections on clean brushed metal, the algorithm continuously measures the standard deviation (sigma) of the surface texture roughness. Defect candidate regions must exceed 3.1x sigma in photometric contrast delta. Morphological opening removes residual 1-2 pixel texture noise, and morphological closing bridges segmented cracks into cohesive bounding boxes.'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 12, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="surface-panel" style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-light)'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Defect Detection Algorithms and Mathematical Principles
              </h3>
              <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Classical computer vision pipeline implemented without pretrained models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Algorithm Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {topics.map((t, idx) => (
            <div key={idx} style={{
              padding: '0.85rem',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {t.title}
                </strong>
                <span style={{
                  fontSize: '0.65625rem',
                  fontWeight: 600,
                  color: 'var(--accent-light)',
                  background: 'var(--accent-muted)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-border)'
                }}>
                  {t.category}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t.detail}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
          <button onClick={onClose} className="btn-primary">
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
