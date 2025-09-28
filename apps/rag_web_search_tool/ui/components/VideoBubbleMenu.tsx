/**
 * Video bubble menu component for TipTap
 */
import React from "react";
import { Popover } from "./Popover";
import { Button } from "./Button";
import styles from "./VideoBubbleMenu.module.scss";

export interface VideoBubbleMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const VideoBubbleMenu: React.FC<VideoBubbleMenuProps> = ({
  onEdit,
  onDelete,
  className = "",
}) => {
  return (
    <div className={`${styles.videoBubbleMenu} ${className}`}>
      <Popover
        content={
          <div className={styles.menu}>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                aria-label="Edit video"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label="Delete video"
              >
                Delete
              </Button>
            )}
          </div>
        }
        trigger="click"
        placement="top"
      >
        <div className={styles.trigger}>⋮</div>
      </Popover>
    </div>
  );
};

export default VideoBubbleMenu;
