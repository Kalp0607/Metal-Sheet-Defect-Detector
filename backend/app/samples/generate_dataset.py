import cv2
import numpy as np
import json
import os

def create_metal_base(w=800, h=600, base_val=170, brushed=True, grain_dir='horizontal', lighting_gradient=True):
    # Base metallic gray
    img = np.full((h, w), base_val, dtype=np.float32)
    
    # Add brushed texture
    if brushed:
        if grain_dir == 'horizontal':
            noise = np.random.normal(0, 12, (h, 1)).astype(np.float32)
            grain = np.repeat(noise, w, axis=1)
            # Add subtle high-frequency variation
            hf = np.random.normal(0, 4, (h, w)).astype(np.float32)
            grain += hf
        else:
            noise = np.random.normal(0, 12, (1, w)).astype(np.float32)
            grain = np.repeat(noise, h, axis=0)
            hf = np.random.normal(0, 4, (h, w)).astype(np.float32)
            grain += hf
        img += grain

    # Add realistic non-uniform illumination gradient (e.g. overhead inspection lamp / specular reflection)
    if lighting_gradient:
        X, Y = np.meshgrid(np.linspace(-1, 1, w), np.linspace(-1, 1, h))
        # Vignetting and radial lamp highlight
        highlight = 35 * np.exp(-(X**2 + Y**2) / 0.8)
        gradient = 20 * (X * 0.4 + Y * 0.3)
        img += highlight + gradient

    # Add realistic sensor Gaussian noise
    sensor_noise = np.random.normal(0, 3, (h, w)).astype(np.float32)
    img += sensor_noise

    img = np.clip(img, 15, 245).astype(np.uint8)
    # Convert to 3-channel BGR
    bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    # Give slight cold metallic steel blue/gray tint
    bgr[:, :, 0] = np.clip(bgr[:, :, 0].astype(int) + 4, 0, 255)
    bgr[:, :, 2] = np.clip(bgr[:, :, 2].astype(int) - 2, 0, 255)
    return bgr

def generate_samples(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    annotations = {}

    # 1. Scratches
    img1 = create_metal_base(800, 600, base_val=165, brushed=True, grain_dir='horizontal')
    gt1 = []
    # Scratch 1: diagonal deep bright/dark scratch
    pts1 = [(150, 120), (280, 260), (340, 310)]
    for i in range(len(pts1)-1):
        cv2.line(img1, pts1[i], pts1[i+1], (60, 60, 60), 3, cv2.LINE_AA)
        cv2.line(img1, (pts1[i][0]+1, pts1[i][1]+1), (pts1[i+1][0]+1, pts1[i+1][1]+1), (240, 240, 240), 1, cv2.LINE_AA)
    gt1.append({"id": "defect_1", "type": "Scratch", "bbox": [145, 115, 200, 200], "severity": "High"})

    # Scratch 2: fine elongated horizontal scrape
    cv2.line(img1, (450, 420), (710, 435), (45, 45, 45), 2, cv2.LINE_AA)
    cv2.line(img1, (450, 422), (710, 437), (230, 230, 230), 1, cv2.LINE_AA)
    gt1.append({"id": "defect_2", "type": "Scratch", "bbox": [445, 415, 270, 26], "severity": "Medium"})

    cv2.imwrite(os.path.join(output_dir, "scratches.jpg"), img1)
    annotations["scratches.jpg"] = {"title": "Surface Scratches", "defects": gt1}

    # 2. Cracks
    img2 = create_metal_base(800, 600, base_val=155, brushed=True, grain_dir='vertical')
    gt2 = []
    # Crack 1: jagged stress crack
    crack_pts = [(200, 180), (235, 220), (225, 260), (260, 310), (275, 360), (265, 410)]
    for i in range(len(crack_pts)-1):
        cv2.line(img2, crack_pts[i], crack_pts[i+1], (30, 30, 30), 3, cv2.LINE_AA)
    # Side branch
    cv2.line(img2, (235, 220), (270, 235), (35, 35, 35), 2, cv2.LINE_AA)
    gt2.append({"id": "defect_1", "type": "Crack", "bbox": [195, 175, 85, 240], "severity": "Severe"})

    # Crack 2: hairline edge fracture
    crack2_pts = [(550, 100), (580, 140), (570, 190), (610, 240)]
    for i in range(len(crack2_pts)-1):
        cv2.line(img2, crack2_pts[i], crack2_pts[i+1], (40, 40, 40), 2, cv2.LINE_AA)
    gt2.append({"id": "defect_2", "type": "Crack", "bbox": [545, 95, 70, 150], "severity": "Severe"})

    cv2.imwrite(os.path.join(output_dir, "cracks.jpg"), img2)
    annotations["cracks.jpg"] = {"title": "Stress & Fracture Cracks", "defects": gt2}

    # 3. Pitted Holes
    img3 = create_metal_base(800, 600, base_val=175, brushed=False)
    gt3 = []
    # Pits cluster 1
    pits = [(220, 200, 14), (245, 215, 8), (210, 230, 10), (230, 245, 12)]
    for x, y, r in pits:
        cv2.circle(img3, (x, y), r, (35, 35, 35), -1, cv2.LINE_AA)
        cv2.circle(img3, (x+1, y+1), r//2, (20, 20, 20), -1, cv2.LINE_AA)
        cv2.circle(img3, (x-1, y-1), r+1, (220, 220, 220), 1, cv2.LINE_AA)
    gt3.append({"id": "defect_1", "type": "Pitting/Pore", "bbox": [195, 185, 65, 75], "severity": "Medium"})

    # Pit 2: isolated deep oxidation cavity
    cv2.circle(img3, (560, 380), 18, (30, 30, 30), -1, cv2.LINE_AA)
    cv2.circle(img3, (560, 380), 9, (15, 15, 15), -1, cv2.LINE_AA)
    cv2.circle(img3, (559, 379), 19, (215, 215, 215), 1, cv2.LINE_AA)
    gt3.append({"id": "defect_2", "type": "Pitting/Pore", "bbox": [540, 360, 40, 40], "severity": "High"})

    cv2.imwrite(os.path.join(output_dir, "pitted_holes.jpg"), img3)
    annotations["pitted_holes.jpg"] = {"title": "Chemical Pitting & Cavities", "defects": gt3}

    # 4. Roll Marks
    img4 = create_metal_base(800, 600, base_val=160, brushed=True, grain_dir='horizontal')
    gt4 = []
    # Roll mark 1: mechanical indentation band
    for i in range(3):
        cx, cy = 250 + i*160, 300
        cv2.ellipse(img4, (cx, cy), (35, 18), 15, 0, 360, (70, 70, 70), -1, cv2.LINE_AA)
        cv2.ellipse(img4, (cx, cy), (32, 15), 15, 0, 360, (55, 55, 55), 2, cv2.LINE_AA)
        cv2.ellipse(img4, (cx-1, cy-1), (36, 19), 15, 0, 180, (225, 225, 225), 1, cv2.LINE_AA)
        gt4.append({"id": f"defect_{i+1}", "type": "Roll Mark", "bbox": [cx-40, cy-25, 80, 50], "severity": "Medium"})

    cv2.imwrite(os.path.join(output_dir, "roll_marks.jpg"), img4)
    annotations["roll_marks.jpg"] = {"title": "Periodic Roll Marks", "defects": gt4}

    # 5. Inclusions
    img5 = create_metal_base(800, 600, base_val=170, brushed=True)
    gt5 = []
    # Inclusion 1: slag / oxide cluster
    pts_inc = np.array([[380, 160], [420, 150], [450, 180], [430, 220], [390, 210]], np.int32)
    cv2.fillPoly(img5, [pts_inc], (40, 42, 45), cv2.LINE_AA)
    cv2.polylines(img5, [pts_inc], True, (25, 25, 25), 2, cv2.LINE_AA)
    gt5.append({"id": "defect_1", "type": "Inclusion", "bbox": [375, 145, 80, 80], "severity": "High"})

    # Inclusion 2: dark spot
    pts_inc2 = np.array([[180, 400], [215, 390], [230, 425], [195, 435]], np.int32)
    cv2.fillPoly(img5, [pts_inc2], (45, 45, 50), cv2.LINE_AA)
    gt5.append({"id": "defect_2", "type": "Inclusion", "bbox": [175, 385, 60, 55], "severity": "Medium"})

    cv2.imwrite(os.path.join(output_dir, "inclusions.jpg"), img5)
    annotations["inclusions.jpg"] = {"title": "Slag Inclusions & Patches", "defects": gt5}

    # 6. Clean Sheet (Defect Free - benchmark for false positives)
    img6 = create_metal_base(800, 600, base_val=168, brushed=True, grain_dir='horizontal', lighting_gradient=True)
    cv2.imwrite(os.path.join(output_dir, "clean_sheet.jpg"), img6)
    annotations["clean_sheet.jpg"] = {"title": "Pristine Metal Sheet (Clean)", "defects": []}

    # Save annotations JSON
    with open(os.path.join(output_dir, "annotations.json"), "w") as f:
        json.dump(annotations, f, indent=2)

    print(f"Sample images and annotations created successfully in {output_dir}")

if __name__ == "__main__":
    generate_samples("backend/app/samples")
