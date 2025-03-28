import { create } from "zustand";

type ConnectionState = {
  isConnected: boolean;
  lastPing: number;
  setConnected: (status: boolean) => void;
  updatePing: () => void;
};

export const useConnection = create<ConnectionState>((set) => ({
  isConnected: true, // Default to true since we're not using WiFi connection anymore
  lastPing: Date.now(),
  setConnected: (status) => set({ isConnected: status }),
  updatePing: () => set({ lastPing: Date.now() }),
}));

// Start connection monitoring
export function startConnectionMonitoring() {
  const store = useConnection.getState();
  store.updatePing();

  // Simulate always connected state
  setInterval(() => {
    store.updatePing();
  }, 5000);
}

// Initialize connection monitoring
startConnectionMonitoring();
