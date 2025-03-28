import { useEffect, useRef } from "react";

interface FakeWebcamFeedProps {
  detectionStatus: "none" | "known" | "unknown";
}

export function FakeWebcamFeed({ detectionStatus }: FakeWebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Access the webcam on component mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startCamera();

    return () => {
      // Clean up video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-md"
      />

      {/* Detection overlays */}
      {detectionStatus === "unknown" && (
        <div className="absolute inset-0 border-2 border-red-500 rounded-md animate-pulse pointer-events-none"></div>
      )}
      {detectionStatus === "known" && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-md pointer-events-none"></div>
      )}
    </div>
  );
}
