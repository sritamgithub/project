import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Face } from "@/lib/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload } from "lucide-react";

interface EditFaceDialogProps {
  face: Face;
  onUpdate: (
    id: number,
    data: {
      name: string;
      isGuest: boolean;
      startTime?: string;
      endTime?: string;
      newImage?: File;
    },
  ) => void;
  onClose: () => void;
}

export function EditFaceDialog({
  face,
  onUpdate,
  onClose,
}: EditFaceDialogProps) {
  const [name, setName] = useState(face.name);
  const [isGuest, setIsGuest] = useState(face.isGuest);
  const [startTime, setStartTime] = useState(face.startTime || "");
  const [endTime, setEndTime] = useState(face.endTime || "");
  const [open, setOpen] = useState(true);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(face.image);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setName(face.name);
    setIsGuest(face.isGuest);
    setStartTime(face.startTime || "");
    setEndTime(face.endTime || "");
    setImagePreview(face.image);
  }, [face]);

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
            const file = new File([blob], `${face.name}-front.jpg`, {
              type: "image/jpeg",
            });
            setNewImage(file);
            setImagePreview(URL.createObjectURL(blob));
          }
        }, "image/jpeg");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && (!isGuest || (isGuest && startTime && endTime))) {
      onUpdate(face.id, {
        name,
        isGuest,
        startTime: isGuest ? startTime : undefined,
        endTime: isGuest ? endTime : undefined,
        newImage: newImage || undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Face</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="photo">Update Photo</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter person's name"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-guest-mode"
                  checked={isGuest}
                  onCheckedChange={setIsGuest}
                />
                <Label htmlFor="edit-guest-mode">Guest Access</Label>
              </div>

              {isGuest && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-time">Start Time</Label>
                    <div className="relative">
                      <Input
                        id="edit-start-time"
                        type="date"
                        value={startTime.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = startTime.split("T")[1] || "00:00";
                          setStartTime(`${date}T${time}`);
                        }}
                        required={isGuest}
                        className="cursor-pointer mb-2"
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          input.showPicker();
                        }}
                        placeholder="DD-MM-YYYY"
                      />
                      <Input
                        id="edit-start-time-clock"
                        type="time"
                        value={startTime.split("T")[1] || ""}
                        onChange={(e) => {
                          const date =
                            startTime.split("T")[0] ||
                            new Date().toISOString().split("T")[0];
                          setStartTime(`${date}T${e.target.value}`);
                        }}
                        required={isGuest}
                        className="cursor-pointer"
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          input.showPicker();
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-time">End Time</Label>
                    <div className="relative">
                      <Input
                        id="edit-end-time"
                        type="date"
                        value={endTime.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = endTime.split("T")[1] || "23:59";
                          setEndTime(`${date}T${time}`);
                        }}
                        required={isGuest}
                        className="cursor-pointer mb-2"
                        onClick={(e) => {
                          const input = e.target as HTMLInputElement;
                          input.showPicker();
                        }}
                        placeholder="DD-MM-YYYY"
                      />
                      <Input
                        id="edit-end-time-clock"
                        type="time"
                        value={endTime.split("T")[1] || ""}
                        onChange={(e) => {
                          const date =
                            endTime.split("T")[0] ||
                            new Date().toISOString().split("T")[0];
                          setEndTime(`${date}T${e.target.value}`);
                        }}
                        required={isGuest}
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
            </TabsContent>

            <TabsContent value="photo" className="space-y-4">
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
                    Capture New Photo
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name || (isGuest && (!startTime || !endTime))}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
