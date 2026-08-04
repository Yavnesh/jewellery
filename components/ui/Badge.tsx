import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "outline" | "secondary" | "danger" | "success";
}

export const Badge = ({ children, variant = "gold", className = "", ...props }: BadgeProps) => {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider uppercase font-sans";
  
  const variants = {
    gold: "bg-vamika-gold/10 text-vamika-gold border border-vamika-gold/20",
    outline: "border border-luxury-border text-luxury-text-secondary bg-transparent",
    secondary: "bg-luxury-ivory text-luxury-text-secondary border border-luxury-border/40",
    danger: "bg-red-50 text-red-600 border border-red-100",
    success: "bg-green-50 text-green-600 border border-green-100",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
