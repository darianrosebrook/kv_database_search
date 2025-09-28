import React from "react";
import { Editor } from "@tiptap/react";
import styles from "./ImageToolbar.module.scss";
import Icon from "../../components/Icon";
import {
  faSearch,
  faDownload,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
const faAlignLeftIcon = faSearch; // Using search as placeholder
const faAlignCenterIcon = faDownload; // Using download as placeholder
const faAlignRightIcon = faExpand; // Using expand as placeholder

type ImageToolbarProps = {
  editor: Editor;
};

const ImageToolbar: React.FC<ImageToolbarProps> = ({ editor }) => {
  const setAlignment = (align: "left" | "center" | "right") => {
    editor
      .chain()
      .focus()
      .updateAttributes("image", { "data-align": align })
      .run();
  };

  return (
    <div className={styles.toolbar}>
      <button
        onClick={() => setAlignment("left")}
        className={
          editor.isActive("image", { "data-align": "left" })
            ? styles.isActive
            : ""
        }
      >
        <Icon icon={faAlignLeftIcon} />
      </button>
      <button
        onClick={() => setAlignment("center")}
        className={
          editor.isActive("image", { "data-align": "center" })
            ? styles.isActive
            : ""
        }
      >
        <Icon icon={faAlignCenterIcon} />
      </button>
      <button
        onClick={() => setAlignment("right")}
        className={
          editor.isActive("image", { "data-align": "right" })
            ? styles.isActive
            : ""
        }
      >
        <Icon icon={faAlignRightIcon} />
      </button>
    </div>
  );
};

export default ImageToolbar;
