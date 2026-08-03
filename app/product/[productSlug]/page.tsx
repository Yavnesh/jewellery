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
import { notFound } from "next/navigation";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import prisma from "@/utils/db";

interface SingleProductPageProps {
  params: Promise<{  productSlug: string, id: string }>;
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  
  // Query Prisma directly instead of hitting an API route
  const product = await prisma.product.findUnique({
    where: { slug: paramsAwaited?.productSlug },
    include: {
      options: {
        include: {
          values: {
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      },
      variants: {
        where: { status: 'ACTIVE' },
        include: {
          optionValues: {
            include: {
              optionValue: {
                include: { option: true }
              }
            }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  });

  if (!product) {
    notFound();
  }

  // Get gallery images
  const images = await prisma.image.findMany({
    where: { productID: product.id }
  });

  // Parse gallery images dynamically
  let galleryImages: string[] = [];
  if (images && images.length > 0) {
    galleryImages = images.map((img: any) => img.image);
  } else if (product?.images) {
    galleryImages = product.images.split(",");
  } else {
    galleryImages = [product?.mainImage];
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

          {/* Right Column: Buy Box */}
          <div className="flex-1 flex flex-col pt-4">
            <h1 className="text-[22px] font-serif text-[#333333] leading-snug mb-2">
              {sanitize(product?.title)}
            </h1>
            
            {/* Reviews Summary */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-[#D1A254] text-xs">
                {'★'.repeat(4)}{'☆'}
              </div>
              <span className="text-xs text-gray-500 underline">Write A Review</span>
            </div>
            
            {/* Delivery & Pincode */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-[#333333] mb-3">Delivery Location</h3>
              <div className="flex">
                <input 
                  type="text" 
                  placeholder="Enter Pincode" 
                  className="border-b border-gray-300 rounded-none py-2 px-1 text-sm w-[200px] focus:outline-none focus:border-[#8B2C33]"
                />
                <button className="text-[#8B2C33] text-sm font-bold px-4">Update</button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="text-[#D1A254]">🚚</span> Delivery by Tomorrow, 11 AM
              </p>
            </div>

            {/* Offer Banner */}
            <div className="bg-[#FFF8E7] border border-[#F2E5C9] p-4 flex gap-3 items-start mb-8 rounded-sm">
              <span className="text-[#D1A254] mt-0.5">💎</span>
              <div>
                <p className="text-[13px] font-bold text-[#333333]">Offer available</p>
                <p className="text-[12px] text-gray-600 mt-1">Flat 20% off on making charges.</p>
              </div>
            </div>

            {/* Product Details Highlights */}
            <div className="flex flex-col gap-3 text-[13px] text-gray-600 border-t border-gray-100 pt-6 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-400">Weight</span>
                <span className="font-medium text-[#333333]">{product?.weight || '12.45'} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Purity</span>
                <span className="font-medium text-[#333333]">{product?.purity || '18K'}</span>
              </div>
            </div>

            {/* Variant Selector & Actions */}
            <VariantSelector 
              options={product.options} 
              variants={product.variants} 
              basePrice={product.price} 
              baseCompareAtPrice={product.originalPrice}
            />
          </div>
        </div>

        {/* Try It On Banner */}
        <div className="w-full bg-[#FDF8F5] border border-[#F6EBE5] py-8 px-12 flex flex-col md:flex-row items-center justify-between mb-16 rounded-sm">
          <div>
            <h3 className="font-serif text-2xl text-[#8B2C33] mb-2">Virtual Try On</h3>
            <p className="font-sans text-sm text-gray-600 max-w-md">
              See how this beautiful piece looks on you using your phone's camera or uploading a photo.
            </p>
          </div>
          <button className="bg-[#8B2C33] text-white font-sans text-sm font-bold tracking-widest uppercase px-8 py-3 mt-4 md:mt-0 hover:bg-[#6e2329] transition-colors">
            Try It On
          </button>
        </div>

        {/* Styling Available (Cross-Sell) */}
        <div className="mb-20">
          <h2 className="font-serif text-2xl text-center text-[#333333] mb-8">Styling Available</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-[#F9F9F9] p-4 text-center group cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                <div className="aspect-square relative mb-4">
                  <Image 
                    src="/placeholder.jpg" 
                    alt="Matching item" 
                    layout="fill" 
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-serif text-sm text-[#333333] mb-1 line-clamp-1">Matching Earring {item}</h4>
                <p className="font-serif font-bold text-[#333333]">₹ 24,500</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customers Also Viewed */}
        <div className="mb-20">
          <h2 className="font-serif text-2xl text-center text-[#333333] mb-8">Customers Also Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-[#F9F9F9] p-4 text-center group cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                <div className="aspect-square relative mb-4">
                  <Image 
                    src="/placeholder.jpg" 
                    alt="Related item" 
                    layout="fill" 
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-serif text-sm text-[#333333] mb-1 line-clamp-1">Related Ring {item}</h4>
                <p className="font-serif font-bold text-[#333333]">₹ 18,200</p>
              </div>
            ))}
          </div>
        </div>

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

        {/* The Tanishq Advantage Footer */}
        <div className="border-t border-gray-200 pt-16 pb-8 text-center">
          <h2 className="font-serif text-2xl text-[#333333] mb-12">The Tanishq Advantage</h2>
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

      </div>
    </div>
  );
};

export default SingleProductPage;
