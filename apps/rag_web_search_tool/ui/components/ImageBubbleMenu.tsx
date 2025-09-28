/**
 * Image bubble menu component for TipTap
 */
import React from "react";
import { Popover } from "./Popover";
import { ImageToolbar } from "./ImageToolbar";
import styles from "./ImageBubbleMenu.module.scss";

export interface ImageBubbleMenuProps {
  onCrop?: () => void;
  onResize?: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({
  onCrop,
  onResize,
  onRotate,
  onDelete,
  className = "",
}) => {
  return (
    <div className={`${styles.imageBubbleMenu} ${className}`}>
      <Popover
        content={
          <ImageToolbar
            onCrop={onCrop}
            onResize={onResize}
            onRotate={onRotate}
            onDelete={onDelete}
          />
        }
        trigger="click"
        placement="top"
      >
        <div className={styles.trigger}>⋮</div>
      </Popover>
    </div>
  );
};

export default ImageBubbleMenu;
