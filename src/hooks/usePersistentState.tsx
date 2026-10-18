import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { readPersisted, writePersisted } from "@/lib/persistence";

function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const initial = useRef(initialValue);
  const [state, setState] = useState<T>(initialValue);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    try { setState(readPersisted(window.localStorage.getItem(key), initial.current)); }
    catch { setState(initial.current); }
    setLoadedKey(key);
  }, [key]);

  useEffect(() => {
    try {
      if (loadedKey === key) window.localStorage.setItem(key, writePersisted(state));
    } catch (error) {
      // Ignore write errors
    }
  }, [key, state, loadedKey]);

  return [state, setState];
}

export default usePersistentState; 
