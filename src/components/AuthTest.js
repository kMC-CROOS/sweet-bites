import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthTest = () => {
  const [testResults, setTestResults] = useState([]);
  const { login, register } = useAuth();

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testLogin = async () => {
    addResult('Testing login...', 'info');
    try {
      const result = await login('testuser', 'testpass123');
      if (result.success) {
        addResult('✅ Login successful!', 'success');
      } else {
        addResult(`❌ Login failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Login error: ${error.message}`, 'error');
    }
  };

  const testRegister = async () => {
    addResult('Testing registration...', 'info');
    try {
      const result = await register({
        email: `testuser${Date.now()}@example.com`,
        password: 'testpass123',
        confirmPassword: 'testpass123',
        first_name: 'Test',
        last_name: 'User'
      });
      if (result.success) {
        addResult('✅ Registration successful!', 'success');
      } else {
        addResult(`❌ Registration failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Registration error: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Login
        </button>
        <button
          onClick={testRegister}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Registration
        </button>
        <button
          onClick={clearResults}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded ${
              result.type === 'success' ? 'bg-green-100 text-green-800' :
              result.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            <span className="text-sm text-gray-500">[{result.timestamp}]</span> {result.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthTest;


