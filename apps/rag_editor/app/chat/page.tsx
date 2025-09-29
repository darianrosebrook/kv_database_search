"use client";

import { useEffect } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { Display, BodyLarge } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Brain, Search } from "lucide-react";
import { useAppState } from "@/hooks/use-app-state";

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
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="space-y-4">
            <Display className="text-4xl">AI Assistant</Display>
            <BodyLarge className="text-muted-foreground">
              Start a conversation with your AI assistant. Ask questions about
              your documents, get insights, or explore connections in your
              knowledge base.
            </BodyLarge>
          </div>

          {chatTemplates.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {chatTemplates.map((template, index) => (
                <div
                  key={index}
                  className="p-6 bg-card border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-workspace-accent/20 rounded-lg flex items-center justify-center group-hover:bg-workspace-accent/30 transition-colors">
                      <template.icon className="h-6 w-6 text-workspace-accent" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{template.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button className="gap-2" size="lg" onClick={() => handleStartChat()}>
            <MessageSquare className="h-4 w-4" />
            Start New Chat
          </Button>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
