import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnownFacesPanel } from "./KnownFacesPanel";
import { AlertHistoryPanel } from "./AlertHistoryPanel";
import { SettingsPanel } from "./SettingsPanel";

export function SidePanel() {
  return (
    <Tabs defaultValue="faces" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="faces">Faces</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="faces">
        <KnownFacesPanel />
      </TabsContent>
      <TabsContent value="alerts">
        <AlertHistoryPanel />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
