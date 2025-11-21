export default function TermsOfServicePage() {
  return (
    <main className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10">
        <header>
          <p className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">
            Terms of Service
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
            Guidelines for using TechHub.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            These terms describe the rules for accessing our marketplace, making
            purchases, publishing reviews, and interacting with the TechHub community.
          </p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Using our services</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            You must be at least 18 years old (or have guardian consent) to create
            an account. Keep your credentials safe, provide accurate information, and
            follow all applicable laws while buying or selling on TechHub.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Orders and billing</h2>
          <ul className="mt-4 space-y-3 text-gray-600">
            <li>Prices include applicable taxes and will always be shown before checkout.</li>
            <li>Payments are processed securely through our verified providers.</li>
            <li>Returns, refunds, and warranty claims follow the policy shown at purchase time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Content and conduct</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Reviews, images, and chats must remain respectful and accurate. We may
            remove content that violates laws, infringes intellectual property, or
            harasses other members. Repeated violations can lead to account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Disputes</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Most issues are resolved through support, but unresolved disputes will be
            handled via binding arbitration in your jurisdiction unless local law
            requires a different forum. Contact legal@techhub.com before filing claims.
          </p>
        </section>
      </div>
    </main>
  );
}

