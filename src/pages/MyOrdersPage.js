import {
  ArrowPathIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ShoppingBagIcon,
  StarIcon,
  TrashIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [isViewOnlyFeedback, setIsViewOnlyFeedback] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });

  // Customer analytics
  const [customerStats, setCustomerStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    favoriteItems: [],
    orderFrequency: 0
  });

  useEffect(() => {
    loadOrders();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      loadOrders();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters, activeTab]);

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔄 Loading orders...');
      const response = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Orders API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Orders data received:', data);

        // Handle both array and paginated response
        let ordersArray = [];
        if (Array.isArray(data)) {
          ordersArray = data;
        } else if (data.results && Array.isArray(data.results)) {
          ordersArray = data.results;
        } else {
          console.error('API response format not recognized:', data);
          ordersArray = [];
        }

        console.log(`✅ Loaded ${ordersArray.length} orders`);

        // Debug order items
        ordersArray.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            order_number: order.order_number,
            items_count: order.items ? order.items.length : 0,
            items: order.items
          });
        });

        // Ensure each order has has_feedback field (default to false if not present)
        const processedOrders = ordersArray.map(order => ({
          ...order,
          has_feedback: order.has_feedback || false
        }));

        setOrders(processedOrders);
        calculateCustomerStats(processedOrders);
      } else {
        console.error('❌ Failed to load orders:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setOrders([]);
      }
    } catch (error) {
      console.error('💥 Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateCustomerStats = (ordersData) => {
    const totalOrders = ordersData.length;
    const totalSpent = ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate favorite items
    const itemCounts = {};
    ordersData.forEach(order => {
      order.items.forEach(item => {
        const itemName = item.cake.name;
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = { name: itemName, count: 0, totalSpent: 0 };
        }
        itemCounts[itemName].count += item.quantity;
        itemCounts[itemName].totalSpent += parseFloat(item.total_price);
      });
    });

    const favoriteItems = Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate order frequency (orders per month)
    const firstOrder = ordersData.length > 0 ? new Date(ordersData[ordersData.length - 1].created_at) : new Date();
    const lastOrder = ordersData.length > 0 ? new Date(ordersData[0].created_at) : new Date();
    const monthsDiff = Math.max(1, (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 30));
    const orderFrequency = totalOrders / monthsDiff;

    setCustomerStats({
      totalOrders,
      totalSpent,
      averageOrderValue,
      favoriteItems,
      orderFrequency
    });
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        filtered = filtered.filter(order => !['delivered', 'cancelled'].includes(order.order_status));
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(order => order.order_status === 'delivered');
      } else if (activeTab === 'cancelled') {
        filtered = filtered.filter(order => order.order_status === 'cancelled');
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.cake.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.order_status === filters.status);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(order => new Date(order.created_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(order => new Date(order.created_at) <= new Date(filters.dateTo));
    }

    // Apply amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(order => parseFloat(order.total_amount) >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(order => parseFloat(order.total_amount) <= parseFloat(filters.maxAmount));
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const reorderItem = (orderId, itemId) => {
    // Find the order and item
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const item = order.items.find(i => i.id === itemId);
    if (!item) return;

    // Add to cart and navigate to cart
    // This would integrate with the cart context
    navigate('/cart', {
      state: {
        reorderItem: {
          cakeId: item.cake.id,
          quantity: item.quantity,
          customization: item.customization_notes
        }
      }
    });
  };

  const handleFeedbackSubmit = async (feedbackData, isEditing = false) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      // Don't set Content-Type for FormData, let browser set it with boundary
      if (!(feedbackData instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const url = isEditing && feedbackData.get('id')
        ? `http://localhost:8000/api/feedback/${feedbackData.get('id')}/`
        : 'http://localhost:8000/api/feedback/';

      const method = isEditing ? 'PUT' : 'POST';

      const body = feedbackData instanceof FormData ? feedbackData : JSON.stringify(feedbackData);

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted successfully:', result);

      // Update the order to show feedback has been submitted
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderForFeedback.id
            ? { ...order, has_feedback: true }
            : order
        )
      );

      alert(isEditing ? 'Feedback updated successfully!' : 'Thank you for your feedback!');
      setShowFeedbackModal(false);
      setSelectedOrderForFeedback(null);
      setExistingFeedback(null);
      setIsEditingFeedback(false);
      setIsViewOnlyFeedback(false);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const loadExistingFeedback = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`http://localhost:8000/api/feedback/order/${orderId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const feedbackData = await response.json();
        return feedbackData;
      } else if (response.status === 404) {
        return null;
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error);
      return null;
    }
  };

  const openFeedbackModal = async (order, action = 'create') => {
    setSelectedOrderForFeedback(order);

    if (action === 'view') {
      setIsViewOnlyFeedback(true);
      setIsEditingFeedback(false);
      const feedback = await loadExistingFeedback(order.id);
      setExistingFeedback(feedback);
    } else if (action === 'edit') {
      setIsEditingFeedback(true);
      setIsViewOnlyFeedback(false);
      const feedback = await loadExistingFeedback(order.id);
      setExistingFeedback(feedback);
    } else {
      setIsEditingFeedback(false);
      setIsViewOnlyFeedback(false);
      setExistingFeedback(null);
    }

    setShowFeedbackModal(true);
  };

  const deleteFeedback = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete feedback');
        return;
      }

      const feedback = await loadExistingFeedback(orderId);
      if (!feedback) {
        alert('No feedback found to delete');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/feedback/${feedback.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Update the order to show feedback has been removed
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, has_feedback: false }
              : order
          )
        );
        alert('Feedback deleted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert(error.message || 'Failed to delete feedback. Please try again.');
    }
  };

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

  const getStatusDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'Order placed, being reviewed';
      case 'confirmed':
        return 'Order confirmed, preparing to bake';
      case 'preparing':
        return 'Baking in progress';
      case 'ready':
        return 'Ready for delivery';
      case 'out_for_delivery':
        return 'On the way to you';
      case 'delivered':
        return 'Delivered successfully';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return 'Processing';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and view order history</p>
        </div>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Customer Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{customerStats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">RS {customerStats.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">RS {customerStats.averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Order Frequency</p>
                    <p className="text-2xl font-bold text-gray-900">{customerStats.orderFrequency.toFixed(1)}/month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs and Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="flex space-x-1 mb-4 lg:mb-0">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All Orders ({orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Active ({orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Completed ({orders.filter(o => o.order_status === 'delivered').length})
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FunnelIcon className="h-5 w-5 mr-2" />
                    Filters
                  </button>
                  <button
                    onClick={() => loadOrders(true)}
                    disabled={refreshing}
                    className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Order number, item name..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-2">
                {/* Refresh Indicator */}
                {refreshing && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                      <span className="text-blue-800 text-sm">Refreshing orders...</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {Array.isArray(filteredOrders) && filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
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
                        <span className="text-sm text-gray-600">{getStatusDescription(order.order_status)}</span>
                      </div>

                      {/* Order Items Preview */}
                      <div className="space-y-2 mb-4">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.cake.name}
                            </span>
                            <span className="font-medium">RS {item.total_price}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                      </div>

                      {/* Expandable Details */}
                      {selectedOrder?.id === order.id && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-3">Order Details</h4>

                          {/* Full Items List */}
                          <div className="space-y-2 mb-4">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <span className="font-medium">{item.cake.name}</span>
                                  {item.customization_notes && (
                                    <p className="text-xs text-gray-500 mt-1">{item.customization_notes}</p>
                                  )}
                                </div>
                                <div className="text-right flex items-center space-x-3">
                                  <div>
                                    <p className="font-medium">RS {item.total_price}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      reorderItem(order.id, item.id);
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Reorder
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="mb-4">
                              <h5 className="font-medium mb-2">Shipping Address</h5>
                              <div className="p-3 bg-gray-50 rounded text-sm">
                                <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                                <p className="text-gray-600">{order.shipping_address.address_line1}</p>
                                {order.shipping_address.address_line2 && (
                                  <p className="text-gray-600">{order.shipping_address.address_line2}</p>
                                )}
                                <p className="text-gray-600">
                                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Status Timeline */}
                          <div>
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
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(selectedOrder?.id === order.id ? null : order);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {selectedOrder?.id === order.id ? 'Show Less' : 'Show Details'}
                        </button>

                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔍 View Order clicked for order:', order.id);
                              console.log('🌐 Navigating to:', `/order-confirmation/${order.id}`);
                              navigate(`/order-confirmation/${order.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Order
                          </button>
                          {order.order_status === 'out_for_delivery' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/track-order/${order.id}`);
                              }}
                              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                            >
                              <TruckIcon className="h-4 w-4 mr-1" />
                              Track
                            </button>
                          )}
                          {order.order_status === 'delivered' && !order.has_feedback && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openFeedbackModal(order, 'create');
                              }}
                              className="text-sweetbite-600 hover:text-sweetbite-700 text-sm font-medium flex items-center bg-sweetbite-50 px-3 py-1 rounded-lg hover:bg-sweetbite-100 transition-colors"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Give Feedback
                            </button>
                          )}
                          {order.order_status === 'delivered' && order.has_feedback && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFeedbackModal(order, 'view');
                                }}
                                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFeedbackModal(order, 'edit');
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this feedback?')) {
                                    deleteFeedback(order.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                  <h2 className="text-xl font-semibold mb-4">Your Stats</h2>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders</span>
                      <span className="font-medium">{customerStats.totalOrders}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Orders</span>
                      <span className="font-medium">
                        {orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">
                        {orders.filter(o => o.order_status === 'delivered').length}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-medium">
                        RS {customerStats.totalSpent.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Favorite Items */}
                  {customerStats.favoriteItems.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-3">Your Favorites</h3>
                      <div className="space-y-2">
                        {customerStats.favoriteItems.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 truncate">{item.name}</span>
                            <span className="font-medium">{item.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      If you have questions about your order, contact our customer support.
                    </p>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedOrderForFeedback(null);
          setExistingFeedback(null);
          setIsEditingFeedback(false);
          setIsViewOnlyFeedback(false);
        }}
        order={selectedOrderForFeedback}
        onSubmitFeedback={handleFeedbackSubmit}
        existingFeedback={existingFeedback}
        isEditing={isEditingFeedback}
        isViewOnly={isViewOnlyFeedback}
      />
    </div>
  );
};

export default MyOrdersPage;
