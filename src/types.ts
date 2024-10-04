export type InboxStatus = "Inbox" | "Done / Picked"

export interface ReleaseNode {
  name: string
  tagName: string
  createdAt: string
  publishedAt: string | null
  url: string
}
