# Metal Sheet Defect Detection System

A real-time metal sheet surface defect detection application built with a **FastAPI** backend and a **React.js** frontend. Defect localization is powered by a custom computer vision algorithm developed from scratch using classical image processing techniques without any pretrained deep learning models.

---

## Prerequisites

Before running the application, ensure you have the following installed:

- **Python 3.10+**
- **Node.js 18+** and **npm**

---

## Installation

### 1. Backend Dependencies

Open a terminal in the project root and install the required Python packages:

```bash
pip install fastapi uvicorn opencv-python numpy python-multipart
```

### 2. Frontend Dependencies

Navigate to the `frontend` directory and install the npm packages:

```bash
cd frontend
npm install
cd ..
```

---

## How to Run the Application

The application requires running both the backend and frontend servers simultaneously in two separate terminals.

### Terminal 1: Start the Backend (FastAPI)

From the project root folder:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

- **API Endpoint:** `http://127.0.0.1:8000`
- **Interactive API Docs (Swagger):** `http://127.0.0.1:8000/docs`

---

### Terminal 2: Start the Frontend (React + Vite)

From the `frontend` folder:

```bash
cd frontend
npm run dev
```

- **Web Application:** `http://localhost:5173`

---

## Using the Application

1. Open your web browser and navigate to **`http://localhost:5173`**.
2. **Single or Multiple Image Upload:**
   - Drag and drop one or more metal sheet images into the upload zone, or click to browse.
   - Or click **"Process All Samples Concurrently"** to immediately inspect all test benchmark sheets simultaneously.
3. **Inspect Detected Defects:**
   - View responsive SVG bounding boxes overlaying detected defects (cracks, scratches, pitting, roll marks, inclusions).
   - In the **Defect Manifest**, review measurements: area in pixels, aspect ratio, confidence score, and severity level.
   - Hover or click on any bounding box or list item to highlight it.
4. **Intermediate Pipeline Stages:**
   - Inspect the step-by-step computer vision transformations:
     - **Stage 1:** Luminance Extraction & CLAHE Contrast Normalization
     - **Stage 2:** Bilateral Edge-Preserving Filter (grain noise rejection)
     - **Stage 3:** Canny Gradient Magnitude & Derivatives
     - **Stage 4:** Morphological Defect Mask & Dynamic Noise Gating
5. **Tune Parameters:**
   - Adjust contrast sensitivity, edge sensitivity, and minimum defect area sliders in real time and click **"Re-analyze Surface"**.
6. **Benchmark Evaluation:**
   - Click **"Evaluation Metrics"** in the top navigation bar to view empirical performance metrics (Precision, Recall, F1 Score, and mean IoU).

---

## Stopping the Servers

To stop either server, press `Ctrl + C` in its respective terminal window.
