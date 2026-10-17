import api from "./api";

export type ChatRating = "up" | "down";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** Set once the server has saved the message; only saved replies can be rated. */
  id?: string;
  rating?: ChatRating | null;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

/**
 * Sends a question. Pass the conversationId to continue a saved conversation;
 * without it the server starts a new one and returns its id.
 */
export const sendChatMessage = async (
  message: string,
  history: ChatMessage[] = [],
  conversationId?: string,
): Promise<{ reply: string; conversationId: string | null; replyId: string | null }> => {
  const { data } = await api.post<{
    reply: string;
    conversationId: string | null;
    replyId: string | null;
  }>(
    "/chat",
    {
      message,
      history: history.map(({ role, content }) => ({ role, content })),
      ...(conversationId ? { conversationId } : {}),
    },
    { timeout: 300_000 },
  );
  return data;
};

export const listChatConversations = async (): Promise<ChatConversationSummary[]> => {
  const { data } = await api.get<{ conversations: ChatConversationSummary[] }>(
    "/chat/conversations",
  );
  return data.conversations;
};

export const getChatConversationMessages = async (
  conversationId: string,
): Promise<ChatMessage[]> => {
  const { data } = await api.get<{ messages: ChatMessage[] }>(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
  return data.messages;
};

export const deleteChatConversation = async (conversationId: string): Promise<void> => {
  await api.delete(`/chat/conversations/${encodeURIComponent(conversationId)}`);
};

/**
 * Prepares a reply to be read aloud. Kinyarwanda comes back as audio from the
 * eBumenyi voice; other languages come back as text for the browser's own voice.
 */
export const speakChatReply = async (
  text: string,
): Promise<{ language: string; text: string; audioBase64?: string }> => {
  const { data } = await api.post<{ language: string; text: string; audioBase64?: string }>(
    "/chat/speak",
    { text },
    { timeout: 180_000 },
  );
  return data;
};

/** Rates one of Viki's replies; null removes the rating. */
export const rateChatMessage = async (
  messageId: string,
  rating: ChatRating | null,
): Promise<void> => {
  await api.put(`/chat/messages/${encodeURIComponent(messageId)}/rating`, { rating });
};
