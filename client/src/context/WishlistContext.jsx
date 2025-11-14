import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const API_BASE_URL = 'http://localhost:3000/users';

export function WishlistProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated, user]);

  const fetchWishlist = async () => {
    if (!isAuthenticated || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${user._id}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWishlistItems(data.data.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please login to add items to your wishlist' };
    }

    try {
      setLoading(true);
      console.log('Adding to wishlist:', { userId: user._id, productId, token });
      
      const response = await fetch(`${API_BASE_URL}/${user._id}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to add to wishlist (${response.status})`);
      }

      const data = await response.json();
      console.log('Success response:', data);

      if (data.success) {
        await fetchWishlist();
        return { success: true, message: 'Added to wishlist' };
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please login to manage your wishlist' };
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${user._id}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const data = await response.json();

      if (data.success) {
        await fetchWishlist();
        return { success: true, message: 'Removed from wishlist' };
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    if (!productId || wishlistItems.length === 0) return false;
    
    return wishlistItems.some(item => {
      const id = item.product_id?._id || item.product_id;
      if (!id) return false;
      
      // Handle both string and ObjectId comparisons
      const itemId = typeof id === 'object' ? id.toString() : id;
      const checkId = typeof productId === 'object' ? productId.toString() : productId;
      
      return itemId === checkId;
    });
  };

  const value = {
    wishlistItems,
    loading,
    wishlistCount: wishlistItems.length,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    fetchWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

