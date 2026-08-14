"use client";
import { DashboardSidebar, StatsElement } from "@/components";
import React, { useEffect } from "react";
import { FaArrowUp, FaChartLine, FaBoxOpen, FaUsers } from "react-icons/fa6";

const AdminDashboardPage = () => {
  return (
    <div className="bg-luxury-bg min-h-screen flex max-w-screen-2xl mx-auto max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex-1 ml-5 max-xl:ml-0 p-8 max-xl:p-4">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-luxury-text-primary mb-2">Dashboard Overview</h1>
          <p className="text-luxury-text-secondary">Welcome back, Admin. Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsElement 
            title="Total Revenue" 
            value="₹1,245,000" 
            trend={12.5} 
            trendLabel="vs last month"
            icon={<FaChartLine size={20} />} 
          />
          <StatsElement 
            title="New Orders" 
            value="142" 
            trend={8.2} 
            trendLabel="vs last month"
            icon={<FaBoxOpen size={20} />} 
          />
          <StatsElement 
            title="Active Users" 
            value="2,845" 
            trend={-2.4} 
            trendLabel="vs last month"
            icon={<FaUsers size={20} />} 
          />
        </div>

        {/* Featured Metric / Visitor Banner */}
        <div className="w-full bg-gradient-to-br from-vamika-charcoal to-luxury-text-primary text-luxury-ivory p-8 rounded-lg shadow-md flex flex-col justify-center items-center gap-y-3 relative overflow-hidden group">
          {/* Subtle gold accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-luxury-gold" />
          
          <h4 className="text-lg font-serif font-light text-luxury-border uppercase tracking-widest max-[400px]:text-base">
            Number of visitors today
          </h4>
          <p className="text-5xl font-serif tracking-wider text-luxury-gold">1,200</p>
          <p className="text-emerald-400 flex gap-x-1 items-center text-sm font-medium mt-2">
            <FaArrowUp />
            12.5% Since last week
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
