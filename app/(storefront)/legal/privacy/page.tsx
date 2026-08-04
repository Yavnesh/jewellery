export const metadata = {
  title: 'Privacy Policy | Vamika',
  description: 'Our privacy policy detailing how we manage your data securely.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-[80px]">
      <div className="prose prose-lg prose-gold max-w-none">
        <h1 className="text-4xl font-serif text-[#D4AF37] mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: August 2026</p>
        
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] This is a placeholder for the official privacy policy. It should detail how customer data is collected, processed, and protected in compliance with regional laws (GDPR, CCPA, etc.).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">2. Data Collection</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] Describe the types of data collected, including names, addresses, payment information, and browsing analytics. Mention the use of cookies and tracking technologies.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-4">3. Data Security</h2>
          <p className="text-gray-600 mb-4">
            [Legal placeholder] Outline the security measures in place to protect customer data, such as encryption, secure payment processing, and internal access controls.
          </p>
        </section>
      </div>
    </div>
  );
}
