"use client"

import { WorkspaceLayout } from "@/components/workspace-layout"
import { Display, BodyLarge } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare } from "lucide-react"

export default function WorkspacePage() {
  return (
    <WorkspaceLayout>
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <Display className="text-4xl">Welcome Back</Display>
          <BodyLarge className="text-muted-foreground">
            Select a document from the sidebar or create something new to get started.
          </BodyLarge>
          <div className="flex gap-3 justify-center">
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              New Document
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <MessageSquare className="h-4 w-4" />
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
