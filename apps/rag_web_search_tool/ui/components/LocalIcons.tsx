/**
 * Local icons component for custom icons
 */
import React from "react";

export interface LocalIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export const LocalIcon: React.FC<LocalIconProps> = ({
  name,
  size = 24,
  className = "",
  color,
}) => {
  const style = {
    width: size,
    height: size,
    color,
  };

  // Simple icon mapping - you can expand this
  const iconMap: Record<string, React.ReactNode> = {
    "info-circle": (
      <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
    "check-circle": (
      <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    "exclamation-triangle": (
      <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    ),
    "exclamation-circle": (
      <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  };

  const icon = iconMap[name];

  if (!icon) {
    console.warn(`Icon "${name}" not found in LocalIcons`);
    return (
      <div className={className} style={style} title={`Missing icon: ${name}`}>
        ?
      </div>
    );
  }

  return <span className={className}>{icon}</span>;
};

export default LocalIcon;
