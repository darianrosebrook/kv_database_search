"use client"

import { WorkspaceLayout } from "@/components/workspace-layout"
import { Display, BodyLarge } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, Brain, Search } from "lucide-react"

const chatTemplates = [
  {
    title: "Document Analysis",
    description: "Analyze and summarize your documents",
    icon: Brain,
    prompt: "Help me analyze the key themes in my recent documents",
  },
  {
    title: "Research Assistant",
    description: "Find connections between your ideas",
    icon: Search,
    prompt: "What are the common patterns across my research notes?",
  },
  {
    title: "Creative Writing",
    description: "Generate content based on your knowledge",
    icon: Sparkles,
    prompt: "Help me write a summary of my project findings",
  },
]

export default function ChatHomePage() {
  return (
    <WorkspaceLayout>
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="space-y-4">
            <Display className="text-4xl">AI Assistant</Display>
            <BodyLarge className="text-muted-foreground">
              Start a conversation with your AI assistant. Ask questions about your documents, get insights, or explore
              connections in your knowledge base.
            </BodyLarge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {chatTemplates.map((template, index) => (
              <div
                key={index}
                className="p-6 bg-card border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-workspace-accent/20 rounded-lg flex items-center justify-center group-hover:bg-workspace-accent/30 transition-colors">
                    <template.icon className="h-6 w-6 text-workspace-accent" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="gap-2" size="lg">
            <MessageSquare className="h-4 w-4" />
            Start New Chat
          </Button>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
