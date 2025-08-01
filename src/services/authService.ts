import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { 
  LoginWithAccessCodeRequest, 
  LoginResponse, 
  GalleryUser 
} from '@shared/types/auth';
import { generateSessionId, createSessionData } from '@shared/utils/analytics';

interface ClientAuthResult {
  success: boolean;
  user?: GalleryUser;
  sessionId?: string;
  error?: string;
}

class AuthService {
  private currentUser: GalleryUser | null = null;
  private currentSessionId: string | null = null;
  private galleryId: string | null = null;

  /**
   * Login with access code - matches Unity client flow
   */
  async loginWithAccessCode(accessCode: string, galleryId: string): Promise<ClientAuthResult> {
    try {
      // Call the same Firebase function that Unity client uses
      const loginFunction = httpsCallable<LoginWithAccessCodeRequest, LoginResponse>(
        functions, 
        'loginWithAccessCode'
      );

      const result = await loginFunction({
        accessCode: accessCode.toUpperCase(),
        galleryId
      });

      if (!result.data.success) {
        return {
          success: false,
          error: result.data.message || 'Invalid access code'
        };
      }

      // Create user object matching Unity client structure
      const user: GalleryUser = {
        userId: result.data.user.id,
        displayName: result.data.user.displayName,
        firstName: result.data.user.firstName,
        lastName: result.data.user.lastName,
        collectionId: result.data.user.collectionId,
        collectionName: result.data.user.collectionName,
        hideTitles: result.data.user.hideTitles,
        codeValue: accessCode.toUpperCase(),
        active: true,
        userEmail: '', // Not used in client
        dateCreatedUTC: null,
        lastLoginTimeUTC: new Date().toISOString()
      };

      // Generate session ID
      const sessionId = generateSessionId(user.userId!);

      // Store authentication state
      this.currentUser = user;
      this.currentSessionId = sessionId;
      this.galleryId = galleryId;

      // Store in localStorage for persistence
      localStorage.setItem('artvr_user', JSON.stringify(user));
      localStorage.setItem('artvr_session', sessionId);
      localStorage.setItem('artvr_gallery', galleryId);

      return {
        success: true,
        user,
        sessionId
      };

    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: 'Failed to validate access code. Please try again.'
      };
    }
  }

  /**
   * Restore session from localStorage
   */
  restoreSession(): ClientAuthResult {
    try {
      const userJson = localStorage.getItem('artvr_user');
      const sessionId = localStorage.getItem('artvr_session');
      const galleryId = localStorage.getItem('artvr_gallery');

      if (!userJson || !sessionId || !galleryId) {
        return { success: false, error: 'No saved session' };
      }

      const user = JSON.parse(userJson) as GalleryUser;
      
      this.currentUser = user;
      this.currentSessionId = sessionId;
      this.galleryId = galleryId;

      return {
        success: true,
        user,
        sessionId
      };

    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return { success: false, error: 'Invalid session data' };
    }
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.clearSession();
  }

  /**
   * Clear all session data
   */
  private clearSession(): void {
    this.currentUser = null;
    this.currentSessionId = null;
    this.galleryId = null;
    
    localStorage.removeItem('artvr_user');
    localStorage.removeItem('artvr_session');
    localStorage.removeItem('artvr_gallery');
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): GalleryUser | null {
    return this.currentUser;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get current gallery ID
   */
  getCurrentGalleryId(): string | null {
    return this.galleryId;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSessionId !== null;
  }

  /**
   * Get session data for analytics
   */
  getSessionData() {
    if (!this.currentUser || !this.currentSessionId) return null;

    return createSessionData(
      this.currentUser.userId!,
      this.currentUser.codeValue,
      this.currentSessionId
    );
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;