/**
 * Image toolbar component for image editing
 */
import React from "react";
import { Toolbar } from "./Toolbar";
import { Button } from "./Button";
import styles from "./ImageToolbar.module.scss";

export interface ImageToolbarProps {
  onCrop?: () => void;
  onResize?: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  onCrop,
  onResize,
  onRotate,
  onDelete,
  className = "",
}) => {
  return (
    <Toolbar className={`${styles.imageToolbar} ${className}`}>
      {onCrop && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCrop}
          aria-label="Crop image"
        >
          Crop
        </Button>
      )}
      {onResize && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResize}
          aria-label="Resize image"
        >
          Resize
        </Button>
      )}
      {onRotate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotate}
          aria-label="Rotate image"
        >
          Rotate
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          aria-label="Delete image"
        >
          Delete
        </Button>
      )}
    </Toolbar>
  );
};

export default ImageToolbar;
