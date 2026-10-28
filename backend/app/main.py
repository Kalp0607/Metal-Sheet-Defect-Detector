from fastapi import FastAPI, File, UploadFile, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import os
import json
import base64
import time
import asyncio
from typing import List, Optional, Dict, Any

from .detector import MetalSheetDefectDetector
from .evaluation import run_evaluation

app = FastAPI(
    title="Industrial Metal Sheet Defect Detection API",
    description="Custom Computer Vision Algorithm for real-time metal sheet defect inspection without pretrained models.",
    version="1.1.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB per file
MAX_BATCH_SIZE = 30               # Maximum images in one batch

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

def _process_image_bytes(
    contents: bytes,
    filename: str,
    detector: MetalSheetDefectDetector,
    contrast_sensitivity: float,
    edge_sensitivity: float,
    min_area: int
) -> Dict[str, Any]:
    """Helper that executes custom CV defect detection on raw bytes."""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "filename": filename,
            "success": False,
            "error": f"Unsupported format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }

    if not contents or len(contents) == 0:
        return {
            "filename": filename,
            "success": False,
            "error": "Empty file (0 bytes)."
        }

    if len(contents) > MAX_FILE_SIZE:
        return {
            "filename": filename,
            "success": False,
            "error": f"File exceeds {MAX_FILE_SIZE // (1024*1024)} MB limit."
        }

    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {
            "filename": filename,
            "success": False,
            "error": "Could not decode image bytes."
        }

    result = detector.detect(img_bgr, return_stages=True)
    success, buf = cv2.imencode(".jpg", img_bgr)
    orig_b64 = base64.b64encode(buf).decode("utf-8") if success else ""
    result["original_image"] = f"data:image/jpeg;base64,{orig_b64}"
    result["filename"] = filename
    result["parameters_used"] = {
        "contrast_sensitivity": contrast_sensitivity,
        "edge_sensitivity": edge_sensitivity,
        "min_area": min_area
    }
    return result

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Metal Sheet Defect Detection API",
        "version": "1.1.0",
        "algorithm": "Custom Computer Vision (Bilateral + CLAHE + Canny + Morphological Gating)"
    }

@app.post("/api/detect")
async def detect_defects(
    file: UploadFile = File(...),
    contrast_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    edge_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    min_area: int = Query(50, ge=10, le=2000)
):
    """Single image defect detection endpoint."""
    filename = file.filename or "unknown.jpg"
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read upload: {str(e)}")

    detector = MetalSheetDefectDetector(
        min_defect_area=min_area,
        contrast_sensitivity=contrast_sensitivity,
        edge_sensitivity=edge_sensitivity
    )

    result = _process_image_bytes(
        contents, filename, detector,
        contrast_sensitivity, edge_sensitivity, min_area
    )

    if not result.get("success", False):
        raise HTTPException(status_code=422, detail=result.get("error", "Processing failed"))

    return JSONResponse(content=result)

@app.post("/api/detect-batch")
async def detect_defects_batch(
    files: List[UploadFile] = File(...),
    contrast_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    edge_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    min_area: int = Query(50, ge=10, le=2000)
):
    """
    Simultaneous multi-image defect detection endpoint.
    Concurrently processes multiple metal sheet photographs in thread pools.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    if len(files) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Batch size {len(files)} exceeds maximum limit of {MAX_BATCH_SIZE} images."
        )

    start_time = time.time()
    detector = MetalSheetDefectDetector(
        min_defect_area=min_area,
        contrast_sensitivity=contrast_sensitivity,
        edge_sensitivity=edge_sensitivity
    )

    # 1. Read all file contents asynchronously
    contents_list = await asyncio.gather(*[f.read() for f in files])

    # 2. Process all images simultaneously in thread pool
    tasks = [
        asyncio.to_thread(
            _process_image_bytes,
            contents,
            f.filename or f"image_{idx+1}.jpg",
            detector,
            contrast_sensitivity,
            edge_sensitivity,
            min_area
        )
        for idx, (contents, f) in enumerate(zip(contents_list, files))
    ]

    results = await asyncio.gather(*tasks)
    batch_elapsed_ms = round((time.time() - start_time) * 1000, 1)

    total_defects = sum(r.get("defect_count", 0) for r in results if r.get("success"))
    successful_count = sum(1 for r in results if r.get("success"))

    return JSONResponse(content={
        "total_images": len(results),
        "successful_count": successful_count,
        "total_defects": total_defects,
        "batch_processing_time_ms": batch_elapsed_ms,
        "results": results
    })

@app.post("/api/samples/process-all")
async def process_all_samples(
    contrast_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    edge_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    min_area: int = Query(50, ge=10, le=2000)
):
    """Loads and simultaneously processes all available benchmark sample metal sheets."""
    annot_path = os.path.join(SAMPLES_DIR, "annotations.json")
    if not os.path.exists(annot_path):
        raise HTTPException(status_code=404, detail="No sample annotations found.")

    with open(annot_path, "r") as f:
        annot = json.load(f)

    file_items = []
    for fname, meta in annot.items():
        fpath = os.path.join(SAMPLES_DIR, fname)
        if os.path.exists(fpath):
            with open(fpath, "rb") as f:
                file_items.append((f.read(), fname))

    start_time = time.time()
    detector = MetalSheetDefectDetector(
        min_defect_area=min_area,
        contrast_sensitivity=contrast_sensitivity,
        edge_sensitivity=edge_sensitivity
    )

    tasks = [
        asyncio.to_thread(
            _process_image_bytes,
            contents,
            fname,
            detector,
            contrast_sensitivity,
            edge_sensitivity,
            min_area
        )
        for contents, fname in file_items
    ]

    results = await asyncio.gather(*tasks)
    batch_elapsed_ms = round((time.time() - start_time) * 1000, 1)

    total_defects = sum(r.get("defect_count", 0) for r in results if r.get("success"))

    return JSONResponse(content={
        "total_images": len(results),
        "successful_count": len([r for r in results if r.get("success")]),
        "total_defects": total_defects,
        "batch_processing_time_ms": batch_elapsed_ms,
        "results": results
    })

@app.get("/api/samples")
def list_samples():
    """Returns curated industrial metal sheet samples for immediate testing."""
    annot_path = os.path.join(SAMPLES_DIR, "annotations.json")
    if not os.path.exists(annot_path):
        return {"samples": []}

    with open(annot_path, "r") as f:
        annot = json.load(f)

    samples = []
    for fname, meta in annot.items():
        fpath = os.path.join(SAMPLES_DIR, fname)
        if os.path.exists(fpath):
            img = cv2.imread(fpath)
            if img is not None:
                thumb = cv2.resize(img, (160, 120))
                _, buf = cv2.imencode(".jpg", thumb)
                thumb_b64 = base64.b64encode(buf).decode("utf-8")
                samples.append({
                    "id": fname,
                    "filename": fname,
                    "title": meta.get("title", fname),
                    "known_defects_count": len(meta.get("defects", [])),
                    "thumbnail": f"data:image/jpeg;base64,{thumb_b64}"
                })
    return {"samples": samples}

@app.get("/api/sample/{sample_name}")
def get_sample_image(sample_name: str):
    """Loads a sample image directly and returns it as base64."""
    fpath = os.path.join(SAMPLES_DIR, sample_name)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Sample image not found")

    img = cv2.imread(fpath)
    if img is None:
        raise HTTPException(status_code=500, detail="Failed to load sample image")

    _, buf = cv2.imencode(".jpg", img)
    b64 = base64.b64encode(buf).decode("utf-8")
    return {
        "filename": sample_name,
        "image_data": f"data:image/jpeg;base64,{b64}"
    }

@app.get("/api/evaluate")
def evaluate_algorithm(
    contrast_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    edge_sensitivity: float = Query(1.0, ge=0.2, le=3.0),
    min_area: int = Query(50, ge=10, le=2000),
    iou_thresh: float = Query(0.20, ge=0.1, le=0.9)
):
    """Runs benchmark evaluation across all ground-truth sample metal sheets."""
    detector = MetalSheetDefectDetector(
        min_defect_area=min_area,
        contrast_sensitivity=contrast_sensitivity,
        edge_sensitivity=edge_sensitivity
    )
    result = run_evaluation(detector, SAMPLES_DIR, iou_threshold=iou_thresh)
    return result
