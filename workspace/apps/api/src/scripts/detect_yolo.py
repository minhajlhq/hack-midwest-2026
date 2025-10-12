#!/usr/bin/env python3
"""
YOLOv8 Object Detection Script
Processes a base64 image and returns detected objects with bounding boxes
"""

import sys
import json
import base64
import io
from PIL import Image
import numpy as np
from ultralytics import YOLO

# Load YOLOv8 model (will download on first run)
try:
    model = YOLO('yolov8n.pt')  # nano model for speed
    print(json.dumps({'status': 'model_loaded'}), flush=True)
except Exception as e:
    print(json.dumps({'error': f'Failed to load model: {str(e)}'}), file=sys.stderr, flush=True)
    sys.exit(1)

def process_image(base64_image: str):
    """
    Process base64 image with YOLOv8
    Returns list of detections with class names, confidence, and bounding boxes
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
        
        # Decode base64 to image
        image_data = base64.b64decode(base64_image)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Run YOLOv8 inference
        results = model(image, conf=0.25, verbose=False)  # 25% confidence threshold
        
        detections = []
        
        # Parse results
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates (xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Get class name and confidence
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                
                # Calculate bbox in x, y, width, height format
                bbox = {
                    'x': int(x1),
                    'y': int(y1),
                    'width': int(x2 - x1),
                    'height': int(y2 - y1)
                }
                
                detections.append({
                    'object': class_name,
                    'confidence': confidence,
                    'bbox': bbox
                })
        
        # Sort by confidence (highest first) and return only the most prominent
        detections.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return only the SINGLE most prominent object
        if detections:
            detections = [detections[0]]
        
        return {
            'success': True,
            'detections': detections,
            'total_detected': len(detections)
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'detections': []
        }

if __name__ == '__main__':
    # Read base64 image from stdin
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        base64_image = data.get('image', '')
        
        if not base64_image:
            print(json.dumps({'success': False, 'error': 'No image provided'}), flush=True)
            sys.exit(1)
        
        # Process image
        result = process_image(base64_image)
        
        # Output JSON result
        print(json.dumps(result), flush=True)
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Script error: {str(e)}',
            'detections': []
        }), flush=True)
        sys.exit(1)


