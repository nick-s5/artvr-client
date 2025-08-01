import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useGalleryStore } from '../../stores/galleryStore';
import LoadingScreen from '../ui/LoadingScreen';
import GalleryHeader from './GalleryHeader';
import ArtistSidebar from './ArtistSidebar';
import PieceViewer from './PieceViewer';
import ErrorMessage from '../ui/ErrorMessage';

export default function GalleryPage() {
  const { user, galleryId } = useAuthStore();
  const { 
    collection, 
    isLoading, 
    error, 
    loadGallery,
    selectedPieceId,
    getCurrentPiece
  } = useGalleryStore();
  
  // Get current piece using the function
  const currentPiece = getCurrentPiece();
  


  useEffect(() => {
    if (user && galleryId && user.collectionId) {
      loadGallery(galleryId, user.collectionId);
    }
  }, [user, galleryId, loadGallery]);

  if (isLoading) {
    return <LoadingScreen message="Loading your gallery..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!collection) {
    return <LoadingScreen message="Preparing your experience..." />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <GalleryHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Artist Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-80 bg-white border-r border-gray-200 flex flex-col"
        >
          <ArtistSidebar />
        </motion.div>

        {/* Main Viewing Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {selectedPieceId && currentPiece ? (
            <PieceViewer piece={currentPiece} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to {collection.name}</h3>
                <p className="text-gray-500">Select an artist or piece to begin exploring</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}