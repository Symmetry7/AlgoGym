"use client";
import { useState, useEffect } from "react";
import { problemStore } from "@/lib/problem-store";
export function useCatalog() {
  const [state, setState] = useState(() => problemStore.getState());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const unsubscribe = problemStore.subscribe(() =>
      setState(problemStore.getState()),
    );
    problemStore.preloadProblems();
    setMounted(true);
    return unsubscribe;
  }, []);
  return {
    ...state,
    loading: state.loading || !mounted,
    reload: () => void problemStore.loadProblems(true),
  };
}
