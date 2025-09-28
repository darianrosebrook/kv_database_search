/**
 * Footer marquee component
 */
import React from "react";
import { motion } from "motion/react";
import { useGSAP } from "@gsap/react";
import { cn } from "../helpers";
import styles from "./marquee.module.scss";

export interface FooterMarqueeProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

export const FooterMarquee: React.FC<FooterMarqueeProps> = ({
  children,
  className = "",
  speed = 30,
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

        // You can use GSAP here if needed
        // gsap.to(content, {
        //   x: -distance,
        //   duration: distance / speed,
        //   ease: "none",
        //   repeat: -1,
        // });
      }
    }
  }, [speed]);

  return (
    <div ref={marqueeRef} className={cn(styles.footerMarquee, className)}>
      <div data-marquee-content className={styles.content}>
        {children}
      </div>
      <div data-marquee-content className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default FooterMarquee;
