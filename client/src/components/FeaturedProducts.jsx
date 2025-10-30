const products = [
  {
    id: 1,
    name: "MacBook Pro 16\"",
    category: "Laptops",
    price: 2499,
    originalPrice: 2799,
    rating: 4.8,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    badge: "Best Seller",
    badgeColor: "bg-blue-500"
  },
  {
    id: 2,
    name: "Sony WH-1000XM5",
    category: "Headphones",
    price: 399,
    originalPrice: 449,
    rating: 4.9,
    reviews: 856,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80",
    badge: "Hot Deal",
    badgeColor: "bg-red-500"
  },
  {
    id: 3,
    name: "iPad Pro 12.9\"",
    category: "Tablets",
    price: 1099,
    originalPrice: 1299,
    rating: 4.7,
    reviews: 523,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    badge: "New",
    badgeColor: "bg-green-500"
  },
  {
    id: 4,
    name: "Samsung Galaxy S24",
    category: "Smartphones",
    price: 899,
    originalPrice: 999,
    rating: 4.6,
    reviews: 1240,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    badge: "Trending",
    badgeColor: "bg-purple-500"
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600">
              Check out our hand-picked selection of the best tech products
            </p>
          </div>
          <button className="hidden sm:block text-primary font-semibold hover:text-primary-dark transition-colors">
            View All →
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className={`absolute top-4 left-4 ${product.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {product.badge}
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="text-xs text-gray-500 mb-2">{product.category}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-3">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                  <span className="text-sm text-gray-500">({product.reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                </div>

                {/* Add to Cart Button */}
                <button className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-primary transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <button className="text-primary font-semibold hover:text-primary-dark transition-colors">
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}
