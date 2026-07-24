// *********************
// Role of the component: Sidebar on admin dashboard page
// Name of the component: DashboardSidebar.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardSidebar />
// Input parameters: no input parameters
// Output: sidebar for admin dashboard page
// *********************

import React from "react";
import { MdDashboard } from "react-icons/md";
import { FaTable } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa6";
import { FaGear } from "react-icons/fa6";
import { FaBagShopping } from "react-icons/fa6";
import { FaStore } from "react-icons/fa6";
import { MdCategory } from "react-icons/md";
import { FaFileUpload } from "react-icons/fa";

import Link from "next/link";

const DashboardSidebar = () => {
  return (
    <div className="xl:w-[300px] bg-luxury-sidebar border-r border-luxury-border/60 h-full max-xl:w-full flex flex-col font-sans py-6">
      <Link href="/admin">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <MdDashboard className="text-xl" />
          <span>Dashboard</span>
        </div>
      </Link>
      <Link href="/admin/orders">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaBagShopping className="text-xl" />
          <span>Orders</span>
        </div>
      </Link>
      <Link href="/admin/products">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaTable className="text-xl" />
          <span>Products</span>
        </div>
      </Link>
      <Link href="/admin/bulk-upload">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaFileUpload className="text-xl" />
          <span>Bulk Upload</span>
        </div>
      </Link>
      <Link href="/admin/categories">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <MdCategory className="text-xl" />
          <span>Categories</span>
        </div>
      </Link>
      <Link href="/admin/users">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaRegUser className="text-xl" />
          <span>Users</span>
        </div>
      </Link>
      <Link href="/admin/merchant">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaStore className="text-xl" />
          <span>Merchant</span>
        </div>
      </Link>
      <Link href="/admin/settings">
        <div className="flex gap-x-3 w-full hover:bg-luxury-ivory hover:text-luxury-gold text-luxury-text-primary cursor-pointer items-center py-4 pl-6 text-base font-medium transition-all duration-200 border-l-4 border-transparent hover:border-luxury-gold">
          <FaGear className="text-xl" />
          <span>Settings</span>
        </div>
      </Link>
    </div>
  );
};

export default DashboardSidebar;
