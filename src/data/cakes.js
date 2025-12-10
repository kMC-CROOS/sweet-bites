// API Configuration
const API_BASE = 'http://localhost:8000/api';

// Cache for API data
let cakesCache = null;
let categoriesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch cakes from API
export const fetchCakes = async () => {
  const now = Date.now();

  // Return cached data if still valid
  if (cakesCache && (now - lastFetchTime) < CACHE_DURATION) {
    return cakesCache;
  }

  try {
    const response = await fetch(`${API_BASE}/cakes/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cakes: ${response.status}`);
    }
    const data = await response.json();

    // Handle paginated response - data is in 'results' field
    const cakesData = data.results || data;

    // Transform API data to match expected format
    // Preserve full category object so filtering by ID works reliably
    const transformedCakes = Array.isArray(cakesData) ? cakesData.map(cake => ({
      id: cake.id,
      name: cake.name,
      description: cake.description,
      price: parseFloat(cake.price),
      image: cake.image?.startsWith('/media/') ? `${API_BASE.replace('/api', '')}${cake.image}` : cake.image,
      category: cake.category ? { id: cake.category.id, name: cake.category.name } : null,
      rating: 4.5, // Default rating since API might not have this
      reviewCount: 0, // Default review count
      isCustomizable: cake.is_customizable || true,
      ingredients: cake.ingredients || [],
      allergens: cake.allergens || [],
      preparationTime: cake.preparation_time || "2-3 hours"
    })) : [];

    cakesCache = transformedCakes;
    lastFetchTime = now;
    return transformedCakes;
  } catch (error) {
    console.error('Error fetching cakes:', error);
    // Return empty array on error
    return [];
  }
};

// Function to fetch categories from API
export const fetchCategories = async () => {
  const now = Date.now();

  // Return cached data if still valid
  if (categoriesCache && (now - lastFetchTime) < CACHE_DURATION) {
    return categoriesCache;
  }

  try {
    const response = await fetch(`${API_BASE}/categories/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data = await response.json();

    // Handle paginated response - data is in 'results' field
    const categoriesData = data.results || data;

    // Transform API data to match expected format
    const transformedCategories = Array.isArray(categoriesData) ? categoriesData.map(category => ({
      id: category.id,
      name: category.name,
      icon: getCategoryIcon(category.name)
    })) : [];

    categoriesCache = transformedCategories;
    return transformedCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories on error
    return [
      { id: 1, name: "Chocolate", icon: "🍫" },
      { id: 2, name: "Vanilla", icon: "🍰" },
      { id: 3, name: "Red Velvet", icon: "❤️" },
      { id: 4, name: "Fruit", icon: "🍓" },
      { id: 5, name: "Citrus", icon: "🍋" },
      { id: 6, name: "Vegetable", icon: "🥕" },
      { id: 7, name: "Cupcakes", icon: "🧁" }
    ];
  }
};

// Helper function to get category icon
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    'chocolate': '🍫',
    'vanilla': '🍰',
    'red velvet': '❤️',
    'red-velvet': '❤️',
    'fruit': '🍓',
    'citrus': '🍋',
    'vegetable': '🥕',
    'cupcakes': '🧁',
    'cupcake': '🧁'
  };

  return iconMap[categoryName?.toLowerCase()] || '🍰';
};

// Export functions for backward compatibility
export const getCakes = fetchCakes;
export const getCategories = fetchCategories;

// For backward compatibility, export empty arrays initially
// These will be populated by the API calls
export const cakes = [];
export const categories = [];

// Customization options (these remain static as they're configuration data)
export const customizationOptions = {
  sizes: [
    { id: 1, name: "Small (6 inches)", priceModifier: 0 },
    { id: 2, name: "Medium (8 inches)", priceModifier: 500 },
    { id: 3, name: "Large (10 inches)", priceModifier: 1000 },
    { id: 4, name: "Extra Large (12 inches)", priceModifier: 1500 }
  ],
  shapes: [
    { id: 1, name: "Round", priceModifier: 0 },
    { id: 2, name: "Square", priceModifier: 200 },
    { id: 3, name: "Heart", priceModifier: 300 },
    { id: 4, name: "Rectangle", priceModifier: 250 }
  ],
  frostings: [
    { id: 1, name: "Buttercream", priceModifier: 0 },
    { id: 2, name: "Cream Cheese", priceModifier: 200 },
    { id: 3, name: "Chocolate Ganache", priceModifier: 300 },
    { id: 4, name: "Whipped Cream", priceModifier: 150 },
    { id: 5, name: "Fondant", priceModifier: 400 }
  ],
  toppings: [
    { id: 1, name: "Fresh Berries", priceModifier: 300 },
    { id: 2, name: "Chocolate Shavings", priceModifier: 200 },
    { id: 3, name: "Sprinkles", priceModifier: 100 },
    { id: 4, name: "Edible Flowers", priceModifier: 500 },
    { id: 5, name: "Nuts", priceModifier: 250 }
  ],
  colors: [
    { id: 1, name: "Pink", color: "#FF69B4", priceModifier: 0 },
    { id: 2, name: "Red", color: "#DC143C", priceModifier: 200 },
    { id: 3, name: "Blue", color: "#4169E1", priceModifier: 200 },
    { id: 4, name: "Green", color: "#32CD32", priceModifier: 200 },
    { id: 5, name: "Purple", color: "#8A2BE2", priceModifier: 200 },
    { id: 6, name: "Yellow", color: "#FFD700", priceModifier: 200 },
    { id: 7, name: "Orange", color: "#FF8C00", priceModifier: 200 },
    { id: 8, name: "White", color: "#FFFFFF", priceModifier: 0 }
  ]
};

// Cupcake-specific customization options (simplified)
export const cupcakeCustomizationOptions = {
  frostings: [
    { id: 1, name: "Buttercream", priceModifier: 0 },
    { id: 2, name: "Cream Cheese", priceModifier: 50 },
    { id: 3, name: "Chocolate Ganache", priceModifier: 75 },
    { id: 4, name: "Whipped Cream", priceModifier: 40 },
    { id: 5, name: "Red Velvet", priceModifier: 60 }
  ],
  toppings: [
    { id: 1, name: "Fresh Berries", priceModifier: 80 },
    { id: 2, name: "Chocolate Shavings", priceModifier: 60 },
    { id: 3, name: "Sprinkles", priceModifier: 30 },
    { id: 4, name: "Edible Flowers", priceModifier: 100 },
    { id: 5, name: "Nuts", priceModifier: 50 }
  ],
  colors: [
    { id: 1, name: "Pink", color: "#FF69B4", priceModifier: 0 },
    { id: 2, name: "Red", color: "#DC143C", priceModifier: 20 },
    { id: 3, name: "Blue", color: "#4169E1", priceModifier: 20 },
    { id: 4, name: "Green", color: "#32CD32", priceModifier: 20 },
    { id: 5, name: "Purple", color: "#8A2BE2", priceModifier: 20 },
    { id: 6, name: "Yellow", color: "#FFD700", priceModifier: 20 },
    { id: 7, name: "Orange", color: "#FF8C00", priceModifier: 20 },
    { id: 8, name: "White", color: "#FFFFFF", priceModifier: 0 }
  ]
};