import React from "react";
import styles from "./Separator.module.scss";

interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const Separator: React.FC<SeparatorProps> = ({
  className,
  orientation = "horizontal",
}) => {
  return (
    <div
      className={`${styles.separator} ${styles[orientation]} ${
        className || ""
      }`}
    />
  );
};

export default Separator;
