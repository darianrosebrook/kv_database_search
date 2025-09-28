/**
 * Postcard component
 */
import React from "react";
import { NextImage } from "../OptimizedImage";
import { NavigationLink } from "../NavigationLink";
import { Icon } from "../Icon";
import styles from "./Postcard.module.scss";

export interface PostcardProps {
  title: string;
  description: string;
  image?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export const Postcard: React.FC<PostcardProps> = ({
  title,
  description,
  image,
  href,
  className = "",
  onClick,
}) => {
  const content = (
    <div className={`${styles.postcard} ${className}`} onClick={onClick}>
      {image && (
        <div className={styles.imageContainer}>
          <NextImage
            src={image}
            alt={title}
            width={300}
            height={200}
            className={styles.image}
          />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.footer}>
          <Icon name="arrow-right" size={16} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <NavigationLink href={href} className={styles.link}>
        {content}
      </NavigationLink>
    );
  }

  return content;
};

export default Postcard;
