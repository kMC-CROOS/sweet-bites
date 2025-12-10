import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Purchase Order states
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [poLoading, setPOLoading] = useState(false);
  const [poFormData, setPOFormData] = useState({
    supplier: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    notes: '',
    items: [{ ingredient: '', quantity: '', unit_cost: '' }]
  });

  // Supplier management states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true
  });

  // Ingredient management states
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [viewingIngredient, setViewingIngredient] = useState(null);
  const [ingredientFormData, setIngredientFormData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    current_stock: 0,
    minimum_stock: 0,
    unit_cost: 0,
    supplier: '',
    location: '',
    expiry_date: '',
    is_active: true
  });

  // Reports states
  const [stockMovementReport, setStockMovementReport] = useState(null);
  const [costAnalysisReport, setCostAnalysisReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Consumption Analysis states
  const [consumptionData, setConsumptionData] = useState({
    ingredients: [],
    wastage: [],
    low_usage: [],
    summary: { total_consumption: 0, total_ingredients: 0, total_movements: 0 }
  });
  const [consumptionLoading, setConsumptionLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [reportDateRange, setReportDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (!user || (user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Load purchase orders when tab changes to purchase-orders
  useEffect(() => {
    if (activeTab === 'purchase-orders') {
      loadPurchaseOrders();
    }
  }, [activeTab]);

  // Load consumption data when tab changes to others
  useEffect(() => {
    if (activeTab === 'others') {
      loadConsumptionData();
    }
  }, [activeTab, selectedPeriod]);

  // Check for refresh parameter and reload data if present
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh');
    if (shouldRefresh === 'true') {
      console.log('Refresh parameter detected, reloading inventory data...');
      loadInventoryData();
      // Remove the refresh parameter from URL without triggering navigation
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);


  // Load Purchase Orders
  const loadConsumptionData = async () => {
    try {
      setConsumptionLoading(true);
      console.log('Loading consumption data...');

      const response = await fetch(`http://localhost:8000/api/inventory/ingredients/consumption_analysis/?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Consumption data loaded:', data);
        setConsumptionData(data);
      } else {
        console.error('Failed to load consumption data:', response.status);
        setError('Failed to load consumption data');
      }
    } catch (error) {
      console.error('Error loading consumption data:', error);
      setError('Error loading consumption data');
    } finally {
      setConsumptionLoading(false);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      setPOLoading(true);
      console.log('Loading purchase orders...');

      const response = await fetch('http://localhost:8000/api/inventory/purchase-orders/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Purchase orders loaded:', data);

        // Handle paginated response
        if (data.results && Array.isArray(data.results)) {
          setPurchaseOrders(data.results);
        } else if (Array.isArray(data)) {
          setPurchaseOrders(data);
        } else {
          setPurchaseOrders([]);
        }
      } else {
        console.error('Failed to load purchase orders:', response.status);
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      setPurchaseOrders([]);
    } finally {
      setPOLoading(false);
    }
  };

  // Create Purchase Order
  const createPurchaseOrder = async (orderData) => {
    try {
      setPOLoading(true);
      console.log('Creating purchase order:', orderData);

      const response = await fetch('http://localhost:8000/api/inventory/purchase-orders/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const newPO = await response.json();
        console.log('Purchase order created:', newPO);
        setPurchaseOrders(prev => [newPO, ...prev]);
        setShowCreatePO(false);
        alert('Purchase order created successfully!');
        return true;
      } else {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Failed to create purchase order:', errorData);
          alert(`Failed to create purchase order: ${JSON.stringify(errorData)}`);
        } else {
          // Response is HTML (likely an error page)
          const errorText = await response.text();
          console.error('Server returned HTML error page:', errorText);
          alert(`Server error: ${response.status} ${response.statusText}. Please check the server logs.`);
        }
        return false;
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      if (error.message.includes('Unexpected token')) {
        alert('Server returned an invalid response. Please check if the backend server is running correctly.');
      } else {
        alert(`Error creating purchase order: ${error.message}`);
      }
      return false;
    } finally {
      setPOLoading(false);
    }
  };

  // Update Purchase Order Status
  const updatePOStatus = async (poId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/inventory/purchase-orders/${poId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedPO = await response.json();
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? updatedPO : po));
        alert('Purchase order status updated successfully!');
      } else {
        alert('Failed to update purchase order status');
      }
    } catch (error) {
      console.error('Error updating PO status:', error);
      alert('Error updating purchase order status');
    }
  };

  // Delete Purchase Order
  const deletePurchaseOrder = async (poId, poNumber) => {
    if (!window.confirm(`Are you sure you want to delete Purchase Order ${poNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/inventory/purchase-orders/${poId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the purchase order from the list
        setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
        alert('Purchase order deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete purchase order:', errorData);
        alert('Failed to delete purchase order');
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      alert('Error deleting purchase order');
    }
  };

  // Generate Stock Movement Report
  const generateStockMovementReport = async () => {
    try {
      setReportLoading(true);
      const params = new URLSearchParams({
        start_date: reportDateRange.start_date,
        end_date: reportDateRange.end_date
      });

      const response = await fetch(`http://localhost:8000/api/inventory/stock-movements/movement_report/?${params}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const report = await response.json();
        setStockMovementReport(report);
        setCurrentReport({ type: 'stock_movement', data: report });
        setShowReportModal(true);
      } else {
        alert('Failed to generate stock movement report');
      }
    } catch (error) {
      console.error('Error generating stock movement report:', error);
      alert('Error generating stock movement report');
    } finally {
      setReportLoading(false);
    }
  };

  // Generate Cost Analysis Report
  const generateCostAnalysisReport = async () => {
    try {
      setReportLoading(true);
      const params = new URLSearchParams({
        start_date: reportDateRange.start_date,
        end_date: reportDateRange.end_date
      });

      const response = await fetch(`http://localhost:8000/api/inventory/ingredients/cost_analysis_report/?${params}`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const report = await response.json();
        setCostAnalysisReport(report);
        setCurrentReport({ type: 'cost_analysis', data: report });
        setShowReportModal(true);
      } else {
        alert('Failed to generate cost analysis report');
      }
    } catch (error) {
      console.error('Error generating cost analysis report:', error);
      alert('Error generating cost analysis report');
    } finally {
      setReportLoading(false);
    }
  };

  // Edit Ingredient
  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientFormData({
      name: ingredient.name,
      description: ingredient.description || '',
      unit: ingredient.unit,
      current_stock: ingredient.current_stock,
      minimum_stock: ingredient.minimum_stock,
      unit_cost: ingredient.unit_cost,
      supplier: ingredient.supplier?.id || '',
      location: ingredient.location || '',
      expiry_date: ingredient.expiry_date || '',
      is_active: ingredient.is_active
    });
    setShowAddIngredient(true);
  };

  // Update Ingredient
  const handleUpdateIngredient = async (e) => {
    e.preventDefault();

    // Validate expiry date
    if (ingredientFormData.expiry_date && new Date(ingredientFormData.expiry_date) < new Date()) {
      alert('Expiry date cannot be in the past. Please select a future date.');
      return;
    }

    // Validate numeric fields
    if (parseFloat(ingredientFormData.current_stock) < 0) {
      alert('Current stock cannot be negative.');
      return;
    }

    if (parseFloat(ingredientFormData.minimum_stock) < 0) {
      alert('Minimum stock cannot be negative.');
      return;
    }

    if (parseFloat(ingredientFormData.unit_cost) < 0) {
      alert('Unit cost cannot be negative.');
      return;
    }

    try {
      // Prepare the data for the API
      const ingredientData = {
        name: ingredientFormData.name,
        description: ingredientFormData.description || '',
        unit: ingredientFormData.unit,
        current_stock: parseFloat(ingredientFormData.current_stock) || 0,
        minimum_stock: parseFloat(ingredientFormData.minimum_stock) || 0,
        unit_cost: parseFloat(ingredientFormData.unit_cost) || 0,
        location: ingredientFormData.location || '',
        expiry_date: ingredientFormData.expiry_date || null,
        is_active: ingredientFormData.is_active
      };

      // Add supplier if selected
      if (ingredientFormData.supplier) {
        ingredientData.supplier = parseInt(ingredientFormData.supplier);
      }

      const response = await fetch(`http://localhost:8000/api/inventory/ingredients/${editingIngredient.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ingredientData)
      });

      if (response.ok) {
        const updatedIngredient = await response.json();
        // Process the updated ingredient to match the format expected by the component
        const processedIngredient = {
          ...updatedIngredient,
          is_low_stock: parseFloat(updatedIngredient.current_stock) <= parseFloat(updatedIngredient.minimum_stock)
        };
        setIngredients(prev => prev.map(ing => ing.id === editingIngredient.id ? processedIngredient : ing));
        setShowAddIngredient(false);
        setEditingIngredient(null);
        setIngredientFormData({
          name: '',
          description: '',
          unit: 'kg',
          current_stock: 0,
          minimum_stock: 0,
          unit_cost: 0,
          supplier: '',
          location: '',
          expiry_date: '',
          is_active: true
        });
        alert('Ingredient updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to update ingredient:', errorData);
        alert(`Failed to update ingredient: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error updating ingredient:', error);
      alert('Error updating ingredient');
    }
  };

  // Reorder Ingredient (Create Purchase Order)
  const handleReorderIngredient = (ingredient) => {
    // Set the ingredient in the purchase order form
    setPOFormData(prev => ({
      ...prev,
      items: [{
        ingredient: ingredient.id,
        quantity: Math.max(ingredient.minimum_stock - ingredient.current_stock, 1),
        unit_cost: ingredient.unit_cost,
        notes: `Reorder for ${ingredient.name}`
      }]
    }));
    setShowCreatePO(true);
  };

  // Supplier Management Functions
  const handleSupplierInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSupplierFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/inventory/suppliers/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierFormData)
      });

      if (response.ok) {
        const newSupplier = await response.json();
        setSuppliers(prev => [...prev, newSupplier]);
        setShowAddSupplier(false);
        setSupplierFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          is_active: true
        });
        alert('Supplier added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add supplier: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Error adding supplier');
    }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/api/inventory/suppliers/${editingSupplier.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierFormData)
      });

      if (response.ok) {
        const updatedSupplier = await response.json();
        setSuppliers(prev => prev.map(supplier =>
          supplier.id === editingSupplier.id ? updatedSupplier : supplier
        ));
        setEditingSupplier(null);
        setSupplierFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          is_active: true
        });
        alert('Supplier updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update supplier: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Error updating supplier');
    }
  };

  // Ingredient handling functions
  const handleIngredientInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIngredientFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();

    // If editing, use update function
    if (editingIngredient) {
      await handleUpdateIngredient(e);
      return;
    }

    // Validate expiry date
    if (ingredientFormData.expiry_date && new Date(ingredientFormData.expiry_date) < new Date()) {
      alert('Expiry date cannot be in the past. Please select a future date.');
      return;
    }

    // Validate numeric fields
    if (parseFloat(ingredientFormData.current_stock) < 0) {
      alert('Current stock cannot be negative.');
      return;
    }

    if (parseFloat(ingredientFormData.minimum_stock) < 0) {
      alert('Minimum stock cannot be negative.');
      return;
    }

    if (parseFloat(ingredientFormData.unit_cost) < 0) {
      alert('Unit cost cannot be negative.');
      return;
    }

    try {
      // Prepare the data for the API
      const ingredientData = {
        name: ingredientFormData.name,
        description: ingredientFormData.description || '',
        unit: ingredientFormData.unit,
        current_stock: parseFloat(ingredientFormData.current_stock) || 0,
        minimum_stock: parseFloat(ingredientFormData.minimum_stock) || 0,
        unit_cost: parseFloat(ingredientFormData.unit_cost) || 0,
        location: ingredientFormData.location || '',
        expiry_date: ingredientFormData.expiry_date || null,
        is_active: ingredientFormData.is_active
      };

      // Add supplier if selected
      if (ingredientFormData.supplier) {
        ingredientData.supplier = parseInt(ingredientFormData.supplier);
      }

      const response = await fetch('http://localhost:8000/api/inventory/ingredients/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ingredientData)
      });

      if (response.ok) {
        const newIngredient = await response.json();
        // Process the new ingredient to match the format expected by the component
        const processedIngredient = {
          ...newIngredient,
          is_low_stock: parseFloat(newIngredient.current_stock) <= parseFloat(newIngredient.minimum_stock)
        };
        setIngredients(prev => [...prev, processedIngredient]);
        setShowAddIngredient(false);
        setIngredientFormData({
          name: '',
          description: '',
          unit: 'kg',
          current_stock: 0,
          minimum_stock: 0,
          unit_cost: 0,
          supplier: '',
          location: '',
          expiry_date: '',
          is_active: true
        });
        alert('Ingredient added successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to add ingredient:', errorData);
        alert(`Failed to add ingredient: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('Error adding ingredient');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/inventory/suppliers/${supplierId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        alert('Supplier deleted successfully!');
      } else {
        alert('Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error deleting supplier');
    }
  };

  const openEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setShowAddSupplier(true);
  };

  const openViewSupplier = (supplier) => {
    setViewingSupplier(supplier);
  };

  const openViewIngredient = (ingredient) => {
    setViewingIngredient(ingredient);
  };

  const loadInventoryData = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('Loading inventory data...');

      // Load ingredients directly from the ingredients endpoint
      console.log('Loading ingredients from API...');
      const ingredientsResponse = await fetch('http://localhost:8000/api/inventory/ingredients/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Ingredients response status:', ingredientsResponse.status);

      if (ingredientsResponse.ok) {
        const ingredientsData = await ingredientsResponse.json();
        console.log('Ingredients data received:', ingredientsData);

        let ingredientsList = [];

        // Handle both direct array and paginated response
        if (Array.isArray(ingredientsData)) {
          ingredientsList = ingredientsData;
        } else if (ingredientsData.results && Array.isArray(ingredientsData.results)) {
          ingredientsList = ingredientsData.results;
        } else {
          console.warn('Ingredients data is not in expected format:', ingredientsData);
          ingredientsList = [];
        }

        // Process ingredients to add calculated fields
        const processedIngredients = ingredientsList.map(ingredient => ({
          ...ingredient,
          is_low_stock: parseFloat(ingredient.current_stock) <= parseFloat(ingredient.minimum_stock),
          total_value: (parseFloat(ingredient.current_stock) || 0) * (parseFloat(ingredient.unit_cost) || 0)
        }));

        console.log('Processed ingredients:', processedIngredients);
        setIngredients(processedIngredients);
      } else {
        const errorText = await ingredientsResponse.text();
        console.error('=== INGREDIENTS API ERROR ===');
        console.error('Status:', ingredientsResponse.status);
        console.error('Status Text:', ingredientsResponse.statusText);
        console.error('Response:', errorText);
        setError(`Failed to load ingredients: ${ingredientsResponse.status} - ${errorText}`);
      }

      // Load suppliers
      console.log('Loading suppliers from API...');
      const suppliersResponse = await fetch('http://localhost:8000/api/inventory/suppliers/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Suppliers response status:', suppliersResponse.status);

      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        console.log('Suppliers data received:', suppliersData);

        // Handle both direct array and paginated response
        if (Array.isArray(suppliersData)) {
          setSuppliers(suppliersData);
        } else if (suppliersData.results && Array.isArray(suppliersData.results)) {
          setSuppliers(suppliersData.results);
        } else {
          setSuppliers([]);
        }
      } else {
        const errorText = await suppliersResponse.text();
        console.error('Failed to load suppliers:', suppliersResponse.status, errorText);
      }

    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = (ingredients || []).filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || ingredient.is_low_stock;

    return matchesSearch && matchesLowStock;
  });

  const getStockStatusColor = (ingredient) => {
    if (ingredient.is_low_stock) return 'text-red-600 bg-red-100';
    if (ingredient.current_stock <= ingredient.minimum_stock * 1.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (ingredient) => {
    if (ingredient.is_low_stock) return 'Low Stock';
    if (ingredient.current_stock <= ingredient.minimum_stock * 1.5) return 'Medium Stock';
    return 'Well Stocked';
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `RS ${numAmount.toFixed(2)}`;
  };

  // Create Purchase Order Modal Component
  const CreatePurchaseOrderModal = ({ suppliers, ingredients, onClose, onCreate, loading, formData, setFormData }) => {
    console.log('CreatePurchaseOrderModal props:', {
      suppliers: suppliers?.length,
      ingredients: ingredients?.length,
      loading
    });

    const addItem = () => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ingredient: '', quantity: '', unit_cost: '' }]
      }));
    };

    const removeItem = (index) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    };

    const updateItem = (index, field, value) => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Validation
      if (!formData.supplier || !formData.order_date) {
        alert('Please fill in supplier and order date');
        return;
      }

      // Validate expected delivery date
      if (formData.expected_delivery && new Date(formData.expected_delivery) < new Date()) {
        alert('Expected delivery date cannot be in the past. Please select a future date.');
        return;
      }

      const validItems = formData.items.filter(item =>
        item.ingredient && item.quantity && item.unit_cost
      );

      if (validItems.length === 0) {
        alert('Please add at least one item');
        return;
      }

      const orderData = {
        supplier: parseInt(formData.supplier),
        order_date: formData.order_date,
        expected_delivery: formData.expected_delivery || null,
        notes: formData.notes,
        items: validItems.map(item => ({
          ingredient: parseInt(item.ingredient),
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        }))
      };

      await onCreate(orderData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Create Purchase Order</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Date *</label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
                <input
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-lg px-3 py-2 ${formData.expected_delivery && new Date(formData.expected_delivery) < new Date()
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                />
                {formData.expected_delivery && new Date(formData.expected_delivery) < new Date() && (
                  <p className="text-red-500 text-xs mt-1">Expected delivery date cannot be in the past</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows="3"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Item
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
                    <select
                      value={item.ingredient}
                      onChange={(e) => updateItem(index, 'ingredient', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Ingredient ({ingredients.length} available)</option>
                      {ingredients.map(ingredient => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} - {ingredient.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div className="flex items-end">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  (formData.expected_delivery && new Date(formData.expected_delivery) < new Date())
                }
                className={`px-6 py-2 rounded-lg ${loading ||
                  (formData.expected_delivery && new Date(formData.expected_delivery) < new Date())
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {loading ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // View Purchase Order Modal Component
  const ViewPurchaseOrderModal = ({ purchaseOrder, onClose, onUpdateStatus }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Purchase Order #{purchaseOrder.po_number}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Order Details</h3>
              <div className="space-y-2">
                <p><strong>Supplier:</strong> {purchaseOrder.supplier?.name}</p>
                <p><strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${purchaseOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    purchaseOrder.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      purchaseOrder.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                        purchaseOrder.status === 'received' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                    }`}>
                    {purchaseOrder.status.charAt(0).toUpperCase() + purchaseOrder.status.slice(1)}
                  </span>
                </p>
                <p><strong>Order Date:</strong> {new Date(purchaseOrder.order_date).toLocaleDateString()}</p>
                {purchaseOrder.expected_delivery && (
                  <p><strong>Expected Delivery:</strong> {new Date(purchaseOrder.expected_delivery).toLocaleDateString()}</p>
                )}
                {purchaseOrder.delivery_date && (
                  <p><strong>Delivery Date:</strong> {new Date(purchaseOrder.delivery_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Totals</h3>
              <div className="space-y-2">
                <p><strong>Subtotal:</strong> {formatCurrency(purchaseOrder.subtotal || 0)}</p>
                <p><strong>Tax:</strong> {formatCurrency(purchaseOrder.tax || 0)}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(purchaseOrder.total_amount || 0)}</p>
              </div>
            </div>
          </div>

          {purchaseOrder.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Notes</h3>
              <p className="text-gray-700">{purchaseOrder.notes}</p>
            </div>
          )}

          {purchaseOrder.items && purchaseOrder.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.ingredient?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.received_quantity || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            {purchaseOrder.status === 'draft' && (
              <button
                onClick={() => {
                  onUpdateStatus(purchaseOrder.id, 'sent');
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Send to Supplier
              </button>
            )}
            {purchaseOrder.status === 'confirmed' && (
              <button
                onClick={() => {
                  onUpdateStatus(purchaseOrder.id, 'received');
                  onClose();
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Mark as Received
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete Purchase Order ${purchaseOrder.po_number}? This action cannot be undone.`)) {
                  deletePurchaseOrder(purchaseOrder.id, purchaseOrder.po_number);
                  onClose();
                }
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while checking authentication
  if (loading || !isAuthenticated || !user || (user.user_type !== 'admin' && user.user_type !== 'inventory_manager')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Inventory</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                loadInventoryData();
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
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage ingredients, track stock levels, and monitor suppliers</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setLoading(true);
                  loadInventoryData();
                }}
                disabled={loading}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh Data
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
              { id: 'overview', name: 'Overview', icon: CubeIcon },
              { id: 'ingredients', name: 'Ingredients', icon: CubeIcon },
              { id: 'suppliers', name: 'Suppliers', icon: CubeIcon },
              { id: 'purchase-orders', name: 'Purchase Orders', icon: CubeIcon },
              { id: 'reports', name: 'Reports', icon: CubeIcon },
              { id: 'others', name: 'Others', icon: CubeIcon }
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
                    <CubeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Ingredients</p>
                    <p className="text-2xl font-semibold text-gray-900">{(ingredients || []).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(ingredients || []).filter(i => i.is_low_stock).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency((ingredients || []).reduce((sum, i) => sum + (parseFloat(i.current_stock) || 0) * (parseFloat(i.unit_cost) || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(ingredients || []).filter(i => {
                        if (!i.expiry_date) return false;
                        const expiryDate = new Date(i.expiry_date);
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                        return expiryDate <= thirtyDaysFromNow;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
              </div>
              <div className="p-6">
                {(ingredients || []).filter(i => i.is_low_stock).length > 0 ? (
                  <div className="space-y-3">
                    {(ingredients || []).filter(i => i.is_low_stock).slice(0, 5).map((ingredient) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{ingredient.name}</p>
                            <p className="text-sm text-red-600">
                              Current: {ingredient.current_stock} {ingredient.unit} |
                              Minimum: {ingredient.minimum_stock} {ingredient.unit}
                            </p>
                          </div>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                          Reorder
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">All items are well stocked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showLowStock}
                      onChange={(e) => setShowLowStock(e.target.checked)}
                      className="mr-2"
                    />
                    Low Stock Only
                  </label>
                  <button
                    onClick={() => setShowAddIngredient(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Ingredient</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ingredients ({filteredIngredients.length})</h3>
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Total loaded: {ingredients.length} | Filtered: {filteredIngredients.length} |
                  Search: "{searchTerm}" | Low Stock Only: {showLowStock ? 'Yes' : 'No'}
                </div>
                {ingredients.length === 0 && (
                  <div className="text-sm text-red-600 mt-2">
                    No ingredients loaded from API. Check browser console for errors.
                    <br />
                    <span className="text-xs">
                      Token available: {localStorage.getItem('token') ? 'Yes' : 'No'} |
                      User type: {user?.user_type || 'Unknown'} |
                      Authenticated: {isAuthenticated ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingredient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredIngredients.map((ingredient) => (
                      <tr key={ingredient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                            <div className="text-sm text-gray-500">{ingredient.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ingredient.current_stock} {ingredient.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {ingredient.minimum_stock} {ingredient.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatCurrency(ingredient.unit_cost)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatCurrency((parseFloat(ingredient.current_stock) || 0) * (parseFloat(ingredient.unit_cost) || 0))}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(ingredient)}`}>
                            {getStockStatusText(ingredient)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openViewIngredient(ingredient)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditIngredient(ingredient)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleReorderIngredient(ingredient)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Reorder
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

        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            {/* Suppliers Header */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Suppliers ({suppliers.length})</h3>
                <button
                  onClick={() => setShowAddSupplier(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Supplier
                </button>
              </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(suppliers || []).map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supplier.contact_person || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supplier.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supplier.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openViewSupplier(supplier)}
                            className="text-green-600 hover:text-green-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
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

            {suppliers.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
                <p className="text-gray-600 mb-4">Add your first supplier to get started with inventory management</p>
                <button
                  onClick={() => setShowAddSupplier(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Supplier
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div className="space-y-6">
            {/* Purchase Orders Header */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Purchase Orders</h3>
                <button
                  onClick={() => {
                    setShowCreatePO(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Purchase Order
                </button>
              </div>

              {/* Purchase Orders List */}
              <div className="p-6">
                {poLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading purchase orders...</p>
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
                    <p className="text-gray-600 mb-4">Create your first purchase order to get started</p>
                    <button
                      onClick={() => {
                        setShowCreatePO(true);
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Purchase Order
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Supplier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseOrders.map((po) => (
                          <tr key={po.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {po.po_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {po.supplier?.name || 'Unknown Supplier'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${po.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                po.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  po.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                                    po.status === 'received' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                }`}>
                                {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(po.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(po.total_amount || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => setSelectedPO(po)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              {po.status === 'draft' && (
                                <button
                                  onClick={() => updatePOStatus(po.id, 'sent')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Send
                                </button>
                              )}
                              {po.status === 'confirmed' && (
                                <button
                                  onClick={() => updatePOStatus(po.id, 'received')}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  Mark Received
                                </button>
                              )}
                              <button
                                onClick={() => deletePurchaseOrder(po.id, po.po_number)}
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
                )}
              </div>
            </div>

            {/* Create Purchase Order Modal */}
            {showCreatePO && (
              <CreatePurchaseOrderModal
                suppliers={suppliers}
                ingredients={ingredients}
                onClose={() => setShowCreatePO(false)}
                onCreate={createPurchaseOrder}
                loading={poLoading}
                formData={poFormData}
                setFormData={setPOFormData}
              />
            )}

            {/* View Purchase Order Modal */}
            {selectedPO && (
              <ViewPurchaseOrderModal
                purchaseOrder={selectedPO}
                onClose={() => setSelectedPO(null)}
                onUpdateStatus={updatePOStatus}
              />
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={reportDateRange.start_date}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={reportDateRange.end_date}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Reports Grid */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Inventory Reports</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <ChartBarIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Stock Movement Report</h4>
                    <p className="text-gray-600 mb-4">Track ingredient movements and usage patterns</p>
                    <button
                      onClick={generateStockMovementReport}
                      disabled={reportLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {reportLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                  <div className="text-center p-6 border border-gray-200 rounded-lg">
                    <CurrencyDollarIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Cost Analysis Report</h4>
                    <p className="text-gray-600 mb-4">Analyze ingredient costs and profitability</p>
                    <button
                      onClick={generateCostAnalysisReport}
                      disabled={reportLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {reportLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'others' && (
          <div className="space-y-6">
            {/* Visual Consumption Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">📊 Visual Ingredient Consumption Graph</h3>
                  <p className="text-green-100">See what ingredients are used the most with interactive charts</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">📈</div>
                  <div className="text-sm text-green-100">Usage Analytics</div>
                </div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">Ingredient Usage Analysis</h4>
                <div className="flex space-x-2">
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'month', label: 'This Month' }
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() => setSelectedPeriod(period.key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === period.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading State */}
              {consumptionLoading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Donut Chart Visualization */}
              {!consumptionLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Donut Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Usage Distribution</h5>
                    <div className="relative w-64 h-64 mx-auto">
                      {/* Donut Chart SVG */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {consumptionData.ingredients.map((ingredient, index) => {
                          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
                          const color = colors[index % colors.length];
                          const circumference = 2 * Math.PI * 40; // radius = 40
                          const strokeDasharray = (ingredient.percentage / 100) * circumference;
                          const previousSum = consumptionData.ingredients.slice(0, index).reduce((sum, i) => sum + (i.percentage / 100) * circumference, 0);
                          const strokeDashoffset = -previousSum;

                          return (
                            <circle
                              key={ingredient.name}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={color}
                              strokeWidth="8"
                              strokeDasharray={`${strokeDasharray} ${circumference}`}
                              strokeDashoffset={strokeDashoffset}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {consumptionData.summary.total_consumption.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Total Consumed</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend & Details */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">Ingredient Breakdown</h5>

                    {consumptionData.ingredients.map((ingredient, index) => {
                      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
                      const color = colors[index % colors.length];
                      const bgColor = color.replace('#', 'bg-').replace(/([A-F0-9]{2})/g, (match, hex) => {
                        const colorMap = {
                          '3B82F6': 'blue-500',
                          '10B981': 'green-500',
                          '8B5CF6': 'purple-500',
                          'F59E0B': 'yellow-500',
                          'EF4444': 'red-500',
                          '06B6D4': 'cyan-500',
                          '84CC16': 'lime-500',
                          'F97316': 'orange-500',
                          'EC4899': 'pink-500',
                          '6366F1': 'indigo-500'
                        };
                        return colorMap[hex] || 'gray-500';
                      });

                      const trendColor = ingredient.trend > 0 ? 'text-green-600' : ingredient.trend < 0 ? 'text-red-600' : 'text-gray-500';
                      const trendIcon = ingredient.trend > 0 ? '▲' : ingredient.trend < 0 ? '▼' : '→';
                      const trendText = ingredient.trend !== 0 ? `${Math.abs(ingredient.trend).toFixed(1)}% this ${selectedPeriod}` : 'No change';

                      return (
                        <div key={ingredient.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3`} style={{ backgroundColor: color }}></div>
                            <span className="font-medium text-gray-900">{ingredient.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold" style={{ color: color }}>{ingredient.percentage}%</div>
                            <div className={`text-sm flex items-center ${trendColor}`}>
                              <span className="mr-1">{trendIcon}</span>
                              {trendText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart */}
            {!consumptionLoading && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-6">
                  {selectedPeriod === 'today' ? 'Today\'s' : selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Usage Comparison
                </h4>
                <div className="space-y-4">
                  {consumptionData.ingredients.map((ingredient, index) => {
                    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
                    const color = colors[index % colors.length];
                    const maxConsumption = Math.max(...consumptionData.ingredients.map(i => i.consumed));
                    const barWidth = (ingredient.consumed / maxConsumption) * 100;

                    return (
                      <div key={ingredient.name} className="flex items-center">
                        <div className="w-24 text-sm font-medium text-gray-700 truncate">{ingredient.name}</div>
                        <div className="flex-1 mx-4">
                          <div className="bg-gray-200 rounded-full h-6">
                            <div
                              className="h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${barWidth}%`, backgroundColor: color }}
                            >
                              <span className="text-white text-xs font-medium">{ingredient.percentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-gray-600">{ingredient.consumed.toFixed(1)}{ingredient.unit}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wastage & Unused Stock */}
            {!consumptionLoading && (
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-6">⚠️ Wastage & Unused Stock</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-700">High Wastage Items</h5>
                    {consumptionData.wastage.length > 0 ? (
                      consumptionData.wastage.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="text-red-600 font-medium">{item.percentage}% wasted</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">No wastage data available</div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-700">Low Usage Items</h5>
                    {consumptionData.low_usage.length > 0 ? (
                      consumptionData.low_usage.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="text-orange-600 font-medium">{item.percentage}% usage</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">No low usage data available</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Supplier</h2>
              <button onClick={() => setShowAddSupplier(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={supplierFormData.name}
                    onChange={handleSupplierInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={supplierFormData.contact_person}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={supplierFormData.email}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={supplierFormData.phone}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={supplierFormData.address}
                    onChange={handleSupplierInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier address"
                  />
                </div>


                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={supplierFormData.is_active}
                    onChange={handleSupplierInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Active Supplier</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={supplierFormData.notes}
                    onChange={handleSupplierInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Supplier</h2>
              <button onClick={() => setEditingSupplier(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleEditSupplier} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={supplierFormData.name}
                    onChange={handleSupplierInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={supplierFormData.contact_person}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={supplierFormData.email}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={supplierFormData.phone}
                    onChange={handleSupplierInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={supplierFormData.address}
                    onChange={handleSupplierInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier address"
                  />
                </div>


                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={supplierFormData.is_active}
                    onChange={handleSupplierInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Active Supplier</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={supplierFormData.notes}
                    onChange={handleSupplierInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h2>
              <button
                onClick={() => {
                  setShowAddIngredient(false);
                  setEditingIngredient(null);
                  setIngredientFormData({
                    name: '',
                    description: '',
                    unit: 'kg',
                    current_stock: 0,
                    minimum_stock: 0,
                    unit_cost: 0,
                    supplier: '',
                    location: '',
                    expiry_date: '',
                    is_active: true
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIngredient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredient Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={ingredientFormData.name}
                    onChange={handleIngredientInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ingredient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <select
                    name="unit"
                    value={ingredientFormData.unit}
                    onChange={handleIngredientInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces</option>
                    <option value="boxes">Boxes</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock *</label>
                  <input
                    type="number"
                    name="current_stock"
                    value={ingredientFormData.current_stock}
                    onChange={handleIngredientInputChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${parseFloat(ingredientFormData.current_stock) < 0
                      ? 'border-red-500'
                      : 'border-gray-300'
                      }`}
                    placeholder="0.00"
                  />
                  {parseFloat(ingredientFormData.current_stock) < 0 && (
                    <p className="text-red-500 text-xs mt-1">Current stock cannot be negative</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock *</label>
                  <input
                    type="number"
                    name="minimum_stock"
                    value={ingredientFormData.minimum_stock}
                    onChange={handleIngredientInputChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${parseFloat(ingredientFormData.minimum_stock) < 0
                      ? 'border-red-500'
                      : 'border-gray-300'
                      }`}
                    placeholder="0.00"
                  />
                  {parseFloat(ingredientFormData.minimum_stock) < 0 && (
                    <p className="text-red-500 text-xs mt-1">Minimum stock cannot be negative</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost *</label>
                  <input
                    type="number"
                    name="unit_cost"
                    value={ingredientFormData.unit_cost}
                    onChange={handleIngredientInputChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${parseFloat(ingredientFormData.unit_cost) < 0
                      ? 'border-red-500'
                      : 'border-gray-300'
                      }`}
                    placeholder="0.00"
                  />
                  {parseFloat(ingredientFormData.unit_cost) < 0 && (
                    <p className="text-red-500 text-xs mt-1">Unit cost cannot be negative</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    name="supplier"
                    value={ingredientFormData.supplier}
                    onChange={handleIngredientInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={ingredientFormData.location}
                    onChange={handleIngredientInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Storage location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={ingredientFormData.expiry_date}
                    onChange={handleIngredientInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {ingredientFormData.expiry_date && new Date(ingredientFormData.expiry_date) < new Date() && (
                    <p className="text-red-500 text-xs mt-1">Expiry date cannot be in the past</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={ingredientFormData.description}
                    onChange={handleIngredientInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ingredient description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={ingredientFormData.is_active}
                    onChange={handleIngredientInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Active Ingredient</label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddIngredient(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    parseFloat(ingredientFormData.current_stock) < 0 ||
                    parseFloat(ingredientFormData.minimum_stock) < 0 ||
                    parseFloat(ingredientFormData.unit_cost) < 0 ||
                    (ingredientFormData.expiry_date && new Date(ingredientFormData.expiry_date) < new Date())
                  }
                  className={`px-6 py-2 rounded-lg ${parseFloat(ingredientFormData.current_stock) < 0 ||
                    parseFloat(ingredientFormData.minimum_stock) < 0 ||
                    parseFloat(ingredientFormData.unit_cost) < 0 ||
                    (ingredientFormData.expiry_date && new Date(ingredientFormData.expiry_date) < new Date())
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Supplier Details</h2>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Supplier Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingSupplier.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingSupplier.contact_person || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingSupplier.email || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingSupplier.phone || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingSupplier.website ? (
                      <a
                        href={viewingSupplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {viewingSupplier.website}
                      </a>
                    ) : 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="px-3 py-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${viewingSupplier.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {viewingSupplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[80px]">
                  {viewingSupplier.address || 'Not specified'}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[80px]">
                  {viewingSupplier.notes || 'No notes available'}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {new Date(viewingSupplier.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Associated Ingredients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Associated Ingredients</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {ingredients.filter(ingredient => ingredient.supplier?.id === viewingSupplier.id).length > 0 ? (
                    <div className="space-y-2">
                      {ingredients
                        .filter(ingredient => ingredient.supplier?.id === viewingSupplier.id)
                        .map(ingredient => (
                          <div key={ingredient.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm font-medium">{ingredient.name}</span>
                            <span className="text-sm text-gray-600">
                              {ingredient.current_stock} {ingredient.unit}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">No ingredients associated with this supplier</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => {
                  setViewingSupplier(null);
                  openEditSupplier(viewingSupplier);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Supplier
              </button>
              <button
                onClick={() => setViewingSupplier(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ingredient Modal */}
      {viewingIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Ingredient Details</h2>
              <button
                onClick={() => setViewingIngredient(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Ingredient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredient Name</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.unit}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.current_stock} {viewingIngredient.unit}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.minimum_stock} {viewingIngredient.unit}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency(viewingIngredient.unit_cost)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Value</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {formatCurrency((parseFloat(viewingIngredient.current_stock) || 0) * (parseFloat(viewingIngredient.unit_cost) || 0))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.supplier?.name || 'No supplier assigned'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.location || 'Not specified'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {viewingIngredient.expiry_date ? new Date(viewingIngredient.expiry_date).toLocaleDateString() : 'No expiry date'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="px-3 py-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${viewingIngredient.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {viewingIngredient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <div className="px-3 py-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStockStatusColor(viewingIngredient)}`}>
                    {getStockStatusText(viewingIngredient)}
                  </span>
                  {viewingIngredient.is_low_stock && (
                    <p className="text-red-600 text-sm mt-2">
                      ⚠️ This ingredient is running low on stock
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[80px]">
                  {viewingIngredient.description || 'No description available'}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {new Date(viewingIngredient.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Stock Movement Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Movement Summary</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Current Stock:</span> {viewingIngredient.current_stock} {viewingIngredient.unit}
                    </div>
                    <div>
                      <span className="font-medium">Minimum Required:</span> {viewingIngredient.minimum_stock} {viewingIngredient.unit}
                    </div>
                    <div>
                      <span className="font-medium">Stock Difference:</span>
                      <span className={`ml-1 ${(parseFloat(viewingIngredient.current_stock) || 0) - (parseFloat(viewingIngredient.minimum_stock) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(parseFloat(viewingIngredient.current_stock) || 0) - (parseFloat(viewingIngredient.minimum_stock) || 0)} {viewingIngredient.unit}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Total Value:</span> {formatCurrency((parseFloat(viewingIngredient.current_stock) || 0) * (parseFloat(viewingIngredient.unit_cost) || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => {
                  setViewingIngredient(null);
                  handleEditIngredient(viewingIngredient);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Ingredient
              </button>
              <button
                onClick={() => {
                  setViewingIngredient(null);
                  handleReorderIngredient(viewingIngredient);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Reorder
              </button>
              <button
                onClick={() => setViewingIngredient(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && currentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {currentReport.type === 'stock_movement' ? 'Stock Movement Report' : 'Cost Analysis Report'}
              </h2>
              <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {currentReport.type === 'stock_movement' && (
              <div className="space-y-6">
                {/* Period */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Report Period</h3>
                  <p>
                    {new Date(currentReport.data.period.start_date).toLocaleDateString()} - {new Date(currentReport.data.period.end_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Total Movements</h4>
                    <p className="text-2xl font-bold text-blue-600">{currentReport.data.summary.total_movements}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Total Quantity</h4>
                    <p className="text-2xl font-bold text-green-600">{currentReport.data.summary.total_quantity}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Total Value</h4>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentReport.data.summary.total_value)}</p>
                  </div>
                </div>

                {/* Movement by Type */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Movement by Type</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.movement_by_type.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.movement_type.charAt(0).toUpperCase() + item.movement_type.slice(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Movement by Ingredient */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Movement by Ingredient</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.movement_by_ingredient.slice(0, 10).map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.ingredient__name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentReport.type === 'cost_analysis' && (
              <div className="space-y-6">
                {/* Period */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Report Period</h3>
                  <p>
                    {new Date(currentReport.data.period.start_date).toLocaleDateString()} - {new Date(currentReport.data.period.end_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Total Inventory Value</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentReport.data.summary.total_inventory_value)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Total Movement Value</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(currentReport.data.summary.total_movement_value)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Total Ingredients</h4>
                    <p className="text-2xl font-bold text-purple-600">{currentReport.data.summary.total_ingredients}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900">Low Stock Items</h4>
                    <p className="text-2xl font-bold text-red-600">{currentReport.data.summary.low_stock_count}</p>
                  </div>
                </div>

                {/* Cost by Supplier */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Cost by Supplier</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.cost_by_supplier.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.supplier__name || 'No Supplier'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total_value)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.avg_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Most Expensive Ingredients */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Most Expensive Ingredients</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentReport.data.expensive_ingredients.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unit_cost)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current_stock} {item.unit}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
