import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const API_BASE_URL = 'http://localhost:3000/cart';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cart from API
  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCartItems(data.data.items || []);
          setCartTotal(data.data.total || 0);
          setItemCount(data.data.itemCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh cart data
        await fetchCart();
        return { success: true, message: data.message };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/update/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quantity');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchCart();
        return { success: true, message: data.message };
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/remove/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchCart();
        return { success: true, message: data.message };
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/clear`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      const data = await response.json();
      
      if (data.success) {
        setCartItems([]);
        setCartTotal(0);
        setItemCount(0);
        return { success: true, message: data.message };
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const value = {
    cartItems,
    cartTotal,
    itemCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

