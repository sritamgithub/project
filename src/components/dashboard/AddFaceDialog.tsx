import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Camera, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

type FaceAngle = "front" | "left" | "right" | "up" | "down" | "front-glasses";

interface AddFaceDialogProps {
  onAdd?: (data: {
    name: string;
    images: Record<string, File>;
    isGuest?: boolean;
    startTime?: string;
    endTime?: string;
  }) => void;
}

const REQUIRED_ANGLES: { id: FaceAngle; label: string }[] = [
  { id: "front", label: "Front View" },
  { id: "left", label: "Left Side" },
  { id: "right", label: "Right Side" },
  { id: "up", label: "Looking Up" },
  { id: "down", label: "Looking Down" },
  { id: "front-glasses", label: "Front View with Glasses" },
];

export function AddFaceDialog({ onAdd }: AddFaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currentAngle, setCurrentAngle] = useState<FaceAngle>("front");
  const [images, setImages] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isGuest, setIsGuest] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${currentAngle}.jpg`, {
              type: "image/jpeg",
            });
            setImages((prev) => ({ ...prev, [currentAngle]: file }));
            setPreviews((prev) => ({
              ...prev,
              [currentAngle]: URL.createObjectURL(blob),
            }));
          }
        }, "image/jpeg");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImages((prev) => ({ ...prev, [currentAngle]: file }));
      setPreviews((prev) => ({
        ...prev,
        [currentAngle]: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      name &&
      Object.keys(images).length === REQUIRED_ANGLES.length &&
      onAdd &&
      (!isGuest || (isGuest && startTime && endTime))
    ) {
      onAdd({
        name,
        images,
        isGuest,
        startTime: isGuest ? startTime : undefined,
        endTime: isGuest ? endTime : undefined,
      });
      setName("");
      setImages({});
      setPreviews({});
      setCurrentAngle("front");
      setIsGuest(false);
      setStartTime("");
      setEndTime("");
      setOpen(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      stopCamera();
      setImages({});
      setPreviews({});
      setCurrentAngle("front");
      setIsGuest(false);
      setStartTime("");
      setEndTime("");
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Face
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Face</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter person's name"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="guest-mode"
              checked={isGuest}
              onCheckedChange={setIsGuest}
            />
            <Label htmlFor="guest-mode">Guest Access</Label>
          </div>

          {isGuest && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="relative">
                  <Input
                    id="start-time"
                    type="date"
                    value={startTime.split("T")[0] || ""}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = startTime.split("T")[1] || "00:00";
                      setStartTime(`${date}T${time}`);
                    }}
                    required
                    className="cursor-pointer mb-2"
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.showPicker();
                    }}
                    placeholder="DD-MM-YYYY"
                  />
                  <Input
                    id="start-time-clock"
                    type="time"
                    value={startTime.split("T")[1] || ""}
                    onChange={(e) => {
                      const date =
                        startTime.split("T")[0] ||
                        new Date().toISOString().split("T")[0];
                      setStartTime(`${date}T${e.target.value}`);
                    }}
                    required
                    className="cursor-pointer"
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.showPicker();
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <div className="relative">
                  <Input
                    id="end-time"
                    type="date"
                    value={endTime.split("T")[0] || ""}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = endTime.split("T")[1] || "23:59";
                      setEndTime(`${date}T${time}`);
                    }}
                    required
                    className="cursor-pointer mb-2"
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.showPicker();
                    }}
                    placeholder="DD-MM-YYYY"
                  />
                  <Input
                    id="end-time-clock"
                    type="time"
                    value={endTime.split("T")[1] || ""}
                    onChange={(e) => {
                      const date =
                        endTime.split("T")[0] ||
                        new Date().toISOString().split("T")[0];
                      setEndTime(`${date}T${e.target.value}`);
                    }}
                    required
                    className="cursor-pointer"
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.showPicker();
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-20 h-20 border rounded-lg overflow-hidden">
                {previews[currentAngle] ? (
                  <img
                    src={previews[currentAngle]}
                    alt={
                      REQUIRED_ANGLES.find((a) => a.id === currentAngle)?.label
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    {REQUIRED_ANGLES.find((a) => a.id === currentAngle)?.label}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium">
                  {REQUIRED_ANGLES.find((a) => a.id === currentAngle)?.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(images).length}/{REQUIRED_ANGLES.length} photos
                  captured
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = REQUIRED_ANGLES.findIndex(
                    (a) => a.id === currentAngle,
                  );
                  const prevIndex =
                    (currentIndex - 1 + REQUIRED_ANGLES.length) %
                    REQUIRED_ANGLES.length;
                  setCurrentAngle(REQUIRED_ANGLES[prevIndex].id);
                }}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentIndex = REQUIRED_ANGLES.findIndex(
                    (a) => a.id === currentAngle,
                  );
                  const nextIndex = (currentIndex + 1) % REQUIRED_ANGLES.length;
                  setCurrentAngle(REQUIRED_ANGLES[nextIndex].id);
                }}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 mb-4">
            {REQUIRED_ANGLES.map(({ id }) => (
              <div
                key={id}
                className={`h-2 rounded-full ${previews[id] ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="upload" onClick={stopCamera}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={captureImage}
              >
                Capture Photo
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleFileUpload} />
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            className="w-full"
            disabled={
              !name ||
              Object.keys(images).length !== REQUIRED_ANGLES.length ||
              (isGuest && (!startTime || !endTime))
            }
          >
            Add Face ({Object.keys(images).length}/{REQUIRED_ANGLES.length}{" "}
            photos captured)
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
