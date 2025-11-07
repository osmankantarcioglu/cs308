import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

const API_BASE_URL = "http://localhost:3000/products";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState([]);
  const viewCountedRef = useRef(false);

  // Check if product is already in cart
  const isProductInCart = () => {
    if (!id) return false;
    
    return cartItems?.some((item) => {
      const productRef = item?.product_id;
      
      if (!productRef) return false;
      
      if (typeof productRef === "string") {
        return productRef === id;
      }
      
      if (typeof productRef === "object") {
        if (productRef._id) {
          return productRef._id.toString() === id;
        }
        
        if (typeof productRef.toString === "function") {
          return productRef.toString() === id;
        }
      }
      
      return false;
    });
  };

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Only increment view count on the first fetch (not on React StrictMode re-renders)
        const shouldIncrementView = !viewCountedRef.current;
        const url = shouldIncrementView 
          ? `${API_BASE_URL}/${id}?incrementView=true`
          : `${API_BASE_URL}/${id}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setProduct(data.data);
          // Mark that we've counted this view
          if (shouldIncrementView) {
            viewCountedRef.current = true;
          }
        } else {
          throw new Error("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        setCheckingPurchase(true);
        const response = await fetch(`${API_BASE_URL}/${id}/purchased`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setHasPurchased(data.data.hasPurchased);
          }
        }
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setHasPurchased(false);
      } finally {
        setCheckingPurchase(false);
      }
    };
    
    checkPurchaseStatus();
  }, [id]);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      setQuantity(1);
    } else if (product && newQuantity > product.quantity) {
      setQuantity(product.quantity);
    } else {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (isProductInCart() || !product) {
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(id, quantity);
    
    if (result.success) {
      alert(`${quantity} x ${product.name} added to cart!`);
    } else {
      alert(`Error: ${result.error}`);
    }
    
    setAddingToCart(false);
  };

  const handleAddComment = () => {
    if (!hasPurchased) {
      alert('You must purchase this product before posting a comment.');
      return;
    }
    
    const message = commentDraft.trim();
    if (!message) {
      return;
    }

    const newComment = {
      id: `${id}-${Date.now()}`,
      message,
      createdAt: new Date().toISOString(),
    };
    
    setComments([newComment, ...comments]);
    setCommentDraft("");
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to your wishlist');
      navigate('/login');
      return;
    }

    if (isInWishlist(id)) {
      const result = await removeFromWishlist(id);
      if (!result.success) {
        alert(`Error: ${result.error}`);
      }
    } else {
      const result = await addToWishlist(id);
      if (result.success) {
        alert(`${product.name} added to wishlist!`);
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
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The product you're looking for doesn't exist."}</p>
          <Link
            to="/products"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 sm:p-8">
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg
                    className="w-32 h-32 text-gray-400"
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
              
              {/* Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all z-10"
                title={isInWishlist(id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg 
                  className={`w-6 h-6 transition-colors ${
                    isInWishlist(id) ? "text-red-500" : "text-gray-700"
                  }`}
                  fill={isInWishlist(id) ? "currentColor" : "none"}
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
              
              {product.quantity === 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                  Out of Stock
                </div>
              )}
              {product.view_count > 200 && (
                <div className="absolute bottom-4 left-4 bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                  Popular
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-2">
                  {product.category?.name || "Uncategorized"}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">
                    ${product.price ? product.price.toFixed(2) : "0.00"}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div>
                      <div className="text-sm text-gray-600">Stock Available</div>
                      <div className="text-lg font-semibold text-gray-900">{product.quantity} units</div>
                    </div>
                  </div>
                  
                  {product.view_count !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <div>
                        <div className="text-sm text-gray-600">Views</div>
                        <div className="text-lg font-semibold text-gray-900">{Math.floor(product.view_count / 2)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Information</h3>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Quantity Selector & Add to Cart */}
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.quantity}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 ml-2">
                        (Max: {product.quantity})
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={product.quantity === 0 || addingToCart || isProductInCart()}
                    onClick={handleAddToCart}
                    className={`w-full py-4 font-semibold rounded-lg transition-colors text-lg ${
                      product.quantity === 0 || addingToCart || isProductInCart()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary-dark"
                    }`}
                  >
                    {isProductInCart()
                      ? "Already in your cart"
                      : product.quantity === 0
                        ? "Out of Stock"
                        : addingToCart
                          ? "Adding..."
                          : "Add to Cart"
                    }
                  </button>
                  
                  {isProductInCart() && (
                    <p className="mt-3 text-sm font-medium text-primary text-center">
                      This product is already in your cart. You can adjust the quantity from the basket page.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Comments</h2>
          
          {checkingPurchase ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : !hasPurchased ? (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800 mb-1">Purchase Required</p>
                  <p className="text-yellow-700">
                    You must purchase this product before you can post comments.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={4}
                placeholder="Share your thoughts about this product..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentDraft.trim()}
                className={`mt-3 px-6 py-3 font-semibold rounded-lg transition-colors ${
                  !commentDraft.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "text-white bg-primary hover:bg-primary-dark"
                }`}
              >
                Post Comment
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to share your experience!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 mb-2">{comment.message}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Back to Products */}
        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

