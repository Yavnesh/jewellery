export const metadata = {
  title: 'Privacy Policy | Vamika',
  description: 'Our privacy policy detailing how we manage your data securely.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-luxury-bg min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-luxury-text-primary mb-2 text-center tracking-wide">
          Privacy Policy
        </h1>
        <p className="text-sm font-sans text-luxury-text-secondary mb-10 text-center tracking-widest uppercase">
          Last Updated: August 2026
        </p>
        
        <div className="bg-luxury-ivory border border-luxury-border/60 p-8 md:p-12 rounded-sm shadow-sm">
          <section className="mb-10">
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              1. Introduction
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed mb-4">
              [Legal placeholder] This is a placeholder for the official privacy policy. It should detail how customer data is collected, processed, and protected in compliance with regional laws (GDPR, CCPA, etc.).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              2. Data Collection
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed mb-4">
              [Legal placeholder] Describe the types of data collected, including names, addresses, payment information, and browsing analytics. Mention the use of cookies and tracking technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              3. Data Security
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed">
              [Legal placeholder] Outline the security measures in place to protect customer data, such as encryption, secure payment processing, and internal access controls.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
