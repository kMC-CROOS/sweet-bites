// API Configuration - Use relative URLs to leverage proxy
const API_BASE_URL = '';

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

// Helper function to make authenticated requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();
  
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };
  
  return fetch(url, config);
};

export default API_BASE_URL;
