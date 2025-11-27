import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
    className?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
    onCapture,
    onClose,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const startCamera = useCallback(async () => {
        try {
            setIsLoading(true);
            setError('');

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please check permissions.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const captureImage = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        onCapture(imageData);
        stopCamera();
        onClose();
    }, [onCapture, onClose, stopCamera]);

    React.useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
                <h3 className="text-lg font-semibold">Take Photo</h3>
                <button
                    onClick={() => {
                        stopCamera();
                        onClose();
                    }}
                    className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="flex items-center justify-center h-full text-white text-center p-4">
                        <div>
                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Camera Error</p>
                            <p className="text-sm opacity-75">{error}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            onLoadedMetadata={() => setIsLoading(false)}
                        />

                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <p>Starting camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Camera overlay with grid */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full border-2 border-white border-opacity-30">
                                <div className="w-full h-1/3 border-b border-white border-opacity-30"></div>
                                <div className="w-full h-1/3 border-b border-white border-opacity-30"></div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-black bg-opacity-50">
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={captureImage}
                        disabled={isLoading || !!error}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                        <Camera className="w-6 h-6 text-black" />
                    </button>

                    <button
                        onClick={() => {
                            stopCamera();
                            startCamera();
                        }}
                        disabled={isLoading || !!error}
                        className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;