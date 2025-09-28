/**
 * Gooey highlight component
 */
import React from "react";
import { motion } from "motion/react";
import { createGooeyHighlight } from "../gooeyHighlight";
import styles from "./GooeyHighlight.module.scss";

export interface GooeyHighlightProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  radius?: number;
  color?: string;
  duration?: number;
}

export const GooeyHighlight: React.FC<GooeyHighlightProps> = ({
  children,
  className = "",
  intensity = 0.8,
  radius = 20,
  color = "#ffffff",
  duration = 300,
}) => {
  const config = createGooeyHighlight({
    intensity,
    radius,
    color,
    duration,
  });

  return (
    <motion.div
      className={`${styles.gooeyHighlight} ${className}`}
      whileHover={{
        filter: `blur(${config.intensity}px)`,
        borderRadius: `${config.radius}px`,
        backgroundColor: config.color,
      }}
      transition={{ duration: config.duration / 1000 }}
    >
      {children}
    </motion.div>
  );
};

export default GooeyHighlight;
