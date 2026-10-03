import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Maximize2, Minimize2 } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/services/chat.service";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PANEL_H = 420;
const PANEL_W = 380;
const PANEL_H_EXPANDED = "85vh";
const PANEL_W_EXPANDED = "min(480px, 95vw)";

const URL_RE = /(https?:\/\/[^\s)]+)/g;

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

export const ChatWidget: React.FC = () => {
  // Drop the `lng` option to make them follow the language chosen in Settings instead.
  const { t } = useTranslation(undefined, { lng: "rw" });
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { reply } = await sendChatMessage(text, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      toast.error(t("chat.error"));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed right-0 z-40 flex flex-col rounded-t-xl border border-gray-200 bg-white shadow-xl transition-[width,height] duration-200"
          style={{
            width: expanded ? PANEL_W_EXPANDED : PANEL_W,
            height: expanded ? PANEL_H_EXPANDED : PANEL_H,
            right: 24,
            bottom: 80,
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <span className="font-semibold text-gray-800">{t("chat.title")}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={expanded ? t("chat.shrink") : t("chat.expand")}
                title={expanded ? t("chat.shrink") : t("chat.expand")}
              >
                {expanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("chat.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
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
            {loading && (
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
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
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
