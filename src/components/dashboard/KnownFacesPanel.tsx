import { ScrollArea } from "@/components/ui/scroll-area";
import { AddFaceDialog } from "./AddFaceDialog";
import { EditFaceDialog } from "./EditFaceDialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, RefreshCw, Upload, Pencil } from "lucide-react";
import { useDatabase, Face } from "@/lib/database";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { faceRecognitionApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export function KnownFacesPanel() {
  const { faces, addFace, removeFace, updateFace } = useDatabase();
  const [syncing, setSyncing] = useState(false);
  const [faceToEdit, setFaceToEdit] = useState<Face | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for expired guests on component mount
    import("@/lib/database").then(({ cleanupExpiredGuests }) => {
      cleanupExpiredGuests();
    });
  }, []);

  const handleAddFace = async (data: {
    name: string;
    images: Record<string, File>;
    isGuest?: boolean;
    startTime?: string;
    endTime?: string;
  }) => {
    try {
      // Use the front image as the main display image
      const mainImage = data.images["front"] || Object.values(data.images)[0];

      // Add to local database first
      addFace({
        name: data.name,
        image: URL.createObjectURL(mainImage),
        isGuest: !!data.isGuest,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      // Then upload to Raspberry Pi
      await faceRecognitionApi.uploadFace({
        name: data.name,
        images: Object.values(data.images),
        isGuest: !!data.isGuest,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      toast({
        title: "Face added",
        description: `${data.name} has been added to the database and uploaded to the Raspberry Pi.`,
      });
    } catch (error) {
      console.error("Error adding face:", error);
      toast({
        title: "Error adding face",
        description:
          "Face was added locally but failed to upload to Raspberry Pi.",
        variant: "destructive",
      });
    }
  };

  const handleEditFace = (face: Face) => {
    setFaceToEdit(face);
  };

  const handleUpdateFace = async (
    id: number,
    data: {
      name: string;
      isGuest: boolean;
      startTime?: string;
      endTime?: string;
      newImage?: File;
    },
  ) => {
    try {
      // Prepare update data for local database
      const updateData: any = {
        name: data.name,
        isGuest: data.isGuest,
        startTime: data.startTime,
        endTime: data.endTime,
      };

      // If there's a new image, create object URL for local display
      if (data.newImage) {
        updateData.image = URL.createObjectURL(data.newImage);
      }

      // Update in local database first
      updateFace(id, updateData);

      // Then update on Raspberry Pi
      await faceRecognitionApi.updateFace(id, data);

      toast({
        title: "Face updated",
        description: `${data.name}'s information has been updated.`,
      });

      setFaceToEdit(null);
    } catch (error) {
      console.error("Error updating face:", error);
      toast({
        title: "Error updating face",
        description:
          "Face was updated locally but failed to update on Raspberry Pi.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFace = async (id: number) => {
    try {
      // Remove from local database first
      removeFace(id);

      // Then delete from Raspberry Pi
      await faceRecognitionApi.deleteFace(id);

      toast({
        title: "Face removed",
        description:
          "Face has been removed from the database and Raspberry Pi.",
      });
    } catch (error) {
      console.error("Error removing face:", error);
      toast({
        title: "Error removing face",
        description:
          "Face was removed locally but failed to delete from Raspberry Pi.",
        variant: "destructive",
      });
    }
  };

  const syncWithRaspberryPi = async () => {
    setSyncing(true);
    try {
      // Test connection first
      const connected = await faceRecognitionApi.testConnection();
      if (!connected) {
        throw new Error("Cannot connect to Raspberry Pi");
      }

      // Sync faces
      await faceRecognitionApi.syncFaces(faces);

      toast({
        title: "Sync complete",
        description:
          "Face database has been synchronized with the Raspberry Pi.",
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description:
          "Failed to synchronize with Raspberry Pi. Check connection.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="rounded-lg border bg-card p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Known Faces</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={syncWithRaspberryPi}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Sync with Pi
          </Button>
          <AddFaceDialog onAdd={handleAddFace} />
        </div>
      </div>
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-2 gap-4">
          {faces.map((face) => (
            <div
              key={face.id}
              className="flex flex-col items-center p-3 border rounded-lg relative"
            >
              {face.isGuest && (
                <Badge className="absolute top-2 right-2" variant="secondary">
                  Guest
                </Badge>
              )}
              <img
                src={face.image}
                alt={face.name}
                className="w-20 h-20 rounded-full mb-2 object-cover"
              />
              <span className="text-sm font-medium">{face.name}</span>

              {face.isGuest && face.startTime && face.endTime && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Time-limited access</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>From: {formatDate(face.startTime)}</p>
                      <p>Until: {formatDate(face.endTime)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEditFace(face)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemoveFace(face.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {faceToEdit && (
        <EditFaceDialog
          face={faceToEdit}
          onUpdate={handleUpdateFace}
          onClose={() => setFaceToEdit(null)}
        />
      )}
    </div>
  );
}
