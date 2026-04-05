import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  phoneNumber: string;
  name?: string;
}

interface AuthStore {
  accessToken: string | null;
  usuario: AuthUser | null;
  setAuth: (token: string, usuario: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,

      setAuth: (token, usuario) => {
        set({ accessToken: token, usuario });
      },

      logout: () => {
        set({ accessToken: null, usuario: null });
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);
