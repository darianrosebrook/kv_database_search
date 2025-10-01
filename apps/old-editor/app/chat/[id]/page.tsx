"use client"

import { WorkspaceLayout } from "@/components/workspace-layout"
import { ChatInterface } from "@/components/ui/chat-interface"

export default function ChatPage({ params }: { params: { id: string } }) {
  const handleSendMessage = (message: string, attachments?: File[]) => {
    console.log("Sending message:", message, "with attachments:", attachments)
    // Here you would integrate with your AI service
  }

  return (
    <WorkspaceLayout>
      <ChatInterface onSendMessage={handleSendMessage} />
    </WorkspaceLayout>
  )
}
