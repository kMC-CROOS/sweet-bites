import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';

const FeedbackForm = ({ onSubmit, onCancel, onDelete, isSubmitting = false, showCancel = true, initialData = null, isEditing = false }) => {
  const [message, setMessage] = useState(initialData?.message || '');
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const cleanMessage = message.trim();

    // Validate rating
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    // Validate message
    if (!cleanMessage) {
      newErrors.message = 'Feedback message is required';
    } else if (cleanMessage.length < 10) {
      newErrors.message = 'Feedback must be at least 10 characters long';
    } else if (cleanMessage.length > 1000) {
      newErrors.message = 'Feedback cannot exceed 1000 characters';
    } else if (rating <= 2 && cleanMessage.length < 20) {
      newErrors.message = 'For low ratings, please provide at least 20 characters explaining your experience';
    }

    // Check for repetitive characters
    if (cleanMessage && /(.)\1{6,}/.test(cleanMessage)) {
      newErrors.message = 'Please provide meaningful feedback without repetitive characters';
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['spam', 'fake', 'scam', 'hate'];
    if (cleanMessage && inappropriateWords.some(word => cleanMessage.toLowerCase().includes(word))) {
      newErrors.message = 'Please provide constructive feedback without inappropriate language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🚀 Form submission attempt:', { rating, message: message.trim() });

    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    const feedbackData = { message: message.trim(), rating };
    console.log('✅ Validation passed, submitting feedback data:', feedbackData);

    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(feedbackData);
    } else {
      console.error('❌ onSubmit is not a function or is undefined:', onSubmit);
    }
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
    // Clear rating error when user selects a rating
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const renderStar = (starNumber) => {
    const isFilled = starNumber <= (hoveredRating || rating);
    return isFilled ? (
      <StarIcon
        key={starNumber}
        className="h-8 w-8 text-yellow-400 cursor-pointer transition-colors"
        onClick={() => handleStarClick(starNumber)}
        onMouseEnter={() => handleStarHover(starNumber)}
        onMouseLeave={handleStarLeave}
      />
    ) : (
      <StarOutlineIcon
        key={starNumber}
        className="h-8 w-8 text-gray-300 cursor-pointer transition-colors hover:text-yellow-400"
        onClick={() => handleStarClick(starNumber)}
        onMouseEnter={() => handleStarHover(starNumber)}
        onMouseLeave={handleStarLeave}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        {isEditing ? 'Edit Your Feedback' : 'Share Your Feedback'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience? *
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(renderStar)}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
          {errors.rating && (
            <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Tell us more about your experience *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Clear message error when user starts typing
              if (errors.message) {
                setErrors(prev => ({ ...prev, message: '' }));
              }
            }}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Please share your thoughts about our service, products, or any suggestions for improvement..."
            required
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${message.length > 1000 ? 'text-red-500' :
              message.length < 10 ? 'text-orange-500' : 'text-gray-500'
              }`}>
              {message.length}/1000 characters
              {rating <= 2 ? ' (minimum 20 for low ratings)' : ' (minimum 10)'}
            </p>
          </div>
          {errors.message && (
            <p className="text-sm text-red-600 mt-1">{errors.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Feedback' : 'Submit Feedback')}
          </button>

          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Delete Button (only show when editing) */}
        {isEditing && onDelete && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onDelete}
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Delete Feedback
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;
