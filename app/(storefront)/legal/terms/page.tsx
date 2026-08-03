export const metadata = {
  title: 'Terms of Service | Tanishq',
  description: 'Terms and conditions for using the Tanishq e-commerce platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-[80px]">
      <div className="prose prose-lg prose-gold max-w-none">
        <h1 className="text-4xl font-serif text-[#D4AF37] mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: August 2026</p>
        
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">2. Product Information and Pricing</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] Describe policies regarding product descriptions, pricing accuracy, and the right to cancel orders due to pricing errors or inventory unavailability.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">3. User Accounts</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] State the user's responsibility for maintaining the confidentiality of their account and password.
          </p>
        </section>
      </div>
    </div>
  );
}
