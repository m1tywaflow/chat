import { create } from "zustand";
import { CallDoc, CallType } from "@/lib/calls";

interface CallState {
  activeCall: CallDoc | null;
  incomingCall: CallDoc | null;
  livekitToken: string | null;
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;

  setActiveCall: (call: CallDoc | null) => void;
  setIncomingCall: (call: CallDoc | null) => void;
  setLivekitToken: (token: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  incomingCall: null,
  livekitToken: null,
  isConnected: false,
  isMuted: false,
  isCameraOff: false,

  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setLivekitToken: (token) => set({ livekitToken: token }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),

  resetCall: () =>
    set({
      activeCall: null,
      livekitToken: null,
      isConnected: false,
      isMuted: false,
      isCameraOff: false,
    }),
}));
