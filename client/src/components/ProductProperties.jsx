import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000/products";

export default function ProductProperties() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch a sample of products to display their properties
        const response = await fetch(`${API_BASE_URL}?limit=6`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.products) {
            setProducts(data.data.products);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product properties...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Product Properties
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore the detailed properties of our products including ID, name, model, and more
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{product.name}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Product ID:</span>
                      <span className="text-sm text-gray-900 font-mono text-right max-w-[60%] break-all">
                        {product._id}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Name:</span>
                      <span className="text-sm text-gray-900 text-right max-w-[60%]">
                        {product.name}
                      </span>
                    </div>

                    {product.model && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">Model:</span>
                        <span className="text-sm text-gray-900 text-right max-w-[60%]">
                          {product.model}
                        </span>
                      </div>
                    )}

                    {product.serial_number && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">Serial Number:</span>
                        <span className="text-sm text-gray-900 font-mono text-right max-w-[60%] break-all">
                          {product.serial_number}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Category:</span>
                      <span className="text-sm text-gray-900 text-right max-w-[60%]">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Price:</span>
                      <span className="text-sm text-gray-900 font-semibold text-right">
                        ${product.price ? product.price.toFixed(2) : "0.00"}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Quantity:</span>
                      <span className="text-sm text-gray-900 text-right">
                        {product.quantity || 0}
                      </span>
                    </div>

                    {product.warranty_status && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">Warranty:</span>
                        <span className="text-sm text-gray-900 text-right max-w-[60%]">
                          {product.warranty_status}
                        </span>
                      </div>
                    )}

                    {product.distributor && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">Distributor:</span>
                        <span className="text-sm text-gray-900 text-right max-w-[60%]">
                          {product.distributor}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Views:</span>
                      <span className="text-sm text-gray-900 text-right">
                        {product.view_count || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-start py-2">
                      <span className="text-sm font-semibold text-gray-600">Status:</span>
                      <span className={`text-sm font-semibold text-right ${
                        product.is_active ? "text-green-600" : "text-red-600"
                      }`}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/products/${product._id}`}
                    className="mt-4 block w-full text-center py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    View Full Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-primary font-semibold hover:text-primary-dark transition-colors"
          >
            <span>View All Products</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

