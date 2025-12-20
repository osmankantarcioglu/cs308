import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

const API_BASE_URL = "http://localhost:3000/products";
const CATEGORIES_API_URL = "http://localhost:3000/categories";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(""); // "price_asc", "price_desc", "popularity"
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  // Update search term and category when URL changes (from Navbar)
  useEffect(() => {
    const urlSearchTerm = searchParams.get("q") || "";
    const urlCategory = searchParams.get("category") || "";
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
      setSearchInput(urlSearchTerm);
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);
  
  // Update URL when search term or category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm && searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, setSearchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${CATEGORIES_API_URL}?is_active=true&limit=1000`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.categories) {
            setCategories(data.data.categories);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      params.append('limit', '100'); // Increase limit to show more products
      
      const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.products) {
        // Backend handles sorting, so use products directly
        setProducts(data.data.products);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Trigger search only on Enter or search button click
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchInput !== searchTerm) {
      setSearchTerm(searchInput);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleSelectProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleWishlistToggle = async (e, productId, productName) => {
    e.stopPropagation(); // Prevent navigation to product detail
    
    if (!isAuthenticated) {
      alert('Please login to add items to your wishlist');
      navigate('/login');
      return;
    }

    if (isInWishlist(productId)) {
      const result = await removeFromWishlist(productId);
      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
    } else {
      const result = await addToWishlist(productId);
      if (result.success) {
        alert(`${productName} added to wishlist!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">Explore our complete product catalog</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-4 py-3 pl-12 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              onClick={handleSearchSubmit}
              className="absolute right-2 top-2.5 p-2 rounded-md text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
              }}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:w-64">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="">Sort by...</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        {/* Products Count */}
        {!loading && (
          <div className="mb-6 text-gray-600">
            {products.length > 0 ? (
              <>Showing <span className="font-semibold text-gray-900">{products.length}</span> product{products.length !== 1 ? 's' : ''}</>
            ) : (
              <>No products found{searchTerm || selectedCategory ? ' matching your criteria' : ''}</>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory 
                ? "Try adjusting your search or filter criteria." 
                : "There are no products in the database yet."}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchInput("");
                  setSelectedCategory("");
                  setSortBy("");
                }}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectProduct(product._id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectProduct(product._id);
                  }
                }}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg
                        className="w-20 h-20 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  {product.active_discount && product.active_discount.discount_rate > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-md">
                      {Math.round(product.active_discount.discount_rate)}% OFF
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleWishlistToggle(e, product._id, product.name)}
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition-all z-10"
                    title={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <svg 
                      className={`w-5 h-5 transition-colors ${
                        isInWishlist(product._id) ? "text-red-500" : "text-gray-700"
                      }`}
                      fill={isInWishlist(product._id) ? "currentColor" : "none"}
                      stroke="currentColor" 
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                  </button>
                  
                  {product.quantity === 0 && !product.active_discount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                      Out of Stock
                    </div>
                  )}
                  {product.quantity === 0 && product.active_discount && (
                    <div className="absolute top-12 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                      Out of Stock
                    </div>
                  )}
                  {product.view_count > 200 && (
                    <div className="absolute bottom-4 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="text-xs text-gray-500 mb-2">
                    {product.category?.name || "Uncategorized"}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Stats */}
                  {product.view_count > 0 && (
                    <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{Math.floor(product.view_count / 2)} views</span>
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price ? product.price.toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
                      Click to view details
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

