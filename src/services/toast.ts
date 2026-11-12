"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";
export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

let currentToast: ToastMessage | null = null;
let nextId = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function publish() {
  for (const listener of listeners) listener();
}

export function showToast(kind: ToastKind, message: string) {
  if (currentToast?.kind === kind && currentToast.message === message) return;
  if (timer) clearTimeout(timer);
  currentToast = { id: ++nextId, kind, message };
  publish();
  timer = setTimeout(dismissToast, 4000);
}

export function dismissToast() {
  if (!currentToast) return;
  if (timer) clearTimeout(timer);
  timer = null;
  currentToast = null;
  publish();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentToast;
}

export function useToastMessage() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
