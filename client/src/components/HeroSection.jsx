import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000/products";

export default function HeroSection() {
  const [popularProduct, setPopularProduct] = useState(null);
  const [productRating, setProductRating] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularProduct = async () => {
      try {
        setLoading(true);
        // Fetch most popular product by view_count and popularity_score
        const response = await fetch(`${API_BASE_URL}?sortBy=popularity&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.products && data.data.products.length > 0) {
            const product = data.data.products[0];
            setPopularProduct(product);
            
            // Fetch rating information
            try {
              const reviewsResponse = await fetch(`${API_BASE_URL}/${product._id}/reviews`);
              if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                setProductRating({
                  averageRating: reviewsData.data?.averageRating || 0,
                  reviewCount: reviewsData.data?.reviewCount || 0
                });
              }
            } catch (error) {
              console.error("Error fetching product rating:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching popular product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProduct();
  }, []);

  const handleViewProduct = () => {
    if (popularProduct) {
      navigate(`/products/${popularProduct._id}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="inline-block">
              <span className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                🎉 Most Popular Product
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Premium Tech
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                At Your Fingertips
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl">
              Discover the latest smartphones, laptops, and gadgets from top brands. 
              Unbeatable prices, free shipping, and 2-year warranty on all products.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Shop Now
              </Link>
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-primary transition-colors"
              >
                View Deals
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">100K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Brands</div>
              </div>
            </div>
          </div>

          {/* Right Content - Featured Product */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            {loading ? (
              <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : popularProduct ? (
              <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-6">
                  {popularProduct.images && popularProduct.images.length > 0 ? (
                    <img
                      src={popularProduct.images[0]}
                      alt={popularProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{popularProduct.name}</h3>
                    <p className="text-gray-600">
                      {popularProduct.description ? 
                        (popularProduct.description.length > 60 
                          ? popularProduct.description.substring(0, 60) + "..." 
                          : popularProduct.description) 
                        : popularProduct.category?.name || "Premium product"}
                    </p>
                    {productRating.reviewCount > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          {productRating.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({productRating.reviewCount} {productRating.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-primary">
                      ${popularProduct.price ? popularProduct.price.toFixed(2) : "0.00"}
                    </span>
                    {popularProduct.view_count > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({popularProduct.view_count} views)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleViewProduct}
                    className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                  <p className="text-gray-500">No products available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
    </section>
  );
}
