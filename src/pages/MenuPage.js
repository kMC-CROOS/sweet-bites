import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { fetchCakes, fetchCategories } from '../data/cakes';

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();

  // Fetch cakes and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [fetchedCakes, fetchedCategories] = await Promise.all([
          fetchCakes(),
          fetchCategories()
        ]);

        console.log('📊 Loaded cakes:', fetchedCakes);
        console.log('📊 Loaded categories:', fetchedCategories);

        setCakes(fetchedCakes);
        setCategories(fetchedCategories);
        console.log('MenuPage - Loaded cakes:', fetchedCakes.length);
        console.log('MenuPage - Loaded categories:', fetchedCategories.length);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load menu data');
        setCakes([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredCakes = cakes.filter(cake => {
    // Handle both string category (from static data) and object category (from API)
    const cakeCategory = typeof cake.category === 'string' ? cake.category : cake.category?.name;
    const cakeCategoryId = typeof cake.category === 'object' ? cake.category?.id : null;

    // Debug logging
    if (selectedCategory !== 'all') {
      console.log('🔍 Filtering cake:', cake.name);
      console.log('🔍 Cake category:', cake.category);
      console.log('🔍 Cake category name:', cakeCategory);
      console.log('🔍 Cake category ID:', cakeCategoryId);
      console.log('🔍 Selected category:', selectedCategory);
      console.log('🔍 Selected category type:', typeof selectedCategory);
    }

    // Convert selectedCategory to number for comparison with cakeCategoryId
    const selectedCategoryId = selectedCategory === 'all' ? null : parseInt(selectedCategory);

    // Check if selectedCategory is 'all' or matches by ID
    const matchesCategory = selectedCategory === 'all' ||
      selectedCategoryId === cakeCategoryId;

    console.log('🔍 Selected category ID:', selectedCategoryId);
    console.log('🔍 Matches category:', matchesCategory);

    const matchesSearch = cake.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cake.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedCakes = [...filteredCakes].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Cake Menu</h1>
          <p className="text-gray-600 text-lg">
            Discover our handcrafted cakes, each made with love and the finest ingredients
          </p>


          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Cakes</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-sweetbite-600 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedCakes.length} of {cakes.length} cakes
          </p>
        </div>

        {/* Cakes Grid */}
        {sortedCakes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedCakes.map((cake, index) => (
              <CakeCard
                key={cake.id}
                cake={cake}
                onAddToCart={addItem}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No cakes found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Cake Card Component
const CakeCard = ({ cake, onAddToCart, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
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
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-sm text-gray-600">({cake.reviewCount || 0})</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Preparation: {cake.preparationTime || '2-3 hours'}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cake.isCustomizable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {cake.isCustomizable ? 'Customizable' : 'Standard'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add to cart clicked for cake:', cake);
              console.log('Cake ID:', cake.id);
              console.log('Cake Price:', cake.price);
              console.log('Cake Name:', cake.name);

              // Test with a simple object first
              const testItem = {
                id: cake.id || 1,
                name: cake.name || 'Test Cake',
                price: cake.price || 100,
                description: cake.description || 'Test description'
              };

              console.log('Adding test item:', testItem);
              onAddToCart(testItem);
            }}
            className="w-full bg-sweetbite-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors"
          >
            Add to Cart
          </button>
          <Link
            to={`/cake/${cake.id}`}
            className="w-full bg-gray-100 text-sweetbite-600 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuPage;
