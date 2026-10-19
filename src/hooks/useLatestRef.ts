import { useLayoutEffect, useRef } from "react";

/**
 * Ref that always holds the latest committed `value`, for callbacks that
 * outlive a render (rAF loops, observers, event handlers).
 *
 * Written in a layout effect, not during render: a render can be discarded,
 * a commit cannot. Layout effects run before passive effects and paint, so
 * consumers reading `.current` in useEffect / rAF see the new value.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
