import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status with token:', token ? 'present' : 'missing');
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Auth status response:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Auth status success:', userData);
        setUser(userData);
      } else {
        console.log('Auth status failed, logging out');
        // Token is invalid, remove it
        logout();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Making login request to:', '/api/users/auth/login/');
      console.log('Login data:', { username: email, password: '***' });

      const response = await fetch('http://localhost:8000/api/users/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username: email, password })
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Login success data:', data);
        const { token: newToken, user: userData } = data;

        console.log('Setting token:', newToken);
        console.log('Setting user:', userData);

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        console.log('Login successful, returning success');
        return { success: true, user: userData };
      } else {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          console.log('Login error data:', errorData);
          errorMessage = errorData.message || errorData.detail || errorMessage;

          // Handle specific error cases
          if (errorData.errors) {
            if (errorData.errors.non_field_errors) {
              errorMessage = errorData.errors.non_field_errors[0];
            } else if (errorData.errors.username) {
              errorMessage = errorData.errors.username[0];
            } else if (errorData.errors.password) {
              errorMessage = errorData.errors.password[0];
            }
          }
        } catch (e) {
          console.error('Error parsing login response:', e);
          errorMessage = response.statusText || errorMessage;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: 'Network error occurred. Please check your connection.' };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Making registration request to:', '/api/users/auth/register/');
      console.log('Registration data:', {
        username: userData.email,
        email: userData.email,
        password: '***',
        confirmPassword: '***',
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      const response = await fetch('http://localhost:8000/api/users/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: userData.email, // Use email as username
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.confirmPassword,
          first_name: userData.first_name,
          last_name: userData.last_name
        })
      });

      console.log('Registration response status:', response.status);
      console.log('Registration response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration success data:', data);
        const { token: newToken, user: newUser } = data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser };
      } else {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          console.log('Registration error data:', errorData);
          errorMessage = errorData.message || errorData.detail || errorMessage;

          // Handle specific error cases
          if (errorData.errors) {
            if (errorData.errors.username) {
              errorMessage = errorData.errors.username[0];
            } else if (errorData.errors.email) {
              errorMessage = errorData.errors.email[0];
            } else if (errorData.errors.password) {
              errorMessage = errorData.errors.password[0];
            } else if (errorData.errors.confirmPassword) {
              errorMessage = errorData.errors.confirmPassword[0];
            } else if (errorData.errors.first_name) {
              errorMessage = errorData.errors.first_name[0];
            } else if (errorData.errors.last_name) {
              errorMessage = errorData.errors.last_name[0];
            } else if (errorData.errors.non_field_errors) {
              errorMessage = errorData.errors.non_field_errors[0];
            }
          }
        } catch (e) {
          console.error('Error parsing registration response:', e);
          errorMessage = response.statusText || errorMessage;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Registration network error:', error);
      return { success: false, error: 'Network error occurred. Please check your connection.' };
    }
  };

  const logout = (navigate = null) => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);

    // Redirect to home page if navigate function is provided
    if (navigate) {
      navigate('/');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('🔄 AuthContext: Updating profile with data:', profileData);
      console.log('🔑 AuthContext: Using token:', token ? `${token.substring(0, 20)}...` : 'No token');

      const response = await fetch('http://localhost:8000/api/users/profile/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      console.log('📡 AuthContext: Profile update response status:', response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('✅ AuthContext: Profile updated successfully:', updatedUser);
        setUser(updatedUser);
        return { success: true };
      } else {
        const errorData = await response.json();
        console.log('❌ AuthContext: Profile update error:', errorData);
        return { success: false, error: errorData.message || 'Profile update failed' };
      }
    } catch (error) {
      console.error('💥 AuthContext: Profile update error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
