// Client-specific Firebase collection helpers
import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Gallery, 
  Artist, 
  Collection, 
  GalleryUser, 
  PieceStats, 
  PieceView, 
  UserSession, 
  AnalyticsCache, 
  AnalyticsHistory, 
  Favorite, 
  Piece 
} from '@shared/types/firestore';

// Helper functions
function createCollection<T>(path: string) {
  return collection(db, path) as CollectionReference<T>;
}

function createDoc<T>(path: string) {
  return doc(db, path) as DocumentReference<T>;
}

// Gallery collections
export const getGalleriesCollection = () => createCollection<Gallery>('galleries');
export const getGalleryDoc = (galleryId: string) => createDoc<Gallery>(`galleries/${galleryId}`);

// Collection-related collections  
export const getCollectionsCollection = (galleryId: string) => 
  createCollection<Collection>(`galleries/${galleryId}/collections`);

export const getCollectionDoc = (galleryId: string, collectionId: string) =>
  createDoc<Collection>(`galleries/${galleryId}/collections/${collectionId}`);

// Artist collections
export const getArtistsCollection = (galleryId: string) =>
  createCollection<Artist>(`galleries/${galleryId}/artists`);

export const getArtistDoc = (galleryId: string, artistId: string) =>
  createDoc<Artist>(`galleries/${galleryId}/artists/${artistId}`);

// Piece collections
export const getPiecesCollection = (galleryId: string) =>
  createCollection<Piece>(`galleries/${galleryId}/pieces`);

export const getPieceDoc = (galleryId: string, pieceId: string) =>
  createDoc<Piece>(`galleries/${galleryId}/pieces/${pieceId}`);

// User collections
export const getUsersCollection = (galleryId: string) =>
  createCollection<GalleryUser>(`galleries/${galleryId}/users`);

export const getUserDoc = (galleryId: string, userId: string) =>
  createDoc<GalleryUser>(`galleries/${galleryId}/users/${userId}`);

// Analytics collections
export const getUserSessionsCollection = (galleryId: string) =>
  createCollection<UserSession>(`galleries/${galleryId}/userSessions`);

export const getPieceViewsCollection = () =>
  createCollection<PieceView>('viewing_events');

export const getPieceStatsCollection = () =>
  createCollection<PieceStats>('pieceStats');

// Favorites collections  
export const getFavoritesCollection = (userId: string) =>
  createCollection<Favorite>(`favorites/${userId}/pieces`);

export const getFavoriteDoc = (userId: string, pieceId: string) =>
  createDoc<Favorite>(`favorites/${userId}/pieces/${pieceId}`);

// Cache and history collections
export const getAnalyticsCacheCollection = (galleryId: string) =>
  createCollection<AnalyticsCache>(`galleries/${galleryId}/analyticsCache`);

export const getAnalyticsHistoryCollection = (galleryId: string) =>
  createCollection<AnalyticsHistory>(`galleries/${galleryId}/analyticsHistory`);