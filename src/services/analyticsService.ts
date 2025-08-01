import { doc, setDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { 
  createViewingEvent,
  generateEventId,
  cleanDateTimeUTC,
  createAnalyticsDeviceInfo 
} from '@shared/utils/analytics';
import {
  getViewingEventPath,
  getUserPieceInteractionPath,
  getUserSessionPath,
  getPieceStatsPath,
  getFavoritePiecePath
} from '@shared/constants/firebase-paths';
import type { 
  AnalyticsViewingEvent,
  UserPieceView 
} from '@shared/types/analytics';
import type { GalleryUser } from '@shared/types/auth';

interface AnalyticsState {
  currentPieceView: UserPieceView | null;
  viewStartTime: number;
  sessionStartTime: number;
  lastActivityTime: number;
}

class AnalyticsService {
  private state: AnalyticsState = {
    currentPieceView: null,
    viewStartTime: 0,
    sessionStartTime: 0,
    lastActivityTime: 0
  };

  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 60000; // 1 minute

  /**
   * Start analytics session - matches Unity client's StartAnalyticsSession
   */
  async startSession(user: GalleryUser, galleryId: string, sessionId: string): Promise<void> {
    try {
      console.log('[Analytics] Starting session:', sessionId);

      const now = cleanDateTimeUTC();
      const deviceInfo = createAnalyticsDeviceInfo();

      // Create session document in Firestore
      const sessionData = {
        userId: user.userId,
        sessionId,
        startTime: now,
        lastActivity: now,
        endTime: null,
        duration: 0,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.operatingSystem,
        screenResolution: deviceInfo.screenResolution,
        isGuided: false,
        accessCode: user.codeValue
      };

      await setDoc(
        doc(db, getUserSessionPath(galleryId, sessionId)),
        sessionData
      );

      // Initialize state
      this.state.sessionStartTime = Date.now();
      this.state.lastActivityTime = Date.now();

      // Start periodic updates
      this.startPeriodicUpdates(user, galleryId, sessionId);

      console.log('[Analytics] Session started successfully');

    } catch (error) {
      console.error('[Analytics] Failed to start session:', error);
    }
  }

  /**
   * Record piece view - matches Unity client's RecordPieceView
   */
  async recordPieceView(
    user: GalleryUser, 
    galleryId: string, 
    collectionId: string, 
    pieceId: string, 
    sessionId: string
  ): Promise<void> {
    try {
      // End previous piece view if exists
      if (this.state.currentPieceView) {
        await this.endCurrentPieceView(user, galleryId);
      }

      const now = cleanDateTimeUTC();
      const eventId = generateEventId('view', pieceId, user.userId!);

      // Create viewing event
      const viewingEvent = createViewingEvent(
        galleryId,
        user.userId!,
        collectionId,
        pieceId,
        'view',
        sessionId,
        0
      );

      // Save viewing event
      await setDoc(
        doc(db, getViewingEventPath(eventId)),
        viewingEvent
      );

      // Create or update user-piece interaction
      const interactionPath = getUserPieceInteractionPath(galleryId, user.userId!, pieceId);
      const interactionData = {
        gallery_id: galleryId,
        user_id: user.userId,
        piece_id: pieceId,
        last_viewed: now,
        view_count: increment(1),
        collection_ids: [collectionId],
        last_updated: now
      };

      await setDoc(doc(db, interactionPath), interactionData, { merge: true });

      // Update piece stats (create if doesn't exist)
      await setDoc(doc(db, getPieceStatsPath(pieceId)), {
        pieceId: pieceId,
        totalViews: increment(1),
        uniqueViewers: arrayUnion(user.userId),
        lastUpdated: now
      }, { merge: true });

      // Track current piece view
      this.state.currentPieceView = {
        Id: eventId,
        PieceId: pieceId,
        ViewDuration: 0,
        EventId: eventId
      };
      this.state.viewStartTime = Date.now();

      console.log('[Analytics] Piece view recorded:', pieceId);

    } catch (error) {
      console.error('[Analytics] Failed to record piece view:', error);
    }
  }

  /**
   * Record interaction event (zoom, description view, etc.)
   */
  async recordInteractionEvent(
    user: GalleryUser,
    galleryId: string,
    collectionId: string,
    pieceId: string,
    sessionId: string,
    eventType: AnalyticsViewingEvent['event_type']
  ): Promise<void> {
    try {
      const eventId = generateEventId(eventType, pieceId, user.userId!);

      const interactionEvent = createViewingEvent(
        galleryId,
        user.userId!,
        collectionId,
        pieceId,
        eventType,
        sessionId,
        0
      );

      await setDoc(
        doc(db, getViewingEventPath(eventId)),
        interactionEvent
      );

      // Update interaction counts
      const interactionPath = getUserPieceInteractionPath(galleryId, user.userId!, pieceId);
      const updateData: any = {
        last_updated: cleanDateTimeUTC()
      };

      if (eventType === 'zoom' || eventType === 'zoom_in' || eventType === 'zoom_out') {
        updateData.zoom_count = increment(1);
      } else if (eventType === 'read_description') {
        updateData.description_views = increment(1);
      }

      await updateDoc(doc(db, interactionPath), updateData);

      console.log('[Analytics] Interaction recorded:', eventType, pieceId);

    } catch (error) {
      console.error('[Analytics] Failed to record interaction:', error);
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    user: GalleryUser,
    galleryId: string,
    collectionId: string,
    pieceId: string,
    sessionId: string,
    isFavorite: boolean
  ): Promise<void> {
    try {
      const now = cleanDateTimeUTC();

      // Record favorite/unfavorite event
      await this.recordInteractionEvent(
        user,
        galleryId,
        collectionId,
        pieceId,
        sessionId,
        isFavorite ? 'favorite' : 'unfavorite'
      );

      // Update favorites collection
      const favoriteData = {
        userId: user.userId,
        isOn: isFavorite,
        modifiedDateTime: now,
        pieceId
      };

      await setDoc(
        doc(db, getFavoritePiecePath(user.userId!, pieceId)),
        favoriteData
      );

      // Update user-piece interaction (create if doesn't exist)
      const interactionPath = getUserPieceInteractionPath(galleryId, user.userId!, pieceId);
      await setDoc(doc(db, interactionPath), {
        gallery_id: galleryId,
        user_id: user.userId,
        piece_id: pieceId,
        favorite: isFavorite,
        last_updated: now,
        collection_ids: [collectionId]
      }, { merge: true });

      console.log('[Analytics] Favorite toggled:', pieceId, isFavorite);

    } catch (error) {
      console.error('[Analytics] Failed to toggle favorite:', error);
    }
  }

  /**
   * End current piece view and record duration
   */
  private async endCurrentPieceView(user: GalleryUser, galleryId: string): Promise<void> {
    if (!this.state.currentPieceView) return;

    try {
      const viewDuration = Date.now() - this.state.viewStartTime;
      const durationSeconds = Math.floor(viewDuration / 1000);

      // Update viewing event with duration
      await updateDoc(
        doc(db, getViewingEventPath(this.state.currentPieceView.EventId)),
        {
          duration_ms: viewDuration
        }
      );

      // Update user-piece interaction with total duration
      const interactionPath = getUserPieceInteractionPath(
        galleryId, 
        user.userId!, 
        this.state.currentPieceView.PieceId
      );
      await updateDoc(doc(db, interactionPath), {
        total_duration_ms: increment(viewDuration),
        last_updated: cleanDateTimeUTC()
      });

      console.log('[Analytics] Piece view ended:', this.state.currentPieceView.PieceId, `${durationSeconds}s`);

    } catch (error) {
      console.error('[Analytics] Failed to end piece view:', error);
    }

    this.state.currentPieceView = null;
  }

  /**
   * Start periodic session updates
   */
  private startPeriodicUpdates(user: GalleryUser, galleryId: string, sessionId: string): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const sessionDuration = Math.floor((Date.now() - this.state.sessionStartTime) / 1000);

        await updateDoc(doc(db, getUserSessionPath(galleryId, sessionId)), {
          lastActivity: cleanDateTimeUTC(),
          duration: sessionDuration
        });

        this.state.lastActivityTime = Date.now();

      } catch (error) {
        console.error('[Analytics] Failed to update session:', error);
      }
    }, this.UPDATE_INTERVAL);
  }

  /**
   * End analytics session
   */
  async endSession(user: GalleryUser, galleryId: string, sessionId: string): Promise<void> {
    try {
      // End current piece view
      if (this.state.currentPieceView) {
        await this.endCurrentPieceView(user, galleryId);
      }

      // Update session end time
      const sessionDuration = Math.floor((Date.now() - this.state.sessionStartTime) / 1000);
      
      await updateDoc(doc(db, getUserSessionPath(galleryId, sessionId)), {
        endTime: cleanDateTimeUTC(),
        duration: sessionDuration,
        lastActivity: cleanDateTimeUTC()
      });

      // Clear periodic updates
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Reset state
      this.state = {
        currentPieceView: null,
        viewStartTime: 0,
        sessionStartTime: 0,
        lastActivityTime: 0
      };

      console.log('[Analytics] Session ended:', sessionId, `${sessionDuration}s`);

    } catch (error) {
      console.error('[Analytics] Failed to end session:', error);
    }
  }

  /**
   * Record activity to update last activity time
   */
  recordActivity(): void {
    this.state.lastActivityTime = Date.now();
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;