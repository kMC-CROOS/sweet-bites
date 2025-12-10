import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthTestPage = () => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    testAuth();
  }, []);

  const testAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token from localStorage:', token);
      
      if (!token) {
        setAuthStatus('❌ No token found');
        setError('Please log in first');
        return;
      }

      setAuthStatus('🔍 Testing authentication...');

      // Test orders API
      const response = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Orders API response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Orders data:', data);
        setOrders(data.results || data);
        setAuthStatus(`✅ Authentication successful! Found ${data.results?.length || data.length || 0} orders`);
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
        setAuthStatus(`❌ Authentication failed: ${response.status} ${response.statusText}`);
        setError(errorText);
      }
    } catch (error) {
      console.error('💥 Error:', error);
      setAuthStatus(`❌ Network error: ${error.message}`);
      setError(error.message);
    }
  };

  const testSpecificOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔍 Testing order ${orderId}...`);

      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Order ${orderId} response:`, response.status, response.statusText);

      if (response.ok) {
        const orderData = await response.json();
        console.log(`✅ Order ${orderId} data:`, orderData);
        alert(`Order ${orderId} loaded successfully!`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Order ${orderId} error:`, errorText);
        alert(`Order ${orderId} failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`💥 Order ${orderId} error:`, error);
      alert(`Order ${orderId} network error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Authentication Test Page</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Authentication Status:</h2>
            <p className="text-gray-700">{authStatus}</p>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={testAuth}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-4"
            >
              🔄 Test Authentication
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              📋 Go to My Orders
            </button>
          </div>

          {orders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Orders:</h2>
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium">Order #{order.order_number}</span>
                      <span className="ml-2 text-sm text-gray-600">Status: {order.order_status}</span>
                    </div>
                    <button
                      onClick={() => testSpecificOrder(order.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Test Order {order.id}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Make sure you're logged in as feedback_test_user</li>
              <li>Click "Test Authentication" to check your token</li>
              <li>If authentication works, you should see your orders</li>
              <li>Click "Test Order X" to test specific order access</li>
              <li>Check the browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage;
