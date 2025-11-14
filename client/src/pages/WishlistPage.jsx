import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();

  const handleRemove = async (e, productId, productName) => {
    e.stopPropagation(); // Prevent navigation when clicking remove
    if (window.confirm(`Remove ${productName} from wishlist?`)) {
      const result = await removeFromWishlist(productId);
      if (result.success) {
        // Success feedback handled by context
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-8">Please login to view your wishlist</p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding products you love!</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product_id;
              if (!product) return null;

              return (
                <div
                  key={item._id || product._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleProductClick(product._id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleProductClick(product._id);
                    }
                  }}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, product._id, product.name)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Product Image */}
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
                    {product.quantity === 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
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

                    {/* Click to view details badge */}
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
                        Click to view details
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back to Products */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

