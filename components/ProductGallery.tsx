"use client";

import React, { useState } from "react";
import Image from "next/image";
import { sanitize } from "@/lib/sanitize";
import { getImagePath } from "@/lib/utils";
import { FaChevronDown } from "react-icons/fa6";

interface ProductGalleryProps {
  mainImage: string;
  title: string;
  images: string[];
}

export const ProductGallery = ({ mainImage, title, images }: ProductGalleryProps) => {
  const [activeImage, setActiveImage] = useState(mainImage);

  // Clean and merge images
  const allImages = images.length > 0 ? images : [mainImage];

  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full lg:min-h-[550px] items-start">
      {/* Left Column: Vertical Thumbnails list */}
      {allImages.length > 1 && (
        <div className="flex sm:flex-col flex-row gap-3 overflow-x-auto sm:overflow-y-auto w-full sm:w-[90px] pr-0 sm:pr-2 max-h-[120px] sm:max-h-[550px] shrink-0 scrollbar-none pb-2 sm:pb-0">
          {allImages.map((imagePath: string, key: number) => {
            const cleanImagePath = getImagePath(imagePath);
            return (
              <div
                key={key}
                onClick={() => setActiveImage(imagePath)}
                onMouseEnter={() => setActiveImage(imagePath)}
                className={`border bg-white cursor-pointer transition-all duration-200 aspect-square flex items-center justify-center shrink-0 w-20 h-20 p-1.5 rounded-sm ${
                  activeImage === imagePath
                    ? "border-vamika-gold ring-1 ring-vamika-gold/50"
                    : "border-gray-200 hover:border-vamika-gold/60"
                }`}
              >
                <Image
                  src={cleanImagePath}
                  width={70}
                  height={70}
                  alt={`${sanitize(title)} thumbnail ${key + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Right Column: Main Image Container */}
      <div className="flex-grow w-full aspect-square bg-[#F9F9F9] border border-transparent rounded-sm flex items-center justify-center relative p-8 group overflow-hidden">
        <Image
          src={getImagePath(activeImage)}
          width={650}
          height={650}
          alt={sanitize(title)}
          priority
          className="object-contain max-h-[480px] w-full h-full mix-blend-multiply transition-transform duration-700 hover:scale-105"
        />
      </div>
    </div>
  );
};

export default ProductGallery;
