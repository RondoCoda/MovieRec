// The app has no login (schema stores user_id only). This context holds the
// "current user" chosen via the header switcher and persists it across reloads.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "movierec.userId";
const DEFAULT_USER = 1;

interface UserContextValue {
  userId: number;
  setUserId: (id: number) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_USER;
  });

  const setUserId = useCallback((id: number) => {
    setUserIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  // Cross-tab sync (handy while recording the demo in multiple tabs).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = Number(e.newValue);
        if (Number.isInteger(parsed) && parsed > 0) setUserIdState(parsed);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ userId, setUserId }), [userId, setUserId]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used inside UserProvider");
  return ctx;
}
