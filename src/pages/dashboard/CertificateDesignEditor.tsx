import React, { useState, useRef } from "react";
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
import { IWorkshopCertificate } from "@/types/certificates.d";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  borderRadius?: number;
  token?: string;
}

interface DesignCanvasProps {
  certificate?: IWorkshopCertificate;
  onSave?: (certificate: IWorkshopCertificate) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 1056;   // 11in @ 96dpi — landscape
const CANVAS_HEIGHT = 816;   // 8.5in @ 96dpi

const MOCK_TEMPLATES = [
  { id: "new", name: "New template" },
  { id: "t1", name: "Vent and Defib" },
  { id: "t2", name: "DHMC01" },
  { id: "t3", name: "One Health Exchange" },
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

const CertificateDesignEditor: React.FC<DesignCanvasProps> = ({
  certificate,
  onSave,
}) => {
  const navigate = useNavigate();
  const canvasRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab,     setActiveTab]     = useState<"certificates" | "link-certificates">("certificates");
  const [rightTab,      setRightTab]      = useState<"elements" | "backgrounds">("elements");
  const [activeTemplate, setActiveTemplate] = useState("new");
  const [searchQuery,   setSearchQuery]   = useState("");

  // ── Canvas state ────────────────────────────────────────────────────────────

  const initial: CanvasElement[] = [
    {
      id: "bg-1", type: "shape",
      x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
      content: "", rotation: 0, opacity: 1,
      locked: true, visible: true,
      fill: "#ffffff", stroke: "none", borderRadius: 0,
    },
  ];

  const [elements,      setElements]      = useState<CanvasElement[]>(initial);
  const [selectedId,    setSelectedId]    = useState<string>("");
  const [zoom,          setZoom]          = useState(75);
  const [history,       setHistory]       = useState<CanvasElement[][]>([initial]);
  const [historyIndex,  setHistoryIndex]  = useState(0);

  // ── History ─────────────────────────────────────────────────────────────────

  const push = (next: CanvasElement[]) => {
    const h = history.slice(0, historyIndex + 1);
    h.push(next);
    setHistory(h);
    setHistoryIndex(h.length - 1);
    setElements(next);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const i = historyIndex - 1;
      setHistoryIndex(i);
      setElements(history[i]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const i = historyIndex + 1;
      setHistoryIndex(i);
      setElements(history[i]);
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) =>
    push(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));

  // ── Add elements ────────────────────────────────────────────────────────────

  const addElement = (key: string) => {
    if (key === "image") { fileInputRef.current?.click(); return; }

    if (key === "qr") {
      const el: CanvasElement = {
        id: `qr-${Date.now()}`, type: "qr",
        x: 200, y: 200, width: 120, height: 120,
        content: "{{qrCode}}", rotation: 0, opacity: 1,
        locked: false, visible: true, token: "{{qrCode}}",
      };
      push([...elements, el]);
      setSelectedId(el.id);
      return;
    }

    const display = DISPLAY_LABEL[key] ?? "New text";
    const token   = TOKEN_VALUE[key];
    const el: CanvasElement = {
      id: `${key}-${Date.now()}`, type: "text",
      x: 200, y: 200, width: 320, height: 50,
      content: display, rotation: 0, opacity: 1,
      locked: false, visible: true,
      fontSize: 20, fontWeight: "normal", textAlign: "center",
      fill: "#333333",
      ...(token ? { token } : {}),
    };
    push([...elements, el]);
    setSelectedId(el.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const el: CanvasElement = {
        id: `image-${Date.now()}`, type: "image",
        x: 100, y: 100, width: 200, height: 150,
        content: ev.target?.result as string,
        rotation: 0, opacity: 1, locked: false, visible: true,
      };
      push([...elements, el]);
      setSelectedId(el.id);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteElement = (id: string) => {
    if (id === "bg-1") return;
    push(elements.filter((el) => el.id !== id));
    setSelectedId("");
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const copy = { ...el, id: `${el.type}-${Date.now()}`, x: el.x + 20, y: el.y + 20 };
    push([...elements, copy]);
    setSelectedId(copy.id);
  };

  // ── Drag ────────────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    const el = elements.find((x) => x.id === id);
    if (!el || el.locked) return;
    e.preventDefault();
    setSelectedId(id);

    const sx = e.clientX, sy = e.clientY;
    const ex = el.x,      ey = el.y;
    const scale = zoom / 100;

    const onMove = (mv: MouseEvent) =>
      updateElement(id, {
        x: ex + (mv.clientX - sx) / scale,
        y: ey + (mv.clientY - sy) / scale,
      });

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  // ── Render canvas element ────────────────────────────────────────────────────

  const renderElement = (el: CanvasElement) => {
    const scale  = zoom / 100;
    const active = el.id === selectedId;

    const base: React.CSSProperties = {
      position:    "absolute",
      left:        `${el.x * scale}px`,
      top:         `${el.y * scale}px`,
      width:       `${el.width  * scale}px`,
      height:      `${el.height * scale}px`,
      opacity:     el.opacity,
      transform:   `rotate(${el.rotation}deg)`,
      cursor:      el.locked ? "default" : "move",
      display:     el.visible ? undefined : "none",
      outline:     active ? "2px solid #2563eb" : undefined,
      outlineOffset: active ? "2px" : undefined,
    };

    if (el.type === "text") {
      return (
        <div
          key={el.id}
          style={{
            ...base,
            fontSize:   `${(el.fontSize ?? 20) * scale}px`,
            fontWeight: el.fontWeight ?? "normal",
            color:      el.fill ?? "#333",
            textAlign:  el.textAlign ?? "center",
            display:    el.visible ? "flex" : "none",
            alignItems: "center",
            justifyContent:
              el.textAlign === "left"  ? "flex-start" :
              el.textAlign === "right" ? "flex-end"   : "center",
            padding: "4px",
            userSelect: "none",
          }}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          onDoubleClick={() => {
            const t = prompt("Edit text:", el.content);
            if (t !== null) updateElement(el.id, { content: t });
          }}
        >
          {el.content}
        </div>
      );
    }

    if (el.type === "image") {
      return (
        <img
          key={el.id}
          src={el.content}
          style={{ ...base, objectFit: "contain" }}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          alt=""
          draggable={false}
        />
      );
    }

    if (el.type === "qr") {
      return (
        <div
          key={el.id}
          style={{
            ...base,
            display:         el.visible ? "flex" : "none",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            backgroundColor: "#fff",
            border:          "1px solid #d1d5db",
            gap:             "4px",
          }}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
        >
          <QrCode className="w-6 h-6 text-gray-400" />
          <span style={{ fontSize: `${10 * scale}px`, color: "#9ca3af" }}>QR Code</span>
        </div>
      );
    }

    if (el.type === "shape") {
      return (
        <div
          key={el.id}
          style={{
            ...base,
            backgroundColor: el.fill ?? "#fff",
            border:
              el.stroke && el.stroke !== "none"
                ? `1px solid ${el.stroke}`
                : undefined,
            borderRadius: `${el.borderRadius ?? 0}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
        />
      );
    }

    return null;
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selected = elements.find((el) => el.id === selectedId);
  const filteredTemplates = MOCK_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 bg-white z-10">

        {/* Back */}
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
              className={`px-5 h-12 text-sm font-medium border-b-2 transition-colors capitalize ${
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
            disabled={historyIndex === 0}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4 text-gray-600" />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => toast.success("Mock generation coming soon")}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-gray-700 transition-colors whitespace-nowrap"
          >
            Generate Mock Certificate
          </button>

          {/* Zoom */}
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden ml-1">
            <button
              onClick={() => setZoom((z) => Math.max(25, z - 10))}
              className="px-2 py-1.5 hover:bg-gray-100 transition-colors border-r border-gray-200"
            >
              <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span className="px-3 text-xs font-medium text-gray-700 w-14 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="px-2 py-1.5 hover:bg-gray-100 transition-colors border-l border-gray-200"
            >
              <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Template list */}
        <aside className="w-64 border-r border-gray-200 flex flex-col shrink-0 bg-white">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              Certificates{" "}
              <span className="text-gray-400 font-normal text-xs">
                {MOCK_TEMPLATES.length}
              </span>
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
                {/* Thumbnail placeholder */}
                <div className="w-full aspect-[4/3] bg-gray-50 border border-gray-100 rounded-t-md flex items-center justify-center p-3">
                  <div className="w-full h-full bg-white border border-gray-200 rounded shadow-sm flex flex-col items-center justify-center gap-1">
                    <div className="h-1 w-8 bg-gray-200 rounded" />
                    <div className="h-1 w-12 bg-gray-300 rounded" />
                    <div className="h-1 w-10 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="px-1.5 py-1.5">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {tmpl.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center — Canvas */}
        <main
          className="flex-1 bg-[#e8e8e8] overflow-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId("");
          }}
        >
          {activeTab === "certificates" ? (
            <div className="min-h-full flex items-center justify-center p-12">
              <div
                ref={canvasRef}
                style={{
                  width:           `${CANVAS_WIDTH * (zoom / 100)}px`,
                  height:          `${CANVAS_HEIGHT * (zoom / 100)}px`,
                  position:        "relative",
                  backgroundColor: "#ffffff",
                  boxShadow:       "0 4px 32px rgba(0,0,0,0.18)",
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedId("");
                }}
              >
                {elements.map((el) => renderElement(el))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  Link Certificates
                </p>
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
                      onClick={() => updateElement("bg-1", { fill: color })}
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

          {/* Properties panel — shown when an element is selected */}
          {selected && selected.id !== "bg-1" && (
            <div className="border-t border-gray-200 p-4 space-y-3 shrink-0 bg-white">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Properties
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateElement(selected.id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteElement(selected.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Position + Size */}
              <div className="grid grid-cols-2 gap-2">
                {(["x", "y", "width", "height"] as const).map((prop) => (
                  <div key={prop}>
                    <label className="text-[9px] font-semibold text-gray-400 uppercase">
                      {prop}
                    </label>
                    <input
                      type="number"
                      value={Math.round(selected[prop] as number)}
                      onChange={(e) =>
                        updateElement(selected.id, { [prop]: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>

              {/* Text controls */}
              {selected.type === "text" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={selected.fontSize ?? 20}
                    onChange={(e) =>
                      updateElement(selected.id, { fontSize: Number(e.target.value) })
                    }
                    className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                    title="Font size"
                  />
                  <input
                    type="color"
                    value={selected.fill ?? "#333333"}
                    onChange={(e) =>
                      updateElement(selected.id, { fill: e.target.value })
                    }
                    className="w-8 h-7 rounded border border-gray-200 cursor-pointer"
                    title="Text color"
                  />
                  <button
                    onClick={() =>
                      updateElement(selected.id, {
                        fontWeight: selected.fontWeight === "bold" ? "normal" : "bold",
                      })
                    }
                    className={`px-2 py-1 text-xs border rounded font-bold transition-colors ${
                      selected.fontWeight === "bold"
                        ? "bg-gray-800 text-white border-gray-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() =>
                      updateElement(selected.id, {
                        textAlign:
                          selected.textAlign === "center" ? "left" :
                          selected.textAlign === "left"   ? "right" : "center",
                      })
                    }
                    className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Text align"
                  >
                    {selected.textAlign === "left" ? "L" : selected.textAlign === "right" ? "R" : "C"}
                  </button>
                </div>
              )}

              {/* Opacity */}
              <div>
                <label className="text-[9px] font-semibold text-gray-400 uppercase">
                  Opacity — {Math.round(selected.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selected.opacity}
                  onChange={(e) =>
                    updateElement(selected.id, { opacity: Number(e.target.value) })
                  }
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
