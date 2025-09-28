/**
 * Next.js Image component alternative for Vite/React
 * Provides similar API to Next.js Image component
 */
import React from "react";
import styles from "./OptimizedImage.module.scss";

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const NextImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  onLoad,
  onError,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`${styles.optimizedImage} ${fill ? styles.fill : ""} ${
        className || ""
      }`}
      style={style}
      onLoad={onLoad}
      onError={onError}
      loading={props.priority ? "eager" : "lazy"}
      {...props}
    />
  );
};

export default NextImage;
