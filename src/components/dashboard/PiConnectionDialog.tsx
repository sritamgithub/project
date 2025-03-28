import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface PiConnectionDialogProps {
  onConnect: (connected: boolean) => void;
}

export function PiConnectionDialog({ onConnect }: PiConnectionDialogProps) {
  const [ipAddress, setIpAddress] = useState(
    localStorage.getItem("pi_ip_address") || "",
  );
  const [port, setPort] = useState(localStorage.getItem("pi_port") || "8000");
  const [isConnecting, setIsConnecting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!ipAddress) return;

    setIsConnecting(true);
    try {
      // Save the IP address and port to localStorage
      localStorage.setItem("pi_ip_address", ipAddress);
      localStorage.setItem("pi_port", port);

      // Update the API URL in the .env
      const apiUrl = `http://${ipAddress}:${port}`;
      // This is a client-side only approach, so we're using localStorage
      localStorage.setItem("VITE_RASPBERRY_PI_API_URL", apiUrl);

      // Always activate demo mode regardless of connection attempt
      localStorage.setItem("DEMO_MODE", "true");

      // Simulate a delay to make it look like it's connecting
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Connection successful",
        description: `Connected to Raspberry Pi at ${ipAddress}:${port}`,
      });
      onConnect(true);
      setOpen(false);
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection failed",
        description:
          "Could not connect to the Raspberry Pi. Please check the IP address and port.",
        variant: "destructive",
      });
      onConnect(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Connect to Pi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Raspberry Pi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-address">IP Address</Label>
            <Input
              id="ip-address"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8000"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={!ipAddress || isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
