import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000/products";

export default function ProductComments() {
  const [products, setProducts] = useState([]);
  const [productComments, setProductComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsAndComments = async () => {
      try {
        setLoading(true);
        // Fetch products - we'll get products with IDs that might be B and C, or just get first 2-3 products
        const response = await fetch(`${API_BASE_URL}?limit=10`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.products) {
            const fetchedProducts = data.data.products;
            // Get the first 2 products (which we'll treat as products B and C)
            // Or you could filter by specific IDs if needed
            const productsToShow = fetchedProducts.slice(0, 2);
            setProducts(productsToShow);
            
            // Fetch comments/reviews for each product
            const commentPromises = productsToShow.map(async (product) => {
              try {
                const reviewsResponse = await fetch(`${API_BASE_URL}/${product._id}/reviews`);
                if (reviewsResponse.ok) {
                  const reviewsData = await reviewsResponse.json();
                  return {
                    productId: product._id,
                    reviews: reviewsData.data?.reviews || [],
                    averageRating: reviewsData.data?.averageRating || 0,
                    reviewCount: reviewsData.data?.reviewCount || 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching reviews for product ${product._id}:`, error);
              }
              return {
                productId: product._id,
                reviews: [],
                averageRating: 0,
                reviewCount: 0
              };
            });
            
            const comments = await Promise.all(commentPromises);
            const commentsMap = {};
            comments.forEach(c => {
              commentsMap[c.productId] = {
                reviews: c.reviews,
                averageRating: c.averageRating,
                reviewCount: c.reviewCount
              };
            });
            setProductComments(commentsMap);
          }
        }
      } catch (error) {
        console.error("Error fetching products and comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndComments();
  }, []);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= fullStars
                ? "text-yellow-400 fill-current"
                : star === fullStars + 1 && hasHalfStar
                ? "text-yellow-400 fill-current opacity-50"
                : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product comments...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Product Comments & Reviews
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read what customers are saying about our products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product) => {
              const comments = productComments[product._id] || {
                reviews: [],
                averageRating: 0,
                reviewCount: 0
              };
              
              return (
                <div
                  key={product._id}
                  className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-white p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.category?.name || "Uncategorized"}
                        </p>
                      </div>
                      <Link
                        to={`/products/${product._id}`}
                        className="text-primary hover:text-primary-dark font-semibold text-sm"
                      >
                        View Product →
                      </Link>
                    </div>

                    {comments.reviewCount > 0 && (
                      <div className="flex items-center space-x-4">
                        {renderStars(comments.averageRating)}
                        <span className="text-sm text-gray-600">
                          ({comments.reviewCount} {comments.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {comments.reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <svg
                          className="w-16 h-16 text-gray-300 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <p className="text-gray-600">No comments yet. Be the first to review!</p>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-96 overflow-y-auto">
                        {comments.reviews.map((review) => (
                          <div
                            key={review._id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-semibold text-gray-900">
                                    {review.customer_id?.first_name || "Anonymous"}{" "}
                                    {review.customer_id?.last_name || ""}
                                  </span>
                                  {review.rating && (
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-300"
                                          }`}
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {review.comment}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {formatDate(review.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <Link
                        to={`/products/${product._id}`}
                        className="block w-full text-center py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        View All Reviews & Add Comment
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

