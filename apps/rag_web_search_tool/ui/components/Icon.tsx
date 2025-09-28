/**
 * Icon component that can use different icon libraries
 */
import React from "react";
import LocalIcon from "./LocalIcons";

export interface IconProps {
  name: string;
  library?: "local" | "heroicons" | "awesome";
  size?: number;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  library = "local",
  size = 24,
  className = "",
  color,
}) => {
  switch (library) {
    case "local":
      return (
        <LocalIcon
          name={name}
          size={size}
          className={className}
          color={color}
        />
      );
    case "heroicons":
      // You can implement Heroicons integration here
      return (
        <LocalIcon
          name={name}
          size={size}
          className={className}
          color={color}
        />
      );
    case "awesome":
      // You can implement FontAwesome integration here
      return (
        <LocalIcon
          name={name}
          size={size}
          className={className}
          color={color}
        />
      );
    default:
      return (
        <LocalIcon
          name={name}
          size={size}
          className={className}
          color={color}
        />
      );
  }
};

export default Icon;
