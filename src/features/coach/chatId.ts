// The current coach chat: one conversation carries from before a brew into it,
// and a new one starts once it has sat unused for a while.
const KEY = "bloom.coach.chat";
const FRESH_MS = 3 * 60 * 60 * 1000;

function store(id: string) {
  localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() }));
  return id;
}

export function newChatId() {
  return store(crypto.randomUUID());
}

/** The chat to open: the last one if it was used recently, otherwise a new one. */
export function currentChatId() {
  try {
    const { id, at } = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (typeof id === "string" && Date.now() - at < FRESH_MS) return id as string;
  } catch {
    // Nothing stored yet
  }
  return newChatId();
}

/** Make an earlier chat the current one. */
export function openChat(id: string) {
  return store(id);
}

/** Mark the chat as used now. */
export function touchChat(id: string) {
  store(id);
}
