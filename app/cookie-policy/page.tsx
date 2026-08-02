import LegalPageLayout from "@/components/LegalPageLayout";
import { BRAND_NAME } from "@/utils/brand";

export default function CookiePolicy() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="January 1, 2024">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700 text-sm">
          <strong>DISCLAIMER:</strong> This is a placeholder Cookie policy.
        </p>
      </div>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
      </p>

      <h2>2. How We Use Cookies</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li><strong>Strictly Necessary Cookies:</strong> These are essential for you to browse the website and use its features, such as accessing secure areas of the site (e.g., shopping cart, user login).</li>
        <li><strong>Analytics Cookies:</strong> We use tools like Google Analytics to understand how visitors interact with our website. This helps us improve our user experience. These cookies collect information anonymously.</li>
        <li><strong>Marketing Cookies:</strong> These cookies are used to track visitors across websites to display relevant advertisements.</li>
      </ul>

      <h2>3. Managing Your Preferences</h2>
      <p>
        You have the right to accept or reject non-essential cookies. You can manage your preferences at any time by clicking the "Cookie Preferences" link in the footer of our website. You can also configure your web browser to refuse cookies, but this may affect the functionality of the site.
      </p>
    </LegalPageLayout>
  );
}
