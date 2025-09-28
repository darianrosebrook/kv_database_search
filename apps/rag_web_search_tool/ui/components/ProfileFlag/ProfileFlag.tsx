/**
 * Profile flag component
 */
import React from "react";
import { NavigationLink } from "../NavigationLink";
import styles from "./ProfileFlag.module.scss";

export interface ProfileFlagProps {
  name: string;
  avatar?: string;
  href?: string;
  className?: string;
}

export const ProfileFlag: React.FC<ProfileFlagProps> = ({
  name,
  avatar,
  href,
  className = "",
}) => {
  const content = (
    <div className={`${styles.profileFlag} ${className}`}>
      {avatar && <img src={avatar} alt={name} className={styles.avatar} />}
      <span className={styles.name}>{name}</span>
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

export default ProfileFlag;
