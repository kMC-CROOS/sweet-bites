import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { fetchCakes, fetchCategories } from '../data/cakes';
import aiService from '../services/aiService';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch cakes and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCakes, fetchedCategories] = await Promise.all([
          fetchCakes(),
          fetchCategories()
        ]);
        setCakes(fetchedCakes);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading data for chatbot:', error);
        setCakes([]);
        setCategories([]);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: "Hi! I'm SweetBite's AI-powered virtual assistant! 🍰🤖 I can help you with cake information, customization options, recommendations, and more. What would you like to know?",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Enhanced AI response using the AI service
  const getAIResponse = async (userMessage) => {
    try {
      const aiResponse = await aiService.getAIResponse(userMessage, messages);
      if (aiResponse && aiResponse.text) {
        return {
          text: aiResponse.text,
          suggestions: ['Tell me more', 'What else can you help with?', 'Show me cakes'],
          source: aiResponse.source
        };
      }
    } catch (error) {
      console.log('AI service failed, falling back to rule-based responses');
    }

    return null; // Fallback to rule-based
  };

  // Enhanced rule-based responses with more context
  const getBotResponse = (userMessage) => {
    return aiService.getRuleBasedResponse(userMessage, messages);
  };

  const handleSendMessage = async (text = null) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      let botResponse;

      // Try AI first if enabled
      if (aiEnabled) {
        botResponse = await getAIResponse(messageText);
      }

      // Fallback to rule-based if AI fails or is disabled
      if (!botResponse) {
        botResponse = getBotResponse(messageText);
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse.text,
        suggestions: botResponse.suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      // Fallback to rule-based response
      const botResponse = getBotResponse(messageText);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse.text,
        suggestions: botResponse.suggestions || [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const toggleAI = () => {
    setAiEnabled(!aiEnabled);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-sweetbite-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </motion.button>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-sweetbite-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🍰</span>
                </div>
                <div>
                  <h3 className="font-semibold">SweetBite AI Assistant</h3>
                  <p className="text-xs text-sweetbite-100">
                    {aiEnabled ? '🤖 AI Powered' : '📝 Rule-based'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleAI}
                  className={`px-2 py-1 rounded text-xs transition-colors ${aiEnabled
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                    }`}
                  title={aiEnabled ? 'AI Enabled' : 'AI Disabled'}
                >
                  {aiEnabled ? 'AI ON' : 'AI OFF'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-sweetbite-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${message.type === 'user'
                        ? 'bg-sweetbite-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => handleSendMessage("Show me popular cakes")}
                  className="px-3 py-1 bg-sweetbite-100 text-sweetbite-700 rounded-full text-xs hover:bg-sweetbite-200 transition-colors"
                >
                  🍰 Popular
                </button>
                <button
                  onClick={() => handleSendMessage("Help me customize")}
                  className="px-3 py-1 bg-sweetbite-100 text-sweetbite-700 rounded-full text-xs hover:bg-sweetbite-200 transition-colors"
                >
                  🎨 Customize
                </button>
                <button
                  onClick={() => handleSendMessage("Tell me about pricing")}
                  className="px-3 py-1 bg-sweetbite-100 text-sweetbite-700 rounded-full text-xs hover:bg-sweetbite-200 transition-colors"
                >
                  💰 Pricing
                </button>
                <button
                  onClick={() => handleSendMessage("What's your delivery?")}
                  className="px-3 py-1 bg-sweetbite-100 text-sweetbite-700 rounded-full text-xs hover:bg-sweetbite-200 transition-colors"
                >
                  🚚 Delivery
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none text-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className="px-4 py-3 bg-sweetbite-600 text-white rounded-lg hover:bg-sweetbite-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;