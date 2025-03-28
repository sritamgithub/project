import { useConnection } from "@/lib/connection";
import { useEffect, useState, useRef } from "react";
import { useDatabase } from "@/lib/database";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  UserCheck,
  UserX,
  Play,
  Pause,
  Camera,
  Server,
} from "lucide-react";
import { FakeWebcamFeed } from "./FakeWebcamFeed";
import { faceRecognitionApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export function LiveFeedPanel() {
  const { isConnected } = useConnection();
  const { addAlert } = useDatabase();
  const { toast } = useToast();
  const [lastDetection, setLastDetection] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<
    "none" | "known" | "unknown"
  >("none");
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [piConnected, setPiConnected] = useState(false);
  const pollingRef = useRef<number | null>(null);

  // Start/stop face recognition on the Raspberry Pi
  const toggleRecognition = async () => {
    setIsLoading(true);
    try {
      if (isRecognitionActive) {
        await faceRecognitionApi.stopRecognition();
        setIsRecognitionActive(false);
        if (pollingRef.current) {
          window.clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast({
          title: "Recognition stopped",
          description: "Face recognition service has been stopped.",
        });
      } else {
        await faceRecognitionApi.startRecognition();
        setIsRecognitionActive(true);
        startPolling();
        toast({
          title: "Recognition started",
          description: "Face recognition service is now active.",
        });
      }
    } catch (error) {
      console.error("Error toggling recognition:", error);
      toast({
        title: "Connection error",
        description: "Failed to communicate with the Raspberry Pi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for the latest detection from the Raspberry Pi
  const startPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
    }

    pollingRef.current = window.setInterval(async () => {
      try {
        // First check if Pi is still connected
        const connected = await faceRecognitionApi.testConnection();
        if (!connected) {
          setDetectionStatus("none");
          setLastDetection(null);
          setIsRecognitionActive(false);
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          return;
        }

        const response = await faceRecognitionApi.getLatestDetection();
        const detection = response.data;

        if (detection) {
          if (detection.is_known) {
            setDetectionStatus("known");
            setLastDetection(detection.name || "Authorized person");
          } else if (detection.face_detected) {
            setDetectionStatus("unknown");
            setLastDetection("Unknown person");

            // Add to alerts if it's an unknown face
            addAlert({
              time: new Date().toISOString(),
              type: "Unknown Face",
              image:
                detection.image_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown${Date.now()}`,
            });
          } else {
            setDetectionStatus("none");
            setLastDetection(null);
          }
        }
      } catch (error) {
        console.error("Error polling for detection:", error);
        // If there's an error, assume Pi is disconnected
        setDetectionStatus("none");
        setLastDetection(null);
      }
    }, 1000);
  };

  // Check Pi connection and auto-start recognition when Pi is connected
  useEffect(() => {
    const checkRecognitionStatus = async () => {
      try {
        const connected = await faceRecognitionApi.testConnection();
        setPiConnected(connected);

        if (!connected && localStorage.getItem("DEMO_MODE") !== "true") {
          console.log("Raspberry Pi not connected, skipping status check");
          setDetectionStatus("none");
          setLastDetection(null);
          setIsRecognitionActive(false);
          return;
        }

        // Start recognition automatically
        await faceRecognitionApi.startRecognition();
        setIsRecognitionActive(true);
        startPolling();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setPiConnected(false);
        setIsRecognitionActive(false);
        setDetectionStatus("none");
        setLastDetection(null);
      }
    };

    if (isConnected) {
      checkRecognitionStatus();
    }

    // Set up periodic Pi connection check
    const piCheckInterval = setInterval(async () => {
      try {
        const connected = await faceRecognitionApi.testConnection();
        setPiConnected(connected);

        // If Pi was disconnected and is now connected, restart recognition
        if (connected && !piConnected) {
          checkRecognitionStatus();
        }
        // If Pi was connected and is now disconnected, reset detection state
        else if (
          !connected &&
          piConnected &&
          localStorage.getItem("DEMO_MODE") !== "true"
        ) {
          setDetectionStatus("none");
          setLastDetection(null);
          setIsRecognitionActive(false);
        }
      } catch (error) {
        console.error("Error checking Pi connection:", error);
        setPiConnected(false);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
      clearInterval(piCheckInterval);
    };
  }, [isConnected]);

  // Reset detection status when Pi is disconnected
  useEffect(() => {
    if (!isConnected) {
      setDetectionStatus("none");
      setLastDetection(null);
      setIsRecognitionActive(false);

      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [isConnected]);

  const getStatusColor = () => {
    switch (detectionStatus) {
      case "known":
        return "bg-green-500/10 border-green-500/50";
      case "unknown":
        return "bg-red-500/10 border-red-500/50";
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (detectionStatus) {
      case "known":
        return <UserCheck className="h-6 w-6 text-green-500" />;
      case "unknown":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  const captureImage = async () => {
    try {
      setIsLoading(true);

      // First check if Pi is connected
      const connected = await faceRecognitionApi.testConnection();
      if (!connected) {
        toast({
          title: "Capture failed",
          description:
            "Raspberry Pi is not connected. Please connect to Pi first.",
          variant: "destructive",
        });
        return;
      }

      await faceRecognitionApi.getLatestDetection();
      toast({
        title: "Image captured",
        description: "Current frame has been captured and processed.",
      });
    } catch (error) {
      console.error("Error capturing image:", error);
      toast({
        title: "Capture failed",
        description: "Failed to capture image from Raspberry Pi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Live Feed</h2>
        <div className="flex items-center gap-2">
          {detectionStatus !== "none" && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}
            >
              {getStatusIcon()}
              <span
                className={
                  detectionStatus === "known"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {lastDetection}
              </span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!isConnected || !piConnected || isLoading}
            onClick={captureImage}
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
        </div>
      </div>

      <div
        className={`aspect-video bg-muted rounded-md flex items-center justify-center relative ${getStatusColor()}`}
      >
        {isConnected ? (
          piConnected ? (
            <FakeWebcamFeed detectionStatus={detectionStatus} />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Server className="h-10 w-10 text-amber-500" />
              <span className="text-amber-500 font-medium">
                Raspberry Pi Not Connected
              </span>
              <span className="text-xs text-muted-foreground text-center max-w-md">
                Connect to your Raspberry Pi using the "Connect to Pi" button
                above to enable face detection
              </span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UserX className="h-10 w-10 text-destructive" />
            <span className="text-destructive font-medium">
              Camera Disconnected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
