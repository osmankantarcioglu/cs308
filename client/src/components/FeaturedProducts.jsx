import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/products";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productRatings, setProductRatings] = useState({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch top products by popularity
        const response = await fetch(`${API_BASE_URL}?sortBy=popularity&limit=8`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.products) {
            const fetchedProducts = data.data.products;
            setProducts(fetchedProducts);
            
            // Fetch ratings for each product
            const ratingPromises = fetchedProducts.map(async (product) => {
              try {
                const reviewsResponse = await fetch(`${API_BASE_URL}/${product._id}/reviews`);
                if (reviewsResponse.ok) {
                  const reviewsData = await reviewsResponse.json();
                  return {
                    productId: product._id,
                    averageRating: reviewsData.data?.averageRating || 0,
                    reviewCount: reviewsData.data?.reviewCount || 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching reviews for product ${product._id}:`, error);
              }
              return { productId: product._id, averageRating: 0, reviewCount: 0 };
            });
            
            const ratings = await Promise.all(ratingPromises);
            const ratingsMap = {};
            ratings.forEach(r => {
              ratingsMap[r.productId] = { averageRating: r.averageRating, reviewCount: r.reviewCount };
            });
            setProductRatings(ratingsMap);
          }
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleWishlistToggle = async (e, productId, productName) => {
    e.stopPropagation();
    
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

  const getBadgeInfo = (product) => {
    if (product.view_count > 200) {
      return { text: "Popular", color: "bg-blue-500" };
    }
    if (product.quantity === 0) {
      return { text: "Out of Stock", color: "bg-red-500" };
    }
    const daysSinceCreation = product.createdAt ? (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 365;
    if (daysSinceCreation < 30) {
      return { text: "New", color: "bg-green-500" };
    }
    return null;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600">
              Check out our hand-picked selection of the best tech products
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:block text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            View All →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured products available at the moment.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product) => {
              const badgeInfo = getBadgeInfo(product);
              const ratings = productRatings[product._id] || { averageRating: 0, reviewCount: 0 };
              
              return (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer"
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
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {badgeInfo && (
                      <div className={`absolute top-4 left-4 ${badgeInfo.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {badgeInfo.text}
                      </div>
                    )}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product._id, product.name)}
                      className={`absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-opacity ${
                        isInWishlist(product._id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${isInWishlist(product._id) ? "text-red-500" : "text-gray-700"}`}
                        fill={isInWishlist(product._id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="text-xs text-gray-500 mb-2">
                      {product.category?.name || "Uncategorized"}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    {ratings.averageRating > 0 && (
                      <div className="flex items-center space-x-1 mb-3">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {ratings.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">({ratings.reviewCount})</span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price ? product.price.toFixed(2) : "0.00"}
                      </span>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product._id);
                      }}
                      className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-primary transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/products"
            className="text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
