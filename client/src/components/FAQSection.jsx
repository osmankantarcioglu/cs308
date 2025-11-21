import { useState } from "react";

const faqs = [
  {
    question: "What shipping options are available?",
    answer:
      "We offer standard (3-5 business days) and express (1-2 business days) shipping. Delivery times are estimated at checkout based on your address.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. Once your order ships, you’ll receive an email with a tracking link. You can also find the tracking status on your profile page under Order History.",
  },
  {
    question: "What is the return policy?",
    answer:
      "Items can be returned within 30 days of delivery as long as they’re unused and in the original packaging. Start a return from your profile or contact support.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Our support team is available 7 days a week via live chat and email. Expect responses within a few hours during business days.",
  },
  {
    question: "How do discounts and promo codes work?",
    answer:
      "Apply your promo code at checkout and the discount will appear before you place the order. Each code has specific terms, so review them before applying.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleQuestion = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            FAQ
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-gray-500">
            Quick answers for the most common questions from our shoppers.
          </p>
        </div>
        <dl className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="border border-gray-200 rounded-lg shadow-sm"
              >
                <dt>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => toggleQuestion(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg font-medium text-gray-900">
                      {faq.question}
                    </span>
                    <svg
                      className={`h-5 w-5 text-indigo-600 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.02 1.1l-4.24 3.83a.75.75 0 01-1.02 0l-4.24-3.83a.75.75 0 01.02-1.1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </dt>
                <dd
                  className={`px-6 pb-6 text-gray-600 text-base leading-relaxed transition-all duration-200 ${
                    isOpen ? "block" : "hidden"
                  }`}
                >
                  {faq.answer}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

