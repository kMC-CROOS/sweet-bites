import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const FeedbackModal = ({ isOpen, onClose, order, onSubmitFeedback, existingFeedback = null, isEditing = false, isViewOnly = false }) => {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [message, setMessage] = useState(existingFeedback?.message || '');
  const [cakeImage, setCakeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingFeedback?.cake_image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with existing feedback
  useEffect(() => {
    if (isOpen && existingFeedback) {
      setRating(existingFeedback.rating || 0);
      setMessage(existingFeedback.message || '');
      setImagePreview(existingFeedback.cake_image_url || null);
      setCakeImage(null);
    } else if (isOpen && !existingFeedback) {
      setRating(0);
      setMessage('');
      setImagePreview(null);
      setCakeImage(null);
    }
  }, [isOpen, existingFeedback]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCakeImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCakeImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isViewOnly) {
      if (rating === 0) {
        alert('Please select a rating');
        return;
      }

      if (!message.trim()) {
        alert('Please write a message');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('order', order.id);
      formData.append('rating', rating);
      formData.append('message', message.trim());

      if (cakeImage) {
        formData.append('cake_image', cakeImage);
      }

      if (isEditing && existingFeedback) {
        formData.append('id', existingFeedback.id);
      }

      await onSubmitFeedback(formData, isEditing);

      // Reset form
      setRating(0);
      setMessage('');
      setCakeImage(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isViewOnly ? 'View Feedback for Order' : (isEditing ? 'Edit Feedback for Order' : 'Give Feedback for Order')} #{order?.id}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !isViewOnly && setRating(star)}
                    disabled={isViewOnly}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} ${isViewOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-500'
                      }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback
              </label>
              <textarea
                value={message}
                onChange={(e) => !isViewOnly && setMessage(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                disabled={isViewOnly}
                className={`block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewOnly ? 'bg-gray-50 cursor-default' : ''
                  }`}
              />
            </div>

            {/* Cake Image Upload */}
            {!isViewOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cake Image (Optional)
                </label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Cake preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload a photo of your delivered cake</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="cake-image-upload"
                      />
                      <label
                        htmlFor="cake-image-upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                      >
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View existing image */}
            {isViewOnly && existingFeedback?.cake_image_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cake Image
                </label>
                <img
                  src={existingFeedback.cake_image_url}
                  alt="Delivered cake"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {isViewOnly ? 'Close' : 'Cancel'}
              </button>
              {!isViewOnly && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Feedback' : 'Submit Feedback')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;