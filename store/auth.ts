import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: 'admin' | 'guest' | null;
  login: (username: string, role?: 'admin' | 'guest') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      role: null,
      login: (username: string, role: 'admin' | 'guest' = 'guest') => set({ isAuthenticated: true, username, role }),
      logout: () => set({ isAuthenticated: false, username: null, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
