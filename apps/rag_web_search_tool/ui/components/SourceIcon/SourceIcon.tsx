import React from "react";

export interface SourceIconProps {
  type: string;
  variant?: "emoji" | "svg";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const EMOJI_ICONS = {
  moc: "🗺️",
  article: "📝",
  book: "📚",
  conversation: "💬",
  default: "📄",
} as const;

const PlaceholderSVG = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const dimensions = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  };

  const { width, height } = dimensions[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" fill="white" />
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <rect
        x="19"
        y="5"
        width="14"
        height="14"
        rx="2"
        transform="rotate(90 19 5)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      <rect
        x="14"
        y="10"
        width="4"
        height="4"
        rx="2"
        transform="rotate(90 14 10)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      <path
        d="M7.75736 8.24264L9.17157 9.65685M14.8284 15.3137L16.2426 16.7279M16.2426 8.24264L14.8284 9.65685M9.52513 14.9602L8.11091 16.3744"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
};

export function SourceIcon({
  type,
  variant = "emoji",
  size = "md",
  className = "",
}: SourceIconProps) {
  if (variant === "svg") {
    return (
      <span className={className}>
        <PlaceholderSVG size={size} />
      </span>
    );
  }

  // Emoji variant
  const icon =
    EMOJI_ICONS[type as keyof typeof EMOJI_ICONS] || EMOJI_ICONS.default;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  return <span className={`${sizeClasses[size]} ${className}`}>{icon}</span>;
}
