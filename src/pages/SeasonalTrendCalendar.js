import {
    ArrowLeftIcon,
    ArrowTrendingUpIcon,
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    FireIcon,
    GiftIcon,
    SparklesIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SeasonalTrendCalendar = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based month
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [seasonalData, setSeasonalData] = useState({
        summary: {
            total_sales: 0,
            total_orders: 0,
            avg_order_value: 0,
            growth_rate: 0,
            key_events_count: 0
        },
        daily_sales: [],
        key_events: [],
        yearly_summary: {
            total_sales: 0,
            total_orders: 0,
            monthly_breakdown: {}
        }
    });
    const [yearlyData, setYearlyData] = useState([]);
    const [error, setError] = useState('');

    // API functions
    const fetchSeasonalData = async (year, month) => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`http://localhost:8000/api/orders/orders/seasonal_analysis/?year=${year}&month=${month}`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            setSeasonalData(data);
        } catch (err) {
            setError('Failed to load seasonal data: ' + err.message);
            console.error('Error fetching seasonal data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchYearlyData = async (year) => {
        try {
            const response = await fetch(`http://localhost:8000/api/orders/orders/yearly_seasonal_summary/?year=${year}`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            setYearlyData(data.monthly_data || []);
        } catch (err) {
            console.error('Error fetching yearly data:', err);
        }
    };

    // Load data on component mount and when month/year changes
    useEffect(() => {
        if (token) {
            fetchSeasonalData(selectedYear, selectedMonth);
            fetchYearlyData(selectedYear);
        }
    }, [selectedMonth, selectedYear, token]);

    // Seasonal trends data (fallback)
    const seasonalTrends = {
        0: { // January
            name: "January",
            trends: [
                { date: "1", event: "New Year", sales: "High", products: "Celebration cakes", color: "bg-blue-500" },
                { date: "14", event: "Valentine Prep", sales: "Medium", products: "Heart-shaped cakes", color: "bg-pink-500" }
            ],
            totalSales: 1250,
            growth: "+15%"
        },
        1: { // February
            name: "February",
            trends: [
                { date: "14", event: "Valentine's Day", sales: "Peak", products: "Romantic cakes, cupcakes", color: "bg-red-500" },
                { date: "28", event: "Leap Year", sales: "Low", products: "Special occasion cakes", color: "bg-purple-500" }
            ],
            totalSales: 2100,
            growth: "+45%"
        },
        2: { // March
            name: "March",
            trends: [
                { date: "8", event: "Women's Day", sales: "High", products: "Flower cakes", color: "bg-green-500" },
                { date: "17", event: "St. Patrick's", sales: "Medium", products: "Green-themed cakes", color: "bg-emerald-500" }
            ],
            totalSales: 1800,
            growth: "+25%"
        },
        3: { // April
            name: "April",
            trends: [
                { date: "1", event: "April Fools", sales: "Low", products: "Funny cakes", color: "bg-yellow-500" },
                { date: "22", event: "Earth Day", sales: "Medium", products: "Eco-friendly cakes", color: "bg-green-600" }
            ],
            totalSales: 1450,
            growth: "+8%"
        },
        4: { // May
            name: "May",
            trends: [
                { date: "12", event: "Mother's Day", sales: "Peak", products: "Mother's Day cakes", color: "bg-pink-600" },
                { date: "31", event: "End of Spring", sales: "Medium", products: "Seasonal cakes", color: "bg-blue-400" }
            ],
            totalSales: 2200,
            growth: "+35%"
        },
        5: { // June
            name: "June",
            trends: [
                { date: "21", event: "Father's Day", sales: "High", products: "Father's Day cakes", color: "bg-blue-600" },
                { date: "21", event: "Summer Solstice", sales: "Medium", products: "Summer cakes", color: "bg-orange-500" }
            ],
            totalSales: 1950,
            growth: "+28%"
        },
        6: { // July
            name: "July",
            trends: [
                { date: "4", event: "Independence Day", sales: "High", products: "Patriotic cakes", color: "bg-red-600" },
                { date: "15", event: "Mid-Summer", sales: "Medium", products: "Ice cream cakes", color: "bg-cyan-500" }
            ],
            totalSales: 1750,
            growth: "+20%"
        },
        7: { // August
            name: "August",
            trends: [
                { date: "15", event: "Independence Day", sales: "Peak", products: "National celebration cakes", color: "bg-orange-600" },
                { date: "30", event: "Back to School", sales: "Medium", products: "School celebration cakes", color: "bg-indigo-500" }
            ],
            totalSales: 2400,
            growth: "+40%"
        },
        8: { // September
            name: "September",
            trends: [
                { date: "5", event: "Teacher's Day", sales: "Medium", products: "Thank you cakes", color: "bg-purple-600" },
                { date: "21", event: "World Peace Day", sales: "Low", products: "Peace-themed cakes", color: "bg-blue-700" }
            ],
            totalSales: 1600,
            growth: "+12%"
        },
        9: { // October
            name: "October",
            trends: [
                { date: "31", event: "Halloween", sales: "High", products: "Spooky cakes", color: "bg-orange-700" },
                { date: "15", event: "Mid-Autumn", sales: "Medium", products: "Autumn cakes", color: "bg-amber-600" }
            ],
            totalSales: 1850,
            growth: "+22%"
        },
        10: { // November
            name: "November",
            trends: [
                { date: "24", event: "Thanksgiving", sales: "High", products: "Thanksgiving cakes", color: "bg-amber-700" },
                { date: "30", event: "Black Friday Prep", sales: "Medium", products: "Discount cakes", color: "bg-gray-600" }
            ],
            totalSales: 2000,
            growth: "+30%"
        },
        11: { // December
            name: "December",
            trends: [
                { date: "25", event: "Christmas", sales: "Peak", products: "Christmas cakes, fruit cakes", color: "bg-red-700" },
                { date: "31", event: "New Year's Eve", sales: "Peak", products: "Celebration cakes", color: "bg-gold-500" },
                { date: "15", event: "Holiday Season", sales: "High", products: "Holiday cakes", color: "bg-green-700" }
            ],
            totalSales: 3200,
            growth: "+55%"
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getSalesIcon = (sales) => {
        switch (sales) {
            case "Peak": return <FireIcon className="h-4 w-4 text-red-500" />;
            case "High": return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
            case "Medium": return <ChartBarIcon className="h-4 w-4 text-yellow-500" />;
            case "Low": return <ClockIcon className="h-4 w-4 text-gray-500" />;
            default: return <StarIcon className="h-4 w-4 text-blue-500" />;
        }
    };

    const getEventIcon = (event) => {
        if (event.includes("Valentine") || event.includes("Mother")) return <StarIcon className="h-4 w-4" />;
        if (event.includes("Christmas") || event.includes("Holiday")) return <GiftIcon className="h-4 w-4" />;
        if (event.includes("Birthday") || event.includes("Celebration")) return <SparklesIcon className="h-4 w-4" />;
        return <CalendarIcon className="h-4 w-4" />;
    };

    const handlePromotionPlan = (monthData) => {
        alert(`Planning promotion for ${monthData.name}!\n\nTarget: ${formatCurrency(monthData.totalSales || 0)}\nGrowth: ${monthData.growth || '+0%'}\n\nThis would open a promotion planning modal.`);
    };

    // Helper functions
    const getSalesColor = (salesLevel) => {
        const colorMap = {
            'low': 'bg-gray-500',
            'medium': 'bg-yellow-500',
            'high': 'bg-orange-500',
            'peak': 'bg-red-500'
        };
        return colorMap[salesLevel] || 'bg-blue-500';
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return 'Rs 0';
        }
        return `Rs ${amount.toLocaleString()}`;
    };

    // Get current month data from API or fallback
    const currentMonthData = {
        name: seasonalData.month_name || seasonalTrends[selectedMonth - 1]?.name || 'Unknown Month',
        trends: seasonalData.key_events?.map(event => ({
            date: event.day.toString(),
            event: `Peak Sales Day`,
            sales: event.is_peak ? 'Peak' : 'High',
            products: 'Various cakes',
            color: event.is_peak ? 'bg-red-500' : 'bg-orange-500'
        })) || [],
        totalSales: seasonalData.summary?.total_sales || 0,
        growth: `+${(seasonalData.summary?.growth_rate || 0).toFixed(0)}%`
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
                                <h1 className="text-2xl font-bold text-gray-900">Seasonal Trend Calendar</h1>
                                <p className="text-sm text-gray-600">Track seasonal sales patterns and plan promotions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                            <button
                                onClick={() => {
                                    fetchSeasonalData(selectedYear, selectedMonth);
                                    fetchYearlyData(selectedYear);
                                }}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                            >
                                <CalendarIcon className="h-5 w-5" />
                                <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Main Content */}
                {!loading && (
                    <div className="space-y-8">
                        {/* Month Selector */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Month</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {months.map((month, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedMonth(index + 1)}
                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${selectedMonth === (index + 1)
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {month}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Month Overview */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {currentMonthData.name} {selectedYear} Overview
                                </h3>
                                <button
                                    onClick={() => handlePromotionPlan(currentMonthData)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    <span>Plan Next Promotion</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Total Sales</p>
                                            <p className="text-2xl font-bold">{formatCurrency(currentMonthData.totalSales || 0)}</p>
                                        </div>
                                        <ChartBarIcon className="h-8 w-8 text-green-200" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Growth Rate</p>
                                            <p className="text-2xl font-bold">{currentMonthData.growth}</p>
                                        </div>
                                        <ArrowTrendingUpIcon className="h-8 w-8 text-blue-200" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-sm">Key Events</p>
                                            <p className="text-2xl font-bold">{currentMonthData.trends.length}</p>
                                        </div>
                                        <CalendarIcon className="h-8 w-8 text-purple-200" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Calendar */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Calendar - {currentMonthData.name}</h3>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2 mb-6">
                                {/* Calendar Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar Days */}
                                {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                                    const trend = currentMonthData.trends.find(t => parseInt(t.date) === day);
                                    const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

                                    return (
                                        <div
                                            key={day}
                                            className={`p-3 text-center text-sm rounded-lg border-2 transition-all ${trend
                                                ? `${trend.color} text-white font-semibold shadow-lg`
                                                : isToday
                                                    ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>{day}</span>
                                                {trend && getSalesIcon(trend.sales)}
                                            </div>
                                            {trend && (
                                                <div className="text-xs mt-1 opacity-90">
                                                    {trend.sales}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Seasonal Events */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Events & Trends</h3>
                            <div className="space-y-4">
                                {currentMonthData.trends.map((trend, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-lg text-white ${trend.color}`}>
                                                {getEventIcon(trend.event)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{trend.event}</h4>
                                                <p className="text-sm text-gray-600">Date: {trend.date} {currentMonthData.name}</p>
                                                <p className="text-sm text-gray-500">Products: {trend.products}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center space-x-1">
                                                {getSalesIcon(trend.sales)}
                                                <span className={`text-sm font-medium ${trend.sales === 'Peak' ? 'text-red-600' :
                                                    trend.sales === 'High' ? 'text-green-600' :
                                                        trend.sales === 'Medium' ? 'text-yellow-600' :
                                                            'text-gray-600'
                                                    }`}>
                                                    {trend.sales} Sales
                                                </span>
                                            </div>
                                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                                Plan Promotion
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Yearly Overview */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Yearly Sales Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {yearlyData.length > 0 ? yearlyData.map((monthData) => (
                                    <div
                                        key={monthData.month}
                                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${monthData.month === selectedMonth
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedMonth(monthData.month)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{monthData.month_name}</h4>
                                            <span className={`text-xs px-2 py-1 rounded ${(monthData.avg_growth_rate || 0) > 30
                                                ? 'bg-green-100 text-green-700'
                                                : (monthData.avg_growth_rate || 0) > 15
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                +{(monthData.avg_growth_rate || 0).toFixed(0)}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{formatCurrency(monthData.total_revenue || 0)}</p>
                                        <div className="flex items-center space-x-1">
                                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">{monthData.events_count || 0} events</span>
                                        </div>
                                    </div>
                                )) : Object.entries(seasonalTrends).map(([monthIndex, monthData]) => (
                                    <div
                                        key={monthIndex}
                                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${parseInt(monthIndex) + 1 === selectedMonth
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedMonth(parseInt(monthIndex) + 1)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{monthData.name}</h4>
                                            <span className={`text-xs px-2 py-1 rounded ${monthData.growth?.startsWith('+') && parseInt(monthData.growth) > 30
                                                ? 'bg-green-100 text-green-700'
                                                : monthData.growth?.startsWith('+') && parseInt(monthData.growth) > 15
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {monthData.growth || '+0%'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{formatCurrency(monthData.totalSales || 0)}</p>
                                        <div className="flex items-center space-x-1">
                                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">{monthData.trends?.length || 0} events</span>
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

export default SeasonalTrendCalendar;
