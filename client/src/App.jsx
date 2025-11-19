import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Categories from "./components/Categories";
import FeaturedProducts from "./components/FeaturedProducts";
import DealsSection from "./components/DealsSection";
import Footer from "./components/Footer";
import BasketPage from "./pages/BasketPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import WishlistPage from "./pages/WishlistPage";
import ProfilePage from "./pages/ProfilePage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRoute from "./components/AdminRoute";
import ProductManagerRoute from "./components/ProductManagerRoute";
import SupportAgentRoute from "./components/SupportAgentRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductManagerLoginPage from "./pages/ProductManagerLoginPage";
import ProductManagerDashboard from "./pages/ProductManagerDashboard";
import SupportAgentLoginPage from "./pages/SupportAgentLoginPage";
import SupportAgentDashboard from "./pages/SupportAgentDashboard";
import CustomerChatWidget from "./components/CustomerChatWidget";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
          <Route
            path="/"
            element={
              <main>
                <HeroSection />
                <Categories />
                <FeaturedProducts />
                <DealsSection />
              </main>
            }
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/basket" element={<BasketPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/product-manager" element={<ProductManagerLoginPage />} />
          <Route path="/product-manager/dashboard" element={<ProductManagerRoute><ProductManagerDashboard /></ProductManagerRoute>} />
          <Route path="/support" element={<SupportAgentLoginPage />} />
          <Route path="/support/dashboard" element={<SupportAgentRoute><SupportAgentDashboard /></SupportAgentRoute>} />
            </Routes>
            <CustomerChatWidget />
            <Footer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
