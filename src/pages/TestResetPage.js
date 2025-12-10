import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordModal from '../components/ResetPasswordModal';

const TestResetPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [testToken, setTestToken] = useState('');
  const navigate = useNavigate();

  const handleTestModal = () => {
    // Use a test token for demonstration
    setTestToken('test-token-123');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  const handleCreateTestUser = async () => {
    try {
      // Create a test user and get reset token
      const response = await fetch('http://localhost:8000/api/users/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'testuser_modal',
          email: 'testuser_modal@example.com',
          password: 'testpassword123',
          confirmPassword: 'testpassword123',
          first_name: 'Test',
          last_name: 'User'
        })
      });

      if (response.ok) {
        alert('Test user created! Now request password reset...');
        
        // Request password reset
        const resetResponse = await fetch('http://localhost:8000/api/users/auth/forgot-password/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'testuser_modal@example.com'
          })
        });

        if (resetResponse.ok) {
          alert('Password reset requested! Check Django console for the reset link.');
        } else {
          alert('Failed to request password reset');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to create test user: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test Password Reset Modal
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={handleTestModal}
            className="w-full bg-sweetbite-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-sweetbite-700 transition-colors"
          >
            Test Modal Popup (Demo)
          </button>

          <button
            onClick={handleCreateTestUser}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Test User & Request Reset
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sweetbite-600 hover:text-sweetbite-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Test Modal Popup" to see the modal</li>
            <li>Click "Create Test User" to create a test user and request reset</li>
            <li>Check Django console for the actual reset link</li>
            <li>Copy the reset link and paste in browser address bar</li>
          </ol>
        </div>
      </div>

      <ResetPasswordModal
        isOpen={showModal}
        onClose={handleModalClose}
        token={testToken}
        userEmail="test@example.com"
      />
    </div>
  );
};

export default TestResetPage;
