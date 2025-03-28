import { LiveFeedPanel } from "./LiveFeedPanel";
import { SidePanel } from "./SidePanel";
import { StatusBar } from "./StatusBar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StatusBar />
      <div className="flex gap-4 p-4">
        <LiveFeedPanel />
        <SidePanel />
      </div>
    </div>
  );
}
