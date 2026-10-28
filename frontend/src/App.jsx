import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import ImageCanvas from './components/ImageCanvas';
import DefectList from './components/DefectList';
import PipelineViewer from './components/PipelineViewer';
import ControlPanel from './components/ControlPanel';
import BatchGallery from './components/BatchGallery';
import EvaluationModal from './components/EvaluationModal';
import MethodologyModal from './components/MethodologyModal';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [samples, setSamples] = useState([]);
  
  // Batch processing state
  const [batchResults, setBatchResults] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [batchTimeMs, setBatchTimeMs] = useState(0);
  const [totalBatchDefects, setTotalBatchDefects] = useState(0);
  const [currentUploadedFiles, setCurrentUploadedFiles] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Tunable parameters
  const [contrastSensitivity, setContrastSensitivity] = useState(1.0);
  const [edgeSensitivity, setEdgeSensitivity] = useState(1.0);
  const [minArea, setMinArea] = useState(50);

  // Interaction selection
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [hoveredDefectId, setHoveredDefectId] = useState(null);

  // Modals
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);

  useEffect(() => {
    checkHealth();
    fetchSamples();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/samples`);
      if (res.ok) {
        const json = await res.json();
        setSamples(json.samples || []);
      }
    } catch (e) {
      console.error("Failed to load samples", e);
    }
  };

  // Simultaneous multi-image upload & processing
  const handleDetectBatch = async (files) => {
    setIsProcessing(true);
    setUploadError(null);
    setCurrentUploadedFiles(files);
    setSelectedDefectId(null);

    const formData = new FormData();
    files.forEach((f) => {
      formData.append('files', f);
    });

    const queryParams = new URLSearchParams({
      contrast_sensitivity: contrastSensitivity,
      edge_sensitivity: edgeSensitivity,
      min_area: minArea
    });

    try {
      const res = await fetch(`${API_BASE}/api/detect-batch?${queryParams}`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error (HTTP ${res.status})`);
      }

      const data = await res.json();
      setBatchResults(data.results || []);
      setActiveImageIndex(0);
      setBatchTimeMs(data.batch_processing_time_ms || 0);
      setTotalBatchDefects(data.total_defects || 0);
    } catch (err) {
      setUploadError(err.message || 'Defect detection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process all benchmark samples simultaneously
  const handleProcessAllSamples = async () => {
    setIsProcessing(true);
    setUploadError(null);
    setSelectedDefectId(null);
    setCurrentUploadedFiles([]);

    const queryParams = new URLSearchParams({
      contrast_sensitivity: contrastSensitivity,
      edge_sensitivity: edgeSensitivity,
      min_area: minArea
    });

    try {
      const res = await fetch(`${API_BASE}/api/samples/process-all?${queryParams}`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error (HTTP ${res.status})`);
      }

      const data = await res.json();
      setBatchResults(data.results || []);
      setActiveImageIndex(0);
      setBatchTimeMs(data.batch_processing_time_ms || 0);
      setTotalBatchDefects(data.total_defects || 0);
    } catch (err) {
      setUploadError(err.message || 'Batch sample inspection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Select Single Sample Image
  const handleSelectSample = async (sampleId) => {
    setIsProcessing(true);
    setUploadError(null);
    setSelectedDefectId(null);
    try {
      const res = await fetch(`${API_BASE}/api/sample/${sampleId}`);
      if (!res.ok) throw new Error("Could not load sample");
      const json = await res.json();

      const base64Data = json.image_data.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const file = new File([blob], sampleId, { type: 'image/jpeg' });

      await handleDetectBatch([file]);
    } catch (err) {
      setUploadError(err.message || "Failed to load sample");
      setIsProcessing(false);
    }
  };

  // Re-run batch analysis with updated tuning parameters
  const handleReanalyze = () => {
    if (currentUploadedFiles.length > 0) {
      handleDetectBatch(currentUploadedFiles);
    } else if (batchResults.length > 0) {
      handleProcessAllSamples();
    }
  };

  const handleReset = () => {
    setBatchResults([]);
    setActiveImageIndex(0);
    setCurrentUploadedFiles([]);
    setUploadError(null);
    setSelectedDefectId(null);
  };

  const currentResult = batchResults[activeImageIndex] || null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        backendHealthy={backendHealthy}
        onOpenEvaluation={() => setIsEvalOpen(true)}
        onOpenMethodology={() => setIsMethodOpen(true)}
        onReset={handleReset}
      />

      {/* Main Workspace Layout */}
      <main style={{
        flex: 1,
        maxWidth: '1540px',
        width: '100%',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {currentResult ? (
          /* Inspection Layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Multi-Image Queue Selector (if batch contains multiple images) */}
            <BatchGallery
              batchResults={batchResults}
              activeImageIndex={activeImageIndex}
              onSelectImage={setActiveImageIndex}
              batchTimeMs={batchTimeMs}
              totalDefects={totalBatchDefects}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)',
              gap: '1rem',
              alignItems: 'start'
            }}>
              {/* Left Inspection Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ImageCanvas
                  imageData={currentResult.original_image}
                  annotatedData={currentResult.annotated_image}
                  imageWidth={currentResult.image_width}
                  imageHeight={currentResult.image_height}
                  defects={currentResult.defects}
                  selectedDefectId={selectedDefectId}
                  onSelectDefect={setSelectedDefectId}
                  hoveredDefectId={hoveredDefectId}
                  onHoverDefect={setHoveredDefectId}
                />

                <ControlPanel
                  contrastSensitivity={contrastSensitivity}
                  setContrastSensitivity={setContrastSensitivity}
                  edgeSensitivity={edgeSensitivity}
                  setEdgeSensitivity={setEdgeSensitivity}
                  minArea={minArea}
                  setMinArea={setMinArea}
                  onApply={handleReanalyze}
                  isProcessing={isProcessing}
                />

                <PipelineViewer stages={currentResult.stages} />
              </div>

              {/* Right Manifest & Controls Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Viewing: <strong style={{ color: 'var(--text-primary)' }}>{currentResult.filename}</strong> {batchResults.length > 1 && `(${activeImageIndex + 1} of ${batchResults.length})`}
                  </span>
                  <button onClick={handleReset} className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.71875rem' }}>
                    Upload New Images
                  </button>
                </div>

                <DefectList
                  defects={currentResult.defects}
                  summary={currentResult.summary}
                  processingTimeMs={currentResult.processing_time_ms}
                  noiseSigma={currentResult.noise_sigma}
                  selectedDefectId={selectedDefectId}
                  onSelectDefect={setSelectedDefectId}
                  hoveredDefectId={hoveredDefectId}
                  onHoverDefect={setHoveredDefectId}
                />

                <ImageUploader
                  onImagesSelected={handleDetectBatch}
                  samples={samples}
                  onSelectSample={handleSelectSample}
                  onProcessAllSamples={handleProcessAllSamples}
                  isProcessing={isProcessing}
                  uploadError={uploadError}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Initial Landing and Upload View */
          <div style={{
            maxWidth: '820px',
            margin: '1.5rem auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Metal Sheet Defect Detection
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '600px', margin: '0.35rem auto 0', lineHeight: 1.5 }}>
                Surface inspection and defect localization for rolled and brushed metal plates. Upload single or multiple images for simultaneous concurrent processing.
              </p>
            </div>

            <ImageUploader
              onImagesSelected={handleDetectBatch}
              samples={samples}
              onSelectSample={handleSelectSample}
              onProcessAllSamples={handleProcessAllSamples}
              isProcessing={isProcessing}
              uploadError={uploadError}
            />

            {/* Core Technical Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginTop: '0.25rem'
            }}>
              <div className="surface-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: '0.2rem' }}>
                  Simultaneous Multi-Image
                </div>
                <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Concurrently processes image batches across worker threads with unified defect statistics.
                </p>
              </div>

              <div className="surface-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-clean)', marginBottom: '0.2rem' }}>
                  Dynamic Noise Gating
                </div>
                <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Evaluates background surface roughness variance to prevent false alarms on clean brushed metal finishes.
                </p>
              </div>

              <div className="surface-panel" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-scratch)', marginBottom: '0.2rem' }}>
                  Deterministic Inspection
                </div>
                <p style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Extracts geometric features including area, perimeter, aspect ratio, and circularity with high-speed execution.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <EvaluationModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
      />

      <MethodologyModal
        isOpen={isMethodOpen}
        onClose={() => setIsMethodOpen(false)}
      />
    </div>
  );
}
