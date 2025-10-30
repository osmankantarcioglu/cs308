const categories = [
  { name: "Smartphones", icon: "📱", count: "2.5K+ items" },
  { name: "Laptops", icon: "💻", count: "1.8K+ items" },
  { name: "Tablets", icon: "📲", count: "850+ items" },
  { name: "Headphones", icon: "🎧", count: "1.2K+ items" },
  { name: "Smart Watches", icon: "⌚", count: "650+ items" },
  { name: "Cameras", icon: "📷", count: "920+ items" },
  { name: "Gaming", icon: "🎮", count: "1.5K+ items" },
  { name: "Accessories", icon: "🔌", count: "3K+ items" },
];

export default function Categories() {
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category) => (
            <button
              key={category.name}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="text-5xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">{category.count}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
