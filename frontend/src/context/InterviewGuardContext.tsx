import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

interface PendingNav {
  /** The path the user is trying to navigate to */
  to: string;
  /** Call this to confirm navigation (after discard) */
  confirm: () => void;
  /** Call this to cancel and stay on the page */
  cancel: () => void;
}

interface InterviewGuardContextValue {
  /** Call from InterviewSessionPage to register an active guard */
  registerGuard: (sessionId: string, onDiscard: () => Promise<void>) => void;
  /** Call from InterviewSessionPage on unmount / interview completion */
  unregisterGuard: () => void;
  /**
   * Called by Sidebar nav links before navigating.
   * Returns true  → safe to navigate immediately.
   * Returns false → blocked; a modal will be shown via pendingNavRef.
   */
  requestNavigation: (to: string, confirm: () => void, cancel: () => void) => boolean;
  /** Whether a guard is currently active */
  isGuardActive: () => boolean;
  /** Returns the pending nav action (if any) so the modal can confirm/cancel */
  getPendingNav: () => PendingNav | null;
}

const InterviewGuardContext = createContext<InterviewGuardContextValue | null>(null);

export function InterviewGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<{ sessionId: string; onDiscard: () => Promise<void> } | null>(null);
  const pendingNavRef = useRef<PendingNav | null>(null);

  const registerGuard = useCallback((sessionId: string, onDiscard: () => Promise<void>) => {
    guardRef.current = { sessionId, onDiscard };
  }, []);

  const unregisterGuard = useCallback(() => {
    guardRef.current = null;
    pendingNavRef.current = null;
  }, []);

  const isGuardActive = useCallback(() => guardRef.current !== null, []);

  const requestNavigation = useCallback(
    (to: string, confirm: () => void, cancel: () => void): boolean => {
      if (!guardRef.current) return true; // no guard — navigate freely
      // Store the pending action; the modal in InterviewSessionPage will pick it up
      pendingNavRef.current = { to, confirm, cancel };
      // Trigger a custom event so InterviewSessionPage can react
      window.dispatchEvent(new CustomEvent('interview-guard-triggered'));
      return false; // blocked
    },
    []
  );

  const getPendingNav = useCallback(() => pendingNavRef.current, []);

  return (
    <InterviewGuardContext.Provider
      value={{ registerGuard, unregisterGuard, isGuardActive, requestNavigation, getPendingNav }}
    >
      {children}
    </InterviewGuardContext.Provider>
  );
}

export function useInterviewGuard() {
  const ctx = useContext(InterviewGuardContext);
  if (!ctx) throw new Error('useInterviewGuard must be used inside InterviewGuardProvider');
  return ctx;
}
