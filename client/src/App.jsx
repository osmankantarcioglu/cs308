import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Categories from "./components/Categories";
import FeaturedProducts from "./components/FeaturedProducts";
import DealsSection from "./components/DealsSection";
import Footer from "./components/Footer";
import BasketPage from "./pages/BasketPage";
import ProductsPage from "./pages/ProductsPage";

export default function App() {
  return (
    <CartProvider>
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
          <Route path="/basket" element={<BasketPage />} />
        </Routes>
        <Footer />
      </div>
    </CartProvider>
  );
}
