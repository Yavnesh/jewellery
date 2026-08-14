import {
  StockAvailabillity,
  UrgencyText,
  ProductTabs,
  SingleProductDynamicFields,
  ProductGallery,
} from "@/components";
import { VariantSelector } from "@/components/ui/luxury/VariantSelector";
import apiClient from "@/lib/api";
import Image from "next/image";
import { getProductBySlug, getProductImages } from "@/src/modules/catalog/catalog.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import { ProductJsonLd } from "@/src/components/seo/ProductJsonLd";
import prisma from "@/utils/db";

interface SingleProductPageProps {
  params: Promise<{ locale: string; productSlug: string; id: string }>;
}

export async function generateMetadata({ params }: SingleProductPageProps): Promise<Metadata> {
  const paramsAwaited = await params;
  const { locale, productSlug } = paramsAwaited;
  const product = await getProductBySlug(productSlug, locale);
  
  if (!product) return {};

  return {
    title: `${product.title} | Vamika`,
    description: product.description || `Explore the exquisite ${product.title} at Vamika.`,
    alternates: {
      canonical: `/product/${product.slug}`
    },
    openGraph: {
      title: product.title,
      description: product.description || `Explore the exquisite ${product.title} at Vamika.`,
      url: `/product/${product.slug}`,
      images: [{ url: product.mainImage, alt: product.title }]
    }
  };
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  const { locale, productSlug } = paramsAwaited;
  
  const product = await getProductBySlug(productSlug, locale);

  if (!product) {
    notFound();
  }

  // Get gallery images
  const images = await getProductImages(product.id);

  // Fetch related products (same category)
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id }
    },
    take: 5,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      mainImage: true
    }
  });

  // Fetch cross-sell products (different category)
  const crossSellProducts = await prisma.product.findMany({
    where: {
      categoryId: { not: product.categoryId }
    },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      mainImage: true
    }
  });

  // Parse gallery images dynamically
  let galleryImages: string[] = [];
  if (images && images.length > 0) {
    galleryImages = images.map((img: any) => img.image);
  } else if (product?.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        galleryImages = parsed;
      } else {
        galleryImages = product.images.split(",");
      }
    } catch (e) {
      galleryImages = product.images.split(",");
    }
  }

  // Clean up quotes, brackets, whitespace, and filter empty strings
  galleryImages = galleryImages
    .map(img => img ? img.trim().replace(/^["'\[]+|["'\]]+$/g, "") : "")
    .filter(Boolean);

  if (galleryImages.length === 0 && product?.mainImage) {
    galleryImages = [product.mainImage];
  }

  // Sanitize image paths
  galleryImages = galleryImages.map(img => 
    img.startsWith('/') || img.startsWith('http') ? img : `/${img}`
  );

  return (
    <div className="bg-white min-h-screen pb-24 font-sans text-[#333333]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Breadcrumbs */}
        <div className="text-[11px] text-gray-500 font-sans mb-6 flex items-center gap-2">
          <span>Home</span> <span className="text-gray-300">{'>'}</span> 
          <span>All Jewellery</span> <span className="text-gray-300">{'>'}</span>
          <span className="text-[#8B2C33]">{sanitize(product?.title)}</span>
        </div>

        {/* Hero Section Split */}
        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          
          {/* Left Column: 2x2 Image Grid */}
          <div className="w-full lg:w-[60%] shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="aspect-square bg-[#F9F9F9] relative overflow-hidden flex items-center justify-center p-8">
                  <Image
                    src={galleryImages[index - 1] || galleryImages[0] || "/placeholder.jpg"}
                    alt={`${product?.title} - view ${index}`}
                    width={500}
                    height={500}
                    className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Title / Price / ATC */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-[#333333] leading-tight mb-2">
                {sanitize(product?.title)}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-[#D1A254] text-xs">
                  {'★'.repeat(Math.round(product?.rating || 5))}
                  {'☆'.repeat(5 - Math.round(product?.rating || 5))}
                </div>
                <span className="text-xs text-gray-400 font-sans cursor-pointer hover:underline">Write A Review</span>
              </div>
            </div>

            <VariantSelector 
              options={product.options} 
              variants={product.variants} 
              basePrice={product.price} 
              baseCompareAtPrice={product.originalPrice}
            />

            <SingleProductDynamicFields product={product} />

            <StockAvailabillity stock={product?.variants?.[0]?.stockQuantity || 0} inStock={product?.inStock ? 1 : 0} />
            <UrgencyText stock={product?.variants?.[0]?.stockQuantity || 0} />
          </div>
        </div>

        {/* Tab section: Description, specs etc */}
        <div className="mb-20">
          <ProductTabs product={product} />
        </div>



        {/* Styling Available (Cross-Sell) */}
        {crossSellProducts.length > 0 && (
          <div className="mb-20">
            <h2 className="font-serif text-2xl text-center text-[#333333] mb-8">Styling Available</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {crossSellProducts.map((item) => (
                <a href={`/product/${item.slug}`} key={item.id} className="bg-[#F9F9F9] p-4 text-center group cursor-pointer border border-transparent hover:border-gray-100 transition-colors block">
                  <div className="aspect-square relative mb-4">
                    <Image 
                      src={item.mainImage || "/placeholder.jpg"} 
                      alt={item.title} 
                      layout="fill" 
                      className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-serif text-sm text-[#333333] mb-1 line-clamp-1">{sanitize(item.title)}</h4>
                  <p className="font-serif font-bold text-[#333333]">₹ {item.price.toLocaleString("en-IN")}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Customers Also Viewed */}
        {relatedProducts.length > 0 && (
          <div className="mb-20">
            <h2 className="font-serif text-2xl text-center text-[#333333] mb-8">Customers Also Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {relatedProducts.map((item) => (
                <a href={`/product/${item.slug}`} key={item.id} className="bg-[#F9F9F9] p-4 text-center group cursor-pointer border border-transparent hover:border-gray-100 transition-colors block">
                  <div className="aspect-square relative mb-4">
                    <Image 
                      src={item.mainImage || "/placeholder.jpg"} 
                      alt={item.title} 
                      layout="fill" 
                      className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-serif text-sm text-[#333333] mb-1 line-clamp-1">{sanitize(item.title)}</h4>
                  <p className="font-serif font-bold text-[#333333]">₹ {item.price.toLocaleString("en-IN")}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        <div className="mb-20 bg-[#F9F9F9] py-16 px-8 text-center rounded-sm">
          <h2 className="font-serif text-2xl text-[#333333] mb-6">Customer Reviews</h2>
          <div className="bg-[#D1A254] text-white p-6 inline-block mb-6 shadow-md">
            <p className="text-sm uppercase tracking-widest mb-2">Be the first to review</p>
            <div className="text-xl">{'★'.repeat(5)}</div>
          </div>
          <br/>
          <button className="border border-gray-400 text-gray-600 font-sans text-xs uppercase tracking-widest px-6 py-2 hover:border-[#8B2C33] hover:text-[#8B2C33] transition-colors">
            Write a Review
          </button>
        </div>

        {/* The Vamika Advantage Footer */}
        <div className="border-t border-gray-200 pt-16 pb-8 text-center">
          <h2 className="font-serif text-2xl text-[#333333] mb-12">The Vamika Advantage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <p className="font-serif text-sm font-bold text-[#333333]">Purity Guaranteed</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">🔄</span>
              <p className="font-serif text-sm font-bold text-[#333333]">Exchange Across India</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <p className="font-serif text-sm font-bold text-[#333333]">Free Shipping</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">💎</span>
              <p className="font-serif text-sm font-bold text-[#333333]">Transparent Pricing</p>
            </div>
          </div>
        </div>
        
        <ProductJsonLd product={product} />
      </div>
    </div>
  );
};

export default SingleProductPage;
