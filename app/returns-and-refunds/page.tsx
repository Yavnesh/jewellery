import LegalPageLayout from "@/components/LegalPageLayout";
import { BRAND_NAME } from "@/utils/brand";

export default function ReturnsAndRefunds() {
  return (
    <LegalPageLayout title="Returns and Refunds" lastUpdated="January 1, 2024">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 text-sm">
          <strong>DISCLAIMER:</strong> This is a placeholder Returns policy.
        </p>
      </div>

      <h2>1. Return Policy</h2>
      <p>
        We want you to be completely satisfied with your luxury purchase. If for any reason you are not, we offer a 30-day return policy for most items.
      </p>

      <h2>2. Eligibility for Returns</h2>
      <ul>
        <li>Items must be unworn, in their original condition, and with all tags attached.</li>
        <li>Custom, engraved, or personalized items are strictly non-refundable.</li>
        <li>Original certification documents (if provided) must be returned with the item.</li>
      </ul>

      <h2>3. Refund Process</h2>
      <p>
        Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to the original method of payment within 7-10 business days.
      </p>
    </LegalPageLayout>
  );
}
