/**
 * Logo marquee component
 */
import React from "react";
import { motion } from "motion/react";
import { useGSAP } from "@gsap/react";
import { cn } from "../helpers";
import styles from "./LogoMarquee.module.scss";

export interface LogoMarqueeProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "left" | "right";
}

export const LogoMarquee: React.FC<LogoMarqueeProps> = ({
  children,
  className = "",
  speed = 50,
  direction = "left",
}) => {
  const marqueeRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (marqueeRef.current) {
      const marquee = marqueeRef.current;
      const content = marquee.querySelector(
        "[data-marquee-content]"
      ) as HTMLElement;

      if (content) {
        const contentWidth = content.offsetWidth;
        const marqueeWidth = marquee.offsetWidth;
        const distance = contentWidth + marqueeWidth;

        const animation = {
          x: direction === "left" ? -distance : distance,
          duration: distance / speed,
          ease: "none",
          repeat: -1,
        };

        // You can use GSAP here if needed
        // gsap.to(content, animation);
      }
    }
  }, [speed, direction]);

  return (
    <div
      ref={marqueeRef}
      className={cn(styles.logoMarquee, className)}
      data-direction={direction}
    >
      <div data-marquee-content className={styles.content}>
        {children}
      </div>
      <div data-marquee-content className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default LogoMarquee;
