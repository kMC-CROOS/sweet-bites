import {
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    todaySales: 0,
    recentOrders: [],
    lowStockAlerts: [],
    topProducts: [],
    feedback: {
      totalFeedback: 0,
      averageRating: 0,
      recentFeedback: [],
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  // Reports date range (visible in Admin page like Inventory)
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const isWithinSelectedRange = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const start = new Date(reportDateRange.startDate + 'T00:00:00');
    const end = new Date(reportDateRange.endDate + 'T23:59:59');
    return d >= start && d <= end;
  };

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError('');
      setLoading(true);

      console.log('Loading dashboard data...');

      // Try to fetch from the comprehensive dashboard endpoint first
      try {
        console.log('Fetching dashboard data from admin endpoint...');
        const dashboardResponse = await fetch('http://localhost:8000/api/orders/admin-dashboard/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Dashboard response status:', dashboardResponse.status);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('Dashboard data received:', dashboardData);

          // Extract data from the comprehensive response
          const overview = dashboardData.overview || {};
          const orders = dashboardData.orders || {};
          const inventory = dashboardData.inventory || {};

          // Load feedback data
          const feedbackResponse = await fetch('http://localhost:8000/api/feedback/', {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          let feedbackData = {
            totalFeedback: 0,
            averageRating: 0,
            recentFeedback: [],
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          };

          if (feedbackResponse.ok) {
            const feedback = await feedbackResponse.json();
            console.log('Raw feedback data from API:', feedback);

            const feedbackList = Array.isArray(feedback) ? feedback : (feedback.results || []);
            console.log('Processed feedback list:', feedbackList);

            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            if (Array.isArray(feedbackList)) {
              feedbackList.forEach(fb => {
                if (fb.rating && fb.rating >= 1 && fb.rating <= 5) {
                  ratingDistribution[fb.rating] = (ratingDistribution[fb.rating] || 0) + 1;
                }
              });
            }

            feedbackData = {
              totalFeedback: feedbackList.length,
              averageRating: feedbackList.length > 0 ?
                (feedbackList.reduce((sum, fb) => sum + (parseFloat(fb.rating) || 0), 0) / feedbackList.length).toFixed(1) : 0,
              recentFeedback: feedbackList.slice(0, 5),
              ratingDistribution
            };

            console.log('Final feedback data:', feedbackData);
          } else {
            console.error('Failed to load feedback data:', feedbackResponse.status);
          }

          setDashboardData({
            totalOrders: overview.total_orders || 0,
            pendingOrders: overview.pending_orders || 0,
            totalRevenue: overview.total_revenue || 0,
            totalCustomers: overview.total_customers || 0,
            lowStockItems: overview.low_stock_items || 0,
            todaySales: overview.today_sales || 0,
            recentOrders: orders.recent_orders || [],
            lowStockAlerts: inventory.low_stock_alerts || [],
            topProducts: [],
            feedback: feedbackData
          });

          return; // Success, exit early
        } else {
          const errorText = await dashboardResponse.text();
          console.error('Failed to load dashboard data:', dashboardResponse.status, errorText);
          setError(`Dashboard API error: ${dashboardResponse.status} - ${errorText}`);
        }
      } catch (dashboardError) {
        console.error('Dashboard API error:', dashboardError);
        setError(`Dashboard API error: ${dashboardError.message}`);
      }

      // Fallback to individual API calls if the dashboard endpoint fails
      console.log('Falling back to individual API calls...');

      // Initialize with default values
      let totalOrders = 0;
      let pendingOrders = 0;
      let totalRevenue = 0;
      let totalCustomers = 0;
      let lowStockItems = 0;
      let todaySales = 0;
      let recentOrders = [];
      let lowStockAlerts = [];
      let topProducts = [];

      // Load orders data using the correct endpoint
      try {
        console.log('Fetching orders data...');
        const ordersResponse = await fetch('http://localhost:8000/api/orders/orders/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Orders response status:', ordersResponse.status);

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log('Orders data received:', ordersData);

          if (Array.isArray(ordersData)) {
            totalOrders = ordersData.length;
            pendingOrders = ordersData.filter(order =>
              ['pending', 'confirmed', 'preparing'].includes(order.order_status)
            ).length;
            totalRevenue = ordersData.reduce((sum, order) => {
              const amount = parseFloat(order.total_amount || 0);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            recentOrders = ordersData.slice(0, 5);

            // Calculate today's sales
            const today = new Date().toISOString().split('T')[0];
            todaySales = ordersData
              .filter(order => order.created_at && order.created_at.startsWith(today))
              .reduce((sum, order) => {
                const amount = parseFloat(order.total_amount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
          }
        } else {
          const errorText = await ordersResponse.text();
          console.error('Failed to load orders data:', ordersResponse.status, errorText);
        }
      } catch (ordersError) {
        console.error('Orders API error:', ordersError);
      }

      // Load inventory data using the correct endpoint
      try {
        console.log('Fetching inventory data...');
        const inventoryResponse = await fetch('http://localhost:8000/api/inventory/ingredients/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Inventory response status:', inventoryResponse.status);

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          console.log('Inventory data received:', inventoryData);

          if (Array.isArray(inventoryData)) {
            // Filter for low stock items (current_stock <= minimum_stock)
            lowStockAlerts = inventoryData.filter(item =>
              item.current_stock <= item.minimum_stock
            );
            lowStockItems = lowStockAlerts.length;
          }
        } else {
          const errorText = await inventoryResponse.text();
          console.error('Failed to load inventory data:', inventoryResponse.status, errorText);
        }
      } catch (inventoryError) {
        console.error('Inventory API error:', inventoryError);
      }

      // Load users data using the correct endpoint
      try {
        console.log('Fetching users data...');
        const usersResponse = await fetch('http://localhost:8000/api/users/users/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Users response status:', usersResponse.status);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('Users data received:', usersData);

          if (Array.isArray(usersData)) {
            totalCustomers = usersData.filter(user => user.user_type === 'customer').length;
          }
        } else {
          const errorText = await usersResponse.text();
          console.error('Failed to load users data:', usersResponse.status, errorText);
        }
      } catch (usersError) {
        console.error('Users API error:', usersError);
      }

      // Load feedback data for fallback
      let feedbackData = {
        totalFeedback: 0,
        averageRating: 0,
        recentFeedback: [],
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      try {
        console.log('Loading feedback data in fallback...');
        const feedbackResponse = await fetch('http://localhost:8000/api/feedback/feedback/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (feedbackResponse.ok) {
          const feedback = await feedbackResponse.json();
          console.log('Raw feedback data from fallback API:', feedback);

          const feedbackList = Array.isArray(feedback) ? feedback : (feedback.results || []);
          console.log('Processed feedback list in fallback:', feedbackList);

          const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          if (Array.isArray(feedbackList)) {
            feedbackList.forEach(fb => {
              if (fb.rating && fb.rating >= 1 && fb.rating <= 5) {
                ratingDistribution[fb.rating] = (ratingDistribution[fb.rating] || 0) + 1;
              }
            });
          }

          feedbackData = {
            totalFeedback: feedbackList.length,
            averageRating: feedbackList.length > 0 ?
              (feedbackList.reduce((sum, fb) => sum + (parseFloat(fb.rating) || 0), 0) / feedbackList.length).toFixed(1) : 0,
            recentFeedback: feedbackList.slice(0, 5),
            ratingDistribution
          };

          console.log('Final feedback data from fallback:', feedbackData);
        } else {
          console.error('Failed to load feedback data in fallback:', feedbackResponse.status);
        }
      } catch (feedbackError) {
        console.error('Feedback API error in fallback:', feedbackError);
      }

      // Set dashboard data with real values
      const dashboardData = {
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalCustomers,
        lowStockItems,
        todaySales,
        recentOrders,
        lowStockAlerts,
        topProducts,
        feedback: feedbackData
      };

      console.log('Setting dashboard data:', dashboardData);
      setDashboardData(dashboardData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(`Dashboard error: ${error.message}`);

      // Set default values on error
      setDashboardData({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        lowStockItems: 0,
        todaySales: 0,
        recentOrders: [],
        lowStockAlerts: [],
        topProducts: [],
        feedback: {
          totalFeedback: 0,
          averageRating: 0,
          recentFeedback: [],
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return `RS ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate PDF report for feedback
  const generateFeedbackPDF = async () => {
    try {
      console.log('Generating feedback PDF...');

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        alert('PDF generation library not loaded. Please refresh the page and try again.');
        return;
      }

      const feedbackData = dashboardData.feedback;
      // Source list: use recentFeedback if present; otherwise empty array
      const sourceList = Array.isArray(feedbackData.recentFeedback) ? feedbackData.recentFeedback : [];
      // Filter strictly by selected date range (inclusive)
      const filteredList = sourceList.filter(f => isWithinSelectedRange(f.created_at || f.date || f.updated_at));
      // Compute stats from filtered list only
      const filteredAvg = filteredList.length > 0
        ? (filteredList.reduce((sum, fb) => sum + (parseFloat(fb.rating) || 0), 0) / filteredList.length)
        : 0;
      const filteredDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      filteredList.forEach(fb => {
        const r = parseInt(fb.rating, 10);
        if (r >= 1 && r <= 5) filteredDist[r] = (filteredDist[r] || 0) + 1;
      });

      // Check if there's feedback data
      if (!feedbackData.totalFeedback && !feedbackData.recentFeedback?.length) {
        alert('No feedback data found. Please ensure there are customer reviews to generate a report.');
        return;
      }

      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      let yPosition = 20;

      // Add title
      doc.setFontSize(20);
      doc.text('Customer Feedback Report', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 20, yPosition);
      yPosition += 15;
      doc.text(`Date Range: ${reportDateRange.startDate} to ${reportDateRange.endDate}`, 20, yPosition);
      yPosition += 10;

      // Feedback summary
      doc.setFontSize(14);
      doc.text('Feedback Summary', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text(`Total Feedback (in range): ${filteredList.length}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Average Rating (in range): ${filteredAvg.toFixed(2)}/5.0`, 20, yPosition);
      yPosition += 8;
      doc.text(`Recent Reviews Listed: ${filteredList.length}`, 20, yPosition);
      yPosition += 15;

      // Rating distribution
      if (filteredList.length > 0) {
        doc.setFontSize(14);
        doc.text('Rating Distribution', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        for (let rating = 5; rating >= 1; rating--) {
          const count = filteredDist[rating] || 0;
          doc.text(`${rating} Stars: ${count} reviews`, 20, yPosition);
          yPosition += 6;
        }
        yPosition += 10;
      }

      // Recent feedback
      if (filteredList.length > 0) {
        doc.setFontSize(14);
        doc.text('Recent Customer Feedback', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(8);
        filteredList.slice(0, 15).forEach((feedback, index) => {
          const comment = feedback.comment || feedback.message || 'No comment';
          const shortComment = comment.length > 60 ? comment.substring(0, 60) + '...' : comment;
          const customerName = feedback.customer?.username || feedback.customer?.first_name || 'Anonymous';
          const rating = feedback.rating || 'N/A';

          doc.text(`${index + 1}. ${customerName} - ${rating} stars`, 20, yPosition);
          yPosition += 5;
          doc.text(`   "${shortComment}"`, 20, yPosition);
          yPosition += 8;

          // Add new page if needed
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      // Save the PDF
      const fileName = `Feedback_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      alert('PDF report generated successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF report. Error: ${error.message}`);
    }
  };

  // Generate PDF report for orders
  const generateOrderPDF = async () => {
    try {
      console.log('Generating order PDF...');

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        alert('PDF generation library not loaded. Please refresh the page and try again.');
        return;
      }

      // Check if there's order data
      if (!dashboardData.totalOrders && !dashboardData.recentOrders?.length) {
        alert('No order data found. Please ensure there are orders to generate a report.');
        return;
      }

      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      let yPosition = 20;

      // Add title
      doc.setFontSize(20);
      doc.text('Order Report', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 20, yPosition);
      yPosition += 15;

      // Order summary
      doc.setFontSize(14);
      doc.text('Order Summary', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.text(`Total Orders: ${dashboardData.totalOrders}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Pending Orders: ${dashboardData.pendingOrders}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Revenue: ${formatCurrency(dashboardData.totalRevenue)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Today's Sales: ${formatCurrency(dashboardData.todaySales)}`, 20, yPosition);
      yPosition += 15;

      // Recent orders
      if (dashboardData.recentOrders && dashboardData.recentOrders.length > 0) {
        doc.setFontSize(14);
        doc.text('Recent Orders', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(8);
        dashboardData.recentOrders.slice(0, 15).forEach((order, index) => {
          const orderDate = new Date(order.created_at).toLocaleDateString();
          const customerName = order.customer?.username || order.customer?.first_name || 'Anonymous';
          const status = order.order_status || 'Unknown';
          const amount = formatCurrency(parseFloat(order.total_amount) || 0);

          doc.text(`${index + 1}. Order #${order.id} - ${customerName}`, 20, yPosition);
          yPosition += 5;
          doc.text(`   Date: ${orderDate} | Status: ${status} | Amount: ${amount}`, 20, yPosition);
          yPosition += 8;

          // Add new page if needed
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      // Save the PDF
      const fileName = `Order_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      alert('Order PDF report generated successfully!');

    } catch (error) {
      console.error('Error generating order PDF:', error);
      alert(`Failed to generate order PDF report. Error: ${error.message}`);
    }
  };

  // Show loading while checking authentication
  if (loading || !isAuthenticated || !user || user.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state only for critical errors
  if (error && error !== 'Network error occurred. Please check your connection.') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                loadDashboardData();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your bakery today.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setLoading(true);
                  loadDashboardData();
                }}
                disabled={loading}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 inline mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh Data
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <UsersIcon className="h-5 w-5 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'orders', name: 'Orders', icon: ShoppingCartIcon },
              { id: 'inventory', name: 'Inventory', icon: CubeIcon },
              { id: 'customers', name: 'Customers', icon: UsersIcon },
              { id: 'reports', name: 'Reports', icon: DocumentTextIcon },
              { id: 'others', name: 'Others', icon: CogIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'others') {
                    navigate('/admin/others');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.pendingOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(dashboardData.totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <StarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.feedback.averageRating}/5</p>
                    <p className="text-xs text-gray-500">{dashboardData.feedback.totalFeedback} reviews</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingCartIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Manage Orders</p>
                      <p className="text-sm text-gray-600">Update status, track delivery</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CubeIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Inventory</p>
                      <p className="text-sm text-gray-600">Check stock levels</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('customers')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <UsersIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Customers</p>
                      <p className="text-sm text-gray-600">View customer data</p>
                    </div>
                  </button>
                </div>

                {/* Catalog & Offer Management */}
                <div className="mt-6 grid grid-cols-1 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Catalog Management</p>
                        <p className="text-sm text-gray-600">Manage cakes, categories and offers</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => navigate('/admin/catalog?tab=cakes')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage Cakes
                      </button>
                      <button
                        onClick={() => navigate('/admin/catalog?tab=categories')}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Manage Categories
                      </button>
                      <button
                        onClick={() => navigate('/admin/offers')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Manage Offers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {(dashboardData.recentOrders || []).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">#{order.order_number}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {order.order_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View All Orders
                  </button>
                </div>
              </div>

              {/* Recent Feedback */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Customer Feedback</h3>
                </div>
                <div className="p-6">
                  {(dashboardData.feedback.recentFeedback || []).length > 0 ? (
                    <div className="space-y-4">
                      {(dashboardData.feedback.recentFeedback || []).map((feedback) => (
                        <div key={feedback.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon
                                      key={star}
                                      className={`h-4 w-4 ${star <= feedback.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  {feedback.customer?.username || 'Anonymous'}
                                </span>
                              </div>
                              <p className="text-gray-900 text-sm mb-2">{feedback.message}</p>
                              <p className="text-xs text-gray-500">{formatDate(feedback.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No feedback received yet</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/admin/reports')}
                    className="w-full mt-4 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    View All Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Order Management</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <ShoppingCartIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Manage Orders</h4>
                  <p className="text-gray-600 mb-4">Update order status, track delivery, and manage customer orders</p>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Orders
                  </button>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <TruckIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Delivery Tracking</h4>
                  <p className="text-gray-600 mb-4">Monitor delivery status and update customer notifications</p>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Track Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Inventory Management</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <CubeIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Stock Levels</h4>
                  <p className="text-gray-600 mb-4">Monitor current stock levels and set reorder points</p>
                  <button
                    onClick={() => navigate('/inventory')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Stock
                  </button>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <DocumentTextIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Purchase Orders</h4>
                  <p className="text-gray-600 mb-4">Create and manage purchase orders with suppliers</p>
                  <button
                    onClick={() => navigate('/inventory?tab=purchase-orders')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Manage PO
                  </button>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Low Stock Alerts</h4>
                  <p className="text-gray-600 mb-4">Get notified when items need reordering</p>
                  <button
                    onClick={() => navigate('/inventory?tab=overview&showLowStock=true')}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    View Alerts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Customer Management</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <UsersIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Customer Database</h4>
                  <p className="text-gray-600 mb-4">View and manage customer information and order history</p>
                  <button
                    onClick={() => {
                      console.log('View Customers clicked, navigating to /admin/customers?tab=customers');
                      console.log('Current user:', user);
                      console.log('Is authenticated:', isAuthenticated);
                      navigate('/admin/customers?tab=customers');
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Customers
                  </button>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <ChartBarIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Purchase History</h4>
                  <p className="text-gray-600 mb-4">View comprehensive purchase history and analytics</p>
                  <button
                    onClick={() => navigate('/admin/purchase-history')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Purchase History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Reports Header */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Business Reports</h3>
                <p className="text-sm text-gray-600">Generate and download business reports as PDF</p>
              </div>
              <div className="p-6">
                {/* Report Date Range - like Inventory */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Report Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={reportDateRange.startDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={reportDateRange.endDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <button
                        onClick={() => { /* no-op: range used at download time */ }}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply Range
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Generate Feedback PDF */}
                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <StarIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 mb-2">Feedback Report</h4>
                    <p className="text-gray-600 mb-4">Download customer feedback analysis as PDF</p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Total Feedback:</span> {dashboardData.feedback.totalFeedback}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Avg Rating:</span> {dashboardData.feedback.averageRating}/5
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Recent Reviews:</span> {dashboardData.feedback.recentFeedback.length}
                      </div>
                    </div>
                    <button
                      onClick={generateFeedbackPDF}
                      className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center mx-auto space-x-2"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      <span>Download Feedback Report</span>
                    </button>
                  </div>

                  {/* Generate Order PDF */}
                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <ShoppingCartIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 mb-2">Order Report</h4>
                    <p className="text-gray-600 mb-4">Download order analysis and sales data as PDF</p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Total Orders:</span> {dashboardData.totalOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Pending Orders:</span> {dashboardData.pendingOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Total Revenue:</span> {formatCurrency(dashboardData.totalRevenue)}
                      </div>
                    </div>
                    <button
                      onClick={generateOrderPDF}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto space-x-2"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      <span>Download Order Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Reports Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Feedback Rating Distribution */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Rating Distribution</h4>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 w-8">{rating}★</span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${dashboardData.feedback.totalFeedback > 0
                                  ? (dashboardData.feedback.ratingDistribution[rating] / dashboardData.feedback.totalFeedback) * 100
                                  : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {dashboardData.feedback.ratingDistribution[rating] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Orders Summary */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Recent Orders Status</h4>
                    <div className="space-y-3">
                      {dashboardData.recentOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">#{order.order_number}</span>
                            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{formatCurrency(order.total_amount)}</span>
                            <span className={`block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                              {order.order_status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
