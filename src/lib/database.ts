import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Face = {
  id: number;
  name: string;
  image: string;
  isGuest: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
};

export type Alert = {
  id: number;
  time: string;
  type: string;
  image: string;
};

export type Settings = {
  email: string;
  telegram: string;
  notifications: boolean;
  sensitivity: number;
  emailAlerts: boolean;
  telegramAlerts: boolean;
};

type DatabaseState = {
  faces: Face[];
  alerts: Alert[];
  settings: Settings;
  addFace: (face: Omit<Face, "id" | "createdAt">) => void;
  removeFace: (id: number) => void;
  updateFace: (
    id: number,
    data: Partial<Omit<Face, "id" | "createdAt" | "image">>,
  ) => void;
  addAlert: (alert: Omit<Alert, "id">) => void;
  clearAlerts: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
};

export const useDatabase = create<DatabaseState>(
  persist(
    (set) => ({
      faces: [],
      alerts: [],
      settings: {
        email: "",
        telegram: "",
        notifications: false,
        sensitivity: 70,
        emailAlerts: false,
        telegramAlerts: false,
      },
      addFace: (face) =>
        set((state) => ({
          faces: [
            ...state.faces,
            {
              ...face,
              id: state.faces.length
                ? Math.max(...state.faces.map((f) => f.id)) + 1
                : 1,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeFace: (id) =>
        set((state) => ({
          faces: state.faces.filter((face) => face.id !== id),
        })),
      updateFace: (id, data) =>
        set((state) => ({
          faces: state.faces.map((face) =>
            face.id === id ? { ...face, ...data } : face,
          ),
        })),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: state.alerts.length
                ? Math.max(...state.alerts.map((a) => a.id)) + 1
                : 1,
            },
            ...state.alerts,
          ],
        })),
      clearAlerts: () => set({ alerts: [] }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "security-dashboard-storage",
    },
  ),
);

// Function to clean up expired guests
export function cleanupExpiredGuests() {
  const { faces, removeFace } = useDatabase.getState();
  const now = new Date();

  faces.forEach((face) => {
    if (face.isGuest && face.endTime) {
      const endTime = new Date(face.endTime);
      if (endTime < now) {
        removeFace(face.id);
      }
    }
  });
}

// Function to check if a face is currently allowed access
export function isAllowedAccess(faceId: number): boolean {
  const { faces } = useDatabase.getState();
  const face = faces.find((f) => f.id === faceId);

  if (!face) return false;

  // Regular faces always have access
  if (!face.isGuest) return true;

  // Guest faces need to check time constraints
  if (face.startTime && face.endTime) {
    const now = new Date();
    const startTime = new Date(face.startTime);
    const endTime = new Date(face.endTime);

    return now >= startTime && now <= endTime;
  }

  return false;
}
