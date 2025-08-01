import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import galleryService from '../services/galleryService';
import favoritesService from '../services/favoritesService';
import type { Collection, Artist, Piece } from '@shared/types/firestore';

interface GalleryState {
  // Data
  collection: Collection | null;
  artists: Artist[];
  pieces: Piece[];
  artistPieceMap: Map<string, Piece[]>;
  favoritedPieces: Piece[];
  
  // UI State
  selectedArtistId: string | null;
  selectedPieceId: string | null;
  searchQuery: string;
  showingFavorites: boolean;
  isLoading: boolean;
  isLoadingFavorites: boolean;
  error: string | null;
}

interface GalleryActions {
  loadGallery: (galleryId: string, collectionId: string) => Promise<void>;
  loadFavorites: (userId: string) => Promise<void>;
  selectArtist: (artistId: string | null) => void;
  selectPiece: (pieceId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowingFavorites: (showing: boolean) => void;
  getPiecesForArtist: (artistId: string) => Piece[];
  getCurrentPiece: () => Piece | null;
  getCurrentArtist: () => Artist | null;
  getFilteredPieces: () => Piece[];
  clearError: () => void;
  reset: () => void;
}

export const useGalleryStore = create<GalleryState & GalleryActions>()(
  devtools(
    (set, get) => ({
      // Initial State
      collection: null,
      artists: [],
      pieces: [],
      artistPieceMap: new Map(),
      favoritedPieces: [],
      selectedArtistId: null,
      selectedPieceId: null,
      searchQuery: '',
      showingFavorites: false,
      isLoading: false,
      isLoadingFavorites: false,
      error: null,

      // Computed properties (These don't work as getters in Zustand, they're computed in the component)

      // Actions
      loadGallery: async (galleryId: string, collectionId: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          console.log('[Gallery Store] Loading gallery data...');
          
          const galleryData = await galleryService.loadGalleryData(galleryId, collectionId);

          set({
            collection: galleryData.collection,
            artists: galleryData.artists,
            pieces: galleryData.pieces,
            artistPieceMap: galleryData.artistPieceMap,
            isLoading: false,
            error: null
          });

          console.log('[Gallery Store] Gallery loaded successfully');

        } catch (error) {
          console.error('[Gallery Store] Failed to load gallery:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load gallery'
          });
        }
      },

      loadFavorites: async (userId: string): Promise<void> => {
        set({ isLoadingFavorites: true });

        try {
          console.log('[Gallery Store] Loading user favorites...');
          
          const favoritedPieceIds = await favoritesService.getAllFavorites(userId);
          const { pieces } = get();
          
          // Filter pieces to only include favorited ones
          const favoritedPieces = pieces.filter(piece => 
            favoritedPieceIds.includes(piece.id!)
          );

          set({
            favoritedPieces,
            isLoadingFavorites: false
          });

          console.log('[Gallery Store] Favorites loaded successfully:', favoritedPieces.length);

        } catch (error) {
          console.error('[Gallery Store] Failed to load favorites:', error);
          set({
            isLoadingFavorites: false,
            error: error instanceof Error ? error.message : 'Failed to load favorites'
          });
        }
      },

      selectArtist: (artistId: string | null) => {
        set({ 
          selectedArtistId: artistId,
          selectedPieceId: null, // Clear piece selection when changing artist
          searchQuery: '' // Clear search when selecting artist
        });
      },

      selectPiece: (pieceId: string | null) => {
        set({ selectedPieceId: pieceId });
      },

      setSearchQuery: (query: string) => {
        set({ 
          searchQuery: query,
          selectedArtistId: null, // Clear artist selection when searching
          showingFavorites: false // Exit favorites view when searching
        });
      },

      setShowingFavorites: (showing: boolean) => {
        set({ 
          showingFavorites: showing,
          selectedArtistId: null, // Clear artist selection when switching to favorites
          searchQuery: '' // Clear search when switching to favorites
        });
      },

      getPiecesForArtist: (artistId: string): Piece[] => {
        const { artistPieceMap } = get();
        return galleryService.getPiecesForArtist(artistPieceMap, artistId);
      },

      getCurrentPiece: (): Piece | null => {
        const { pieces, selectedPieceId } = get();
        if (!selectedPieceId) return null;
        return pieces.find(piece => piece.id === selectedPieceId) || null;
      },

      getCurrentArtist: (): Artist | null => {
        const { artists, selectedArtistId } = get();
        if (!selectedArtistId) return null;
        return artists.find(artist => artist.artistId === selectedArtistId) || null;
      },

      getFilteredPieces: (): Piece[] => {
        const { pieces, artists, searchQuery, selectedArtistId, artistPieceMap } = get();
        
        let filteredPieces = pieces;

        // Filter by selected artist
        if (selectedArtistId) {
          filteredPieces = artistPieceMap.get(selectedArtistId) || [];
        }

        // Filter by search query
        if (searchQuery.trim()) {
          filteredPieces = galleryService.searchPieces(filteredPieces, artists, searchQuery);
        }

        return filteredPieces;
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          collection: null,
          artists: [],
          pieces: [],
          artistPieceMap: new Map(),
          favoritedPieces: [],
          selectedArtistId: null,
          selectedPieceId: null,
          searchQuery: '',
          showingFavorites: false,
          isLoading: false,
          isLoadingFavorites: false,
          error: null
        });
      }
    }),
    {
      name: 'gallery-store'
    }
  )
);