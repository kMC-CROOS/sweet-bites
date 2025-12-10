import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import AnimatedWelcomeScreen from './components/AnimatedWelcomeScreen';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import useWelcomeScreen from './hooks/useWelcomeScreen';
import AddIngredientPage from './pages/AddIngredientPage';
import AdminCatalogPage from './pages/AdminCatalogPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminOffersPage from './pages/AdminOffersPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminPurchaseHistoryPage from './pages/AdminPurchaseHistoryPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthTestPage from './pages/AuthTestPage';
import CakeCustomization from './pages/CakeCustomization';
import CakeDetailPage from './pages/CakeDetailPage';
import CustomerDashboard from './pages/CustomerDashboard';
import FeedbackPage from './pages/FeedbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import InventoryDashboard from './pages/InventoryDashboard';
import LoginTestPage from './pages/LoginTestPage';
import LoyaltyInsightsPage from './pages/LoyaltyInsightsPage';
import MenuPage from './pages/MenuPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OthersPage from './pages/OthersPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordModalPage from './pages/ResetPasswordModalPage';
import SeasonalTrendCalendar from './pages/SeasonalTrendCalendar';
import ShippingAddressPage from './pages/ShippingAddressPage';
import ShoppingCart from './pages/ShoppingCart';
import TestResetPage from './pages/TestResetPage';

function AppContent() {
  const { showWelcome, closeWelcome } = useWelcomeScreen();

  console.log('AppContent - showWelcome:', showWelcome);

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navbar />
          {showWelcome && <AnimatedWelcomeScreen onClose={closeWelcome} />}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/customize" element={<CakeCustomization />} />
            <Route path="/customize/:cakeId" element={<CakeCustomization />} />
            <Route path="/cake/:cakeId" element={<CakeDetailPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/shipping-address" element={<ShippingAddressPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedAdminRoute>
                <AdminOrdersPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedAdminRoute>
                <AdminReportsPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/purchase-history" element={
              <ProtectedAdminRoute>
                <AdminPurchaseHistoryPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/catalog" element={
              <ProtectedAdminRoute>
                <AdminCatalogPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/offers" element={
              <ProtectedAdminRoute>
                <AdminOffersPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/inventory" element={
              <ProtectedAdminRoute>
                <InventoryDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedAdminRoute>
                <InventoryDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/inventory/add-ingredient" element={
              <ProtectedAdminRoute>
                <AddIngredientPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/customers" element={
              <ProtectedAdminRoute>
                <CustomerDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/others" element={
              <ProtectedAdminRoute>
                <OthersPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/others/analytics" element={
              <ProtectedAdminRoute>
                <AnalyticsPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/others/seasonal-calendar" element={
              <ProtectedAdminRoute>
                <SeasonalTrendCalendar />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/others/loyalty-insights" element={
              <ProtectedAdminRoute>
                <LoyaltyInsightsPage />
              </ProtectedAdminRoute>
            } />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordModalPage />} />
            <Route path="/test-reset" element={<TestResetPage />} />
            <Route path="/auth-test" element={<AuthTestPage />} />
            <Route path="/login-test" element={<LoginTestPage />} />
          </Routes>
          <Footer />

        </div>
      </Router>
    </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

