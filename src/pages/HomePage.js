import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import LoginModal from '../components/LoginModal';
import OfferBanner from '../components/OfferBanner';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { fetchCakes, fetchCategories } from '../data/cakes';

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCake, setSelectedCake] = useState(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCakes, setLoadingCakes] = useState(true);
  const [offers, setOffers] = useState([]);
  const [popupOffers, setPopupOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [dismissedOffers, setDismissedOffers] = useState(new Set());
  const [dismissedPopups, setDismissedPopups] = useState(new Set());
  const [showOffers, setShowOffers] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();

  const filteredCakes = selectedCategory === 'all'
    ? (Array.isArray(cakes) ? cakes.slice(0, 6) : [])
    : (Array.isArray(cakes) ? cakes.filter(cake => {
      // Handle both string category (from static data) and object category (from API)
      const cakeCategory = typeof cake.category === 'string' ? cake.category : cake.category?.name;
      console.log(`Filtering cake: ${cake.name}, category: ${cakeCategory}, selected: ${selectedCategory}, match: ${cakeCategory === selectedCategory}`);
      return cakeCategory === selectedCategory;
    }).slice(0, 4) : []);


  // Fetch cakes and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCakes(true);
        const [fetchedCakes, fetchedCategories] = await Promise.all([
          fetchCakes(),
          fetchCategories()
        ]);
        setCakes(fetchedCakes);
        setCategories(fetchedCategories);
        console.log('Loaded cakes:', fetchedCakes);
        console.log('Loaded categories:', fetchedCategories);
      } catch (error) {
        console.error('Error loading data:', error);
        setCakes([]);
        setCategories([]);
      } finally {
        setLoadingCakes(false);
      }
    };

    loadData();
  }, []);


  // Fetch real customer feedback with images from backend
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true);

        // Try to fetch real customer feedback first
        const feedbackResponse = await axios.get('http://localhost:8000/api/feedback/');
        console.log('Fetched customer feedback:', feedbackResponse.data);

        // Transform real feedback to testimonials format
        const realFeedbacks = Array.isArray(feedbackResponse.data) ? feedbackResponse.data : [];
        const transformedTestimonials = realFeedbacks
          .filter(feedback => feedback.message && feedback.message.trim().length > 0) // Only feedback with messages
          .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating
          .slice(0, 3) // Get top 3 feedbacks
          .map((feedback) => ({
            id: feedback.id,
            name: feedback.user?.username || 'Verified Customer',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(feedback.user?.username || 'Customer')}&background=f3e8ff&color=8b5cf6&size=100`,
            comment: feedback.message,
            rating: feedback.rating || 5,
            isRealCustomer: true
          }));

        setTestimonials(transformedTestimonials);

      } catch (error) {
        console.error('Error fetching customer feedback:', error);
        // No fallback testimonials - only show real customer feedback
        setTestimonials([]);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Load offers from backend
  const loadOffers = async () => {
    try {
      setLoadingOffers(true);

      // Load all active offers (both homepage and popup)
      const [homepageResponse, popupResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/offers/homepage/'),
        axios.get('http://localhost:8000/api/offers/popup/')
      ]);

      setOffers(homepageResponse.data);
      setPopupOffers(popupResponse.data);

      console.log('Loaded homepage offers:', homepageResponse.data);
      console.log('Loaded popup offers:', popupResponse.data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Load offers on component mount
  useEffect(() => {
    loadOffers();
  }, []);

  // Show offers immediately after loading (only for non-admin users)
  useEffect(() => {
    // Don't show popups for admin users
    if (user && user.user_type === 'admin') {
      return;
    }

    if (!loadingOffers && (offers.length > 0 || popupOffers.length > 0)) {
      setShowOffers(true);
    }
  }, [loadingOffers, offers.length, popupOffers.length, user]);

  // Handle offer dismissal
  const handleDismissOffer = (offerId) => {
    setDismissedOffers(prev => new Set([...prev, offerId]));
  };

  // Handle popup offer dismissal - when popup is closed, don't dismiss completely
  // Instead, just remove from popup but keep it available for banner display
  const handleDismissPopup = (offerId) => {
    setDismissedPopups(prev => new Set([...prev, offerId]));
    // Don't add to dismissedOffers - this allows it to show as banner
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Comprehensive validation
    if (newReview.rating === 0) {
      alert('Please select a rating (1-5 stars)');
      return;
    }

    if (!newReview.comment || newReview.comment.trim().length === 0) {
      alert('Please write a comment about your experience');
      return;
    }

    if (newReview.comment.trim().length < 10) {
      alert('Comment must be at least 10 characters long');
      return;
    }

    if (newReview.comment.trim().length > 500) {
      alert('Comment must be less than 500 characters');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting review for cake:', selectedCake.id);
      console.log('Review data:', { rating: newReview.rating, comment: newReview.comment });
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Token value:', token);
      console.log('isAuthenticated:', isAuthenticated);

      if (!token || !isAuthenticated) {
        alert('Please log in to submit a review');
        setShowLoginModal(true);
        setSubmittingReview(false);
        return;
      }

      console.log('Making request with headers:', {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await axios.post(`http://localhost:8000/api/cakes/${selectedCake.id}/reviews/create/`, {
        rating: newReview.rating,
        comment: newReview.comment
      }, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Review submission successful:', response.data);

      // Update the cake's rating locally
      const updatedCakes = filteredCakes.map(cake =>
        cake.id === selectedCake.id
          ? { ...cake, rating: (cake.rating + newReview.rating) / 2, reviewCount: cake.reviewCount + 1 }
          : cake
      );

      setNewReview({ rating: 0, comment: '' });
      setShowReviewModal(false);
      setSelectedCake(null);
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Full error object:', error);

      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
        setShowLoginModal(true);
        // Clear invalid token
        localStorage.removeItem('token');
      } else if (error.response?.status === 400) {
        if (error.response.data?.error?.includes('already reviewed')) {
          alert('You have already reviewed this cake. You can only review each cake once.');
        } else {
          alert('Invalid review data. Please check your rating and comment.');
        }
      } else if (error.response?.status === 404) {
        alert('Cake not found. Please try again.');
      } else {
        alert('Error submitting review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewModal = (cake) => {
    console.log('Opening review modal - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      alert('Please log in to submit a review');
      setShowLoginModal(true);
      return;
    }
    setSelectedCake(cake);
    setShowReviewModal(true);
  };

  const customizationOptions = [
    {
      id: 1,
      name: 'Choose Flavor',
      description: 'Select from our premium cake flavors',
      icon: '🍰'
    },
    {
      id: 2,
      name: 'Pick Shape',
      description: 'Round, square, heart, or custom shapes',
      icon: '⭐'
    },
    {
      id: 3,
      name: 'Select Size',
      description: 'Perfect size for your celebration (eg 1 inch, 2inch, 3inch ....)',
      icon: '📏'
    },
    {
      id: 4,
      name: 'Add Message',
      description: 'Personalize with your special message',
      icon: '💝'
    }
  ];

  const features = [
    {
      id: 1,
      name: 'Fresh Ingredients',
      description: 'We use only the finest, freshest ingredients for every cake.',
      icon: '🌱'
    },
    {
      id: 2,
      name: 'Fast Delivery',
      description: 'Same-day delivery available for orders placed before 2 PM.',
      icon: '🚚'
    },
    {
      id: 3,
      name: 'Custom Designs',
      description: 'Create your dream cake with our easy customization tool.',
      icon: '🎨'
    }
  ];


  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <HeroSection
        isAuthenticated={isAuthenticated}
        onShowLogin={() => setShowLoginModal(true)}
      />

      {/* All offers are now displayed as popups - no banner section needed */}

      {/* Categories Section */}
      <CategoriesSection
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Featured Cakes Section */}
      <FeaturedCakesSection
        cakes={filteredCakes}
        loading={loadingCakes}
        onAddToCart={addItem}
        onReview={openReviewModal}
      />

      {/* Customization Showcase */}
      <CustomizationShowcase customizationOptions={customizationOptions} />

      {/* Why Choose SweetBite */}
      <WhyChooseSection features={features} />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} loading={loadingTestimonials} navigate={navigate} />


      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Review Modal */}
      {showReviewModal && selectedCake && (
        <ReviewModal
          cake={selectedCake}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedCake(null);
            setNewReview({ rating: 0, comment: '' });
          }}
          onSubmit={handleReviewSubmit}
          review={newReview}
          setReview={setNewReview}
          submitting={submittingReview}
        />
      )}

      {/* All Offers as Popups (only for non-admin users) */}
      {showOffers && (offers.length > 0 || popupOffers.length > 0) && (!user || user.user_type !== 'admin') && (
        <>
          {/* Regular offers as popups */}
          {offers
            .filter(offer => !dismissedOffers.has(offer.id))
            .map(offer => (
              <OfferBanner
                key={`popup-${offer.id}`}
                offer={offer}
                onClose={() => handleDismissOffer(offer.id)}
                isPopup={true}
              />
            ))
          }
          {/* Popup offers as popups */}
          {popupOffers
            .filter(offer => !dismissedPopups.has(offer.id))
            .map(offer => (
              <OfferBanner
                key={`popup-popup-${offer.id}`}
                offer={offer}
                onClose={() => handleDismissPopup(offer.id)}
                isPopup={true}
              />
            ))
          }
        </>
      )}

      {/* Contact Us Section */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Contact Us
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get in touch with us for orders, inquiries, or just to say hello!
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Facebook Button */}
              <a
                href="https://www.facebook.com/profile.php?id=61575974396933"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Visit Our Facebook
              </a>

              {/* Phone Call Button */}
              <a
                href="tel:+94758549382"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us: +94 758 549 382
              </a>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>📱 Available 24/7 for your sweet cravings!</p>
              <p className="mt-1">🍰 Fresh cakes made daily • 🚚 Free delivery on orders over Rs. 2000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

// Hero Section Component
const HeroSection = ({ isAuthenticated, onShowLogin }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="hero-content text-center max-w-4xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-bold text-gray-800 mb-6"
        >
          SweetBite
          <span className="block text-4xl md:text-5xl text-sweetbite-600 mt-2">
            Where Dreams Become Cakes
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
        >
          Discover our handcrafted cakes, customize them to your heart's desire,
          and experience the sweetest moments delivered to your doorstep.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/menu" className="btn-primary">
            Explore Our Cakes
          </Link>
          <Link to="/customize" className="btn-secondary">
            Customize Your Cake
          </Link>
        </motion.div>

        {/* Authentication Section for non-authenticated users */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="auth-section mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl max-w-md mx-auto"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Join SweetBite
            </h3>
            <p className="text-gray-600 mb-4">
              Create an account to save your favorite cakes, track orders, and get exclusive offers!
            </p>
            <button
              onClick={onShowLogin}
              className="w-full bg-sweetbite-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In / Sign Up
            </button>
          </motion.div>
        )}
      </div>

      {/* Floating Cake Elements */}
      <div className="floating-element absolute bottom-10 left-10 animate-bounce">
        <span className="text-4xl">🍰</span>
      </div>
      <div className="floating-element absolute top-20 right-10 animate-bounce animation-delay-1000">
        <span className="text-3xl">🎂</span>
      </div>
    </section>
  );
};

// Categories Section Component
const CategoriesSection = ({ categories, selectedCategory, onCategoryChange }) => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Cake Categories
          </h2>
          <p className="text-gray-600 text-lg">
            Choose from our wide variety of delicious cake categories
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => onCategoryChange(category.id)}
              className={`p-4 rounded-lg text-center transition-all transform hover:scale-105 ${selectedCategory === category.id
                ? 'bg-sweetbite-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-sweetbite-100'
                }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <span className="text-sm font-semibold">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Featured Cakes Section Component
const FeaturedCakesSection = ({ cakes, loading, onAddToCart, onReview }) => {
  console.log('FeaturedCakesSection - cakes:', cakes, 'loading:', loading);
  return (
    <section className="py-16 gradient-bg">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Featured Cakes
          </h2>
          <p className="text-gray-600 text-lg">
            Handcrafted with love and the finest ingredients
          </p>
        </motion.div>


        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="card min-h-[500px] animate-pulse">
                <div className="h-72 bg-gray-300 rounded-t-lg"></div>
                <div className="p-6 pb-8">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="flex justify-between mb-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-8 bg-gray-300 rounded"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {(Array.isArray(cakes) ? cakes : []).map((cake, index) => {
              console.log('Rendering cake:', cake);
              return (
                <CakeCard
                  key={cake.id}
                  cake={cake}
                  onAddToCart={onAddToCart}
                  onReview={onReview}
                  index={index}
                />
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/menu" className="btn-primary">
            View All Cakes
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Cake Card Component
const CakeCard = ({ cake, onAddToCart, onReview, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  console.log('CakeCard rendering for:', cake.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="card cursor-pointer min-h-[500px]"
      onClick={() => window.location.href = `/cake/${cake.id}`}
    >
      {/* Cake Image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={cake.image}
          alt={cake.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop';
          }}
        />

        {/* Overlay with buttons */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Quick Add clicked for cake:', cake);
                onAddToCart(cake);
              }}
              className="bg-sweetbite-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-sweetbite-700 transition-colors"
            >
              Quick Add
            </button>
            <Link
              to={`/cake/${cake.id}`}
              className="bg-white text-sweetbite-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Price Tag */}
        <div className="absolute top-4 right-4 bg-sweetbite-600 text-white px-3 py-1 rounded-full font-semibold">
          RS {cake.price}
        </div>
      </div>

      {/* Cake Details */}
      <div className="p-6 pb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {cake.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {cake.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => {
                const rating = cake.rating || 0;
                const starNumber = i + 1;
                const isFullStar = starNumber <= Math.floor(rating);
                const isHalfStar = starNumber === Math.ceil(rating) && rating % 1 !== 0;

                return (
                  <div key={i} className="relative">
                    {/* Background star */}
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>

                    {/* Filled star */}
                    {(isFullStar || isHalfStar) && (
                      <svg
                        className={`w-4 h-4 text-yellow-400 absolute top-0 left-0 ${isHalfStar ? 'clip-path-half' : ''
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        style={isHalfStar ? { clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' } : {}}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-sm text-gray-600 ml-1">
              {cake.rating ? cake.rating.toFixed(1) : '0.0'} ({cake.review_count || cake.reviewCount || 0})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Add to cart clicked for cake:', cake);
                onAddToCart(cake);
              }}
              className="bg-sweetbite-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors text-xs sm:text-sm flex-1"
            >
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview(cake);
              }}
              className="bg-yellow-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-xs sm:text-sm flex-1"
            >
              ⭐ Review
            </button>
            <Link
              to={`/cake/${cake.id}`}
              className="border border-sweetbite-600 text-sweetbite-600 px-3 py-2 rounded-lg font-semibold hover:bg-sweetbite-50 transition-colors text-xs sm:text-sm flex-1 text-center"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Customization Showcase Component
const CustomizationShowcase = ({ customizationOptions }) => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Customize Your Dream Cake
          </h2>
          <p className="text-gray-600 text-lg">
            Make it uniquely yours with our easy customization options
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {customizationOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-sweetbite-100 to-pink-100 rounded-2xl p-8 mb-4">
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {option.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {option.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/customize" className="btn-primary">
            Start Customizing
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Why Choose SweetBite Section
const WhyChooseSection = ({ features }) => {
  return (
    <section className="py-16 gradient-bg">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Why Choose SweetBite?
          </h2>
          <p className="text-gray-600 text-lg">
            We're committed to delivering the sweetest experiences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = ({ testimonials, loading, navigate }) => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {testimonials.length > 0 ? 'What Our Customers Say' : 'Customer Feedback'}
          </h2>
          <p className="text-gray-600 text-lg">
            {testimonials.length > 0
              ? 'Real feedback with photos from verified customers who ordered with us'
              : 'Share your sweet experience with us!'
            }
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-gradient-to-br from-sweetbite-50 to-pink-50 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-sweetbite-50 to-pink-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Customer Images */}
                {testimonial.images && testimonial.images.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {testimonial.images.slice(0, 2).map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image.image || image.url || image}
                          alt={`Customer photo ${imgIndex + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                    {testimonial.images.length > 2 && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        +{testimonial.images.length - 2} more photos
                      </p>
                    )}
                  </div>
                )}

                {/* Customer Info */}
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-white shadow-sm"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=f3e8ff&color=8b5cf6&size=100`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                      {testimonial.isRealCustomer && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {testimonial.rating}/5
                      </span>
                    </div>

                    {/* Order Info */}
                    {testimonial.order_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Order #{testimonial.order_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-600 italic leading-relaxed">
                  "{testimonial.comment}"
                </p>

                {/* Detailed Ratings */}
                {testimonial.detailed_ratings && Object.keys(testimonial.detailed_ratings).some(key => testimonial.detailed_ratings[key] > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {testimonial.detailed_ratings.taste > 0 && (
                        <div className="text-center">
                          <div className="text-gray-500">Taste</div>
                          <div className="font-semibold text-sweetbite-600">
                            {testimonial.detailed_ratings.taste}/5
                          </div>
                        </div>
                      )}
                      {testimonial.detailed_ratings.presentation > 0 && (
                        <div className="text-center">
                          <div className="text-gray-500">Design</div>
                          <div className="font-semibold text-sweetbite-600">
                            {testimonial.detailed_ratings.presentation}/5
                          </div>
                        </div>
                      )}
                      {testimonial.detailed_ratings.delivery > 0 && (
                        <div className="text-center">
                          <div className="text-gray-500">Service</div>
                          <div className="font-semibold text-sweetbite-600">
                            {testimonial.detailed_ratings.delivery}/5
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Date */}
                {testimonial.created_at && (
                  <p className="text-xs text-gray-400 mt-3 text-right">
                    {new Date(testimonial.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🍰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Be Our First Reviewer!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're excited to hear from our customers! Order a cake and share your experience with photos to help others discover our delicious treats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/cakes')}
                className="px-6 py-3 bg-sweetbite-600 text-white rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors"
              >
                Browse Our Cakes
              </button>
              <button
                onClick={() => navigate('/feedback')}
                className="px-6 py-3 border-2 border-sweetbite-600 text-sweetbite-600 rounded-lg font-semibold hover:bg-sweetbite-50 transition-colors"
              >
                Leave Feedback
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};


// Review Modal Component
const ReviewModal = ({ cake, isOpen, onClose, onSubmit, review, setReview, submitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Review {cake.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                  className={`w-8 h-8 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              value={review.comment}
              onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this cake... (minimum 10 characters)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none resize-none"
              rows={3}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {review.comment.length}/500 characters
              {review.comment.length < 10 && (
                <span className="text-red-500 ml-2">
                  (Need at least {10 - review.comment.length} more characters)
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || review.rating === 0 || !review.comment || review.comment.trim().length < 10}
              className="flex-1 bg-sweetbite-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
