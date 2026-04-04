import { useCallback, useState } from "react";

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((e: unknown, fallback = "Something went wrong") => {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : fallback;

    setError(message);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showError,
    clearError,
  };
}