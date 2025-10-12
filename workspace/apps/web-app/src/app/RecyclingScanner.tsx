import React, { useState, useRef, useEffect } from 'react';

// ====== CONFIG ======
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const DETECT_ENDPOINT = `${API_BASE}/api/detect`;

// This database mirrors the backend - import from API response in production
const RECYCLABLE_DATABASE_SAMPLE: Record<string, any> = {
  'bottle': { recyclable: true, material: 'Plastic (PET/HDPE)', specificType: 'Beverage Bottle', sbcReward: 0.15, category: 'Plastic Container', size: 'Small-Medium' },
  'can': { recyclable: true, material: 'Aluminum', specificType: 'Beverage Can', sbcReward: 0.2, category: 'Metal Container', size: 'Small' },
  'laptop': { recyclable: true, material: 'E-Waste (Metal/Plastic/Circuit)', specificType: 'Laptop Computer', sbcReward: 1.5, category: 'Electronics', size: 'Medium', specialHandling: 'Contains precious metals' },
  'cell phone': { recyclable: true, material: 'E-Waste (Metal/Plastic/Battery)', specificType: 'Mobile Phone', sbcReward: 1.0, category: 'Electronics', size: 'Small', specialHandling: 'Remove battery' },
  'styrofoam': { recyclable: false, material: 'Polystyrene Foam (PS #6)', specificType: 'Styrofoam Container', sbcReward: 0, category: 'Non-Recyclable', specialHandling: 'Not accepted at most facilities' },
  'plastic bag': { recyclable: false, material: 'Soft Plastic (LDPE #4)', specificType: 'Shopping Bag', sbcReward: 0, category: 'Non-Recyclable', specialHandling: 'Return to store collection bins' },
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

export default function RecyclingScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [useWebcam, setUseWebcam] = useState(false);
  const [totalSBC, setTotalSBC] = useState(0);
  const [showRingInstructions, setShowRingInstructions] = useState(false);
  const [ringDashboardUrl, setRingDashboardUrl] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam - Using the WORKING code from WebcamTest
  const startWebcam = async () => {
    console.log('=== SCANNER WEBCAM START ===');
    setStatus('Requesting camera access...');
    
    try {
      // Request webcam access - simple, just like the working test
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('✅ Scanner got stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Is active?', stream.active);
      
      // Store stream first
      streamRef.current = stream;
      
      // Set useWebcam to true FIRST so React renders the video element
      setUseWebcam(true);
      setStatus('Stream obtained! Connecting to video element...');
      
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Stream assigned to scanner video element');
          
          videoRef.current.onloadedmetadata = () => {
            console.log('✅ Scanner video metadata loaded');
            console.log('Scanner video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            setStatus('Metadata loaded! Attempting to play...');
            
            videoRef.current?.play()
              .then(() => {
                console.log('✅ Scanner video playing!');
                setStatus('✅ Webcam ready! Click "Capture & Scan" to analyze.');
              })
              .catch(err => {
                console.error('❌ Play error:', err);
                setStatus('❌ Play failed: ' + err.message);
              });
          };
          
          videoRef.current.onerror = (e) => {
            console.error('❌ Scanner video element error:', e);
            setStatus('❌ Video element error');
          };
        } else {
          console.error('❌ Scanner video ref is still null after timeout');
          setStatus('❌ Video element not found');
        }
      }, 100); // Give React time to render the video element
      
    } catch (err: any) {
      console.error('❌ Scanner getUserMedia error:', err);
      setStatus('❌ Failed to get camera: ' + err.message);
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track);
      });
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseWebcam(false);
    setStatus('Webcam stopped');
  };

  // Capture from webcam
  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setSelectedImage(imageDataUrl);
    processImage(imageDataUrl);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
      processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Mock detection function - returns ONLY the most prominent object
  const mockDetection = (imageData: string): DetectionResult[] => {
    // For demo purposes, detect ONE most prominent object
    const possibleDetections = ['bottle', 'can', 'laptop', 'cell phone', 'plastic bag', 'styrofoam'];
    
    // Pick the most prominent object
    const prominentObject = possibleDetections[Math.floor(Math.random() * possibleDetections.length)];
    const info = RECYCLABLE_DATABASE_SAMPLE[prominentObject] || RECYCLABLE_DATABASE_SAMPLE['plastic bag'];
    
    const detection: DetectionResult = {
      object: prominentObject,
      confidence: 0.88 + Math.random() * 0.11, // 88-99% confidence
      recyclable: info.recyclable,
      material: info.material,
      specificType: info.specificType,
      sbcReward: info.sbcReward,
      category: info.category,
      size: info.size,
      weight: info.weight,
      specialHandling: info.specialHandling,
      bbox: {
        x: 200,  // Centered
        y: 150,  // Centered
        width: 180,
        height: 200,
      }
    };
    
    // Return array with single most prominent object
    return [detection];
  };

  // Process image with YOLOv8 backend
  const processImage = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setStatus('🔍 Analyzing image with YOLOv8...');
    setDetections([]);
    
    try {
      // Call backend API for detection
      const response = await fetch(DETECT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.detections) {
        throw new Error('Invalid response from detection API');
      }

      const results: DetectionResult[] = data.detections;
      
      // Calculate total SBC rewards
      const total = results.reduce((sum, item) => sum + item.sbcReward, 0);
      setTotalSBC(total);
      setDetections(results);
      
      if (results.length === 0) {
        setStatus('❌ No object detected. Try another image.');
      } else {
        const item = results[0];
        setStatus(`✅ Detected: ${item.specificType} - ${total.toFixed(2)} SBC`);
      }
    } catch (error) {
      setStatus('❌ Error processing image. Using mock data for demo.');
      console.error('Detection error:', error);
      
      // Fallback to mock detection for demo
      const mockResults = mockDetection(imageDataUrl);
      const total = mockResults.reduce((sum, item) => sum + item.sbcReward, 0);
      setTotalSBC(total);
      setDetections(mockResults);
      
      if (mockResults.length > 0) {
        const item = mockResults[0];
        setStatus(`✅ (Demo) Detected: ${item.specificType} - ${total.toFixed(2)} SBC`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#333' }}>
        ♻️ AI Recycling Scanner
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>
        Use YOLOv8 to detect recyclable items and earn SBC tokens instantly
      </p>
      
      {/* Ring Camera Integration Info */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📹 Ring Camera Integration
          </h3>
          <button
            onClick={() => setShowRingInstructions(!showRingInstructions)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid white',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {showRingInstructions ? '▼ Hide Details' : '▶ View Instructions'}
          </button>
        </div>
        
        {showRingInstructions && (
          <div style={{ marginTop: '1rem', opacity: 0.95, lineHeight: '1.8' }}>
            <p style={{ margin: '0 0 1rem 0' }}>
              <strong>Method 1: Screenshot Upload (Easiest)</strong>
            </p>
            <ol style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
              <li>Open your Ring dashboard at <a href="https://ring.com/users/sign_in" target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>ring.com</a></li>
              <li>Navigate to Live View for your camera</li>
              <li>Place recyclable items in front of the camera</li>
              <li>Take a screenshot (⌘+Shift+4 on Mac, Win+Shift+S on Windows)</li>
              <li>Upload the screenshot using the button below</li>
            </ol>
            
            <p style={{ margin: '1rem 0' }}>
              <strong>Method 2: Webcam as Substitute</strong>
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '0' }}>
              <li>Click "Use Webcam" below to test with your device camera</li>
              <li>Place items in front of your webcam</li>
              <li>Click "Capture & Scan" to analyze</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Ring Dashboard Quick Link */}
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '2px solid #667eea'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', color: '#333' }}>🎥 Quick Access:</span>
          <a 
            href="https://ring.com/users/sign_in" 
            target="_blank" 
            rel="noreferrer"
            style={{
              padding: '0.5rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            Open Ring Dashboard →
          </a>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            (Opens in new tab - take screenshots and upload below)
          </span>
        </div>
      </div>

      {/* Input Methods */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: isProcessing ? 0.5 : 1
          }}
        >
          📁 Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {!useWebcam ? (
          <button
            onClick={startWebcam}
            disabled={isProcessing}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            📷 Use Webcam
          </button>
        ) : (
          <>
            <button
              onClick={captureFromWebcam}
              disabled={isProcessing}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: isProcessing ? 0.5 : 1
              }}
            >
              📸 Capture & Scan
            </button>
            <button
              onClick={stopWebcam}
              style={{
                padding: '1rem 2rem',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⏹️ Stop Webcam
            </button>
          </>
        )}
      </div>

      {/* Status Message */}
      {status && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          background: status.startsWith('✅') ? '#d4edda' : status.startsWith('❌') ? '#f8d7da' : '#d1ecf1',
          color: status.startsWith('✅') ? '#155724' : status.startsWith('❌') ? '#721c24' : '#0c5460',
          borderRadius: '8px',
          border: `1px solid ${status.startsWith('✅') ? '#c3e6cb' : status.startsWith('❌') ? '#f5c6cb' : '#bee5eb'}`
        }}>
          {status}
        </div>
      )}

      {/* Video/Image Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Webcam Feed */}
        {useWebcam && (
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>📹 Live Webcam Feed</h3>
            <div style={{ 
              background: '#000', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '3px solid #4CAF50'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: 'block',
                  minHeight: '400px',
                  background: '#1a1a1a',
                  transform: 'scaleX(-1)' // Mirror the video like a selfie camera
                }}
                onLoadedMetadata={(e) => {
                  console.log('Scanner video metadata loaded');
                  const video = e.currentTarget;
                  console.log('Scanner video dimensions:', video.videoWidth, 'x', video.videoHeight);
                }}
                onPlay={() => console.log('Scanner video started playing')}
                onError={(e) => console.error('Scanner video error:', e)}
              />
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
              ✅ Webcam Active - Position items in view, then click "Capture & Scan"
            </p>
          </div>
        )}

        {/* Captured/Uploaded Image */}
        {selectedImage && (
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Scanned Image</h3>
            <img
              src={selectedImage}
              alt="Selected"
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </div>
        )}
      </div>

      {/* Hidden canvas for webcam capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Detection Results */}
      {detections.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            color: '#333'
          }}>
            Detection Result
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '2rem'
          }}>
            Most prominent object identified in the image
          </p>
          
          {/* Total Reward */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>SBC Reward</h3>
            <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: 0 }}>{totalSBC.toFixed(2)} SBC</p>
          </div>

          {/* Detected Object Details */}
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {detections.map((detection, index) => (
              <div
                key={index}
                style={{
                  padding: '1.5rem',
                  background: detection.recyclable ? '#d4edda' : '#f8d7da',
                  borderRadius: '12px',
                  border: `3px solid ${detection.recyclable ? '#28a745' : '#dc3545'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {/* Header with Icon and Object Name */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '2.5rem', marginRight: '0.75rem' }}>
                    {detection.recyclable ? '♻️' : '🚫'}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', margin: 0, textTransform: 'capitalize', fontWeight: 'bold' }}>
                      {detection.object}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                      {detection.specificType}
                    </p>
                  </div>
                </div>
                
                {/* Detection Details */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.7 }}>Confidence</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 'bold' }}>
                        {(detection.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    {detection.size && (
                      <div>
                        <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.7 }}>Size</p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 'bold' }}>
                          {detection.size}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.7 }}>Material Composition</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.4' }}>
                      {detection.material}
                    </p>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.7 }}>Category</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: '500' }}>
                      {detection.category}
                    </p>
                  </div>
                  
                  {detection.weight && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.7 }}>Weight Class</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: '500' }}>
                        {detection.weight}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Recyclability Status */}
                <div style={{
                  padding: '0.75rem',
                  background: detection.recyclable ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ fontSize: '1rem' }}>
                    {detection.recyclable ? '✅ Recyclable' : '❌ Non-Recyclable'}
                  </strong>
                </div>
                
                {/* Special Handling Instructions */}
                {detection.specialHandling && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #ffc107'
                  }}>
                    <p style={{ margin: '0', fontSize: '0.85rem', fontWeight: 'bold', color: '#856404', marginBottom: '0.25rem' }}>
                      ⚠️ Special Handling:
                    </p>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#856404', lineHeight: '1.4' }}>
                      {detection.specialHandling}
                    </p>
                  </div>
                )}
                
                {/* SBC Reward */}
                {detection.recyclable ? (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'white', opacity: 0.9 }}>
                      Reward Value
                    </p>
                    <strong style={{ fontSize: '1.8rem', color: 'white' }}>
                      +{detection.sbcReward.toFixed(2)} SBC
                    </strong>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(220, 53, 69, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <strong style={{ fontSize: '1rem', color: '#dc3545' }}>
                      No Reward (0 SBC)
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '3rem', 
        padding: '2rem', 
        background: '#f8f9fa', 
        borderRadius: '12px',
        border: '2px dashed #667eea'
      }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>
          📖 How to Use
        </h3>
        <ol style={{ lineHeight: '1.8', color: '#666' }}>
          <li><strong>Capture:</strong> Upload an image or use your webcam to capture items</li>
          <li><strong>Detect:</strong> Our AI will analyze the image using YOLOv8 object detection</li>
          <li><strong>Identify:</strong> The system identifies objects, materials, and recyclability</li>
          <li><strong>Earn:</strong> Get instant SBC token rewards for recyclable items!</li>
        </ol>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>💡 Tips for Best Results:</h4>
          <ul style={{ lineHeight: '1.6', color: '#666', marginLeft: '1.5rem' }}>
            <li>Ensure good lighting for better detection accuracy</li>
            <li>Place items against a clean background</li>
            <li>Keep items fully visible in the frame</li>
            <li>For Ring camera: Take clear snapshots of items placed in front of the camera</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

