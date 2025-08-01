import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Grid, List, Heart } from 'lucide-react';
import { useGalleryStore } from '../../stores/galleryStore';
import PieceThumbnail from './PieceThumbnail';
import type { Piece } from '@shared/types/firestore';

export default function FavoritesView() {
  const { 
    favoritedPieces, 
    isLoadingFavorites,
    selectPiece 
  } = useGalleryStore();
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const prevPiecesLength = useRef(favoritedPieces.length);
  const prevViewMode = useRef(viewMode);

  // Reset animation when component first mounts, pieces change, or view mode changes
  useEffect(() => {
    if (favoritedPieces.length !== prevPiecesLength.current || viewMode !== prevViewMode.current) {
      setShouldAnimate(true);
      prevPiecesLength.current = favoritedPieces.length;
      prevViewMode.current = viewMode;
      
      // Reset animation after a short delay to allow for re-triggering
      const timer = setTimeout(() => setShouldAnimate(false), 50);
      return () => clearTimeout(timer);
    }
  }, [favoritedPieces.length, viewMode]);

  const handlePieceClick = async (pieceId: string, pieceImagePath: string) => {
    selectPiece(pieceId);
  };

  if (isLoadingFavorites) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (favoritedPieces.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-500">Heart pieces to add them to your favorites</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            <h2 className="text-lg font-semibold text-gray-900">
              Your Favorites
            </h2>
            <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {favoritedPieces.length}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Favorites Grid/List */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          /* Grid View - Visual focus, no titles */
          <div className="grid grid-cols-2 gap-1 p-2">
            {favoritedPieces.map((piece, index) => (
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
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View - Traditional list with titles */
          <div>
            {favoritedPieces.map((piece, index) => (
              <motion.div
                key={`${piece.id}-list-${shouldAnimate ? 'animate' : 'static'}`}
                initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={shouldAnimate ? { delay: index * 0.05, duration: 0.3 } : { duration: 0 }}
                className="w-full p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
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
                    {piece.artist_display_name && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        by {piece.artist_display_name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}