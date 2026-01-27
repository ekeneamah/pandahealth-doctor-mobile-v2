import type { User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  
  setAuth: (user: User, token: string, refreshToken: string, sessionId: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setAuth: (user, token, refreshToken, sessionId) => {
        console.log('[AuthStore] Setting auth state:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          hasToken: !!token,
          hasRefreshToken: !!refreshToken,
          hasSessionId: !!sessionId,
        });
        set({
          user,
          token,
          refreshToken,
          sessionId,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          sessionId: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'doctor-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
