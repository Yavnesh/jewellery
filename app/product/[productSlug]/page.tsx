import {
  StockAvailabillity,
  UrgencyText,
  ProductTabs,
  SingleProductDynamicFields,
  ProductGallery,
} from "@/components";
import apiClient from "@/lib/api";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaSquarePinterest } from "react-icons/fa6";
import { sanitize } from "@/lib/sanitize";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{  productSlug: string, id: string }>;
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  // sending API request for a single product with a given product slug
  const data = await apiClient.get(
    `/api/slugs/${paramsAwaited?.productSlug}`
  );
  const product = await data.json();

  // sending API request for more than 1 product image if it exists
  const imagesData = await apiClient.get(
    `/api/images/${paramsAwaited?.id}`
  );
  const images = await imagesData.json();

  if (!product || product.error) {
    notFound();
  }

  // Parse gallery images dynamically
  let galleryImages: string[] = [];
  if (images && images.length > 0) {
    galleryImages = images.map((img: any) => img.image);
  } else if (product?.images) {
    galleryImages = product.images.split(",");
  } else {
    galleryImages = [product?.mainImage];
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-screen-2xl mx-auto px-12 max-sm:px-6">
        <div className="flex justify-center gap-x-16 pt-6 max-lg:flex-col items-center lg:items-start gap-y-10">
          <ProductGallery
            mainImage={product?.mainImage}
            title={product?.title}
            images={galleryImages}
          />
          <div className="flex-1 flex flex-col gap-y-6 text-luxury-text-primary max-[500px]:text-center max-w-xl">
            <div className="flex gap-x-2.5 flex-wrap gap-y-2">
              {product?.collection && (
                <span className="bg-tanishq-gold/10 text-tanishq-gold border border-tanishq-gold/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider font-sans">
                  {product.collection} Collection
                </span>
              )}
              {product?.occasion && (
                <span className="bg-luxury-ivory text-luxury-text-secondary border border-luxury-border/60 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider font-sans">
                  {product.occasion} Wear
                </span>
              )}
            </div>
            <h1 className="text-4xl font-serif font-light uppercase tracking-wider leading-snug">{sanitize(product?.title)}</h1>
            <p className="text-2xl font-semibold text-tanishq-gold tracking-widest">${product?.price}</p>
            <div className="w-full border-t border-luxury-border/60 my-2"></div>
            <StockAvailabillity stock={94} inStock={product?.inStock} />
            <SingleProductDynamicFields product={product} />
            <div className="w-full border-t border-luxury-border/60 my-2"></div>
            <div className="flex flex-col gap-y-3 max-[500px]:items-center text-sm text-luxury-text-secondary font-sans">
              <p className="tracking-wide">
                SKU: <span className="text-luxury-text-primary font-medium ml-1">abccd-18</span>
              </p>
              <div className="flex gap-x-3 items-center">
                <span className="tracking-wide">Share:</span>
                <div className="flex items-center gap-x-2 text-xl text-luxury-text-primary">
                  <FaSquareFacebook className="hover:text-luxury-gold cursor-pointer transition-colors" />
                  <FaSquareXTwitter className="hover:text-luxury-gold cursor-pointer transition-colors" />
                  <FaSquarePinterest className="hover:text-luxury-gold cursor-pointer transition-colors" />
                </div>
              </div>
              <div className="flex gap-x-2.5 mt-2 flex-wrap max-[500px]:justify-center">
                <Image
                  src="/visa.svg"
                  width={45}
                  height={30}
                  alt="visa icon"
                  className="w-auto h-7 opacity-75 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/mastercard.svg"
                  width={45}
                  height={30}
                  alt="mastercard icon"
                  className="h-7 w-auto opacity-75 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/ae.svg"
                  width={45}
                  height={30}
                  alt="american express icon"
                  className="h-7 w-auto opacity-75 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/paypal.svg"
                  width={45}
                  height={30}
                  alt="paypal icon"
                  className="w-auto h-7 opacity-75 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/dinersclub.svg"
                  width={45}
                  height={30}
                  alt="diners club icon"
                  className="h-7 w-auto opacity-75 hover:opacity-100 transition-opacity"
                />
                <Image
                  src="/discover.svg"
                  width={45}
                  height={30}
                  alt="discover icon"
                  className="h-7 w-auto opacity-75 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-luxury-border/60">
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
