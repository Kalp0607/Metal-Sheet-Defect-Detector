import React from 'react';
import { BarChart2, BookOpen, Layers } from 'lucide-react';

export default function Navbar({ onOpenEvaluation, onOpenMethodology, backendHealthy, onReset }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 11, 16, 0.94)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '0.75rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        onClick={onReset}
      >
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          padding: '0.45rem',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.15)'
        }}>
          <Layers size={18} color="var(--accent-light)" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              Metal Sheet Defect Detection
            </span>
            <span style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '0.12rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-muted)',
              color: 'var(--accent-light)',
              border: '1px solid var(--accent-border)'
            }}>
              Computer Vision
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Real-time surface inspection using classical image processing
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Backend Connectivity Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          background: backendHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${backendHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          fontSize: '0.71875rem',
          fontWeight: 600,
          color: backendHealthy ? 'var(--color-clean)' : 'var(--color-crack)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: backendHealthy ? 'var(--color-clean)' : 'var(--color-crack)',
            boxShadow: backendHealthy ? '0 0 6px var(--color-clean)' : '0 0 6px var(--color-crack)'
          }} />
          {backendHealthy ? 'FastAPI Online' : 'Connecting...'}
        </div>

        {/* Algorithm Principles Button */}
        <button
          onClick={onOpenMethodology}
          className="btn-secondary"
          title="Inspect algorithm formulations"
        >
          <BookOpen size={14} color="var(--accent-light)" />
          <span>Algorithm Principles</span>
        </button>

        {/* Evaluation Benchmark Button */}
        <button
          onClick={onOpenEvaluation}
          className="btn-primary"
          title="View benchmark evaluation results"
        >
          <BarChart2 size={14} />
          <span>Evaluation Metrics</span>
        </button>
      </div>
    </header>
  );
}
