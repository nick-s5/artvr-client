import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getCollectionsCollection,
  getArtistsCollection,
  getPiecesCollection 
} from '../lib/collections';
import type { 
  Collection, 
  Artist, 
  Piece 
} from '@shared/types/firestore';

interface GalleryData {
  collection: Collection;
  artists: Artist[];
  pieces: Piece[];
  artistPieceMap: Map<string, Piece[]>;
}

class GalleryService {
  /**
   * Load complete gallery data for a collection
   * Matches the Unity client's LoadCollection flow
   */
  async loadGalleryData(galleryId: string, collectionId: string): Promise<GalleryData> {
    try {
      console.log(`[Gallery] Loading collection ${collectionId} for gallery ${galleryId}`);

      // 1. Load the collection document
      const collectionRef = doc(getCollectionsCollection(galleryId), collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (!collectionDoc.exists()) {
        throw new Error('Collection not found');
      }

      const collection = {
        ...collectionDoc.data(),
        collectionId: collectionDoc.id
      } as Collection;

      console.log(`[Gallery] Collection loaded:`, collection);

      // 2. Extract artist IDs and piece IDs from collection
      const artistIds = Object.keys(collection.artists || {});
      const pieceIds = new Set<string>();

      // Build piece ID set from collection artists
      Object.entries(collection.artists || {}).forEach(([artistId, artistData]) => {
        if (Array.isArray(artistData)) {
          // Handle array format
          artistData.forEach(pieceId => pieceIds.add(pieceId));
        } else if (artistData && typeof artistData === 'object' && 'pieces' in artistData) {
          // Handle object format with pieces array
          const pieces = (artistData as any).pieces;
          if (Array.isArray(pieces)) {
            pieces.forEach(pieceId => pieceIds.add(pieceId));
          }
        }
      });

      console.log(`[Gallery] Found ${artistIds.length} artists and ${pieceIds.size} pieces`);

      // 3. Load artists
      const artists = await this.loadArtists(galleryId, artistIds);

      // 4. Load pieces in chunks (Firestore 'in' query limit is 10)
      const pieces = await this.loadPieces(galleryId, Array.from(pieceIds));

      // 5. Create artist-piece mapping
      const artistPieceMap = this.createArtistPieceMap(collection, pieces);

      console.log(`[Gallery] Gallery data loaded successfully`);

      return {
        collection,
        artists,
        pieces,
        artistPieceMap
      };

    } catch (error) {
      console.error('[Gallery] Failed to load gallery data:', error);
      throw error;
    }
  }

  /**
   * Load multiple artists by ID
   */
  private async loadArtists(galleryId: string, artistIds: string[]): Promise<Artist[]> {
    if (artistIds.length === 0) return [];

    const artistsCollection = getArtistsCollection(galleryId);
    const artists: Artist[] = [];

    // Load artists in chunks of 10 (Firestore limit)
    const chunks = this.chunkArray(artistIds, 10);
    
    for (const chunk of chunks) {
      const artistsQuery = query(
        artistsCollection,
        where('__name__', 'in', chunk)
      );
      
      const snapshot = await getDocs(artistsQuery);
      
      snapshot.docs.forEach(doc => {
        artists.push({
          ...doc.data(),
          artistId: doc.id
        } as Artist);
      });
    }

    // Sort artists by lastName for consistent display
    return artists.sort((a, b) => {
      const aName = this.getLastName(a.displayName);
      const bName = this.getLastName(b.displayName);
      return aName.localeCompare(bName);
    });
  }

  /**
   * Load multiple pieces by ID
   */
  private async loadPieces(galleryId: string, pieceIds: string[]): Promise<Piece[]> {
    if (pieceIds.length === 0) return [];

    const piecesCollection = getPiecesCollection(galleryId);
    const pieces: Piece[] = [];

    // Load pieces in chunks of 10 (Firestore limit)
    const chunks = this.chunkArray(pieceIds, 10);
    
    for (const chunk of chunks) {
      const piecesQuery = query(
        piecesCollection,
        where('__name__', 'in', chunk),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(piecesQuery);
      
      snapshot.docs.forEach(doc => {
        pieces.push({
          ...doc.data(),
          id: doc.id
        } as Piece);
      });
    }

    return pieces;
  }

  /**
   * Create mapping of artist ID to their pieces
   */
  private createArtistPieceMap(collection: Collection, pieces: Piece[]): Map<string, Piece[]> {
    const artistPieceMap = new Map<string, Piece[]>();

    // Initialize map with empty arrays for each artist
    Object.keys(collection.artists || {}).forEach(artistId => {
      artistPieceMap.set(artistId, []);
    });

    // Group pieces by artist
    pieces.forEach(piece => {
      const artistId = piece.artistID;
      if (artistPieceMap.has(artistId)) {
        artistPieceMap.get(artistId)!.push(piece);
      }
    });

    // Sort pieces within each artist by title
    artistPieceMap.forEach(pieces => {
      pieces.sort((a, b) => a.title.localeCompare(b.title));
    });

    return artistPieceMap;
  }

  /**
   * Get pieces for a specific artist
   */
  getPiecesForArtist(artistPieceMap: Map<string, Piece[]>, artistId: string): Piece[] {
    return artistPieceMap.get(artistId) || [];
  }

  /**
   * Search pieces by title or artist name
   */
  searchPieces(pieces: Piece[], artists: Artist[], query: string): Piece[] {
    if (!query.trim()) return pieces;

    const searchTerm = query.toLowerCase().trim();
    const artistMap = new Map(artists.map(artist => [artist.artistId!, artist]));

    return pieces.filter(piece => {
      // Search by piece title
      if (piece.title.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search by artist name
      const artist = artistMap.get(piece.artistID);
      if (artist && artist.displayName.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Utility: Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility: Extract last name from display name
   */
  private getLastName(displayName: string): string {
    const parts = displayName.trim().split(' ');
    return parts[parts.length - 1] || displayName;
  }
}

// Export singleton instance
export const galleryService = new GalleryService();
export default galleryService;