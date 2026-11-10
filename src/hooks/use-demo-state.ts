"use client";

import { useStore } from "zustand";
import { demoStateStore } from "@/services/demo-state-store";
import type { DemoStateStore } from "@/services/demo-state-store";

/** Subscribe to one store value to avoid rerenders from unrelated demo-state changes. */
export function useDemoState<T>(selector: (state: DemoStateStore) => T): T {
  return useStore(demoStateStore, selector);
}
