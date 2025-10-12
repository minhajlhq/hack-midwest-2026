import React, { useRef, useEffect, useState } from 'react';

// Simple webcam test component
export default function WebcamTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Click button to start webcam');
  const [streamActive, setStreamActive] = useState(false);

  const startWebcam = async () => {
    console.log('=== WEBCAM TEST START ===');
    setStatus('Requesting camera access...');
    
    try {
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('✅ Got stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Is active?', stream.active);
      
      setStatus('Stream obtained! Connecting to video element...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Stream assigned to video element');
        
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setStatus('Metadata loaded! Attempting to play...');
          
          videoRef.current?.play()
            .then(() => {
              console.log('✅ Video playing!');
              setStatus('✅ SUCCESS! Video should be visible!');
              setStreamActive(true);
            })
            .catch(err => {
              console.error('❌ Play error:', err);
              setStatus('❌ Play failed: ' + err.message);
            });
        };
        
        videoRef.current.onerror = (e) => {
          console.error('❌ Video element error:', e);
          setStatus('❌ Video element error');
        };
      } else {
        console.error('❌ Video ref is null');
        setStatus('❌ Video element not found');
      }
      
    } catch (err: any) {
      console.error('❌ getUserMedia error:', err);
      setStatus('❌ Failed to get camera: ' + err.message);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track);
      });
      videoRef.current.srcObject = null;
      setStreamActive(false);
      setStatus('Webcam stopped');
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔬 Webcam Debug Test</h1>
      <p style={{ color: '#666' }}>Simple test to diagnose webcam issues</p>
      
      <div style={{ margin: '2rem 0' }}>
        <button
          onClick={startWebcam}
          disabled={streamActive}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: streamActive ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: streamActive ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {streamActive ? '✅ Webcam Active' : '▶️ Start Webcam'}
        </button>
        
        <button
          onClick={stopWebcam}
          disabled={!streamActive}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: !streamActive ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !streamActive ? 'not-allowed' : 'pointer'
          }}
        >
          ⏹️ Stop Webcam
        </button>
      </div>

      <div style={{
        padding: '1rem',
        background: '#f0f0f0',
        borderRadius: '8px',
        marginBottom: '2rem',
        fontFamily: 'monospace'
      }}>
        <strong>Status:</strong> {status}
      </div>

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
            background: '#1a1a1a'
          }}
        />
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>📋 Checklist:</h3>
        <ol>
          <li>Open Console (⌘+Option+J)</li>
          <li>Click "Start Webcam" button</li>
          <li>Allow camera permissions</li>
          <li>Watch console for messages</li>
          <li>Do you see video above?</li>
        </ol>
        
        <h3 style={{ marginTop: '1rem' }}>🔍 What to check in console:</h3>
        <ul>
          <li>Look for "✅ Got stream"</li>
          <li>Look for "✅ Video metadata loaded"</li>
          <li>Look for "✅ Video playing!"</li>
          <li>Copy any ❌ errors you see</li>
        </ul>
      </div>
    </div>
  );
}


