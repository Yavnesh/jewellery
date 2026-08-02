import LegalPageLayout from "@/components/LegalPageLayout";
import { BRAND_NAME } from "@/utils/brand";

export default function ShippingPolicy() {
  return (
    <LegalPageLayout title="Shipping Policy" lastUpdated="January 1, 2024">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 text-sm">
          <strong>DISCLAIMER:</strong> This is a placeholder Shipping policy.
        </p>
      </div>

      <h2>1. Processing Time</h2>
      <p>
        All orders are subject to a processing time of 1-3 business days. Custom or engraved pieces may require an additional 5-7 business days for processing before they are shipped.
      </p>

      <h2>2. Shipping Methods and Rates</h2>
      <p>
        We offer fully insured, expedited shipping on all our luxury jewelry. Signature is required upon delivery for all orders over $500 to ensure the secure arrival of your package.
      </p>
      <ul>
        <li><strong>Standard Secure Shipping:</strong> 3-5 Business Days (Free on orders over $1,000)</li>
        <li><strong>Next-Day Priority:</strong> 1 Business Day (Calculated at checkout)</li>
      </ul>

      <h2>3. International Shipping</h2>
      <p>
        Currently, we ship to select international destinations. Please note that international orders may be subject to customs duties and taxes which are the responsibility of the customer.
      </p>
    </LegalPageLayout>
  );
}
