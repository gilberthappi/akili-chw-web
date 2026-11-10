import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas as FabricCanvas, type FabricObject } from "fabric";
import {
  LayoutTemplate,
  Shapes,
  Type,
  CloudUpload,
  ChevronLeft,
  ChevronRight,
  Plus,
  PenTool,
  CircleDot,
  Waves,
  Shield,
  MessageSquare,
  ChevronsRight,
  ArrowRight,
  Square,
  Compass,
  Sparkles,
  Search,
  FileUp,
  Upload,
  Trash2,
  BookmarkPlus,
  FolderOpen,
  Layers,
} from "lucide-react";
import { CornerRadii } from "../shapes/BentCard";
import { STOCK_HEALTHCARE_PHOTOS } from "../media/types";
import { CURATED_ICON_CATALOG } from "../assets/iconCatalog";
import { IconCategory } from "../assets/types";
import { UserTemplateStorage, UserSlideTemplate } from "./slideTemplates";
import { LayerTreePanel } from "../layers/LayerTreePanel";

export type StudioDockTab = "templates" | "tools" | "text" | "uploads" | "layers";
export type ToolsSubCategory = "all" | "shapes" | "cards" | "icons";

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
  onAddSvgAsset?: (svgString: string, name?: string) => void;
  onAddConnectorLine?: (options?: Record<string, unknown>) => void;
  onTogglePenTool?: () => void;
  isPenActive?: boolean;
  onGetCanvasJson?: () => Record<string, unknown>;
  onLoadTemplateJson?: (json: Record<string, unknown>) => void;
  currentSlideTitle?: string;
  canvas?: FabricCanvas | null;
  selectedObject?: FabricObject | null;
  onSelectObject?: (obj: FabricObject | null) => void;
  onModify?: () => void;
  activeTab?: StudioDockTab | null;
  onTabChange?: (tab: StudioDockTab | null) => void;
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
  onAddSvgAsset,
  onAddConnectorLine,
  onTogglePenTool,
  isPenActive = false,
  onGetCanvasJson,
  onLoadTemplateJson,
  currentSlideTitle = "Untitled Slide",
  canvas,
  selectedObject,
  onSelectObject,
  onModify,
  activeTab: activeTabProp,
  onTabChange,
}) => {
  // Navigation: closed by default, opens only on user click
  const [activeTab, setActiveTab] = useState<StudioDockTab | null>(activeTabProp || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(Boolean(activeTabProp));

  // Sync with external activeTab if provided
  useEffect(() => {
    if (activeTabProp !== undefined) {
      setActiveTab(activeTabProp);
      setIsDrawerOpen(activeTabProp !== null);
    }
  }, [activeTabProp]);

  // Tools Sub-category filter
  const [toolsSubCategory, setToolsSubCategory] = useState<ToolsSubCategory>("all");

  // User Templates State
  const [userTemplates, setUserTemplates] = useState<UserSlideTemplate[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState<boolean>(false);
  const [templateNameInput, setTemplateNameInput] = useState<string>("");

  // Icon Search & Category
  const [iconCategory, setIconCategory] = useState<IconCategory>("all");
  const [iconSearch, setIconSearch] = useState<string>("");

  // Session Uploaded Images History
  const [sessionUploads, setSessionUploads] = useState<Array<{ id: string; url: string; name: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved templates on mount
  useEffect(() => {
    setUserTemplates(UserTemplateStorage.getAll());
  }, []);

  // Tab switching logic (Clicking active tab toggles drawer open/closed)
  const handleTabClick = (tab: StudioDockTab) => {
    if (activeTab === tab && isDrawerOpen) {
      setIsDrawerOpen(false);
      setActiveTab(null);
      onTabChange?.(null);
    } else {
      setActiveTab(tab);
      setIsDrawerOpen(true);
      onTabChange?.(tab);
    }
  };

  // Save current slide as template
  const handleSaveCurrentAsTemplate = () => {
    if (!onGetCanvasJson) return;
    const json = onGetCanvasJson();
    const name = templateNameInput.trim() || currentSlideTitle || "My Slide Template";
    const saved = UserTemplateStorage.save(name, json);
    setUserTemplates((prev) => [saved, ...prev]);
    setIsCreatingTemplate(false);
    setTemplateNameInput("");
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    UserTemplateStorage.remove(id);
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // Image upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        setSessionUploads((prev) => [
          { id: `upload-${Date.now()}`, url, name: file.name },
          ...prev,
        ]);
        onAddPhotoCard?.(url, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // SVG upload handler
  const handleSvgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const svgText = event.target?.result as string;
      if (svgText && onAddSvgAsset) {
        onAddSvgAsset(svgText, file.name.replace(/\.svg$/i, ""));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Filtered SVG Icons
  const filteredIcons = useMemo(() => {
    return CURATED_ICON_CATALOG.filter((item) => {
      const matchesCategory = iconCategory === "all" || item.category === iconCategory;
      const q = iconSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [iconCategory, iconSearch]);

  return (
    <aside className="relative flex select-none flex-shrink-0 z-20 h-full">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={svgFileInputRef}
        onChange={handleSvgFileUpload}
        accept=".svg,image/svg+xml"
        className="hidden"
      />

      {/* ── 1. Clean Slim Left Navigation Rail (72px) ───────────────────────── */}
      <div className="w-[72px] bg-white border-r border-slate-200 flex flex-col items-center py-3 space-y-2 shrink-0 z-30 shadow-2xs">
        {/* Templates Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("templates")}
          className={`flex flex-col items-center justify-center w-[58px] h-[56px] rounded-xl transition group ${
            isDrawerOpen && activeTab === "templates"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Templates — Saved layouts and presets"
        >
          <LayoutTemplate className="w-5 h-5 transition group-hover:scale-110" />
          <span className="text-[10px] mt-1 tracking-tight">Templates</span>
        </button>

        {/* Tools Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("tools")}
          className={`flex flex-col items-center justify-center w-[58px] h-[56px] rounded-xl transition group ${
            isDrawerOpen && activeTab === "tools"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Tools — Shapes, containers, vectors & icons"
        >
          <Shapes className="w-5 h-5 transition group-hover:scale-110" />
          <span className="text-[10px] mt-1 tracking-tight">Tools</span>
        </button>

        {/* Text Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("text")}
          className={`flex flex-col items-center justify-center w-[58px] h-[56px] rounded-xl transition group ${
            isDrawerOpen && activeTab === "text"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Text — Headings, body & curved typography"
        >
          <Type className="w-5 h-5 transition group-hover:scale-110" />
          <span className="text-[10px] mt-1 tracking-tight">Text</span>
        </button>

        {/* Uploads Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("uploads")}
          className={`flex flex-col items-center justify-center w-[58px] h-[56px] rounded-xl transition group ${
            isDrawerOpen && activeTab === "uploads"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Uploads — Photos, SVGs & stock gallery"
        >
          <CloudUpload className="w-5 h-5 transition group-hover:scale-110" />
          <span className="text-[10px] mt-1 tracking-tight">Uploads</span>
        </button>

        {/* Layers Tab */}
        <button
          type="button"
          onClick={() => handleTabClick("layers")}
          className={`flex flex-col items-center justify-center w-[58px] h-[56px] rounded-xl transition group ${
            isDrawerOpen && activeTab === "layers"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
          title="Layers — Object hierarchy, locking & visibility"
        >
          <Layers className="w-5 h-5 transition group-hover:scale-110" />
          <span className="text-[10px] mt-1 tracking-tight">Layers</span>
        </button>
      </div>

      {/* ── 2. Expandable Content Drawer (Only open when clicked) ─────────── */}
      {isDrawerOpen && activeTab && (
        <div className="w-[310px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-xs relative">
          {/* Drawer Header */}
          <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              {activeTab === "templates" && "My Templates"}
              {activeTab === "tools" && "Tools & Elements"}
              {activeTab === "text" && "Text & Typography"}
              {activeTab === "uploads" && "Uploads & Media"}
              {activeTab === "layers" && "Layers & Hierarchy"}
            </span>

            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                setActiveTab(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              title="Close panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* ──────── TAB 1: TEMPLATES (User-Created Only) ──────── */}
            {activeTab === "templates" && (
              <div className="space-y-3">
                {/* Save Current Slide Action */}
                {!isCreatingTemplate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingTemplate(true);
                      setTemplateNameInput(currentSlideTitle || "");
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 hover:border-blue-400 text-blue-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs group"
                    title="Save current slide layout to your personal template library"
                  >
                    <BookmarkPlus className="w-4 h-4 text-blue-600 transition group-hover:scale-110" />
                    <span>Save Slide as Template</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl border border-blue-300 bg-blue-50/40 space-y-2">
                    <span className="block text-[11px] font-semibold text-blue-900">
                      Name your template
                    </span>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Template name..."
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCurrentAsTemplate();
                        if (e.key === "Escape") setIsCreatingTemplate(false);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center space-x-1.5 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(false)}
                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200/60 rounded-md transition"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCurrentAsTemplate}
                        className="px-3 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition"
                        title="Save template"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved Templates List */}
                {userTemplates.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      No saved templates yet
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-[200px]">
                      Build your slide on the canvas, then click &ldquo;Save Slide as Template&rdquo; to reuse it anytime.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Saved Layouts ({userTemplates.length})
                    </span>

                    <div className="space-y-1.5">
                      {userTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => onLoadTemplateJson?.(tpl.json)}
                          className="group p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex items-center justify-between cursor-pointer"
                          title={`Click to load "${tpl.name}" onto canvas`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                              <LayoutTemplate className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">
                                {tpl.name}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(tpl.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(e, tpl.id)}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── TAB 2: TOOLS (ELEMENTS) ──────── */}
            {activeTab === "tools" && (
              <div className="space-y-3.5">
                {/* Sub-category Quick Filter Pills */}
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-center">
                  {(["all", "shapes", "cards", "icons"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setToolsSubCategory(cat)}
                      className={`py-1 rounded-md capitalize transition ${
                        toolsSubCategory === cat
                          ? "bg-white text-blue-700 font-semibold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title={`Filter by ${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Containers & Shapes Grid (Clean, compact icon tiles) */}
                {(toolsSubCategory === "all" || toolsSubCategory === "cards" || toolsSubCategory === "shapes") && (
                  <div className="space-y-2">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Shapes & Containers
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Container Card */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "cards") && (
                        <button
                          type="button"
                          onClick={() => onAddBentCard([24, 24, 24, 24], "Container Card")}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Container Card — Rounded content container"
                        >
                          <Square className="w-5 h-5 text-blue-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Card
                          </span>
                        </button>
                      )}

                      {/* Pen Tool Toggle */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onTogglePenTool}
                          className={`h-16 rounded-xl border transition flex flex-col items-center justify-center p-1 group relative ${
                            isPenActive
                              ? "bg-blue-50 border-blue-400 shadow-2xs text-blue-700"
                              : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs text-slate-700"
                          }`}
                          title="Draw Path (Pen) — Click to draw custom vector spline"
                        >
                          <PenTool className="w-5 h-5 text-indigo-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium mt-1 truncate max-w-full">
                            Pen
                          </span>
                          {isPenActive && (
                            <span className="absolute top-1 right-1 text-[8px] px-1 bg-blue-600 text-white rounded font-bold">
                              ON
                            </span>
                          )}
                        </button>
                      )}

                      {/* Organic Blob */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onAddOrganicBlob}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Organic Blob — Fluid smooth organic shape"
                        >
                          <CircleDot className="w-5 h-5 text-sky-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Blob
                          </span>
                        </button>
                      )}

                      {/* Wave Divider */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onAddWavyDivider}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Wave Divider — Curved wave section ribbon"
                        >
                          <Waves className="w-5 h-5 text-blue-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Wave
                          </span>
                        </button>
                      )}

                      {/* Medical Shield */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onAddShieldBadge}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Medical Shield — Clinical badge & guidance crest"
                        >
                          <Shield className="w-5 h-5 text-emerald-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Shield
                          </span>
                        </button>
                      )}

                      {/* Speech Bubble */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onAddSpeechBubble}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Speech Bubble — Dialogue & patient quote callout"
                        >
                          <MessageSquare className="w-5 h-5 text-purple-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Bubble
                          </span>
                        </button>
                      )}

                      {/* Process Chevron */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={onAddChevronArrow}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Process Chevron — Directional workflow step indicator"
                        >
                          <ChevronsRight className="w-5 h-5 text-amber-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Chevron
                          </span>
                        </button>
                      )}

                      {/* Connector Arrow */}
                      {(toolsSubCategory === "all" || toolsSubCategory === "shapes") && (
                        <button
                          type="button"
                          onClick={() => onAddConnectorLine?.()}
                          className="h-16 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center p-1 group"
                          title="Connector Arrow — Line connecting slide elements"
                        >
                          <ArrowRight className="w-5 h-5 text-blue-600 transition group-hover:scale-110" />
                          <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                            Connector
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Icons & Vector Assets */}
                {(toolsSubCategory === "all" || toolsSubCategory === "icons") && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Vector Icons
                      </span>
                      <button
                        type="button"
                        onClick={() => svgFileInputRef.current?.click()}
                        className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition"
                        title="Upload custom SVG vector icon"
                      >
                        <FileUp className="w-3 h-3" />
                        <span>Upload SVG</span>
                      </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search icons..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Category Tabs */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold">
                      {(["all", "clinical", "community", "education"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setIconCategory(cat)}
                          className={`py-1 rounded capitalize transition ${
                            iconCategory === cat
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                          title={`Show ${cat} icons`}
                        >
                          {cat === "all" ? "All" : cat}
                        </button>
                      ))}
                    </div>

                    {/* Icon Grid (Clean 4-column tiles with hover tooltips) */}
                    <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1 bg-slate-50/50 border border-slate-200 rounded-xl">
                      {filteredIcons.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onAddSvgAsset?.(item.svg, item.name)}
                          title={`Insert icon: ${item.name}`}
                          className="h-12 flex items-center justify-center rounded-lg bg-white border border-slate-100 hover:border-blue-400 hover:shadow-xs transition group"
                        >
                          <div
                            className="w-5 h-5 flex items-center justify-center transition group-hover:scale-115"
                            dangerouslySetInnerHTML={{ __html: item.svg }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── TAB 3: TEXT ──────── */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Text Elements
                </span>

                <div className="space-y-2">
                  {/* Heading */}
                  <button
                    type="button"
                    onClick={() => onAddHeading("Add a Heading", 42)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition text-left group"
                    title="Add a 42px bold heading to slide"
                  >
                    <span className="block text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Add a Heading
                    </span>
                  </button>

                  {/* Subheading */}
                  <button
                    type="button"
                    onClick={() => onAddHeading("Add a Subheading", 26)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition text-left group"
                    title="Add a 26px semibold section subheading"
                  >
                    <span className="block text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      Add a Subheading
                    </span>
                  </button>

                  {/* Body Paragraph */}
                  <button
                    type="button"
                    onClick={() => onAddBodyText("Add concise clinical instructions or descriptions here.")}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition text-left group"
                    title="Add an 18px body paragraph text block"
                  >
                    <span className="block text-xs text-slate-600 group-hover:text-blue-600 transition">
                      Add body text
                    </span>
                  </button>
                </div>

                {/* Typography Presets */}
                <div className="pt-2 space-y-2">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Typography Presets
                  </span>

                  <div className="grid grid-cols-2 gap-2">
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
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 hover:shadow-xs transition flex flex-col items-center justify-center text-center group"
                      title="Curved Arc Title (+45° circular arced headline)"
                    >
                      <Compass className="w-5 h-5 text-blue-600 transition group-hover:scale-110" />
                      <span className="text-[11px] font-bold text-blue-900 mt-1">
                        Curved Arc
                      </span>
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
                      className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400 hover:shadow-xs transition flex flex-col items-center justify-center text-center group"
                      title="Gradient Hero Title (Dual-color linear blended title)"
                    >
                      <Sparkles className="w-5 h-5 text-purple-600 transition group-hover:scale-110" />
                      <span className="text-[11px] font-bold text-purple-900 mt-1">
                        Gradient Hero
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ──────── TAB 4: UPLOADS ──────── */}
            {activeTab === "uploads" && (
              <div className="space-y-3">
                {/* Upload Action */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 border border-dashed border-blue-300 rounded-xl bg-blue-50/40 hover:bg-blue-50 hover:border-blue-500 transition flex flex-col items-center justify-center text-center group"
                    title="Upload local PNG, JPG, or WebP photo"
                  >
                    <Upload className="w-5 h-5 text-blue-600 transition group-hover:scale-110" />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">
                      Upload Photo
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => svgFileInputRef.current?.click()}
                    className="p-3 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 transition flex flex-col items-center justify-center text-center group"
                    title="Upload custom SVG vector graphic"
                  >
                    <FileUp className="w-5 h-5 text-emerald-600 transition group-hover:scale-110" />
                    <span className="text-[11px] font-semibold text-slate-800 mt-1">
                      Upload SVG
                    </span>
                  </button>
                </div>

                {/* Session Uploads (if any) */}
                {sessionUploads.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Recent Uploads
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {sessionUploads.map((up) => (
                        <button
                          key={up.id}
                          type="button"
                          onClick={() => onAddPhotoCard?.(up.url, up.name)}
                          title={`Insert uploaded file: ${up.name}`}
                          className="h-16 rounded-lg border border-slate-200 overflow-hidden relative transition hover:scale-105 group"
                        >
                          <img src={up.url} alt={up.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Plus className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curated Healthcare Stock Photos */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Stock Healthcare Photos
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {STOCK_HEALTHCARE_PHOTOS.map((stock) => (
                      <button
                        key={stock.id}
                        type="button"
                        onClick={() => onAddPhotoCard?.(stock.url, stock.title)}
                        title={`Insert "${stock.title}" (or mask into selected shape)`}
                        className="rounded-xl border border-slate-200 overflow-hidden relative transition hover:scale-102 hover:shadow-xs group bg-white"
                      >
                        <div className="h-20 w-full overflow-hidden relative">
                          <img
                            src={stock.thumbnailUrl}
                            alt={stock.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──────── TAB 5: LAYERS (Z-Index Hierarchy) ──────── */}
            {activeTab === "layers" && (
              <div className="h-full -m-3.5">
                <LayerTreePanel
                  canvas={canvas ?? null}
                  selectedObject={selectedObject ?? null}
                  onSelectObject={onSelectObject}
                  onModify={onModify}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Floating Edge Toggle Pill ────────────────────────────────────── */}
      {isDrawerOpen && (
        <button
          type="button"
          onClick={() => {
            setIsDrawerOpen(false);
            setActiveTab(null);
          }}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-40 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 transition"
          title="Close panel"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
    </aside>
  );
};
