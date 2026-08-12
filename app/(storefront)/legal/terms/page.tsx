export const metadata = {
  title: 'Terms of Service | Vamika',
  description: 'Terms and conditions for using the Vamika e-commerce platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-luxury-bg min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif text-luxury-text-primary mb-2 text-center tracking-wide">
          Terms of Service
        </h1>
        <p className="text-sm font-sans text-luxury-text-secondary mb-10 text-center tracking-widest uppercase">
          Last Updated: August 2026
        </p>
        
        <div className="bg-luxury-ivory border border-luxury-border/60 p-8 md:p-12 rounded-sm shadow-sm">
          <section className="mb-10">
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed mb-4">
              [Legal placeholder] By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              2. Product Information and Pricing
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed mb-4">
              [Legal placeholder] Describe policies regarding product descriptions, pricing accuracy, and the right to cancel orders due to pricing errors or inventory unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-luxury-text-primary border-b border-luxury-border/40 pb-3 mb-4">
              3. User Accounts
            </h2>
            <p className="text-sm font-sans text-luxury-text-secondary leading-relaxed">
              [Legal placeholder] State the user's responsibility for maintaining the confidentiality of their account and password.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
