import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';
import type { GalleryUser } from '@shared/types/auth';

interface AuthState {
  user: GalleryUser | null;
  sessionId: string | null;
  galleryId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (accessCode: string, galleryId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => boolean;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set, get) => ({
      // State
      user: null,
      sessionId: null,
      galleryId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (accessCode: string, galleryId: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.loginWithAccessCode(accessCode, galleryId);

          if (result.success && result.user && result.sessionId) {
            // Start analytics session
            await analyticsService.startSession(result.user, galleryId, result.sessionId);

            set({
              user: result.user,
              sessionId: result.sessionId,
              galleryId,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Login failed'
            });
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: 'An unexpected error occurred'
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        const { user, galleryId, sessionId } = get();

        // End analytics session
        if (user && galleryId && sessionId) {
          try {
            await analyticsService.endSession(user, galleryId, sessionId);
          } catch (error) {
            console.error('Error ending analytics session:', error);
          }
        }

        // Clear auth service
        authService.logout();

        // Reset state
        set({
          user: null,
          sessionId: null,
          galleryId: null,
          isAuthenticated: false,
          error: null
        });
      },

      restoreSession: (): boolean => {
        const result = authService.restoreSession();

        if (result.success && result.user && result.sessionId) {
          const galleryId = authService.getCurrentGalleryId();
          
          set({
            user: result.user,
            sessionId: result.sessionId,
            galleryId,
            isAuthenticated: true
          });

          return true;
        }

        return false;
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-store'
    }
  )
);