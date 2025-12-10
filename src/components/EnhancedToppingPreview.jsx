import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GenericToppingEmitterApp from './GenericToppingEmitter';

const EnhancedToppingPreview = ({ isActive, toppingType, onClose }) => {
  const [mode, setMode] = useState('sprinkle'); // 'sprinkle' or 'place'
  const [show3D, setShow3D] = useState(false);

  if (!isActive) return null;

  const getToppingEmoji = (type) => {
    switch (type) {
      case 'nuts': return '🥜';
      case 'flowers': return '🌸';
      case 'berries': return '🍓';
      case 'chocolate': return '🍫';
      case 'sprinkles': return '✨';
      default: return '🍰';
    }
  };

  const getToppingColor = (type) => {
    switch (type) {
      case 'nuts': return 'from-amber-500 to-amber-600';
      case 'flowers': return 'from-pink-500 to-pink-600';
      case 'berries': return 'from-red-500 to-red-600';
      case 'chocolate': return 'from-amber-700 to-amber-800';
      case 'sprinkles': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getToppingName = (type) => {
    switch (type) {
      case 'nuts': return 'Nuts';
      case 'flowers': return 'Edible Flowers';
      case 'berries': return 'Fresh Berries';
      case 'chocolate': return 'Chocolate Chips';
      case 'sprinkles': return 'Sprinkles';
      default: return 'Toppings';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-r ${getToppingColor(toppingType)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl">{getToppingEmoji(toppingType)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Interactive {getToppingName(toppingType)}</h2>
                <p className="text-sm text-gray-500">Choose your placement mode and customize your cake!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-gray-600">×</span>
            </button>
          </div>

          {/* Mode Selection */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-xl flex">
              <button
                onClick={() => setMode('sprinkle')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  mode === 'sprinkle' 
                    ? 'bg-white shadow-md text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>🌧️</span>
                <span>Sprinkle Mode</span>
              </button>
              <button
                onClick={() => setMode('place')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  mode === 'place' 
                    ? 'bg-white shadow-md text-green-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span>🎯</span>
                <span>Place Mode</span>
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-xl flex">
              <button
                onClick={() => setShow3D(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !show3D 
                    ? 'bg-white shadow-md text-purple-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎨 2D Preview
              </button>
              <button
                onClick={() => setShow3D(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  show3D 
                    ? 'bg-white shadow-md text-purple-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎨 3D Preview
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-96 rounded-xl overflow-hidden bg-gray-50">
            {show3D ? (
              <GenericToppingEmitterApp 
                toppingType={toppingType}
                mode={mode}
                orderId="SB202509190067" 
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className={`w-32 h-32 bg-gradient-to-br ${getToppingColor(toppingType)} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    <span className="text-6xl">{getToppingEmoji(toppingType)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2D {getToppingName(toppingType)} Preview</h3>
                  <p className="text-gray-600 mb-4">Switch to 3D Preview mode to {mode === 'sprinkle' ? 'sprinkle' : 'place'} {getToppingName(toppingType).toLowerCase()}!</p>
                  <button
                    onClick={() => setShow3D(true)}
                    className={`bg-gradient-to-r ${getToppingColor(toppingType)} hover:opacity-90 text-white px-6 py-2 rounded-lg font-medium transition-all`}
                  >
                    Try 3D Preview Mode
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">
              {mode === 'sprinkle' ? '🌧️ Sprinkle Mode Instructions:' : '🎯 Place Mode Instructions:'}
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {mode === 'sprinkle' ? (
                <>
                  <li>• <strong>Click</strong> to sprinkle a burst of {getToppingName(toppingType).toLowerCase()}</li>
                  <li>• <strong>Click and drag</strong> for continuous {getToppingName(toppingType).toLowerCase()} rain</li>
                  <li>• <strong>Watch them fall</strong> and stick to the cake naturally</li>
                </>
              ) : (
                <>
                  <li>• <strong>Click anywhere</strong> on the cake to place {getToppingName(toppingType).toLowerCase()}</li>
                  <li>• <strong>Precise placement</strong> - each click adds one {getToppingName(toppingType).toLowerCase()}</li>
                  <li>• <strong>Perfect control</strong> over exact positioning</li>
                </>
              )}
              <li>• <strong>Rotate and zoom</strong> the cake to see from different angles</li>
            </ul>
          </div>

          {/* Mode Benefits */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${mode === 'sprinkle' ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-50'}`}>
              <h5 className="font-semibold text-blue-800 mb-1">🌧️ Sprinkle Mode</h5>
              <p className="text-xs text-blue-600">Natural, random distribution with realistic physics</p>
            </div>
            <div className={`p-3 rounded-lg ${mode === 'place' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'}`}>
              <h5 className="font-semibold text-green-800 mb-1">🎯 Place Mode</h5>
              <p className="text-xs text-green-600">Precise control for artistic arrangements</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Here you would save the topping configuration
                onClose();
              }}
              className={`px-6 py-2 bg-gradient-to-r ${getToppingColor(toppingType)} hover:opacity-90 text-white rounded-lg font-medium transition-all`}
            >
              Apply {getToppingName(toppingType)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedToppingPreview;
