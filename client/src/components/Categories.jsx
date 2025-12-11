import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CATEGORIES_API_URL = "http://localhost:3000/categories";
const PRODUCTS_API_URL = "http://localhost:3000/products";

const categoryIcons = {
  "Smartphones": "📱",
  "Laptops": "💻",
  "Tablets": "📲",
  "Headphones": "🎧",
  "Smart Watches": "⌚",
  "Cameras": "📷",
  "Gaming": "🎮",
  "Accessories": "🔌",
  "Default": "📦"
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CATEGORIES_API_URL}?is_active=true&limit=100`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.categories) {
            const fetchedCategories = data.data.categories;
            setCategories(fetchedCategories);
            
            // Fetch product counts for each category
            const countPromises = fetchedCategories.map(async (category) => {
              try {
                const productsResponse = await fetch(`${PRODUCTS_API_URL}?category=${category._id}&limit=1`);
                if (productsResponse.ok) {
                  const productsData = await productsResponse.json();
                  return {
                    categoryId: category._id,
                    count: productsData.data?.pagination?.total || 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching product count for category ${category._id}:`, error);
              }
              return { categoryId: category._id, count: 0 };
            });
            
            const counts = await Promise.all(countPromises);
            const countsMap = {};
            counts.forEach(c => {
              countsMap[c.categoryId] = c.count;
            });
            setCategoryCounts(countsMap);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);


  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName] || categoryIcons.Default;
  };

  const formatCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+ items`;
    }
    return `${count} item${count !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our wide range of tech products across multiple categories
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all block"
              >
                <div className="text-5xl mb-3">
                  {getCategoryIcon(category.name)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatCount(categoryCounts[category._id] || 0)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
