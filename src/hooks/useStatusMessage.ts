import { useState, useCallback, useRef } from "react";
import type { StatusMessage } from "../services/types";

const AUTO_DISMISS_MS = 4500;

export function useStatusMessage() {
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = useCallback((text: string, type: StatusMessage["type"] = "info") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setStatusMessage({ text, type });
    timerRef.current = setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, AUTO_DISMISS_MS);
  }, []);

  return { statusMessage, showStatus };
}
