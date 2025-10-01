"use client";

import { useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { Display, BodyLarge } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Brain, Search } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";
import styles from "./page.module.scss";

// Chat templates for different conversation types
const chatTemplates: Array<{
  title: string;
  description: string;
  icon: any;
  prompt: string;
}> = [
  {
    title: "Code Review Assistant",
    description:
      "Get help reviewing code, finding bugs, and improving code quality",
    icon: MessageSquare,
    prompt:
      "I'd like you to help me review some code. I can share code snippets and you'd help me identify potential issues, suggest improvements, and explain best practices.",
  },
  {
    title: "Learning Guide",
    description:
      "Learn new concepts and technologies with structured explanations",
    icon: Sparkles,
    prompt:
      "I want to learn about a new technology or concept. Please explain it step by step, starting with the basics and building up to more advanced topics. Use examples and ask questions to check my understanding.",
  },
  {
    title: "Problem Solver",
    description: "Debug issues, troubleshoot problems, and find solutions",
    icon: Brain,
    prompt:
      "I'm facing a technical problem or bug. I'll describe the issue, what I've tried, and the expected vs actual behavior. Help me diagnose the problem and suggest solutions.",
  },
  {
    title: "Documentation Helper",
    description:
      "Create documentation, explain APIs, and write technical guides",
    icon: Search,
    prompt:
      "I need help with technical documentation. This could involve explaining APIs, writing user guides, creating code comments, or documenting processes. Please help me create clear, comprehensive documentation.",
  },
];

export default function ChatHomePage() {
  const { openChatTab, tabs, addTab } = useAppState();

  // Create a chat tab when the page loads
  useEffect(() => {
    const existingChatTab = tabs.find(
      (tab) => tab.type === "chat" && !tab.content?.sessionId
    );
    if (!existingChatTab) {
      addTab({
        title: "Chat",
        type: "chat",
        isActive: true,
      });
    }
  }, [tabs, addTab]);

  const handleStartChat = (title?: string) => {
    openChatTab(undefined, title || "New Chat");
  };

  const handleTemplateClick = (template: (typeof chatTemplates)[0]) => {
    openChatTab(undefined, template.title);
  };

  return (
    <WorkspaceLayout>
      <div className={styles.chatPage}>
        <div className={styles.content}>
          <div className={styles.intro}>
            <Display className={styles.title}>AI Assistant</Display>
            <BodyLarge className={styles.description}>
              Start a conversation with your AI assistant. Ask questions about
              your documents, get insights, or explore connections in your
              knowledge base.
            </BodyLarge>
          </div>

          {chatTemplates.length > 0 && (
            <div className={styles.templates}>
              {chatTemplates.map((template, index) => (
                <div
                  key={index}
                  className={styles.templateCard}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className={styles.templateContent}>
                    <div className={styles.templateIconWrapper}>
                      <template.icon className={styles.templateIcon} />
                    </div>
                    <div className={styles.templateBody}>
                      <h3 className={styles.templateTitle}>{template.title}</h3>
                      <p className={styles.templateDescription}>
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            className={styles.startButton}
            size="lg"
            onClick={() => handleStartChat()}
          >
            <MessageSquare className={styles.startIcon} />
            Start New Chat
          </Button>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
