export default function PrivacyPolicyPage() {
  return (
    <main className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
        <header>
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            Privacy Policy
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            Your privacy, protected.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            This policy explains how TechHub collects, uses, stores, and
            safeguards personal data whenever you browse, create an account,
            place an order, or interact with our services.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Information we collect
          </h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>Account basics: name, email, shipping addresses, and password</li>
            <li>Order details: products purchased, payment confirmations, invoices</li>
            <li>
              Usage data: device info, browser type, pages viewed, and support interactions
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            How we use your information
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Data enables us to fulfill orders, personalize recommendations, prevent
            fraud, and offer customer support. We never sell personal information
            and only share data with trusted processors (payments, logistics, analytics)
            required to deliver TechHub services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Your rights</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            You can review, update, export, or delete your information from the profile
            dashboard or by contacting privacy@techhub.com. We respond to all requests
            within 30 days and comply with GDPR, CCPA, and other regional regulations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Data retention</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Order records are retained as required for invoicing, taxation, and legal
            compliance. Other data is minimized and deleted when no longer necessary
            or after you request removal.
          </p>
        </section>
      </div>
    </main>
  );
}

