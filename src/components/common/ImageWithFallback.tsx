import React from 'react';
import { Image } from 'lucide-react';
import { useStorageUrl } from '../../hooks/useStorageUrl';

interface ImageWithFallbackProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({ path, alt, className }: ImageWithFallbackProps) {
  const { url, loading } = useStorageUrl(path);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <Image className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
      }}
    />
  );
}