import { safeJsonLd } from "@/src/lib/seo/json-ld";

export const ProductJsonLd = ({ product }: { product: any }) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.vamika.example.com';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": [product.mainImage],
    "description": product.features || product.title,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Vamika"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price.toString(),
      "availability": product.inStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
};
