import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Info, Grid, List, Heart, Users } from 'lucide-react';
import { useGalleryStore } from '../../stores/galleryStore';
import { useAuthStore } from '../../stores/authStore';
import ImageWithFallback from '../common/ImageWithFallback';
import ArtistInfo from './ArtistInfo';
import PieceThumbnail from './PieceThumbnail';
import FavoritesView from './FavoritesView';
import { getStorageUrl } from '../../lib/firebase';

export default function ArtistSidebar() {
  const { user } = useAuthStore();
  const { 
    artists, 
    selectedArtistId, 
    selectArtist, 
    selectPiece,
    getPiecesForArtist,
    searchQuery,
    showingFavorites,
    setShowingFavorites,
    loadFavorites 
  } = useGalleryStore();
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showArtistInfo, setShowArtistInfo] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20); // Start with first 20 artists
  const [animatePieces, setAnimatePieces] = useState<string | null>(null); // Track which artist's pieces to animate
  const prevViewMode = useRef(viewMode);

  // Load favorites when component mounts and user is available
  useEffect(() => {
    if (user?.userId) {
      loadFavorites(user.userId);
    }
  }, [user?.userId, loadFavorites]);

  // Trigger piece animation when artist selection or view mode changes
  useEffect(() => {
    if (selectedArtistId && (selectedArtistId !== animatePieces || viewMode !== prevViewMode.current)) {
      setAnimatePieces(selectedArtistId);
      prevViewMode.current = viewMode;
      const timer = setTimeout(() => setAnimatePieces(null), 50);
      return () => clearTimeout(timer);
    }
  }, [selectedArtistId, viewMode, animatePieces]);

  // Performance optimization: limit initial render for large artist lists
  const visibleArtists = useMemo(() => {
    return artists.slice(0, visibleCount);
  }, [artists, visibleCount]);

  const hasMoreArtists = artists.length > visibleCount;

  const loadMoreArtists = () => {
    setVisibleCount(prev => Math.min(prev + 20, artists.length));
  };

  const handleArtistClick = (artistId: string) => {
    if (selectedArtistId === artistId) {
      selectArtist(null); // Deselect if clicking same artist
    } else {
      selectArtist(artistId);
      selectPiece(null); // Clear piece selection
    }
  };

  const handlePieceClick = async (pieceId: string, pieceImagePath: string) => {
    selectPiece(pieceId);
  };

  const handleArtistInfoClick = (artistId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowArtistInfo(showArtistInfo === artistId ? null : artistId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 bg-white">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setShowingFavorites(false)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              !showingFavorites
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Artists</span>
              <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {artists.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setShowingFavorites(true)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              showingFavorites
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Favorites</span>
            </div>
          </button>
        </div>

        {/* Controls - only show for Artists tab */}
        {!showingFavorites && (
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchQuery ? 'Search Results' : 'Artists'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery ? `${artists.length} results` : `${visibleCount} of ${artists.length} ${artists.length === 1 ? 'artist' : 'artists'}`}
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content - either Artists List or Favorites */}
      {showingFavorites ? (
        <FavoritesView />
      ) : (
        <div className="flex-1 overflow-y-auto">
        {visibleArtists.map((artist, index) => {
          const artistPieces = getPiecesForArtist(artist.artistId!);
          const isSelected = selectedArtistId === artist.artistId;
          const showingInfo = showArtistInfo === artist.artistId;

          return (
            <motion.div
              key={artist.artistId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100"
            >
              {/* Artist Header */}
              <div className={`p-4 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-primary-50 border-r-2 border-primary-500' : ''
              }`}>
                <div className="flex items-center space-x-3">
                  {/* Artist Image */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                    {artist.imagePath ? (
                      <ImageWithFallback
                        path={artist.imagePath}
                        alt={artist.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Artist Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleArtistClick(artist.artistId!)}
                      className="text-left w-full"
                    >
                      <h3 className={`font-medium truncate ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                        {artist.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {artistPieces.length} {artistPieces.length === 1 ? 'piece' : 'pieces'}
                      </p>
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleArtistInfoClick(artist.artistId!, e)}
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        showingInfo ? 'bg-gray-200 text-primary-600' : 'text-gray-400'
                      }`}
                      title="Artist Info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArtistClick(artist.artistId!)}
                      className="p-1"
                    >
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Artist Info */}
              <ArtistInfo artist={artist} isVisible={showingInfo} />

              {/* Pieces Display */}
              {isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50"
                >
                  {viewMode === 'grid' ? (
                    /* Grid View - Visual focus, no titles, with favorites */
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {artistPieces.map((piece, index) => {
                        const shouldAnimate = animatePieces === artist.artistId;
                        return (
                          <motion.div
                            key={`${piece.id}-${shouldAnimate ? 'animate' : 'static'}`}
                            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={shouldAnimate ? { delay: index * 0.05, duration: 0.3 } : { duration: 0 }}
                          >
                            <PieceThumbnail
                              piece={piece}
                              onClick={() => handlePieceClick(piece.id!, piece.image_full_path || piece.image_half_path || piece.thumbnail_path)}
                              className="aspect-square bg-gray-200 rounded overflow-hidden"
                              showTitle={false}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* List View - Traditional list with titles and favorites */
                    <div>
                      {artistPieces.map((piece, index) => {
                        const shouldAnimate = animatePieces === artist.artistId;
                        return (
                          <motion.div 
                            key={`${piece.id}-list-${shouldAnimate ? 'animate' : 'static'}`} 
                            className="w-full p-3 pl-8 hover:bg-gray-100 transition-colors"
                            initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={shouldAnimate ? { delay: index * 0.05, duration: 0.3 } : { duration: 0 }}
                          >
                          <div className="flex items-center space-x-3">
                            <PieceThumbnail
                              piece={piece}
                              onClick={() => handlePieceClick(piece.id!, piece.image_full_path || piece.image_half_path || piece.thumbnail_path)}
                              className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden"
                              showTitle={false}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {piece.title}
                              </p>
                              {piece.date && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {piece.date}
                                </p>
                              )}
                            </div>
                          </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
        
        {/* Load More Button */}
        {hasMoreArtists && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={loadMoreArtists}
              className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Load More Artists ({artists.length - visibleCount} remaining)
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}