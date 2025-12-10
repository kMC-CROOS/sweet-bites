import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const ShippingAddressPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  // State management
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New address form state
  const [newAddress, setNewAddress] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: ''
  });

  // Load addresses on component mount
  useEffect(() => {
    console.log('🛒 ShippingAddressPage - Cart Debug Info:');
    console.log('cartItems:', cartItems);
    console.log('cartItems.length:', cartItems.length);
    console.log('cartItems type:', typeof cartItems);
    console.log('cartItems isArray:', Array.isArray(cartItems));

    if (cartItems.length === 0) {
      console.log('⚠️ Cart is empty, redirecting to cart page');
      navigate('/cart');
      return;
    }
    loadAddresses();
    testDatabaseConnection();
  }, [cartItems, navigate]);

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Testing database connection with token:', token);

      const response = await fetch('http://localhost:8000/api/orders/shipping-addresses/test_db/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Database test response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Database test result:', data);
        setSuccess(`Database test passed: ${data.user_addresses} addresses found for user ${data.user_id}`);
      } else {
        const errorText = await response.text();
        console.error('Database test failed:', response.status, errorText);
        setError(`Database test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Database test error:', error);
      setError(`Database test error: ${error.message}`);
    }
  };

  // Load addresses from backend
  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      console.log('Loading addresses from backend...');
      console.log('User token:', localStorage.getItem('token'));

      const response = await fetch('http://localhost:8000/api/orders/shipping-addresses/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Address load response status:', response.status);
      console.log('Address load response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Addresses loaded from backend:', data);

        // Handle paginated response - check if it has 'results' property
        let addressList = [];
        if (data.results && Array.isArray(data.results)) {
          // Paginated response
          addressList = data.results;
          console.log('Number of addresses from paginated response:', addressList.length);
          console.log('Total count:', data.count);
        } else if (Array.isArray(data)) {
          // Direct array response
          addressList = data;
          console.log('Number of addresses from direct array:', addressList.length);
        } else {
          console.log('Unexpected response format:', data);
          addressList = [];
        }

        console.log('Address list after validation:', addressList);
        setAddresses(addressList);

        if (addressList.length > 0) {
          const defaultAddress = addressList.find(addr => addr.is_default);
          const selectedId = defaultAddress ? defaultAddress.id : addressList[0].id;
          console.log('Selected address ID:', selectedId);
          setSelectedAddressId(selectedId);
        } else {
          console.log('No addresses found in response');
        }
      } else {
        const errorText = await response.text();
        console.error('Error loading addresses:', errorText);
        console.error('Response status:', response.status);
        setError(`Failed to load addresses (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setError(`Network error loading addresses: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle new address submission
  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newAddress.first_name || !newAddress.last_name || !newAddress.phone ||
      !newAddress.address_line1 || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Submitting address:', newAddress);
      console.log('User token:', localStorage.getItem('token'));

      const response = await fetch('http://localhost:8000/api/orders/shipping-addresses/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAddress)
      });

      console.log('Address response status:', response.status);
      console.log('Address response headers:', response.headers);

      if (response.ok) {
        const createdAddress = await response.json();
        console.log('Address created successfully:', createdAddress);

        // Add the new address to the current list immediately
        setAddresses(prevAddresses => {
          // Ensure prevAddresses is an array
          const currentAddresses = Array.isArray(prevAddresses) ? prevAddresses : [];
          return [...currentAddresses, createdAddress];
        });

        // Also reload addresses to ensure persistence
        setTimeout(async () => {
          await loadAddresses();
        }, 1000);

        // Select the newly created address
        setSelectedAddressId(createdAddress.id);

        // Show success message
        setSuccess('Address saved successfully!');
        setError('');

        // Close form and reset
        setShowNewAddressForm(false);
        setNewAddress({
          first_name: '',
          last_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: ''
        });

        // Clear success message after 5 seconds (increased from 3)
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const contentType = response.headers.get('content-type');
        let errorData;

        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const textResponse = await response.text();
          console.error('Non-JSON error response:', textResponse);
          errorData = { detail: `Server error (${response.status}): ${textResponse.substring(0, 200)}...` };
        }

        console.error('Error creating address:', errorData);
        setError(`Failed to save address: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating address:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle proceeding to order confirmation (without creating order yet)
  const handleProceedToConfirmation = () => {
    console.log('🚀 handleProceedToConfirmation - Debug Info:');
    console.log('user:', user);
    console.log('cartItems:', cartItems);
    console.log('cartItems.length:', cartItems.length);

    // Validation
    if (!user) {
      setError('Please log in to place an order.');
      return;
    }

    if (cartItems.length === 0) {
      console.log('❌ Cart validation failed - cart is empty');
      console.log('❌ But checking localStorage for cart data...');
      const savedCart = localStorage.getItem('sweetbite-cart');
      console.log('❌ localStorage cart:', savedCart);
      setError('Your cart is empty. Please add items to your cart first.');
      return;
    }

    console.log('✅ Cart validation passed - cart has items:', cartItems.length);

    if (addresses.length === 0) {
      setError('Please add a shipping address first.');
      return;
    }

    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    // Validate cart items
    const validCartItems = cartItems.filter(item => item.id && item.quantity > 0);
    if (validCartItems.length === 0) {
      setError('No valid items in cart. Please refresh and try again.');
      return;
    }

    // Get selected address details
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

    // Prepare order preview data
    const orderPreviewData = {
      order_type: 'online',
      delivery_instructions: 'Cash on delivery order',
      shipping_address: selectedAddress,
      items: validCartItems.map(item => ({
        cake_id: parseInt(item.id),
        quantity: parseInt(item.quantity),
        customization_notes: item.customization_notes || '',
        cake: item // Include full cake details for display
      })),
      // Calculate totals
      subtotal: getCartTotal(),
      delivery_fee: 5.00,
      total_amount: getCartTotal() + 5.00
    };

    console.log('Proceeding to confirmation with order data:', orderPreviewData);

    // Navigate to Order Confirmation page with order preview data
    navigate('/order-confirmation', {
      state: {
        orderPreview: orderPreviewData,
        isPreview: true
      }
    });
  };

  // Calculate totals
  const calculateTotal = () => {
    const subtotal = getCartTotal();
    const deliveryFee = 5.00; // RS 5 delivery fee
    const total = subtotal + deliveryFee;

    return {
      subtotal,
      deliveryFee,
      total
    };
  };

  const totals = calculateTotal();

  // Loading state
  if (isLoading && addresses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shipping Address</h1>
          <p className="text-gray-600 mt-2">Please select or add a shipping address for your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Select Address</h2>

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-green-800 text-sm">{success}</p>
                    <button
                      onClick={() => setSuccess('')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-red-800 text-sm">{error}</p>
                    <button
                      onClick={() => setError('')}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}


              {/* Address List */}
              {addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedAddressId === address.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {address.first_name} {address.last_name}
                            </h3>
                            {address.is_default && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.phone}</p>
                          <p className="text-gray-600">{address.address_line1}</p>
                          {address.address_line2 && (
                            <p className="text-gray-600">{address.address_line2}</p>
                          )}
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                        </div>
                        <div className="ml-4">
                          <input
                            type="radio"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No addresses found</p>
                  <p className="text-sm text-gray-400">Please add a shipping address to continue with your order.</p>
                </div>
              )}

              {/* Add New Address Button */}
              <button
                onClick={() => setShowNewAddressForm(true)}
                className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Address
              </button>

            </div>

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.first_name}
                        onChange={(e) => setNewAddress({ ...newAddress, first_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.last_name}
                        onChange={(e) => setNewAddress({ ...newAddress, last_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>


                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RS {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>RS {totals.deliveryFee.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>RS {totals.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToConfirmation}
                disabled={!selectedAddressId || addresses.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${!selectedAddressId || addresses.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Review Order
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Payment will be collected upon delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressPage;
