import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginTestPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: 'feedback_test_user',
    password: 'testpass123'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      console.log('🔐 Attempting login with:', credentials.username);
      
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      console.log('📡 Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);
        
        // Store token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setResult(`✅ Login successful! Token: ${data.token.substring(0, 20)}...`);
        
        // Test orders API immediately
        setTimeout(() => {
          testOrdersAPI(data.token);
        }, 1000);
        
      } else {
        const errorData = await response.json();
        console.log('❌ Login failed:', errorData);
        setResult(`❌ Login failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setResult(`💥 Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testOrdersAPI = async (token) => {
    try {
      console.log('🔍 Testing orders API with token...');
      
      const response = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Orders API response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Orders API successful:', data);
        setResult(prev => prev + `\n✅ Orders API works! Found ${data.results?.length || data.length || 0} orders`);
      } else {
        const errorText = await response.text();
        console.log('❌ Orders API failed:', errorText);
        setResult(prev => prev + `\n❌ Orders API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Orders API error:', error);
      setResult(prev => prev + `\n💥 Orders API error: ${error.message}`);
    }
  };

  const testSpecificOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('❌ No token found. Please login first.');
        return;
      }

      console.log('🔍 Testing order 65...');
      
      const response = await fetch('http://localhost:8000/api/orders/orders/65/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Order 65 response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order 65 successful:', data);
        setResult(prev => prev + `\n✅ Order 65 works! Status: ${data.order_status}`);
      } else {
        const errorText = await response.text();
        console.log('❌ Order 65 failed:', errorText);
        setResult(prev => prev + `\n❌ Order 65 failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Order 65 error:', error);
      setResult(prev => prev + `\n💥 Order 65 error: ${error.message}`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setResult('🗑️ Storage cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">🔐 Login & API Test</h1>
          
          <form onSubmit={handleLogin} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username:
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password:
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : '🔐 Login & Test API'}
              </button>
              
              <button
                type="button"
                onClick={testSpecificOrder}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                🧪 Test Order 65
              </button>
              
              <button
                type="button"
                onClick={clearStorage}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                🗑️ Clear Storage
              </button>
            </div>
          </form>

          {result && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Current Storage:</h3>
            <div className="text-sm text-gray-600">
              <p>Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}</p>
              <p>User: {localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              📋 Go to My Orders
            </button>
            
            <button
              onClick={() => navigate('/auth-test')}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
            >
              🔧 Go to Auth Test
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Click "Login & Test API" to authenticate and test the orders API</li>
              <li>If login works, click "Test Order 65" to test specific order access</li>
              <li>Check browser console for detailed logs</li>
              <li>If everything works, go to "My Orders" page</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTestPage;
