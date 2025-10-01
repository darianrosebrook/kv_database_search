"use client"

import { WorkspaceLayout } from "@/components/workspace-layout"
import { Display, BodyLarge } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare } from "lucide-react"
import styles from "./page.module.scss"

export default function WorkspacePage() {
  return (
    <WorkspaceLayout>
      <div className={styles.workspacePage}>
        <div className={styles.content}>
          <Display className={styles.heading}>Welcome Back</Display>
          <BodyLarge className={styles.description}>
            Select a document from the sidebar or create something new to get started.
          </BodyLarge>
          <div className={styles.actions}>
            <Button className={styles.primaryButton}>
              <FileText className={styles.icon} />
              New Document
            </Button>
            <Button variant="outline" className={styles.secondaryButton}>
              <MessageSquare className={styles.icon} />
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
