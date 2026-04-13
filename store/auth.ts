import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: 'admin' | 'guest' | null;
  hasHydrated: boolean;
  login: (username: string, role?: 'admin' | 'guest') => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      role: null,
      hasHydrated: false,
      login: (username: string, role: 'admin' | 'guest' = 'guest') => set({ isAuthenticated: true, username, role }),
      logout: () => set({ isAuthenticated: false, username: null, role: null }),
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
