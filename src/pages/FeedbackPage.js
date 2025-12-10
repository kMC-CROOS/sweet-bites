import { CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useState } from 'react';
import FeedbackForm from '../components/FeedbackForm';

const FeedbackPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (feedbackData) => {
    console.log('🎯 FeedbackPage handleSubmit called with:', feedbackData);
    setIsSubmitting(true);
    setError('');

    try {
      console.log('📤 Starting feedback submission process...', feedbackData);

      // Test connection first
      console.log('Testing backend connection...');
      try {
        const testResponse = await axios.get('http://localhost:8000/api/feedback/');
        console.log('Backend connection test successful:', testResponse.status);
      } catch (testErr) {
        console.log('Backend connection test failed (this is expected for GET):', testErr.response?.status);
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      // Only add authorization header if token exists
      if (token) {
        config.headers['Authorization'] = `Token ${token}`;
        console.log('Using authentication token');
      } else {
        console.log('No authentication token, submitting as anonymous');
      }

      // Add required fields for database compatibility
      const completeData = {
        ...feedbackData,
        is_featured: false,
        is_verified: false
      };

      console.log('Request config:', config);
      console.log('Request URL: /api/feedback/');
      console.log('Request data:', completeData);

      const response = await axios.post('http://localhost:8000/api/feedback/', completeData, config);

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Check if the response is successful
      if (response.status === 200 || response.status === 201) {
        console.log('✅ Feedback submitted successfully!');
        setIsSubmitted(true);
        setError(''); // Clear any previous errors
      } else {
        console.log('❌ Unexpected response status:', response.status);
        setError('Unexpected response from server. Please try again.');
      }

    } catch (err) {
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);

      if (err.response) {
        // Server responded with error status
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        console.error('Error response headers:', err.response.headers);
        // Handle specific error cases
        const errorData = err.response.data;

        // Handle duplicate feedback error
        if (errorData.code === 'DUPLICATE_FEEDBACK') {
          setError('You have already submitted feedback for this order. Each customer can only submit one feedback per order.');
        }
        // Handle validation errors
        else if (errorData.message && Array.isArray(errorData.message)) {
          setError(errorData.message.join(', '));
        }
        // Handle field validation errors
        else if (typeof errorData === 'object' && !errorData.error && !errorData.message) {
          const fieldErrors = Object.values(errorData).flat();
          setError(fieldErrors.join(', '));
        }
        // Handle general error messages
        else {
          setError(errorData.error || errorData.message || errorData.detail || 'Failed to submit feedback. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        console.error('Error:', err.message);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFeedback = () => {
    setIsSubmitted(false);
    setError('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to share your thoughts with us.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleNewFeedback}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Another Feedback
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">We Value Your Feedback</h1>
          <p className="text-gray-600">
            Help us improve our service by sharing your experience with us.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Feedback Form */}
        <FeedbackForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showCancel={false}
        />

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-900 mb-2">Why Your Feedback Matters</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Helps us improve our products and services</li>
            <li>• Enables us to better serve our customers</li>
            <li>• Guides our future development and improvements</li>
            <li>• Your feedback is anonymous and confidential</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
