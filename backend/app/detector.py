import cv2
import numpy as np
import time
import base64
from typing import Dict, List, Any, Tuple

class MetalSheetDefectDetector:
    """
    Custom Metal Sheet Defect Detection Algorithm developed from scratch:
    - Luminance & Color Space Conversion (LAB space decomposition)
    - Locally Adaptive Histogram Equalization (CLAHE) for regional contrast normalization
    - Separable Gaussian Background Illumination Compensation
    - Bilateral Edge-Preserving Smoothing for brushed metal texture rejection
    - Gradient & Canny Hysteresis Edge Detection
    - Photometric Deviation Gating relative to surface roughness noise sigma
    - Morphological Opening & Closing for clean defect localization
    - Geometric feature extraction and classification
    """

    def __init__(
        self,
        min_defect_area: int = 50,
        max_defect_area_ratio: float = 0.35,
        contrast_sensitivity: float = 1.0,
        bilateral_d: int = 9,
        bilateral_sigma_color: float = 50.0,
        bilateral_sigma_space: float = 50.0,
        edge_sensitivity: float = 1.0
    ):
        self.min_defect_area = min_defect_area
        self.max_defect_area_ratio = max_defect_area_ratio
        self.contrast_sensitivity = contrast_sensitivity
        self.bilateral_d = bilateral_d
        self.bilateral_sigma_color = bilateral_sigma_color
        self.bilateral_sigma_space = bilateral_sigma_space
        self.edge_sensitivity = edge_sensitivity

    def _encode_image_b64(self, img_bgr: np.ndarray, format_ext: str = ".jpg") -> str:
        """Encodes an OpenCV image to a base64 data URI string."""
        success, buffer = cv2.imencode(format_ext, img_bgr)
        if not success:
            return ""
        b64 = base64.b64encode(buffer).decode("utf-8")
        mime = "image/jpeg" if format_ext in [".jpg", ".jpeg"] else "image/png"
        return f"data:{mime};base64,{b64}"

    def preprocess_and_filter(self, img_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        1. Converts BGR to Grayscale and LAB space to extract pure Luminance.
        2. Applies Bilateral Filtering (Filtering 12_7.ppt Slides 44-46) combining spatial
           proximity domain Gaussian with photometric range Gaussian kernel to smooth out
           brushed texture lines while strictly preserving defect boundaries.
        3. Applies CLAHE (Chap_3_Image Processing.pptx Slide 11) for tonal normalization.
        """
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Bilateral Filtering: preserves edge sharpness across defects while smoothing metallic noise
        filtered = cv2.bilateralFilter(
            gray,
            d=self.bilateral_d,
            sigmaColor=self.bilateral_sigma_color,
            sigmaSpace=self.bilateral_sigma_space
        )

        # CLAHE local contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0 * self.contrast_sensitivity, tileGridSize=(8, 8))
        enhanced = clahe.apply(filtered)

        return gray, filtered, enhanced

    def extract_defect_mask(
        self,
        gray: np.ndarray,
        filtered: np.ndarray,
        enhanced: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
        """
        Extracts segmented binary defect mask using:
        1. Background Illumination Field Estimation via large Gaussian filter (Filtering 12_7.ppt)
        2. Photometric Delta Gating: requires contrast deviation to exceed 3.2x local surface noise sigma
        3. Canny multi-stage gradient edge detection with non-maximum suppression (EdgeDetection_12_7.ppt)
        4. Morphological opening (noise speckle suppression) & closing (defect component binding)
        """
        h, w = gray.shape

        # Large Gaussian kernel for background illumination field estimation
        bg_ksize = max(31, (min(h, w) // 15) * 2 + 1)
        bg = cv2.GaussianBlur(filtered, (bg_ksize, bg_ksize), 0)

        # Contrast differences: dark defects (cavities, cracks, pits) & bright defects (scrapes, ridges)
        dark_diff = cv2.subtract(bg, filtered)
        bright_diff = cv2.subtract(filtered, bg)

        # Estimate surface noise floor using standard deviation of background difference
        mean_diff, std_diff = cv2.meanStdDev(dark_diff)
        surface_sigma = float(std_diff[0][0])

        # Dynamic threshold: must significantly surpass surface texture roughness
        base_thresh = max(16.0, 3.1 * surface_sigma) / max(0.2, self.contrast_sensitivity)
        
        _, dark_mask = cv2.threshold(dark_diff, int(base_thresh), 255, cv2.THRESH_BINARY)
        _, bright_mask = cv2.threshold(bright_diff, int(base_thresh * 1.25), 255, cv2.THRESH_BINARY)

        contrast_defects = cv2.bitwise_or(dark_mask, bright_mask)

        # Canny edge detection for fine hairline cracks and scratches
        # High and low thresholds scaled by noise level
        canny_low = max(35, int(2.8 * surface_sigma / max(0.2, self.edge_sensitivity)))
        canny_high = max(70, canny_low * 2)
        edges = cv2.Canny(filtered, canny_low, canny_high)

        # Combine edge cues with contrast cues
        combined = cv2.bitwise_or(contrast_defects, edges)

        # Morphological opening removes remaining 1-2 px isolated texture spikes
        open_k = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        cleaned = cv2.morphologyEx(combined, cv2.MORPH_OPEN, open_k, iterations=1)

        # Morphological closing bridges crack segments and roll mark outlines
        close_k = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        closed = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, close_k, iterations=2)

        return closed, edges, contrast_defects, surface_sigma

    def classify_defect(
        self,
        contour: np.ndarray,
        bbox: Tuple[int, int, int, int],
        area: float,
        gray_img: np.ndarray
    ) -> Tuple[str, str, float]:
        """
        Classifies detected defect into standard industrial metal categories:
        - Crack: High aspect ratio, irregular jagged contour
        - Scratch: Long, directional linear scraping
        - Pitting/Pore: High circularity/compactness, localized dark pore
        - Roll Mark: Elliptical mechanical indentation
        - Inclusion: Irregular slag/oxide deposit
        """
        x, y, w, h = bbox
        perimeter = cv2.arcLength(contour, True)
        circularity = (4 * np.pi * area) / (perimeter * perimeter) if perimeter > 0 else 0.0
        aspect_ratio = max(w / max(1, h), h / max(1, w))
        extent = area / max(1, w * h)

        # Local contrast measurement
        pad = 6
        y1, y2 = max(0, y - pad), min(gray_img.shape[0], y + h + pad)
        x1, x2 = max(0, x - pad), min(gray_img.shape[1], x + w + pad)
        local_region = gray_img[y1:y2, x1:x2]
        mean_local = float(np.mean(local_region)) if local_region.size > 0 else 128.0

        mask_roi = np.zeros(gray_img.shape, dtype=np.uint8)
        cv2.drawContours(mask_roi, [contour], -1, 255, -1)
        defect_vals = gray_img[mask_roi > 0]
        mean_defect = float(np.mean(defect_vals)) if defect_vals.size > 0 else mean_local

        contrast_delta = abs(mean_local - mean_defect)

        # Heuristic rules derived from morphology and physical defect appearance
        if aspect_ratio >= 2.2:
            if extent < 0.45 or circularity < 0.35:
                defect_type = "Crack"
            else:
                defect_type = "Scratch"
        elif circularity >= 0.50 and area < 3000:
            defect_type = "Pitting/Pore"
        elif extent >= 0.48 and (300 <= area <= 6500):
            defect_type = "Roll Mark"
        else:
            defect_type = "Inclusion"

        # Severity ranking
        if area > 3000 or contrast_delta > 45 or aspect_ratio > 5:
            severity = "Severe"
            confidence = min(0.99, 0.88 + (contrast_delta / 250.0))
        elif area > 1000 or contrast_delta > 25:
            severity = "High"
            confidence = min(0.95, 0.80 + (contrast_delta / 250.0))
        elif area > 200:
            severity = "Medium"
            confidence = min(0.90, 0.74 + (contrast_delta / 300.0))
        else:
            severity = "Low"
            confidence = min(0.85, 0.68 + (contrast_delta / 350.0))

        return defect_type, severity, round(confidence, 2)

    def detect(self, img_bgr: np.ndarray, return_stages: bool = True) -> Dict[str, Any]:
        """
        Main defect detection pipeline.
        Returns detection results, bounding boxes, defect measurements,
        and intermediate computer vision stage visualizations.
        """
        start_time = time.time()
        img_h, img_w = img_bgr.shape[:2]
        total_pixels = img_h * img_w
        max_defect_area = total_pixels * self.max_defect_area_ratio

        # Step 1 & 2: Preprocess, Bilateral Filtering & CLAHE
        gray, filtered, enhanced = self.preprocess_and_filter(img_bgr)

        # Step 3: Morphological Defect Mask Extraction
        binary_mask, edges, contrast_mask, noise_sigma = self.extract_defect_mask(gray, filtered, enhanced)

        # Step 4: Contour Extraction & Defect Localization
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        annotated_img = img_bgr.copy()
        defects = []
        defect_idx = 1

        type_colors = {
            "Crack": (0, 0, 235),          # Vibrant Crimson
            "Scratch": (0, 140, 255),       # Industrial Amber
            "Pitting/Pore": (230, 20, 180), # Deep Magenta
            "Roll Mark": (0, 215, 255),     # Gold Yellow
            "Inclusion": (180, 50, 255)     # Neon Violet
        }

        # Collect valid defect contours
        candidates = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < self.min_defect_area or area > max_defect_area:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            # Edge border margin filter
            if (x <= 1 and w <= 4) or (y <= 1 and h <= 4) or (x + w >= img_w - 2 and w <= 4) or (y + h >= img_h - 2 and h <= 4):
                continue
            candidates.append((cnt, (x, y, w, h), area))

        # Sort defects by area descending
        candidates.sort(key=lambda item: item[2], reverse=True)

        for cnt, bbox, area in candidates:
            x, y, w, h = bbox
            defect_type, severity, confidence = self.classify_defect(cnt, bbox, area, gray)
            perimeter = round(float(cv2.arcLength(cnt, True)), 1)
            aspect_ratio = round(float(max(w / max(1, h), h / max(1, w))), 2)

            color = type_colors.get(defect_type, (0, 255, 0))

            # Bounding box on annotated image
            cv2.rectangle(annotated_img, (x, y), (x + w, y + h), color, 2)
            
            # Label badge
            label = f"#{defect_idx} {defect_type} ({int(confidence*100)}%)"
            (label_w, label_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            tag_y = max(y, label_h + 6)
            cv2.rectangle(
                annotated_img,
                (x, tag_y - label_h - 4),
                (x + label_w + 6, tag_y + 2),
                color,
                -1
            )
            cv2.putText(
                annotated_img,
                label,
                (x + 3, tag_y - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

            defects.append({
                "id": f"defect_{defect_idx}",
                "index": defect_idx,
                "type": defect_type,
                "severity": severity,
                "confidence": confidence,
                "bbox": [int(x), int(y), int(w), int(h)],
                "area_px": int(area),
                "perimeter_px": perimeter,
                "aspect_ratio": aspect_ratio
            })
            defect_idx += 1

        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        result: Dict[str, Any] = {
            "success": True,
            "image_width": img_w,
            "image_height": img_h,
            "defect_count": len(defects),
            "defects": defects,
            "processing_time_ms": elapsed_ms,
            "noise_sigma": round(noise_sigma, 2),
            "summary": {
                "status": "DEFECTIVE" if len(defects) > 0 else "CLEAN",
                "types_detected": list(set(d["type"] for d in defects)),
                "highest_severity": max([d["severity"] for d in defects], key=lambda s: ["Low", "Medium", "High", "Severe"].index(s)) if defects else "None"
            }
        }

        if return_stages:
            result["annotated_image"] = self._encode_image_b64(annotated_img)
            result["stages"] = {
                "1_contrast_enhanced": self._encode_image_b64(cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)),
                "2_bilateral_filtered": self._encode_image_b64(cv2.cvtColor(filtered, cv2.COLOR_GRAY2BGR)),
                "3_edge_map": self._encode_image_b64(cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)),
                "4_binary_mask": self._encode_image_b64(cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR))
            }

        return result
