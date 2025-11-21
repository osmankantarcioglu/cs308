import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES_API_URL = "http://localhost:3000/categories";
const PRODUCTS_API_URL = "http://localhost:3000/products";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [items, setItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [itemsError, setItemsError] = useState(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoriesError(null);

        const response = await fetch(`${CATEGORIES_API_URL}?is_active=true&limit=1000`);

        if (!response.ok) {
          throw new Error("Unable to load categories. Please try again.");
        }

        const data = await response.json();

        if (data.success && data.data?.categories) {
          setCategories(data.data.categories);
          if (data.data.categories.length > 0) {
            setSelectedCategoryId(data.data.categories[0]._id);
          }
        } else {
          throw new Error("Received an unexpected response from the server.");
        }
      } catch (error) {
        setCategoriesError(error.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setItems([]);
      return;
    }

    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setItemsError(null);

        const params = new URLSearchParams({
          category: selectedCategoryId,
          limit: "100",
          is_active: "true",
        });

        const response = await fetch(`${PRODUCTS_API_URL}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load items for this category.");
        }

        const data = await response.json();

        if (data.success && data.data?.products) {
          setItems(data.data.products);
        } else {
          throw new Error("Received an unexpected response from the server.");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setItemsError(error.message);
        }
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();

    return () => controller.abort();
  }, [selectedCategoryId]);

  const handleCategorySelect = (categoryId) => {
    if (categoryId === selectedCategoryId) return;
    setSelectedCategoryId(categoryId);
  };

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-gradient-to-r from-primary to-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-wide text-white/80 mb-3">Browse everything</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">All Categories</h1>
          <p className="text-lg max-w-3xl">
            Discover every product collection we offer. Fresh categories become available the instant they are configured.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-10 space-y-10">
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select a category</h2>
              <p className="text-gray-600">Tap a category card to reveal its latest items.</p>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              View all products
            </button>
          </div>

          {loadingCategories ? (
            <div className="py-20 flex flex-col items-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
              Loading categories...
            </div>
          ) : categoriesError ? (
            <div className="py-12 text-center">
              <p className="text-red-500 font-semibold mb-2">Unable to load categories</p>
              <p className="text-gray-600">{categoriesError}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600">No categories have been configured yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => {
                const isSelected = category._id === selectedCategoryId;
                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => handleCategorySelect(category._id)}
                    className={`group h-full text-left rounded-2xl border-2 p-5 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                        : "border-gray-100 hover:border-primary/70 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-semibold ${
                          isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.name?.charAt(0) ?? "?"}
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          isSelected ? "text-primary rotate-12" : "text-gray-400 group-hover:text-primary"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{category.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description?.trim() || "No description has been provided yet."}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Featured items</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory ? selectedCategory.name : "Pick a category to get started"}
              </h2>
              {selectedCategory && (
                <p className="text-gray-600">
                  Presenting the most recent products associated with this collection.
                </p>
              )}
            </div>
            {selectedCategory && (
              <button
                onClick={() => navigate(`/products?category=${selectedCategory._id}`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
              >
                Browse full category
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <div className="py-16 text-center text-gray-600">
              Choose a category above to see its products.
            </div>
          ) : loadingItems ? (
            <div className="py-16 flex flex-col items-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
              Loading items...
            </div>
          ) : itemsError ? (
            <div className="py-12 text-center">
              <p className="text-red-500 font-semibold mb-2">Unable to load items</p>
              <p className="text-gray-600">{itemsError}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              No products are currently available for this category. As soon as new items are added, they will appear here automatically.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewProduct(item._id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewProduct(item._id);
                    }
                  }}
                  className="group h-full bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="relative aspect-video bg-white">
                    {item.images?.length ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-4xl">
                        📦
                      </div>
                    )}
                    {item.quantity === 0 && (
                      <span className="absolute top-3 left-3 text-xs font-semibold bg-red-500 text-white px-3 py-1 rounded-full">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {item.category?.name || "Uncategorized"}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        ${item.price ? item.price.toFixed(2) : "0.00"}
                      </span>
                      <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                        View item
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


