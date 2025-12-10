import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, TruckIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [error, setError] = useState(null);

  // Order status options
  const orderStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading orders...');

      const token = localStorage.getItem('token');
      console.log('Token found:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Orders data:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));

        // Handle different response formats
        let ordersData = data;

        // If data is wrapped in a results property (pagination)
        if (data && data.results && Array.isArray(data.results)) {
          ordersData = data.results;
        }
        // If data is wrapped in a data property
        else if (data && data.data && Array.isArray(data.data)) {
          ordersData = data.data;
        }
        // If data is already an array
        else if (Array.isArray(data)) {
          ordersData = data;
        }
        // If data is an object with orders property
        else if (data && data.orders && Array.isArray(data.orders)) {
          ordersData = data.orders;
        }
        else {
          console.error('API response is not in expected format:', data);
          setOrders([]);
          setError('Invalid data format received from server. Expected array but got: ' + typeof data);
          return;
        }

        // Debug order items
        ordersData.forEach((order, index) => {
          console.log(`Admin Order ${index + 1}:`, {
            id: order.id,
            order_number: order.order_number,
            items_count: order.items ? order.items.length : 0,
            items: order.items
          });
        });

        setOrders(ordersData);
        setError(null);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError('Failed to load orders: ' + (errorData.detail || 'Unknown error'));
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Error loading orders: ' + error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId) => {
    const statusUpdate = statusUpdates[orderId];
    if (!statusUpdate || !statusUpdate.status) {
      alert('Please select a status');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/update_status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdate)
      });

      if (response.ok) {
        await loadOrders();
        // Clear the status update for this order
        setStatusUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[orderId];
          return newUpdates;
        });
        alert('Order status updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to update order status: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status: ' + error.message);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
      case 'preparing':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'ready':
      case 'out_for_delivery':
        return <TruckIcon className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Status color helper
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading while checking authentication or loading orders
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Orders</h1>
          <p className="text-gray-600">Manage orders and update shipping status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {!Array.isArray(orders) || orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600">There are no orders to display at the moment.</p>
                  <button
                    onClick={loadOrders}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Orders
                  </button>
                </div>
              ) : (
                Array.isArray(orders) && orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        <p className="text-sm text-gray-600">Customer: {order.customer?.username || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">RS {order.total_amount}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mb-4">
                      {getStatusIcon(order.order_status)}
                      <span className="text-sm text-gray-600">
                        {order.order_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2 mb-4">
                      {Array.isArray(order.items) && order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.cake?.name || 'Unknown Item'}
                          </span>
                          <span className="font-medium">RS {item.total_price}</span>
                        </div>
                      ))}
                      {Array.isArray(order.items) && order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                        <h5 className="font-medium mb-2">Shipping Address</h5>
                        <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                        <p className="text-gray-600">{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && (
                          <p className="text-gray-600">{order.shipping_address.address_line2}</p>
                        )}
                        <p className="text-gray-600">
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                        </p>
                      </div>
                    )}

                    {/* Status Update Form */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Update Order Status</h4>
                      <div className="flex space-x-3">
                        <select
                          value={statusUpdates[order.id]?.status || ''}
                          onChange={(e) => setStatusUpdates(prev => ({
                            ...prev,
                            [order.id]: {
                              ...prev[order.id],
                              status: e.target.value
                            }
                          }))}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Status</option>
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={statusUpdates[order.id]?.notes || ''}
                          onChange={(e) => setStatusUpdates(prev => ({
                            ...prev,
                            [order.id]: {
                              ...prev[order.id],
                              notes: e.target.value
                            }
                          }))}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => updateOrderStatus(order.id)}
                          disabled={!statusUpdates[order.id]?.status}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusUpdates[order.id]?.status
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          Update
                        </button>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {Array.isArray(order.status_history) && order.status_history.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Order Timeline</h5>
                        <div className="space-y-2">
                          {order.status_history.map((status) => (
                            <div key={status.id} className="flex items-start space-x-3 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="font-medium">{status.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                <p className="text-xs text-gray-500">{formatDate(status.created_at)}</p>
                                {status.notes && (
                                  <p className="text-xs text-gray-600 mt-1">{status.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Admin Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium">{Array.isArray(orders) ? orders.length : 0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium">
                    {Array.isArray(orders) ? orders.filter(o => o.order_status === 'pending').length : 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Preparing</span>
                  <span className="font-medium">
                    {Array.isArray(orders) ? orders.filter(o => o.order_status === 'preparing').length : 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Ready</span>
                  <span className="font-medium">
                    {Array.isArray(orders) ? orders.filter(o => o.order_status === 'ready').length : 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Out for Delivery</span>
                  <span className="font-medium">
                    {Array.isArray(orders) ? orders.filter(o => o.order_status === 'out_for_delivery').length : 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-medium">
                    {Array.isArray(orders) ? orders.filter(o => o.order_status === 'delivered').length : 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;