import { doc, getDoc, onSnapshot, Unsubscribe, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getFavoritePiecePath, getFavoritesPath } from '@shared/constants/firebase-paths';
import type { GalleryUser } from '@shared/types/firestore';

interface FavoriteItem {
  pieceId: string;
  userId: string;
  isOn: boolean;
  modifiedDateTime: string;
}

class FavoritesService {
  private favoritesCache = new Map<string, boolean>();
  private unsubscribers = new Map<string, Unsubscribe>();
  private callbacks = new Map<string, Set<(isFavorited: boolean) => void>>();

  /**
   * Check if a piece is favorited by the user
   */
  async isFavorited(userId: string, pieceId: string): Promise<boolean> {
    const cacheKey = `${userId}_${pieceId}`;
    
    // Return cached result if available
    if (this.favoritesCache.has(cacheKey)) {
      return this.favoritesCache.get(cacheKey)!;
    }

    try {
      const favDocRef = doc(db, getFavoritePiecePath(userId, pieceId));
      const favDoc = await getDoc(favDocRef);
      
      const isFavorited = favDoc.exists() && favDoc.data()?.isOn === true;
      this.favoritesCache.set(cacheKey, isFavorited);
      
      return isFavorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Get favorites for multiple pieces (for grid/list view)
   */
  async getFavoritesForPieces(userId: string, pieceIds: string[]): Promise<Map<string, boolean>> {
    const favoritesMap = new Map<string, boolean>();
    
    // Check cache first
    const uncachedPieceIds: string[] = [];
    for (const pieceId of pieceIds) {
      const cacheKey = `${userId}_${pieceId}`;
      if (this.favoritesCache.has(cacheKey)) {
        favoritesMap.set(pieceId, this.favoritesCache.get(cacheKey)!);
      } else {
        uncachedPieceIds.push(pieceId);
      }
    }

    // Fetch uncached favorites
    const promises = uncachedPieceIds.map(async (pieceId) => {
      const isFavorited = await this.isFavorited(userId, pieceId);
      favoritesMap.set(pieceId, isFavorited);
      return { pieceId, isFavorited };
    });

    await Promise.all(promises);
    return favoritesMap;
  }

  /**
   * Subscribe to real-time favorite status changes for a piece
   */
  subscribeToFavoriteStatus(
    userId: string, 
    pieceId: string, 
    callback: (isFavorited: boolean) => void
  ): Unsubscribe {
    const cacheKey = `${userId}_${pieceId}`;
    const favoritePath = getFavoritePiecePath(userId, pieceId);
    
    // Add callback to the set for this piece
    if (!this.callbacks.has(cacheKey)) {
      this.callbacks.set(cacheKey, new Set());
    }
    this.callbacks.get(cacheKey)!.add(callback);
    
    // Only create one Firestore subscription per piece
    if (!this.unsubscribers.has(cacheKey)) {
      
      const favDocRef = doc(db, favoritePath);
      
      const unsubscribe = onSnapshot(favDocRef, (doc) => {
        const isFavorited = doc.exists() && doc.data()?.isOn === true;
        
        // Update cache
        this.favoritesCache.set(cacheKey, isFavorited);
        
        // Notify all callbacks for this piece
        const callbackSet = this.callbacks.get(cacheKey);
        if (callbackSet) {
          callbackSet.forEach(cb => cb(isFavorited));
        }
      }, (error) => {
        console.error('Error subscribing to favorite status:', error);
        // Notify all callbacks of error
        const callbackSet = this.callbacks.get(cacheKey);
        if (callbackSet) {
          callbackSet.forEach(cb => cb(false));
        }
      });

      this.unsubscribers.set(cacheKey, unsubscribe);
    } else {
      // Subscription already exists, just call the callback with current cached value
      const cached = this.favoritesCache.get(cacheKey);
      if (cached !== undefined) {
        callback(cached);
      }
    }
    
    // Return unsubscribe function that only removes this callback
    return () => {
      const callbackSet = this.callbacks.get(cacheKey);
      if (callbackSet) {
        callbackSet.delete(callback);
        
        // If no more callbacks, clean up the Firestore subscription
        if (callbackSet.size === 0) {
          this.callbacks.delete(cacheKey);
          const unsubscribe = this.unsubscribers.get(cacheKey);
          if (unsubscribe) {
            unsubscribe();
            this.unsubscribers.delete(cacheKey);
          }
        }
      }
    };
  }

  /**
   * Clear cache for a specific user-piece combination
   */
  clearCache(userId: string, pieceId: string): void {
    const cacheKey = `${userId}_${pieceId}`;
    this.favoritesCache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.favoritesCache.clear();
    
    // Clean up all subscriptions
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }

  /**
   * Get all favorited pieces for a user
   */
  async getAllFavorites(userId: string): Promise<string[]> {
    try {
      const favoritesCollectionRef = collection(db, getFavoritesPath(userId), 'pieces');
      const favoritesQuery = query(favoritesCollectionRef, where('isOn', '==', true));
      const snapshot = await getDocs(favoritesQuery);
      
      const favoritedPieceIds: string[] = [];
      snapshot.forEach(doc => {
        favoritedPieceIds.push(doc.id);
      });
      
      return favoritedPieceIds;
    } catch (error) {
      console.error('Error getting all favorites:', error);
      return [];
    }
  }

  /**
   * Update cache when favorite is toggled (called after successful toggle)
   */
  updateCache(userId: string, pieceId: string, isFavorited: boolean): void {
    const cacheKey = `${userId}_${pieceId}`;
    this.favoritesCache.set(cacheKey, isFavorited);
  }
}

export default new FavoritesService();