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

      <FAQSection />
    </main>
  );
}

