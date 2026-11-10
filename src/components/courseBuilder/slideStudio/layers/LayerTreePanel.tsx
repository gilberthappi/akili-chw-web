import React, { useState, useEffect, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  type FabricObject,
  Group,
  IText,
  Textbox,
} from "fabric";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Square,
  Type,
  Shield,
  MessageSquare,
  ChevronsRight,
  CircleDot,
  Waves,
  ArrowRight,
  Folder,
  Image as ImageIcon,
  PenTool,
  Boxes,
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  Pencil,
  Check,
} from "lucide-react";

interface LayerTreePanelProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  onSelectObject?: (obj: FabricObject | null) => void;
  onModify?: () => void;
  compact?: boolean;
}

export const LayerTreePanel: React.FC<LayerTreePanelProps> = ({
  canvas,
  selectedObject,
  onSelectObject,
  onModify,
  compact = false,
}) => {
  const [layers, setLayers] = useState<FabricObject[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState<string>("");

  // Sync layers list from canvas
  const refreshLayers = useCallback(() => {
    if (!canvas) {
      setLayers([]);
      return;
    }
    // Canvas objects are ordered bottom to top (0 is lowest z-index, N-1 is highest)
    // Figma & Photoshop display top-most layer at index 0 of the UI list
    const objects = [...canvas.getObjects()].reverse();
    setLayers(objects);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    refreshLayers();

    const handleCanvasChange = () => {
      refreshLayers();
    };

    canvas.on("object:added", handleCanvasChange);
    canvas.on("object:removed", handleCanvasChange);
    canvas.on("object:modified", handleCanvasChange);
    canvas.on("selection:created", handleCanvasChange);
    canvas.on("selection:updated", handleCanvasChange);
    canvas.on("selection:cleared", handleCanvasChange);

    return () => {
      canvas.off("object:added", handleCanvasChange);
      canvas.off("object:removed", handleCanvasChange);
      canvas.off("object:modified", handleCanvasChange);
      canvas.off("selection:created", handleCanvasChange);
      canvas.off("selection:updated", handleCanvasChange);
      canvas.off("selection:cleared", handleCanvasChange);
    };
  }, [canvas, refreshLayers]);

  // Resolve Human-Readable Layer Name
  const getLayerName = (obj: FabricObject): string => {
    const custom = (obj as unknown as { customName?: string }).customName;
    if (custom && custom.trim()) return custom;

    const shapeType = (obj as unknown as { shapeType?: string }).shapeType;
    if (shapeType) {
      if (shapeType === "ShieldBadge") return "Medical Shield";
      if (shapeType === "SpeechBubble") return "Speech Bubble";
      if (shapeType === "ChevronArrow") return "Process Chevron";
      return shapeType;
    }

    if (obj.type === "bentcard") return "Container Card";
    if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
      const text = (obj as IText).text || "";
      const trimmed = text.replace(/[\n\r]+/g, " ").trim();
      return trimmed ? `"${trimmed.slice(0, 18)}${trimmed.length > 18 ? "…" : ""}"` : "Text Box";
    }
    if (obj.type === "group") return "Group";
    if (obj.type === "image") return "Photo Card";
    if (obj.type === "organicblob") return "Organic Blob";
    if (obj.type === "wavydivider") return "Wave Divider";
    if (obj.type === "connectorline") return "Connector Line";
    if (obj.type === "path") return "Vector Path";

    return (obj.type || "Layer").replace(/^[a-z]/, (c) => c.toUpperCase());
  };

  // Resolve Layer Icon
  const getLayerIcon = (obj: FabricObject) => {
    const shapeType = (obj as unknown as { shapeType?: string }).shapeType;
    if (shapeType === "ShieldBadge") return <Shield className="w-3.5 h-3.5 text-emerald-600" />;
    if (shapeType === "SpeechBubble") return <MessageSquare className="w-3.5 h-3.5 text-purple-600" />;
    if (shapeType === "ChevronArrow") return <ChevronsRight className="w-3.5 h-3.5 text-amber-600" />;

    if (obj.type === "bentcard") return <Square className="w-3.5 h-3.5 text-blue-600" />;
    if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
      return <Type className="w-3.5 h-3.5 text-slate-700" />;
    }
    if (obj.type === "group") return <Folder className="w-3.5 h-3.5 text-indigo-600" />;
    if (obj.type === "image") return <ImageIcon className="w-3.5 h-3.5 text-sky-600" />;
    if (obj.type === "organicblob") return <CircleDot className="w-3.5 h-3.5 text-sky-600" />;
    if (obj.type === "wavydivider") return <Waves className="w-3.5 h-3.5 text-blue-600" />;
    if (obj.type === "connectorline") return <ArrowRight className="w-3.5 h-3.5 text-blue-600" />;
    if (obj.type === "path") return <PenTool className="w-3.5 h-3.5 text-indigo-600" />;

    return <Layers className="w-3.5 h-3.5 text-slate-500" />;
  };

  // Layer Selection
  const handleSelectLayer = (obj: FabricObject) => {
    if (!canvas) return;
    if (obj.lockMovementX && !obj.selectable) return; // Locked object

    canvas.discardActiveObject();
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onSelectObject?.(obj);
  };

  // Visibility Toggle
  const handleToggleVisibility = (e: React.MouseEvent, obj: FabricObject) => {
    e.stopPropagation();
    if (!canvas) return;

    const nextVis = !obj.visible;
    obj.set("visible", nextVis);
    if (!nextVis && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
      onSelectObject?.(null);
    }
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Lock Toggle
  const handleToggleLock = (e: React.MouseEvent, obj: FabricObject) => {
    e.stopPropagation();
    if (!canvas) return;

    const isCurrentlyLocked = Boolean(obj.lockMovementX);
    const nextLocked = !isCurrentlyLocked;

    obj.set({
      lockMovementX: nextLocked,
      lockMovementY: nextLocked,
      lockRotation: nextLocked,
      lockScalingX: nextLocked,
      lockScalingY: nextLocked,
      selectable: !nextLocked,
      evented: !nextLocked,
    });

    if (nextLocked && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
      onSelectObject?.(null);
    }

    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Z-Index: Move Up (Bring Forward)
  const handleMoveUp = (e: React.MouseEvent, obj: FabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Z-Index: Move Down (Send Backward)
  const handleMoveDown = (e: React.MouseEvent, obj: FabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Z-Index: Bring to Front
  const handleBringToFront = (obj: FabricObject) => {
    if (!canvas) return;
    canvas.bringObjectToFront(obj);
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Z-Index: Send to Back
  const handleSendToBack = (obj: FabricObject) => {
    if (!canvas) return;
    canvas.sendObjectToBack(obj);
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Delete Layer
  const handleDelete = (e: React.MouseEvent, obj: FabricObject) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.remove(obj);
    if (canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
      onSelectObject?.(null);
    }
    canvas.requestRenderAll();
    refreshLayers();
    onModify?.();
  };

  // Inline Rename
  const handleSaveRename = (obj: FabricObject) => {
    if (editNameText.trim()) {
      (obj as unknown as { customName: string }).customName = editNameText.trim();
    }
    setEditingId(null);
    setEditNameText("");
    refreshLayers();
    onModify?.();
  };

  // Check if multiple objects or a group are active
  const activeObj = canvas?.getActiveObject();
  const isMultiSelected = activeObj && activeObj.type === "activeselection";
  const isGroupSelected = activeObj && activeObj.type === "group";

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Z-Index & Grouping Quick Actions */}
      {selectedObject && (
        <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs text-slate-600">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleBringToFront(selectedObject)}
              className="p-1 rounded-md hover:bg-white hover:text-blue-600 hover:shadow-2xs transition"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSendToBack(selectedObject)}
              className="p-1 rounded-md hover:bg-white hover:text-blue-600 hover:shadow-2xs transition"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {isMultiSelected && (
              <span className="text-[10px] font-semibold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200">
                Multi-Selected (Ctrl+G)
              </span>
            )}
            {isGroupSelected && (
              <span className="text-[10px] font-semibold text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                Group (Ctrl+Shift+G)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Layer Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Boxes className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-semibold">No elements on slide</span>
            <span className="text-[10px] mt-0.5 max-w-[160px]">
              Add cards, text, or shapes from the left tool dock.
            </span>
          </div>
        ) : (
          layers.map((obj, index) => {
            const isSelected = selectedObject === obj;
            const isLocked = Boolean(obj.lockMovementX);
            const isHidden = !obj.visible;
            const objId = (obj as unknown as { id?: string }).id || `obj-${index}`;

            return (
              <div
                key={objId + index}
                onClick={() => handleSelectLayer(obj)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition cursor-pointer text-xs ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs font-semibold"
                    : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700"
                } ${isHidden ? "opacity-40" : ""} ${isLocked ? "bg-slate-50/60" : ""}`}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center space-x-2 min-w-0 flex-1 mr-1">
                  <div className="shrink-0">{getLayerIcon(obj)}</div>

                  {editingId === objId ? (
                    <div
                      className="flex items-center space-x-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editNameText}
                        onChange={(e) => setEditNameText(e.target.value)}
                        onBlur={() => handleSaveRename(obj)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(obj);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full text-xs px-1.5 py-0.5 border border-blue-400 rounded outline-hidden bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(obj)}
                        className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Save name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingId(objId);
                        setEditNameText(getLayerName(obj));
                      }}
                      className="truncate text-[11px] select-none flex-1"
                      title={getLayerName(obj)}
                    >
                      {getLayerName(obj)}
                    </span>
                  )}
                </div>

                {/* Right: Controls (Reorder, Lock, Visibility, Delete) */}
                <div className="flex items-center space-x-0.5 shrink-0">
                  {/* Reorder Up / Down */}
                  <button
                    type="button"
                    onClick={(e) => handleMoveUp(e, obj)}
                    disabled={index === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Bring Forward"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleMoveDown(e, obj)}
                    disabled={index === layers.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Send Backward"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLock(e, obj)}
                    className={`p-1 rounded transition ${
                      isLocked
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 opacity-0 group-hover:opacity-100"
                    }`}
                    title={isLocked ? "Unlock Layer" : "Lock Layer"}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleVisibility(e, obj)}
                    className={`p-1 rounded transition ${
                      isHidden
                        ? "text-slate-400 bg-slate-100 hover:bg-slate-200"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 opacity-0 group-hover:opacity-100"
                    }`}
                    title={isHidden ? "Show Layer" : "Hide Layer"}
                  >
                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, obj)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
