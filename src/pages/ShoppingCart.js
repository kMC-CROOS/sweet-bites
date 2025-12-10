import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const ShoppingCart = () => {
  const { cartItems, updateQuantity, removeItem, clearCart, getCartTotal } = useCart();
  const [deliveryFee] = useState(5.99);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + deliveryFee;
  };

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    } else {
      removeItem(cartItemId);
    }
  };

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sweetbite-500 to-sweetbite-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">SweetBite Cart</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Cart</p>
              <p className="text-lg font-semibold text-sweetbite-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Your SweetBite Cart
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={calculateSubtotal()}
              deliveryFee={deliveryFee}
              total={calculateTotal()}
              itemCount={cartItems.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Cart Item Card Component
const CartItemCard = ({ item, onQuantityChange, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img
          src={item.previewImage || item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg"
          title={item.previewImage ? "Your customized cake preview" : "Standard cake image"}
        />
        {item.previewImage && (
          <div className="absolute -top-1 -right-1 bg-sweetbite-500 text-white text-xs px-1 py-0.5 rounded-full">
            ✨
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.name}</h3>

        {/* Customization Details */}
        {item.customizations && Object.keys(item.customizations).length > 0 && (
          <div className="text-sm text-gray-600 mt-1">
            {Object.entries(item.customizations).map(([key, value]) => (
              <span key={key} className="inline-block bg-sweetbite-100 text-sweetbite-700 px-2 py-1 rounded mr-2 mb-1">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <p className="text-lg font-semibold text-sweetbite-600">
          RS {item.price.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onQuantityChange(item.cartItemId, item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-sweetbite-100 text-sweetbite-600 hover:bg-sweetbite-200 flex items-center justify-center transition-colors"
        >
          -
        </button>
        <span className="w-12 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.cartItemId, item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-sweetbite-100 text-sweetbite-600 hover:bg-sweetbite-200 flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.cartItemId)}
        className="text-red-500 hover:text-red-700 p-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </motion.div>
  );
};

// Cart Summary Component
const CartSummary = ({ subtotal, deliveryFee, total, itemCount }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-semibold">RS {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-semibold">RS {deliveryFee.toFixed(2)}</span>
        </div>

        <hr className="border-gray-200" />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-sweetbite-600">RS {total.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/shipping-address" className="w-full bg-sweetbite-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-sweetbite-700 transition-colors mt-6 block text-center">
        Proceed to Checkout
      </Link>

      <Link to="/menu" className="w-full border border-sweetbite-600 text-sweetbite-600 py-3 px-4 rounded-lg font-semibold hover:bg-sweetbite-50 transition-colors mt-3 block text-center">
        Continue Shopping
      </Link>
    </div>
  );
};

// Empty Cart Component
const EmptyCart = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-6xl">🛒</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          Your cart is empty
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          Start adding some delicious SweetBite cakes to your cart!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link to="/menu" className="btn-primary">
            Browse Our Menu
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ShoppingCart;
