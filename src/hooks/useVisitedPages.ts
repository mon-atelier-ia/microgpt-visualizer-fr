import { useState, useCallback } from "react";

const STORAGE_KEY = "microgpt-visited";

export function useVisitedPages() {
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const markVisited = useCallback((pageId: string) => {
    setVisited((prev) => {
      if (prev.has(pageId)) return prev;
      const next = new Set(prev);
      next.add(pageId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { visited, markVisited };
}
