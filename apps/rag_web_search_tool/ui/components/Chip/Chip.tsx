import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./Chip.module.scss";

export interface ChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
  variant?: "default" | "selected" | "removable";
  size?: "small" | "medium" | "large";
}

/**
 * A reusable chip component for displaying labels with optional removal functionality.
 *
 * @param label - The text content to display in the chip
 * @param onRemove - Optional callback function when the remove button is clicked
 * @param className - Additional CSS classes to apply
 * @param variant - Visual variant of the chip (default, selected, removable)
 * @param size - Size variant of the chip (small, medium, large)
 */
export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    { label, onRemove, className, variant = "default", size = "medium" },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    const chipClasses = [
      styles.chip,
      styles[`chip--${variant}`],
      styles[`chip--${size}`],
      isHovered && styles.chipHovered,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={chipClasses}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={styles.chipLabel}>{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className={styles.chipRemoveButton}
            aria-label={`Remove ${label}`}
          >
            <X className={styles.chipRemoveIcon} />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";

export default Chip;
