import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";
const PRODUCTS_BASE = `${API_BASE}/products`;
const DISCOUNTS_BASE = `${API_BASE}/discounts`;
const INVOICES_BASE = `${API_BASE}/orders/management/invoices`;
const ANALYTICS_BASE = `${API_BASE}/sales/analytics`;
const REFUNDS_BASE = `${API_BASE}/sales/refunds`;

export default function SalesManagerDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // State for tabs
  const [activeTab, setActiveTab] = useState("discounts");

  // Price management state
  const [priceManagementProducts, setPriceManagementProducts] = useState([]);
  const [priceManagementLoading, setPriceManagementLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  // Refund state
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(true);
  const [refundStatusFilter, setRefundStatusFilter] = useState("");
  const [refundPagination, setRefundPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Discount state
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discountForm, setDiscountForm] = useState({
    name: "",
    description: "",
    discount_rate: "",
    start_date: "",
    end_date: "",
  });
  const [discounts, setDiscounts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [invoicePagination, setInvoicePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [invoiceDateRange, setInvoiceDateRange] = useState({
    start_date: "",
    end_date: "",
  });
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authenticatedFetch = async (url, options = {}) => {
    if (!token) return null;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (response.status === 401) {
      logout();
      return null;
    }
    return response;
  };

  // Fetch products
  const fetchProducts = async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const response = await authenticatedFetch(`${PRODUCTS_BASE}?limit=1000`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load products");
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch discounts
  const fetchDiscounts = async () => {
    if (!token) return;
    setDiscountsLoading(true);
    try {
      const response = await authenticatedFetch(`${DISCOUNTS_BASE}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load discounts");
      const data = await response.json();
      if (data.success) {
        setDiscounts(data.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscountsLoading(false);
    }
  };

  // Apply discount
  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return;
    }
    if (!discountForm.discount_rate || discountForm.discount_rate < 0 || discountForm.discount_rate > 100) {
      setError("Discount rate must be between 0 and 100");
      return;
    }
    if (!discountForm.start_date || !discountForm.end_date) {
      setError("Please select start and end dates");
      return;
    }

    setApplyingDiscount(true);
    setError("");
    try {
      const response = await authenticatedFetch(`${DISCOUNTS_BASE}`, {
        method: "POST",
        body: JSON.stringify({
          ...discountForm,
          discount_rate: parseFloat(discountForm.discount_rate),
          product_ids: selectedProducts,
        }),
      });

      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to apply discount");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Discount applied successfully! Users with these products in their wishlist will be notified.");
        setDiscountForm({
          name: "",
          description: "",
          discount_rate: "",
          start_date: "",
          end_date: "",
        });
        setSelectedProducts([]);
        fetchProducts();
        fetchDiscounts();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingDiscount(false);
    }
  };

  // Delete discount
  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm("Are you sure you want to delete this discount? Product prices will be restored to their original values.")) {
      return;
    }

    setError("");
    try {
      const response = await authenticatedFetch(`${DISCOUNTS_BASE}/${discountId}`, {
        method: "DELETE",
      });

      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete discount");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Discount deleted successfully! Product prices have been restored.");
        fetchProducts();
        fetchDiscounts();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch invoices
  const fetchInvoices = async () => {
    if (!token) return;
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(invoicePagination.page),
      });
      
      if (invoiceDateRange.start_date) {
        params.append("start_date", invoiceDateRange.start_date);
      }
      if (invoiceDateRange.end_date) {
        params.append("end_date", invoiceDateRange.end_date);
      }

      const response = await authenticatedFetch(`${INVOICES_BASE}?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load invoices");
      const data = await response.json();
      if (data.success) {
        setInvoices(data.data.invoices || []);
        setInvoicePagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Fetch refunds
  const fetchRefunds = async () => {
    if (!token) return;
    setRefundsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(refundPagination.page),
        limit: "20",
      });
      if (refundStatusFilter) {
        params.append("status", refundStatusFilter);
      }
      
      const response = await authenticatedFetch(`${REFUNDS_BASE}?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load refunds");
      const data = await response.json();
      if (data.success) {
        setRefunds(data.data.refunds || []);
        setRefundPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRefundsLoading(false);
    }
  };

  // Approve refund
  const handleApproveRefund = async (refundId) => {
    const confirmReturn = window.confirm(
      "Has the product been returned to the store? Click OK if yes, Cancel if not yet received."
    );

    setError("");
    setSuccess("");
    try {
      const response = await authenticatedFetch(`${REFUNDS_BASE}/${refundId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_returned: confirmReturn }),
      });

      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve refund");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Refund approved successfully! Product added back to stock and customer notified.");
        fetchRefunds();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Reject refund
  const handleRejectRefund = async (refundId) => {
    const rejectionReason = prompt("Please provide a reason for rejecting this refund:");
    if (!rejectionReason || !rejectionReason.trim()) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await authenticatedFetch(`${REFUNDS_BASE}/${refundId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject refund");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Refund request rejected.");
        fetchRefunds();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: analyticsDateRange.start_date,
        end_date: analyticsDateRange.end_date,
      });

      const response = await authenticatedFetch(`${ANALYTICS_BASE}?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Print invoice
  const handlePrintInvoice = async (invoice) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/orders/invoice/${invoice._id}/pdf`, {
        method: "GET",
      });
      if (!response || !response.ok) throw new Error("Failed to load invoice for printing");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      
      if (printWindow) {
        // Wait for PDF to load before printing
        printWindow.onload = () => {
          // Add a small delay to ensure PDF is fully rendered
          setTimeout(() => {
            printWindow.print();
            // Clean up blob URL after printing dialog is closed (user may cancel or print)
            // Use a longer timeout to allow user to interact with print dialog
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 5000);
          }, 250);
        };
        
        // Fallback: If onload doesn't fire (some browsers), try after a timeout
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            try {
              printWindow.print();
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
              }, 5000);
            } catch (e) {
              // PDF might still be loading, that's ok
            }
          }
        }, 1000);
      } else {
        window.URL.revokeObjectURL(url);
        setError("Popup blocked. Please allow popups for this site.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Download invoice PDF
  const handleDownloadInvoice = async (invoice) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/orders/invoice/${invoice._id}/pdf`, {
        method: "GET",
      });
      if (!response || !response.ok) throw new Error("Failed to download invoice");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Fetch products for price management
  const fetchPriceManagementProducts = async () => {
    if (!token) return;
    setPriceManagementLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/management?limit=100`);
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to load products (${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setPriceManagementProducts(data.data.products || []);
      } else {
        throw new Error(data.error || data.message || "Failed to load products");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPriceManagementLoading(false);
    }
  };

  // Start editing price
  const handleStartEditPrice = (product) => {
    setEditingPrice(product._id);
    setNewPrice(product.price.toString());
  };

  // Cancel editing price
  const handleCancelEditPrice = () => {
    setEditingPrice(null);
    setNewPrice("");
  };

  // Update product price
  const handleUpdatePrice = async (productId) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price (must be a positive number)");
      return;
    }

    setError("");
    try {
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ price: priceValue }),
      });

      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update price");
      }

      const data = await response.json();
      if (data.success) {
        setSuccess("Price updated successfully!");
        setEditingPrice(null);
        setNewPrice("");
        fetchPriceManagementProducts();
        fetchProducts(); // Also refresh discount products list
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Effects
  useEffect(() => {
    if (activeTab === "discounts") {
      fetchProducts();
      fetchDiscounts();
    } else if (activeTab === "invoices") {
      fetchInvoices();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    } else if (activeTab === "refunds") {
      fetchRefunds();
    } else if (activeTab === "prices") {
      fetchPriceManagementProducts();
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices();
    }
  }, [invoiceDateRange, invoicePagination.page]);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [analyticsDateRange]);

  useEffect(() => {
    if (activeTab === "refunds") {
      // Reset to page 1 when filter changes
      if (refundPagination.page !== 1) {
        setRefundPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        // If already on page 1, fetch immediately
        fetchRefunds();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refundStatusFilter]);

  useEffect(() => {
    if (activeTab === "refunds") {
      fetchRefunds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refundPagination.page]);

  // Simple bar chart component
  const SimpleBarChart = ({ data, labels, title }) => {
    if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;
    
    const maxValue = Math.max(...data);
    const chartHeight = 200;

    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {data.map((value, index) => {
              const barHeight = (value / maxValue) * (chartHeight - 40);
              const barWidth = 100 / data.length;
              const x = (index * 100) / data.length;
              const y = chartHeight - barHeight - 20;
              
              return (
                <g key={index}>
                  <rect
                    x={`${x + 2}%`}
                    y={y}
                    width={`${barWidth - 4}%`}
                    height={barHeight}
                    fill="#10b981"
                    className="hover:opacity-80 transition-opacity"
                  />
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {labels[index]}
                  </text>
                  <text
                    x={`${x + barWidth / 2}%`}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-800 font-semibold"
                  >
                    ${value.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Manager Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.first_name} {user?.last_name}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "discounts", label: "Discount Management" },
              { id: "prices", label: "Price Management" },
              { id: "invoices", label: "Invoices" },
              { id: "refunds", label: "Refund Requests" },
              { id: "analytics", label: "Revenue & Analytics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Discount Management Tab */}
        {activeTab === "discounts" && (
          <div className="space-y-6">
            {/* Create Discount Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Discount</h2>
              <form onSubmit={handleApplyDiscount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={discountForm.name}
                      onChange={(e) =>
                        setDiscountForm({ ...discountForm, name: e.target.value })
                      }
                      placeholder="Summer Sale 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={discountForm.discount_rate}
                      onChange={(e) =>
                        setDiscountForm({ ...discountForm, discount_rate: e.target.value })
                      }
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={discountForm.start_date}
                      onChange={(e) =>
                        setDiscountForm({ ...discountForm, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={discountForm.end_date}
                      onChange={(e) =>
                        setDiscountForm({ ...discountForm, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows="3"
                    value={discountForm.description}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, description: e.target.value })
                    }
                    placeholder="Optional description for this discount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Products ({selectedProducts.length} selected)
                  </label>
                  {productsLoading ? (
                    <div className="text-gray-500">Loading products...</div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {products.map((product) => (
                          <label
                            key={product._id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => toggleProductSelection(product._id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                ${product.price.toFixed(2)}
                                {selectedProducts.includes(product._id) && discountForm.discount_rate && (
                                  <span className="ml-2 text-emerald-600">
                                    → ${(product.price * (1 - parseFloat(discountForm.discount_rate) / 100)).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={applyingDiscount || selectedProducts.length === 0}
                  className="w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingDiscount ? "Applying..." : "Apply Discount"}
                </button>
              </form>
            </div>

            {/* Active Discounts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Active Discounts</h2>
              {discountsLoading ? (
                <div className="text-gray-500">Loading discounts...</div>
              ) : discounts.length === 0 ? (
                <div className="text-gray-500">No active discounts</div>
              ) : (
                <div className="space-y-4">
                  {discounts.map((discount) => (
                    <div
                      key={discount._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{discount.name}</h3>
                          {discount.description && (
                            <p className="text-sm text-gray-600 mt-1">{discount.description}</p>
                          )}
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium text-emerald-600">
                              {discount.discount_rate}% OFF
                            </span>
                            {" • "}
                            {discount.products?.length || 0} products
                            {" • "}
                            {new Date(discount.start_date).toLocaleDateString()} -{" "}
                            {new Date(discount.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              discount.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {discount.is_active ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => handleDeleteDiscount(discount._id)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete discount and restore original prices"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Filter Invoices by Date Range</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={invoiceDateRange.start_date}
                    onChange={(e) =>
                      setInvoiceDateRange({ ...invoiceDateRange, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={invoiceDateRange.end_date}
                    onChange={(e) =>
                      setInvoiceDateRange({ ...invoiceDateRange, end_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setInvoiceDateRange({ start_date: "", end_date: "" });
                      setInvoicePagination({ ...invoicePagination, page: 1 });
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Invoices</h2>
              </div>
              {invoicesLoading ? (
                <div className="p-6 text-center text-gray-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No invoices found</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.invoice_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.customer_details?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${invoice.total_amount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePrintInvoice(invoice)}
                                  className="text-emerald-600 hover:text-emerald-900"
                                >
                                  Print
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {invoicePagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {invoicePagination.page} of {invoicePagination.pages} ({invoicePagination.total} total)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setInvoicePagination({
                              ...invoicePagination,
                              page: Math.max(1, invoicePagination.page - 1),
                            })
                          }
                          disabled={invoicePagination.page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setInvoicePagination({
                              ...invoicePagination,
                              page: Math.min(
                                invoicePagination.pages,
                                invoicePagination.page + 1
                              ),
                            })
                          }
                          disabled={invoicePagination.page === invoicePagination.pages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Refunds Tab */}
        {activeTab === "refunds" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Refund Requests</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={refundStatusFilter}
                  onChange={(e) => {
                    setRefundStatusFilter(e.target.value);
                    setRefundPagination({ ...refundPagination, page: 1 });
                  }}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
              </div>
            </div>

            {/* Refunds List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {refundsLoading ? (
                <div className="p-6 text-center text-gray-500">Loading refunds...</div>
              ) : refunds.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No refund requests found</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Refund #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Refund Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {refunds.map((refund) => (
                          <tr key={refund._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {refund.refund_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {refund.customer_id?.first_name} {refund.customer_id?.last_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {refund.product_id?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {refund.order_id?.order_number || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {refund.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${refund.refund_amount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  refund.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : refund.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : refund.status === "processed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {refund.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(refund.request_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {refund.status === "pending" && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveRefund(refund._id)}
                                    className="text-green-600 hover:text-green-900 font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectRefund(refund._id)}
                                    className="text-red-600 hover:text-red-900 font-semibold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {refund.status === "approved" && !refund.product_returned && (
                                <span className="text-yellow-600 text-xs">Product not returned yet</span>
                              )}
                              {refund.status === "approved" && refund.product_returned && (
                                <span className="text-green-600 text-xs">Product returned</span>
                              )}
                              {refund.reason && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500" title={refund.reason}>
                                    {refund.reason.length > 30 ? refund.reason.substring(0, 30) + "..." : refund.reason}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {refundPagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {refundPagination.page} of {refundPagination.pages} ({refundPagination.total} total)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setRefundPagination({
                              ...refundPagination,
                              page: Math.max(1, refundPagination.page - 1),
                            })
                          }
                          disabled={refundPagination.page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setRefundPagination({
                              ...refundPagination,
                              page: Math.min(refundPagination.pages, refundPagination.page + 1),
                            })
                          }
                          disabled={refundPagination.page === refundPagination.pages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Price Management Tab */}
        {activeTab === "prices" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Product Price Management</h2>
              <p className="text-sm text-gray-600 mb-4">
                Update product prices directly. You can also apply discounts from the Discount Management tab.
              </p>
              {priceManagementLoading ? (
                <div className="text-gray-500">Loading products...</div>
              ) : priceManagementProducts.length === 0 ? (
                <div className="text-gray-500">No products found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceManagementProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.model && (
                              <div className="text-sm text-gray-500">Model: {product.model}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingPrice === product._id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                ${product.price.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                product.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingPrice === product._id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdatePrice(product._id)}
                                  className="text-green-600 hover:text-green-900 font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditPrice}
                                  className="text-gray-600 hover:text-gray-900 font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditPrice(product)}
                                className="text-emerald-600 hover:text-emerald-900 font-semibold"
                              >
                                Edit Price
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Revenue & Profit Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={analyticsDateRange.start_date}
                    onChange={(e) =>
                      setAnalyticsDateRange({ ...analyticsDateRange, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={analyticsDateRange.end_date}
                    onChange={(e) =>
                      setAnalyticsDateRange({ ...analyticsDateRange, end_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchAnalytics}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Update Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics Results */}
            {analyticsLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading analytics...
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${analytics.total_revenue?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Cost</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${analytics.total_cost?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500 mb-1">Net Profit/Loss</div>
                    <div
                      className={`text-2xl font-bold ${
                        (analytics.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${analytics.net_profit?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                {/* Charts */}
                {analytics.daily_data && analytics.daily_data.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <SimpleBarChart
                      data={analytics.daily_data.map((d) => d.revenue || 0)}
                      labels={analytics.daily_data.map((d) =>
                        new Date(d.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      )}
                      title="Daily Revenue"
                    />
                  </div>
                )}

                {analytics.daily_data && analytics.daily_data.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <SimpleBarChart
                      data={analytics.daily_data.map((d) => d.profit || 0)}
                      labels={analytics.daily_data.map((d) =>
                        new Date(d.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      )}
                      title="Daily Profit/Loss"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No analytics data available. Select a date range and click "Update Analysis".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

