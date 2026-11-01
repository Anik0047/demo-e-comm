"use client";

import { useEffect, useState } from "react";

export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  useEffect(() => {
    const end = Date.now() + initialSeconds * 1000;
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [initialSeconds]);
  const pad = (value: number) => String(value).padStart(2, "0");
  return { h: pad(Math.floor(remaining / 3600)), m: pad(Math.floor(remaining / 60) % 60), s: pad(remaining % 60) };
}
