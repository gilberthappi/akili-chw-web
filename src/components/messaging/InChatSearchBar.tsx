import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { IMessage } from "@/types";

interface InChatSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: IMessage[];
  onSelectMatch: (messageId: string) => void;
}

export const InChatSearchBar: React.FC<InChatSearchBarProps> = ({
  isOpen,
  onClose,
  messages,
  onSelectMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchingIds, setMatchingIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setMatchingIds([]);
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchingIds([]);
      setCurrentIndex(-1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const matches = messages
      .filter((m) => {
        const contentMatch = m.content?.toLowerCase().includes(term);
        const titleMatch = m.title?.toLowerCase().includes(term);
        const senderMatch = m.sender?.fullNames?.toLowerCase().includes(term);
        return contentMatch || titleMatch || senderMatch;
      })
      .map((m) => m.id);

    setMatchingIds(matches);
    if (matches.length > 0) {
      setCurrentIndex(0);
      onSelectMatch(matches[0]);
    } else {
      setCurrentIndex(-1);
    }
  }, [searchTerm, messages]);

  const handleNext = () => {
    if (matchingIds.length === 0) return;
    const nextIdx = (currentIndex + 1) % matchingIds.length;
    setCurrentIndex(nextIdx);
    onSelectMatch(matchingIds[nextIdx]);
  };

  const handlePrev = () => {
    if (matchingIds.length === 0) return;
    const prevIdx = (currentIndex - 1 + matchingIds.length) % matchingIds.length;
    setCurrentIndex(prevIdx);
    onSelectMatch(matchingIds[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="px-4 py-2 bg-white/95 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between gap-3 shadow-xs z-20 animate-in slide-in-from-top-2 duration-150">
      <div className="flex-1 flex items-center gap-2 max-w-md bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in conversation..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Count & Nav Buttons */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        {searchTerm.trim() ? (
          <span className="text-[11px] font-semibold text-slate-600 mr-1">
            {matchingIds.length > 0
              ? `${currentIndex + 1} of ${matchingIds.length}`
              : "0 results"}
          </span>
        ) : null}

        <button
          onClick={handlePrev}
          disabled={matchingIds.length === 0}
          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
          title="Previous result (Shift+Enter)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={matchingIds.length === 0}
          className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
          title="Next result (Enter)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          title="Close search (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
