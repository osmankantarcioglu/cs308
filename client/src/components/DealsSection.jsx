export default function DealsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Deal 1 - Large Card */}
          <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl overflow-hidden p-8 lg:p-12">
            <div className="relative z-10 text-white">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Limited Time Offer
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                Up to 40% OFF
                <br />
                On Laptops
              </h3>
              <p className="text-white/90 mb-6 max-w-md">
                Get incredible discounts on premium laptops from top brands. Offer ends soon!
              </p>
              <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Shop Laptops
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-64 opacity-20">
              <svg viewBox="0 0 200 200" fill="currentColor" className="text-white">
                <path d="M40 40h120v120H40z" />
              </svg>
            </div>
          </div>

          {/* Deal 2 & 3 - Stacked Cards */}
          <div className="space-y-6">
            {/* Deal 2 */}
            <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl overflow-hidden p-8">
              <div className="relative z-10 text-white">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-3">
                  Flash Sale
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Gaming Gear Sale
                </h3>
                <p className="text-white/90 mb-4">
                  Save big on gaming accessories
                </p>
                <button className="px-6 py-2.5 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                  Shop Now
                </button>
              </div>
            </div>

            {/* Deal 3 */}
            <div className="relative bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl overflow-hidden p-8">
              <div className="relative z-10 text-white">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-3">
                  New Arrival
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Smart Home Devices
                </h3>
                <p className="text-white/90 mb-4">
                  Explore the latest smart tech
                </p>
                <button className="px-6 py-2.5 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                  Discover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
