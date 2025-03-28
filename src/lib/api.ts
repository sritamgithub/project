import axios from "axios";
import { Face } from "./database";

// Configure the base URL for the Raspberry Pi FastAPI server
const getApiUrl = () => {
  // First check localStorage for a dynamically set URL
  const storedUrl = localStorage.getItem("VITE_RASPBERRY_PI_API_URL");
  if (storedUrl) return storedUrl;

  // Fall back to the environment variable or default
  return import.meta.env.VITE_RASPBERRY_PI_API_URL || "http://localhost:8000";
};

const API_URL = getApiUrl();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "5000", 10);

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
});

// Mock data for demo mode
const mockFaces = [
  {
    id: 1,
    name: "John Doe",
    is_guest: false,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Jane Smith",
    is_guest: true,
    start_time: "08:00",
    end_time: "18:00",
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Mike Johnson",
    is_guest: false,
    image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    created_at: new Date().toISOString(),
  },
];

let mockDetection = {
  face_detected: false,
  is_known: false,
  name: null,
  image_url: null,
  timestamp: new Date().toISOString(),
};

// Simulate random detections in demo mode
const simulateDetection = () => {
  const random = Math.random();
  if (random < 0.7) {
    // 70% chance of detection
    const isKnown = random < 0.5; // 50% chance of known face
    mockDetection = {
      face_detected: true,
      is_known: isKnown,
      name: isKnown
        ? mockFaces[Math.floor(Math.random() * mockFaces.length)].name
        : null,
      image_url: isKnown
        ? `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=70`
        : `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=70`,
      timestamp: new Date().toISOString(),
    };
  } else {
    mockDetection = {
      face_detected: false,
      is_known: false,
      name: null,
      image_url: null,
      timestamp: new Date().toISOString(),
    };
  }
  return mockDetection;
};

// Check if we're in demo mode
const isDemoMode = () => {
  return localStorage.getItem("DEMO_MODE") === "true";
};

// API functions for face recognition
export const faceRecognitionApi = {
  // Upload face data to the Raspberry Pi
  uploadFace: async (faceData: {
    name: string;
    images: File[];
    isGuest: boolean;
    startTime?: string;
    endTime?: string;
  }) => {
    if (isDemoMode()) {
      // In demo mode, just add to mock data
      const newFace = {
        id: mockFaces.length + 1,
        name: faceData.name,
        is_guest: faceData.isGuest,
        start_time: faceData.startTime,
        end_time: faceData.endTime,
        image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faceData.name}${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      mockFaces.push(newFace);
      return Promise.resolve({ data: newFace, status: 200 });
    }

    const formData = new FormData();
    formData.append("name", faceData.name);
    formData.append("is_guest", String(faceData.isGuest));

    if (faceData.isGuest) {
      if (faceData.startTime) formData.append("start_time", faceData.startTime);
      if (faceData.endTime) formData.append("end_time", faceData.endTime);
    }

    faceData.images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });

    return api.post("/faces/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get all faces from the Raspberry Pi
  getFaces: async () => {
    if (isDemoMode()) {
      return Promise.resolve({ data: mockFaces, status: 200 });
    }
    return api.get("/faces");
  },

  // Delete a face from the Raspberry Pi
  deleteFace: async (faceId: number) => {
    if (isDemoMode()) {
      const index = mockFaces.findIndex((face) => face.id === faceId);
      if (index !== -1) {
        mockFaces.splice(index, 1);
      }
      return Promise.resolve({ status: 200 });
    }
    return api.delete(`/faces/${faceId}`);
  },

  // Update face information on the Raspberry Pi
  updateFace: async (
    faceId: number,
    data: {
      name: string;
      isGuest: boolean;
      startTime?: string;
      endTime?: string;
      newImage?: File;
    },
  ) => {
    if (isDemoMode()) {
      const index = mockFaces.findIndex((face) => face.id === faceId);
      if (index !== -1) {
        mockFaces[index] = {
          ...mockFaces[index],
          name: data.name,
          is_guest: data.isGuest,
          start_time: data.startTime,
          end_time: data.endTime,
          image_url: data.newImage
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}${Date.now()}`
            : mockFaces[index].image_url,
        };
      }
      return Promise.resolve({ data: mockFaces[index], status: 200 });
    }

    // If there's a new image, use FormData to send it
    if (data.newImage) {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("is_guest", String(data.isGuest));

      if (data.isGuest) {
        if (data.startTime) formData.append("start_time", data.startTime);
        if (data.endTime) formData.append("end_time", data.endTime);
      }

      formData.append("image", data.newImage);

      return api.put(`/faces/${faceId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // If no new image, just send JSON data
      return api.put(`/faces/${faceId}`, {
        name: data.name,
        is_guest: data.isGuest,
        start_time: data.startTime,
        end_time: data.endTime,
      });
    }
  },

  // Start the face recognition service
  startRecognition: async () => {
    if (isDemoMode()) {
      // Start simulating detections
      window.localStorage.setItem("RECOGNITION_ACTIVE", "true");
      return Promise.resolve({ status: 200 });
    }
    return api.post("/recognition/start");
  },

  // Stop the face recognition service
  stopRecognition: async () => {
    if (isDemoMode()) {
      // Stop simulating detections
      window.localStorage.setItem("RECOGNITION_ACTIVE", "false");
      return Promise.resolve({ status: 200 });
    }
    return api.post("/recognition/stop");
  },

  // Get the current status of the recognition service
  getStatus: async () => {
    if (isDemoMode()) {
      const active =
        window.localStorage.getItem("RECOGNITION_ACTIVE") === "true";
      return Promise.resolve({
        data: { active: active },
        status: 200,
      });
    }
    return api.get("/status");
  },

  // Get the latest detection results
  getLatestDetection: async () => {
    if (isDemoMode()) {
      // Only simulate detections if recognition is active
      if (window.localStorage.getItem("RECOGNITION_ACTIVE") === "true") {
        simulateDetection();
      }
      return Promise.resolve({ data: mockDetection, status: 200 });
    }
    return api.get("/detection/latest");
  },

  // Update settings on the Raspberry Pi
  updateSettings: async (settings: {
    sensitivity: number;
    email_alerts: boolean;
    telegram_alerts: boolean;
    email?: string;
    telegram?: string;
  }) => {
    if (isDemoMode()) {
      // Store settings in localStorage for demo mode
      localStorage.setItem("DEMO_SETTINGS", JSON.stringify(settings));
      return Promise.resolve({ status: 200 });
    }
    return api.post("/settings", settings);
  },

  // Sync local database with Raspberry Pi
  syncFaces: async (faces: Face[]) => {
    if (isDemoMode()) {
      return Promise.resolve({ status: 200 });
    }
    return api.post("/faces/sync", { faces });
  },

  // Test the connection to the Raspberry Pi
  testConnection: async () => {
    if (isDemoMode()) {
      return true;
    }

    try {
      const response = await api.get("/ping", { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  },
};
