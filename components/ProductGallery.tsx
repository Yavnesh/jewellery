"use client";

import React, { useState } from "react";
import Image from "next/image";
import { sanitize } from "@/lib/sanitize";

interface ProductGalleryProps {
  mainImage: string;
  title: string;
  images: string[];
}

export const ProductGallery = ({ mainImage, title, images }: ProductGalleryProps) => {
  const [activeImage, setActiveImage] = useState(mainImage);

  // Merge main image if not present in list
  const allImages = images.length > 0 ? images : [mainImage];

  return (
    <div className="w-full max-w-[550px]">
      <div className="bg-luxury-ivory p-8 rounded border border-luxury-border/60 flex items-center justify-center min-h-[400px]">
        <Image
          src={activeImage ? `/${activeImage}` : "/product_placeholder.jpg"}
          width={500}
          height={500}
          alt={sanitize(title)}
          className="w-auto h-[350px] object-contain transition-all duration-500 hover:scale-105"
        />
      </div>
      {allImages.length > 1 && (
        <div className="flex justify-start gap-3 mt-4 flex-wrap">
          {allImages.map((imagePath: string, key: number) => (
            <div
              key={key}
              onClick={() => setActiveImage(imagePath)}
              className={`border rounded p-1 bg-white cursor-pointer transition-all duration-200 ${
                activeImage === imagePath
                  ? "border-vamika-gold ring-1 ring-vamika-gold"
                  : "border-luxury-border hover:border-vamika-gold/60"
              }`}
            >
              <Image
                src={`/${imagePath}`}
                width={90}
                height={90}
                alt={`${sanitize(title)} gallery ${key + 1}`}
                className="w-20 h-20 object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
