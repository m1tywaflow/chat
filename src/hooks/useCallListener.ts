"use client";

import { useEffect } from "react";
import { subscribeToIncomingCalls } from "@/lib/calls";
import { useCallStore } from "@/store/call-store";

export function useCallListener(currentUserId: string | undefined) {
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToIncomingCalls(currentUserId, (call) => {
      setIncomingCall(call);
    });

    return () => unsubscribe();
  }, [currentUserId, setIncomingCall]);
}
