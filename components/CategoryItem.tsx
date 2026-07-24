// *********************
// Role of the component: Category Item that will display category icon, category name and link to the category
// Name of the component: CategoryItem.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CategoryItem title={title} href={href} ><Image /></CategoryItem>
// Input parameters: CategoryItemProps interface
// Output: Category icon, category name and link to the category
// *********************

import Link from "next/link";
import React, { type ReactNode } from "react";

interface CategoryItemProps {
  children: ReactNode;
  title: string;
  href: string;
}

const CategoryItem = ({ title, children, href }: CategoryItemProps) => {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-y-4 cursor-pointer bg-white py-6 px-4 border border-luxury-border/60 text-luxury-text-primary hover:border-luxury-gold transition-all duration-300 shadow-sm rounded hover:-translate-y-1 hover:shadow-md">
        <div className="w-12 h-12 flex items-center justify-center bg-luxury-ivory rounded-full p-2.5 transition-transform duration-300 hover:scale-110">
          {children}
        </div>
        <h3 className="font-serif font-light text-base uppercase tracking-wider text-center">{title}</h3>
      </div>
    </Link>
  );
};

export default CategoryItem;
