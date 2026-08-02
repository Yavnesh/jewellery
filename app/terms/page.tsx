import LegalPageLayout from "@/components/LegalPageLayout";
import { BRAND_NAME } from "@/utils/brand";

export default function TermsOfService() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="January 1, 2024">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 text-sm">
          <strong>DISCLAIMER:</strong> This is a placeholder Terms of Service. It has not been reviewed by legal counsel and does not constitute legal advice.
        </p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using {BRAND_NAME}, you accept and agree to be bound by the terms and provision of this agreement.
      </p>

      <h2>2. Products and Pricing</h2>
      <p>
        All products are subject to availability. We reserve the right to limit the quantities of any products or services that we offer. All descriptions of products or product pricing are subject to change at anytime without notice, at the sole discretion of us.
      </p>

      <h2>3. Accuracy of Billing and Account Information</h2>
      <p>
        We reserve the right to refuse any order you place with us. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
      </p>

      <h2>4. User Comments and Submissions</h2>
      <p>
        If you send creative ideas, suggestions, proposals, plans, or other materials, you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us.
      </p>
    </LegalPageLayout>
  );
}
