import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CakeNutsEmitterApp from './CakeNutsEmitter';

const InteractiveNutsPreview = ({ isActive, onClose }) => {
  const [show3D, setShow3D] = useState(false);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🥜</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Nuts Customization</h2>
                <p className="text-sm text-gray-500">Click and drag to sprinkle nuts on your cake!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-gray-600">×</span>
            </button>
          </div>

          {/* Toggle between 2D and 3D */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-xl flex">
              <button
                onClick={() => setShow3D(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !show3D 
                    ? 'bg-white shadow-md text-amber-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎨 2D Preview
              </button>
              <button
                onClick={() => setShow3D(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  show3D 
                    ? 'bg-white shadow-md text-amber-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🥜 3D Preview
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-96 rounded-xl overflow-hidden bg-gray-50">
            {show3D ? (
              <CakeNutsEmitterApp orderId="SB202509190067" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-6xl">🥜</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2D Nuts Preview</h3>
                  <p className="text-gray-600 mb-4">Switch to 3D Preview mode to customize your nuts!</p>
                  <button
                    onClick={() => setShow3D(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Try 3D Preview Mode
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-amber-50 rounded-xl">
            <h4 className="font-semibold text-amber-800 mb-2">How to use:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Click</strong> to sprinkle a burst of nuts</li>
              <li>• <strong>Click and drag</strong> for continuous nut rain</li>
              <li>• <strong>Rotate</strong> the cake to see from different angles</li>
              <li>• <strong>Zoom</strong> in/out to get the perfect view</li>
            </ul>
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
                // Here you would save the nuts configuration
                onClose();
              }}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
            >
              Apply Nuts
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InteractiveNutsPreview;
