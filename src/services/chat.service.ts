import api from "./api";

export type ChatMessage = { role: "user" | "assistant"; content: string };

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
): Promise<{ reply: string; conversationId: string | null }> => {
  const { data } = await api.post<{ reply: string; conversationId: string | null }>(
    "/chat",
    { message, history, ...(conversationId ? { conversationId } : {}) },
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
