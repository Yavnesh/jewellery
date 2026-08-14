import LegalPageLayout from "@/components/LegalPageLayout";
import { BRAND_NAME } from "@/utils/brand";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="January 1, 2024">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 text-sm">
          <strong>DISCLAIMER:</strong> This is a placeholder privacy policy. It has not been reviewed by legal counsel and does not constitute legal advice. Please consult with a lawyer to ensure compliance with GDPR, CCPA, and other applicable laws.
        </p>
      </div>

      <h2>1. Information We Collect</h2>
      <p>
        At {BRAND_NAME}, we collect data to provide you with the best luxury jewelry shopping experience. This includes:
      </p>
      <ul>
        <li><strong>Personal Information:</strong> Name, email address, phone number, shipping and billing addresses.</li>
        <li><strong>Payment Information:</strong> Processed securely by our payment partners. We do not store full credit card numbers.</li>
        <li><strong>Browsing Data:</strong> IP addresses, browser types, and interaction data via cookies and analytics tools.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Process and fulfill your orders.</li>
        <li>Communicate with you regarding shipping, returns, and support.</li>
        <li>Send marketing communications (if you have opted in).</li>
        <li>Improve our website, security, and fraud prevention measures.</li>
      </ul>

      <h2>3. Data Sharing and Third Parties</h2>
      <p>
        We do not sell your personal data. We share data only with trusted third parties necessary for business operations, including payment gateways, shipping carriers, and analytics providers.
      </p>

      <h2>4. Your Privacy Rights</h2>
      <p>
        Depending on your location (e.g., California, EU), you may have the right to request access, correction, or deletion of your personal data. To exercise these rights, please contact us at [CONTACT_EMAIL].
      </p>
    </LegalPageLayout>
  );
}
