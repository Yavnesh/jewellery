// *********************
// IN DEVELOPMENT
// *********************

import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import clsx from "clsx";

interface StatsElementProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
}

const StatsElement = ({ title, value, trend, trendLabel, icon }: StatsElementProps) => {
  const isPositive = trend && trend >= 0;

  return (
    <div className="flex-1 min-w-[250px] bg-white border border-luxury-border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
      {/* Decorative subtle accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-luxury-gold to-luxury-gold-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-serif font-medium text-luxury-text-secondary uppercase tracking-widest">{title}</h4>
        {icon && <div className="text-luxury-gold p-2 bg-luxury-bg rounded-full">{icon}</div>}
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-3xl font-semibold text-luxury-text-primary tracking-wide">{value}</p>
        
        {trend !== undefined && (
          <div className={clsx("flex items-center gap-x-1 text-xs font-medium pb-1", isPositive ? "text-emerald-600" : "text-rose-600")}>
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-luxury-text-secondary font-normal ml-1 hidden sm:inline-block">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsElement;
