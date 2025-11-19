import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:3000";
const MANAGEMENT_BASE = `${API_BASE}/orders/management`;
const DELIVERY_BASE = `${API_BASE}/deliveries`;
const PRODUCTS_BASE = `${API_BASE}/products`;
const CATEGORIES_BASE = `${API_BASE}/categories`;
const REVIEWS_BASE = `${API_BASE}/reviews`;

const ORDER_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "In Transit", value: "in-transit" },
  { label: "Delivered", value: "delivered" },
];

const DELIVERY_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Transit", value: "in-transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
];

const REVIEW_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

const STATUS_STYLES = {
  processing: "bg-amber-100 text-amber-800 border border-amber-200",
  "in-transit": "bg-blue-100 text-blue-800 border border-blue-200",
  delivered: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 border border-rose-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  failed: "bg-rose-100 text-rose-700 border border-rose-200",
};

export default function ProductManagerDashboard() {
  const { token, user, logout } = useAuth();

  // Order + KPI state
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderPagination, setOrderPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [inventoryPagination, setInventoryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [inventoryStatus, setInventoryStatus] = useState("all");
  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedInventorySearch, setDebouncedInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    is_active: true,
    image: "",
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    description: "",
    parent_category: "",
    is_active: true,
  });

  // Deliveries
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryPagination, setDeliveryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [debouncedDeliverySearch, setDebouncedDeliverySearch] = useState("");
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewsLoading, setReviewsLoading] = useState(true);

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

  // Debounce search inputs
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedOrderSearch(orderSearchTerm), 400);
    return () => clearTimeout(timeout);
  }, [orderSearchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedInventorySearch(inventorySearch), 400);
    return () => clearTimeout(timeout);
  }, [inventorySearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedDeliverySearch(deliverySearch), 400);
    return () => clearTimeout(timeout);
  }, [deliverySearch]);

  // Reset pagination when filters change
  useEffect(() => {
    setOrderPage(1);
  }, [orderStatusFilter, debouncedOrderSearch]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventoryStatus, debouncedInventorySearch]);

  useEffect(() => {
    setDeliveryPage(1);
  }, [deliveryStatus, debouncedDeliverySearch]);

  const fetchOverview = async () => {
    if (!token) return;
    setLoadingOverview(true);
    try {
      const response = await authenticatedFetch(`${MANAGEMENT_BASE}/overview`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load overview");
      const data = await response.json();
      if (data.success) setOverview(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchOrders = async (statusValue, searchValue, pageValue) => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        status: statusValue,
        search: searchValue,
        page: String(pageValue),
      });
      const response = await authenticatedFetch(`${MANAGEMENT_BASE}/orders?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load orders");
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
        setOrderPagination(data.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInventory = async (statusValue, searchValue, pageValue) => {
    if (!token) return;
    setInventoryLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusValue,
        search: searchValue,
        page: String(pageValue),
        limit: "20",
      });
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/management?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load inventory");
      const data = await response.json();
      if (data.success) {
        setInventory(data.data.products);
        setInventoryPagination(data.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    setCategoriesLoading(true);
    try {
      const response = await authenticatedFetch(`${CATEGORIES_BASE}?limit=500`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load categories");
      const data = await response.json();
      setCategories(data.data?.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchDeliveries = async (statusValue, searchValue, pageValue) => {
    if (!token) return;
    setDeliveriesLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusValue,
        search: searchValue,
        page: String(pageValue),
        limit: "20",
      });
      const response = await authenticatedFetch(`${DELIVERY_BASE}?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load deliveries");
      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data.deliveries);
        setDeliveryPagination(data.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const fetchReviews = async (statusValue) => {
    if (!token) return;
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusValue,
        limit: "20",
      });
      const response = await authenticatedFetch(`${REVIEWS_BASE}/management?${params.toString()}`);
      if (!response) return;
      if (!response.ok) throw new Error("Failed to load reviews");
      const data = await response.json();
      if (data.success) setReviews(data.data.reviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOverview();
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchOrders(orderStatusFilter, debouncedOrderSearch, orderPage);
  }, [token, orderStatusFilter, debouncedOrderSearch, orderPage]);

  useEffect(() => {
    if (!token) return;
    fetchInventory(inventoryStatus, debouncedInventorySearch, inventoryPage);
  }, [token, inventoryStatus, debouncedInventorySearch, inventoryPage]);

  useEffect(() => {
    if (!token) return;
    fetchDeliveries(deliveryStatus, debouncedDeliverySearch, deliveryPage);
  }, [token, deliveryStatus, debouncedDeliverySearch, deliveryPage]);

  useEffect(() => {
    if (!token) return;
    fetchReviews(reviewStatus);
  }, [token, reviewStatus]);

  const handleOrderStatusChange = async (orderId, nextStatus) => {
    if (!nextStatus) return;
    setUpdatingOrderId(orderId);
    setError("");
    try {
      const response = await authenticatedFetch(`${MANAGEMENT_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      await fetchOrders(orderStatusFilter, debouncedOrderSearch, orderPage);
      await fetchOverview();
      await fetchDeliveries(deliveryStatus, debouncedDeliverySearch, deliveryPage);
      setSuccess("Order status updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAdjustStock = async (productId, delta) => {
    if (!delta) return;
    try {
      const endpoint = delta > 0 ? "increase" : "decrease";
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/${productId}/stock/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ quantity: Math.abs(delta) }),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update stock");
      }
      await fetchInventory(inventoryStatus, debouncedInventorySearch, inventoryPage);
      setSuccess("Stock updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleProduct = async (product, isActive) => {
    try {
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/${product._id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: isActive }),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }
      await fetchInventory(inventoryStatus, debouncedInventorySearch, inventoryPage);
      setSuccess(`Product marked as ${isActive ? "active" : "inactive"}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Remove this product from catalog?")) return;
    try {
      const response = await authenticatedFetch(`${PRODUCTS_BASE}/${productId}`, {
        method: "DELETE",
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }
      await fetchInventory(inventoryStatus, debouncedInventorySearch, inventoryPage);
      setSuccess("Product removed");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProductForm.name,
        description: newProductForm.description,
        price: Number(newProductForm.price),
        quantity: Number(newProductForm.quantity),
        category: newProductForm.category || undefined,
        is_active: newProductForm.is_active,
      };
      if (newProductForm.image) {
        payload.images = [newProductForm.image];
      }
      const response = await authenticatedFetch(`${PRODUCTS_BASE}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }
      setNewProductForm({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "",
        is_active: true,
        image: "",
      });
      await fetchInventory(inventoryStatus, debouncedInventorySearch, 1);
      setSuccess("Product created");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newCategoryForm.name,
        description: newCategoryForm.description,
        parent_category: newCategoryForm.parent_category || null,
        is_active: newCategoryForm.is_active,
      };
      const response = await authenticatedFetch(`${CATEGORIES_BASE}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }
      setNewCategoryForm({
        name: "",
        description: "",
        parent_category: "",
        is_active: true,
      });
      await fetchCategories();
      setSuccess("Category created");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Remove this category? Products must be reassigned manually.")) return;
    try {
      const response = await authenticatedFetch(`${CATEGORIES_BASE}/${categoryId}`, {
        method: "DELETE",
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
      await fetchCategories();
      setSuccess("Category removed");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeliveryStatusChange = async (deliveryId, status) => {
    try {
      const response = await authenticatedFetch(`${DELIVERY_BASE}/${deliveryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update delivery");
      }
      await fetchDeliveries(deliveryStatus, debouncedDeliverySearch, deliveryPage);
      await fetchOrders(orderStatusFilter, debouncedOrderSearch, orderPage);
      setSuccess("Delivery updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewDecision = async (reviewId, status) => {
    let reason;
    if (status === "rejected") {
      reason = window.prompt("Provide a rejection reason", "Content violates guidelines");
    }
    try {
      const response = await authenticatedFetch(`${REVIEWS_BASE}/${reviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      });
      if (!response) return;
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update review");
      }
      await fetchReviews(reviewStatus);
      setSuccess(status === "approved" ? "Review approved" : "Review rejected");
    } catch (err) {
      setError(err.message);
    }
  };

  const statusSummary = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: "Processing",
        value: overview.totals.processing,
        accent: "from-amber-500/80 to-amber-600",
        ring: "ring-amber-500/40",
      },
      {
        label: "In Transit",
        value: overview.totals.inTransit,
        accent: "from-sky-500/80 to-sky-600",
        ring: "ring-sky-500/40",
      },
      {
        label: "Delivered",
        value: overview.totals.delivered,
        accent: "from-emerald-500/80 to-emerald-600",
        ring: "ring-emerald-500/40",
      },
      {
        label: "Cancelled",
        value: overview.totals.cancelled,
        accent: "from-rose-500/80 to-rose-600",
        ring: "ring-rose-500/40",
      },
    ];
  }, [overview]);

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <header className="text-white">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">Product Ops Center</p>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-4xl font-extrabold">Fulfillment Command</h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Keep stock healthy, deliveries on time, and customer feedback curated.
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Signed in as</p>
              <p className="text-white font-semibold text-lg">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-indigo-300 text-xs uppercase tracking-[0.3em]">Product Manager</p>
            </div>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`rounded-2xl px-4 py-3 border ${
              error
                ? "bg-rose-950/40 border-rose-500/40 text-rose-100"
                : "bg-emerald-900/40 border-emerald-500/40 text-emerald-100"
            }`}
          >
            {error || success}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-indigo-600/90 to-purple-600/90 rounded-3xl p-6 text-white ring-1 ring-white/10 shadow-2xl shadow-indigo-900/40">
            <p className="text-sm uppercase tracking-widest text-white/70">Total Orders</p>
            <p className="text-4xl font-black mt-3">
              {loadingOverview ? "…" : overview?.totals.totalOrders ?? 0}
            </p>
            <p className="text-sm mt-2 text-white/80">Across all delivery stages</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 rounded-3xl p-6 text-white ring-1 ring-white/10 shadow-2xl shadow-emerald-900/30">
            <p className="text-sm uppercase tracking-widest text-white/70">Revenue</p>
            <p className="text-4xl font-black mt-3">
              {loadingOverview ? "…" : `$${(overview?.totals.revenue ?? 0).toLocaleString()}`}
            </p>
            <p className="text-sm mt-2 text-white/80">Completed invoice volume</p>
          </div>
          {statusSummary.map((card) => (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${card.accent} rounded-3xl p-6 text-white ring-1 ${card.ring} shadow-2xl shadow-black/20`}
            >
              <p className="text-sm uppercase tracking-widest text-white/70">{card.label}</p>
              <p className="text-4xl font-black mt-3">{loadingOverview ? "…" : card.value}</p>
              <p className="text-sm mt-2 text-white/80">orders</p>
            </div>
          ))}
        </section>

        {/* Delivery pipeline + invoices */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-white text-2xl font-semibold">Delivery Pipeline</h2>
                <p className="text-slate-400 text-sm">Control order fulfillment statuses</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search order # or address"
                  className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">No orders match the selected filters.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-slate-900 rounded-2xl p-5 border border-white/5 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Order</p>
                        <p className="text-lg font-semibold text-white">{order.order_number}</p>
                        <p className="text-sm text-slate-400 mt-1">
                          {order.customer_id?.first_name} {order.customer_id?.last_name} · {order.customer_id?.email}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || STATUS_STYLES.processing}`}>
                        {order.status.replace("-", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-slate-300">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Delivery Address</p>
                        <p>{order.delivery_address}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Items</p>
                        <p>
                          {order.items
                            ?.map((item) => `${item.product_id?.name ?? "Product"} ×${item.quantity}`)
                            .join(", ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Invoice Total</p>
                        <p className="font-semibold text-white">${order.total_amount?.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Update Status
                      </label>
                      <select
                        className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                        disabled={updatingOrderId === order._id}
                      >
                        {ORDER_STATUS_OPTIONS.filter((opt) => opt.value !== "all").map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {updatingOrderId === order._id && <span className="text-xs text-indigo-300">Saving…</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {orderPagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 text-slate-400 text-sm">
                <span>
                  Page {orderPagination.page} of {orderPagination.pages} • {orderPagination.total} orders
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPagination.page === 1}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setOrderPage((p) => Math.min(orderPagination.pages, p + 1))}
                    disabled={orderPagination.page === orderPagination.pages}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-6">
            <div>
              <h2 className="text-white text-2xl font-semibold">Invoices</h2>
              <p className="text-slate-400 text-sm">Latest issued documents</p>
            </div>
            {loadingOverview ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
              </div>
            ) : overview?.invoices?.length ? (
              <div className="space-y-4">
                {overview.invoices.map((invoice) => (
                  <div key={invoice._id || invoice.order_number} className="bg-slate-900 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Order</p>
                        <p className="text-white font-semibold">{invoice.order_number}</p>
                      </div>
                      <p className="text-emerald-300 font-semibold">${invoice.total_amount?.toFixed(2)}</p>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      {invoice.customer_id?.first_name} {invoice.customer_id?.last_name}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-sm">
                      <span className="text-slate-500">
                        {new Date(invoice.order_date).toLocaleDateString()}
                      </span>
                      {invoice.invoice_path ? (
                        <a
                          href={invoice.invoice_path}
                          className="text-indigo-300 hover:text-indigo-200 font-semibold"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View PDF →
                        </a>
                      ) : (
                        <span className="text-slate-500">Invoice pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No invoices available.</p>
            )}

            <div>
              <h3 className="text-white text-xl font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-3 text-sm">
                {overview?.recentOrders?.length ? (
                  overview.recentOrders.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between bg-slate-900 rounded-2xl px-4 py-3 border border-white/5"
                    >
                      <div>
                        <p className="text-white font-medium">{entry.order_number}</p>
                        <p className="text-slate-400 text-xs">{entry.delivery_address}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[entry.status] || STATUS_STYLES.processing}`}>
                        {entry.status.replace("-", " ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No recent updates.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Inventory + categories */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-white text-2xl font-semibold">Inventory Control</h2>
                <p className="text-slate-400 text-sm">Adjust stock, archive products, or revive hits.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={inventoryStatus}
                  onChange={(e) => setInventoryStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <input
                  type="text"
                  placeholder="Search product or SKU"
                  className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
            </div>

            {inventoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No products found.</div>
            ) : (
              <div className="space-y-3">
                {inventory.map((product) => (
                  <div key={product._id} className="bg-slate-900 rounded-2xl p-4 border border-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{product.name}</p>
                        <p className="text-slate-400 text-sm">{product.category?.name || "Uncategorized"}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm text-slate-300">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Stock</p>
                        <p className="text-white font-semibold">{product.quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Price</p>
                        <p>${product.price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Updated</p>
                        <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Model</p>
                        <p>{product.model || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleAdjustStock(product._id, 5)}
                        className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition text-sm font-semibold"
                      >
                        +5 units
                      </button>
                      <button
                        onClick={() => handleAdjustStock(product._id, -5)}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition text-sm font-semibold"
                      >
                        -5 units
                      </button>
                      <button
                        onClick={() => handleToggleProduct(product, !product.is_active)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition text-sm font-semibold"
                      >
                        {product.is_active ? "Archive" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inventoryPagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 text-slate-400 text-sm">
                <span>
                  Page {inventoryPagination.page} of {inventoryPagination.pages} • {inventoryPagination.total} products
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                    disabled={inventoryPagination.page === 1}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setInventoryPage((p) => Math.min(inventoryPagination.pages, p + 1))}
                    disabled={inventoryPagination.page === inventoryPagination.pages}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-6">
            <div>
              <h2 className="text-white text-2xl font-semibold">Add Product</h2>
              <p className="text-slate-400 text-sm">Launch a SKU with inventory + pricing.</p>
            </div>
            <form className="space-y-4" onSubmit={handleCreateProduct}>
              <input
                type="text"
                placeholder="Product name"
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                rows={3}
                value={newProductForm.description}
                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Price"
                  className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newProductForm.price}
                  onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  className="bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newProductForm.quantity}
                  onChange={(e) => setNewProductForm({ ...newProductForm, quantity: e.target.value })}
                  required
                />
              </div>
              <select
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="url"
                placeholder="Hero image URL (optional)"
                className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={newProductForm.image}
                onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
              />
              <label className="flex items-center space-x-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  className="rounded bg-slate-800 border-white/10"
                  checked={newProductForm.is_active}
                  onChange={(e) => setNewProductForm({ ...newProductForm, is_active: e.target.checked })}
                />
                <span>Activate immediately</span>
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
              >
                Create product
              </button>
            </form>

            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-semibold">Categories</h3>
                <p className="text-slate-500 text-sm">
                  {categoriesLoading ? "Loading…" : `${categories.length} total`}
                </p>
              </div>
              <form className="space-y-3" onSubmit={handleCreateCategory}>
                <input
                  type="text"
                  placeholder="Category name"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  rows={2}
                  value={newCategoryForm.description}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                />
                <select
                  className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newCategoryForm.parent_category}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, parent_category: e.target.value })}
                >
                  <option value="">Parent category (optional)</option>
                  {categories
                    .filter((cat) => !cat.parent_category)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition"
                >
                  Add category
                </button>
              </form>
              <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                {categories.slice(0, 6).map((cat) => (
                  <div key={cat._id} className="flex items-center justify-between text-sm text-slate-300">
                    <div>
                      <p className="font-semibold text-white">{cat.name}</p>
                      <p className="text-slate-500 text-xs">{cat.description || "—"}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="text-rose-300 hover:text-rose-200 text-xs"
                    >
                      remove
                    </button>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-slate-500 text-sm">No categories yet.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Review moderation */}
        <section className="bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-white text-2xl font-semibold">Comment Moderation</h2>
              <p className="text-slate-400 text-sm">Approve or disapprove customer feedback.</p>
            </div>
            <select
              className="bg-slate-800 text-slate-200 px-4 py-2 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
            >
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No reviews in this state.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-slate-900 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <p>
                        {review.customer_id?.first_name} {review.customer_id?.last_name}
                      </p>
                      <p className="font-semibold text-amber-300">{review.rating}/10</p>
                    </div>
                    <p className="text-white font-semibold mt-2">{review.product_id?.name}</p>
                    <p className="text-slate-300 text-sm mt-3 whitespace-pre-line">{review.comment || "—"}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {review.status !== "approved" && (
                      <button
                        onClick={() => handleReviewDecision(review._id, "approved")}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition text-sm font-semibold"
                      >
                        Approve
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        onClick={() => handleReviewDecision(review._id, "rejected")}
                        className="flex-1 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition text-sm font-semibold"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

