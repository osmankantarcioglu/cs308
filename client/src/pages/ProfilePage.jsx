import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/orders";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'orders'

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }
     
      try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
       
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrders(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchOrders();
  }, [isAuthenticated, token]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
   
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
     
      if (response.ok) {
        alert('Order cancelled successfully');
        // Refresh orders
        const ordersResponse = await fetch(API_BASE_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await ordersResponse.json();
        if (data.success) {
          setOrders(data.data || []);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleRequestRefund = async (orderId) => {
    const reason = prompt('Please provide a reason for the refund:');
    if (!reason) return;
   
    try {
      const response = await fetch(`${API_BASE_URL}/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
     
      if (response.ok) {
        alert('Refund request submitted successfully');
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, refundRequested: true } : order
          )
        );
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-8">Please login to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600">Manage your profile and orders</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Orders ({orders.length})
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
         
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {user?.first_name || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {user?.last_name || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {user?.phone_number || 'N/A'}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                {user?.home_address || 'N/A'}
              </div>
            </div>

            {user?.taxID && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {user.taxID}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 capitalize">
                {user?.role || 'Customer'}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                <button
                  onClick={() => navigate('/products')}
                  className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Order Number</p>
                        <p className="font-bold text-gray-900">{order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Order Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="font-semibold text-gray-900">${order.subtotal?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Shipping</p>
                        <p className="font-semibold text-gray-900">
                          {order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2) || '0.00'}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-bold text-primary">${order.total_amount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                        Payment: {order.payment_status}
                      </span>
                    </div>

                    {/* Delivery Address */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Items ({order.items.length})</p>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.product_id?.images?.[0] ? (
                                <img
                                  src={item.product_id.images[0]}
                                  alt={item.product_id?.name || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <Link
                                to={`/products/${item.product_id?._id}`}
                                className="font-semibold text-gray-900 hover:text-primary transition-colors"
                              >
                                {item.product_id?.name || 'Product'}
                              </Link>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × ${item.price_at_time.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">${item.total_price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      {/* View Invoice Button */}
                      {(order.invoice_path || order.invoice?.pdf_path) && (
                        <a
                          href={`http://localhost:3000${order.invoice?.pdf_path || order.invoice_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          View Invoice PDF
                        </a>
                      )}
                     
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Cancel Order
                        </button>
                      )}
                     
                      {order.status === 'delivered' && (
                        <>
                          {order.refundRequested ? (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 font-semibold rounded-lg">
                              Refund Requested
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestRefund(order._id)}
                              className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                              Request Refund
                            </button>
                          )}
                          {order.items.map((item) => (
                            <Link
                              key={item.product_id?._id}
                              to={`/products/${item.product_id?._id}`}
                              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Review {item.product_id?.name}
                            </Link>
                          ))}
                        </>
                      )}
                     
                      {order.status === 'in-transit' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Your order is on the way!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
