import {
    CakeIcon,
    FireIcon,
    GiftIcon,
    HeartIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AnimatedWelcomeScreen = ({ onClose }) => {
    const { token } = useAuth();
    const [welcomeData, setWelcomeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWelcomeData();
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchWelcomeData = async () => {
        try {
            console.log('Fetching welcome data with token:', token ? 'present' : 'missing');
            const response = await fetch('http://localhost:8000/api/orders/orders/welcome_data/', {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Welcome data response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Welcome data received:', data);
            setWelcomeData(data);
        } catch (error) {
            console.error('Error fetching welcome data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Floating cake animations
    const floatingCakes = [
        { emoji: '🍰', delay: 0, duration: 3 },
        { emoji: '🧁', delay: 0.5, duration: 3.5 },
        { emoji: '🎂', delay: 1, duration: 4 },
        { emoji: '🍪', delay: 1.5, duration: 3.2 },
        { emoji: '🍓', delay: 2, duration: 3.8 },
        { emoji: '🍭', delay: 2.5, duration: 3.6 },
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.8,
                staggerChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        },
        exit: {
            y: -50,
            opacity: 0,
            transition: {
                duration: 0.4,
                ease: "easeIn"
            }
        }
    };

    const floatingVariants = {
        float: {
            y: [-10, 10, -10],
            rotate: [-5, 5, -5],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const sparkleVariants = {
        sparkle: {
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center z-50">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto mb-4"
                    >
                        <CakeIcon className="w-full h-full text-pink-500" />
                    </motion.div>
                    <p className="text-xl font-semibold text-gray-700">Loading your sweet welcome...</p>
                </motion.div>
            </div>
        );
    }

    if (!welcomeData) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center z-50">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto mb-4"
                    >
                        <CakeIcon className="w-full h-full text-pink-500" />
                    </motion.div>
                    <p className="text-xl font-semibold text-gray-700">Loading your sweet welcome...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center z-50 overflow-hidden"
            >
                {/* Floating Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {floatingCakes.map((cake, index) => (
                        <motion.div
                            key={index}
                            variants={floatingVariants}
                            animate="float"
                            className="absolute text-4xl opacity-20"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${cake.delay}s`,
                                animationDuration: `${cake.duration}s`
                            }}
                        >
                            {cake.emoji}
                        </motion.div>
                    ))}
                </div>

                {/* Sparkles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, index) => (
                        <motion.div
                            key={index}
                            variants={sparkleVariants}
                            animate="sparkle"
                            className="absolute text-yellow-400 text-lg opacity-60"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        >
                            ✨
                        </motion.div>
                    ))}
                </div>

                {/* Main Content */}
                <motion.div
                    variants={itemVariants}
                    className="relative z-10 text-center max-w-2xl mx-auto px-6"
                >
                    {/* Time-based Greeting */}
                    <motion.div
                        variants={itemVariants}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-3xl mr-2">{welcomeData.time_emoji}</span>
                            <h2 className="text-2xl font-bold text-gray-800">{welcomeData.time_message}</h2>
                        </div>
                    </motion.div>

                    {/* Main Greeting */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6"
                    >
                        {welcomeData.greeting}
                    </motion.h1>

                    {/* Personalized Content */}
                    <motion.div
                        variants={itemVariants}
                        className="space-y-4 mb-8"
                    >
                        {/* Favorite Cake */}
                        {welcomeData.favorite_cake && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                <div className="flex items-center justify-center mb-3">
                                    <HeartIcon className="w-6 h-6 text-red-500 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-800">Your Favorite</h3>
                                </div>
                                <p className="text-lg text-gray-700">
                                    <span className="font-medium text-pink-600">{welcomeData.favorite_cake.name}</span>
                                    {' '}is your go-to choice! 🍰
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Ordered {welcomeData.favorite_cake.order_count} times
                                </p>
                            </div>
                        )}

                        {/* Trending Cake */}
                        {welcomeData.trending_cake && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                <div className="flex items-center justify-center mb-3">
                                    <FireIcon className="w-6 h-6 text-orange-500 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-800">Trending Today</h3>
                                </div>
                                <p className="text-lg text-gray-700">
                                    <span className="font-medium text-orange-600">{welcomeData.trending_cake.name}</span>
                                    {' '}is trending right now! 🔥
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {welcomeData.trending_cake.order_count} orders in the last 30 days
                                </p>
                            </div>
                        )}

                        {/* Order Stats */}
                        {welcomeData.total_orders > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                                <div className="flex items-center justify-center mb-3">
                                    <StarIcon className="w-6 h-6 text-yellow-500 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-800">Your Sweet Journey</h3>
                                </div>
                                <p className="text-lg text-gray-700">
                                    You've enjoyed <span className="font-medium text-yellow-600">{welcomeData.total_orders}</span> delicious orders! ⭐
                                </p>
                                {welcomeData.last_order_date && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Last order: {new Date(welcomeData.last_order_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <GiftIcon className="w-5 h-5 inline mr-2" />
                            Start Shopping
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                        >
                            Explore Menu
                        </motion.button>
                    </motion.div>

                    {/* Close Button */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <span className="text-gray-600 text-xl">×</span>
                    </motion.button>
                </motion.div>

                {/* Animated Border */}
                <motion.div
                    className="absolute inset-4 border-2 border-white/30 rounded-3xl"
                    animate={{
                        borderColor: [
                            'rgba(255, 255, 255, 0.3)',
                            'rgba(255, 182, 193, 0.5)',
                            'rgba(221, 160, 221, 0.5)',
                            'rgba(255, 255, 255, 0.3)'
                        ]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimatedWelcomeScreen;
