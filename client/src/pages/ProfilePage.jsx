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
  
  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [refundReason, setRefundReason] = useState('');
  const [refunds, setRefunds] = useState({}); // orderId -> refunds array
  const [submittingRefund, setSubmittingRefund] = useState(false);

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
            const ordersData = data.data || [];
            setOrders(ordersData);
            
            // Fetch refunds for delivered orders
            const deliveredOrders = ordersData.filter(o => o.status === 'delivered');
            const refundPromises = deliveredOrders.map(async (order) => {
              try {
                const refundResponse = await fetch(`${API_BASE_URL}/${order._id}/refunds`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (refundResponse.ok) {
                  const refundData = await refundResponse.json();
                  if (refundData.success) {
                    return { orderId: order._id, refunds: refundData.data };
                  }
                }
              } catch (err) {
                console.error(`Error fetching refunds for order ${order._id}:`, err);
              }
              return { orderId: order._id, refunds: [] };
            });
            
            const refundsResults = await Promise.all(refundPromises);
            const refundsMap = {};
            refundsResults.forEach(({ orderId, refunds: orderRefunds }) => {
              refundsMap[orderId] = orderRefunds;
            });
            setRefunds(refundsMap);
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

  const getDaysRemainingForRefund = (orderDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDateObj = new Date(orderDate);
    orderDateObj.setHours(0, 0, 0, 0);
    const thirtyDaysFromPurchase = new Date(orderDateObj);
    thirtyDaysFromPurchase.setDate(thirtyDaysFromPurchase.getDate() + 30);
    
    const diffTime = thirtyDaysFromPurchase - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const openRefundModal = (order) => {
    // Check if order is within 30 days
    const orderDate = new Date(order.order_date);
    const daysRemaining = getDaysRemainingForRefund(order.order_date);
    
    if (daysRemaining === 0) {
      alert('Refund period has expired. Refunds can only be requested within 30 days of purchase.');
      return;
    }

    // Check if all products already have pending/approved refunds
    const orderRefunds = refunds[order._id] || [];
    const allProductsHaveRefunds = order.items.every((item) => {
      const productId = item.product_id?._id || item.product_id;
      return orderRefunds.some(
        (refund) => {
          const refundProductId = refund.product_id?._id || refund.product_id;
          return refundProductId === productId &&
            (refund.status === 'pending' || refund.status === 'approved');
        }
      );
    });

    if (allProductsHaveRefunds) {
      alert('You already have a refund request in progress for all products in this order. Please wait for the current request to be processed.');
      return;
    }
    
    // Make sure order.items exists and has data
    if (!order.items || order.items.length === 0) {
      alert('This order has no items to refund.');
      return;
    }

    setSelectedOrder(order);
    setSelectedProducts([]);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmitRefund = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to refund');
      return;
    }
    
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    setSubmittingRefund(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${selectedOrder._id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_ids: selectedProducts,
          reason: refundReason
        })
      });
     
      if (response.ok) {
        const data = await response.json();
        alert('Refund request submitted successfully');
        setShowRefundModal(false);
        setSelectedOrder(null);
        setSelectedProducts([]);
        setRefundReason('');
        
        // Refresh refunds for this order
        const refundResponse = await fetch(`${API_BASE_URL}/${selectedOrder._id}/refunds`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refundResponse.ok) {
          const refundData = await refundResponse.json();
          if (refundData.success) {
            setRefunds((prev) => ({
              ...prev,
              [selectedOrder._id]: refundData.data
            }));
          }
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to submit refund request'}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const hasRefundForProduct = (orderId, productId) => {
    const orderRefunds = refunds[orderId] || [];
    return orderRefunds.some(
      (refund) => {
        const refundProductId = refund.product_id?._id || refund.product_id;
        return refundProductId === productId &&
          (refund.status === 'pending' || refund.status === 'approved');
      }
    );
  };

  const getRefundStatusForProduct = (orderId, productId) => {
    const orderRefunds = refunds[orderId] || [];
    const refund = orderRefunds.find((r) => {
      const refundProductId = r.product_id?._id || r.product_id;
      return refundProductId === productId;
    });
    return refund?.status;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                My Account
              </h1>
              <p className="text-gray-600 font-medium">Manage your profile and orders</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-2">
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>My Orders ({orders.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transform transition-all hover:shadow-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Profile Information
              </h2>
            </div>
         
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span>User ID</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-gray-900 font-mono text-sm border border-gray-200 group-hover:border-primary transition-colors">
                {user?._id || 'N/A'}
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>First Name</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-gray-900 font-medium border border-blue-100 group-hover:border-primary transition-colors">
                {user?.first_name || 'N/A'}
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Last Name</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-gray-900 font-medium border border-blue-100 group-hover:border-primary transition-colors">
                {user?.last_name || 'N/A'}
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-gray-900 font-medium border border-purple-100 group-hover:border-primary transition-colors">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Phone Number</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-gray-900 font-medium border border-green-100 group-hover:border-primary transition-colors">
                {user?.phone_number || 'N/A'}
              </div>
            </div>

            <div className="md:col-span-2 group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Home Address</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl text-gray-900 border border-orange-100 group-hover:border-primary transition-colors">
                {user?.home_address || 'N/A'}
              </div>
            </div>

            {user?.taxID && (
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Tax ID</span>
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl text-gray-900 font-medium border border-indigo-100 group-hover:border-primary transition-colors">
                  {user.taxID}
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Account Type</span>
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl text-gray-900 font-semibold capitalize border border-primary/20 group-hover:border-primary transition-colors">
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
                      {order.status === 'delivered' && (() => {
                        const orderRefunds = refunds[order._id] || [];
                        const hasApprovedRefund = orderRefunds.some(r => r.status === 'approved');
                        const hasRejectedRefund = orderRefunds.some(r => r.status === 'rejected');
                        const hasPendingRefund = orderRefunds.some(r => r.status === 'pending');
                        
                        if (hasApprovedRefund && !hasPendingRefund) {
                          return (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Refund Approved
                            </span>
                          );
                        }
                        if (hasRejectedRefund && !hasPendingRefund && !hasApprovedRefund) {
                          return (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Refund Rejected
                            </span>
                          );
                        }
                        if (hasPendingRefund) {
                          return (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              Refund Pending
                            </span>
                          );
                        }
                        return null;
                      })()}
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
                        {order.items.map((item, index) => {
                          const productId = item.product_id?._id || item.product_id;
                          const hasRefund = hasRefundForProduct(order._id, productId);
                          const refundStatus = getRefundStatusForProduct(order._id, productId);
                          
                          return (
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
                                  to={`/products/${productId}`}
                                  className="font-semibold text-gray-900 hover:text-primary transition-colors"
                                >
                                  {item.product_id?.name || 'Product'}
                                </Link>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} × ${item.price_at_time.toFixed(2)}
                                </p>
                                {hasRefund && (
                                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
                                    refundStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                    refundStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {refundStatus === 'approved' ? 'Refund Approved' :
                                     refundStatus === 'rejected' ? 'Refund Rejected' :
                                     'Refund Pending'}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">${item.total_price.toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
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
                     
                      {order.status === 'delivered' && (() => {
                        const orderRefunds = refunds[order._id] || [];
                        
                        // Check refund status for all products
                        const allProductsHaveRefunds = order.items.every((item) => {
                          const productId = item.product_id?._id || item.product_id;
                          return orderRefunds.some(
                            (refund) => {
                              const refundProductId = refund.product_id?._id || refund.product_id;
                              return refundProductId === productId;
                            }
                          );
                        });
                        
                        // Determine overall refund status
                        let overallRefundStatus = null;
                        if (allProductsHaveRefunds) {
                          const hasApproved = orderRefunds.some(r => r.status === 'approved');
                          const hasRejected = orderRefunds.some(r => r.status === 'rejected');
                          const hasPending = orderRefunds.some(r => r.status === 'pending');
                          
                          if (hasApproved && !hasPending) {
                            overallRefundStatus = 'approved';
                          } else if (hasRejected && !hasPending && !hasApproved) {
                            overallRefundStatus = 'rejected';
                          } else if (hasPending) {
                            overallRefundStatus = 'pending';
                          }
                        }

                        const daysRemaining = getDaysRemainingForRefund(order.order_date);
                        const canRequestRefund = daysRemaining > 0;

                        return (
                          <>
                            {overallRefundStatus === 'approved' ? (
                              <span className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg">
                                Refund Approved
                              </span>
                            ) : overallRefundStatus === 'rejected' ? (
                              <span className="px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg">
                                Refund Rejected
                              </span>
                            ) : overallRefundStatus === 'pending' ? (
                              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 font-semibold rounded-lg">
                                Refund Request In Progress
                              </span>
                            ) : canRequestRefund ? (
                              <button
                                onClick={() => openRefundModal(order)}
                                className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                                title={`${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining to request refund`}
                              >
                                Request Refund ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
                              </button>
                            ) : (
                              <span className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-lg cursor-not-allowed">
                                Refund Period Expired
                              </span>
                            )}
                            {order.items.map((item) => (
                              <Link
                                key={item.product_id?._id || item.product_id}
                                to={`/products/${item.product_id?._id || item.product_id}`}
                                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Review {item.product_id?.name}
                              </Link>
                            ))}
                          </>
                        );
                      })()}
                     
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

        {/* Refund Request Modal */}
        {showRefundModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Request Refund</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select products from order {selectedOrder.order_number} to request a refund
                </p>
                {(() => {
                  const daysRemaining = getDaysRemainingForRefund(selectedOrder.order_date);
                  return daysRemaining > 0 ? (
                    <p className="text-sm text-yellow-600 mt-2 font-medium">
                      ⏰ {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining to request a refund
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="p-6">
                {/* Product Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Products to Refund
                  </label>
                  {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No products available for refund
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => {
                        const productId = item.product_id?._id || item.product_id;
                        const hasRefund = hasRefundForProduct(selectedOrder._id, productId);
                        const isSelected = selectedProducts.includes(productId);
                      
                      return (
                        <div
                          key={index}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            hasRefund
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => !hasRefund && toggleProductSelection(productId)}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={hasRefund}
                              onChange={() => !hasRefund && toggleProductSelection(productId)}
                              className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
                            />
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
                              <p className="font-semibold text-gray-900">
                                {item.product_id?.name || 'Product'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × ${item.price_at_time.toFixed(2)} = ${item.total_price.toFixed(2)}
                              </p>
                              {hasRefund && (
                                <p className="text-xs text-yellow-600 mt-1 font-medium">
                                  Refund already requested for this product
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>

                {/* Reason Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Refund <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please provide a reason for requesting a refund..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected for Refund:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedOrder.items
                        .filter((item) => {
                          const productId = item.product_id?._id || item.product_id;
                          return selectedProducts.includes(productId);
                        })
                        .map((item, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {item.product_id?.name} - ${item.total_price.toFixed(2)}
                          </li>
                        ))}
                    </ul>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      Total Refund Amount: $
                      {selectedOrder.items
                        .filter((item) => {
                          const productId = item.product_id?._id || item.product_id;
                          return selectedProducts.includes(productId);
                        })
                        .reduce((sum, item) => sum + item.total_price, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedOrder(null);
                    setSelectedProducts([]);
                    setRefundReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submittingRefund}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRefund}
                  disabled={selectedProducts.length === 0 || !refundReason.trim() || submittingRefund}
                  className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
