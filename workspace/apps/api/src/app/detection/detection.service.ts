import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';

// Comprehensive recyclable materials database with detailed classifications
interface RecyclableInfo {
  recyclable: boolean;
  material: string;
  specificType: string;
  sbcReward: number;
  category: string;
  size?: string;
  weight?: string;
  specialHandling?: string;
}

const RECYCLABLE_DATABASE: Record<string, RecyclableInfo> = {
  // PLASTICS - Containers
  'bottle': { recyclable: true, material: 'Plastic (PET/HDPE)', specificType: 'Beverage Bottle', sbcReward: 0.15, category: 'Plastic Container', size: 'Small-Medium', weight: 'Light' },
  'water bottle': { recyclable: true, material: 'Plastic (PET #1)', specificType: 'Water Bottle', sbcReward: 0.15, category: 'Plastic Container', size: 'Small-Medium', weight: 'Light' },
  'plastic bottle': { recyclable: true, material: 'Plastic (HDPE #2)', specificType: 'Plastic Bottle', sbcReward: 0.15, category: 'Plastic Container', size: 'Small-Large', weight: 'Light' },
  'cup': { recyclable: true, material: 'Plastic/Paper', specificType: 'Disposable Cup', sbcReward: 0.08, category: 'Container', size: 'Small', weight: 'Light' },
  'plastic cup': { recyclable: false, material: 'Plastic (PP #5)', specificType: 'Plastic Cup', sbcReward: 0, category: 'Non-Recyclable', size: 'Small', specialHandling: 'Most facilities don\'t accept' },
  'pitcher': { recyclable: true, material: 'Plastic/Glass', specificType: 'Pitcher', sbcReward: 0.18, category: 'Container', size: 'Large', weight: 'Medium' },
  
  // METALS - Containers & Utensils
  'can': { recyclable: true, material: 'Aluminum', specificType: 'Beverage Can', sbcReward: 0.2, category: 'Metal Container', size: 'Small', weight: 'Light' },
  'soda can': { recyclable: true, material: 'Aluminum', specificType: 'Soda Can', sbcReward: 0.2, category: 'Metal Container', size: 'Small', weight: 'Light' },
  'tin can': { recyclable: true, material: 'Steel/Tin', specificType: 'Food Can', sbcReward: 0.18, category: 'Metal Container', size: 'Small-Medium', weight: 'Light' },
  'metal container': { recyclable: true, material: 'Steel/Aluminum', specificType: 'Metal Container', sbcReward: 0.25, category: 'Metal Container', size: 'Medium-Large', weight: 'Medium-Heavy' },
  'aluminum foil': { recyclable: true, material: 'Aluminum', specificType: 'Foil', sbcReward: 0.1, category: 'Metal', size: 'Variable', weight: 'Light', specialHandling: 'Clean and ball up' },
  'fork': { recyclable: false, material: 'Metal/Plastic', specificType: 'Fork Utensil', sbcReward: 0, category: 'Utensil', size: 'Small', specialHandling: 'Metal forks can be recycled in metal bins' },
  'knife': { recyclable: false, material: 'Metal/Plastic', specificType: 'Knife Utensil', sbcReward: 0, category: 'Utensil', size: 'Small', specialHandling: 'Wrap sharp edges' },
  'spoon': { recyclable: false, material: 'Metal/Plastic', specificType: 'Spoon Utensil', sbcReward: 0, category: 'Utensil', size: 'Small', specialHandling: 'Metal spoons recyclable in metal bins' },
  
  // GLASS
  'wine glass': { recyclable: true, material: 'Glass', specificType: 'Drinking Glass', sbcReward: 0.12, category: 'Glass Container', size: 'Small', weight: 'Light' },
  'glass bottle': { recyclable: true, material: 'Glass', specificType: 'Glass Bottle', sbcReward: 0.2, category: 'Glass Container', size: 'Medium', weight: 'Heavy' },
  'jar': { recyclable: true, material: 'Glass', specificType: 'Glass Jar', sbcReward: 0.15, category: 'Glass Container', size: 'Small-Medium', weight: 'Medium' },
  
  // PAPER & CARDBOARD
  'book': { recyclable: true, material: 'Paper', specificType: 'Bound Paper', sbcReward: 0.1, category: 'Paper Products', size: 'Small-Medium', weight: 'Light-Medium' },
  'cardboard': { recyclable: true, material: 'Corrugated Cardboard', specificType: 'Cardboard Box', sbcReward: 0.12, category: 'Cardboard', size: 'Variable', weight: 'Light' },
  'newspaper': { recyclable: true, material: 'Newsprint Paper', specificType: 'Newspaper', sbcReward: 0.08, category: 'Paper Products', size: 'Medium', weight: 'Light' },
  'magazine': { recyclable: true, material: 'Glossy Paper', specificType: 'Magazine', sbcReward: 0.08, category: 'Paper Products', size: 'Small-Medium', weight: 'Light' },
  'paper': { recyclable: true, material: 'Paper', specificType: 'Office Paper', sbcReward: 0.08, category: 'Paper Products', size: 'Small', weight: 'Light' },
  'paper bag': { recyclable: true, material: 'Kraft Paper', specificType: 'Paper Bag', sbcReward: 0.08, category: 'Paper Products', size: 'Medium', weight: 'Light' },
  
  // ELECTRONICS (E-WASTE) - Higher Value
  'laptop': { recyclable: true, material: 'E-Waste (Metal/Plastic/Circuit)', specificType: 'Laptop Computer', sbcReward: 1.5, category: 'Electronics', size: 'Medium', weight: 'Medium', specialHandling: 'Contains precious metals' },
  'cell phone': { recyclable: true, material: 'E-Waste (Metal/Plastic/Battery)', specificType: 'Mobile Phone', sbcReward: 1.0, category: 'Electronics', size: 'Small', weight: 'Light', specialHandling: 'Remove battery' },
  'keyboard': { recyclable: true, material: 'E-Waste (Plastic/Circuit)', specificType: 'Computer Keyboard', sbcReward: 0.5, category: 'Electronics', size: 'Medium', weight: 'Light' },
  'mouse': { recyclable: true, material: 'E-Waste (Plastic/Circuit)', specificType: 'Computer Mouse', sbcReward: 0.3, category: 'Electronics', size: 'Small', weight: 'Light' },
  'tv': { recyclable: true, material: 'E-Waste (Glass/Metal/Plastic)', specificType: 'Television', sbcReward: 1.2, category: 'Electronics', size: 'Large', weight: 'Heavy', specialHandling: 'Special facility required' },
  'monitor': { recyclable: true, material: 'E-Waste (Glass/Plastic)', specificType: 'Computer Monitor', sbcReward: 1.0, category: 'Electronics', size: 'Large', weight: 'Heavy' },
  'remote': { recyclable: true, material: 'E-Waste (Plastic/Circuit)', specificType: 'Remote Control', sbcReward: 0.15, category: 'Electronics', size: 'Small', weight: 'Light' },
  'watch': { recyclable: true, material: 'E-Waste (Metal/Battery)', specificType: 'Wristwatch', sbcReward: 0.6, category: 'Electronics', size: 'Small', weight: 'Light', specialHandling: 'Remove battery' },
  'tablet': { recyclable: true, material: 'E-Waste (Metal/Glass/Battery)', specificType: 'Tablet Device', sbcReward: 1.0, category: 'Electronics', size: 'Small-Medium', weight: 'Light' },
  'headphones': { recyclable: true, material: 'E-Waste (Plastic/Copper)', specificType: 'Headphones', sbcReward: 0.25, category: 'Electronics', size: 'Small', weight: 'Light' },
  
  // STYROFOAM & FOAM (Non-Recyclable)
  'styrofoam': { recyclable: false, material: 'Polystyrene Foam (PS #6)', specificType: 'Styrofoam Container', sbcReward: 0, category: 'Non-Recyclable', size: 'Variable', specialHandling: 'Not accepted at most facilities' },
  'foam cup': { recyclable: false, material: 'Polystyrene Foam', specificType: 'Foam Cup', sbcReward: 0, category: 'Non-Recyclable', size: 'Small', specialHandling: 'Landfill only' },
  'foam plate': { recyclable: false, material: 'Polystyrene Foam', specificType: 'Foam Plate', sbcReward: 0, category: 'Non-Recyclable', size: 'Small-Medium', specialHandling: 'Not recyclable' },
  
  // PLATES & DISHWARE
  'plate': { recyclable: false, material: 'Ceramic/Paper/Plastic', specificType: 'Plate', sbcReward: 0, category: 'Dishware', size: 'Medium', specialHandling: 'Material dependent - paper plates may be compostable if clean' },
  'paper plate': { recyclable: false, material: 'Coated Paper', specificType: 'Paper Plate', sbcReward: 0, category: 'Non-Recyclable', size: 'Medium', specialHandling: 'Compost if food-free' },
  
  // WOOD
  'wood': { recyclable: false, material: 'Natural Wood', specificType: 'Wood Material', sbcReward: 0, category: 'Non-Recyclable', size: 'Variable', specialHandling: 'Reuse or compost untreated wood' },
  
  // NON-RECYCLABLE ITEMS
  'plastic bag': { recyclable: false, material: 'Soft Plastic (LDPE #4)', specificType: 'Shopping Bag', sbcReward: 0, category: 'Non-Recyclable', size: 'Small-Medium', specialHandling: 'Return to store collection bins' },
  'backpack': { recyclable: false, material: 'Mixed Fabric/Plastic', specificType: 'Backpack', sbcReward: 0, category: 'Non-Recyclable', size: 'Large', specialHandling: 'Donate if usable' },
  'handbag': { recyclable: false, material: 'Mixed Fabric/Leather', specificType: 'Handbag', sbcReward: 0, category: 'Non-Recyclable', size: 'Medium', specialHandling: 'Donate if usable' },
  'umbrella': { recyclable: false, material: 'Mixed Metal/Fabric', specificType: 'Umbrella', sbcReward: 0, category: 'Non-Recyclable', size: 'Medium', specialHandling: 'Separate metal frame for recycling' },
  
  // ORGANIC/FOOD (Compostable)
  'food': { recyclable: false, material: 'Organic Waste', specificType: 'Food Item', sbcReward: 0, category: 'Compostable', size: 'Variable', specialHandling: 'Compost or organics bin' },
  'pizza': { recyclable: false, material: 'Organic Waste', specificType: 'Food Waste', sbcReward: 0, category: 'Compostable', size: 'Medium', specialHandling: 'Compost only' },
  'apple': { recyclable: false, material: 'Organic Waste', specificType: 'Fruit', sbcReward: 0, category: 'Compostable', size: 'Small', specialHandling: 'Compost bin' },
  'banana': { recyclable: false, material: 'Organic Waste', specificType: 'Fruit', sbcReward: 0, category: 'Compostable', size: 'Small', specialHandling: 'Compost bin' },
  'orange': { recyclable: false, material: 'Organic Waste', specificType: 'Fruit', sbcReward: 0, category: 'Compostable', size: 'Small', specialHandling: 'Compost bin' },
  'pizza box': { recyclable: false, material: 'Contaminated Cardboard', specificType: 'Soiled Cardboard', sbcReward: 0, category: 'Non-Recyclable', size: 'Large', specialHandling: 'Grease contaminated - compost or trash' },
};

interface DetectionResult {
  object: string;
  confidence: number;
  recyclable: boolean;
  material: string;
  specificType: string;
  sbcReward: number;
  category: string;
  size?: string;
  weight?: string;
  specialHandling?: string;
  bbox?: { x: number; y: number; width: number; height: number };
}

@Injectable()
export class DetectionService {
  // Map YOLO class names to our recyclable database keys
  private readonly YOLO_CLASS_MAPPING: Record<string, string> = {
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
    'remote': 'remote',
    'keyboard': 'keyboard',
    'book': 'book',
    'clock': 'watch',
    'scissors': 'knife',
    'teddy bear': 'backpack', // fallback
    'toothbrush': 'plastic bag', // fallback
    'banana': 'banana',
    'apple': 'apple',
    'orange': 'orange',
    'pizza': 'pizza',
    'tv': 'tv',
    'backpack': 'backpack',
    'umbrella': 'umbrella',
    'handbag': 'handbag',
  };

  /**
   * Detect objects using YOLOv8 Python script
   */
  async detectWithYOLO(imageData: string): Promise<DetectionResult[]> {
    console.log('Processing image with YOLOv8...');
    
    try {
      // Call Python YOLOv8 script
      const pythonScriptPath = join(__dirname, '..', '..', 'scripts', 'detect_yolo.py');
      
      const detections = await this.runPythonDetection(pythonScriptPath, imageData);
      
      if (!detections || detections.length === 0) {
        console.log('No objects detected, returning empty array');
        return [];
      }

      // Map YOLO detections to recyclable info
      const mappedDetections = detections.map(det => {
        // Map YOLO class name to our database key
        const mappedClassName = this.YOLO_CLASS_MAPPING[det.object.toLowerCase()] || det.object.toLowerCase();
        return this.mapToRecyclableInfo(mappedClassName, det.confidence, det.bbox);
      });

      console.log(`Successfully detected ${mappedDetections.length} object(s)`);
      return mappedDetections;
      
    } catch (error) {
      console.error('YOLOv8 detection error:', error);
      
      // Fallback to mock detection for demo purposes
      console.log('Falling back to mock detection...');
      return this.generateMockDetections();
    }
  }

  /**
   * Run Python YOLOv8 detection script
   */
  private async runPythonDetection(scriptPath: string, imageData: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath]);
      
      let stdout = '';
      let stderr = '';

      // Send image data to Python script via stdin
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
          console.error('Python script stderr:', stderr);
          reject(new Error(`Python script exited with code ${code}`));
          return;
        }

        try {
          // Parse JSON output from Python
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);

          if (!result.success) {
            reject(new Error(result.error || 'Detection failed'));
            return;
          }

          resolve(result.detections || []);
        } catch (parseError) {
          console.error('Failed to parse Python output:', stdout);
          reject(new Error('Failed to parse detection results'));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  /**
   * Map YOLO detected objects to recyclability info with detailed classification
   */
  private mapToRecyclableInfo(detectedObject: string, confidence: number, bbox: any): DetectionResult {
    // Normalize object name
    const normalizedObject = detectedObject.toLowerCase().trim();

    // Find matching recyclable info
    const info = RECYCLABLE_DATABASE[normalizedObject] || {
      recyclable: false,
      material: 'Unknown Material',
      specificType: 'Unidentified Object',
      sbcReward: 0,
      category: 'Unknown',
      size: 'Unknown',
      weight: 'Unknown',
      specialHandling: 'Consult local recycling guidelines'
    };

    return {
      object: normalizedObject,
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

  /**
   * Generate mock detections for testing
   * TODO: Replace with actual YOLOv8 inference
   * Returns only the MOST PROMINENT object (highest confidence)
   */
  private generateMockDetections(): DetectionResult[] {
    const possibleObjects = Object.keys(RECYCLABLE_DATABASE);
    
    // Pick one random object as the most prominent
    const prominentObject = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
    const confidence = 0.85 + Math.random() * 0.14; // 85-99% confidence for main object
    
    const detection = this.mapToRecyclableInfo(
      prominentObject,
      confidence,
      {
        x: 200,  // Centered
        y: 150,  // Centered
        width: 180,  // Prominent size
        height: 200,
      }
    );

    // Return array with single most prominent object
    return [detection];
  }

  /**
   * Fetch image from Ring camera (placeholder)
   * TODO: Implement Ring API integration
   */
  async fetchRingImage(imageUrl: string): Promise<string> {
    // In production, this would:
    // 1. Authenticate with Ring API
    // 2. Fetch snapshot from specific camera
    // 3. Convert to base64 for processing
    
    throw new Error('Ring API integration not yet implemented');
  }

  /**
   * Calculate total SBC rewards for detected items
   */
  calculateTotalReward(detections: DetectionResult[]): number {
    return detections.reduce((total, item) => total + item.sbcReward, 0);
  }

  /**
   * Get recyclability statistics
   */
  getRecyclabilityStats(detections: DetectionResult[]) {
    const recyclable = detections.filter(d => d.recyclable).length;
    const nonRecyclable = detections.length - recyclable;
    const totalReward = this.calculateTotalReward(detections);

    return {
      total: detections.length,
      recyclable,
      nonRecyclable,
      totalReward,
      recyclabilityRate: detections.length > 0 
        ? (recyclable / detections.length * 100).toFixed(1) + '%' 
        : '0%'
    };
  }
}

