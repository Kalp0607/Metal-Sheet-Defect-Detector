import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Layers, Sparkles } from 'lucide-react';

export default function ImageUploader({
  onImagesSelected,
  samples,
  onSelectSample,
  onProcessAllSamples,
  isProcessing,
  uploadError
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(Array.from(e.target.files));
    }
  };

  const validateAndProcess = (files) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/bmp', 'image/webp', 'image/tiff'];
    const validFiles = [];

    for (const file of files) {
      if (validExtensions.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|bmp|webp|tiff|tif)$/i)) {
        if (file.size <= 25 * 1024 * 1024) {
          validFiles.push(file);
        }
      }
    }

    if (validFiles.length === 0) {
      alert("No valid images found. Please upload JPG, PNG, BMP, WEBP, or TIFF files up to 25 MB.");
      return;
    }

    onImagesSelected(validFiles);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className="surface-panel"
        style={{
          padding: '2.25rem 1.5rem',
          textAlign: 'center',
          cursor: isProcessing ? 'wait' : 'pointer',
          border: isDragOver
            ? '2px dashed var(--accent-light)'
            : '1px dashed var(--border-medium)',
          background: isDragOver ? 'var(--accent-muted)' : 'var(--bg-surface)',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.bmp,.webp,.tiff"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '46px',
          height: '46px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          color: 'var(--accent-light)',
          marginBottom: '0.85rem'
        }}>
          <Upload size={20} />
        </div>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Select or drag multiple metal sheet photographs
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Upload multiple files for concurrent simultaneous processing (JPG, PNG, BMP, TIFF)
        </p>

        {isProcessing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 11, 16, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              border: '2px solid var(--border-medium)',
              borderTopColor: 'var(--accent-light)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: 'var(--accent-light)' }}>
              Executing Simultaneous Computer Vision Inspection...
            </span>
          </div>
        )}
      </div>

      {/* Error alert banner */}
      {uploadError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          color: 'var(--color-crack)',
          fontSize: '0.78125rem'
        }}>
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Benchmark Sample Images & Batch Action */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Benchmark Sample Images
          </span>

          {/* Quick Concurrent Batch Action */}
          <button
            onClick={onProcessAllSamples}
            disabled={isProcessing}
            className="btn-primary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.71875rem' }}
            title="Simultaneously process all 6 sample sheets"
          >
            <Layers size={13} />
            <span>Process All Samples Concurrently</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: '0.55rem'
        }}>
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="surface-panel"
              style={{
                padding: '0.45rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.15s ease, transform 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-border)';
                e.currentTarget.style.boxShadow = '0 0 10px var(--accent-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={sample.thumbnail}
                alt={sample.title}
                style={{
                  width: '100%',
                  height: '70px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                  marginBottom: '0.35rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              />
              <div style={{
                fontSize: '0.71875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sample.title}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: sample.known_defects_count > 0 ? 'var(--color-scratch)' : 'var(--color-clean)',
                marginTop: '0.1rem',
                fontWeight: 600
              }}>
                {sample.known_defects_count > 0 ? `${sample.known_defects_count} defects` : 'Clean Sheet'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
