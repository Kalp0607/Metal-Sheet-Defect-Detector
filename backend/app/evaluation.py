import json
import os
import cv2
import numpy as np
from typing import Dict, List, Any
from .detector import MetalSheetDefectDetector

def calculate_iou(boxA: List[int], boxB: List[int]) -> float:
    """
    Computes Intersection over Union (IoU) between two bounding boxes
    box format: [x, y, w, h]
    """
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    inter_w = max(0, xB - xA)
    inter_h = max(0, yB - yA)
    inter_area = inter_w * inter_h

    areaA = boxA[2] * boxA[3]
    areaB = boxB[2] * boxB[3]
    union_area = areaA + areaB - inter_area

    if union_area <= 0:
        return 0.0
    return float(inter_area / union_area)

def run_evaluation(
    detector: MetalSheetDefectDetector,
    samples_dir: str,
    iou_threshold: float = 0.25
) -> Dict[str, Any]:
    """
    Runs full benchmark evaluation of the detector against ground-truth annotated samples.
    Computes Precision, Recall, F1 score, mean IoU, and average latency.
    """
    annot_file = os.path.join(samples_dir, "annotations.json")
    if not os.path.exists(annot_file):
        return {
            "success": False,
            "error": f"Annotations file not found at {annot_file}"
        }

    with open(annot_file, "r") as f:
        annotations = json.load(f)

    total_tp = 0
    total_fp = 0
    total_fn = 0
    ious = []
    latencies = []
    sample_reports = []

    for img_name, meta in annotations.items():
        img_path = os.path.join(samples_dir, img_name)
        if not os.path.exists(img_path):
            continue

        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            continue

        res = detector.detect(img_bgr, return_stages=False)
        latencies.append(res["processing_time_ms"])

        pred_boxes = [d["bbox"] for d in res["defects"]]
        gt_boxes = [g["bbox"] for g in meta.get("defects", [])]

        matched_gt = set()
        matched_pred = set()
        img_ious = []

        for p_idx, p_box in enumerate(pred_boxes):
            best_iou = 0.0
            best_gt_idx = -1
            for g_idx, g_box in enumerate(gt_boxes):
                if g_idx in matched_gt:
                    continue
                iou = calculate_iou(p_box, g_box)
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            if best_iou >= iou_threshold and best_gt_idx != -1:
                matched_gt.add(best_gt_idx)
                matched_pred.add(p_idx)
                img_ious.append(best_iou)
                ious.append(best_iou)

        tp = len(matched_pred)
        fp = len(pred_boxes) - tp
        fn = len(gt_boxes) - len(matched_gt)

        total_tp += tp
        total_fp += fp
        total_fn += fn

        sample_reports.append({
            "image": img_name,
            "title": meta.get("title", img_name),
            "ground_truth_count": len(gt_boxes),
            "detected_count": len(pred_boxes),
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "mean_sample_iou": round(float(np.mean(img_ious)), 3) if img_ious else 0.0,
            "latency_ms": res["processing_time_ms"]
        })

    precision = total_tp / max(1, (total_tp + total_fp))
    recall = total_tp / max(1, (total_tp + total_fn))
    f1 = (2 * precision * recall) / max(1e-6, (precision + recall))
    mean_iou = float(np.mean(ious)) if ious else 0.0
    avg_latency = float(np.mean(latencies)) if latencies else 0.0

    return {
        "success": True,
        "metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "mean_iou": round(mean_iou, 4),
            "total_ground_truth": total_tp + total_fn,
            "total_detections": total_tp + total_fp,
            "true_positives": total_tp,
            "false_positives": total_fp,
            "false_negatives": total_fn,
            "average_latency_ms": round(avg_latency, 2)
        },
        "sample_breakdown": sample_reports
    }
