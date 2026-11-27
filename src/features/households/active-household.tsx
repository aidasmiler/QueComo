import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useCurrentUser } from '@/features/auth/auth-context';
import type { MyHousehold } from './api';
import { useMyHouseholds } from './hooks';

interface ActiveHouseholdState {
  households: MyHousehold[];
  active: MyHousehold | null;
  setActiveId: (id: string) => void;
}

const ActiveHouseholdContext = createContext<ActiveHouseholdState | null>(null);

const storageKey = (userId: string) => `qc.activeHousehold.${userId}`;

function readStored(userId: string) {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

/**
 * The active household is a per-user, per-device choice. It is validated against the user's current
 * memberships on every render, so a removed membership can never stay "active".
 */
export function ActiveHouseholdProvider({
  households,
  children,
}: {
  households: MyHousehold[];
  children: ReactNode;
}) {
  const user = useCurrentUser();
  const [preferredId, setPreferredId] = useState<string | null>(() => readStored(user.id));

  const active = useMemo(
    () => households.find((h) => h.id === preferredId) ?? households[0] ?? null,
    [households, preferredId],
  );

  const setActiveId = useCallback(
    (id: string) => {
      setPreferredId(id);
      try {
        localStorage.setItem(storageKey(user.id), id);
      } catch {
        // Non-critical.
      }
    },
    [user.id],
  );

  const value = useMemo(
    () => ({ households, active, setActiveId }),
    [households, active, setActiveId],
  );
  return (
    <ActiveHouseholdContext.Provider value={value}>{children}</ActiveHouseholdContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveHousehold() {
  const ctx = useContext(ActiveHouseholdContext);
  if (!ctx) throw new Error('useActiveHousehold must be used inside ActiveHouseholdProvider');
  return ctx;
}

// Re-exported for screens that need the list without the provider (onboarding).
// eslint-disable-next-line react-refresh/only-export-components
export { useMyHouseholds };
