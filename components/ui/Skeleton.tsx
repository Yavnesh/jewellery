import React from "react";

export const Skeleton = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-luxury-border/60 ${className}`}
      {...props}
    />
  );
};
