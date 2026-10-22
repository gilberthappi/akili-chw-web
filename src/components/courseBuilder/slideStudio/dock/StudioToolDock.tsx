import React from "react";
import {
  Square,
  Type,
  ChevronRight,
  ListPlus,
  Heading,
  Plus,
  PenTool,
  CircleDot,
  Waves,
  Shield,
  MessageSquare,
  ChevronsRight,
} from "lucide-react";
import { CornerRadii } from "../shapes/BentCard";

interface StudioToolDockProps {
  onAddBentCard: (radii?: CornerRadii, title?: string, fill?: string) => void;
  onAddHeading: (text?: string, size?: number) => void;
  onAddBodyText: (text?: string) => void;
  onAddOrganicBlob?: () => void;
  onAddWavyDivider?: () => void;
  onAddShieldBadge?: () => void;
  onAddSpeechBubble?: () => void;
  onAddChevronArrow?: () => void;
  onTogglePenTool?: () => void;
  isPenActive?: boolean;
}

export const StudioToolDock: React.FC<StudioToolDockProps> = ({
  onAddBentCard,
  onAddHeading,
  onAddBodyText,
  onAddOrganicBlob,
  onAddWavyDivider,
  onAddShieldBadge,
  onAddSpeechBubble,
  onAddChevronArrow,
  onTogglePenTool,
  isPenActive = false,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col select-none flex-shrink-0 z-20 shadow-xs">
      {/* Dock Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Elements
          </span>
        </div>
      </div>

      {/* Elements Drawer List */}
      <div className="p-3.5 space-y-5 overflow-y-auto flex-1">
        {/* Containers & Cards Section */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Containers
          </span>
          <button
            type="button"
            onClick={() => onAddBentCard([24, 24, 24, 24], "Container Card")}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Square className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Container Card
                </span>
                <span className="block text-[10px] text-slate-400">
                  Customizable rounded container
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
          </button>
        </div>

        {/* Shapes & Vectors Section (Day 3) */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Shapes & Vectors
          </span>
          <div className="space-y-1.5">
            {/* Freeform Pen Tool Toggle */}
            <button
              type="button"
              onClick={onTogglePenTool}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left ${
                isPenActive
                  ? "bg-blue-50 border-blue-400 shadow-2xs"
                  : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                    isPenActive
                      ? "bg-blue-600 border-blue-700 text-white"
                      : "bg-indigo-50 border-indigo-200 text-indigo-600"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <span
                    className={`block text-xs font-semibold transition ${
                      isPenActive ? "text-blue-700" : "text-slate-900"
                    }`}
                  >
                    Draw Path (Pen)
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {isPenActive ? "Active — click canvas" : "Click to draw custom vectors"}
                  </span>
                </div>
              </div>
              {isPenActive && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded font-semibold">
                  ON
                </span>
              )}
            </button>

            {/* Organic Blob */}
            <button
              type="button"
              onClick={onAddOrganicBlob}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <CircleDot className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Organic Blob
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Smooth fluid spline shape
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            {/* Wavy Divider */}
            <button
              type="button"
              onClick={onAddWavyDivider}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Wave Divider
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Curved section ribbon
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            {/* Medical Shield */}
            <button
              type="button"
              onClick={onAddShieldBadge}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Medical Shield
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Clinical badge & guidance
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            {/* Speech Bubble */}
            <button
              type="button"
              onClick={onAddSpeechBubble}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Speech Bubble
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Dialogue & clinical callout
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            {/* Workflow Chevron */}
            <button
              type="button"
              onClick={onAddChevronArrow}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <ChevronsRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Process Chevron
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Workflow step indicator
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>
          </div>
        </div>

        {/* Typography Section */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Typography
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onAddHeading("Main Slide Heading", 40)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition">
                  <Heading className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                    Slide Heading
                  </span>
                  <span className="block text-[10px] text-slate-400">40px Bold</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            <button
              type="button"
              onClick={() => onAddHeading("Sub-heading or Section", 24)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Sub-heading
                  </span>
                  <span className="block text-[10px] text-slate-400">24px Semibold</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            <button
              type="button"
              onClick={() => onAddBodyText("Add concise, impactful clinical points or instruction details here.")}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition">
                  <ListPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-800 group-hover:text-blue-600 transition">
                    Body Paragraph
                  </span>
                  <span className="block text-[10px] text-slate-400">16px Regular</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
