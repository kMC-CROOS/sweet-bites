import {
  ChartBarIcon,
  CheckCircleIcon,
  CubeIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [reportsData, setReportsData] = useState({
    orders: {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      averageOrderValue: 0,
      recentOrders: []
    },
    feedback: {
      totalFeedback: 0,
      averageRating: 0,
      recentFeedback: []
    },
    inventory: {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalStockValue: 0,
      lowStockAlerts: []
    }
  });
  const [selectedReport, setSelectedReport] = useState('orders');

  // Check for report type in URL parameters
  useEffect(() => {
    const reportType = searchParams.get('type');
    console.log('=== AdminReportsPage URL Debug ===');
    console.log('URL search params:', searchParams.toString());
    console.log('Report type from URL:', reportType);

    if (reportType && ['orders', 'feedback', 'inventory'].includes(reportType)) {
      console.log('Setting selected report to:', reportType);
      setSelectedReport(reportType);
    } else {
      console.log('No valid report type in URL, using default: orders');
    }
  }, [searchParams]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Check if a given ISO/date string is within the selected range (inclusive)
  const isWithinSelectedRange = (dateString) => {
    if (!dateString) return false;
    const created = new Date(dateString);
    // Normalize times to midnight for consistent inclusive comparisons
    const start = new Date(dateRange.startDate + 'T00:00:00');
    const end = new Date(dateRange.endDate + 'T23:59:59');
    return created >= start && created <= end;
  };

  // Validate date range
  const validateDateRange = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const today = new Date();

    if (start > end) {
      setError('Start date cannot be after end date');
      return false;
    }
    if (end > today) {
      setError('End date cannot be in the future');
      return false;
    }
    return true;
  };

  // Load reports data
  const loadReportsData = useCallback(async () => {
    try {
      console.log('=== Loading Reports Data ===');
      console.log('Selected report type:', selectedReport);
      console.log('Date range:', dateRange);

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (!validateDateRange()) {
        console.error('Date range validation failed');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load orders data
      const ordersResponse = await fetch('http://localhost:8000/api/orders/orders/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Load feedback data
      const feedbackResponse = await fetch('http://localhost:8000/api/feedback/feedback/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Load inventory data - get all ingredients
      const inventoryResponse = await fetch('http://localhost:8000/api/inventory/ingredients/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text();
        console.error('Orders API Error:', errorText);
        throw new Error(`Failed to load orders: ${ordersResponse.status} ${ordersResponse.statusText} - ${errorText}`);
      }
      if (!feedbackResponse.ok) {
        const errorText = await feedbackResponse.text();
        console.error('Feedback API Error:', errorText);
        throw new Error(`Failed to load feedback: ${feedbackResponse.status} ${feedbackResponse.statusText} - ${errorText}`);
      }
      if (!inventoryResponse.ok) {
        const errorText = await inventoryResponse.text();
        console.error('Inventory API Error:', errorText);
        throw new Error(`Failed to load inventory: ${inventoryResponse.status} ${inventoryResponse.statusText} - ${errorText}`);
      }

      const ordersData = await ordersResponse.json();
      const feedbackData = await feedbackResponse.json();
      const inventoryData = await inventoryResponse.json();

      console.log('=== API Response Data ===');
      console.log('Orders data received:', ordersData);
      console.log('Orders count:', Array.isArray(ordersData.results) ? ordersData.results.length : Array.isArray(ordersData) ? ordersData.length : 'Not array');
      console.log('Feedback data received:', feedbackData);
      console.log('Feedback count:', Array.isArray(feedbackData.results) ? feedbackData.results.length : Array.isArray(feedbackData) ? feedbackData.length : 'Not array');
      console.log('Inventory data received:', inventoryData);
      console.log('Inventory count:', Array.isArray(inventoryData.results) ? inventoryData.results.length : Array.isArray(inventoryData) ? inventoryData.length : 'Not array');

      // Extract orders from paginated response
      const ordersList = ordersData.results || ordersData;
      const feedbackList = feedbackData.results || feedbackData;

      // Apply date filtering on the client (fields: created_at or date)
      const filteredOrders = Array.isArray(ordersList)
        ? ordersList.filter((o) => isWithinSelectedRange(o.created_at || o.date || o.updated_at))
        : [];

      const filteredFeedback = Array.isArray(feedbackList)
        ? feedbackList.filter((f) => isWithinSelectedRange(f.created_at || f.date || f.updated_at))
        : [];
      const inventoryList = inventoryData.results || inventoryData;

      // Process orders data with validation
      const processedOrdersData = {
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, order) => {
          const amount = parseFloat(order.total_amount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
        pendingOrders: filteredOrders.filter(order => order.order_status === 'pending').length,
        completedOrders: filteredOrders.filter(order => order.order_status === 'delivered').length,
        cancelledOrders: filteredOrders.filter(order => order.order_status === 'cancelled').length,
        averageOrderValue: 0,
        recentOrders: filteredOrders.slice(0, 10)
      };

      processedOrdersData.averageOrderValue = processedOrdersData.totalOrders > 0
        ? processedOrdersData.totalRevenue / processedOrdersData.totalOrders
        : 0;

      // Process feedback data with validation
      const processedFeedbackData = {
        totalFeedback: filteredFeedback.length,
        averageRating: 0,
        recentFeedback: filteredFeedback.slice(0, 10)
      };

      if (filteredFeedback.length > 0) {
        const validRatings = filteredFeedback.filter(feedback =>
          feedback.rating && !isNaN(parseFloat(feedback.rating)) && parseFloat(feedback.rating) >= 1 && parseFloat(feedback.rating) <= 5
        );
        if (validRatings.length > 0) {
          const totalRating = validRatings.reduce((sum, feedback) => sum + parseFloat(feedback.rating), 0);
          processedFeedbackData.averageRating = totalRating / validRatings.length;
        }
      }

      // Process inventory data with validation
      const processedInventoryData = {
        totalProducts: Array.isArray(inventoryList) ? inventoryList.length : 0,
        lowStockItems: Array.isArray(inventoryList) ? inventoryList.filter(item => {
          const stock = parseInt(item.current_stock || 0);
          const minStock = parseInt(item.minimum_stock || 5);
          return !isNaN(stock) && !isNaN(minStock) && stock <= minStock && stock > 0;
        }).length : 0,
        outOfStockItems: Array.isArray(inventoryList) ? inventoryList.filter(item => {
          const stock = parseInt(item.current_stock || 0);
          return !isNaN(stock) && stock === 0;
        }).length : 0,
        totalStockValue: Array.isArray(inventoryList) ? inventoryList.reduce((sum, item) => {
          const stock = parseInt(item.current_stock || 0);
          const price = parseFloat(item.unit_cost || item.price || 0);
          return sum + (isNaN(stock) || isNaN(price) ? 0 : stock * price);
        }, 0) : 0,
        lowStockAlerts: Array.isArray(inventoryList) ? inventoryList.filter(item => {
          const stock = parseInt(item.current_stock || 0);
          const minStock = parseInt(item.minimum_stock || 5);
          return !isNaN(stock) && !isNaN(minStock) && stock <= minStock;
        }) : []
      };

      const finalReportsData = {
        orders: processedOrdersData,
        feedback: processedFeedbackData,
        inventory: processedInventoryData
      };

      console.log('=== Final Processed Reports Data ===');
      console.log('Final reports data:', finalReportsData);
      console.log('Orders total:', processedOrdersData.totalOrders);
      console.log('Feedback total:', processedFeedbackData.totalFeedback);
      console.log('Inventory total:', processedInventoryData.totalProducts);

      setReportsData(finalReportsData);

      setSuccessMessage('Reports loaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error loading reports data:', error);
      setError(error.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, validateDateRange]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // Diagnostic function to check browser download capabilities
  const checkDownloadCapabilities = () => {
    const diagnostics = {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
      onLine: navigator.onLine,
      popupBlocker: false
    };

    // Test for popup blocker
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (popup) {
        popup.close();
        diagnostics.popupBlocker = false;
      } else {
        diagnostics.popupBlocker = true;
      }
    } catch (e) {
      diagnostics.popupBlocker = true;
    }

    console.log('Browser diagnostics:', diagnostics);
    return diagnostics;
  };

  // Fallback download method using blob
  const fallbackDownload = (pdfBlob, fileName) => {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Fallback download failed:', error);
      return false;
    }
  };

  // Generate PDF report
  const generatePDFReport = (reportType) => {
    try {
      console.log('=== PDF Generation Debug Info ===');
      console.log('Generating PDF report for:', reportType);
      console.log('Reports data structure:', reportsData);
      console.log('jsPDF available:', typeof jsPDF !== 'undefined');
      console.log('Date range:', dateRange);

      // Check if data is loaded
      if (!reportsData || Object.keys(reportsData).length === 0) {
        console.error('No reports data available');
        setError('Please load reports data first by clicking the Refresh button.');
        alert('Please load reports data first by clicking the Refresh button.');
        return;
      }

      // Check if specific report data exists
      if (!reportsData[reportType]) {
        console.error(`No ${reportType} data available`);
        setError(`No ${reportType} data available. Please refresh the data and try again.`);
        alert(`No ${reportType} data available. Please refresh the data and try again.`);
        return;
      }

      // Validate specific report type data
      const reportData = reportsData[reportType];
      if (reportType === 'orders') {
        if (!reportData.totalOrders && !reportData.recentOrders?.length) {
          console.error('No order data to generate report');
          setError('No order data found for the selected date range.');
          alert('No order data found for the selected date range. Please select a different date range or refresh the data.');
          return;
        }
      } else if (reportType === 'feedback') {
        if (!reportData.totalFeedback && !reportData.recentFeedback?.length) {
          console.error('No feedback data to generate report');
          setError('No feedback data found for the selected date range.');
          alert('No feedback data found for the selected date range. Please select a different date range or refresh the data.');
          return;
        }
      } else if (reportType === 'inventory') {
        if (!reportData.totalProducts && !reportData.lowStockAlerts?.length) {
          console.error('No inventory data to generate report');
          setError('No inventory data found.');
          alert('No inventory data found. Please refresh the data and try again.');
          return;
        }
      }

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF library not available');
        setError('PDF generation library not loaded. Please refresh the page and try again.');
        alert('PDF generation library not loaded. Please refresh the page and try again.');
        return;
      }

      console.log(`Starting PDF generation for ${reportType} with data:`, reportData);

      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      let yPosition = 20;

      // Add title
      doc.setFontSize(20);
      doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 20, yPosition);
      yPosition += 20;

      if (reportType === 'orders') {
        const ordersData = reportsData.orders;

        // Orders summary
        doc.setFontSize(14);
        doc.text('Orders Summary', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.text(`Total Orders: ${ordersData.totalOrders}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Total Revenue: RS ${(ordersData.totalRevenue || 0).toFixed(2)}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Average Order Value: RS ${(ordersData.averageOrderValue || 0).toFixed(2)}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Pending Orders: ${ordersData.pendingOrders}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Completed Orders: ${ordersData.completedOrders}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Cancelled Orders: ${ordersData.cancelledOrders}`, 20, yPosition);
        yPosition += 15;

        // Recent orders
        if (ordersData.recentOrders.length > 0) {
          doc.setFontSize(14);
          doc.text('Recent Orders', 20, yPosition);
          yPosition += 15;

          doc.setFontSize(8);
          ordersData.recentOrders.slice(0, 10).forEach(order => {
            const orderText = `Order #${order.order_number || 'N/A'} - ${order.customer?.username || 'N/A'} - ${order.order_status || 'N/A'} - RS ${order.total_amount || 0}`;
            doc.text(orderText, 20, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }

      } else if (reportType === 'feedback') {
        const feedbackData = reportsData.feedback;

        // Feedback summary
        doc.setFontSize(14);
        doc.text('Feedback Summary', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.text(`Total Feedback: ${feedbackData.totalFeedback}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Average Rating: ${(feedbackData.averageRating || 0).toFixed(2)}/5.0`, 20, yPosition);
        yPosition += 8;
        doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 20, yPosition);
        yPosition += 15;

        // Recent feedback
        if (feedbackData.recentFeedback.length > 0) {
          doc.setFontSize(14);
          doc.text('Recent Feedback', 20, yPosition);
          yPosition += 15;

          doc.setFontSize(8);
          feedbackData.recentFeedback.slice(0, 10).forEach(feedback => {
            const comment = feedback.comment || feedback.message || 'No comment';
            const shortComment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
            const feedbackText = `${feedback.customer?.username || 'Anonymous'} - ${feedback.rating || 'N/A'} stars - ${shortComment}`;
            doc.text(feedbackText, 20, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }

      } else if (reportType === 'inventory') {
        const inventoryData = reportsData.inventory;

        // Inventory summary
        doc.setFontSize(14);
        doc.text('Inventory Summary', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(10);
        doc.text(`Total Products: ${inventoryData.totalProducts}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Low Stock Items: ${inventoryData.lowStockItems}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Out of Stock Items: ${inventoryData.outOfStockItems}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Total Stock Value: RS ${(inventoryData.totalStockValue || 0).toFixed(2)}`, 20, yPosition);
        yPosition += 15;

        // Low stock alerts
        if (inventoryData.lowStockAlerts.length > 0) {
          doc.setFontSize(14);
          doc.text('Low Stock Alerts', 20, yPosition);
          yPosition += 15;

          doc.setFontSize(8);
          inventoryData.lowStockAlerts.slice(0, 10).forEach(item => {
            const alertText = `${item.name || 'N/A'} - Stock: ${item.current_stock || 0} - Price: RS ${item.unit_cost || 0} - Unit: ${item.unit || 'N/A'}`;
            doc.text(alertText, 20, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }
      }

      // Save the PDF
      const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Attempting to save PDF with filename:', fileName);

      // Run diagnostics
      const diagnostics = checkDownloadCapabilities();

      // Clear any previous errors before attempting download
      setError(null);

      try {
        // Primary method: Use jsPDF's built-in save
        console.log('Attempting primary download method...');
        doc.save(fileName);
        console.log('Primary download method executed successfully');

      } catch (saveError) {
        console.warn('Primary download method failed, trying fallback...', saveError);

        // Fallback method: Create blob and manual download
        try {
          const pdfBlob = doc.output('blob');
          const fallbackSuccess = fallbackDownload(pdfBlob, fileName);

          if (!fallbackSuccess) {
            throw new Error('Both primary and fallback download methods failed');
          }

          console.log('Fallback download method succeeded');
        } catch (fallbackError) {
          console.error('Fallback download also failed:', fallbackError);
          throw new Error(`Download failed: ${saveError.message}. Fallback also failed: ${fallbackError.message}`);
        }
      }

      // Additional troubleshooting info
      if (diagnostics.popupBlocker) {
        console.warn('⚠️ Popup blocker detected - this may prevent downloads');
        console.warn('Please disable popup blocker for this site or manually allow downloads');
      }

      // Set success message with additional instructions
      let successMsg = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully! Check your Downloads folder.`;

      if (diagnostics.popupBlocker) {
        successMsg += ' If download didn\'t start, please disable popup blocker and try again.';
      }

      setSuccessMessage(successMsg);

      // Clear success message after 8 seconds (longer due to additional text)
      setTimeout(() => setSuccessMessage(null), 8000);

    } catch (error) {
      console.error('=== PDF Generation Error ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);

      const errorMsg = `Failed to generate ${reportType} report: ${error.message || 'Unknown error occurred'}`;
      setError(errorMsg);

      // Also show alert for immediate user feedback
      alert(`Failed to generate PDF report. Error: ${error.message || 'Unknown error'}. Please check the console for more details and try again.`);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `RS ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('=== AdminReportsPage Error State ===');
    console.error('Error message:', error);
    console.error('Current state:', { loading, authLoading, selectedReport, reportsData });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Reports</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="text-sm text-red-500 mb-4">
              <p>Selected Report: {selectedReport}</p>
              <p>Check browser console for detailed error logs</p>
            </div>
            <button
              onClick={loadReportsData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Console debug for rendering
  console.log('=== AdminReportsPage Render ===');
  console.log('Current state:', { loading, authLoading, error, selectedReport, successMessage });
  console.log('Reports data summary:', {
    ordersTotal: reportsData.orders?.totalOrders,
    feedbackTotal: reportsData.feedback?.totalFeedback,
    inventoryTotal: reportsData.inventory?.totalProducts
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Generate and download comprehensive business reports</p>
              {/* Debug Info */}
              <div className="text-xs text-gray-400 mt-1">
                Debug: Report={selectedReport} | Loading={loading.toString()} | Error={!!error}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadReportsData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <ChartBarIcon className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Period</h3>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={loadReportsData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-6 flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Update Reports</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedReport('orders')}
              className={`p-4 rounded-lg border-2 transition-colors ${selectedReport === 'orders'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              <ShoppingCartIcon className="h-8 w-8 mx-auto mb-2" />
              <h4 className="font-medium">Orders Report</h4>
              <p className="text-sm text-gray-600">Sales, orders, revenue</p>
            </button>

            <button
              onClick={() => setSelectedReport('feedback')}
              className={`p-4 rounded-lg border-2 transition-colors ${selectedReport === 'feedback'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-green-300'
                }`}
            >
              <StarIcon className="h-8 w-8 mx-auto mb-2" />
              <h4 className="font-medium">Feedback Report</h4>
              <p className="text-sm text-gray-600">Customer reviews, ratings</p>
            </button>

            <button
              onClick={() => setSelectedReport('inventory')}
              className={`p-4 rounded-lg border-2 transition-colors ${selectedReport === 'inventory'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-purple-300'
                }`}
            >
              <CubeIcon className="h-8 w-8 mx-auto mb-2" />
              <h4 className="font-medium">Inventory Report</h4>
              <p className="text-sm text-gray-600">Stock levels, alerts</p>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Report Details */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {selectedReport} Report
                </h2>
                <button
                  onClick={() => generatePDFReport(selectedReport)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download PDF</span>
                </button>
              </div>

              {/* Orders Report */}
              {selectedReport === 'orders' && (
                <div className="space-y-6">
                  {/* Debug Information */}
                  {console.log('=== Orders Report Render Debug ===') ||
                    console.log('Orders data for rendering:', reportsData.orders) ||
                    console.log('Total orders to display:', reportsData.orders.totalOrders)}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-900">{reportsData.orders.totalOrders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(reportsData.orders.totalRevenue)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                          <p className="text-2xl font-bold text-purple-900">{formatCurrency(reportsData.orders.averageOrderValue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">{reportsData.orders.pendingOrders}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Completed</p>
                      <p className="text-2xl font-bold text-green-900">{reportsData.orders.completedOrders}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">Cancelled</p>
                      <p className="text-2xl font-bold text-red-900">{reportsData.orders.cancelledOrders}</p>
                    </div>
                  </div>

                  {/* Recent Orders Table */}
                  {reportsData.orders.recentOrders.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportsData.orders.recentOrders.map((order) => (
                              <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {order.order_number || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {order.customer?.username || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.order_status || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(order.total_amount || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(order.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No recent orders found for the selected date range.</p>
                      <p className="text-sm text-gray-400">Try refreshing the data or selecting a different date range.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Report */}
              {selectedReport === 'feedback' && (
                <div className="space-y-6">
                  {/* Debug Information */}
                  {console.log('=== Feedback Report Render Debug ===') ||
                    console.log('Feedback data for rendering:', reportsData.feedback) ||
                    console.log('Total feedback to display:', reportsData.feedback.totalFeedback)}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <StarIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Feedback</p>
                          <p className="text-2xl font-bold text-blue-900">{reportsData.feedback.totalFeedback}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Average Rating</p>
                          <p className="text-2xl font-bold text-green-900">{reportsData.feedback.averageRating.toFixed(1)}/5</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Feedback */}
                  {reportsData.feedback.recentFeedback.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
                      <div className="space-y-4">
                        {reportsData.feedback.recentFeedback.map((feedback) => (
                          <div key={feedback.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {feedback.customer?.username || 'Anonymous'}
                                </span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <StarIcon
                                      key={i}
                                      className={`h-4 w-4 ${i < (feedback.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">{formatDate(feedback.created_at)}</span>
                            </div>
                            {feedback.comment && (
                              <p className="text-gray-700">{feedback.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Report */}
              {selectedReport === 'inventory' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CubeIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Products</p>
                          <p className="text-2xl font-bold text-blue-900">{reportsData.inventory.totalProducts}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Stock Value</p>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(reportsData.inventory.totalStockValue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Alerts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm text-yellow-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-900">{reportsData.inventory.lowStockItems}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm text-red-600">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-900">{reportsData.inventory.outOfStockItems}</p>
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  {reportsData.inventory.lowStockAlerts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportsData.inventory.lowStockAlerts.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${(item.current_stock || 0) === 0 ? 'bg-red-100 text-red-800' :
                                    (item.current_stock || 0) < 10 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                    {item.current_stock || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(item.cost_per_unit || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.unit || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-4">
                <button
                  onClick={loadReportsData}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
                </button>

                <button
                  onClick={() => generatePDFReport('orders')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download Sales Report</span>
                </button>

                <button
                  onClick={() => generatePDFReport('feedback')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download Feedback PDF</span>
                </button>

                <button
                  onClick={() => generatePDFReport('inventory')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Download Inventory PDF</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Data Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Orders:</span>
                    <span className={reportsData.orders?.totalOrders > 0 ? 'text-green-600' : 'text-red-600'}>
                      {reportsData.orders?.totalOrders || 0} loaded
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Feedback:</span>
                    <span className={reportsData.feedback?.totalFeedback > 0 ? 'text-green-600' : 'text-red-600'}>
                      {reportsData.feedback?.totalFeedback || 0} loaded
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory:</span>
                    <span className={reportsData.inventory?.totalProducts > 0 ? 'text-green-600' : 'text-red-600'}>
                      {reportsData.inventory?.totalProducts || 0} loaded
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Reports use data from the selected date range.
                </p>
              </div>

              {/* Troubleshooting Section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Download Troubleshooting</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• If downloads don't start, check popup blocker settings</p>
                  <p>• Try disabling browser extensions temporarily</p>
                  <p>• Check Downloads folder for completed files</p>
                  <p>• Use Chrome/Firefox for best compatibility</p>
                  <p>• Open browser console (F12) for detailed error info</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
