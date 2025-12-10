// Free AI Service for Chatbot
// This service provides multiple free AI options for the chatbot

class AIService {
  constructor() {
    this.apiKey = null; // No API key needed for free services
    this.fallbackEnabled = true;
  }

  // Method 1: Using Hugging Face Inference API (completely free)
  async getHuggingFaceResponse(message, conversationHistory = []) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            past_user_inputs: conversationHistory.filter(m => m.type === 'user').slice(-3).map(m => m.text),
            generated_responses: conversationHistory.filter(m => m.type === 'bot').slice(-3).map(m => m.text),
            text: message
          },
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.generated_text) {
          return {
            text: data.generated_text,
            source: 'huggingface'
          };
        }
      }
    } catch (error) {
      console.log('Hugging Face API failed:', error);
    }
    return null;
  }

  // Method 2: Using Cohere API (free tier)
  async getCohereResponse(message) {
    try {
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_COHERE_API_KEY', // Replace with actual key
        },
        body: JSON.stringify({
          message: message,
          model: 'command',
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          return {
            text: data.text,
            source: 'cohere'
          };
        }
      }
    } catch (error) {
      console.log('Cohere API failed:', error);
    }
    return null;
  }

  // Method 3: Using Groq API (free tier)
  async getGroqResponse(message) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_GROQ_API_KEY', // Replace with actual key
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are SweetBite\'s AI assistant, a helpful virtual assistant for a cake shop. Help customers with cake recommendations, customization, pricing, delivery, and general inquiries about cakes and pastries. Be friendly, helpful, and knowledgeable about cakes.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          model: 'llama3-8b-8192',
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          return {
            text: data.choices[0].message.content,
            source: 'groq'
          };
        }
      }
    } catch (error) {
      console.log('Groq API failed:', error);
    }
    return null;
  }

  // Method 4: Using local AI model (Ollama)
  async getLocalAIResponse(message) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: `You are SweetBite's AI assistant for a cake shop. Help the customer with: ${message}`,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.response) {
          return {
            text: data.response,
            source: 'ollama'
          };
        }
      }
    } catch (error) {
      console.log('Local Ollama API failed:', error);
    }
    return null;
  }

  // Main method that tries all free AI services
  async getAIResponse(message, conversationHistory = []) {
    // Try different free AI services in order of preference
    const services = [
      () => this.getHuggingFaceResponse(message, conversationHistory),
      () => this.getGroqResponse(message),
      () => this.getCohereResponse(message),
      () => this.getLocalAIResponse(message)
    ];

    for (const service of services) {
      try {
        const result = await service();
        if (result && result.text) {
          return result;
        }
      } catch (error) {
        console.log('AI service failed, trying next...', error);
        continue;
      }
    }

    return null; // All AI services failed
  }

  // Enhanced rule-based fallback with more intelligent responses
  getRuleBasedResponse(message, conversationHistory = []) {
    const msg = message.toLowerCase();
    
    // Context-aware responses based on conversation history
    const lastBotMessage = conversationHistory.filter(m => m.type === 'bot').slice(-1)[0];
    const lastUserMessage = conversationHistory.filter(m => m.type === 'user').slice(-1)[0];
    
    // Cake recommendations with context
    if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('best') || msg.includes('popular')) {
      return {
        text: "I'd love to recommend some amazing cakes! 🍰\n\nOur top-rated options include:\n• Chocolate Fudge Delight - RS 450 (4.8⭐)\n• Vanilla Dream Cake - RS 380 (4.7⭐)\n• Strawberry Shortcake - RS 420 (4.9⭐)\n\nWhat type of occasion are you celebrating?",
        suggestions: ['Birthday cake', 'Wedding cake', 'Anniversary special', 'Just for fun']
      };
    }

    // Pricing with context
    if (msg.includes('price') || msg.includes('cost') || msg.includes('expensive')) {
      return {
        text: "Great question about pricing! 💰\n\nOur cakes range from RS 300 to RS 800:\n• Basic cakes: RS 300-400\n• Premium cakes: RS 500-600\n• Custom designs: RS 600-800\n• Size upgrades: +RS 15-45\n• Customization: +RS 2-12 per option\n\nWould you like a specific price quote?",
        suggestions: ['Get price quote', 'Show me budget options', 'What\'s included?']
      };
    }

    // Delivery with context
    if (msg.includes('delivery') || msg.includes('shipping') || msg.includes('time')) {
      return {
        text: "We offer excellent delivery options! 🚚\n\n• Same-day delivery (orders before 2 PM)\n• Next-day delivery (orders after 2 PM)\n• Free delivery on orders over RS 100\n• Preparation time: 2-4 hours\n• Delivery areas: All major cities\n\nWhat's your delivery address?",
        suggestions: ['Check my area', 'Delivery cost?', 'Track my order']
      };
    }

    // Customization with context
    if (msg.includes('customize') || msg.includes('custom') || msg.includes('personalize')) {
      return {
        text: "Customization is our specialty! 🎨\n\nYou can customize:\n• Size: 6\", 8\", 10\", 12\"\n• Shape: Round, Square, Heart, Rectangle\n• Frosting: Buttercream, Cream Cheese, Chocolate\n• Toppings: Berries, Chocolate, Sprinkles, Flowers\n• Personal messages (up to 30 characters)\n\nWhich cake would you like to customize?",
        suggestions: ['Start customizing', 'Show options', 'See examples']
      };
    }

    // Default intelligent response
    return {
      text: "I'm here to help you find the perfect cake! 🍰\n\nI can assist with:\n• Cake recommendations\n• Customization options\n• Pricing and delivery\n• Special occasions\n• Dietary requirements\n\nWhat would you like to know?",
      suggestions: ['Show me cakes', 'Help me customize', 'Tell me about pricing', 'What can you help with?']
    };
  }
}

export default new AIService();

