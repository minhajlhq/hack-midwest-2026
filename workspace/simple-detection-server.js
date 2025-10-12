#!/usr/bin/env node
/**
 * Simple Express server for YOLOv8 object detection
 * Run with: node simple-detection-server.js
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Recyclable database
const RECYCLABLE_DATABASE = {
  'bottle': { recyclable: true, material: 'Plastic (PET/HDPE)', specificType: 'Beverage Bottle', sbcReward: 0.15, category: 'Plastic Container', size: 'Small-Medium', weight: 'Light' },
  'cup': { recyclable: true, material: 'Plastic/Paper', specificType: 'Disposable Cup', sbcReward: 0.08, category: 'Container', size: 'Small', weight: 'Light' },
  'wine glass': { recyclable: true, material: 'Glass', specificType: 'Drinking Glass', sbcReward: 0.12, category: 'Glass Container', size: 'Small', weight: 'Light' },
  'fork': { recyclable: false, material: 'Metal/Plastic', specificType: 'Fork Utensil', sbcReward: 0, category: 'Utensil', size: 'Small' },
  'knife': { recyclable: false, material: 'Metal/Plastic', specificType: 'Knife Utensil', sbcReward: 0, category: 'Utensil', size: 'Small' },
  'spoon': { recyclable: false, material: 'Metal/Plastic', specificType: 'Spoon Utensil', sbcReward: 0, category: 'Utensil', size: 'Small' },
  'cell phone': { recyclable: true, material: 'E-Waste (Metal/Plastic/Battery)', specificType: 'Mobile Phone', sbcReward: 1.0, category: 'Electronics', size: 'Small', specialHandling: 'Remove battery' },
  'laptop': { recyclable: true, material: 'E-Waste (Metal/Plastic/Circuit)', specificType: 'Laptop Computer', sbcReward: 1.5, category: 'Electronics', size: 'Medium', specialHandling: 'Contains precious metals' },
  'keyboard': { recyclable: true, material: 'E-Waste (Plastic/Circuit)', specificType: 'Computer Keyboard', sbcReward: 0.5, category: 'Electronics', size: 'Medium' },
  'mouse': { recyclable: true, material: 'E-Waste (Plastic/Circuit)', specificType: 'Computer Mouse', sbcReward: 0.3, category: 'Electronics', size: 'Small' },
  'tv': { recyclable: true, material: 'E-Waste (Glass/Metal/Plastic)', specificType: 'Television', sbcReward: 1.2, category: 'Electronics', size: 'Large', specialHandling: 'Special facility required' },
  'book': { recyclable: true, material: 'Paper', specificType: 'Bound Paper', sbcReward: 0.1, category: 'Paper Products', size: 'Small-Medium' },
  'backpack': { recyclable: false, material: 'Mixed Fabric/Plastic', specificType: 'Backpack', sbcReward: 0, category: 'Non-Recyclable', size: 'Large', specialHandling: 'Donate if usable' },
  'handbag': { recyclable: false, material: 'Mixed Fabric/Leather', specificType: 'Handbag', sbcReward: 0, category: 'Non-Recyclable', size: 'Medium', specialHandling: 'Donate if usable' },
};

// Map YOLO class names
const YOLO_MAPPING = {
  'bottle': 'bottle',
  'cup': 'cup',
  'wine glass': 'wine glass',
  'fork': 'fork',
  'knife': 'knife',
  'spoon': 'spoon',
  'bowl': 'cup',
  'cell phone': 'cell phone',
  'laptop': 'laptop',
  'mouse': 'mouse',
  'keyboard': 'keyboard',
  'book': 'book',
  'tv': 'tv',
  'backpack': 'backpack',
  'handbag': 'handbag',
};

// Run Python detection
function runPythonDetection(imageData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'apps', 'api', 'src', 'scripts', 'detect_yolo.py');
    const python = spawn('python3', [scriptPath]);
    
    let stdout = '';
    let stderr = '';

    python.stdin.write(JSON.stringify({ image: imageData }));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python error:', stderr);
        reject(new Error(`Python script failed: ${code}`));
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        
        if (!result.success) {
          reject(new Error(result.error || 'Detection failed'));
          return;
        }

        resolve(result.detections || []);
      } catch (error) {
        reject(new Error('Failed to parse detection results'));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to start Python: ${error.message}`));
    });
  });
}

// Map detection to recyclable info
function mapToRecyclableInfo(detectedObject, confidence, bbox) {
  const normalized = detectedObject.toLowerCase().trim();
  const mapped = YOLO_MAPPING[normalized] || normalized;
  const info = RECYCLABLE_DATABASE[mapped] || {
    recyclable: false,
    material: 'Unknown Material',
    specificType: 'Unidentified Object',
    sbcReward: 0,
    category: 'Unknown',
    size: 'Unknown',
    specialHandling: 'Consult local recycling guidelines'
  };

  return {
    object: mapped,
    confidence,
    recyclable: info.recyclable,
    material: info.material,
    specificType: info.specificType,
    sbcReward: info.sbcReward,
    category: info.category,
    size: info.size,
    weight: info.weight,
    specialHandling: info.specialHandling,
    bbox
  };
}

// API endpoint
app.post('/api/detect', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'Image data required' });
    }

    console.log('Processing detection request...');
    const detections = await runPythonDetection(image);

    const mappedDetections = detections.map(det =>
      mapToRecyclableInfo(det.object, det.confidence, det.bbox)
    );

    console.log(`✅ Detected: ${mappedDetections.map(d => d.object).join(', ')}`);

    res.json({
      success: true,
      detections: mappedDetections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detections: []
    });
  }
});

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Trash2Cash Detection API', status: 'running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Trash2Cash Detection API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/detect\n`);
});


