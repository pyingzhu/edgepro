"use client";
import { useSyncExternalStore } from "react";

// React's idiomatic pattern for external-store subscriptions like
// navigator.onLine. Server snapshot returns null so SSR and the first
// client render agree (no hydration mismatch); subsequent renders see
// the real navigator.onLine value.

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = (): boolean | null => null;

export function useOnline(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
