import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES_API_URL = "http://localhost:3000/categories";
const MAX_CATEGORY_CARDS = 8;

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CATEGORIES_API_URL}?is_active=true&limit=1000`);
        if (!response.ok) {
          throw new Error("Unable to load categories right now.");
        }
        const data = await response.json();
        if (isMounted && data.success && data.data?.categories) {
          setCategories(data.data.categories.slice(0, MAX_CATEGORY_CARDS));
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || "Something went wrong while loading categories.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (categoryId) => {
    if (!categoryId) return;
    navigate(`/categories?category=${categoryId}`);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-wide text-primary font-semibold mb-2">
            Shop by category
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Explore our collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Jump directly into any collection. New categories appear here the moment they are configured.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading categories...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-500">{error}</div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No categories available yet.</div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category) => (
            <button
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all text-left"
            >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-lg font-semibold text-gray-700">
                    {category.name?.charAt(0) ?? "?"}
                  </span>
                  <svg
                    className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {category.description?.trim() || "Browse the latest arrivals in this collection."}
                </p>
            </button>
          ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/categories")}
            className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
          >
            View all categories
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
