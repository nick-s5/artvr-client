import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useAuthStore } from '../../stores/authStore';
import { useGalleryStore } from '../../stores/galleryStore';
import analyticsService from '../../services/analyticsService';
import favoritesService from '../../services/favoritesService';
import ImageWithFallback from '../common/ImageWithFallback';
import { useStorageUrl } from '../../hooks/useStorageUrl';
import type { Piece } from '@shared/types/firestore';

interface PieceViewerProps {
  piece: Piece;
}

export default function PieceViewer({ piece }: PieceViewerProps) {
  const { user, galleryId, sessionId } = useAuthStore();
  const { collection, artists } = useGalleryStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [nextImageUrl, setNextImageUrl] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPieceId, setCurrentPieceId] = useState<string | null>(null);
  
  // Get the image URL using the storage hook
  const { url: imageUrl, loading: imageLoading } = useStorageUrl(
    piece.image_full_path || piece.image_half_path || piece.thumbnail_path
  );

  // Handle piece changes and image preloading
  useEffect(() => {
    console.log('🎬 Piece changed from', currentPieceId, 'to', piece.id);
    
    // If this is a new piece, start the transition process
    if (piece.id !== currentPieceId) {
      setCurrentPieceId(piece.id);
      setIsTransitioning(true);
      setNextImageUrl(null);
      
      // The useStorageUrl hook will start loading the new image
      console.log('🎬 Starting to load new piece:', piece.id);
    }
  }, [piece.id, currentPieceId]);

  // Handle when new image URL is ready
  useEffect(() => {
    console.log('🎬 Image URL effect - imageUrl:', !!imageUrl, 'loading:', imageLoading, 'currentImageUrl:', !!currentImageUrl);
    
    if (imageUrl && piece.id === currentPieceId) {
      console.log('🎬 New image URL ready, preparing transition');
      setNextImageUrl(imageUrl);
      
      // Wait a moment then transition
      const timer = setTimeout(() => {
        console.log('🎬 Executing transition to new image');
        setCurrentImageUrl(imageUrl);
        setNextImageUrl(null);
        setIsTransitioning(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [imageUrl, imageLoading, piece.id, currentPieceId]);

  // Find the artist for this piece
  const artist = artists.find(a => a.artistId === piece.artistID);

  useEffect(() => {
    // Record piece view when component mounts
    if (user && galleryId && collection && sessionId) {
      analyticsService.recordPieceView(
        user,
        galleryId,
        collection.collectionId,
        piece.id!,
        sessionId
      );
    }

    // Load initial favorite status and subscribe to changes
    if (user?.userId && piece.id) {
      const unsubscribe = favoritesService.subscribeToFavoriteStatus(
        user.userId,
        piece.id,
        (isFavorited) => {
          setIsFavorite(isFavorited);
        }
      );

      // Load initial state
      favoritesService.isFavorited(user.userId, piece.id).then(setIsFavorite);

      // Track activity for analytics
      const trackActivity = () => analyticsService.recordActivity();
      window.addEventListener('mousemove', trackActivity);
      window.addEventListener('keydown', trackActivity);
      window.addEventListener('scroll', trackActivity);

      return () => {
        unsubscribe();
        window.removeEventListener('mousemove', trackActivity);
        window.removeEventListener('keydown', trackActivity);
        window.removeEventListener('scroll', trackActivity);
      };
    }
  }, [piece.id, user, galleryId, collection, sessionId]);

  const handleFavoriteToggle = async () => {
    if (!user || !galleryId || !collection || !sessionId || !piece.id) return;

    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    try {
      await analyticsService.toggleFavorite(
        user,
        galleryId,
        collection.collectionId,
        piece.id,
        sessionId,
        newFavoriteStatus
      );
      
      // Update the favorites cache
      favoritesService.updateCache(user.userId!, piece.id, newFavoriteStatus);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      setIsFavorite(!newFavoriteStatus);
    }
  };

  const handleZoomInteraction = async (type: 'zoom_in' | 'zoom_out') => {
    if (!user || !galleryId || !collection || !sessionId) return;

    await analyticsService.recordInteractionEvent(
      user,
      galleryId,
      collection.collectionId,
      piece.id!,
      sessionId,
      type
    );
  };

  const handleDescriptionView = async () => {
    if (!user || !galleryId || !collection || !sessionId) return;

    if (!showInfo) {
      await analyticsService.recordInteractionEvent(
        user,
        galleryId,
        collection.collectionId,
        piece.id!,
        sessionId,
        'read_description'
      );
    }
    setShowInfo(!showInfo);
  };

  return (
    <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
      {/* Image Viewer */}
      <div className="flex-1 relative overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={3}
          wheel={{ step: 0.1 }}
          limitToBounds={true}
          centerOnInit={true}
          onZoom={(ref) => {
            if (ref.state.scale > ref.state.previousScale) {
              handleZoomInteraction('zoom_in');
            } else {
              handleZoomInteraction('zoom_out');
            }
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  cursor: 'grab'
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px'
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {currentImageUrl ? (
                    <motion.img
                      key={currentImageUrl}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ 
                        opacity: isTransitioning ? 0.3 : 1,
                        scale: 1
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: "easeInOut"
                      }}
                      src={currentImageUrl}
                      alt={piece.title}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                      style={{
                        maxWidth: 'calc(100vw - 320px - 40px)',
                        maxHeight: 'calc(100vh - 80px - 40px)',
                        width: 'auto',
                        height: 'auto'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-96 h-96 bg-gray-100 rounded">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  
                  {/* Show loading overlay when transitioning */}
                  {isTransitioning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40"
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-sm font-medium">Loading next artwork...</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Preload next image invisibly */}
                  {nextImageUrl && (
                    <img
                      src={nextImageUrl}
                      alt=""
                      className="absolute opacity-0 pointer-events-none"
                      onLoad={() => console.log('🎬 Next image preloaded successfully')}
                      onError={() => console.log('🎬 Next image failed to preload')}
                    />
                  )}
                </div>
              </TransformComponent>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    zoomIn();
                    handleZoomInteraction('zoom_in');
                  }}
                  className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    zoomOut();
                    handleZoomInteraction('zoom_out');
                  }}
                  className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm text-xs"
                  title="Reset Zoom"
                >
                  1:1
                </button>
              </div>
            </>
          )}
        </TransformWrapper>


      </div>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={handleFavoriteToggle}
          className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={handleDescriptionView}
          className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${
            showInfo 
              ? 'bg-primary-500 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          title="Toggle information"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Information Panel */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.3 }}
          className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-sm border-l border-gray-200 p-6 overflow-y-auto"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{piece.title}</h2>
              {artist && (
                <p className="text-lg text-gray-700 mt-1">{artist.displayName}</p>
              )}
              {piece.date && (
                <p className="text-sm text-gray-500 mt-1">{piece.date}</p>
              )}
            </div>

            {piece.description && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{piece.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {piece.width_inches && piece.height_inches && (
                  <p>Dimensions: {piece.width_inches}" × {piece.height_inches}"</p>
                )}
                {piece.notes && (
                  <p className="mt-2">{piece.notes}</p>
                )}
              </div>
            </div>

            {artist && artist.bio && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">About the Artist</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{artist.bio}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}