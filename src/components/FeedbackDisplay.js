import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

const FeedbackDisplay = ({ cakeId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [cakeId]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/feedback/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter feedbacks that are related to this cake
        // If the API doesn't support cake-specific filtering, we'll filter client-side
        const cakeRelatedFeedbacks = Array.isArray(data) 
          ? data.filter(feedback => 
              feedback.order_items?.some(item => item.cake_id === parseInt(cakeId)) ||
              feedback.cake_id === parseInt(cakeId)
            )
          : [];
        setFeedbacks(cakeRelatedFeedbacks);
      } else if (response.status === 404) {
        // Endpoint might not exist yet
        console.log('Feedback endpoint not available yet');
        setFeedbacks([]);
      } else {
        console.error('Failed to fetch feedbacks', response.status);
        setFeedbacks([]);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
    setShowImageModal(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < selectedImages.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : selectedImages.length - 1
    );
  };

  const StarRating = ({ rating, size = "w-4 h-4" }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <StarIconSolid key={star} className={`${size} text-yellow-400`} />
        ) : (
          <StarIcon key={star} className={`${size} text-gray-300`} />
        )
      ))}
    </div>
  );

  const RatingCard = ({ label, rating, color }) => (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="flex justify-center mb-1">
        <StarRating rating={rating} size="w-3 h-3" />
      </div>
      <div className={`text-sm font-semibold ${color}`}>
        {rating.toFixed(1)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">💬</div>
        <p className="text-gray-600">No customer feedback yet</p>
        <p className="text-sm text-gray-500">Order this cake and be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {feedbacks.map((feedback) => {
          const userName = feedback.user?.username || feedback.user?.first_name || 'Anonymous';
          const userInitial = userName.charAt(0).toUpperCase();
          
          return (
            <motion.div 
              key={feedback.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* User Info */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sweetbite-400 to-pink-400 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">
                    {userInitial}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{userName}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Order #{feedback.order_id}</span>
                    <span>•</span>
                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <StarRating rating={feedback.overall_rating} />
                    <span className="ml-2 text-lg font-bold text-gray-800">
                      {feedback.overall_rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Overall Experience</div>
                </div>
              </div>

              {/* Detailed Ratings */}
              {(feedback.taste_rating || feedback.presentation_rating || feedback.delivery_rating) && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {feedback.taste_rating > 0 && (
                    <RatingCard 
                      label="Taste" 
                      rating={feedback.taste_rating} 
                      color="text-red-600" 
                    />
                  )}
                  {feedback.presentation_rating > 0 && (
                    <RatingCard 
                      label="Presentation" 
                      rating={feedback.presentation_rating} 
                      color="text-purple-600" 
                    />
                  )}
                  {feedback.delivery_rating > 0 && (
                    <RatingCard 
                      label="Delivery" 
                      rating={feedback.delivery_rating} 
                      color="text-blue-600" 
                    />
                  )}
                </div>
              )}

              {/* Comment */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{feedback.comment}</p>
              </div>

              {/* Images */}
              {feedback.images && feedback.images.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    📸 Customer Photos ({feedback.images.length})
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {feedback.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={image.image || image.url || image}
                          alt={`Customer feedback ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-sweetbite-400 transition-colors"
                          onClick={() => openImageModal(feedback.images, index)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm hidden"
                        >
                          Image not available
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {index === 3 && feedback.images.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold">
                              +{feedback.images.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show detailed ratings if available */}
              {feedback.detailed_ratings && Object.keys(feedback.detailed_ratings).some(key => feedback.detailed_ratings[key] > 0) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Detailed Ratings</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    {feedback.detailed_ratings.taste > 0 && (
                      <div>Taste: {feedback.detailed_ratings.taste}/5 ⭐</div>
                    )}
                    {feedback.detailed_ratings.presentation > 0 && (
                      <div>Presentation: {feedback.detailed_ratings.presentation}/5 🎨</div>
                    )}
                    {feedback.detailed_ratings.delivery > 0 && (
                      <div>Delivery: {feedback.detailed_ratings.delivery}/5 🚚</div>
                    )}
                  </div>
                </div>
              )}

              {/* Verified Purchase Badge */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Purchase
                </span>
                <span>
                  {new Date(feedback.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] w-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              {/* Image */}
              <img
                src={selectedImages[currentImageIndex]?.image || selectedImages[currentImageIndex]?.url}
                alt={`Customer feedback ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Navigation */}
              {selectedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-3 py-1 text-sm">
                    {currentImageIndex + 1} / {selectedImages.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackDisplay;
