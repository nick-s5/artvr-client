import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [galleryId, setGalleryId] = useState('default-gallery'); // Using actual gallery ID from Firebase
  const { login, isLoading, error, clearError } = useAuthStore();

  const availableGalleries = [
    { id: 'default-gallery', name: 'Default Gallery' },
    { id: 'AmericanFineArt_AZ', name: 'American Fine Art' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      return;
    }

    const success = await login(accessCode.trim(), galleryId);
    if (!success) {
      // Error is handled by the store
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setAccessCode(value);
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Palette className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ArtVR Gallery</h1>
          <p className="text-gray-600">Enter your access code to begin your virtual gallery experience</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gallery" className="block text-sm font-medium text-gray-700 mb-1">
                Gallery
              </label>
              <select
                id="gallery"
                value={galleryId}
                onChange={(e) => setGalleryId(e.target.value)}
                className="input mb-4"
                disabled={isLoading}
              >
                {availableGalleries.map((gallery) => (
                  <option key={gallery.id} value={gallery.id}>
                    {gallery.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={handleCodeChange}
                placeholder="Enter your access code"
                className={`input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center text-sm text-red-600"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={!accessCode.trim() || isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Enter Gallery'
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          Need an access code? Contact your gallery administrator.
        </motion.div>
      </motion.div>
    </div>
  );
}