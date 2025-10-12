#!/usr/bin/env node
/**
 * Unified Express server for YOLOv8 detection + User authentication
 * Run with: node unified-server.js
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// In-memory storage (replace with real DB later)
const users = new Map();
const transactions = new Map();

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

// YOLO class mapping
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

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

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

// ============ USER ROUTES ============

// Create user (Sign up)
app.post('/api/users', (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    if (users.has(email)) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const userId = generateId();
    const user = {
      _id: userId,
      email,
      password: hashPassword(password),
      firstName,
      lastName,
      currentBalance: 0,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);
    
    console.log(`✅ User created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currentBalance: user.currentBalance,
        walletAddress: '',
        isActive: true
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Login
app.post('/api/users/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.get(email);
    
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currentBalance: user.currentBalance,
        walletAddress: '',
        isActive: true,
        lastLogin: new Date()
      },
      token: generateId() // Mock token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get user transactions
app.get('/api/users/:id/recycle-transactions', (req, res) => {
  try {
    const userId = req.params.id;
    const userTransactions = Array.from(transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(userTransactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// Create recycle transaction
app.post('/api/users/:id/recycle-transactions', (req, res) => {
  try {
    const userId = req.params.id;
    const { itemType, sbcEarned } = req.body;

    const transactionId = generateId();
    const transaction = {
      _id: transactionId,
      userId,
      itemType,
      sbcEarned,
      createdAt: new Date().toISOString()
    };

    transactions.set(transactionId, transaction);

    // Update user balance
    const user = Array.from(users.values()).find(u => u._id === userId);
    if (user) {
      user.currentBalance += sbcEarned;
    }

    console.log(`✅ Transaction created: ${itemType} +${sbcEarned} SBC`);

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

// ============ DETECTION ROUTES ============

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
  res.json({ 
    message: 'Trash2Cash Unified API', 
    status: 'running',
    users: users.size,
    transactions: transactions.size
  });
});

// SBC transfer endpoint (for simulator)
app.post('/api/payments/sbc/transfer', (req, res) => {
  res.json({ 
    success: true,
    message: 'Transfer simulated',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Trash2Cash Unified API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/users - Sign up`);
  console.log(`   POST /api/users/login - Login`);
  console.log(`   POST /api/detect - YOLOv8 detection`);
  console.log(`   GET  /api - Health check\n`);
});

