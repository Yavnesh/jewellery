// *********************
// IN DEVELOPMENT
// *********************

import React from "react";
import { FaArrowUp } from "react-icons/fa6";


const StatsElement = () => {
  return (
    <div className="w-80 h-32 bg-white border border-luxury-border text-luxury-text-primary flex flex-col justify-center items-center rounded shadow-sm max-md:w-full">
      <h4 className="text-sm font-serif font-light text-luxury-text-secondary uppercase tracking-widest">New Products</h4>
      <p className="text-3xl font-semibold mt-1">2,230</p>
      <p className="text-green-600 flex gap-x-1 items-center text-xs mt-1 font-medium"><FaArrowUp />12.5% Since last month</p>
    </div>
  );
};

export default StatsElement;
