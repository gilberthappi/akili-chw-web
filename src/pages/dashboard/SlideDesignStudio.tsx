import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { FabricObject } from "fabric";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Monitor,
  Smartphone,
  Square,
  Send,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { SlideStudioCanvas } from "@/components/courseBuilder/slideStudio/SlideStudioCanvas";
import {
  SlideStudioCanvasRef,
  StudioAspectRatio,
} from "@/components/courseBuilder/slideStudio/engine/types";
import { SlideTransitionType } from "@/components/courseBuilder/slideStudio/animation/types";
import { StudioToolDock } from "@/components/courseBuilder/slideStudio/dock/StudioToolDock";
import { CardPropertyInspector } from "@/components/courseBuilder/slideStudio/inspectors/CardPropertyInspector";
import {
  ArtboardBackgroundState,
  DEFAULT_ARTBOARD_BG,
  DEFAULT_IMAGE_FILTERS,
} from "@/components/courseBuilder/slideStudio/media/types";
import { ImageEngine } from "@/components/courseBuilder/slideStudio/media/ImageEngine";
import {
  CourseStudioOutline,
  StudioChapterNode,
  StudioSectionNode,
} from "@/components/courseBuilder/slideStudio/CourseStudioOutline";
import { getCourseById } from "@/services/course.service";
import type { ICourse } from "@/types";

const newStudioId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `studio-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function createBlankOutline(): {
  sections: StudioSectionNode[];
  activeSlideId: string;
} {
  const slide = { id: newStudioId(), title: "Slide 1" };
  const chapter: StudioChapterNode = {
    id: newStudioId(),
    title: "Chapter 1",
    slides: [slide],
  };
  const section: StudioSectionNode = {
    id: newStudioId(),
    title: "Section 1",
    chapters: [chapter],
  };
  return { sections: [section], activeSlideId: slide.id };
}

function outlineFromCourse(course: ICourse): StudioSectionNode[] {
  const sections = (course.sections ?? []).map((section, sectionIndex) => ({
    id: section.id,
    title: section.title || `Section ${sectionIndex + 1}`,
    chapters: (section.chapters ?? []).map((chapter, chapterIndex) => {
      const slides = (chapter.slides ?? []).map((slide, slideIndex) => ({
        id: slide.id,
        title: slide.note || `Slide ${slideIndex + 1}`,
      }));
      return {
        id: chapter.id,
        title: chapter.title || `Chapter ${chapterIndex + 1}`,
        slides: slides.length
          ? slides
          : [{ id: newStudioId(), title: "Slide 1" }],
      };
    }),
  }));

  if (!sections.length) return createBlankOutline().sections;
  if (!sections.some((section) => section.chapters.length > 0)) {
    return createBlankOutline().sections;
  }
  return sections;
}

export default function SlideDesignStudio() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId?: string }>();
  const canvasRef = useRef<SlideStudioCanvasRef>(null);
  const canvasBySlide = useRef<Record<string, Record<string, unknown>>>({});
  const blank = useRef(createBlankOutline());

  const [courseTitle, setCourseTitle] = useState("Untitled course");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [sections, setSections] = useState<StudioSectionNode[]>(blank.current.sections);
  const [activeSlideId, setActiveSlideId] = useState(blank.current.activeSlideId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [ratio, setRatio] = useState<StudioAspectRatio>("16:9");
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [isPenActive, setIsPenActive] = useState<boolean>(false);
  const [backgroundState, setBackgroundState] =
    useState<ArtboardBackgroundState>(DEFAULT_ARTBOARD_BG);
  const [slideTransition, setSlideTransition] =
    useState<SlideTransitionType>("fade");
  const zoomPercent = Math.round(zoom * 100);

  // Sync undo/redo availability from canvas
  const updateHistoryState = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.canUndo);
      setCanRedo(canvasRef.current.canRedo);
    }
  }, []);

  const activeSlide = sections
    .flatMap((section) => section.chapters)
    .flatMap((chapter) => chapter.slides)
    .find((slide) => slide.id === activeSlideId);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    getCourseById(courseId)
      .then((response) => {
        if (cancelled) return;
        const course = response.data;
        if (!course) return;
        const nextSections = outlineFromCourse(course);
        const firstSlide = nextSections[0]?.chapters[0]?.slides[0];
        setCourseTitle(course.title || "Untitled course");
        setShortName(course.shortName ?? "");
        setDescription(course.description ?? "");
        setCoverUrl(course.coverIcon || "");
        setSections(nextSections);
        if (firstSlide) setActiveSlideId(firstSlide.id);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load this course");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const rememberCurrentCanvas = () => {
    const json = canvasRef.current?.getCanvasJson();
    if (json) canvasBySlide.current[activeSlideId] = json;
  };

  const handleSelectSlide = async (slideId: string) => {
    if (slideId === activeSlideId) return;
    rememberCurrentCanvas();
    setActiveSlideId(slideId);
    setSelectedObject(null);
    const saved = canvasBySlide.current[slideId];
    if (saved) await canvasRef.current?.loadCanvasJson(saved);
    else canvasRef.current?.clearCanvas();
    updateHistoryState();
  };

  const handleAddSection = () => {
    const slide = { id: newStudioId(), title: "Slide 1" };
    setSections((current) => [
      ...current,
      {
        id: newStudioId(),
        title: `Section ${current.length + 1}`,
        chapters: [
          { id: newStudioId(), title: "Chapter 1", slides: [slide] },
        ],
      },
    ]);
    void handleSelectSlide(slide.id);
  };

  const handleAddChapter = (sectionId: string) => {
    const slide = { id: newStudioId(), title: "Slide 1" };
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              chapters: [
                ...section.chapters,
                {
                  id: newStudioId(),
                  title: `Chapter ${section.chapters.length + 1}`,
                  slides: [slide],
                },
              ],
            }
          : section
      )
    );
    void handleSelectSlide(slide.id);
  };

  const handleAddSlide = (sectionId: string, chapterId: string) => {
    const slide = { id: newStudioId(), title: "New slide" };
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              chapters: section.chapters.map((chapter) =>
                chapter.id === chapterId
                  ? {
                      ...chapter,
                      slides: [
                        ...chapter.slides,
                        { ...slide, title: `Slide ${chapter.slides.length + 1}` },
                      ],
                    }
                  : chapter
              ),
            }
          : section
      )
    );
    void handleSelectSlide(slide.id);
  };

  const handleChangeRatio = (newRatio: StudioAspectRatio) => {
    setRatio(newRatio);
    canvasRef.current?.changeRatio(newRatio);
    updateHistoryState();
  };

  const handleZoomIn = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 1.15);
    updateHistoryState();
  };

  const handleZoomOut = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 0.85);
    updateHistoryState();
  };

  const handleResetFit = () => {
    canvasRef.current?.resetZoomToFit();
    updateHistoryState();
  };

  const handleSetZoom = (targetZoom: number) => {
    canvasRef.current?.setZoom(targetZoom);
    updateHistoryState();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
    updateHistoryState();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
    updateHistoryState();
  };

  const handlePublish = async () => {
    if (!canvasRef.current) return;
    setIsPublishing(true);
    try {
      const json = canvasRef.current.getCanvasJson();
      const highResBlob = await canvasRef.current.exportHighResBlob(2);
      // In production pipeline, this uploads to Cloudinary & persists to DB
      console.log(
        "[CourseStudio] Course draft:",
        courseTitle,
        Object.keys(json).length,
        highResBlob.size
      );
      toast.success("Course studio draft updated");
    } catch (err) {
      console.error("[SlideStudio] Publish error:", err);
      toast.error("Failed to publish slide");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasRef.current.exportHighResBlob(2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(activeSlide?.title || courseTitle).toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported high-res PNG image");
    } catch (err) {
      toast.error("Failed to export image");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 select-none">
      {/* ── Studio Top Header Bar ────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shadow-xs flex-shrink-0">
        {/* Left: Back & Slide Title */}
        <div className="flex min-w-0 flex-1 items-center space-x-3 pr-4">
          <button
            onClick={() => navigate("/courses")}
            aria-label="Back to courses"
            title="Return to Courses"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* Inline Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={courseTitle}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditingTitle(false);
                }
              }}
              onChange={(e) => {
                setCourseTitle(e.target.value);
              }}
              className="min-w-0 flex-1 text-sm font-semibold text-slate-900 border border-blue-400 rounded px-2 py-0.5 outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex min-w-0 flex-1 items-center space-x-1.5 cursor-pointer px-2 py-1 rounded hover:bg-slate-50"
              title={`${courseTitle} (Click to rename)`}
            >
              <span className="text-sm font-semibold text-slate-800 tracking-tight truncate block">
                {courseTitle}
              </span>
              <span className="text-xs text-slate-400 group-hover:text-blue-600 transition shrink-0">
                ✏️
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`p-1.5 rounded transition ${
                canUndo
                  ? "text-slate-700 hover:bg-white hover:shadow-2xs"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`p-1.5 rounded transition ${
                canRedo
                  ? "text-slate-700 hover:bg-white hover:shadow-2xs"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={handleZoomOut}
              title="Zoom Out (Ctrl -)"
              className="p-1.5 text-slate-700 hover:bg-white rounded transition hover:shadow-2xs"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleSetZoom(1.0)}
              title="Click to reset to 100%"
              className="px-2 py-0.5 font-semibold text-slate-800 hover:bg-white rounded transition hover:shadow-2xs min-w-[50px] text-center"
            >
              {zoomPercent}%
            </button>

            <button
              onClick={handleZoomIn}
              title="Zoom In (Ctrl +)"
              className="p-1.5 text-slate-700 hover:bg-white rounded transition hover:shadow-2xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetFit}
              title="Fit Artboard to Viewport (Ctrl+0)"
              className="flex items-center space-x-1 px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-white rounded transition hover:shadow-2xs ml-0.5 font-medium"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[11px]">Fit</span>
            </button>
          </div>

          <button
            onClick={() => setShowGrid((g) => !g)}
            title={showGrid ? "Hide Grid" : "Show Grid"}
            className={`p-1.5 rounded-lg border transition ${
              showGrid
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => handleChangeRatio("16:9")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "16:9"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="16:9 Landscape Presentation (1920 × 1080)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>

            <button
              onClick={() => handleChangeRatio("9:16")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "9:16"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="9:16 Mobile Story (1080 × 1920)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>

            <button
              onClick={() => handleChangeRatio("4:3")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "4:3"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="4:3 Standard (1440 × 1080)"
            >
              <Square className="w-3.5 h-3.5" />
              <span>4:3</span>
            </button>
          </div>

          <button
            onClick={handleExportPng}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center space-x-1.5"
            title="Download Lossless 2x PNG"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow transition flex items-center space-x-1.5 disabled:opacity-50"
            title="Keep this course studio draft"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? "Saving..." : "Save course"}</span>
          </button>
        </div>
      </header>

      {/* ── Studio Body: design rail, course sidebar, canvas, inspector ─ */}
      <div className="flex-1 flex overflow-hidden relative">
        <StudioToolDock
          isPenActive={isPenActive}
          onTogglePenTool={() => {
            canvasRef.current?.togglePenTool();
            setIsPenActive(canvasRef.current?.isPenActive ?? false);
          }}
          onAddBentCard={(radii, title, fill) => {
            canvasRef.current?.addBentCard(radii, title, fill);
            updateHistoryState();
          }}
          onAddOrganicBlob={() => {
            canvasRef.current?.addOrganicBlob();
            updateHistoryState();
          }}
          onAddWavyDivider={() => {
            canvasRef.current?.addWavyDivider();
            updateHistoryState();
          }}
          onAddShieldBadge={() => {
            canvasRef.current?.addShieldBadge();
            updateHistoryState();
          }}
          onAddSpeechBubble={() => {
            canvasRef.current?.addSpeechBubble();
            updateHistoryState();
          }}
          onAddChevronArrow={() => {
            canvasRef.current?.addChevronArrow();
            updateHistoryState();
          }}
          onAddPhotoCard={(url, title) => {
            const canvas = canvasRef.current?.getFabricCanvas();
            const active = canvas?.getActiveObject();
            if (
              active &&
              active.type !== "activeselection" &&
              active.type !== "group" &&
              ("cornerRadii" in active ||
                "shapeType" in active ||
                "_renderPathCommands" in active ||
                "embeddedImage" in active)
            ) {
              ImageEngine.setShapeEmbeddedImage(active, {
                url,
                name: title || "Masked Photo",
                naturalWidth: 800,
                naturalHeight: 600,
                fitMode: "cover",
                zoom: 1.0,
                panX: 0,
                panY: 0,
                opacity: 1.0,
                filters: { ...DEFAULT_IMAGE_FILTERS },
              });
              // Force selection state refresh
              setSelectedObject(active);
              canvas?.requestRenderAll();
              updateHistoryState();
              const label =
                (active as unknown as { shapeType?: string }).shapeType ||
                "shape";
              toast.success(`Photo masked into ${label}!`);
            } else {
              canvasRef.current?.addPhotoCard(url, title);
              updateHistoryState();
            }
          }}
          onAddHeading={(text, size) => {
            canvasRef.current?.addText(text || "Slide Title", size || 36);
            updateHistoryState();
          }}
          onAddCurvedText={(text, curvature, size, options) => {
            canvasRef.current?.addCurvedText(
              text || "Curved Headline",
              curvature ?? 45,
              size ?? 36,
              options
            );
            updateHistoryState();
          }}
          onAddBodyText={(text) => {
            canvasRef.current?.addText(
              text || "Double click to edit body description.",
              18
            );
            updateHistoryState();
          }}
          onAddSvgAsset={(svgString, name) => {
            canvasRef.current?.addSvgAsset(svgString, name);
            updateHistoryState();
          }}
          onAddConnectorLine={() => {
            canvasRef.current?.addConnectorLine();
            updateHistoryState();
          }}
          currentSlideTitle={activeSlide?.title || courseTitle}
          onGetCanvasJson={() => canvasRef.current?.getCanvasJson() ?? {}}
          onLoadTemplateJson={async (json) => {
            await canvasRef.current?.loadCanvasJson(json);
            updateHistoryState();
            toast.success("Template loaded onto canvas!");
          }}
          canvas={canvasRef.current?.getFabricCanvas() ?? null}
          selectedObject={selectedObject}
          onSelectObject={(obj) => setSelectedObject(obj)}
          onModify={updateHistoryState}
        />

        <CourseStudioOutline
          courseTitle={courseTitle}
          shortName={shortName}
          description={description}
          coverUrl={coverUrl}
          sections={sections}
          activeSlideId={activeSlideId}
          onCourseTitle={setCourseTitle}
          onShortName={setShortName}
          onDescription={setDescription}
          onCover={setCoverUrl}
          onRenameSection={(sectionId, title) =>
            setSections((current) =>
              current.map((section) =>
                section.id === sectionId ? { ...section, title } : section
              )
            )
          }
          onRenameChapter={(sectionId, chapterId, title) =>
            setSections((current) =>
              current.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      chapters: section.chapters.map((chapter) =>
                        chapter.id === chapterId ? { ...chapter, title } : chapter
                      ),
                    }
                  : section
              )
            )
          }
          onRenameSlide={(slideId, title) =>
            setSections((current) =>
              current.map((section) => ({
                ...section,
                chapters: section.chapters.map((chapter) => ({
                  ...chapter,
                  slides: chapter.slides.map((slide) =>
                    slide.id === slideId ? { ...slide, title } : slide
                  ),
                })),
              }))
            )
          }
          onAddSection={handleAddSection}
          onAddChapter={handleAddChapter}
          onAddSlide={handleAddSlide}
          onSelectSlide={(slideId) => {
            void handleSelectSlide(slideId);
          }}
        />

        <main className="flex-1 relative overflow-hidden">
          <SlideStudioCanvas
            ref={canvasRef}
            ratio={ratio}
            showGrid={showGrid}
            background={backgroundState}
            onViewportChange={(currentZoom) => {
              setZoom(currentZoom);
              updateHistoryState();
            }}
            onSelectionChange={(active) => {
              setSelectedObject(active);
            }}
          />
        </main>

        <CardPropertyInspector
          canvas={canvasRef.current?.getFabricCanvas() ?? null}
          selectedObject={selectedObject}
          onModify={updateHistoryState}
          backgroundState={backgroundState}
          onBackgroundChange={(newBg) => {
            setBackgroundState(newBg);
            updateHistoryState();
          }}
          aspectRatioLabel={ratio}
          slideTransition={slideTransition}
          onSlideTransitionChange={(tr) => {
            setSlideTransition(tr);
            updateHistoryState();
          }}
        />
      </div>
    </div>
  );
}
