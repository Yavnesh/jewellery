"use client";
import { DashboardSidebar, StatsElement } from "@/components";
import React, { useEffect } from "react";
import { FaArrowUp } from "react-icons/fa6";

const AdminDashboardPage = () => {
  return (
    <div className="bg-white flex justify-start max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex flex-col items-center ml-5 gap-y-4 w-full max-xl:ml-0 max-xl:px-2 max-xl:mt-5 max-md:gap-y-1">
        <div className="flex justify-between w-full max-md:flex-col max-md:w-full max-md:gap-y-1">
          <StatsElement />
          <StatsElement />
          <StatsElement />
        </div>
        <div className="w-full bg-luxury-ivory border border-luxury-border text-luxury-text-primary h-44 flex flex-col justify-center items-center gap-y-2 rounded shadow-sm">
          <h4 className="text-lg font-serif font-light text-luxury-text-secondary uppercase tracking-widest max-[400px]:text-base">
            Number of visitors today
          </h4>
          <p className="text-4xl font-semibold tracking-wider">1,200</p>
          <p className="text-green-600 flex gap-x-1 items-center text-sm font-medium">
            <FaArrowUp />
            12.5% Since last month
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
