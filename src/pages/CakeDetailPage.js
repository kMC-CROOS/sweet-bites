import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { cupcakeCustomizationOptions, customizationOptions, fetchCakes } from '../data/cakes';
import { generateBeautifulPreviewImage } from '../utils/previewCapture';

const CakeCustomization = () => {
  const { cakeId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [customizations, setCustomizations] = useState({
    size: null,
    shape: null,
    frosting: null,
    color: null,
    toppings: [],
    message: ''
  });
  const [baseCake, setBaseCake] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCupcake, setIsCupcake] = useState(false);

  // Fetch cakes from API
  useEffect(() => {
    const loadCakes = async () => {
      try {
        setLoading(true);
        const fetchedCakes = await fetchCakes();
        setCakes(fetchedCakes);
      } catch (error) {
        console.error('Error loading cakes:', error);
        setCakes([]);
      } finally {
        setLoading(false);
      }
    };

    loadCakes();
  }, []);

  useEffect(() => {
    if (cakes.length > 0) {
      // Find the cake based on cakeId or use default
      const cake = cakeId ? cakes.find(c => c.id === parseInt(cakeId)) : cakes[0];
      setBaseCake(cake);
      setTotalPrice(cake ? cake.price : 0);
      setIsCupcake(cake ? cake.category === 'cupcakes' : false);
    }
  }, [cakeId, cakes]);

  const calculatePrice = () => {
    if (!baseCake) return 0;

    let price = baseCake.price;
    const options = isCupcake ? cupcakeCustomizationOptions : customizationOptions;

    // For regular cakes, add size and shape modifiers
    if (!isCupcake) {
      // Add size modifier
      if (customizations.size) {
        const sizeOption = options.sizes.find(s => s.id === customizations.size);
        if (sizeOption) {
          price += sizeOption.priceModifier;
        }
      }

      // Add shape modifier
      if (customizations.shape) {
        const shapeOption = options.shapes.find(s => s.id === customizations.shape);
        if (shapeOption) {
          price += shapeOption.priceModifier;
        }
      }
    }

    // Add frosting modifier
    if (customizations.frosting) {
      const frostingOption = options.frostings.find(f => f.id === customizations.frosting);
      if (frostingOption) {
        price += frostingOption.priceModifier;
      }
    }

    // Add color modifier
    if (customizations.color) {
      const colorOption = options.colors.find(c => c.id === customizations.color);
      if (colorOption) {
        price += colorOption.priceModifier;
      }
    }

    // Add toppings
    customizations.toppings.forEach(toppingId => {
      const toppingOption = options.toppings.find(t => t.id === toppingId);
      if (toppingOption) {
        price += toppingOption.priceModifier;
      }
    });

    return price;
  };

  useEffect(() => {
    setTotalPrice(calculatePrice());
  }, [customizations, baseCake]);

  const handleCustomizationChange = (type, value) => {
    setCustomizations(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleToppingToggle = (toppingId) => {
    setCustomizations(prev => ({
      ...prev,
      toppings: prev.toppings.includes(toppingId)
        ? prev.toppings.filter(id => id !== toppingId)
        : [...prev.toppings, toppingId]
    }));
  };

  const nextStep = () => {
    const maxSteps = isCupcake ? 4 : 6;
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addToCart = () => {
    if (!baseCake) return;

    // Generate preview image for customized cakes
    const previewData = generateBeautifulPreviewImage(customizations, customizationOptions, baseCake.price);

    const customizedCake = {
      ...baseCake,
      price: totalPrice,
      customizations: customizations,
      previewImage: previewData.image,
      previewData: previewData
    };

    addItem(customizedCake);
    navigate('/cart');
  };

  if (loading) {
    return <div className="loading-spinner mx-auto mt-20"></div>;
  }

  if (!baseCake) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cake Not Found</h2>
          <p className="text-gray-600 mb-4">The cake you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/menu')}
            className="px-6 py-2 bg-sweetbite-600 text-white rounded-lg hover:bg-sweetbite-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Customize Your {baseCake.name}
          </h1>
          <p className="text-gray-600">
            Make it uniquely yours with our customization options
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customization Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  {(isCupcake ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6]).map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step <= currentStep
                        ? 'bg-sweetbite-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                        }`}>
                        {step}
                      </div>
                      {step < (isCupcake ? 4 : 6) && (
                        <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-sweetbite-600' : 'bg-gray-200'
                          }`}></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  Step {currentStep} of {isCupcake ? 4 : 6}: {getStepTitle(currentStep, isCupcake)}
                </div>
              </div>

              {/* Step Content */}
              <div className="min-h-96">
                {isCupcake ? (
                  // Cupcake steps: Frosting, Color, Toppings, Message
                  <>
                    {currentStep === 1 && (
                      <FrostingSelection
                        frostings={cupcakeCustomizationOptions.frostings}
                        selectedFrosting={customizations.frosting}
                        onSelect={(frosting) => handleCustomizationChange('frosting', frosting)}
                      />
                    )}
                    {currentStep === 2 && (
                      <ColorSelection
                        colors={cupcakeCustomizationOptions.colors}
                        selectedColor={customizations.color}
                        onSelect={(color) => handleCustomizationChange('color', color)}
                      />
                    )}
                    {currentStep === 3 && (
                      <ToppingsSelection
                        toppings={cupcakeCustomizationOptions.toppings}
                        selectedToppings={customizations.toppings}
                        onToggle={handleToppingToggle}
                      />
                    )}
                    {currentStep === 4 && (
                      <MessageInput
                        message={customizations.message}
                        onChange={(message) => handleCustomizationChange('message', message)}
                      />
                    )}
                  </>
                ) : (
                  // Regular cake steps: Size, Shape, Frosting, Color, Toppings, Message
                  <>
                    {currentStep === 1 && (
                      <SizeSelection
                        sizes={customizationOptions.sizes}
                        selectedSize={customizations.size}
                        onSelect={(size) => handleCustomizationChange('size', size)}
                      />
                    )}
                    {currentStep === 2 && (
                      <ShapeSelection
                        shapes={customizationOptions.shapes}
                        selectedShape={customizations.shape}
                        onSelect={(shape) => handleCustomizationChange('shape', shape)}
                      />
                    )}
                    {currentStep === 3 && (
                      <FrostingSelection
                        frostings={customizationOptions.frostings}
                        selectedFrosting={customizations.frosting}
                        onSelect={(frosting) => handleCustomizationChange('frosting', frosting)}
                      />
                    )}
                    {currentStep === 4 && (
                      <ColorSelection
                        colors={customizationOptions.colors}
                        selectedColor={customizations.color}
                        onSelect={(color) => handleCustomizationChange('color', color)}
                      />
                    )}
                    {currentStep === 5 && (
                      <ToppingsSelection
                        toppings={customizationOptions.toppings}
                        selectedToppings={customizations.toppings}
                        onToggle={handleToppingToggle}
                      />
                    )}
                    {currentStep === 6 && (
                      <MessageInput
                        message={customizations.message}
                        onChange={(message) => handleCustomizationChange('message', message)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {currentStep < (isCupcake ? 4 : 6) ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-sweetbite-600 text-white rounded-lg hover:bg-sweetbite-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={addToCart}
                    className="px-6 py-2 bg-sweetbite-600 text-white rounded-lg hover:bg-sweetbite-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview and Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cake Preview</h3>

              {/* Cake Image */}
              <div className="mb-4">
                <img
                  src={baseCake.image}
                  alt={baseCake.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              {/* Cake Details */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800">{baseCake.name}</h4>
                <p className="text-sm text-gray-600">{baseCake.description}</p>
              </div>

              {/* Customization Summary */}
              <div className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">Your Customizations:</h5>
                <div className="space-y-1 text-sm">
                  {!isCupcake && customizations.size && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{customizationOptions.sizes.find(s => s.id === customizations.size)?.name}</span>
                    </div>
                  )}
                  {!isCupcake && customizations.shape && (
                    <div className="flex justify-between">
                      <span>Shape:</span>
                      <span>{customizationOptions.shapes.find(s => s.id === customizations.shape)?.name}</span>
                    </div>
                  )}
                  {customizations.frosting && (
                    <div className="flex justify-between">
                      <span>Frosting:</span>
                      <span>{(isCupcake ? cupcakeCustomizationOptions : customizationOptions).frostings.find(f => f.id === customizations.frosting)?.name}</span>
                    </div>
                  )}
                  {customizations.color && (
                    <div className="flex justify-between">
                      <span>Color:</span>
                      <span>{(isCupcake ? cupcakeCustomizationOptions : customizationOptions).colors.find(c => c.id === customizations.color)?.name}</span>
                    </div>
                  )}
                  {customizations.toppings.length > 0 && (
                    <div className="flex justify-between">
                      <span>Toppings:</span>
                      <span>{customizations.toppings.length} selected</span>
                    </div>
                  )}
                  {customizations.message && (
                    <div className="flex justify-between">
                      <span>Message:</span>
                      <span className="truncate max-w-20">{customizations.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Price:</span>
                  <span className="text-sweetbite-600">RS {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const SizeSelection = ({ sizes, selectedSize, onSelect }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Cake Size</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sizes.map((size) => (
          <motion.button
            key={size.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(size.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${selectedSize === size.id
              ? 'border-sweetbite-600 bg-sweetbite-50'
              : 'border-gray-200 hover:border-sweetbite-300'
              }`}
          >
            <div className="font-semibold text-gray-800">{size.name}</div>
            <div className="text-sm text-gray-600">Serves {size.servings} people</div>
            {size.priceModifier > 0 && (
              <div className="text-sm text-sweetbite-600">+RS {size.priceModifier}</div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const ShapeSelection = ({ shapes, selectedShape, onSelect }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Cake Shape</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shapes.map((shape) => (
          <motion.button
            key={shape.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(shape.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${selectedShape === shape.id
              ? 'border-sweetbite-600 bg-sweetbite-50'
              : 'border-gray-200 hover:border-sweetbite-300'
              }`}
          >
            <div className="font-semibold text-gray-800">{shape.name}</div>
            {shape.priceModifier > 0 && (
              <div className="text-sm text-sweetbite-600">+RS {shape.priceModifier}</div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const FrostingSelection = ({ frostings, selectedFrosting, onSelect }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Frosting</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frostings.map((frosting) => (
          <motion.button
            key={frosting.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(frosting.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${selectedFrosting === frosting.id
              ? 'border-sweetbite-600 bg-sweetbite-50'
              : 'border-gray-200 hover:border-sweetbite-300'
              }`}
          >
            <div className="font-semibold text-gray-800">{frosting.name}</div>
            {frosting.priceModifier > 0 && (
              <div className="text-sm text-sweetbite-600">+RS {frosting.priceModifier}</div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const ToppingsSelection = ({ toppings, selectedToppings, onToggle }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Toppings</h3>
      <p className="text-gray-600 mb-4">Select multiple toppings to add to your cake</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toppings.map((topping) => (
          <motion.button
            key={topping.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(topping.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${selectedToppings.includes(topping.id)
              ? 'border-sweetbite-600 bg-sweetbite-50'
              : 'border-gray-200 hover:border-sweetbite-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{topping.name}</div>
                <div className="text-sm text-sweetbite-600">+RS {topping.priceModifier}</div>
              </div>
              {selectedToppings.includes(topping.id) && (
                <div className="w-6 h-6 bg-sweetbite-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const MessageInput = ({ message, onChange }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Add a Personal Message</h3>
      <p className="text-gray-600 mb-4">Add a special message to your cake (optional, max 30 characters)</p>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        maxLength={30}
        placeholder="Happy Birthday! 🎉"
        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-sweetbite-600 focus:outline-none resize-none"
        rows={4}
      />
      <div className="text-sm text-gray-500 mt-2">
        {message.length}/30 characters
      </div>
    </div>
  );
};

const ColorSelection = ({ colors, selectedColor, onSelect }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Color</h3>
      <p className="text-gray-600 mb-4">Select a color for your cake frosting</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {colors.map((color) => (
          <motion.button
            key={color.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(color.id)}
            className={`p-4 border-2 rounded-lg text-center transition-all ${selectedColor === color.id
              ? 'border-sweetbite-600 bg-sweetbite-50'
              : 'border-gray-200 hover:border-sweetbite-300'
              }`}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-gray-300"
              style={{ backgroundColor: color.color }}
            ></div>
            <div className="font-semibold text-gray-800">{color.name}</div>
            {color.priceModifier > 0 && (
              <div className="text-sm text-sweetbite-600">+RS {color.priceModifier}</div>
            )}
            {selectedColor === color.id && (
              <div className="w-6 h-6 bg-sweetbite-600 rounded-full flex items-center justify-center mx-auto mt-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const getStepTitle = (step, isCupcake = false) => {
  if (isCupcake) {
    const cupcakeTitles = {
      1: 'Frosting Selection',
      2: 'Color Selection',
      3: 'Toppings Selection',
      4: 'Personal Message'
    };
    return cupcakeTitles[step] || '';
  } else {
    const regularTitles = {
      1: 'Size Selection',
      2: 'Shape Selection',
      3: 'Frosting Selection',
      4: 'Color Selection',
      5: 'Toppings Selection',
      6: 'Personal Message'
    };
    return regularTitles[step] || '';
  }
};

export default CakeCustomization;