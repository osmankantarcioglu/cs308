import { useNavigate } from 'react-router-dom';

export default function DealsSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {/* Luck Wheel Promo */}
          <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl overflow-hidden p-8 cursor-pointer hover:shadow-lg transition-transform hover:scale-105 duration-300 w-full max-w-2xl text-center"
            onClick={() => navigate('/luck-wheel')}>
            <div className="relative z-10 text-white flex flex-col items-center">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Daily Reward
              </div>
              <h3 className="text-4xl font-bold mb-4">
                Spin & Win!
              </h3>
              <p className="text-white/90 mb-6 text-lg">
                Try your luck for exclusive discounts & points
              </p>
              <button className="px-8 py-3 bg-white text-pink-600 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-md">
                Spin Now
              </button>
            </div>
            {/* Decorative circle/wheel hint */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20 animate-spin" style={{ animationDuration: '10s' }}>
              <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" className="text-white">
                <circle cx="50" cy="50" r="40" strokeDasharray="60 10" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
