"use client";

import { useEffect } from "react";
import { demoStateStore } from "@/services/demo-state-store";
import { productComparisonStore } from "@/services/product-comparison-store";

/** Starts browser persistence after mount; renders no markup and keeps the root server-rendered. */
export function DemoStateHydrator() {
  useEffect(() => {
    void demoStateStore.getState().hydrate();
    productComparisonStore.getState().hydrate();
  }, []);

  return null;
}
