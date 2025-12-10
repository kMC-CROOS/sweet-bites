import {
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ShoppingBagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import EditCustomerModal from '../components/EditCustomerModal';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    console.log('CustomerDashboard auth check:', { isAuthenticated, user });

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to home');
      navigate('/');
      return;
    }

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
      console.log('User not admin or inventory manager, redirecting to home. User:', user);
      navigate('/');
      return;
    }

    console.log('Admin/Inventory Manager access granted');
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    console.log('CustomerDashboard useEffect triggered');

    // Only load data if user is authenticated and authorized
    if (isAuthenticated && user && (user.user_type === 'admin' || user.user_type === 'inventory_manager')) {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Timeout reached, forcing loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout

      // Load data
      loadCustomerData();

      return () => clearTimeout(timeoutId);
    } else if (!isAuthenticated || (user && user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
      // User is not authorized, don't load data
      setLoading(false);
    }

    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'customers', 'analytics', 'communications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, isAuthenticated, user]);

  const loadCustomerData = async () => {
    console.log('loadCustomerData called');
    try {
      setLoading(true);
      console.log('Loading customer data...');

      // Load customers from backend
      const customersResponse = await fetch('http://localhost:8000/api/users/users/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        console.log('Raw customers data from API:', customersData);

        // Handle both paginated and non-paginated responses
        const usersList = customersData.results || customersData;
        const allUsers = Array.isArray(usersList) ? usersList : [];

        // Map the user data to match the expected format
        const mappedUsers = allUsers.map(user => ({
          ...user,
          role: user.user_type || 'customer' // Map user_type to role for consistency
        }));

        setCustomers(mappedUsers);
        console.log('Loaded customers from backend:', mappedUsers.length);
        console.log('Customer data sample:', mappedUsers.slice(0, 2));
      } else {
        console.error('Failed to load customers:', customersResponse.status);
        setCustomers(getMockCustomers());
      }

      // Load orders from backend
      const ordersResponse = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('Raw orders data from API:', ordersData);

        // Handle both paginated and non-paginated responses
        const ordersList = ordersData.results || ordersData;
        const validOrders = Array.isArray(ordersList) ? ordersList : [];

        setOrders(validOrders);
        console.log('Loaded orders from backend:', validOrders.length);
        console.log('Orders data sample:', validOrders.slice(0, 2));
      } else {
        console.error('Failed to load orders:', ordersResponse.status);
        setOrders(getMockOrders());
      }

    } catch (error) {
      console.error('Error loading customer data:', error);
      setCustomers(getMockCustomers());
      setOrders(getMockOrders());
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Mock data functions
  const getMockCustomers = () => [
    {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer',
      is_active: true,
      date_joined: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      username: 'jane_smith',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'customer',
      is_active: true,
      date_joined: '2024-01-20T14:45:00Z'
    },
    {
      id: 3,
      username: 'admin_user',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      date_joined: '2024-01-01T09:00:00Z'
    },
    {
      id: 4,
      username: 'inactive_customer',
      email: 'inactive@example.com',
      first_name: 'Inactive',
      last_name: 'Customer',
      role: 'customer',
      is_active: false,
      date_joined: '2024-01-10T16:20:00Z'
    }
  ];

  const getMockOrders = () => [
    {
      id: 1,
      customer_id: 1,
      total_amount: 45.99,
      status: 'completed',
      created_at: '2024-01-25T10:30:00Z'
    },
    {
      id: 2,
      customer_id: 2,
      total_amount: 38.99,
      status: 'pending',
      created_at: '2024-01-26T14:45:00Z'
    }
  ];

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter(customer => {
    const matchesSearch = customer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || customer.role === selectedRole || customer.user_type === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getCustomerStats = () => {
    const totalCustomers = (Array.isArray(customers) ? customers : []).filter(c =>
      c.role === 'customer' || c.user_type === 'customer'
    ).length;
    const totalStaff = (Array.isArray(customers) ? customers : []).filter(c =>
      (c.role !== 'customer' && c.user_type !== 'customer') || c.user_type === 'admin' || c.user_type === 'staff'
    ).length;
    const activeCustomers = (Array.isArray(customers) ? customers : []).filter(c =>
      (c.role === 'customer' || c.user_type === 'customer') && c.is_active
    ).length;
    const totalRevenue = Array.isArray(orders) ? orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) : 0;

    return { totalCustomers, totalStaff, activeCustomers, totalRevenue };
  };

  const getTopCustomers = () => {
    const customerOrders = {};

    // Ensure orders is an array and has valid data
    if (!Array.isArray(orders) || orders.length === 0) {
      return [];
    }

    orders.forEach(order => {
      // Skip orders without customer data
      if (!order || !order.customer || !order.customer.id) {
        return;
      }

      const customerId = order.customer.id;
      if (!customerOrders[customerId]) {
        customerOrders[customerId] = {
          customer: order.customer,
          totalSpent: 0,
          orderCount: 0
        };
      }
      customerOrders[customerId].totalSpent += parseFloat(order.total_amount || 0);
      customerOrders[customerId].orderCount += 1;
    });

    return Object.values(customerOrders)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

  const formatCurrency = (amount) => {
    // Handle null, undefined, or non-numeric values
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || amount === null || amount === undefined) {
      return 'RS 0.00';
    }
    return `RS ${numericAmount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    console.log('✅ Edit button clicked for customer:', customer);
    console.log('Customer data:', {
      id: customer.id,
      username: customer.username,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name
    });

    // Open the edit modal
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleSaveCustomer = (updatedCustomer) => {
    console.log('Customer saved:', updatedCustomer);
    // Refresh the customer list
    loadCustomerData();
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.username}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`http://localhost:8000/api/users/users/${customer.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Remove customer from local state
          setCustomers(customers.filter(c => c.id !== customer.id));
          alert('Customer deleted successfully!');
        } else {
          alert('Failed to delete customer. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('An error occurred while deleting the customer.');
      }
    }
  };

  const handleContactCustomer = (customer) => {
    console.log('✅ Contact button clicked for customer:', customer);
    console.log('Customer email:', customer.email);

    if (!customer.email) {
      alert('❌ Customer email not available!\n\nThis customer does not have an email address on file.');
      console.log('❌ No email available for customer:', customer);
      return;
    }

    const email = customer.email;
    const subject = 'SweetBites - Customer Support';
    const customerName = customer.first_name || customer.username || 'Valued Customer';
    const body = `Dear ${customerName},\n\nThank you for being a valued customer at SweetBites.\n\nWe hope you're enjoying our delicious cakes and excellent service. If you have any questions, concerns, or feedback, please don't hesitate to reach out to us.\n\nBest regards,\nSweetBites Customer Support Team\n\nPhone: (555) 123-CAKE\nWebsite: https://sweetbites.com`;

    console.log('📧 Preparing email for:', {
      customerName,
      email,
      subject
    });

    try {
      // Open default email client
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      console.log('📧 Opening email client with link:', mailtoLink);

      window.open(mailtoLink, '_blank');

      // Show success message
      alert(`✅ Email client opened successfully!\n\nRecipient: ${customerName}\nEmail: ${email}\n\nPlease send your message from your default email application.`);
      console.log('✅ Email client opened successfully');
    } catch (error) {
      console.error('❌ Error opening email client:', error);
      alert(`❌ Failed to open email client!\n\nError: ${error.message}\n\nYou can manually send an email to: ${email}`);
    }
  };

  const handleAddCustomer = () => {
    console.log('Add customer clicked');
    // Open registration modal to create a new customer account
    setShowAddCustomerModal(true);
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setSelectedCustomer(null);
  };

  // Show loading while checking authentication
  if (loading || !isAuthenticated || !user || (user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  const stats = getCustomerStats();
  const topCustomers = getTopCustomers();

  console.log('CustomerDashboard render - loading:', loading, 'customers:', customers.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600">Manage customer accounts, view analytics, and track customer behavior</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('Debug - Current state:', {
                    loading,
                    isAuthenticated,
                    user,
                    userType: user?.user_type,
                    customersCount: customers.length,
                    ordersCount: orders.length
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Debug Info
              </button>
              <button
                onClick={handleAddCustomer}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                Add Customer
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
              { id: 'customers', name: 'Customers', icon: UsersIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
              { id: 'communications', name: 'Communications', icon: EnvelopeIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.name}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Staff Members</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalStaff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Customers by Spending</h3>
              </div>
              <div className="p-6">
                {topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {topCustomers.map((customerData, index) => (
                      <div key={customerData.customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600 font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customerData.customer.first_name} {customerData.customer.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{customerData.customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(customerData.totalSpent)}</p>
                          <p className="text-sm text-gray-600">{customerData.orderCount} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No customer data available</p>
                  </div>
                )}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View All Customers
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Customer Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Customer Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.customer.first_name} {order.customer.last_name}
                          </p>
                          <p className="text-sm text-gray-600">Order #{order.order_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="inventory_manager">Inventory Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customers ({filteredCustomers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <UsersIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div className="text-sm text-gray-500">@{customer.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(customer.role === 'admin' || customer.user_type === 'admin') ? 'bg-red-100 text-red-800' :
                              (customer.role === 'staff' || customer.user_type === 'staff') ? 'bg-blue-100 text-blue-800' :
                                (customer.role === 'inventory_manager' || customer.user_type === 'inventory_manager') ? 'bg-purple-100 text-purple-800' :
                                  'bg-green-100 text-green-800'
                            }`}>
                            {(customer.role || customer.user_type || 'customer').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.date_joined ? formatDate(customer.date_joined) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleContactCustomer(customer)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Contact
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Customer Demographics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Demographics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <UsersIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">New Customers</h4>
                    <p className="text-3xl font-bold text-blue-600">
                      {(Array.isArray(customers) ? customers : []).filter(c => {
                        if (!c.date_joined) return false;
                        const joinDate = new Date(c.date_joined);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return joinDate >= thirtyDaysAgo;
                      }).length}
                    </p>
                    <p className="text-sm text-gray-600">Last 30 days</p>
                  </div>

                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <ChartBarIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Average Order Value</h4>
                    <p className="text-3xl font-bold text-green-600">
                      {orders.length > 0 ? formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) / orders.length) : 'RS 0.00'}
                    </p>
                    <p className="text-sm text-gray-600">Per order</p>
                  </div>

                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <CalendarIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Repeat Customers</h4>
                    <p className="text-3xl font-bold text-purple-600">
                      {topCustomers.filter(c => c.orderCount > 1).length}
                    </p>
                    <p className="text-sm text-gray-600">Multiple orders</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Behavior Analysis */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Behavior Analysis</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer Segments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {(Array.isArray(customers) ? customers : []).filter(c => c.role === 'customer').length}
                        </p>
                        <p className="text-sm text-blue-600">Regular Customers</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {topCustomers.filter(c => c.totalSpent > 100).length}
                        </p>
                        <p className="text-sm text-green-600">High-Value Customers</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {(Array.isArray(customers) ? customers : []).filter(c => c.role === 'customer' && !c.is_active).length}
                        </p>
                        <p className="text-sm text-yellow-600">Inactive Customers</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {(Array.isArray(customers) ? customers : []).filter(c => c.role !== 'customer').length}
                        </p>
                        <p className="text-sm text-purple-600">Staff Members</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Customer Communications</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <EnvelopeIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Email Campaigns</h4>
                  <p className="text-gray-600 mb-4">Send promotional emails and newsletters to customers</p>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Create Campaign
                  </button>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <PhoneIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">SMS Notifications</h4>
                  <p className="text-gray-600 mb-4">Send order updates and delivery notifications</p>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Send SMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showCustomerModal}
        onClose={handleCloseModal}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        customer={selectedCustomer}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveCustomer}
      />

      {/* Add Customer Modal */}
      <LoginModal
        isOpen={showAddCustomerModal}
        onClose={() => {
          setShowAddCustomerModal(false);
          // Refresh customer data after a new customer is added
          loadCustomerData();
        }}
        forceRegistration={true}
      />
    </div>
  );
};

export default CustomerDashboard;
