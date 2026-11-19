export type InboxTab = "messages" | "notifications";

/** Whether each tab has something from another bro since you last opened it. */
export type InboxUnread = Record<InboxTab, boolean>;
