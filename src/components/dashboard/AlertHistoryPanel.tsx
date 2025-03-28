import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useDatabase } from "@/lib/database";

export function AlertHistoryPanel() {
  const { alerts, clearAlerts } = useDatabase();

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString();
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Alert History</h3>
        {alerts.length > 0 && (
          <Button size="sm" onClick={clearAlerts} variant="outline">
            <Trash className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      <ScrollArea className="h-[600px]">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            No alerts recorded
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <img
                  src={alert.image}
                  alt="Alert"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(alert.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
