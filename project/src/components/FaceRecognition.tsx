import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { FACEMESH_CONNECTIONS } from '@/lib/faceMeshConstants';

interface FaceRecognitionProps {
  onConfidenceChange: (confidence: number) => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onConfidenceChange }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        await tf.setBackend('webgl');
        
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        };
        
        const loadedDetector = await faceLandmarksDetection.createDetector(
          model,
          detectorConfig
        );
        
        setDetector(loadedDetector);
      } catch (error) {
        console.error('Error loading face detection model:', error);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      tf.dispose();
    };
  }, []);

  const detectFace = async (time: number) => {
    if (!detector || !webcamRef.current?.video || !canvasRef.current || !isEnabled) {
      requestRef.current = requestAnimationFrame(detectFace);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(detectFace);
      return;
    }

    // Ensure canvas matches video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const faces = await detector.estimateFaces(video);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (faces.length > 0) {
        const face = faces[0];
        const keypoints = face.keypoints;

        // Draw face mesh
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 1;

        FACEMESH_CONNECTIONS.forEach(([start, end]) => {
          const startPoint = keypoints[start];
          const endPoint = keypoints[end];

          if (startPoint && endPoint) {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
          }
        });

        // Draw keypoints
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        keypoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Calculate confidence metrics
        if (previousTimeRef.current === undefined || time - previousTimeRef.current > 100) {
          const eyeAspectRatio = calculateEyeAspectRatio(keypoints);
          const mouthAspectRatio = calculateMouthAspectRatio(keypoints);
          const headPose = calculateHeadPose(keypoints);
          
          const confidence = calculateOverallConfidence(
            eyeAspectRatio,
            mouthAspectRatio,
            headPose
          );
          
          onConfidenceChange(confidence);
          previousTimeRef.current = time;
        }
      }
    } catch (error) {
      console.error('Error during face detection:', error);
    }

    requestRef.current = requestAnimationFrame(detectFace);
  };

  useEffect(() => {
    if (isEnabled) {
      requestRef.current = requestAnimationFrame(detectFace);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isEnabled]);

  const calculateEyeAspectRatio = (keypoints: any[]) => {
    const leftEyeUpper = keypoints[159];
    const leftEyeLower = keypoints[145];
    const rightEyeUpper = keypoints[386];
    const rightEyeLower = keypoints[374];
    
    if (!leftEyeUpper || !leftEyeLower || !rightEyeUpper || !rightEyeLower) {
      return 0;
    }

    const leftEyeDistance = Math.abs(leftEyeUpper.y - leftEyeLower.y);
    const rightEyeDistance = Math.abs(rightEyeUpper.y - rightEyeLower.y);
    
    return (leftEyeDistance + rightEyeDistance) / 2;
  };

  const calculateMouthAspectRatio = (keypoints: any[]) => {
    const upperLip = keypoints[13];
    const lowerLip = keypoints[14];
    
    if (!upperLip || !lowerLip) {
      return 0;
    }

    return Math.abs(upperLip.y - lowerLip.y);
  };

  const calculateHeadPose = (keypoints: any[]) => {
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const nose = keypoints[1];
    
    if (!leftEye || !rightEye || !nose) {
      return 0;
    }

    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );
    
    const noseOffset = Math.abs((leftEye.x + rightEye.x) / 2 - nose.x);
    return 1 - Math.min(1, noseOffset / eyeDistance);
  };

  const calculateOverallConfidence = (
    eyeAspectRatio: number,
    mouthAspectRatio: number,
    headPose: number
  ) => {
    const normalizedEye = Math.min(1, eyeAspectRatio / 30);
    const normalizedMouth = Math.min(1, mouthAspectRatio / 40);
    const normalizedPose = headPose;

    const confidence = Math.round(
      (normalizedEye * 0.3 + normalizedMouth * 0.3 + normalizedPose * 0.4) * 100
    );

    return Math.max(0, Math.min(100, confidence));
  };

  return (
    <div className="relative w-[640px] h-[480px] bg-gray-100 rounded-lg overflow-hidden">
      {isEnabled && (
        <>
          <Webcam
            ref={webcamRef}
            mirrored
            className="absolute top-0 left-0 w-full h-full object-cover"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user",
              frameRate: 30
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />
        </>
      )}
      
      <Button
        onClick={() => setIsEnabled(!isEnabled)}
        className="absolute bottom-4 right-4 z-20"
        variant="secondary"
        disabled={isModelLoading}
      >
        {isModelLoading ? (
          "Loading..."
        ) : isEnabled ? (
          <CameraOff className="w-4 h-4" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>
      
      {!isEnabled && !isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Click the camera button to enable face tracking</p>
        </div>
      )}
      
      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Loading face detection model...</p>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;