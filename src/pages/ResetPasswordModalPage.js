import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ResetPasswordModal from '../components/ResetPasswordModal';

const ResetPasswordModalPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    console.log('Reset password page loaded with token:', token);
    
    if (token) {
      // Show modal immediately and let the modal handle token verification
      setShowModal(true);
      setLoading(false);
      
      // Try to verify token to get user email
      const verifyToken = async () => {
        try {
          console.log('Verifying token:', token);
          const response = await fetch(`http://localhost:8000/api/users/auth/verify-reset-token/${token}/`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          console.log('Token verification response:', response.status);
          const data = await response.json();
          console.log('Token verification data:', data);

          if (response.ok && data.valid) {
            setUserEmail(data.email);
            console.log('Token verified, user email:', data.email);
          } else {
            console.log('Token verification failed:', data.message);
            setError(data.message || 'Invalid or expired reset link');
          }
        } catch (error) {
          console.error('Token verification error:', error);
          setError('Failed to verify reset link');
        }
      };

      verifyToken();
    } else {
      console.log('No token provided, redirecting to home');
      setError('No reset token provided');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [token, navigate]);

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sweetbite-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading password reset...</p>
        </div>
      </div>
    );
  }

  if (error && !showModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-sweetbite-600 text-white px-4 py-2 rounded hover:bg-sweetbite-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      {!showModal && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sweetbite-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Opening password reset...</p>
        </div>
      )}

      <ResetPasswordModal
        isOpen={showModal}
        onClose={handleModalClose}
        token={token}
        userEmail={userEmail}
      />
    </div>
  );
};

export default ResetPasswordModalPage;
