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
  Image as ImageIcon,
  Upload,
  Compass,
  Sparkles,
} from "lucide-react";
import { CornerRadii } from "../shapes/BentCard";
import { STOCK_HEALTHCARE_PHOTOS } from "../media/types";

interface StudioToolDockProps {
  onAddBentCard: (radii?: CornerRadii, title?: string, fill?: string) => void;
  onAddHeading: (text?: string, size?: number) => void;
  onAddBodyText: (text?: string) => void;
  onAddOrganicBlob?: () => void;
  onAddWavyDivider?: () => void;
  onAddShieldBadge?: () => void;
  onAddSpeechBubble?: () => void;
  onAddChevronArrow?: () => void;
  onAddPhotoCard?: (url: string, title?: string) => void;
  onAddCurvedText?: (
    text?: string,
    curvature?: number,
    fontSize?: number,
    options?: Record<string, unknown>
  ) => void;
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
  onAddPhotoCard,
  onAddCurvedText,
  onTogglePenTool,
  isPenActive = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url && onAddPhotoCard) {
        onAddPhotoCard(url, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col select-none flex-shrink-0 z-20 shadow-xs">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

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

        {/* Photos & Media Section (Day 5) */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Photos & Media
          </span>
          <div className="space-y-1.5">
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-blue-400 transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                    Upload Photo
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    PNG, JPG, WebP
                  </span>
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            </button>

            {/* Quick-insert stock grid */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {STOCK_HEALTHCARE_PHOTOS.slice(0, 3).map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => onAddPhotoCard?.(stock.url, stock.title)}
                  title={`Mask "${stock.title}" into selected shape, or add as photo card`}
                  className="h-14 rounded-lg border border-slate-200 overflow-hidden relative transition hover:scale-105 group"
                >
                  <img
                    src={stock.thumbnailUrl}
                    alt={stock.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
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

        {/* Typography Section (Day 6) */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Typography Studio
          </span>
          <div className="space-y-1.5">
            {/* Curved Arc Title Preset */}
            <button
              type="button"
              onClick={() =>
                onAddCurvedText?.("CURVED SLIDE BANNER", 45, 36, {
                  fontFamily: "Outfit",
                  fontWeight: "bold",
                  fill: "#2563EB",
                  charSpacing: 60,
                })
              }
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-blue-900 group-hover:text-blue-700 transition">
                    Curved Arc Title
                  </span>
                  <span className="block text-[10px] text-blue-600/80">
                    +45° Arched Banner
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-700 transition" />
            </button>

            {/* Gradient Hero Title Preset */}
            <button
              type="button"
              onClick={() =>
                onAddCurvedText?.("Impactful Headline", 0, 44, {
                  fontFamily: "Montserrat",
                  fontWeight: "800",
                  gradient: {
                    enabled: true,
                    type: "linear",
                    angle: 90,
                    stops: [
                      { offset: 0, color: "#2563EB" },
                      { offset: 1, color: "#06B6D4" },
                    ],
                  },
                })
              }
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                    Gradient Hero Title
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Dual-color linear blend
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </button>

            {/* Standard Heading */}
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
