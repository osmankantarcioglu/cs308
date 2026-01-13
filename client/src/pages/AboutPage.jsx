import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import FAQSection from "../components/FAQSection";

const milestones = [
  { label: "Happy Customers", value: "120K+" },
  { label: "Products Shipped", value: "350K+" },
  { label: "Vendors", value: "500+" },
  { label: "Support Satisfaction", value: "4.9/5" },
];

export default function AboutPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#faq") {
      const faqEl = document.getElementById("faq");
      if (faqEl) {
        faqEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  return (
    <main className="bg-gray-50">
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            About Us
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            We’re on a mission to make premium tech accessible to everyone.
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            TechHub started with a simple idea: modern gadgets shouldn’t be out
            of reach. Today, we work with top brands and trusted sellers to
            deliver curated devices, fast shipping, and dedicated support—so you
            can spend less time searching and more time enjoying the products
            you love.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {milestones.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow p-6 text-center"
            >
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-2 text-sm uppercase tracking-wide text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Built for modern shoppers
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Whether you’re hunting for the latest flagship phone or stocking
              up on accessories, our marketplace brings you vetted products,
              transparent pricing, and tailored recommendations. We continuously
              analyze customer feedback to refine our catalog and prioritize the
              products people love most.
            </p>
          </div>
          <div className="bg-gray-100 rounded-2xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Trusted partners
              </h3>
              <p className="mt-2 text-gray-600">
                Every seller goes through verification and ongoing quality
                reviews to ensure consistent experiences.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Customer-first support
              </h3>
              <p className="mt-2 text-gray-600">
                Our support agents, product experts, and community moderators
                collaborate to resolve issues quickly.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Responsible operations
              </h3>
              <p className="mt-2 text-gray-600">
                We promote certified refurbished programs, sustainable
                packaging, and safe recycling to reduce e-waste.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-indigo-50 to-blue-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
              Get in Touch
            </p>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Contact Information
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We're here to help! Reach out to us through any of these channels.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Email */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</h3>
                  <p className="mt-1 text-base font-medium text-gray-900">support@techhub.com</p>
                  <p className="mt-1 text-sm text-gray-600">info@techhub.com</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone</h3>
                  <p className="mt-1 text-base font-medium text-gray-900">+1 (555) 123-4567</p>
                  <p className="mt-1 text-sm text-gray-600">Mon-Fri: 9AM-6PM EST</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h3>
                  <p className="mt-1 text-base font-medium text-gray-900">123 Tech Street</p>
                  <p className="mt-1 text-sm text-gray-600">San Francisco, CA 94105</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Contact Info */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Support</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">General Inquiries:</span> support@techhub.com</p>
                  <p><span className="font-medium text-gray-900">Sales:</span> sales@techhub.com</p>
                  <p><span className="font-medium text-gray-900">Returns:</span> returns@techhub.com</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">Monday - Friday:</span> 9:00 AM - 6:00 PM EST</p>
                  <p><span className="font-medium text-gray-900">Saturday:</span> 10:00 AM - 4:00 PM EST</p>
                  <p><span className="font-medium text-gray-900">Sunday:</span> Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </main>
  );
}

