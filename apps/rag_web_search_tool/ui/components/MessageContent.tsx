/**
 * Message content component for chat messages
 */
import React from "react";
import styles from "./MessageContent.module.scss";

export interface MessageContentProps {
  content: string;
  type?: "text" | "markdown" | "html";
  className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  type = "text",
  className = "",
}) => {
  const renderContent = () => {
    switch (type) {
      case "html":
        return (
          <div
            className={styles.htmlContent}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      case "markdown":
        // Simple markdown rendering - you can enhance this
        return (
          <div className={styles.markdownContent}>
            {content.split("\n").map((line, index) => {
              if (line.startsWith("# ")) {
                return (
                  <h1 key={index} className={styles.h1}>
                    {line.slice(2)}
                  </h1>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h2 key={index} className={styles.h2}>
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <strong key={index} className={styles.bold}>
                    {line.slice(2, -2)}
                  </strong>
                );
              }
              if (line.startsWith("*") && line.endsWith("*")) {
                return (
                  <em key={index} className={styles.italic}>
                    {line.slice(1, -1)}
                  </em>
                );
              }
              if (line.trim() === "") {
                return <br key={index} />;
              }
              return (
                <p key={index} className={styles.paragraph}>
                  {line}
                </p>
              );
            })}
          </div>
        );
      default:
        return (
          <div className={styles.textContent}>
            {content.split("\n").map((line, index) => (
              <p key={index} className={styles.paragraph}>
                {line}
              </p>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`${styles.messageContent} ${className}`}>
      {renderContent()}
    </div>
  );
};

export default MessageContent;
