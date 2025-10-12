# 🚀 Recycling Scanner with YOLOv8 - Setup Guide

## Overview

This system uses YOLOv8 to detect recyclable objects in real-time from Ring camera footage or uploaded images, calculating SBC token rewards based on the detected items.

## ✅ What's Been Implemented

### Frontend (`apps/web-app/src/app/RecyclingScanner.tsx`)

- ✅ Image upload functionality
- ✅ Webcam capture support
- ✅ Real-time object detection display
- ✅ SBC reward calculation UI
- ✅ Ring camera integration instructions
- ✅ Responsive design with professional styling

### Backend (`apps/api/src/app/detection/`)

- ✅ Detection API endpoint at `/api/detect`
- ✅ Recyclability classification system (20+ materials)
- ✅ SBC reward calculation logic
- ✅ Mock detection for testing (ready for YOLOv8 integration)

### Routes

- **http://localhost:4200** - Homepage
- **http://localhost:4200/scanner** - AI Recycling Scanner
- **http://localhost:4200/sbc-agent-sim** - Payment Simulator

## 🎯 Current Functionality

### Recyclable Items Database

The system recognizes and rewards:

| Item        | Material      | SBC Reward | Category    |
| ----------- | ------------- | ---------- | ----------- |
| Bottle      | Plastic/Glass | 5          | Container   |
| Can         | Aluminum      | 8          | Container   |
| Laptop      | E-Waste       | 50         | Electronics |
| Cell Phone  | E-Waste       | 30         | Electronics |
| Keyboard    | E-Waste       | 15         | Electronics |
| Book        | Paper         | 3          | Paper       |
| Cardboard   | Cardboard     | 4          | Paper       |
| And more... |               |            |             |

## 📹 Ring Camera Integration

### Current Method (Screenshot Based)

1. Open your Ring dashboard in Safari
2. View live footage from your Ring camera
3. When someone places recyclable items in front of the camera:
   - Take a screenshot (⌘+Shift+4 on Mac)
   - Upload to the Scanner page
   - Get instant detection results

### Future Enhancement (API Integration)

To enable true real-time Ring camera integration, you'll need:

1. **Ring API Access**

   ```bash
   npm install ring-client-api
   ```

2. **Update `detection.service.ts`:**

   ```typescript
   import { RingApi } from 'ring-client-api';

   async fetchRingSnapshot(cameraId: string) {
     const ringApi = new RingApi({
       refreshToken: process.env.RING_REFRESH_TOKEN
     });

     const locations = await ringApi.getLocations();
     const cameras = await locations[0].cameras;
     const camera = cameras.find(c => c.id === cameraId);

     const snapshot = await camera.getSnapshot();
     return snapshot.toString('base64');
   }
   ```

3. **Add to `.env`:**
   ```
   RING_REFRESH_TOKEN=your_ring_token_here
   ```

## 🤖 YOLOv8 Integration Options

### Option 1: Python FastAPI Service (Recommended)

**Why?** Best performance, mature YOLOv8 implementation

1. **Create Python service:**

   ```python
   # services/yolo-api/app.py
   from fastapi import FastAPI, File, UploadFile
   from ultralytics import YOLO
   import base64
   from PIL import Image
   import io

   app = FastAPI()
   model = YOLO('yolov8n.pt')  # or yolov8s/m/l/x for more accuracy

   @app.post("/detect")
   async def detect_objects(image: str):
       # Decode base64 image
       img_data = base64.b64decode(image.split(',')[1])
       img = Image.open(io.BytesIO(img_data))

       # Run YOLOv8 detection
       results = model(img)

       detections = []
       for r in results:
           boxes = r.boxes
           for box in boxes:
               detections.append({
                   'object': r.names[int(box.cls)],
                   'confidence': float(box.conf),
                   'bbox': {
                       'x': float(box.xyxy[0][0]),
                       'y': float(box.xyxy[0][1]),
                       'width': float(box.xyxy[0][2] - box.xyxy[0][0]),
                       'height': float(box.xyxy[0][3] - box.xyxy[0][1])
                   }
               })

       return {'detections': detections}
   ```

2. **Install dependencies:**

   ```bash
   pip install fastapi uvicorn ultralytics pillow
   ```

3. **Run the service:**

   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

4. **Update NestJS to call Python API:**

   ```typescript
   // detection.service.ts
   async detectWithYOLO(imageData: string): Promise<DetectionResult[]> {
     const response = await fetch('http://localhost:8000/detect', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ image: imageData })
     });

     const data = await response.json();

     return data.detections.map(d => this.mapToRecyclableInfo(
       d.object,
       d.confidence,
       d.bbox
     ));
   }
   ```

### Option 2: ONNX Runtime for Node.js

**Why?** Run YOLOv8 directly in Node.js without Python

1. **Install:**

   ```bash
   npm install onnxruntime-node sharp
   ```

2. **Export YOLOv8 to ONNX:**

   ```python
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   model.export(format='onnx')
   ```

3. **Implement in NestJS:**

   ```typescript
   import * as ort from 'onnxruntime-node';
   import * as sharp from 'sharp';

   async detectWithYOLO(imageData: string) {
     const session = await ort.InferenceSession.create('./models/yolov8n.onnx');

     // Preprocess image
     const buffer = Buffer.from(imageData.split(',')[1], 'base64');
     const preprocessed = await this.preprocessImage(buffer);

     // Run inference
     const feeds = { images: new ort.Tensor('float32', preprocessed, [1, 3, 640, 640]) };
     const results = await session.run(feeds);

     return this.postprocessResults(results);
   }
   ```

### Option 3: TensorFlow.js (Browser-based)

**Why?** Run on client-side, no backend needed

1. **Convert YOLOv8 to TF.js format**
2. **Load in React component**
3. **Process entirely in browser**

## 🚀 Quick Start

### 1. Start the Backend API

```bash
cd /Users/talhanaseer/hack-midwest-2026/workspace
eval "$(fnm env --use-on-cd)"
fnm use 22
npx nx serve api
```

Backend will run at **http://localhost:3000**

### 2. Start the Frontend

In a new terminal:

```bash
cd /Users/talhanaseer/hack-midwest-2026/workspace
eval "$(fnm env --use-on-cd)"
fnm use 22
npx nx serve web-app
```

Frontend will run at **http://localhost:4200**

### 3. Test the Scanner

1. Navigate to **http://localhost:4200/scanner**
2. Upload an image or use webcam
3. See detected objects and SBC rewards

## 📊 API Endpoints

### `POST /api/detect`

Detect objects in an image

**Request:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "ringCameraId": "optional-camera-id"
}
```

**Response:**

```json
{
  "success": true,
  "detections": [
    {
      "object": "bottle",
      "confidence": 0.92,
      "recyclable": true,
      "material": "Plastic/Glass",
      "sbcReward": 5,
      "category": "Container",
      "bbox": { "x": 100, "y": 150, "width": 80, "height": 120 }
    }
  ],
  "timestamp": "2025-10-11T18:30:00.000Z"
}
```

### `POST /api/detect/ring-snapshot`

Detect objects from Ring camera snapshot

**Request:**

```json
{
  "imageUrl": "https://ring-url/snapshot.jpg",
  "cameraId": "camera-123"
}
```

## 🎨 Customization

### Add More Recyclable Items

Edit `apps/api/src/app/detection/detection.service.ts`:

```typescript
const RECYCLABLE_DATABASE = {
  'new-item': {
    recyclable: true,
    material: 'Material Type',
    sbcReward: 10,
    category: 'Category',
  },
  // ...
};
```

### Adjust SBC Rewards

Modify the `sbcReward` values in the database

### Change Detection Threshold

In your YOLOv8 implementation, adjust confidence threshold:

```python
results = model(img, conf=0.5)  # Only show detections >50% confidence
```

## 🔧 Troubleshooting

### "Failed to process image" error

- Check if backend API is running on port 3000
- Check browser console for CORS errors
- Verify image data is properly formatted base64

### Mock data always showing

- Backend is working but YOLOv8 not integrated yet
- This is expected - follow YOLOv8 integration steps above

### Webcam not working

- Grant camera permissions in browser
- Try uploading an image instead
- Check browser compatibility (HTTPS required for webcam in production)

## 📈 Next Steps

1. **Integrate Actual YOLOv8** (see options above)
2. **Connect to Ring API** for live camera feeds
3. **Add Database** to track detection history
4. **Implement Actual Payments** - integrate with Solana for real SBC transfers
5. **Train Custom Model** on recycling-specific dataset for better accuracy
6. **Add User Authentication** for tracking rewards per user

## 🎓 Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [Ring API Documentation](https://github.com/dgreif/ring)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [ONNX Runtime](https://onnxruntime.ai/)

## 💡 Tips for Best Results

1. **Good Lighting** - Ensure items are well-lit for better detection
2. **Clean Background** - Plain backgrounds improve accuracy
3. **Clear View** - Make sure items are fully visible, not obscured
4. **Right Distance** - Items should fill a good portion of the frame
5. **One Item at a Time** - Better accuracy when detecting individual items

---

Built with ❤️ for Trash2Cash - Turn Trash to Cash in Real-Time! ♻️

