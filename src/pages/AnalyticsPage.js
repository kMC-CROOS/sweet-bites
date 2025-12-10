import {
    ArrowLeftIcon,
    ArrowTrendingUpIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    FireIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [salesData, setSalesData] = useState({
        topCakes: [],
        lowPerformers: [],
        totalRevenue: 0,
        totalOrders: 0,
        averageProfitMargin: 0
    });
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, week, year

    useEffect(() => {
        loadSalesData();
    }, [selectedPeriod]);

    const loadSalesData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            console.log('🔑 Token from localStorage:', token);
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch top selling cakes from API
            const url = `/api/orders/orders/top_selling_cakes/?period=${selectedPeriod}&limit=5`;
            console.log('🌐 Making request to:', url);
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const apiData = await response.json();

            // Calculate totals from API data
            const totalRevenue = apiData.top_cakes.reduce((sum, cake) => sum + cake.revenue, 0);
            const totalOrders = apiData.top_cakes.reduce((sum, cake) => sum + cake.order_count, 0);
            const averageProfitMargin = apiData.top_cakes.length > 0
                ? apiData.top_cakes.reduce((sum, cake) => sum + cake.profit_margin, 0) / apiData.top_cakes.length
                : 0;

            // Get low performers (cakes with sales < 5 or no sales)
            const lowPerformers = apiData.top_cakes
                .filter(cake => cake.sales < 5)
                .map(cake => ({
                    ...cake,
                    daysSinceLastSale: Math.floor(Math.random() * 30) + 1 // Mock data for days since last sale
                }));

            const salesData = {
                topCakes: apiData.top_cakes,
                lowPerformers: lowPerformers,
                totalRevenue: totalRevenue,
                totalOrders: totalOrders,
                averageProfitMargin: averageProfitMargin
            };

            setSalesData(salesData);
        } catch (err) {
            setError('Failed to load sales data: ' + err.message);
            console.error('Error loading sales data:', err);

            // Fallback to mock data if API fails
            const mockData = {
                topCakes: [
                    { id: 1, name: 'Chocolate Delight', sales: 45, revenue: 2250, profitMargin: 35, image: '/media/cakes/chocolate.jpg' },
                    { id: 2, name: 'Vanilla Dream', sales: 38, revenue: 1900, profitMargin: 42, image: '/media/cakes/vanilla.jpg' },
                    { id: 3, name: 'Strawberry Shortcake', sales: 32, revenue: 1600, profitMargin: 38, image: '/media/cakes/strawberry.jpg' },
                    { id: 4, name: 'Red Velvet', sales: 28, revenue: 1400, profitMargin: 40, image: '/media/cakes/redvelvet.jpg' },
                    { id: 5, name: 'Carrot Cake', sales: 25, revenue: 1250, profitMargin: 33, image: '/media/cakes/carrot.jpg' }
                ],
                lowPerformers: [
                    { id: 6, name: 'Lemon Drizzle', sales: 2, revenue: 100, profitMargin: 25, daysSinceLastSale: 15, image: '/media/cakes/lemon.jpg' },
                    { id: 7, name: 'Coffee Cake', sales: 1, revenue: 50, profitMargin: 30, daysSinceLastSale: 22, image: '/media/cakes/coffee.jpg' },
                    { id: 8, name: 'Tiramisu', sales: 0, revenue: 0, profitMargin: 35, daysSinceLastSale: 30, image: '/media/cakes/tiramisu.jpg' }
                ],
                totalRevenue: 8500,
                totalOrders: 171,
                averageProfitMargin: 36.5
            };
            setSalesData(mockData);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = (cakeId) => {
        alert(`Promoting cake ID: ${cakeId}. This would open a promotion creation modal.`);
    };

    const formatCurrency = (amount) => {
        return `Rs ${amount.toLocaleString()}`;
    };

    const getMaxSales = () => {
        return Math.max(...salesData.topCakes.map(cake => cake.sales));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/admin/others')}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeftIcon className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Best-Selling Items & Profit Analyzer</h1>
                                <p className="text-sm text-gray-600">Analyze sales performance and profit margins</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <ChartBarIcon className="h-5 w-5" />
                                <span>Best-Selling Items & Profit Analyzer</span>
                            </button>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <p className="text-2xl font-semibold text-gray-900">{formatCurrency(salesData.totalRevenue)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-semibold text-gray-900">{salesData.totalOrders}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Avg Profit Margin</p>
                                        <p className="text-2xl font-semibold text-gray-900">{salesData.averageProfitMargin}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <FireIcon className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Top Performer</p>
                                        <p className="text-lg font-semibold text-gray-900">{salesData.topCakes[0]?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top 5 Cakes Bar Chart */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Top 5 Cakes This Month</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span>Sales Count</span>
                                    <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                                    <span>Profit %</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {salesData.topCakes.map((cake, index) => {
                                    const maxSales = getMaxSales();
                                    const barWidth = (cake.sales / maxSales) * 100;
                                    return (
                                        <div key={cake.id} className="flex items-center space-x-4">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">{cake.name}</h4>
                                                    <div className="flex items-center space-x-4 text-sm">
                                                        <span className="text-gray-600">{cake.sales} sales</span>
                                                        <span className="text-green-600 font-medium">{cake.profitMargin}% profit</span>
                                                        <span className="text-gray-900 font-medium">{formatCurrency(cake.revenue)}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                                        style={{ width: `${barWidth}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Low Performers Alert */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Low Performer Alerts</h3>
                            </div>
                            <div className="space-y-4">
                                {salesData.lowPerformers.map((cake) => (
                                    <div key={cake.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <EyeIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{cake.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {cake.sales} sales • {cake.daysSinceLastSale} days since last sale
                                                </p>
                                                <p className="text-sm text-gray-500">Profit margin: {cake.profitMargin}%</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePromote(cake.id)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                Promote
                                            </button>
                                            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
