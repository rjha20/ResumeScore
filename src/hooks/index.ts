/**
 * Performance-optimized custom hooks.
 */

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";

/**
 * Hook to debounce a value.
 * Useful for search inputs and other rapidly-changing values.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook to track if a component is mounted (avoids state updates after unmount).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return mounted;
}

/**
 * Hook that returns a stable callback reference.
 * Like useCallback but without dependency tracking — the callback always gets the latest values.
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
): T {
  const ref = useRef(callback);

  useLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args: unknown[]) => ref.current(...args), []) as T;
}
