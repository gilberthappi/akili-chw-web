import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  Trash2,
} from "lucide-react";
import {
  deleteChatConversation,
  getChatConversationMessages,
  listChatConversations,
  sendChatMessage,
  type ChatMessage,
} from "@/services/chat.service";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PANEL_H = 420;
const PANEL_W = 380;
const PANEL_H_EXPANDED = "85vh";
const PANEL_W_EXPANDED = "min(480px, 95vw)";
/** Expanded with the history list beside the messages. */
const PANEL_W_EXPANDED_HISTORY = "min(820px, 95vw)";

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Chats not yet saved by the server have a temporary id with this prefix. */
const LOCAL_PREFIX = "local-";

/**
 * A chat in the history list. History is saved on the server, so it follows
 * the user across devices; messages are fetched when a chat is opened.
 */
type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  /** null until fetched from the server */
  messages: ChatMessage[] | null;
};

function renderWithLinks(text: string): React.ReactNode[] {
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-primary underline hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

const localId = (): string =>
  `${LOCAL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;

const titleFrom = (text: string): string =>
  text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text;

export const ChatWidget: React.FC = () => {
  // Drop the `lng` option to make them follow the language chosen in Settings instead.
  const { t } = useTranslation(undefined, { lng: "rw" });
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const loading = loadingId !== null;
  const loadingHere = loadingId !== null && loadingId === activeId;
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  // Side by side when expanded; over the messages in the small panel.
  const historyBeside = expanded && showHistory;

  // Refresh the history list each time the chat is opened (it may have
  // changed on another device). Keeps messages already fetched.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setHistoryLoading(true);
    listChatConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations((prev) => {
          const known = new Map(prev.map((c) => [c.id, c]));
          const fromServer = list.map((c) => {
            const updatedAt = new Date(c.updatedAt).getTime();
            const old = known.get(c.id);
            // Changed elsewhere since fetched: fetch its messages again.
            const stale = old && old.updatedAt < updatedAt;
            return {
              id: c.id,
              title: c.title,
              updatedAt,
              messages: old && !stale ? old.messages : null,
            };
          });
          const unsaved = prev.filter((c) => c.id.startsWith(LOCAL_PREFIX));
          return [...unsaved, ...fromServer];
        });
      })
      .catch(() => {
        if (!cancelled) toast.error(t("chat.historyError"));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  // Fetch the messages of the open chat when they aren't loaded yet.
  const needsMessages = active !== null && active.messages === null;
  useEffect(() => {
    if (!activeId || !needsMessages) return;
    const id = activeId;
    let cancelled = false;
    setMessagesLoading(true);
    getChatConversationMessages(id)
      .then((msgs) => {
        if (cancelled) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, messages: msgs } : c)),
        );
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t("chat.historyError"));
        setActiveId(null);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
      setMessagesLoading(false);
    };
  }, [activeId, needsMessages, t]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, active?.messages, loadingHere]);

  /** Applies a change to one conversation and moves it to the top. */
  const updateConversation = (id: string, change: (c: Conversation) => Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...change(c), updatedAt: Date.now() } : c)),
    );
  };

  const startNewChat = () => {
    setActiveId(null);
    setInput("");
    if (!expanded) setShowHistory(false);
    inputRef.current?.focus();
  };

  const openConversation = (id: string) => {
    setActiveId(id);
    if (!expanded) setShowHistory(false);
  };

  const removeConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  };

  const deleteConversation = async (id: string) => {
    if (!id.startsWith(LOCAL_PREFIX)) {
      try {
        await deleteChatConversation(id);
      } catch {
        toast.error(t("chat.deleteError"));
        return;
      }
    }
    removeConversation(id);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || messagesLoading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const history = messages;

    // The first message starts a new conversation in the history list; it
    // gets its real id once the server has saved it.
    let id = activeId;
    if (!id) {
      id = localId();
      const created: Conversation = {
        id,
        title: titleFrom(text),
        messages: [userMsg],
        updatedAt: Date.now(),
      };
      setConversations((prev) => [created, ...prev]);
      setActiveId(id);
    } else {
      updateConversation(id, (c) => ({ ...c, messages: [...(c.messages ?? []), userMsg] }));
    }

    setLoadingId(id);
    try {
      const { reply, conversationId } = await sendChatMessage(
        text,
        history,
        id.startsWith(LOCAL_PREFIX) ? undefined : id,
      );
      // Goes to the conversation it was asked in, even if the user switched.
      updateConversation(id, (c) => ({
        ...c,
        messages: [...(c.messages ?? []), { role: "assistant", content: reply }],
      }));
      if (conversationId && conversationId !== id) {
        const from = id;
        setConversations((prev) =>
          prev.map((c) => (c.id === from ? { ...c, id: conversationId } : c)),
        );
        setActiveId((cur) => (cur === from ? conversationId : cur));
      }
    } catch {
      toast.error(t("chat.error"));
      if (history.length === 0) {
        removeConversation(id);
      } else {
        updateConversation(id, (c) => ({ ...c, messages: (c.messages ?? []).slice(0, -1) }));
      }
      setInput(text);
    } finally {
      setLoadingId(null);
    }
  };

  const iconButton =
    "rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700";

  const historyPanel = (
    <aside
      className={`flex flex-col bg-gray-50 ${
        historyBeside
          ? "w-60 shrink-0 border-r border-gray-200"
          : "absolute inset-0 z-10"
      }`}
      aria-label={t("chat.history")}
    >
      <div className="p-3">
        <button
          type="button"
          onClick={startNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100"
        >
          <SquarePen className="h-4 w-4 text-primary" />
          {t("chat.newChat")}
        </button>
      </div>
      <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t("chat.history")}
      </p>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {sorted.length === 0 && (
          <li className="px-2 py-4 text-center text-sm text-gray-400">
            {historyLoading ? t("chat.loadingHistory") : t("chat.noHistory")}
          </li>
        )}
        {sorted.map((c) => (
          <li key={c.id} className="group relative">
            <button
              type="button"
              onClick={() => openConversation(c.id)}
              title={c.title}
              className={`w-full truncate rounded-md py-2 pl-3 pr-8 text-left text-sm ${
                c.id === activeId
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {c.title}
            </button>
            <button
              type="button"
              onClick={() => deleteConversation(c.id)}
              disabled={c.id === loadingId}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:hidden"
              aria-label={t("chat.deleteChat")}
              title={t("chat.deleteChat")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <>
      {open && (
        <div
          className="fixed right-0 z-40 flex flex-col rounded-t-xl border border-gray-200 bg-white shadow-xl transition-[width,height] duration-200"
          style={{
            width: expanded
              ? showHistory
                ? PANEL_W_EXPANDED_HISTORY
                : PANEL_W_EXPANDED
              : PANEL_W,
            height: expanded ? PANEL_H_EXPANDED : PANEL_H,
            right: 24,
            bottom: 80,
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setShowHistory((s) => !s)}
                className={iconButton}
                aria-label={showHistory ? t("chat.hideHistory") : t("chat.showHistory")}
                title={showHistory ? t("chat.hideHistory") : t("chat.showHistory")}
              >
                {showHistory ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </button>
              <span className="truncate font-semibold text-gray-800">{t("chat.title")}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                className={iconButton}
                aria-label={t("chat.newChat")}
                title={t("chat.newChat")}
              >
                <SquarePen className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className={iconButton}
                aria-label={expanded ? t("chat.shrink") : t("chat.expand")}
                title={expanded ? t("chat.shrink") : t("chat.expand")}
              >
                {expanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={iconButton}
                aria-label={t("chat.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1">
            {showHistory && historyPanel}
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messagesLoading && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    {t("chat.loadingHistory")}
                  </p>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {t("chat.welcome")}
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.role === "assistant" ? renderWithLinks(m.content) : m.content}
                    </div>
                  </div>
                ))}
                {loadingHere && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: "0ms" }} />
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce mr-1" style={{ animationDelay: "150ms" }} />
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("chat.placeholder")}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={loading || messagesLoading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-primary px-3 py-2 text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t("chat.send")}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={open ? t("chat.close") : t("chat.open")}
        title={open ? t("chat.close") : t("chat.label")}
      >
        {open ? (
          <X className="h-7 w-7" />
        ) : (
          <>
            {/* Label curved along the top edge of the button, above the robot */}
            <svg
              viewBox="0 0 64 64"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <path id="chat-fab-arc" d="M 9,32 A 23,23 0 0 1 55,32" />
              </defs>
              <text
                fill="currentColor"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.4"
              >
                <textPath href="#chat-fab-arc" startOffset="50%" textAnchor="middle">
                  {t("chat.label")}
                </textPath>
              </text>
            </svg>
            <Bot className="mt-3 h-6 w-6" />
          </>
        )}
      </button>
    </>
  );
};
