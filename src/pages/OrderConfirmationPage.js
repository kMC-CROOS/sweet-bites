import { CheckCircleIcon, CreditCardIcon, TruckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();

  const [orderPreview, setOrderPreview] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const loadExistingOrder = useCallback(async () => {
    try {
      console.log('🔍 Loading existing order with ID:', orderId);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('🌐 Making API call to:', `http://localhost:8000/api/orders/orders/${orderId}/`);
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response Status:', response.status);
      if (response.ok) {
        const orderData = await response.json();
        console.log('✅ Order data loaded:', orderData);

        setOrder(orderData);
        // Convert existing order to preview format for display
        setOrderPreview({
          order_type: orderData.order_type,
          shipping_address: orderData.shipping_address,
          delivery_instructions: orderData.delivery_instructions,
          items: orderData.items,
          subtotal: orderData.subtotal || 0,
          delivery_fee: orderData.delivery_fee || 0,
          total_amount: orderData.total_amount || 0
        });
        setIsPreview(true); // This is a view-only mode
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', response.status, errorText);
        setError(`Failed to load order details: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Network error loading order:', err);
      setError('Network error loading order details');
    }
  }, [orderId, navigate]);

  useEffect(() => {
    console.log('🔄 OrderConfirmationPage useEffect triggered');
    console.log('📋 orderId:', orderId);
    console.log('📍 location.state:', location.state);

    // Check if we're viewing an existing order
    if (orderId) {
      console.log('✅ OrderId found, loading existing order');
      loadExistingOrder();
    } else if (location.state?.orderPreview) {
      console.log('✅ OrderPreview found in location state');
      // Check if we have order preview data from shipping address page
      setOrderPreview(location.state.orderPreview);
      setIsPreview(location.state.isPreview || false);
    } else {
      console.log('❌ No orderId or orderPreview, redirecting to shipping address');
      // If no preview data and no orderId, redirect to shipping address
      navigate('/shipping-address');
    }
  }, [orderId, location.state, navigate, loadExistingOrder]);

  const handlePlaceOrder = async () => {
    if (!orderPreview) {
      setError('No order data available. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to place an order.');
      }

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty. Please add items to your cart first.');
      }

      // Validate each cart item
      const validItems = cartItems.filter(item => {
        if (!item.id || !item.quantity || item.quantity <= 0) {
          console.warn('Invalid cart item:', item);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        throw new Error('No valid items in your cart. Please refresh and try again.');
      }

      // Validate shipping address
      if (!orderPreview.shipping_address?.id) {
        throw new Error('Please select a shipping address.');
      }

      // Prepare order data
      const orderData = {
        order_type: orderPreview.order_type || 'online',
        shipping_address_id: orderPreview.shipping_address.id,
        delivery_instructions: orderPreview.delivery_instructions || '',
        payment_method: 'cash', // Default to cash on delivery
        items: validItems.map(item => ({
          cake_id: item.id,
          quantity: item.quantity,
          unit_price: item.price, // Send the frontend-calculated price (includes customizations)
          total_price: item.price * item.quantity, // Send the frontend-calculated total
          customization_notes: item.customizations ? JSON.stringify(item.customizations) : ''
        }))
      };

      console.log('Submitting order:', orderData);
      console.log('Order preview:', orderPreview);
      console.log('Cart items:', cartItems);

      const response = await fetch('http://localhost:8000/api/orders/orders/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to place order. Please try again.';
        try {
          const errorData = await response.json();
          console.error('Order creation error:', errorData);

          // Handle different types of errors
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(', ');
          } else if (typeof errorData === 'object') {
            // Handle field-specific errors
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const orderResponse = await response.json();
      console.log('Order created successfully:', orderResponse);

      setOrder(orderResponse);

      // Clear cart after successful order
      clearCart();

      // Navigate to order success page
      navigate('/order-success', {
        state: {
          order: orderResponse,
          fromConfirmation: true
        }
      });

    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToShipping = () => {
    navigate('/shipping-address');
  };

  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        orderPreview: orderPreview,
        isPreview: true
      }
    });
  };

  if (!orderPreview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {orderId ? `Order #${orderId}` : 'Order Confirmation'}
              </h1>
              <p className="text-gray-600 mt-1">
                {orderId ? 'View your order details' : 'Review your order details before placing'}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircleIcon className="h-6 w-6" />
              <span className="font-medium">
                {orderId ? 'Order Details' : 'Step 2 of 3'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {(orderId ? orderPreview?.items || [] : cartItems).map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="relative">
                      <img
                        src={item.previewImage || item.cake?.image || item.image}
                        alt={item.cake?.name || item.name || 'Cake'}
                        className="w-16 h-16 object-cover rounded-lg"
                        title={item.previewImage ? "Your customized cake preview" : "Standard cake image"}
                      />
                      {item.previewImage && (
                        <div className="absolute -top-1 -right-1 bg-sweetbite-500 text-white text-xs px-1 py-0.5 rounded-full">
                          ✨
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.cake?.name || item.name || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Customizations:</p>
                          <div className="text-sm text-gray-600">
                            {Object.entries(item.customizations).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {Array.isArray(value) ? value.join(', ') : value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">RS {Number(item.unit_price || item.price || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">× {item.quantity}</p>
                      <p className="text-xs text-gray-500">Total: RS {Number(item.total_price || (item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TruckIcon className="h-5 w-5 mr-2" />
                Delivery Address
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">
                  {orderPreview?.shipping_address?.first_name || 'N/A'} {orderPreview?.shipping_address?.last_name || ''}
                </p>
                <p className="text-gray-600">{orderPreview?.shipping_address?.address_line1 || 'N/A'}</p>
                {orderPreview?.shipping_address?.address_line2 && (
                  <p className="text-gray-600">{orderPreview.shipping_address.address_line2}</p>
                )}
                <p className="text-gray-600">
                  {orderPreview?.shipping_address?.city || 'N/A'}, {orderPreview?.shipping_address?.state || 'N/A'} {orderPreview?.shipping_address?.postal_code || 'N/A'}
                </p>
                {orderPreview?.shipping_address?.country && (
                  <p className="text-gray-600">{orderPreview.shipping_address.country}</p>
                )}
                <p className="text-gray-600">Phone: {orderPreview?.shipping_address?.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RS {Number(orderPreview?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>RS {Number(orderPreview?.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>RS {Number(orderPreview?.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {orderId ? (
                  // Viewing existing order - show different buttons
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                        <div>
                          <p className="text-green-800 font-medium">Order #{orderId}</p>
                          <p className="text-green-600 text-sm">Status: {order?.order_status || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/orders')}
                      className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                    >
                      <TruckIcon className="h-5 w-5 mr-2" />
                      Back to My Orders
                    </button>

                    {order?.order_status === 'out_for_delivery' && (
                      <button
                        onClick={() => navigate(`/track-order/${orderId}`)}
                        className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
                      >
                        <TruckIcon className="h-5 w-5 mr-2" />
                        Track Order
                      </button>
                    )}
                  </>
                ) : (
                  // Creating new order - show original buttons
                  <>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Place Order
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                    >
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Proceed to Payment
                    </button>

                    <button
                      onClick={handleBackToShipping}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Back to Shipping
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Payment will be collected upon delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;