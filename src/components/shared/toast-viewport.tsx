"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import { dismissToast, useToastMessage } from "@/services/toast";

const styles = {
  success: "border-brand-border bg-brand-tint text-brand-deep",
  error: "border-sale/30 bg-blush text-sale-strong",
  info: "border-line bg-white text-ink",
} as const;

export function ToastViewport() {
  const toast = useToastMessage();
  if (!toast) return null;

  const Icon = toast.kind === "success" ? Check : toast.kind === "error" ? TriangleAlert : Info;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 sm:bottom-6">
      <div
        key={toast.id}
        role={toast.kind === "error" ? "alert" : "status"}
        aria-atomic="true"
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-lg ${styles[toast.kind]}`}
      >
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
        <button type="button" className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-label="Dismiss notification" onClick={dismissToast}>
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}
