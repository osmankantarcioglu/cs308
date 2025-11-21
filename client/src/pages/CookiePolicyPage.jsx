export default function CookiePolicyPage() {
  return (
    <main className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
        <header>
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            Cookie Policy
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            How TechHub uses cookies.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Cookies and similar technologies help us keep your session secure,
            remember preferences, and understand how visitors use the platform.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Types of cookies</h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>
              <strong className="text-gray-900">Essential:</strong> Required for sign-in,
              cart persistence, and secure checkout.
            </li>
            <li>
              <strong className="text-gray-900">Performance:</strong> Gather anonymous usage
              stats to improve speed and reliability.
            </li>
            <li>
              <strong className="text-gray-900">Personalization:</strong> Remember preferences
              like language, currency, and product filters.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Managing cookies</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            You can disable or delete cookies via browser settings. Essential cookies
            are required for core features, but analytics and personalization cookies
            are optional and can be opted out at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Third-party tools</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            We partner with analytics and advertising providers who may set their own
            cookies. They only collect aggregated usage data and cannot identify you
            directly without your consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Questions</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Reach out to privacy@techhub.com if you have questions about specific cookies,
            retention timelines, or consent preferences.
          </p>
        </section>
      </div>
    </main>
  );
}

