// *********************
// Role of the component: Custom button component
// Name of the component: CustomButton.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CustomButton paddingX={paddingX} paddingY={paddingY} text={text} buttonType={buttonType} customWidth={customWidth} textSize={textSize} />
// Input parameters: CustomButtonProps interface
// Output: custom button component
// *********************

import React from "react";

interface CustomButtonProps {
  paddingX: number;
  paddingY: number;
  text: string;
  buttonType: "submit" | "reset" | "button";
  customWidth: string;
  textSize: string;
}

const CustomButton = ({
  paddingX,
  paddingY,
  text,
  buttonType,
  customWidth,
  textSize
}: CustomButtonProps) => {


  return (
    <button
      type={buttonType}
      style={{
        paddingLeft: `${paddingX * 0.25}rem`,
        paddingRight: `${paddingX * 0.25}rem`,
        paddingTop: `${paddingY * 0.25}rem`,
        paddingBottom: `${paddingY * 0.25}rem`,
      }}
      className={`${customWidth === "full" ? "w-full" : customWidth !== "no" ? `w-${customWidth}` : ""} uppercase bg-tanishq-charcoal hover:bg-tanishq-gold text-white text-${textSize} font-semibold tracking-widest transition-all duration-300 focus:outline-none rounded shadow-sm border border-tanishq-charcoal hover:border-tanishq-gold`}
    >
      {text}
    </button>
  );
};

export default CustomButton;
