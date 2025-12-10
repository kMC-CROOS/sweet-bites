import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowTrendingUpIcon,
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    HeartIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const OthersPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Enhanced Header */}
            <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                            >
                                <ArrowLeftIcon className="h-6 w-6" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                    <SparklesIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Analytics Hub
                                    </h1>
                                    <p className="text-sm text-gray-600 font-medium">Advanced tools for business insights</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4" />
                            <span>Last updated: Just now</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Discover Your Business Potential
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Unlock powerful insights with our comprehensive analytics tools designed to help you make data-driven decisions.
                    </p>
                </div>

                {/* Enhanced Action Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Best-Selling Items & Profit Analyzer Card */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <button
                            onClick={() => navigate('/admin/others/analytics')}
                            className="relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                        >
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <ChartBarIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                    Sales Analytics
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    Analyze sales performance, profit margins, and identify top-performing products
                                </p>
                                <div className="flex items-center justify-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                                    <span>Explore Analytics</span>
                                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Seasonal Trend Calendar Card */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <button
                            onClick={() => navigate('/admin/others/seasonal-calendar')}
                            className="relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                        >
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <CalendarIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                                    Seasonal Trends
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    Track seasonal sales patterns, plan promotions, and optimize inventory
                                </p>
                                <div className="flex items-center justify-center text-green-600 text-sm font-medium group-hover:text-green-700">
                                    <span>View Calendar</span>
                                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Loyalty Insights Card */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <button
                            onClick={() => navigate('/admin/others/loyalty-insights')}
                            className="relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                        >
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <HeartIcon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                                    Customer Loyalty
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    Analyze customer retention, loyalty patterns, and engagement metrics
                                </p>
                                <div className="flex items-center justify-center text-pink-600 text-sm font-medium group-hover:text-pink-700">
                                    <span>View Insights</span>
                                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Section */}
                <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-blue-900">+15%</div>
                            <div className="text-sm text-blue-700">Sales Growth</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                            <HeartIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-green-900">85%</div>
                            <div className="text-sm text-green-700">Customer Retention</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                            <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-purple-900">12</div>
                            <div className="text-sm text-purple-700">Active Campaigns</div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        All analytics are updated in real-time • Last sync: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OthersPage;