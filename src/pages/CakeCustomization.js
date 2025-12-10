

import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BeautifulCakePreviewApp from '../components/BeautifulCakePreview';
import RealisticCakeToppingsApp from '../components/RealisticCakeToppings';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { customizationOptions, fetchCakes } from '../data/cakes';
import { generateBeautifulPreviewImage } from '../utils/previewCapture';

// Realistic topping types for the preview
const REALISTIC_TOPPINGS = {
  sprinkles: {
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    size: 0.02,
    shape: 'cylinder',
    count: 200
  },
  chocolate_chips: {
    colors: ['#8B4513', '#654321', '#A0522D'],
    size: 0.08,
    shape: 'sphere',
    count: 80
  },
  nuts: {
    colors: ['#8B4513', '#A0522D', '#D2691E'],
    size: 0.12,
    shape: 'oval',
    count: 60
  },
  berries: {
    colors: ['#FF1493', '#FF6347', '#32CD32', '#FFD700'],
    size: 0.15,
    shape: 'sphere',
    count: 40
  },
  coconut: {
    colors: ['#F5F5DC', '#FFF8DC', '#F0E68C'],
    size: 0.06,
    shape: 'flakes',
    count: 120
  },
  flowers: {
    colors: ['#FF69B4', '#FFD700', '#FF6347', '#DA70D6', '#98FB98'],
    size: 0.18,
    shape: 'flower',
    count: 25
  }
};

// Enhanced 3D Customization Preview Component
const Enhanced3DPreview = ({ isActive, customizations, onClose }) => {
  const [viewMode, setViewMode] = useState('3d');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (!isActive) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setRotation(prev => ({
      x: prev.x + e.movementY * 0.5,
      y: prev.y + e.movementX * 0.5
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(2, prev + e.deltaY * -0.001)));
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sweetbite-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🎂 Interactive 3D Cake Preview</h2>
              <p className="text-sweetbite-100 mt-1">Drag to rotate • Scroll to zoom • Real-time customization</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D Preview Area */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">3D Cake Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === '3d'
                      ? 'bg-sweetbite-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    🎨 3D View
                  </button>
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === '2d'
                      ? 'bg-sweetbite-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    📱 2D View
                  </button>
                </div>
              </div>

              <div
                className="bg-gray-100 rounded-xl p-8 h-96 flex items-center justify-center relative overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {viewMode === '3d' ? (
                  <div className="text-center">
                    <motion.div
                      className="text-8xl mb-4"
                      style={{
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
                        transformStyle: 'preserve-3d'
                      }}
                      animate={{
                        rotateY: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      🎂
                    </motion.div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">
                      Interactive 3D Cake
                    </h4>
                    <p className="text-gray-500">Drag to rotate • Scroll to zoom</p>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Size: {customizations.size || 'Medium'}</p>
                      <p>Shape: {customizations.shape || 'Round'}</p>
                      <p>Frosting: {customizations.frosting || 'Vanilla'}</p>
                      <p>Color: {customizations.color || 'Pink'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">2D Preview</h4>
                    <p className="text-gray-500">2D preview mode</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Customization Options</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>Small (6 inches)</option>
                      <option>Medium (8 inches)</option>
                      <option>Large (10 inches)</option>
                      <option>Extra Large (12 inches)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>Round</option>
                      <option>Square</option>
                      <option>Heart</option>
                      <option>Rectangle</option>
                    </select>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frosting</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>Vanilla</option>
                      <option>Chocolate</option>
                      <option>Strawberry</option>
                      <option>Cream Cheese</option>
                    </select>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-pink-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                      <div className="w-8 h-8 bg-green-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                      <div className="w-8 h-8 bg-yellow-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sweetbite-50 rounded-lg">
                <h4 className="font-semibold text-sweetbite-800 mb-2">3D Controls</h4>
                <div className="space-y-2 text-sm text-sweetbite-700">
                  <p>• Drag to rotate the cake</p>
                  <p>• Scroll to zoom in/out</p>
                  <p>• Changes update in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Universal 3D Customization Preview Component
const Universal3DPreview = ({ isActive, customizationType, customizationData, onClose }) => {
  const [viewMode, setViewMode] = useState('3d');
  const [isLoading, setIsLoading] = useState(false);

  if (!isActive) return null;

  const getCustomizationTitle = () => {
    switch (customizationType) {
      case 'size': return '🎂 Size Preview';
      case 'shape': return '🔷 Shape Preview';
      case 'frosting': return '🎨 Frosting Preview';
      case 'color': return '🌈 Color Preview';
      case 'message': return '💬 Message Preview';
      default: return '🎨 3D Preview';
    }
  };

  const getCustomizationDescription = () => {
    switch (customizationType) {
      case 'size': return 'See how your cake size looks in 3D';
      case 'shape': return 'Explore different cake shapes';
      case 'frosting': return 'Preview frosting styles and textures';
      case 'color': return 'Visualize color combinations';
      case 'message': return 'See how your message appears on the cake';
      default: return '🎨 3D Preview';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sweetbite-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{getCustomizationTitle()}</h2>
              <p className="text-sweetbite-100 mt-1">{getCustomizationDescription()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3D Preview Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">3D Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === '3d'
                      ? 'bg-sweetbite-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    🎨 3D View
                  </button>
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === '2d'
                      ? 'bg-sweetbite-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    📱 2D View
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-8 h-96 flex items-center justify-center">
                {viewMode === '3d' ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎂</div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">
                      {customizationType === 'size' && 'Size: ' + (customizationData.size || 'Medium')}
                      {customizationType === 'shape' && 'Shape: ' + (customizationData.shape || 'Round')}
                      {customizationType === 'frosting' && 'Frosting: ' + (customizationData.frosting || 'Vanilla')}
                      {customizationType === 'color' && 'Color: ' + (customizationData.color || 'Pink')}
                      {customizationType === 'message' && 'Message: ' + (customizationData.message || 'Happy Birthday!')}
                    </h4>
                    <p className="text-gray-500">3D preview coming soon!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">2D Preview</h4>
                    <p className="text-gray-500">2D preview mode</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Customization Options</h3>

              {customizationType === 'size' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-sweetbite-200 rounded-lg bg-sweetbite-50">
                    <h4 className="font-semibold text-sweetbite-800">Current Size</h4>
                    <p className="text-sweetbite-600">{customizationData.size || 'Medium'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Small', 'Medium', 'Large', 'Extra Large'].map((size) => (
                      <button
                        key={size}
                        className="p-3 border border-gray-300 rounded-lg hover:border-sweetbite-400 hover:bg-sweetbite-50 transition-colors"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customizationType === 'shape' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-sweetbite-200 rounded-lg bg-sweetbite-50">
                    <h4 className="font-semibold text-sweetbite-800">Current Shape</h4>
                    <p className="text-sweetbite-600">{customizationData.shape || 'Round'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Round', 'Square', 'Heart', 'Rectangle'].map((shape) => (
                      <button
                        key={shape}
                        className="p-3 border border-gray-300 rounded-lg hover:border-sweetbite-400 hover:bg-sweetbite-50 transition-colors flex items-center justify-center"
                      >
                        <span className="text-2xl mr-2">
                          {shape === 'Round' && '⭕'}
                          {shape === 'Square' && '⬜'}
                          {shape === 'Heart' && '❤️'}
                          {shape === 'Rectangle' && '▬'}
                        </span>
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customizationType === 'frosting' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-sweetbite-200 rounded-lg bg-sweetbite-50">
                    <h4 className="font-semibold text-sweetbite-800">Current Frosting</h4>
                    <p className="text-sweetbite-600">{customizationData.frosting || 'Vanilla'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Vanilla', 'Chocolate', 'Strawberry', 'Lemon'].map((frosting) => (
                      <button
                        key={frosting}
                        className="p-3 border border-gray-300 rounded-lg hover:border-sweetbite-400 hover:bg-sweetbite-50 transition-colors"
                      >
                        {frosting}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customizationType === 'color' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-sweetbite-200 rounded-lg bg-sweetbite-50">
                    <h4 className="font-semibold text-sweetbite-800">Current Color</h4>
                    <p className="text-sweetbite-600">{customizationData.color || 'Pink'}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {['Red', 'Blue', 'Green', 'Purple', 'Pink', 'Yellow', 'Orange', 'Teal'].map((color) => (
                      <button
                        key={color}
                        className="p-3 border border-gray-300 rounded-lg hover:border-sweetbite-400 hover:bg-sweetbite-50 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-full mx-auto mb-1 bg-${color.toLowerCase()}-400`}></div>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {customizationType === 'message' && (
                <div className="space-y-3">
                  <div className="p-4 border-2 border-sweetbite-200 rounded-lg bg-sweetbite-50">
                    <h4 className="font-semibold text-sweetbite-800">Current Message</h4>
                    <p className="text-sweetbite-600">{customizationData.message || 'Happy Birthday!'}</p>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Enter your custom message..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {['Happy Birthday!', 'Congratulations!', 'Happy Anniversary!', 'Custom Message'].map((message) => (
                        <button
                          key={message}
                          className="p-3 border border-gray-300 rounded-lg hover:border-sweetbite-400 hover:bg-sweetbite-50 transition-colors text-sm"
                        >
                          {message}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                  onClose();
                }, 1000);
              }}
              disabled={isLoading}
              className="px-6 py-3 bg-sweetbite-500 text-white rounded-lg hover:bg-sweetbite-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : (
                'Apply Changes'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CakeDetailPage = () => {
  // Enhanced topping system
  const { cakeId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  // Default to cake ID 9 if no cakeId is provided (for /customize route)
  const actualCakeId = cakeId || '9';

  const [cake, setCake] = useState(null);
  const [cakes, setCakes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState({
    size: null,
    customSize: '',
    shape: null,
    customShape: '',
    frosting: null,
    customFrosting: '',
    toppings: [],
    customToppings: '',
    message: '',
    color: null,
    customColor: '',
    theme: null
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [showCustomization, setShowCustomization] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  // Interactive customization states
  const [showInteractiveTopping, setShowInteractiveTopping] = useState({ isActive: false, type: null });
  const [showInteractiveSize, setShowInteractiveSize] = useState({ isActive: false, size: null });
  const [showInteractiveShape, setShowInteractiveShape] = useState({ isActive: false, shape: null });
  const [showInteractiveFrosting, setShowInteractiveFrosting] = useState({ isActive: false, frosting: null });
  const [showInteractiveColor, setShowInteractiveColor] = useState({ isActive: false, color: null });
  const [showInteractiveMessage, setShowInteractiveMessage] = useState({ isActive: false, message: null });
  const [showFlowerPreview, setShowFlowerPreview] = useState({ isActive: false, flowerType: 'rose', coverage: 'full' });
  const [showRealisticToppingPreview, setShowRealisticToppingPreview] = useState({ isActive: false, toppingType: 'sprinkles', distribution: 'full' });
  const [showBeautifulCakePreview, setShowBeautifulCakePreview] = useState({ isActive: false, tiers: 3 });
  const [showEnhanced3DPreview, setShowEnhanced3DPreview] = useState(false);

  // Interactive state variables are defined above and used in JSX below

  // Dynamic background based on customizations
  const getDynamicBackground = () => {
    if (customizations.frosting) {
      const frostingOption = customizationOptions.frostings.find(f => f.id === customizations.frosting);
      switch (frostingOption?.name) {
        case 'Chocolate': return 'bg-gradient-to-br from-amber-50 to-amber-100';
        case 'Strawberry': return 'bg-gradient-to-br from-pink-50 to-pink-100';
        case 'Lemon': return 'bg-gradient-to-br from-yellow-50 to-yellow-100';
        case 'Mint': return 'bg-gradient-to-br from-green-50 to-green-100';
        case 'Orange': return 'bg-gradient-to-br from-orange-50 to-orange-100';
        case 'Raspberry': return 'bg-gradient-to-br from-red-50 to-red-100';
        case 'Caramel': return 'bg-gradient-to-br from-amber-50 to-amber-100';
        default: return 'bg-gradient-to-br from-pink-50 to-yellow-50';
      }
    }
    return 'bg-gradient-to-br from-pink-50 to-yellow-50';
  };

  const fetchCakeDetails = useCallback(async () => {
    try {
      console.log('Fetching cake details for ID:', actualCakeId);
      const response = await axios.get(`http://localhost:8000/api/cakes/${actualCakeId}/`);
      console.log('Cake data received:', response.data);
      console.log('Cake image URL:', response.data.image);
      setCake(response.data);
      setTotalPrice(Number(response.data.price) || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cake details:', error);
      // Fallback to local data if API fails
      const foundCake = cakes.find(c => c.id === parseInt(actualCakeId));
      if (foundCake) {
        console.log('Using fallback cake data:', foundCake);
        setCake(foundCake);
        setTotalPrice(Number(foundCake.price) || 0);
      }
      setLoading(false);
    }
  }, [actualCakeId]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/cakes/${actualCakeId}/reviews/`);
      setReviews(response.data);
      if (response.data.length > 0) {
        const avgRating = response.data.reduce((sum, review) => sum + review.rating, 0) / response.data.length;
        setAverageRating(avgRating);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Show no reviews if API fails
      setReviews([]);
      setAverageRating(0);
    }
  }, [actualCakeId]);

  const calculatePrice = useCallback(() => {
    if (!cake) return 0;

    // Ensure base price is a number
    let price = parseFloat(cake.price) || 0;

    // Add size modifier
    if (customizations.size) {
      const sizeOption = customizationOptions.sizes.find(s => s.id === customizations.size);
      if (sizeOption && sizeOption.priceModifier) {
        price += parseFloat(sizeOption.priceModifier) || 0;
      }
    }

    // Add shape modifier
    if (customizations.shape) {
      const shapeOption = customizationOptions.shapes.find(s => s.id === customizations.shape);
      if (shapeOption && shapeOption.priceModifier) {
        price += parseFloat(shapeOption.priceModifier) || 0;
      }
    }

    // Add frosting modifier
    if (customizations.frosting) {
      const frostingOption = customizationOptions.frostings.find(f => f.id === customizations.frosting);
      if (frostingOption && frostingOption.priceModifier) {
        price += parseFloat(frostingOption.priceModifier) || 0;
      }
    }

    // Add color modifier
    if (customizations.color) {
      const colorOption = customizationOptions.colors?.find(c => c.id === customizations.color);
      if (colorOption && colorOption.priceModifier) {
        price += parseFloat(colorOption.priceModifier) || 0;
      }
    }

    // Add toppings
    customizations.toppings.forEach(toppingId => {
      const toppingOption = customizationOptions.toppings.find(t => t.id === toppingId);
      if (toppingOption && toppingOption.priceModifier) {
        price += parseFloat(toppingOption.priceModifier) || 0;
      }
    });

    // Add tier-based pricing
    if (showBeautifulCakePreview.tiers === 2) {
      price += 1500; // Additional cost for 2-tier
    } else if (showBeautifulCakePreview.tiers === 3) {
      price += 3000; // Additional cost for 3-tier
    }

    return Math.max(0, price); // Ensure price is never negative
  }, [cake, customizations, showBeautifulCakePreview.tiers]);

  // Custom colors for cake customization
  const getCustomColors = () => {
    // Use the same color data structure as BeautifulCakePreview
    return customizationOptions.colors || [
      { id: 1, name: 'Pink', color: '#FF69B4', priceModifier: 0 },
      { id: 2, name: 'Red', color: '#DC143C', priceModifier: 200 },
      { id: 3, name: 'Blue', color: '#4169E1', priceModifier: 200 },
      { id: 4, name: 'Green', color: '#32CD32', priceModifier: 200 },
      { id: 5, name: 'Purple', color: '#8A2BE2', priceModifier: 200 },
      { id: 6, name: 'Yellow', color: '#FFD700', priceModifier: 200 },
      { id: 7, name: 'Orange', color: '#FF8C00', priceModifier: 200 },
      { id: 8, name: 'White', color: '#FFFFFF', priceModifier: 0 }
    ];
  };

  // Fetch cakes from API
  useEffect(() => {
    const loadCakes = async () => {
      try {
        const fetchedCakes = await fetchCakes();
        setCakes(fetchedCakes);
      } catch (error) {
        console.error('Error loading cakes:', error);
        setCakes([]);
      }
    };

    loadCakes();
  }, []);

  useEffect(() => {
    fetchCakeDetails();
    fetchReviews();
  }, [cakeId, fetchCakeDetails, fetchReviews]);

  useEffect(() => {
    if (cake) {
      setTotalPrice(calculatePrice());
    }
  }, [customizations, cake, calculatePrice]);

  const handleCustomizationChange = (type, value) => {
    setCustomizations(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleToppingToggle = (toppingId) => {
    setCustomizations(prev => ({
      ...prev,
      toppings: prev.toppings.includes(toppingId)
        ? prev.toppings.filter(id => id !== toppingId)
        : [...prev.toppings, toppingId]
    }));
  };

  const addToCart = () => {
    if (!cake) return;

    // Generate preview image for customized cakes
    const previewData = generateBeautifulPreviewImage(customizations, customizationOptions, cake.price);

    const customizedCake = {
      ...cake,
      price: totalPrice,
      customizations: customizations,
      previewImage: previewData.image,
      previewData: previewData
    };

    addItem(customizedCake);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a review');
      return;
    }

    // Comprehensive validation
    if (newReview.rating === 0) {
      alert('Please select a rating (1-5 stars)');
      return;
    }

    if (!newReview.comment || newReview.comment.trim().length === 0) {
      alert('Please write a comment about your experience');
      return;
    }

    if (newReview.comment.trim().length < 10) {
      alert('Comment must be at least 10 characters long');
      return;
    }

    if (newReview.comment.trim().length > 500) {
      alert('Comment must be less than 500 characters');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting review for cake:', cakeId);
      console.log('Review data:', { rating: newReview.rating, comment: newReview.comment });
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await axios.post(`http://localhost:8000/api/cakes/${cakeId}/reviews/create/`, {
        rating: newReview.rating,
        comment: newReview.comment.trim()
      }, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Review submission successful:', response.data);

      // Add the new review to the list
      const newReviewData = response.data;
      setReviews(prev => [newReviewData, ...prev]);
      setNewReview({ rating: 0, comment: '' });

      // Recalculate average rating
      const updatedReviews = [newReviewData, ...reviews];
      const avgRating = updatedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / updatedReviews.length;
      setAverageRating(avgRating);

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Error submitting review. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Please log in to submit a review';
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.error?.includes('already reviewed') || errorData?.detail?.includes('already reviewed')) {
          errorMessage = 'You have already reviewed this cake. You can only review each cake once.';
        } else if (errorData?.rating) {
          errorMessage = 'Please select a valid rating (1-5 stars)';
        } else if (errorData?.comment) {
          errorMessage = 'Please write a comment for your review';
        } else {
          errorMessage = 'Invalid review data. Please check your rating and comment.';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Cake not found. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      alert(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cake not found</h2>
          <button
            onClick={() => navigate('/menu')}
            className="btn-primary"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sweetbite-600 hover:text-sweetbite-700 font-medium"
          >
            ← Back to Menu
          </button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Dynamic Cake Image and Basic Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className={`relative p-8 ${getDynamicBackground()}`}>
                {/* Dynamic Visual Cake */}
                <div className="flex justify-center items-center h-96">
                  <VisualCakePreview
                    cake={cake}
                    customizations={customizations}
                    customizationOptions={customizationOptions}
                    totalPrice={totalPrice}
                    isMainDisplay={true}
                  />
                </div>
                <div className="absolute top-4 right-4 bg-sweetbite-600 text-white px-4 py-2 rounded-full font-semibold">
                  RS {totalPrice.toFixed(2)}
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Custom Cake Design
                </h1>
                <p className="text-gray-600 mb-4">
                  Create your perfect cake with our advanced customization options.
                  Choose from various sizes, shapes, flavors, and decorations to make it uniquely yours.
                </p>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => {
                      const starNumber = i + 1;
                      const isFullStar = starNumber <= Math.floor(averageRating);
                      const isHalfStar = starNumber === Math.ceil(averageRating) && averageRating % 1 !== 0;

                      return (
                        <div key={i} className="relative">
                          {/* Background star */}
                          <svg
                            className="w-5 h-5 text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>

                          {/* Filled star */}
                          {(isFullStar || isHalfStar) && (
                            <svg
                              className={`w-5 h-5 text-yellow-400 absolute top-0 left-0 ${isHalfStar ? 'clip-path-half' : ''
                                }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              style={isHalfStar ? { clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' } : {}}
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {reviews.length > 0 ? (
                      `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})`
                    ) : (
                      'No reviews yet'
                    )}
                  </span>
                </div>

                {/* Cake Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Ingredients</h4>
                    <p className="text-sm text-gray-600">
                      {cake.ingredients && Array.isArray(cake.ingredients)
                        ? cake.ingredients.join(', ')
                        : 'Fresh ingredients used'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Allergens</h4>
                    <p className="text-sm text-gray-600">
                      {cake.allergens && Array.isArray(cake.allergens)
                        ? cake.allergens.join(', ')
                        : 'Please contact us for allergen information'
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCustomization(!showCustomization)}
                    className="flex-1 bg-sweetbite-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors"
                  >
                    {showCustomization ? 'Hide Customization' : 'Customize Cake'}
                  </button>
                  <button
                    onClick={addToCart}
                    className="flex-1 border-2 border-sweetbite-600 text-sweetbite-600 py-3 px-6 rounded-lg font-semibold hover:bg-sweetbite-50 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Customization and Reviews */}
          <div className="space-y-8">
            {/* Enhanced Video-Like Customization Interface */}
            {showCustomization && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100"
              >
                {/* Header with Live Preview Indicator */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">��</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Design Your Dream Cake</h3>
                      <p className="text-sm text-gray-500">Live 3D Preview • Real-time Updates</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowBeautifulCakePreview({ isActive: true, tiers: 3 })}
                      className="bg-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-600 transition-colors flex items-center space-x-2"
                    >
                      <span>🎂</span>
                      <span>Beautiful Preview</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live Preview</span>
                    </div>
                  </div>
                </div>

                {/* Customization Tabs */}
                <div className="mb-8">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                    {[
                      { id: 'size', label: 'Size', icon: '📏' },
                      { id: 'shape', label: 'Shape', icon: '🔷' },
                      { id: 'frosting', label: 'Frosting', icon: '🧁' },
                      { id: 'toppings', label: 'Toppings', icon: '🍓' },
                      { id: 'color', label: 'Color', icon: '🎨' },
                      { id: 'message', label: 'Message', icon: '💬' }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${customizations[tab.id]
                          ? 'bg-white shadow-md text-sweetbite-600'
                          : 'text-gray-600 hover:text-gray-800'
                          }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Size Selection - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📏</span>
                      Choose Your Size
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                        {customizationOptions.sizes.find(s => s.id === customizations.size)?.servings || 6} Servings
                      </div>
                      <button
                        onClick={() => setShowInteractiveSize({ isActive: true, size: customizations.size })}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🎨</span>
                        <span>Interactive</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {customizationOptions.sizes.map((size) => (
                      <motion.div
                        key={size.id}
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${customizations.size === size.id
                          ? 'border-sweetbite-500 bg-gradient-to-br from-sweetbite-50 to-pink-50 shadow-lg'
                          : 'border-gray-200 hover:border-sweetbite-300 hover:shadow-md'
                          }`}
                        onClick={() => handleCustomizationChange('size', size.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-lg text-gray-800">{size.name}</h5>
                            <p className="text-gray-600 text-sm">Perfect for {size.servings} people</p>
                            {size.priceModifier > 0 && (
                              <p className="text-green-600 font-semibold text-sm mt-1">
                                +RS {size.priceModifier}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.size === size.id
                              ? 'bg-sweetbite-500 border-sweetbite-500'
                              : 'border-gray-300'
                              }`}>
                              {customizations.size === size.id && (
                                <motion.span
                                  className="text-white text-xs"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  ✓
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>
                        {customizations.size === size.id && (
                          <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-sweetbite-500 to-pink-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Custom Size Option */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-sweetbite-400 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">✨</span>
                        Custom Size
                      </h5>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.customSize ? 'bg-sweetbite-500 border-sweetbite-500' : 'border-gray-300'}`}>
                        {customizations.customSize && (
                          <motion.span
                            className="text-white text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCustomizations(prev => ({ ...prev, customSize: prev.customSize ? '' : 'active' }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${customizations.customSize
                            ? 'bg-sweetbite-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {customizations.customSize ? 'Remove Custom Size' : 'Add Custom Size'}
                        </button>
                        {customizations.customSize && (
                          <motion.input
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            type="text"
                            placeholder="e.g., 14 inches, 16 inches..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                            onChange={(e) => setCustomizations(prev => ({ ...prev, customSize: e.target.value }))}
                          />
                        )}
                      </div>
                      {customizations.customSize && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg"
                        >
                          💡 <strong>Custom Size:</strong> Specify your exact size requirements (e.g., "14 inches diameter", "16x12 inches"). Our team will confirm availability and pricing.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Shape Selection - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🔷</span>
                      Pick Your Shape
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                        {customizationOptions.shapes.find(s => s.id === customizations.shape)?.name || 'Round'}
                      </div>
                      <button
                        onClick={() => setShowInteractiveShape({ isActive: true, shape: customizations.shape })}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🎨</span>
                        <span>Interactive</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {customizationOptions.shapes.map((shape) => (
                      <motion.div
                        key={shape.id}
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer text-center transition-all ${customizations.shape === shape.id
                          ? 'border-sweetbite-500 bg-gradient-to-br from-sweetbite-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-sweetbite-300 hover:shadow-md'
                          }`}
                        onClick={() => handleCustomizationChange('shape', shape.id)}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-4xl mb-3">
                          {shape.name === 'Round' && '⭕'}
                          {shape.name === 'Square' && '⬜'}
                          {shape.name === 'Heart' && '❤️'}
                          {shape.name === 'Rectangle' && '▬'}
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-1">{shape.name}</h5>
                        {shape.priceModifier > 0 && (
                          <p className="text-green-600 font-medium text-sm">
                            +RS {shape.priceModifier}
                          </p>
                        )}
                        {customizations.shape === shape.id && (
                          <motion.div
                            className="absolute -top-2 -right-2 w-8 h-8 bg-sweetbite-500 rounded-full flex items-center justify-center shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <span className="text-white text-sm">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Custom Shape Option */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">✨</span>
                        Custom Shape
                      </h5>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.customShape ? 'bg-sweetbite-500 border-sweetbite-500' : 'border-gray-300'}`}>
                        {customizations.customShape && (
                          <motion.span
                            className="text-white text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCustomizations(prev => ({ ...prev, customShape: prev.customShape ? '' : 'active' }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${customizations.customShape
                            ? 'bg-sweetbite-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {customizations.customShape ? 'Remove Custom Shape' : 'Add Custom Shape'}
                        </button>
                        {customizations.customShape && (
                          <motion.input
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            type="text"
                            placeholder="e.g., Star, Flower, Animal shape..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                            onChange={(e) => setCustomizations(prev => ({ ...prev, customShape: e.target.value }))}
                          />
                        )}
                      </div>
                      {customizations.customShape && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg"
                        >
                          💡 <strong>Custom Shape:</strong> Describe your desired shape (e.g., "Star", "Flower", "Animal silhouette"). Our team will confirm feasibility and provide pricing.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Frosting Selection - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🎨</span>
                      Select Frosting
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-sm font-medium">
                        {customizationOptions.frostings.find(f => f.id === customizations.frosting)?.name || 'Buttercream'}
                      </div>
                      <button
                        onClick={() => setShowInteractiveFrosting({ isActive: true, frosting: customizations.frosting })}
                        className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🎨</span>
                        <span>Interactive</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {customizationOptions.frostings.map((frosting) => (
                      <motion.div
                        key={frosting.id}
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${customizations.frosting === frosting.id
                          ? 'border-sweetbite-500 bg-gradient-to-br from-sweetbite-50 to-pink-50 shadow-lg'
                          : 'border-gray-200 hover:border-sweetbite-300 hover:shadow-md'
                          }`}
                        onClick={() => handleCustomizationChange('frosting', frosting.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full border-3 shadow-lg ${frosting.name === 'Buttercream' ? 'bg-gradient-to-br from-yellow-200 to-yellow-300' :
                            frosting.name === 'Cream Cheese' ? 'bg-gradient-to-br from-white to-gray-100' :
                              frosting.name === 'Chocolate Ganache' ? 'bg-gradient-to-br from-amber-700 to-amber-900' :
                                'bg-gradient-to-br from-pink-100 to-pink-200'
                            }`}></div>
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800">{frosting.name}</h5>
                            {frosting.priceModifier > 0 && (
                              <p className="text-green-600 font-semibold text-sm">
                                +RS {frosting.priceModifier}
                              </p>
                            )}
                          </div>
                          {customizations.frosting === frosting.id && (
                            <motion.div
                              className="w-6 h-6 bg-sweetbite-500 rounded-full flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span className="text-white text-xs">✓</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Custom Frosting Option */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-400 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">✨</span>
                        Custom Frosting
                      </h5>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.customFrosting ? 'bg-sweetbite-500 border-sweetbite-500' : 'border-gray-300'}`}>
                        {customizations.customFrosting && (
                          <motion.span
                            className="text-white text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCustomizations(prev => ({ ...prev, customFrosting: prev.customFrosting ? '' : 'active' }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${customizations.customFrosting
                            ? 'bg-sweetbite-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {customizations.customFrosting ? 'Remove Custom Frosting' : 'Add Custom Frosting'}
                        </button>
                        {customizations.customFrosting && (
                          <motion.input
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            type="text"
                            placeholder="e.g., Vanilla Swiss Meringue, Salted Caramel..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                            onChange={(e) => setCustomizations(prev => ({ ...prev, customFrosting: e.target.value }))}
                          />
                        )}
                      </div>
                      {customizations.customFrosting && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 bg-pink-50 p-3 rounded-lg"
                        >
                          💡 <strong>Custom Frosting:</strong> Specify your preferred frosting type (e.g., "Vanilla Swiss Meringue", "Salted Caramel"). Our team will confirm availability and pricing.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom Color Selection - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🌈</span>
                      Choose Custom Color
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                        {customizations.color ? getCustomColors().find(c => c.id === customizations.color)?.name : 'Pink'}
                      </div>
                      <button
                        onClick={() => setShowInteractiveColor({ isActive: true, color: customizations.color })}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🎨</span>
                        <span>Interactive</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {getCustomColors().map((color) => (
                      <motion.div
                        key={color.id}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${customizations.color === color.id
                          ? 'border-sweetbite-500 bg-sweetbite-50 scale-105 shadow-lg'
                          : 'border-gray-300 hover:border-sweetbite-400 hover:scale-105'
                          }`}
                        onClick={() => handleCustomizationChange('color', color.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={color.name}
                      >
                        <div
                          className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-gray-300"
                          style={{ backgroundColor: color.color }}
                        ></div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-800 text-sm">{color.name}</div>
                          {color.priceModifier > 0 && (
                            <div className="text-xs text-sweetbite-600">+RS {color.priceModifier}</div>
                          )}
                        </div>
                        {customizations.color === color.id && (
                          <motion.div
                            className="absolute -top-2 -right-2 w-6 h-6 bg-sweetbite-500 rounded-full flex items-center justify-center shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <span className="text-white text-xs">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Custom Color Option */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">✨</span>
                        Custom Color
                      </h5>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.customColor ? 'bg-sweetbite-500 border-sweetbite-500' : 'border-gray-300'}`}>
                        {customizations.customColor && (
                          <motion.span
                            className="text-white text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCustomizations(prev => ({ ...prev, customColor: prev.customColor ? '' : 'active' }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${customizations.customColor
                            ? 'bg-sweetbite-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {customizations.customColor ? 'Remove Custom Color' : 'Add Custom Color'}
                        </button>
                        {customizations.customColor && (
                          <motion.input
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            type="text"
                            placeholder="e.g., Navy Blue, Burgundy, Teal..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                            onChange={(e) => setCustomizations(prev => ({ ...prev, customColor: e.target.value }))}
                          />
                        )}
                      </div>
                      {customizations.customColor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 bg-indigo-50 p-3 rounded-lg"
                        >
                          💡 <strong>Custom Color:</strong> Specify your desired color (e.g., "Navy Blue", "Burgundy", "Teal"). Our team will confirm availability and provide pricing.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toppings Selection - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🍓</span>
                      Add Toppings
                    </h4>
                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                      {customizations.toppings?.length || 0} Selected
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {customizationOptions.toppings.map((topping) => {
                      // Define 3D preview toppings array for scope access
                      const previewToppings = ['Nuts', 'Edible Flowers', 'Fresh Berries', 'Chocolate Chips', 'Sprinkles'];

                      return (
                        <motion.div
                          key={topping.id}
                          className={`relative p-6 border-2 rounded-2xl cursor-pointer text-center transition-all ${customizations.toppings?.includes(topping.id)
                            ? 'border-sweetbite-500 bg-gradient-to-br from-sweetbite-50 to-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-sweetbite-300 hover:shadow-md'
                            }`}
                          onClick={() => handleToppingToggle(topping.id)}
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-4xl mb-3">
                            {topping.name === 'Fresh Berries' && '🍓'}
                            {topping.name === 'Chocolate Shavings' && '��'}
                            {topping.name === 'Sprinkles' && '✨'}
                            {topping.name === 'Edible Flowers' && '🌸'}
                            {topping.name === 'Nuts' && '��'}
                          </div>
                          <h5 className="font-semibold text-gray-800 mb-1">{topping.name}</h5>
                          {previewToppings.includes(topping.name) && (
                            <div className="text-xs text-blue-600 font-medium mb-1">✨ 3D Preview</div>
                          )}
                          <p className="text-green-600 font-semibold text-sm">
                            +RS {topping.priceModifier}
                          </p>
                          {/* Realistic Topping Preview Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const toppingType = topping.name === 'Fresh Berries' ? 'berries' :
                                topping.name === 'Chocolate Shavings' ? 'chocolate_chips' :
                                  topping.name === 'Sprinkles' ? 'sprinkles' :
                                    topping.name === 'Edible Flowers' ? 'flowers' :
                                      topping.name === 'Nuts' ? 'nuts' : 'sprinkles';
                              console.log('🌸 Realistic Preview clicked for:', topping.name, 'mapped to:', toppingType);
                              setShowRealisticToppingPreview({
                                isActive: true,
                                toppingType: toppingType,
                                distribution: 'full'
                              });
                            }}
                            className="mt-2 px-3 py-1 bg-sweetbite-500 text-white text-xs rounded-full hover:bg-sweetbite-600 transition-colors"
                          >
                            🎨 Realistic Preview
                          </button>
                          {customizations.toppings?.includes(topping.id) && (
                            <motion.div
                              className="absolute -top-2 -right-2 w-8 h-8 bg-sweetbite-500 rounded-full flex items-center justify-center shadow-lg"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-white text-sm">✓</span>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Custom Toppings Option */}
                  <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">✨</span>
                        Custom Toppings
                      </h5>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${customizations.customToppings ? 'bg-sweetbite-500 border-sweetbite-500' : 'border-gray-300'}`}>
                        {customizations.customToppings && (
                          <motion.span
                            className="text-white text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setCustomizations(prev => ({ ...prev, customToppings: prev.customToppings ? '' : 'active' }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${customizations.customToppings
                            ? 'bg-sweetbite-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {customizations.customToppings ? 'Remove Custom Toppings' : 'Add Custom Toppings'}
                        </button>
                        {customizations.customToppings && (
                          <motion.input
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            type="text"
                            placeholder="e.g., Gold leaf, Custom decorations..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sweetbite-500 focus:border-transparent"
                            onChange={(e) => setCustomizations(prev => ({ ...prev, customToppings: e.target.value }))}
                          />
                        )}
                      </div>
                      {customizations.customToppings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg"
                        >
                          💡 <strong>Custom Toppings:</strong> Specify any special toppings or decorations (e.g., "Gold leaf", "Custom sugar flowers"). Our team will confirm availability and provide pricing.
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Input - Video Style */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">💬</span>
                      Personal Message
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-sm font-medium">
                        {customizations.message?.length || 0}/50
                      </div>
                      <button
                        onClick={() => setShowInteractiveMessage({ isActive: true, message: customizations.message })}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🎨</span>
                        <span>Interactive</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={customizations.message || ''}
                      onChange={(e) => handleCustomizationChange('message', e.target.value)}
                      placeholder="Add a special message to your cake..."
                      maxLength={50}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-sweetbite-500 focus:outline-none resize-none transition-all text-lg"
                      rows={3}
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                      {50 - (customizations.message?.length || 0)} left
                    </div>
                  </div>
                </div>

                {/* Live Price Summary - Video Style */}
                <motion.div
                  className="bg-gradient-to-r from-sweetbite-50 via-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-sweetbite-200 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-lg font-semibold text-gray-700 mb-2">Your Custom Cake</h5>
                      <div className="text-3xl font-bold text-sweetbite-600">
                        RS {totalPrice.toFixed(2)}
                      </div>
                      {totalPrice > (cake?.price || 0) && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          +RS {(totalPrice - (cake?.price || 0)).toFixed(2)} customizations
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Base Price</div>
                      <div className="text-xl font-semibold text-gray-800">
                        RS {cake?.price || 0}
                      </div>
                    </div>
                  </div>

                  {/* Customization Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Customizations:</div>
                    <div className="flex flex-wrap gap-2">
                      {customizations.size && (
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                          {customizationOptions.sizes.find(s => s.id === customizations.size)?.name}
                        </span>
                      )}
                      {customizations.shape && (
                        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                          {customizationOptions.shapes.find(s => s.id === customizations.shape)?.name}
                        </span>
                      )}
                      {customizations.frosting && (
                        <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs">
                          {customizationOptions.frostings.find(f => f.id === customizations.frosting)?.name}
                        </span>
                      )}
                      {customizations.toppings?.map(toppingId => (
                        <span key={toppingId} className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                          {customizationOptions.toppings.find(t => t.id === toppingId)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">Customer Reviews</h3>

              {/* Add Review Form */}
              {isAuthenticated && (
                <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Write a Review</h4>

                  {/* Star Rating */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                          className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience with this cake..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-sweetbite-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => {
                    // Handle different data structures from API
                    const userName = review.user?.username || review.user?.first_name || review.user || 'Anonymous';
                    const userInitial = userName.charAt(0).toUpperCase();
                    const reviewRating = review.rating || 0;
                    const reviewComment = review.comment || review.text || '';
                    const reviewDate = review.created_at || review.createdAt || review.date;

                    return (
                      <div key={review.id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-sweetbite-100 flex items-center justify-center mr-3">
                            <span className="text-sweetbite-600 font-semibold">
                              {userInitial}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-800">{userName}</h5>
                            <div className="flex items-center">
                              <div className="flex items-center mr-2">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < reviewRating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {reviewDate ? new Date(reviewDate).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{reviewComment}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">⭐</div>
                    <p className="text-gray-600">No reviews yet</p>
                    <p className="text-sm text-gray-500">Be the first to review this cake!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>


      {/* Enhanced 3D Preview Modal */}
      <Enhanced3DPreview
        isActive={showEnhanced3DPreview}
        customizations={customizations}
        onClose={() => setShowEnhanced3DPreview(false)}
      />

      {/* Universal 3D Customization Preview Modal */}
      <Universal3DPreview
        isActive={showInteractiveSize.isActive || showInteractiveShape.isActive || showInteractiveFrosting.isActive || showInteractiveColor.isActive || showInteractiveMessage.isActive}
        customizationType={showInteractiveSize.isActive ? 'size' : showInteractiveShape.isActive ? 'shape' : showInteractiveFrosting.isActive ? 'frosting' : showInteractiveColor.isActive ? 'color' : 'message'}
        customizationData={{
          size: showInteractiveSize.size,
          shape: showInteractiveShape.shape,
          frosting: showInteractiveFrosting.frosting,
          color: showInteractiveColor.color,
          message: showInteractiveMessage.message
        }}
        onClose={() => {
          setShowInteractiveSize({ isActive: false, size: null });
          setShowInteractiveShape({ isActive: false, shape: null });
          setShowInteractiveFrosting({ isActive: false, frosting: null });
          setShowInteractiveColor({ isActive: false, color: null });
          setShowInteractiveMessage({ isActive: false, message: null });
        }}
      />

      {/* Realistic Topping Preview Modal */}
      {showRealisticToppingPreview.isActive && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sweetbite-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🎨 Realistic Topping Preview</h2>
                  <p className="text-sweetbite-100 mt-1">
                    See how {showRealisticToppingPreview.toppingType.replace('_', ' ')} look on your cake
                  </p>
                </div>
                <button
                  onClick={() => setShowRealisticToppingPreview({ isActive: false, toppingType: 'sprinkles', distribution: 'full' })}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3D Preview */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">3D Realistic Preview</h3>
                  <RealisticCakeToppingsApp
                    toppingType={showRealisticToppingPreview.toppingType}
                    distribution={showRealisticToppingPreview.distribution}
                    orderId="SB202509190067"
                  />
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Topping Options</h3>
                    <div className="space-y-3">
                      {Object.keys(REALISTIC_TOPPINGS || {}).map((type) => (
                        <button
                          key={type}
                          onClick={() => setShowRealisticToppingPreview(prev => ({ ...prev, toppingType: type }))}
                          className={`w-full p-3 rounded-lg text-left transition-all ${showRealisticToppingPreview.toppingType === type
                            ? 'bg-sweetbite-100 border-2 border-sweetbite-500'
                            : 'bg-gray-50 border-2 border-gray-200 hover:border-sweetbite-300'
                            }`}
                        >
                          <div className="font-medium capitalize">{type.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-600">
                            {REALISTIC_TOPPINGS?.[type]?.count || 0} pieces
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Distribution Style</h3>
                    <div className="space-y-3">
                      {['full', 'border', 'center', 'scattered'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setShowRealisticToppingPreview(prev => ({ ...prev, distribution: style }))}
                          className={`w-full p-3 rounded-lg text-left transition-all ${showRealisticToppingPreview.distribution === style
                            ? 'bg-sweetbite-100 border-2 border-sweetbite-500'
                            : 'bg-gray-50 border-2 border-gray-200 hover:border-sweetbite-300'
                            }`}
                        >
                          <div className="font-medium capitalize">{style}</div>
                          <div className="text-sm text-gray-600">
                            {style === 'full' ? 'Complete coverage' :
                              style === 'border' ? 'Edge decoration' :
                                style === 'center' ? 'Center design' : 'Random scattered'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Beautiful Cake Preview Modal */}
      {showBeautifulCakePreview.isActive && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🎂 Beautiful Cake Preview</h2>
                  <p className="text-pink-100 mt-1">
                    Your dream cake with pink frosting and yellow dollops
                  </p>
                </div>
                <button
                  onClick={() => setShowBeautifulCakePreview({ isActive: false, tiers: 3 })}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Scroll Indicator */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500">
                  💡 Scroll down to see all options and controls
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 3D Preview */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-4">Your Beautiful Cake</h3>
                  <BeautifulCakePreviewApp
                    tiers={showBeautifulCakePreview.tiers}
                    toppings={customizations.toppings?.map(toppingId => {
                      const topping = customizationOptions.toppings.find(t => t.id === toppingId);
                      const mappedTopping = {
                        type: topping?.name === 'Fresh Berries' ? 'berries' :
                          topping?.name === 'Chocolate Shavings' ? 'chocolate_chips' :
                            topping?.name === 'Sprinkles' ? 'sprinkles' :
                              topping?.name === 'Edible Flowers' ? 'flowers' :
                                topping?.name === 'Nuts' ? 'nuts' : 'sprinkles',
                        count: 20
                      };
                      console.log('🎨 Mapping topping:', topping?.name, 'to type:', mappedTopping.type);
                      return mappedTopping;
                    }) || []}
                    orderId="SB202509190067"
                    onClose={() => setShowBeautifulCakePreview({ isActive: false, tiers: 3 })}
                    customizations={customizations}
                    customizationOptions={customizationOptions}
                    basePrice={totalPrice}
                    onAddToCart={addToCart}
                  />
                </div>

                {/* Controls */}
                <div className="space-y-6">

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Cake Features</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-pink-500 rounded-full"></span>
                        <span>Pink frosting with drip effect</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-yellow-400 rounded-full"></span>
                        <span>Yellow swirled dollops</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-amber-800 rounded-full"></span>
                        <span>Dark brown cake layers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-gray-300 rounded-full"></span>
                        <span>Elegant cake plate</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Customizations</h3>
                    <div className="space-y-3">
                      {/* Size */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">
                          {customizationOptions.sizes?.find(s => s.id === customizations.size)?.name || '6 inch'}
                        </span>
                      </div>

                      {/* Shape */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shape:</span>
                        <span className="font-medium">
                          {customizationOptions.shapes?.find(s => s.id === customizations.shape)?.name || 'Round'}
                        </span>
                      </div>

                      {/* Frosting */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Frosting:</span>
                        <span className="font-medium">
                          {customizationOptions.frostings?.find(f => f.id === customizations.frosting)?.name || 'None'}
                        </span>
                      </div>

                      {/* Color */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium">
                          {customizationOptions.colors?.find(c => c.id === customizations.color)?.name || 'Pink'}
                        </span>
                      </div>

                      {/* Toppings */}
                      <div className="text-sm">
                        <span className="text-gray-600">Toppings:</span>
                        <div className="mt-1 space-y-1">
                          {customizations.toppings?.length > 0 ? (
                            customizations.toppings.map(toppingId => {
                              const topping = customizationOptions.toppings.find(t => t.id === toppingId);
                              return (
                                <div key={toppingId} className="flex items-center space-x-2">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  <span className="text-xs">{topping?.name}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-500">No toppings selected</div>
                          )}
                        </div>
                      </div>

                      {/* Personal Message */}
                      {customizations.message && (
                        <div className="text-sm">
                          <span className="text-gray-600">Personal Message:</span>
                          <div className="mt-1 p-2 bg-pink-50 rounded-lg border border-pink-200">
                            <div className="text-xs text-pink-700 italic">
                              💌 "{customizations.message}"
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Visual Cake Preview Component
const VisualCakePreview = ({ cake, customizations, customizationOptions, totalPrice, isMainDisplay = false }) => {
  const getCakeSize = () => {
    if (!customizations.size) return isMainDisplay ? 'w-48 h-48' : 'w-32 h-32';
    const sizeOption = customizationOptions.sizes.find(s => s.id === customizations.size);
    const baseSize = isMainDisplay ? 48 : 32;
    switch (sizeOption?.name) {
      case 'Small (6 inch)': return isMainDisplay ? 'w-36 h-36' : 'w-24 h-24';
      case 'Medium (8 inch)': return isMainDisplay ? 'w-48 h-48' : 'w-32 h-32';
      case 'Large (10 inch)': return isMainDisplay ? 'w-60 h-60' : 'w-40 h-40';
      case 'Extra Large (12 inch)': return isMainDisplay ? 'w-72 h-72' : 'w-48 h-48';
      default: return isMainDisplay ? 'w-48 h-48' : 'w-32 h-32';
    }
  };

  const getCakeColor = () => {
    // Custom color takes priority
    if (customizations.color) {
      return `bg-${customizations.color}-400`;
    }

    if (!customizations.frosting) return 'bg-yellow-200';
    const frostingOption = customizationOptions.frostings.find(f => f.id === customizations.frosting);
    switch (frostingOption?.name) {
      case 'Vanilla': return 'bg-yellow-200';
      case 'Chocolate': return 'bg-amber-800';
      case 'Strawberry': return 'bg-pink-300';
      case 'Cream Cheese': return 'bg-white';
      case 'Buttercream': return 'bg-yellow-100';
      case 'Lemon': return 'bg-yellow-300';
      case 'Mint': return 'bg-green-300';
      case 'Orange': return 'bg-orange-300';
      case 'Raspberry': return 'bg-red-400';
      case 'Caramel': return 'bg-amber-600';
      default: return 'bg-yellow-200';
    }
  };

  const getCakeShape = () => {
    if (!customizations.shape) return 'round-shape';
    const shapeOption = customizationOptions.shapes.find(s => s.id === customizations.shape);
    switch (shapeOption?.name) {
      case 'Round': return 'round-shape';
      case 'Square': return 'square-shape';
      case 'Heart': return 'heart-shape';
      case 'Rectangle': return 'rectangle-shape';
      default: return 'round-shape';
    }
  };

  const getToppings = () => {
    if (!customizations.toppings || customizations.toppings.length === 0) return [];
    return customizations.toppings.map(toppingId => {
      const topping = customizationOptions.toppings.find(t => t.id === toppingId);
      return topping;
    }).filter(Boolean);
  };

  return (
    <div className="relative">
      {/* Custom CSS for shapes and 3D effects */}
      <style jsx>{`
        .heart-shape {
          clip-path: path('M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z');
          transform: scale(3.0);
        }
        .square-shape {
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        .rectangle-shape {
          clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);
        }
        .round-shape {
          clip-path: circle(50%);
        }
        .cake-3d {
          transform-style: preserve-3d;
          perspective: 800px;
          perspective-origin: center center;
        }
        .cake-layer {
          transform: translateZ(15px);
          box-shadow: 
            0 15px 30px rgba(0,0,0,0.4),
            0 8px 16px rgba(0,0,0,0.3),
            inset 0 3px 6px rgba(255,255,255,0.4),
            inset 0 -2px 4px rgba(0,0,0,0.2);
        }
        .cake-shadow {
          filter: drop-shadow(0 20px 35px rgba(0,0,0,0.5));
        }
        .topping-3d {
          transform: translateZ(25px);
          filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
        }
        .cake-base-3d {
          transform: translateZ(5px);
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.3),
            0 10px 20px rgba(0,0,0,0.2),
            inset 0 4px 8px rgba(255,255,255,0.3);
        }
      `}</style>

      {/* Cake Base with 3D Effects */}
      <motion.div
        className={`${getCakeSize()} ${getCakeColor()} ${getCakeShape()} relative mx-auto cake-3d cake-base-3d cake-shadow border-4 border-white`}
        animate={{
          scale: [1, 1.12, 1],
          rotateY: [0, 25, -25, 0],
          rotateX: [0, 12, -12, 0],
          rotateZ: [0, 5, -5, 0],
          y: [0, -5, 5, 0],
          x: [0, 3, -3, 0]
        }}
        transition={{
          duration: 3.0,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        {/* Cake Layers - Realistic sponge layers */}
        <motion.div
          className={`absolute inset-2 bg-gradient-to-b from-amber-200 to-amber-300 opacity-90 ${getCakeShape()} cake-layer`}
          animate={{
            rotateY: [0, 10, -10, 0],
            rotateX: [0, 5, -5, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.2
          }}
        ></motion.div>
        <motion.div
          className={`absolute inset-4 bg-gradient-to-b from-amber-800 to-amber-900 opacity-70 ${getCakeShape()} cake-layer`}
          animate={{
            rotateY: [0, -8, 8, 0],
            rotateX: [0, -3, 3, 0],
            scale: [1, 1.01, 1]
          }}
          transition={{
            duration: 2.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5
          }}
        ></motion.div>
        <motion.div
          className={`absolute inset-6 bg-gradient-to-b from-amber-200 to-amber-300 opacity-60 ${getCakeShape()} cake-layer`}
          animate={{
            rotateY: [0, 6, -6, 0],
            rotateX: [0, 2, -2, 0],
            scale: [1, 1.01, 1]
          }}
          transition={{
            duration: 3.0,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.8
          }}
        ></motion.div>

        {/* Frosting Layer - Cream cheese frosting with realistic texture */}
        <motion.div
          className={`absolute inset-1 bg-gradient-to-b from-yellow-50 to-yellow-100 opacity-95 ${getCakeShape()} cake-layer`}
          style={{
            background: `linear-gradient(135deg, #FFF8DC 0%, #F5E6D3 50%, #FFF8DC 100%)`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)`
          }}
          animate={{
            rotateZ: [0, 2, -2, 0],
            scale: [1, 1.03, 1]
          }}
          transition={{
            duration: 3.2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.8
          }}
        ></motion.div>

        {/* Frosting Border - Piped decoration */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-b from-yellow-50 to-yellow-100 opacity-80 ${getCakeShape()} cake-layer`}
          style={{
            borderRadius: '50%',
            border: '3px solid #FFF8DC',
            boxShadow: `0 0 0 2px #F5E6D3, inset 0 0 0 1px rgba(255,255,255,0.5)`
          }}
          animate={{
            scale: [1, 1.01, 1],
            opacity: [0.8, 0.9, 0.8]
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1.0
          }}
        ></motion.div>

        {/* 3D Decorative Elements with animation */}
        {customizations.frosting && (
          <motion.div
            className={`absolute inset-2 ${getCakeColor()} opacity-30 ${getCakeShape()} cake-layer`}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${getCakeColor().replace('bg-', '')} 2px, transparent 2px),
                          radial-gradient(circle at 70% 70%, ${getCakeColor().replace('bg-', '')} 1px, transparent 1px)`
            }}
            animate={{
              rotateY: [0, 15, -15, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2.0,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1.0
            }}
          ></motion.div>
        )}

        {/* Size-specific 3D decorations with animation */}
        {customizations.size && (
          <motion.div
            className={`absolute inset-3 border-2 border-white opacity-20 ${getCakeShape()} cake-layer`}
            animate={{
              rotateY: [0, 8, -8, 0],
              scale: [1, 1.01, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2.3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1.2
            }}
          ></motion.div>
        )}

        {/* Full Area Topping Distribution */}
        {getToppings().map((topping, index) => {
          let finalX, finalY;

          // ALL toppings spread across full cake surface
          const toppingType = topping.name;
          const toppingCount = getToppings().filter(t => t.name === toppingType).length;
          const currentToppingIndex = getToppings().slice(0, index + 1).filter(t => t.name === toppingType).length - 1;

          // Create full surface coverage for all toppings
          if (toppingType === 'Sprinkles') {
            // Dense sprinkles coverage like the image
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 4)); // More sprinkles
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 10; // Dense spacing for sprinkles
            const startX = 15;
            const startY = 15;

            finalX = startX + (col * spacing) + (Math.random() * 6 - 3);
            finalY = startY + (row * spacing) + (Math.random() * 6 - 3);
          } else if (toppingType === 'Nuts') {
            // Nuts with good coverage
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 3));
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 20;
            const startX = 15;
            const startY = 15;

            finalX = startX + (col * spacing) + (Math.random() * 8 - 4);
            finalY = startY + (row * spacing) + (Math.random() * 8 - 4);
          } else if (toppingType === 'Chocolate Chips') {
            // Chocolate chips scattered across surface
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 5));
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 12;
            const startX = 10;
            const startY = 10;

            finalX = startX + (col * spacing) + (Math.random() * 5 - 2.5);
            finalY = startY + (row * spacing) + (Math.random() * 5 - 2.5);
          } else if (toppingType === 'Fresh Berries') {
            // Berries with natural distribution
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 3));
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 18;
            const startX = 20;
            const startY = 20;

            finalX = startX + (col * spacing) + (Math.random() * 10 - 5);
            finalY = startY + (row * spacing) + (Math.random() * 10 - 5);
          } else if (toppingType === 'Edible Flowers') {
            // Flowers with beautiful full area coverage
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 6)); // More flowers for full coverage
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 12; // Dense spacing for full coverage
            const startX = 10; // Start from edge
            const startY = 10; // Start from edge

            finalX = startX + (col * spacing) + (Math.random() * 8 - 4);
            finalY = startY + (row * spacing) + (Math.random() * 8 - 4);
          } else {
            // Default full surface distribution for other toppings
            const gridSize = Math.ceil(Math.sqrt(toppingCount * 2.5));
            const row = Math.floor(currentToppingIndex / gridSize);
            const col = currentToppingIndex % gridSize;

            const spacing = 20;
            const startX = 15;
            const startY = 15;

            finalX = startX + (col * spacing) + (Math.random() * 6 - 3);
            finalY = startY + (row * spacing) + (Math.random() * 6 - 3);
          }

          // Ensure all toppings stay within cake bounds
          finalX = Math.max(8, Math.min(92, finalX));
          finalY = Math.max(8, Math.min(92, finalY));

          return (
            <motion.div
              key={index}
              className="absolute topping-3d"
              style={{
                top: `${finalY}%`,
                left: `${finalX}%`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ opacity: 0, scale: 0, rotateZ: -180, y: -20 }}
              animate={{
                opacity: 1,
                scale: [1, 1.1, 1],
                rotateZ: [0, 360, 0],
                y: [0, -3, 3, 0],
                rotateY: [0, 10, -10, 0]
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 2.0
              }}
            >
              {/* Enhanced topping visualizations */}
              {topping.name === 'Fresh Berries' && (
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg border-2 border-red-600 animate-pulse"></div>
              )}
              {topping.name === 'Chocolate Chips' && (
                <div className="w-2 h-2 bg-amber-900 rounded-full shadow-lg border border-amber-950"></div>
              )}
              {topping.name === 'Sprinkles' && (
                <div className="flex space-x-0.5">
                  <div className="w-1 h-3 bg-pink-500 rounded-full shadow-sm"></div>
                  <div className="w-1 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  <div className="w-1 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                  <div className="w-1 h-3 bg-white rounded-full shadow-sm"></div>
                </div>
              )}
              {topping.name === 'Nuts' && (
                <div className="relative">
                  <div className="w-2 h-2 bg-amber-700 rounded-full shadow-lg border-2 border-amber-800"></div>
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-600 rounded-full shadow-sm border border-amber-700"></div>
                  <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-amber-800 rounded-full shadow-sm"></div>
                </div>
              )}
              {topping.name === 'Fruit Slices' && (
                <div className="w-3 h-3 bg-orange-400 rounded-full shadow-lg border-2 border-orange-500"></div>
              )}
              {topping.name === 'Candles' && (
                <div className="flex flex-col items-center">
                  <div className="w-1 h-4 bg-yellow-300 rounded-full shadow-lg"></div>
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-1 animate-pulse"></div>
                </div>
              )}
              {topping.name === 'Edible Flowers' && (
                <div className="relative">
                  {/* Beautiful flower shape with petals */}
                  <div className="w-4 h-4 relative">
                    {/* Center of flower */}
                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm"></div>

                    {/* Petals */}
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-pink-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 rotate-0"></div>
                    <div className="absolute top-1/2 right-0 w-2 h-2 bg-pink-300 rounded-full transform translate-x-1/2 -translate-y-1/2 rotate-90"></div>
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-pink-300 rounded-full transform -translate-x-1/2 translate-y-1/2 rotate-180"></div>
                    <div className="absolute top-1/2 left-0 w-2 h-2 bg-pink-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 rotate-270"></div>

                    {/* Additional petals for fuller look */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-pink-200 rounded-full transform rotate-45"></div>
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-pink-200 rounded-full transform -rotate-45"></div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-pink-200 rounded-full transform -rotate-45"></div>
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-pink-200 rounded-full transform rotate-45"></div>
                  </div>
                </div>
              )}
              {topping.name === 'Gold Leaf' && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-500 animate-pulse"></div>
              )}
              {topping.name === 'Coconut Flakes' && (
                <div className="w-2 h-2 bg-white rounded-full shadow-sm border border-gray-300"></div>
              )}
              {topping.name === 'Caramel Drizzle' && (
                <div className="w-4 h-1 bg-amber-600 rounded-full shadow-sm"></div>
              )}
              {topping.name === 'Whipped Cream' && (
                <div className="w-3 h-2 bg-white rounded-full shadow-sm border border-gray-200"></div>
              )}
              {topping.name === 'Mint Leaves' && (
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
              )}
            </motion.div>
          );
        })}

        {/* Particle Effects */}
        {customizations.toppings && customizations.toppings.length > 0 && (
          <>
            {/* Floating particles around cake */}
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-70"
                style={{
                  top: `${20 + (i * 5)}%`,
                  left: `${15 + (i * 7)}%`,
                }}
                animate={{
                  scale: [0.5, 1.5, 0.5],
                  opacity: [0.3, 1, 0.3],
                  rotateZ: [0, 360],
                  y: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 2.0 + (i * 0.1),
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.2
                }}
              />
            ))}

            {/* Burst effect when toppings are added */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 3.0
              }}
            >
              <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-radial from-yellow-200 to-transparent rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </motion.div>
          </>
        )}

        {/* Special Flower Garden Effect */}
        {customizations.toppings?.includes(customizationOptions.toppings.find(t => t.name === 'Edible Flowers')?.id) && (
          <>
            {/* Floating flower petals */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`flower-petal-${i}`}
                className="absolute w-2 h-2 bg-pink-200 rounded-full opacity-60"
                style={{
                  top: `${15 + (i * 10)}%`,
                  left: `${10 + (i * 12)}%`,
                }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 0.8, 0.4],
                  rotateZ: [0, 180, 360],
                  y: [0, -8, 8, 0],
                  x: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 3.0 + (i * 0.2),
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.3
                }}
              />
            ))}

            {/* Flower garden glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2.0,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <div className="absolute inset-2 bg-gradient-radial from-pink-100 via-pink-50 to-transparent rounded-full"></div>
            </motion.div>
          </>
        )}

        {/* Message - Dynamic styling based on length */}
        {customizations.message && (
          <motion.div
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 font-semibold text-center px-2 bg-white bg-opacity-80 rounded-full py-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {customizations.message.length > 15 ?
              customizations.message.substring(0, 15) + '...' :
              customizations.message
            }
          </motion.div>
        )}

        {/* Special effects for premium toppings with enhanced animation */}
        {getToppings().some(t => ['Gold Leaf', 'Edible Flowers'].includes(t.name)) && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-pink-200 opacity-20 rounded-full"
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
              rotateZ: [0, 180, 360]
            }}
            transition={{
              duration: 4.0,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }}
          ></motion.div>
        )}

        {/* Additional nuts scattered across cake surface when nuts are selected */}
        {customizations.toppings?.includes(customizationOptions.toppings.find(t => t.name === 'Nuts')?.id) && (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`extra-nut-${i}`}
                className="absolute w-1.5 h-1.5 bg-amber-600 rounded-full shadow-sm border border-amber-700"
                style={{
                  top: `${20 + (i * 8)}%`,
                  left: `${15 + (i * 10)}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                  rotateZ: [0, 180, 360]
                }}
                transition={{
                  duration: 3.0 + (i * 0.2),
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.3
                }}
              />
            ))}
          </>
        )}

        {/* Floating sparkle effects */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            rotateZ: [0, 360],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 8.0,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-300 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-3 w-1 h-1 bg-pink-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-3 left-4 w-1 h-1 bg-blue-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-2 right-2 w-1 h-1 bg-green-300 rounded-full opacity-60"></div>
        </motion.div>
      </motion.div>

      {/* Cake Details - Only show for sidebar mode */}
      {!isMainDisplay && (
        <div className="mt-4 text-center">
          <motion.div
            className="text-sm text-gray-600"
            key={JSON.stringify(customizations)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {customizations.size && (
              <span className="block">
                {customizationOptions.sizes.find(s => s.id === customizations.size)?.name}
              </span>
            )}
            {customizations.frosting && (
              <span className="block">
                {customizationOptions.frostings.find(f => f.id === customizations.frosting)?.name} Frosting
              </span>
            )}
            {getToppings().length > 0 && (
              <span className="block">
                {getToppings().map(t => t.name).join(', ')}
              </span>
            )}
          </motion.div>

          {/* Live Price Update */}
          <motion.div
            className="mt-3 text-lg font-bold text-sweetbite-600"
            key={totalPrice}
            initial={{ scale: 1.2, color: '#059669' }}
            animate={{ scale: 1, color: '#dc2626' }}
            transition={{ duration: 0.3 }}
          >
            RS {totalPrice.toFixed(2)}
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default CakeDetailPage;//
