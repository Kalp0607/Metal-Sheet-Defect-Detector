import React from 'react';
import { CheckCircle2, AlertOctagon, Activity } from 'lucide-react';

export default function DefectList({
  defects,
  summary,
  processingTimeMs,
  noiseSigma,
  selectedDefectId,
  onSelectDefect,
  hoveredDefectId,
  onHoverDefect
}) {
  const isClean = !defects || defects.length === 0;

  const defectColorMap = {
    'Crack': 'var(--color-crack)',
    'Scratch': 'var(--color-scratch)',
    'Pitting/Pore': 'var(--color-pitting)',
    'Roll Mark': 'var(--color-rollmark)',
    'Inclusion': 'var(--color-inclusion)'
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Severe':
        return <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.18)', color: 'var(--color-crack)', border: '1px solid rgba(244, 63, 94, 0.35)' }}>Severe</span>;
      case 'High':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.18)', color: 'var(--color-scratch)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>High</span>;
      case 'Medium':
        return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.18)', color: 'var(--color-rollmark)', border: '1px solid rgba(234, 179, 8, 0.35)' }}>Medium</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.18)', color: 'var(--accent-light)', border: '1px solid rgba(56, 189, 248, 0.35)' }}>Low</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Top Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.55rem'
      }}>
        {/* Inspection Status Card */}
        <div className="surface-panel" style={{
          padding: '0.75rem',
          borderLeft: `3px solid ${isClean ? 'var(--color-clean)' : 'var(--color-crack)'}`
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Surface Status
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.2rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: isClean ? 'var(--color-clean)' : 'var(--color-crack)'
          }}>
            {isClean ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
            {isClean ? 'CLEAN SHEET' : `${defects.length} DEFECTS FOUND`}
          </div>
        </div>

        {/* Latency Card */}
        <div className="surface-panel" style={{
          padding: '0.75rem',
          borderLeft: '3px solid var(--accent-light)'
        }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Execution Time
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.2rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)'
          }}>
            <Activity size={16} color="var(--accent-light)" />
            {processingTimeMs} ms
          </div>
        </div>
      </div>

      {/* Defect Manifest Table */}
      <div className="surface-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Detected Defect Manifest
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {defects?.length || 0} localized
          </span>
        </div>

        {isClean ? (
          <div style={{
            padding: '1.75rem 1rem',
            textAlign: 'center',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-subtle)'
          }}>
            <CheckCircle2 size={24} color="var(--color-clean)" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              No Defects Detected
            </div>
            <p style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Surface texture falls within normal roughness distribution without threshold exceeding anomalies.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '0.2rem'
          }}>
            {defects.map((defect) => {
              const isSelected = selectedDefectId === defect.id;
              const isHovered = hoveredDefectId === defect.id;
              const color = defectColorMap[defect.type] || 'var(--accent-light)';

              return (
                <div
                  key={defect.id}
                  onClick={() => onSelectDefect(defect.id)}
                  onMouseEnter={() => onHoverDefect(defect.id)}
                  onMouseLeave={() => onHoverDefect(null)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected
                      ? 'var(--bg-surface-hover)'
                      : isHovered
                      ? 'var(--bg-surface-elevated)'
                      : 'var(--bg-primary)',
                    border: `1px solid ${isSelected ? 'var(--accent-light)' : isHovered ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    boxShadow: isSelected ? '0 0 10px var(--accent-glow)' : 'none'
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: color
                      }} />
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        #{defect.index} {defect.type}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {getSeverityBadge(defect.severity)}
                      <span style={{
                        fontSize: '0.71875rem',
                        fontWeight: 700,
                        color: 'var(--accent-light)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {Math.round(defect.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Measurements */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.25rem',
                    fontSize: '0.6875rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.3rem',
                    paddingTop: '0.3rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Area: </span>
                      <span>{defect.area_px} px²</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Ratio: </span>
                      <span>{defect.aspect_ratio}:1</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Box: </span>
                      <span>[{defect.bbox[0]}, {defect.bbox[1]}, {defect.bbox[2]}, {defect.bbox[3]}]</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
