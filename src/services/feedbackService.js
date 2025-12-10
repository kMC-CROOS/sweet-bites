const API_BASE_URL = 'http://localhost:8000';

export const feedbackService = {
  async submitFeedback(feedbackData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  },

  async getFeedbackStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/stats/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Feedback stats error:', error);
      throw error;
    }
  },

  async getAllFeedback() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Feedback fetch error:', error);
      throw error;
    }
  }
};

export default feedbackService;
