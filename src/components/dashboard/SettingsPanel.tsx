import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useDatabase } from "@/lib/database";
import { faceRecognitionApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export function SettingsPanel() {
  const { settings, updateSettings } = useDatabase();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    key: keyof typeof settings,
    value: string | boolean | number,
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update local settings
      updateSettings(localSettings);

      // Update settings on Raspberry Pi
      await faceRecognitionApi.updateSettings({
        sensitivity: localSettings.sensitivity,
        email_alerts: localSettings.emailAlerts,
        telegram_alerts: localSettings.telegramAlerts,
        email: localSettings.email,
        telegram: localSettings.telegram,
      });

      toast({
        title: "Settings saved",
        description:
          "Your settings have been updated on both the dashboard and Raspberry Pi.",
      });

      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Settings partially saved",
        description:
          "Settings were saved locally but failed to update on the Raspberry Pi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isEmailValid = () => {
    if (!localSettings.email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(localSettings.email);
  };

  const isTelegramValid = () => {
    if (!localSettings.telegram) return true;
    return localSettings.telegram.startsWith("@");
  };

  return (
    <div className="rounded-lg border bg-card p-4 mt-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Settings</h3>
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            variant="outline"
            disabled={!isEmailValid() || !isTelegramValid() || isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={localSettings.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={!isEmailValid() ? "border-destructive" : ""}
          />
          {!isEmailValid() && (
            <div className="flex items-center text-destructive text-sm mt-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Please enter a valid email address
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram">Telegram Username</Label>
          <Input
            id="telegram"
            placeholder="@username"
            value={localSettings.telegram}
            onChange={(e) => handleChange("telegram", e.target.value)}
            className={!isTelegramValid() ? "border-destructive" : ""}
          />
          {!isTelegramValid() && (
            <div className="flex items-center text-destructive text-sm mt-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Username must start with @
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Push Notifications</Label>
          <Switch
            id="notifications"
            checked={localSettings.notifications}
            onCheckedChange={(checked) =>
              handleChange("notifications", checked)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Detection Sensitivity</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[localSettings.sensitivity]}
              max={100}
              step={1}
              onValueChange={([value]) => handleChange("sensitivity", value)}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">
              {localSettings.sensitivity}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Higher sensitivity may increase false positives, lower sensitivity
            may miss some faces.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="email-alerts">Email Alerts</Label>
          <Switch
            id="email-alerts"
            checked={localSettings.emailAlerts}
            onCheckedChange={(checked) => handleChange("emailAlerts", checked)}
            disabled={!localSettings.email}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="telegram-alerts">Telegram Alerts</Label>
          <Switch
            id="telegram-alerts"
            checked={localSettings.telegramAlerts}
            onCheckedChange={(checked) =>
              handleChange("telegramAlerts", checked)
            }
            disabled={!localSettings.telegram}
          />
        </div>
      </div>
    </div>
  );
}
