import { CheckCircleIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeedbackForm from '../components/FeedbackForm';
import OrderTracking from '../components/OrderTracking';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // Load existing feedback for the order
  const loadExistingFeedback = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/feedback/order/${orderId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const feedbackData = await response.json();
        setExistingFeedback(feedbackData);
        setFeedbackSubmitted(true);
      } else if (response.status === 404) {
        setExistingFeedback(null);
        setFeedbackSubmitted(false);
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error);
      setExistingFeedback(null);
    }
  };

  useEffect(() => {
    console.log('OrderSuccessPage useEffect - location.state:', location.state);

    if (!location.state) {
      console.log('No location.state found, redirecting to home');
      navigate('/');
      return;
    }

    // If order data is passed directly from shipping page
    if (location.state.order) {
      console.log('Order data found in location.state:', location.state.order);
      setOrder(location.state.order);
      setLoading(false);
    } else if (location.state.orderId) {
      console.log('OrderId found, fetching order details:', location.state.orderId);
      // If only orderId is passed, fetch order details
      loadOrderDetails();
      loadExistingFeedback(location.state.orderId);
    } else {
      console.log('No order or orderId found, redirecting to home');
      navigate('/');
    }
  }, [location.state, navigate]);

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${location.state.orderId}/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmittingFeedback(true);
    setFeedbackError('');

    try {
      const response = await fetch('http://localhost:8000/api/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...feedbackData,
          order_id: order?.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setFeedbackSubmitted(true);
        setShowFeedback(false);
        setExistingFeedback(result.data);
        setIsEditingFeedback(false);
      } else {
        const errorData = await response.json();
        setFeedbackError(errorData.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      setFeedbackError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle feedback deletion
  const handleFeedbackDelete = async () => {
    if (!existingFeedback) return;

    if (!window.confirm('Are you sure you want to delete your feedback? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      setFeedbackError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setFeedbackError('Authentication required. Please log in again.');
        return;
      }

      console.log('🗑️ Deleting feedback:', existingFeedback.id);
      console.log('🔗 Delete URL:', `http://localhost:8000/api/feedback/${existingFeedback.id}/`);

      const response = await fetch(`http://localhost:8000/api/feedback/${existingFeedback.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Delete response status:', response.status);
      console.log('📡 Delete response headers:', response.headers);

      if (response.ok) {
        console.log('✅ Feedback deleted successfully');
        setFeedbackSubmitted(false);
        setShowFeedback(false);
        setIsEditingFeedback(false);
        setExistingFeedback(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Delete failed:', response.status, errorData);
        setFeedbackError(errorData.message || `Failed to delete feedback. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting feedback:', error);
      setFeedbackError('Network error. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      case 'ready':
      case 'out_for_delivery':
        return <TruckIcon className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Your order has been placed and is being reviewed.';
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared.';
      case 'preparing':
        return 'Our bakers are working on your delicious cakes!';
      case 'ready':
        return 'Your order is ready and will be delivered soon.';
      case 'out_for_delivery':
        return 'Your order is on its way to you!';
      case 'delivered':
        return 'Your order has been delivered. Enjoy your cakes!';
      default:
        return 'Your order is being processed.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for your order. We'll start preparing your delicious cakes right away.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.order_number || 'N/A'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-lg">RS {order.total_amount || '0.00'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.payment_status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.payment_status
                      ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)
                      : 'Pending'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>

              <div className="space-y-4">
                {order.items && order.items.length > 0 ? order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">🍰</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{item.cake?.name || 'Custom Cake'}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                        {item.customization_notes && (
                          <p className="text-sm text-gray-500">{item.customization_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">RS {item.total_price || '0.00'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className="text-gray-600">{order.shipping_address.phone}</p>
                  <p className="text-gray-600">{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p className="text-gray-600">{order.shipping_address.address_line2}</p>
                  )}
                  <p className="text-gray-600">
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p className="text-gray-600">{order.shipping_address.country}</p>
                </div>
              </div>
            )}

            {/* Order Tracking Map */}
            {order?.order_status === 'out_for_delivery' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">🗺️ Track Your Order</h2>
                <div className="h-96 rounded-lg overflow-hidden">
                  <OrderTracking orderId={order.id} />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Real-time tracking updates every 10 seconds
                </p>
              </div>
            )}
          </div>

          {/* Order Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Order Status</h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.order_status)}
                  <div>
                    <p className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status
                        ? order.order_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'Unknown'
                      }
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStatusDescription(order.order_status)}
                    </p>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Order Timeline</h3>
                  <div className="space-y-3">
                    {order.status_history && order.status_history.length > 0 ? order.status_history.map((status, index) => (
                      <div key={status.id || index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {status.status
                              ? status.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : 'Status Update'
                            }
                          </p>
                          <p className="text-xs text-gray-500">
                            {status.created_at ? new Date(status.created_at).toLocaleString() : 'Unknown time'}
                          </p>
                          {status.notes && (
                            <p className="text-xs text-gray-600 mt-1">{status.notes}</p>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500">No status history available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View My Orders
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Feedback Section */}
              {existingFeedback ? (
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-green-900">Your Feedback</h3>
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < existingFeedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-green-800 line-clamp-2">
                      {existingFeedback.message}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setIsEditingFeedback(true);
                        setShowFeedback(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit Feedback
                    </button>
                    <button
                      onClick={handleFeedbackDelete}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Feedback Prompt */}
                  {!showFeedback && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">How was your experience?</h3>
                      <p className="text-sm text-yellow-800 mb-3">
                        We'd love to hear about your order experience. Your feedback helps us improve!
                      </p>
                      <button
                        onClick={() => setShowFeedback(true)}
                        className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Leave Feedback
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Share Your Experience</h3>
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {feedbackError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-red-800 text-sm">{feedbackError}</p>
                  </div>
                )}

                <FeedbackForm
                  onSubmit={handleFeedbackSubmit}
                  onCancel={() => {
                    setShowFeedback(false);
                    setIsEditingFeedback(false);
                  }}
                  onDelete={handleFeedbackDelete}
                  isSubmitting={isSubmittingFeedback}
                  initialData={isEditingFeedback ? existingFeedback : null}
                  isEditing={isEditingFeedback}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;
