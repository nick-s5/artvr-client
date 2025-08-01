import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import favoritesService from '../../services/favoritesService';
import ImageWithFallback from '../common/ImageWithFallback';
import type { Piece } from '@shared/types/firestore';

interface PieceThumbnailProps {
  piece: Piece;
  onClick: () => void;
  className?: string;
  showTitle?: boolean;
}

export default function PieceThumbnail({ 
  piece, 
  onClick, 
  className = '', 
  showTitle = false 
}: PieceThumbnailProps) {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (user?.userId && piece.id) {
      setLoading(true);
      
      // Subscribe to real-time favorite status changes
      const unsubscribe = favoritesService.subscribeToFavoriteStatus(
        user.userId,
        piece.id,
        (isFavorited) => {
          setIsFavorited(isFavorited);
          setLoading(false);
        }
      );

      // Load initial state
      favoritesService.isFavorited(user.userId, piece.id)
        .then(setIsFavorited)
        .finally(() => setLoading(false));

      return () => {
        unsubscribe();
      };
    }
  }, [user?.userId, piece.id]);

  return (
    <button
      onClick={onClick}
      className={`relative group hover:opacity-80 hover:scale-105 transition-all duration-200 ${className}`}
      title={piece.title}
    >
      {/* Image */}
      <ImageWithFallback
        path={piece.thumbnail_path || piece.image_half_path || piece.image_full_path}
        alt={piece.title}
        className="w-full h-full object-cover"
      />
      
      {/* Favorite Heart Overlay */}
      {!loading && isFavorited && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-500 text-white p-1 rounded-full shadow-md">
            <Heart className="w-3 h-3 fill-current" />
          </div>
        </div>
      )}
      
      {/* Title Overlay (for list view) */}
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">
            {piece.title}
          </p>
          {piece.date && (
            <p className="text-white/80 text-xs mt-0.5">
              {piece.date}
            </p>
          )}
        </div>
      )}
      
      {/* Hover overlay for better interaction feedback */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 pointer-events-none" />
    </button>
  );
}