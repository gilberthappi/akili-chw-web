import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  IText,
  Rect,
  FabricImage,
  type FabricObject,
} from "fabric";
import {
  Plus,
  Search,
  ZoomIn,
  ZoomOut,
  Type,
  Image as ImageIcon,
  Calendar,
  Hash,
  BookOpen,
  BarChart2,
  Clock,
  User,
  GraduationCap,
  ArrowLeft,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  FileText,
  QrCode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_WIDTH  = 1056; // 11in @ 96 dpi — landscape
const CANVAS_HEIGHT = 816;  // 8.5in @ 96 dpi

const MOCK_TEMPLATES = [
  { id: "new", name: "New template" },
  { id: "t1",  name: "Vent and Defib" },
  { id: "t2",  name: "DHMC01" },
  { id: "t3",  name: "One Health Exchange" },
];

const ELEMENT_SECTIONS = [
  {
    label: "CERTIFICATE",
    items: [
      { key: "text",      label: "Text",             icon: Type       },
      { key: "image",     label: "Image",            icon: ImageIcon  },
      { key: "cert-code", label: "Certificate code", icon: Hash       },
      { key: "qr",        label: "QR code",          icon: QrCode     },
      { key: "date",      label: "Current Date",     icon: Calendar   },
    ],
  },
  {
    label: "COURSE",
    items: [
      { key: "course-name", label: "Course name",     icon: BookOpen  },
      { key: "details",     label: "Details",         icon: FileText  },
      { key: "progress",    label: "Progress",        icon: BarChart2 },
      { key: "duration",    label: "Course Duration", icon: Clock     },
      { key: "start-date",  label: "Start Date",      icon: Calendar  },
      { key: "end-date",    label: "End Date",        icon: Calendar  },
    ],
  },
  {
    label: "STUDENT",
    items: [
      { key: "student-name", label: "Student name", icon: User },
      { key: "student-code", label: "Student code", icon: Hash },
    ],
  },
  {
    label: "INSTRUCTOR",
    items: [
      { key: "instructor-name", label: "Instructor name", icon: GraduationCap },
    ],
  },
];

const DISPLAY_LABEL: Record<string, string> = {
  "cert-code":       "Certificate Code",
  "date":            "Current Date",
  "course-name":     "-Course name-",
  "details":         "-Details-",
  "progress":        "-Progress-",
  "duration":        "-Duration-",
  "start-date":      "-Start Date-",
  "end-date":        "-End Date-",
  "student-name":    "-Student name-",
  "student-code":    "-Student code-",
  "instructor-name": "-Instructor name-",
};

const TOKEN_VALUE: Record<string, string> = {
  "cert-code":       "{{certificateCode}}",
  "date":            "{{currentDate}}",
  "course-name":     "{{courseName}}",
  "details":         "{{courseDetails}}",
  "progress":        "{{progress}}",
  "duration":        "{{courseDuration}}",
  "start-date":      "{{startDate}}",
  "end-date":        "{{endDate}}",
  "student-name":    "{{studentName}}",
  "student-code":    "{{studentCode}}",
  "instructor-name": "{{instructorName}}",
};

const BG_COLORS = [
  "#ffffff", "#f8fafc", "#eff6ff", "#f0fdf4",
  "#fefce8", "#fdf2f8", "#0f172a", "#1e3a5f",
  "#166534", "#7f1d1d",
];

// ── Component ─────────────────────────────────────────────────────────────────

const CertificateDesignEditor: React.FC = () => {
  const navigate     = useNavigate();
  const canvasElRef  = useRef<HTMLCanvasElement>(null);
  const fabricRef    = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for history — avoids stale-closure issues in fabric event handlers
  const historyRef    = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const historyLock   = useRef(false);

  // Zoom ref mirrors zoom state so async callbacks always see current value
  const zoomRef = useRef(75);

  // UI state
  const [activeTab,      setActiveTab]      = useState<"certificates" | "link-certificates">("certificates");
  const [rightTab,       setRightTab]       = useState<"elements" | "backgrounds">("elements");
  const [activeTemplate, setActiveTemplate] = useState("new");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [zoom,           setZoom]           = useState(75);

  // Canvas-driven re-render trigger — reading refs in JSX won't auto-update
  const [, setTick] = useState(0);
  const bumpTick = useCallback(() => setTick((n) => n + 1), []);

  // Selected fabric object (reference to the live Fabric object)
  const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null);

  // ── Zoom ────────────────────────────────────────────────────────────────────

  const changeZoom = useCallback((next: number) => {
    const clamped = Math.max(25, Math.min(200, next));
    zoomRef.current = clamped;
    setZoom(clamped);
  }, []);

  // ── History ──────────────────────────────────────────────────────────────────

  const saveSnapshot = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || historyLock.current) return;
    const json = JSON.stringify(canvas.toJSON(["tokenKey", "token"]));
    const h = historyRef.current.slice(0, historyIdxRef.current + 1);
    h.push(json);
    historyRef.current    = h;
    historyIdxRef.current = h.length - 1;
    bumpTick();
  }, [bumpTick]);

  const applySnapshot = useCallback(async (idx: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyLock.current = true;
    await canvas.loadFromJSON(JSON.parse(historyRef.current[idx]));
    const scale = zoomRef.current / 100;
    canvas.setZoom(scale);
    canvas.setDimensions({ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale });
    canvas.renderAll();
    historyLock.current   = false;
    historyIdxRef.current = idx;
    setSelectedObj(null);
    bumpTick();
  }, [bumpTick]);

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) applySnapshot(historyIdxRef.current - 1);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1)
      applySnapshot(historyIdxRef.current + 1);
  }, [applySnapshot]);

  // ── Fabric init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el || fabricRef.current) return;

    const scale  = zoomRef.current / 100;
    const canvas = new FabricCanvas(el, {
      width:                  CANVAS_WIDTH  * scale,
      height:                 CANVAS_HEIGHT * scale,
      backgroundColor:        "#ffffff",
      preserveObjectStacking: true,
    });
    canvas.setZoom(scale);
    fabricRef.current = canvas;

    const onSelectChange = () => {
      setSelectedObj(canvas.getActiveObject() ?? null);
      bumpTick();
    };
    canvas.on("selection:created", onSelectChange);
    canvas.on("selection:updated", onSelectChange);
    canvas.on("selection:cleared", () => { setSelectedObj(null); bumpTick(); });
    canvas.on("object:modified",   saveSnapshot);
    canvas.on("object:added",      saveSnapshot);
    canvas.on("object:removed",    saveSnapshot);

    // Seed history with empty canvas state
    historyRef.current    = [JSON.stringify(canvas.toJSON())];
    historyIdxRef.current = 0;
    bumpTick();

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [saveSnapshot, bumpTick]);

  // ── Sync zoom to canvas ───────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const scale = zoom / 100;
    canvas.setZoom(scale);
    canvas.setDimensions({ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale });
  }, [zoom]);

  // ── Add elements ──────────────────────────────────────────────────────────────

  const addElement = useCallback((key: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (key === "image") { fileInputRef.current?.click(); return; }

    if (key === "qr") {
      const r = new Rect({
        left: 300, top: 300, width: 120, height: 120,
        fill: "#f9fafb", stroke: "#9ca3af", strokeWidth: 1,
        strokeDashArray: [5, 5], rx: 4, ry: 4,
      });
      (r as Record<string, unknown>).tokenKey = "qr";
      canvas.add(r);
      canvas.setActiveObject(r);
      canvas.renderAll();
      return;
    }

    const content = key === "text" ? "New text" : (DISPLAY_LABEL[key] ?? "New text");
    const token   = TOKEN_VALUE[key];
    const isToken = !!token;

    const t = new IText(content, {
      left:       300,
      top:        300,
      fontSize:   key === "text" ? 20 : 22,
      fill:       "#334155",
      fontFamily: "Arial",
      textAlign:  "center",
      fontStyle:  isToken ? "italic" : "normal",
    });
    if (token)   (t as Record<string, unknown>).token    = token;
    if (isToken) (t as Record<string, unknown>).tokenKey = key;

    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.renderAll();
  }, []);

  // ── Image upload ──────────────────────────────────────────────────────────────

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = URL.createObjectURL(file);
    const img = await FabricImage.fromURL(url);
    img.scaleToWidth(Math.min(300, CANVAS_WIDTH * 0.35));
    img.set({ left: 100, top: 100 });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    URL.revokeObjectURL(url);
    e.target.value = "";
  }, []);

  // ── Canvas operations ─────────────────────────────────────────────────────────

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    setSelectedObj(null);
    canvas.renderAll();
  }, []);

  const duplicateSelected = useCallback(async () => {
    const canvas = fabricRef.current;
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const cloned = await obj.clone();
    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
  }, []);

  const updateSelected = useCallback((props: Record<string, unknown>) => {
    const canvas = fabricRef.current;
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    (obj as Record<string, unknown> & { set: (p: Record<string, unknown>) => void }).set(props);
    canvas.renderAll();
    bumpTick();
  }, [bumpTick]);

  const setBackground = useCallback((color: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const filteredTemplates = MOCK_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  // Properties from selected object — read live from fabric object reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sel        = selectedObj as any;
  const selLeft    = sel ? Math.round(sel.left  ?? 0) : 0;
  const selTop     = sel ? Math.round(sel.top   ?? 0) : 0;
  const selW       = sel ? Math.round((sel.width  ?? 0) * (sel.scaleX ?? 1)) : 0;
  const selH       = sel ? Math.round((sel.height ?? 0) * (sel.scaleY ?? 1)) : 0;
  const selIsText  = selectedObj instanceof IText;
  const selFontSz  = selIsText ? (sel.fontSize  ?? 20)        : 20;
  const selColor   = selIsText ? (sel.fill       ?? "#334155") : "#334155";
  const selBold    = selIsText && sel.fontWeight === "bold";
  const selAlign   = selIsText ? (sel.textAlign  ?? "center")  : "center";
  const selOpacity = sel ? (sel.opacity ?? 1) : 1;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 bg-white z-10">

        <button
          onClick={() => navigate("/certificates")}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
          title="Back to Certificates"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="text-sm font-semibold text-gray-800 pr-4 border-r border-gray-200">
          Certificate Builder
        </span>

        {/* Center tabs */}
        <div className="flex-1 flex items-center justify-center">
          {(["certificates", "link-certificates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 h-12 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "certificates" ? "Certificates" : "Link Certificates"}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4 text-gray-600" />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => toast.success("PDF generation coming in Step 5")}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-gray-700 transition-colors whitespace-nowrap"
          >
            Generate Mock Certificate
          </button>

          {/* Zoom controls */}
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden ml-1">
            <button
              onClick={() => changeZoom(zoom - 10)}
              className="px-2 py-1.5 hover:bg-gray-100 transition-colors border-r border-gray-200"
            >
              <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span className="px-3 text-xs font-medium text-gray-700 w-14 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => changeZoom(zoom + 10)}
              className="px-2 py-1.5 hover:bg-gray-100 transition-colors border-l border-gray-200"
            >
              <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Template list */}
        <aside className="w-64 border-r border-gray-200 flex flex-col shrink-0 bg-white">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              Certificates{" "}
              <span className="text-gray-400 font-normal text-xs">{MOCK_TEMPLATES.length}</span>
            </span>
            <button
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
              title="New template"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search certificates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all ${
                  activeTemplate === tmpl.id
                    ? "border-blue-500 shadow-sm"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                <div className="w-full aspect-[4/3] bg-gray-50 border border-gray-100 rounded-t-md flex items-center justify-center p-3">
                  <div className="w-full h-full bg-white border border-gray-200 rounded shadow-sm flex flex-col items-center justify-center gap-1">
                    <div className="h-1 w-8 bg-gray-200 rounded" />
                    <div className="h-1 w-12 bg-gray-300 rounded" />
                    <div className="h-1 w-10 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="px-1.5 py-1.5">
                  <p className="text-xs font-medium text-gray-700 truncate">{tmpl.name}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center — Canvas area */}
        <main
          className="flex-1 bg-[#e8e8e8] overflow-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              fabricRef.current?.discardActiveObject();
              fabricRef.current?.renderAll();
              setSelectedObj(null);
            }
          }}
        >
          {/*
            Keep canvas element always in DOM (display:none to hide, not unmount)
            so Fabric keeps its state when switching between tabs.
          */}
          <div
            className="min-h-full flex items-center justify-center p-12"
            style={{ display: activeTab === "certificates" ? "flex" : "none" }}
          >
            <div
              style={{
                boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
                lineHeight: 0,
                display: "inline-block",
              }}
            >
              <canvas ref={canvasElRef} />
            </div>
          </div>

          {activeTab === "link-certificates" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-500">Link Certificates</p>
                <p className="text-xs text-gray-400">
                  Assign a certificate template to a course
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right — Elements / Backgrounds + Properties */}
        <aside className="w-64 border-l border-gray-200 flex flex-col shrink-0 bg-white">

          {/* Tab header */}
          <div className="flex border-b border-gray-200 shrink-0">
            {(["elements", "backgrounds"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                  rightTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Elements tab */}
          {rightTab === "elements" && (
            <div className="flex-1 overflow-y-auto">
              {ELEMENT_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-4 pt-4 pb-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                    {section.label}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => addElement(item.key)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Backgrounds tab */}
          {rightTab === "backgrounds" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">
                  Background Color
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackground(color)}
                      title={color}
                      className="w-9 h-9 rounded-md border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">
                  Background Image
                </p>
                <button className="w-full py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  + Upload image
                </button>
              </div>
            </div>
          )}

          {/* Properties panel — shown when a canvas object is selected */}
          {selectedObj && (
            <div className="border-t border-gray-200 p-4 space-y-3 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Properties
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={duplicateSelected}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase">X</label>
                  <input
                    type="number"
                    value={selLeft}
                    onChange={(e) => updateSelected({ left: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase">Y</label>
                  <input
                    type="number"
                    value={selTop}
                    onChange={(e) => updateSelected({ top: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase">W</label>
                  <input
                    type="number"
                    value={selW}
                    onChange={(e) => {
                      const w = (sel?.width ?? 1);
                      if (w > 0) updateSelected({ scaleX: Number(e.target.value) / w });
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 uppercase">H</label>
                  <input
                    type="number"
                    value={selH}
                    onChange={(e) => {
                      const h = (sel?.height ?? 1);
                      if (h > 0) updateSelected({ scaleY: Number(e.target.value) / h });
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Text controls */}
              {selIsText && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={selFontSz}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    title="Font size"
                  />
                  <input
                    type="color"
                    value={typeof selColor === "string" ? selColor : "#334155"}
                    onChange={(e) => updateSelected({ fill: e.target.value })}
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer"
                    title="Text color"
                  />
                  <button
                    onClick={() =>
                      updateSelected({ fontWeight: selBold ? "normal" : "bold" })
                    }
                    className={`px-2 py-1 text-xs border rounded font-bold transition-colors ${
                      selBold
                        ? "bg-gray-800 text-white border-gray-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() =>
                      updateSelected({
                        textAlign:
                          selAlign === "center" ? "left"
                          : selAlign === "left"   ? "right"
                          : "center",
                      })
                    }
                    className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Toggle text align"
                  >
                    {selAlign === "left" ? "L" : selAlign === "right" ? "R" : "C"}
                  </button>
                </div>
              )}

              {/* Opacity */}
              <div>
                <label className="text-[9px] font-semibold text-gray-400 uppercase">
                  Opacity — {Math.round(selOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selOpacity}
                  onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default CertificateDesignEditor;
