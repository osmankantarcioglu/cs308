export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="inline-block">
              <span className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                🎉 New Arrivals 2025
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Premium Tech
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                At Your Fingertips
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl">
              Discover the latest smartphones, laptops, and gadgets from top brands. 
              Unbeatable prices, free shipping, and 2-year warranty on all products.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                Shop Now
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-primary transition-colors">
                View Deals
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">100K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Brands</div>
              </div>
            </div>
          </div>

          {/* Right Content - Featured Product */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-6">
                <img
                  src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80"
                  alt="Featured Product"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">iPhone 15 Pro Max</h3>
                  <p className="text-gray-600">Latest flagship with A17 Pro chip</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-primary">$1,199</span>
                  <span className="text-lg text-gray-400 line-through">$1,399</span>
                  <span className="text-sm font-semibold text-success bg-success/10 px-2 py-1 rounded">Save $200</span>
                </div>
                <button className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
    </section>
  );
}
