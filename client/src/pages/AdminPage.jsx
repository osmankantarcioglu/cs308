import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000";

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  SALES_MANAGER: "sales_manager",
  PRODUCT_MANAGER: "product_manager",
  SUPPORT_AGENT: "support_agent",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users"); // "users", "categories", or "products"
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [allCategories, setAllCategories] = useState([]); // For parent category dropdown
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters for users
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters for categories
  const [categoryStatusFilter, setCategoryStatusFilter] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  
  // Filters for products
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  
  // Modal states for users
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHardDeleteUserModal, setShowHardDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal states for categories
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showHardDeleteCategoryModal, setShowHardDeleteCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal states for products
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [showHardDeleteProductModal, setShowHardDeleteProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states for users
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: USER_ROLES.CUSTOMER,
    phone_number: "",
    taxID: "",
    home_address: "",
    is_active: true,
    language: "en",
  });

  // Form states for categories
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    parent_category: "",
    is_active: true,
  });
  
  // Form states for products
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    quantity: 0,
    price: 0,
    cost: 0,
    category: "",
    is_active: true,
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "categories") {
      fetchCategories();
      fetchAllCategories(); // For parent category dropdown
    } else if (activeTab === "products") {
      fetchProducts();
      fetchAllCategories(); // For category dropdown
    }
  }, [roleFilter, statusFilter, searchTerm, currentPage, activeTab, navigate, categoryStatusFilter, categorySearchTerm, categoryCurrentPage, productStatusFilter, productSearchTerm, productCurrentPage]);

  // Fetch all categories for parent dropdown
  const fetchAllCategories = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/categories?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllCategories(data.data.categories || []);
      }
    } catch (err) {
      // Silently fail - not critical
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to access admin panel");
        return;
      }

      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter !== "") params.append("is_active", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage);
      params.append("limit", "20");

      const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token missing/expired or role not allowed -> force re-login
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setError("Unauthorized. Admin access required.");
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // Category functions
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to access admin panel");
        return;
      }

      const params = new URLSearchParams();
      if (categoryStatusFilter !== "") params.append("is_active", categoryStatusFilter);
      if (categorySearchTerm) params.append("search", categorySearchTerm);
      params.append("page", categoryCurrentPage);
      params.append("limit", "20");

      const response = await fetch(`${API_BASE_URL}/categories?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setError("Unauthorized. Admin access required.");
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.data.categories);
      setCategoryTotalPages(data.data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const payload = {
        ...categoryFormData,
        parent_category: categoryFormData.parent_category || null,
      };

      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      setSuccess("Category created successfully!");
      setShowAddCategoryModal(false);
      setCategoryFormData({ name: "", description: "", parent_category: "", is_active: true });
      fetchCategories();
      fetchAllCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const payload = {
        ...categoryFormData,
        parent_category: categoryFormData.parent_category || null,
      };

      const response = await fetch(`${API_BASE_URL}/categories/${selectedCategory._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      setSuccess("Category updated successfully!");
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
      setCategoryFormData({ name: "", description: "", parent_category: "", is_active: true });
      fetchCategories();
      fetchAllCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/categories/${selectedCategory._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      setSuccess("Category deactivated successfully!");
      setShowDeleteCategoryModal(false);
      setSelectedCategory(null);
      fetchCategories();
      fetchAllCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHardDeleteCategory = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/categories/${selectedCategory._id}/hard`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to permanently delete category");
      }

      setSuccess("Category permanently deleted!");
      setShowHardDeleteCategoryModal(false);
      setSelectedCategory(null);
      fetchCategories();
      fetchAllCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const openHardDeleteCategoryModal = (category) => {
    setSelectedCategory(category);
    setShowHardDeleteCategoryModal(true);
  };

  const handleActivateCategory = async (categoryId) => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to activate category");
      }

      setSuccess("Category activated successfully!");
      fetchCategories();
      fetchAllCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditCategoryModal = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name || "",
      description: category.description || "",
      parent_category: category.parent_category?._id || category.parent_category || "",
      is_active: category.is_active !== undefined ? category.is_active : true,
    });
    setShowEditCategoryModal(true);
  };

  const openDeleteCategoryModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", description: "", parent_category: "", is_active: true });
  };

  // Product functions
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to access admin panel");
        return;
      }

      const params = new URLSearchParams();
      if (productStatusFilter !== "") params.append("is_active", productStatusFilter);
      if (productSearchTerm) params.append("search", productSearchTerm);
      params.append("page", productCurrentPage);
      params.append("limit", "20");

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setError("Unauthorized. Admin access required.");
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.data.products);
      setProductTotalPages(data.data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      setSuccess("Product created successfully!");
      setShowAddProductModal(false);
      setProductFormData({ name: "", description: "", quantity: 0, price: 0, cost: 0, category: "", is_active: true });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      setSuccess("Product updated successfully!");
      setShowEditProductModal(false);
      setSelectedProduct(null);
      setProductFormData({ name: "", description: "", quantity: 0, price: 0, cost: 0, category: "", is_active: true });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/products/${selectedProduct._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setSuccess("Product deactivated successfully!");
      setShowDeleteProductModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHardDeleteProduct = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/products/${selectedProduct._id}/hard`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to permanently delete product");
      }

      setSuccess("Product permanently deleted!");
      setShowHardDeleteProductModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateProduct = async (productId) => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to activate product");
      }

      setSuccess("Product activated successfully!");
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditProductModal = (product) => {
    setSelectedProduct(product);
    setProductFormData({
      name: product.name || "",
      description: product.description || "",
      quantity: product.quantity || 0,
      price: product.price || 0,
      cost: product.cost || 0,
      category: product.category?._id || product.category || "",
      is_active: product.is_active !== undefined ? product.is_active : true,
    });
    setShowEditProductModal(true);
  };

  const openDeleteProductModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteProductModal(true);
  };

  const openHardDeleteProductModal = (product) => {
    setSelectedProduct(product);
    setShowHardDeleteProductModal(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      setSuccess("User created successfully!");
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token = getAuthToken();

      const { password, ...updateData } = formData;
      const body = password ? formData : updateData;

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      setSuccess("User updated successfully!");
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      setSuccess("User deactivated successfully!");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHardDeleteUser = async () => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}/hard`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to permanently delete user");
      }

      setSuccess("User permanently deleted!");
      setShowHardDeleteUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const openHardDeleteUserModal = (user) => {
    setSelectedUser(user);
    setShowHardDeleteUserModal(true);
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      setSuccess("User role updated successfully!");
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      setError(null);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to activate user");
      }

      setSuccess("User activated successfully!");
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || "",
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || USER_ROLES.CUSTOMER,
      phone_number: user.phone_number || "",
      taxID: user.taxID || "",
      home_address: user.home_address || "",
      is_active: user.is_active !== undefined ? user.is_active : true,
      language: user.language || "en",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: USER_ROLES.CUSTOMER,
      phone_number: "",
      taxID: "",
      home_address: "",
      is_active: true,
      language: "en",
    });
  };

  const formatRole = (role) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if ((activeTab === "users" && usersLoading && users.length === 0) || 
      (activeTab === "categories" && categoriesLoading && categories.length === 0) ||
      (activeTab === "products" && productsLoading && products.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users and system settings</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Products
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value={USER_ROLES.ADMIN}>Admin</option>
                <option value={USER_ROLES.CUSTOMER}>Customer</option>
                <option value={USER_ROLES.SALES_MANAGER}>Sales Manager</option>
                <option value={USER_ROLES.PRODUCT_MANAGER}>Product Manager</option>
                <option value={USER_ROLES.SUPPORT_AGENT}>Support Agent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {formatRole(user.role)}
                        </span>
                        {user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.CUSTOMER && (
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value={USER_ROLES.SALES_MANAGER}>Sales Manager</option>
                            <option value={USER_ROLES.PRODUCT_MANAGER}>Product Manager</option>
                            <option value={USER_ROLES.SUPPORT_AGENT}>Support Agent</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => openHardDeleteUserModal(user)}
                        className="text-red-800 hover:text-red-900 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New User</h2>
              <form onSubmit={handleAddUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({ ...formData, first_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({ ...formData, last_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={USER_ROLES.CUSTOMER}>Customer</option>
                      <option value={USER_ROLES.SALES_MANAGER}>Sales Manager</option>
                      <option value={USER_ROLES.PRODUCT_MANAGER}>Product Manager</option>
                      <option value={USER_ROLES.SUPPORT_AGENT}>Support Agent</option>
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxID}
                      onChange={(e) => setFormData({ ...formData, taxID: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Address
                    </label>
                    <input
                      type="text"
                      value={formData.home_address}
                      onChange={(e) =>
                        setFormData({ ...formData, home_address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={handleEditUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({ ...formData, first_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({ ...formData, last_name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={USER_ROLES.CUSTOMER}>Customer</option>
                      <option value={USER_ROLES.SALES_MANAGER}>Sales Manager</option>
                      <option value={USER_ROLES.PRODUCT_MANAGER}>Product Manager</option>
                      <option value={USER_ROLES.SUPPORT_AGENT}>Support Agent</option>
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxID}
                      onChange={(e) => setFormData({ ...formData, taxID: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Address
                    </label>
                    <input
                      type="text"
                      value={formData.home_address}
                      onChange={(e) =>
                        setFormData({ ...formData, home_address: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Confirm Deactivation</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to deactivate {selectedUser.first_name}{" "}
                {selectedUser.last_name} ({selectedUser.email})? This action can be reversed
                later.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hard Delete User Confirmation Modal */}
        {showHardDeleteUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Permanent Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to <strong>permanently delete</strong> {selectedUser.first_name}{" "}
                {selectedUser.last_name} ({selectedUser.email})? This action <strong>cannot be undone</strong>.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowHardDeleteUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardDeleteUser}
                  className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-900"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={categorySearchTerm}
                    onChange={(e) => {
                      setCategorySearchTerm(e.target.value);
                      setCategoryCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={categoryStatusFilter}
                    onChange={(e) => {
                      setCategoryStatusFilter(e.target.value);
                      setCategoryCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowAddCategoryModal(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add New Category
                  </button>
                </div>
              </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent Category
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
                    {categories.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {category.description || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {category.parent_category?.name || "None"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              category.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openEditCategoryModal(category)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {category.is_active ? (
                            <button
                              onClick={() => openDeleteCategoryModal(category)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateCategory(category._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openHardDeleteCategoryModal(category)}
                            className="text-red-800 hover:text-red-900 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {categoryTotalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCategoryCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={categoryCurrentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCategoryCurrentPage((p) => Math.min(categoryTotalPages, p + 1))}
                      disabled={categoryCurrentPage === categoryTotalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{categoryCurrentPage}</span> of{" "}
                        <span className="font-medium">{categoryTotalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCategoryCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={categoryCurrentPage === 1}
                          className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCategoryCurrentPage((p) => Math.min(categoryTotalPages, p + 1))}
                          disabled={categoryCurrentPage === categoryTotalPages}
                          className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Category Modal */}
            {showAddCategoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Add New Category</h2>
                  <form onSubmit={handleAddCategory}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryFormData.name}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={categoryFormData.description}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Category
                        </label>
                        <select
                          value={categoryFormData.parent_category}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, parent_category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">None (Top Level)</option>
                          {allCategories
                            .filter((cat) => cat._id !== selectedCategory?._id && cat.is_active)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryFormData.is_active}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategoryModal(false);
                          resetCategoryForm();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Category Modal */}
            {showEditCategoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Edit Category</h2>
                  <form onSubmit={handleEditCategory}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryFormData.name}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={categoryFormData.description}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Category
                        </label>
                        <select
                          value={categoryFormData.parent_category}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, parent_category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">None (Top Level)</option>
                          {allCategories
                            .filter((cat) => cat._id !== selectedCategory?._id && cat.is_active)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryFormData.is_active}
                          onChange={(e) =>
                            setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditCategoryModal(false);
                          setSelectedCategory(null);
                          resetCategoryForm();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Update Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Category Confirmation Modal */}
            {showDeleteCategoryModal && selectedCategory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4">Confirm Deactivation</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to deactivate "{selectedCategory.name}"? This action can
                    be reversed later.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteCategoryModal(false);
                        setSelectedCategory(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteCategory}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hard Delete Category Confirmation Modal */}
            {showHardDeleteCategoryModal && selectedCategory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Permanent Delete</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to <strong>permanently delete</strong> "{selectedCategory.name}"? 
                    This action <strong>cannot be undone</strong>. Make sure there are no subcategories or products associated with this category.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowHardDeleteCategoryModal(false);
                        setSelectedCategory(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleHardDeleteCategory}
                      className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-900"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setProductCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={productStatusFilter}
                    onChange={(e) => {
                      setProductStatusFilter(e.target.value);
                      setProductCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add New Product
                  </button>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
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
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {product.description || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {product.category?.name || "Uncategorized"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${product.price?.toFixed(2) || "0.00"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.quantity || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openEditProductModal(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {product.is_active ? (
                            <button
                              onClick={() => openDeleteProductModal(product)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateProduct(product._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => openHardDeleteProductModal(product)}
                            className="text-red-800 hover:text-red-900 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {productTotalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setProductCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={productCurrentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setProductCurrentPage((p) => Math.min(productTotalPages, p + 1))}
                      disabled={productCurrentPage === productTotalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{productCurrentPage}</span> of{" "}
                        <span className="font-medium">{productTotalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setProductCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={productCurrentPage === 1}
                          className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setProductCurrentPage((p) => Math.min(productTotalPages, p + 1))}
                          disabled={productCurrentPage === productTotalPages}
                          className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                  <form onSubmit={handleAddProduct}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={productFormData.name}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          required
                          value={productFormData.description}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows="3"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={productFormData.price}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            required
                            value={productFormData.quantity}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, quantity: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={productFormData.category}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Category</option>
                          {allCategories
                            .filter((cat) => cat.is_active)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productFormData.is_active}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, is_active: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddProductModal(false);
                          setProductFormData({ name: "", description: "", quantity: 0, price: 0, cost: 0, category: "", is_active: true });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Product Modal */}
            {showEditProductModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Edit Product</h2>
                  <form onSubmit={handleEditProduct}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={productFormData.name}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          required
                          value={productFormData.description}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows="3"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={productFormData.price}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            required
                            value={productFormData.quantity}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, quantity: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={productFormData.category}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, category: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select Category</option>
                          {allCategories
                            .filter((cat) => cat.is_active)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productFormData.is_active}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, is_active: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditProductModal(false);
                          setSelectedProduct(null);
                          setProductFormData({ name: "", description: "", quantity: 0, price: 0, cost: 0, category: "", is_active: true });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Update Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Product Confirmation Modal */}
            {showDeleteProductModal && selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4">Confirm Deactivation</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to deactivate "{selectedProduct.name}"? This action can be reversed later.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteProductModal(false);
                        setSelectedProduct(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hard Delete Product Confirmation Modal */}
            {showHardDeleteProductModal && selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Permanent Delete</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to <strong>permanently delete</strong> "{selectedProduct.name}"? 
                    This action <strong>cannot be undone</strong>.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowHardDeleteProductModal(false);
                        setSelectedProduct(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleHardDeleteProduct}
                      className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-900"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

