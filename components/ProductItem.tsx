// *********************
// Role of the component: Product item component 
// Name of the component: ProductItem.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductItem product={product} color={color} />
// Input parameters: { product: Product; color: string; }
// Output: Product item component that contains product image, title, link to the single product page, price, button...
// *********************

import Image from "next/image";
import React from "react";
import Link from "next/link";

import { sanitize } from "@/lib/sanitize";
import { getImagePath } from "@/lib/utils";

import { useTranslations } from "next-intl";

const ProductItem = ({
  product,
  color,
}: {
  product: Product;
  color: string;
}) => {
  const t = useTranslations("Product");

  return (
    <div className="flex flex-col items-center w-full max-w-sm group border border-luxury-border/40 p-4 bg-white rounded transition-all duration-300 hover:shadow-md hover:border-luxury-gold/40">
      <Link href={`/product/${product.slug}`} className="w-full overflow-hidden flex justify-center items-center h-[260px] bg-luxury-ivory rounded mb-4">
        <Image
          src={getImagePath(product.mainImage)}
          width="0"
          height="0"
          sizes="100vw"
          className="w-auto h-[220px] object-contain transition-transform duration-500 group-hover:scale-105"
          alt={sanitize(product?.title) || "Product image"}
        />
      </Link>
      <Link
        href={`/product/${product.slug}`}
        className="text-sm text-luxury-text-primary font-serif font-light uppercase tracking-wider text-center line-clamp-2 min-h-[40px] px-2 hover:text-luxury-gold transition-colors duration-200"
      >
        {sanitize(product.title)}
      </Link>
      <p className="text-sm font-sans text-luxury-gold font-semibold tracking-widest mt-2">
        ₹ {product.price.toLocaleString('en-IN')}
      </p>

      <Link
        href={`/product/${product?.slug}`}
        className="block w-full text-center uppercase tracking-widest bg-luxury-text-primary text-white py-3 mt-4 text-xs font-semibold hover:bg-luxury-gold transition-all duration-300 rounded shadow-sm"
      >
        {t("viewProduct")}
      </Link>
    </div>
  );
};

export default ProductItem;
