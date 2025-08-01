import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Globe, Palette } from 'lucide-react';
import ImageWithFallback from '../common/ImageWithFallback';
import type { Artist } from '@shared/types/firestore';

interface ArtistInfoProps {
  artist: Artist;
  isVisible: boolean;
}

export default function ArtistInfo({ artist, isVisible }: ArtistInfoProps) {
  if (!isVisible) return null;

  // Calculate age or life span
  const getLifeSpan = () => {
    if (!artist.birthYear) return null;
    if (artist.deathYear) {
      return `${artist.birthYear} - ${artist.deathYear} (${artist.deathYear - artist.birthYear} years)`;
    }
    const currentYear = new Date().getFullYear();
    const age = currentYear - artist.birthYear;
    return `Born ${artist.birthYear} (${age} years old)`;
  };

  const lifeSpan = getLifeSpan();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 overflow-hidden"
    >
      <div className="p-4 space-y-4">
        {/* Artist Header with Large Image */}
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 shadow-sm">
            {artist.imagePath ? (
              <ImageWithFallback
                path={artist.imagePath}
                alt={artist.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {artist.displayName}
            </h3>
            
            {/* Key Info Row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {artist.nationality && (
                <div className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>{artist.nationality}</span>
                </div>
              )}
              
              {lifeSpan && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{lifeSpan}</span>
                </div>
              )}
              
              {artist.pieces && artist.pieces.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Palette className="w-3 h-3" />
                  <span>{artist.pieces.length} {artist.pieces.length === 1 ? 'work' : 'works'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography */}
        {artist.bio && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">About</h4>
            <div className="text-sm text-gray-700 leading-relaxed">
              {artist.bio.split('\n').map((paragraph, index) => (
                <p key={index} className={index > 0 ? 'mt-2' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-300">
          {/* Life Details */}
          {(artist.birthYear || artist.deathYear) && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Life</h5>
              <div className="text-sm text-gray-700 space-y-0.5">
                {artist.birthYear && (
                  <div>Born: {artist.birthYear}</div>
                )}
                {artist.deathYear && (
                  <div>Died: {artist.deathYear}</div>
                )}
              </div>
            </div>
          )}

          {/* Collection Status */}
          <div className="space-y-1">
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</h5>
            <div className="text-sm text-gray-700">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                artist.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {artist.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-600">Debug Info</summary>
            <div className="mt-1 p-2 bg-gray-100 rounded text-gray-600 font-mono">
              <div>Artist ID: {artist.artistId}</div>
              <div>Created: {artist.createdDateUTC?.toString()}</div>
              <div>Modified: {artist.modifiedDateUTC?.toString()}</div>
            </div>
          </details>
        )}
      </div>
    </motion.div>
  );
}