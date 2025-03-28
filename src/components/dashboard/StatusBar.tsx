import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Server } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useState, useEffect } from "react";
import { faceRecognitionApi } from "@/lib/api";
import { PiConnectionDialog } from "./PiConnectionDialog";

export function StatusBar() {
  const [piConnected, setPiConnected] = useState(false);
  const [checkingPi, setCheckingPi] = useState(false);

  useEffect(() => {
    // Check Raspberry Pi connection
    checkPiConnection();

    // Start monitoring connections
    const monitorInterval = setInterval(() => {
      // Check Raspberry Pi connection periodically
      checkPiConnection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(monitorInterval);
  }, []);

  const checkPiConnection = async () => {
    if (checkingPi) return;

    setCheckingPi(true);
    try {
      const connected = await faceRecognitionApi.testConnection();
      setPiConnected(connected);

      // If in demo mode, always show as connected
      if (localStorage.getItem("DEMO_MODE") === "true") {
        setPiConnected(true);
      }
    } catch (error) {
      console.error("Error checking Pi connection:", error);
      setPiConnected(localStorage.getItem("DEMO_MODE") === "true");
    } finally {
      setCheckingPi(false);
    }
  };

  const handlePiConnection = async (connected: boolean) => {
    setPiConnected(connected);
    if (connected) {
      try {
        // Start recognition automatically when Pi is connected
        await faceRecognitionApi.startRecognition();
        // Force reload the API with the new URL
        window.location.reload();
      } catch (error) {
        console.error("Error starting recognition after connection:", error);
      }
    }
  };

  return (
    <div className="w-full h-12 border-b bg-card px-4 flex items-center justify-between">
      <h1 className="font-bold text-lg">AI Security Dashboard</h1>
      <div className="flex items-center gap-4">
        <Badge variant="default">
          <Server className="w-4 h-4 mr-2" />
          Pi Connected
        </Badge>
        <PiConnectionDialog onConnect={handlePiConnection} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            useTheme
              .getState()
              .setTheme(useTheme.getState().theme === "dark" ? "light" : "dark")
          }
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
}
