import { useState, useRef, useEffect } from "react";
import {
  Globe,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Menu,
  BookOpen,
  ClipboardList,
  Database,
  LayoutList,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import SlideUpload from "@/components/courseBuilder/SlideUpload";
import SlideCard from "@/components/courseBuilder/SlideCard";
import SlideViewerModal from "@/components/courseBuilder/SlideViewerModal";
import QuestionBankPanel from "@/components/courseBuilder/QuestionBankPanel";
import { uploadSlideFile } from "@/services/course.service";
import {
  CourseBuilderData,
  CourseSection,
  CourseChapter,
  CourseSlide,
  TestConfig,
} from "@/types/courseBuilder.d";

// ─── TestConfigForm ────────────────────────────────────────────────────────────
interface TestConfigFormProps {
  label: string;
  value: TestConfig | undefined;
  onChange: (v: TestConfig | undefined) => void;
}

function TestConfigForm({ label, value, onChange }: TestConfigFormProps) {
  const enabled = !!value;

  const handleToggle = () => {
    if (enabled) {
      onChange(undefined);
    } else {
      onChange({ questionToBeAnswered: 5, marksToPass: 60, description: "" });
    }
  };

  const update = (partial: Partial<TestConfig>) => {
    if (!value) return;
    onChange({ ...value, ...partial });
  };

  return (
    <div className="bg-page-bg border border-gray-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-dark text-sm">{label}</h4>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && value && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Questions to Answer
              <span className="ml-1 font-normal text-gray-400">(randomly selected from Question Bank)</span>
            </label>
            <input
              type="number"
              min={1}
              value={value.questionToBeAnswered}
              onChange={(e) => update({ questionToBeAnswered: Number(e.target.value) })}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Marks to Pass (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={value.marksToPass}
              onChange={(e) => update({ marksToPass: Number(e.target.value) })}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Description
              <span className="ml-1 text-destructive font-bold">*</span>
              <span className="ml-1 font-normal text-gray-400">(shown to students as test feedback)</span>
            </label>
            <textarea
              rows={3}
              required
              value={value.description}
              onChange={(e) => update({ description: e.target.value })}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none ${
                value.description.trim() === ""
                  ? "border-destructive/60 bg-destructive/5"
                  : "border-gray-300"
              }`}
              placeholder="Describe what this test covers and what feedback students will receive..."
            />
            {value.description.trim() === "" && (
              <p className="text-xs text-destructive mt-1">Description is required — students see this as feedback.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
type ViewMode = "slides" | "midTest" | "questionBank" | "tests";

interface CourseBuilderProps {
  courseData: CourseBuilderData;
  onAutoSave: (data: CourseBuilderData) => Promise<CourseBuilderData | void>;
  onPublish: (data: CourseBuilderData) => Promise<void>;
  onBack: () => void;
}

export default function CourseBuilder({ courseData, onAutoSave, onPublish }: CourseBuilderProps) {
  const defaultSections =
    courseData.sections.length > 0
      ? courseData.sections
      : [
          {
            id: `section-${Date.now()}`,
            title: "Section 1",
            description: "First section",
            order: 1,
            chapters: [],
            hasTest: false,
          },
        ];

  const [sections, setSections] = useState<CourseSection[]>(defaultSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    defaultSections[0]?.id || ""
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    defaultSections[0]?.chapters[0]?.id || ""
  );
  const [expandedSectionId, setExpandedSectionId] = useState<string>(
    defaultSections[0]?.id || ""
  );
  const [editingSectionId, setEditingSectionId] = useState<string>("");
  const [editingChapterId, setEditingChapterId] = useState<string>("");
  const [editingText, setEditingText] = useState<string>("");
  const [draggedSlideId, setDraggedSlideId] = useState<string>("");
  const [viewingSlide, setViewingSlide] = useState<CourseSlide | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string>("");
  const [draggedChapterId, setDraggedChapterId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("slides");
  const [isPublishing, setIsPublishing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Course-level test state
  const [preTest, setPreTest] = useState<TestConfig | undefined>(courseData.preTest);
  const [finalTest, setFinalTest] = useState<TestConfig | undefined>(courseData.finalTest);
  const [finalExam, setFinalExam] = useState<TestConfig | undefined>(courseData.finalExam);

  // Track mid-test question bank refresh per chapter
  const [midTestRefreshKey, setMidTestRefreshKey] = useState(0);
  // testId values populated after auto-save (key: "sectionTitle::chapterTitle")
  const [extraTestIds, setExtraTestIds] = useState<Record<string, string>>({});
  // mid-test card drag state
  const [draggedMidTest, setDraggedMidTest] = useState(false);

  const dragOverSlideId = useRef<string>("");
  const dragOverSectionId = useRef<string>("");
  const dragOverChapterId = useRef<string>("");
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onAutoSaveRef = useRef(onAutoSave);
  const courseDataRef = useRef(courseData);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  useEffect(() => { onAutoSaveRef.current = onAutoSave; }, [onAutoSave]);
  useEffect(() => { courseDataRef.current = courseData; }, [courseData]);

  // Debounced auto-save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      const updated: CourseBuilderData = {
        ...courseDataRef.current,
        sections,
        preTest,
        finalTest,
        finalExam,
        updatedAt: new Date().toISOString(),
      };
      try {
        const freshData = await onAutoSaveRef.current(updated);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
        // Populate testIds from fresh API data without triggering another auto-save
        if (freshData) {
          const newIds: Record<string, string> = {};
          freshData.sections.forEach((s) => {
            s.chapters.forEach((ch) => {
              if (ch.testId) newIds[`${s.title}::${ch.title}`] = ch.testId;
            });
          });
          setExtraTestIds(newIds);
        }
      } catch {
        setAutoSaveStatus("error");
      }
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, preTest, finalTest, finalExam]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedChapter = selectedSection?.chapters.find((c) => c.id === selectedChapterId);

  // ── Sections ──────────────────────────────────────────────────────────────────
  const addSection = () => {
    const newSection: CourseSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: "",
      order: sections.length + 1,
      chapters: [],
      hasTest: false,
    };
    setSections([...sections, newSection]);
  };

  const updateSectionTitle = (id: string, title: string) =>
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)));

  const startEditingSection = (section: CourseSection) => {
    setEditingSectionId(section.id);
    setEditingText(section.title);
  };

  const saveEditingSection = (id: string) => {
    if (editingText.trim()) updateSectionTitle(id, editingText);
    setEditingSectionId("");
    setEditingText("");
  };

  const deleteSection = (id: string) => {
    if (sections.length === 1) {
      toast.error("You must have at least one section");
      return;
    }
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    if (selectedSectionId === id) {
      setSelectedSectionId(updated[0]?.id || "");
      setSelectedChapterId("");
    }
    toast.success("Section deleted");
  };

  // ── Chapters ──────────────────────────────────────────────────────────────────
  const addChapter = (sectionId?: string) => {
    const targetSectionId = sectionId || selectedSectionId;
    const targetSection = sections.find((s) => s.id === targetSectionId);
    if (!targetSection) return;

    const newChapter: CourseChapter = {
      id: `chapter-${Date.now()}`,
      title: `Chapter ${targetSection.chapters.length + 1}`,
      description: "",
      order: targetSection.chapters.length + 1,
      slides: [],
      hasTest: false,
    };

    setSections(
      sections.map((s) =>
        s.id === targetSectionId
          ? { ...s, chapters: [...s.chapters, newChapter] }
          : s
      )
    );
    setExpandedSectionId(targetSectionId);
    toast.success("Chapter added");
  };

  const startEditingChapter = (chapter: CourseChapter) => {
    setEditingChapterId(chapter.id);
    setEditingText(chapter.title);
  };

  const saveEditingChapter = (id: string) => {
    if (editingText.trim()) updateChapterTitle(id, editingText);
    setEditingChapterId("");
    setEditingText("");
  };

  const updateChapterTitle = (id: string, title: string) =>
    setSections(
      sections.map((s) =>
        s.id === selectedSectionId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === id ? { ...c, title } : c)) }
          : s
      )
    );

  const deleteChapter = (chapterId: string) => {
    if (!selectedSection) return;
    if (selectedSection.chapters.length === 1) {
      toast.error("You must have at least one chapter in a section");
      return;
    }
    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          const remaining = s.chapters.filter((c) => c.id !== chapterId);
          return { ...s, chapters: remaining };
        }
        return s;
      })
    );
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(selectedSection.chapters[0]?.id || "");
    }
    toast.success("Chapter deleted");
  };

  const updateChapterMidTest = (value: TestConfig | undefined) => {
    if (!selectedChapterId) return;
    setSections(
      sections.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === selectedChapterId
                  ? { ...c, hasTest: !!value, midTest: value }
                  : c
              ),
            }
          : s
      )
    );
  };

  const updateChapterActivityAt = (activityAt: number | undefined) => {
    if (!selectedChapterId) return;
    setSections(
      sections.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === selectedChapterId ? { ...c, activityAt } : c
              ),
            }
          : s
      )
    );
  };

  // ── Slides ────────────────────────────────────────────────────────────────────
  const addSlidesToChapter = (newSlides: CourseSlide[]) => {
    if (!selectedChapter) return;
    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                const maxOrder =
                  c.slides.length > 0 ? Math.max(...c.slides.map((sl) => sl.order)) : 0;
                const slidesWithOrder = newSlides.map((slide, index) => ({
                  ...slide,
                  order: maxOrder + index + 1,
                }));
                return { ...c, slides: [...c.slides, ...slidesWithOrder] };
              }
              return c;
            }),
          };
        }
        return s;
      })
    );
  };

  const deleteSlide = (slideId: string) => {
    if (!selectedChapter) return;
    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                return { ...c, slides: c.slides.filter((sl) => sl.id !== slideId) };
              }
              return c;
            }),
          };
        }
        return s;
      })
    );
    toast.success("Slide deleted");
  };

  const duplicateSlide = (slideId: string) => {
    if (!selectedChapter) return;
    const slideToClone = selectedChapter.slides.find((s) => s.id === slideId);
    if (!slideToClone) return;

    const duplicatedSlide: CourseSlide = {
      ...slideToClone,
      id: `slide-${Date.now()}`,
      title: `${slideToClone.title} (Copy)`,
      order: Math.max(...selectedChapter.slides.map((s) => s.order)) + 1,
    };

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                return { ...c, slides: [...c.slides, duplicatedSlide] };
              }
              return c;
            }),
          };
        }
        return s;
      })
    );
    toast.success("Slide duplicated");
  };

  const replaceSlide = async (slideId: string, file: File) => {
    const getFileType = (name: string): "pdf" | "image" | "video" => {
      const ext = name.toLowerCase().split(".").pop() || "";
      if (ext === "pdf") return "pdf";
      if (["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v", "3gp"].includes(ext)) return "video";
      return "image";
    };

    const uploadToast = toast.loading("Uploading replacement file…");
    try {
      const fileUrl = await uploadSlideFile(file);
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          chapters: s.chapters.map((c) => ({
            ...c,
            slides: c.slides.map((sl) =>
              sl.id === slideId
                ? {
                    ...sl,
                    fileUrl,
                    fileName: file.name,
                    fileType: getFileType(file.name),
                    title: file.name.replace(/\.[^/.]+$/, ""),
                  }
                : sl
            ),
          })),
        }))
      );
      toast.success("Slide replaced successfully", { id: uploadToast });
    } catch {
      toast.error("Failed to upload replacement file", { id: uploadToast });
    }
  };

  const downloadSlide = (slide: CourseSlide) => {
    const a = document.createElement("a");
    a.href = slide.fileUrl;
    a.download = slide.fileName;
    a.click();
    toast.success("Downloading slide...");
  };

  const updateSlideTitle = (slideId: string, newTitle: string) => {
    if (!selectedSection || !selectedChapter) return;
    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                return {
                  ...c,
                  slides: c.slides.map((slide) =>
                    slide.id === slideId ? { ...slide, title: newTitle } : slide
                  ),
                };
              }
              return c;
            }),
          };
        }
        return s;
      })
    );
    toast.success("Slide title updated");
  };

  const clearAllSlides = () => {
    if (!selectedChapter || selectedChapter.slides.length === 0) {
      toast.error("No slides to clear");
      return;
    }
    if (confirm("Clear all slides from this chapter?")) {
      setSections(
        sections.map((s) => {
          if (s.id === selectedSectionId) {
            return {
              ...s,
              chapters: s.chapters.map((c) => {
                if (c.id === selectedChapterId) return { ...c, slides: [] };
                return c;
              }),
            };
          }
          return s;
        })
      );
      toast.success("All slides cleared");
    }
  };

  // ── Drag: Slides ──────────────────────────────────────────────────────────────
  const handleDragStart = (slideId: string) => setDraggedSlideId(slideId);

  const startAutoScroll = (direction: "up" | "down") => {
    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
    autoScrollIntervalRef.current = setInterval(() => {
      if (slidesContainerRef.current) {
        slidesContainerRef.current.scrollTop += direction === "up" ? -20 : 20;
      }
    }, 50);
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleSlideDragOver = (e: React.DragEvent, slideId: string) => {
    e.preventDefault();
    dragOverSlideId.current = slideId;
    if (slidesContainerRef.current) {
      const rect = slidesContainerRef.current.getBoundingClientRect();
      const distance = 80;
      if (e.clientY - rect.top < distance) startAutoScroll("up");
      else if (rect.bottom - e.clientY < distance) startAutoScroll("down");
      else stopAutoScroll();
    }
  };

  const handleSlideDragEnd = () => {
    stopAutoScroll();
    setDraggedSlideId("");
  };

  const handleDrop = () => {
    // Mid-test card being repositioned onto a slide
    if (draggedMidTest) {
      if (!selectedChapter) return;
      const sorted = [...selectedChapter.slides].sort((a, b) => a.order - b.order);
      const targetIdx = sorted.findIndex((s) => s.id === dragOverSlideId.current);
      updateChapterActivityAt(targetIdx !== -1 ? targetIdx + 1 : sorted.length + 1);
      setDraggedMidTest(false);
      dragOverSlideId.current = "";
      toast.success("Mid-Test repositioned");
      return;
    }
    if (!selectedChapter || !draggedSlideId) return;
    const draggedIndex = selectedChapter.slides.findIndex((s) => s.id === draggedSlideId);
    const targetIndex = selectedChapter.slides.findIndex(
      (s) => s.id === dragOverSlideId.current
    );
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSlideId("");
      return;
    }
    const newSlides = [...selectedChapter.slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, draggedSlide);
    const reordered = newSlides.map((slide, i) => ({ ...slide, order: i + 1 }));

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) return { ...c, slides: reordered };
              return c;
            }),
          };
        }
        return s;
      })
    );
    setDraggedSlideId("");
    dragOverSlideId.current = "";
    toast.success("Slide reordered");
  };

  // ── Drag: Sections ────────────────────────────────────────────────────────────
  const handleSectionDragStart = (sectionId: string) => setDraggedSectionId(sectionId);

  const handleSectionDrop = () => {
    if (!draggedSectionId) return;
    const draggedIndex = sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sections.findIndex((s) => s.id === dragOverSectionId.current);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSectionId("");
      return;
    }
    const newSections = [...sections];
    const [dragged] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, dragged);
    setSections(newSections.map((s, i) => ({ ...s, order: i + 1 })));
    setDraggedSectionId("");
    dragOverSectionId.current = "";
    toast.success("Section reordered");
  };

  // ── Drag: Chapters ────────────────────────────────────────────────────────────
  const handleChapterDragStart = (chapterId: string) => setDraggedChapterId(chapterId);

  const handleChapterDrop = () => {
    if (!selectedSection || !draggedChapterId) return;
    const draggedIndex = selectedSection.chapters.findIndex((c) => c.id === draggedChapterId);
    const targetIndex = selectedSection.chapters.findIndex(
      (c) => c.id === dragOverChapterId.current
    );
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedChapterId("");
      return;
    }
    const newChapters = [...selectedSection.chapters];
    const [dragged] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, dragged);

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: newChapters.map((c, i) => ({ ...c, order: i + 1 })),
          };
        }
        return s;
      })
    );
    setDraggedChapterId("");
    dragOverChapterId.current = "";
    toast.success("Chapter reordered");
  };

  // ── Publish ───────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section before publishing");
      return;
    }
    const missingDesc = sections
      .flatMap((s) => s.chapters)
      .find((c) => c.midTest && c.midTest.description.trim() === "");
    if (missingDesc) {
      toast.error(`Mid-Test description is required for "${missingDesc.title}"`);
      return;
    }
    const updated: CourseBuilderData = {
      ...courseData,
      sections,
      preTest,
      finalTest,
      finalExam,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    };
    setIsPublishing(true);
    try {
      await onPublish(updated);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleChapterSelect = (sectionId: string, chapterId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedChapterId(chapterId);
    setViewMode("slides");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex bg-page-bg">
      {/* ── Sidebar ── */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-dark">Sections</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-secondary hover:text-dark p-1"
            >
              <ChevronUp className="w-5 h-5 rotate-90" />
            </button>
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-auto space-y-1 px-3 py-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`space-y-0 transition ${
                draggedSectionId === section.id ? "opacity-50" : ""
              }`}
              draggable
              onDragStart={() => handleSectionDragStart(section.id)}
              onDragOver={(e) => {
                e.preventDefault();
                dragOverSectionId.current = section.id;
              }}
              onDrop={handleSectionDrop}
              onDragEnd={() => setDraggedSectionId("")}
            >
              {/* Section Header */}
              {editingSectionId === section.id ? (
                <div className="flex items-center gap-2 px-2 py-2">
                  <input
                    type="text"
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => saveEditingSection(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditingSection(section.id);
                      if (e.key === "Escape") {
                        setEditingSectionId("");
                        setEditingText("");
                      }
                    }}
                    className="flex-1 px-2 py-1.5 text-sm font-bold bg-white border-2 border-primary rounded focus:outline-none"
                  />
                </div>
              ) : (
                <div
                  onClick={() =>
                    setExpandedSectionId(
                      expandedSectionId === section.id ? "" : section.id
                    )
                  }
                  onDoubleClick={() => startEditingSection(section)}
                  title="Click to expand · Double-click to rename"
                  className={`w-full text-left px-3 py-2.5 rounded font-bold text-sm transition flex items-center justify-between cursor-pointer group ${
                    selectedSectionId === section.id
                      ? "bg-primary/10 text-primary"
                      : "bg-primary/5 text-primary/80 hover:bg-primary/10"
                  }`}
                >
                  <span className="truncate flex-1 select-none">
                    📂 {section.title}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addChapter(section.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition text-green-600 hover:text-green-700 p-1"
                      title="Add chapter"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition text-destructive/60 hover:text-destructive p-1"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSectionId(
                          expandedSectionId === section.id ? "" : section.id
                        );
                      }}
                    >
                      {expandedSectionId === section.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Chapters */}
              {expandedSectionId === section.id && section.chapters.length > 0 && (
                <div className="pl-3 mt-1">
                  <div className="space-y-0.5 border-l-2 border-primary/20 pl-2 ml-1">
                    {section.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`transition ${
                          draggedChapterId === chapter.id ? "opacity-50" : ""
                        }`}
                        draggable
                        onDragStart={() => handleChapterDragStart(chapter.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          dragOverChapterId.current = chapter.id;
                        }}
                        onDrop={handleChapterDrop}
                        onDragEnd={() => setDraggedChapterId("")}
                      >
                        {editingChapterId === chapter.id ? (
                          <div className="flex items-center gap-2 px-1 py-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => saveEditingChapter(chapter.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditingChapter(chapter.id);
                                if (e.key === "Escape") {
                                  setEditingChapterId("");
                                  setEditingText("");
                                }
                              }}
                              className="flex-1 px-1.5 py-0.5 text-xs font-medium bg-white border-2 border-secondary rounded focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => handleChapterSelect(section.id, chapter.id)}
                            onDoubleClick={() => startEditingChapter(chapter)}
                            title="Click to select · Double-click to rename"
                            className={`w-full text-left px-2 py-1.5 text-xs rounded font-medium transition flex items-center justify-between cursor-pointer group ${
                              selectedChapterId === chapter.id
                                ? "bg-secondary/10 text-secondary"
                                : "bg-secondary/5 text-secondary/80 hover:bg-secondary/10"
                            }`}
                          >
                            <span className="truncate flex-1 select-none">
                              📘 {chapter.title}
                              {chapter.midTest && (
                                <span className="ml-1 text-green-600 font-bold">✓</span>
                              )}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapter(chapter.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition text-destructive/60 hover:text-destructive p-0.5 flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="sticky bottom-0 px-4 py-4 border-t border-gray-200 space-y-2 bg-white">
          {/* Question Bank + Tests buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedChapterId("");
                setViewMode("questionBank");
              }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                viewMode === "questionBank"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-white text-secondary border-gray-300 hover:bg-primary/5"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Question Bank
            </button>
            <button
              onClick={() => {
                setSelectedChapterId("");
                setViewMode("tests");
              }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                viewMode === "tests"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-white text-secondary border-gray-300 hover:bg-primary/5"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Tests
              {(preTest || finalTest || finalExam) && (
                <span className="text-green-600 font-bold">✓</span>
              )}
            </button>
          </div>

          <button
            onClick={addSection}
            className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-secondary hover:text-dark p-1"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-dark">{courseData.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedChapter && selectedChapter.slides.length > 0 && viewMode === "slides" && (
                <button
                  onClick={clearAllSlides}
                  className="px-4 py-2 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
              {autoSaveStatus === "saving" && (
                <span className="text-xs text-secondary flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-saving...
                </span>
              )}
              {autoSaveStatus === "saved" && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Saved
                </span>
              )}
              {autoSaveStatus === "error" && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Auto-save failed
                </span>
              )}
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-60"
              >
                <Globe className="w-4 h-4" />
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          {/* Breadcrumb / Tabs */}
          {viewMode === "questionBank" && (
            <p className="text-sm text-primary font-medium flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Question Bank — shared across Pre-Test, Final Test, and Exam
            </p>
          )}
          {viewMode === "tests" && (
            <p className="text-sm text-primary font-medium flex items-center gap-1.5">
              <LayoutList className="w-4 h-4" />
              Tests Configuration
            </p>
          )}
          {(viewMode === "slides" || viewMode === "midTest") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="font-semibold">📂 Section:</span>
                <span className="text-dark font-medium">
                  {selectedSection?.title || "—"}
                </span>
                <span className="font-semibold ml-2">📘 Chapter:</span>
                <span className="text-dark font-medium">
                  {selectedChapter?.title || "Select a chapter"}
                </span>
              </div>
              {selectedChapter && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("slides")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                      viewMode === "slides"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-secondary border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Slides
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("midTest");
                      setMidTestRefreshKey((k) => k + 1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition flex items-center gap-1 ${
                      viewMode === "midTest"
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-secondary border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <ClipboardList className="w-3 h-3" />
                    Mid-Test
                    {selectedChapter.midTest && (
                      <span className="text-green-400 font-bold">✓</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-8xl mx-auto p-6">

            {/* ── Question Bank Panel ── */}
            {viewMode === "questionBank" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dark">Question Bank</h3>
                  <p className="text-sm text-secondary mt-1">
                    All questions stored here are randomly selected when students take the
                    Pre-Test, Final Test, or Exam. Each test draws the number of questions
                    you configure. Mid-Test uses its own separate questions.
                  </p>
                </div>
                <QuestionBankPanel courseId={courseData.id} />
              </div>
            )}

            {/* ── Tests Panel ── */}
            {viewMode === "tests" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-dark">Tests</h3>
                  <p className="text-sm text-secondary mt-1">
                    Configure how many questions each test draws from the Question Bank.
                    Questions are selected randomly each time a student takes the test.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pre-Test */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        Pre-Test
                      </span>
                      <p className="text-xs text-gray-400">Given before the course begins</p>
                    </div>
                    <TestConfigForm label="Pre-Test" value={preTest} onChange={setPreTest} />
                  </div>

                  {/* Final Test */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded">
                        Final Test
                      </span>
                      <p className="text-xs text-gray-400">Given after completing the course</p>
                    </div>
                    <TestConfigForm label="Final Test" value={finalTest} onChange={setFinalTest} />
                  </div>

                  {/* Exam */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-dark bg-dark/10 border border-dark/20 px-2 py-0.5 rounded">
                        Exam
                      </span>
                      <p className="text-xs text-gray-400">Final formal assessment</p>
                    </div>
                    <TestConfigForm label="Exam" value={finalExam} onChange={setFinalExam} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Mid-Test Panel ── */}
            {viewMode === "midTest" && selectedChapter && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-dark">
                    Mid-Test — {selectedChapter.title}
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    Given after students complete this chapter. Mid-Test uses its own
                    questions — not from the Question Bank.
                  </p>
                </div>

                <TestConfigForm
                  label="Mid-Test"
                  value={selectedChapter.midTest}
                  onChange={updateChapterMidTest}
                />

                {selectedChapter.midTest && (
                  <div className="bg-page-bg border border-gray-200 rounded-lg p-5 space-y-3">
                    <h4 className="font-semibold text-dark text-sm">Position in Slides</h4>
                    <p className="text-xs text-gray-400">
                      The Mid-Test card will appear at this slot in the slides view. You can also drag it there.
                    </p>
                    <input
                      type="number"
                      min={1}
                      max={selectedChapter.slides.length + 1}
                      value={selectedChapter.activityAt ?? (selectedChapter.slides.length + 1)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        updateChapterActivityAt(v > 0 ? v : undefined);
                      }}
                      className="w-32 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}

                {selectedChapter.midTest && (() => {
                  const resolvedTestId =
                    selectedChapter.testId ??
                    extraTestIds[`${selectedSection?.title}::${selectedChapter.title}`];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-dark">Questions</h4>
                        {!resolvedTestId && (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                            Saving course to link questions…
                          </span>
                        )}
                      </div>
                      {resolvedTestId ? (
                        <QuestionBankPanel
                          courseId={courseData.id}
                          midTestId={resolvedTestId}
                          refreshKey={midTestRefreshKey}
                        />
                      ) : (
                        <div className="text-sm text-secondary italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                          Questions will be available after the course is saved.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Slides Panel ── */}
            {viewMode === "slides" && selectedChapter && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-dark mb-4">Slides</h3>
                <div
                  ref={slidesContainerRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto flex-1"
                >
                  {(() => {
                    const sortedSlides = [...selectedChapter.slides].sort(
                      (a, b) => a.order - b.order
                    );
                    const hasMidTest = !!selectedChapter.midTest;
                    // activityAt is 1-indexed position of the mid-test card in the combined list
                    const midTestSlot = selectedChapter.activityAt ?? sortedSlides.length + 1;

                    type CombinedItem =
                      | { kind: "slide"; slide: CourseSlide; slideIndex: number }
                      | { kind: "midTest"; slot: number };

                    const items: CombinedItem[] = [];
                    let midInserted = false;
                    sortedSlides.forEach((slide, i) => {
                      if (hasMidTest && !midInserted && i + 1 >= midTestSlot) {
                        items.push({ kind: "midTest", slot: midTestSlot });
                        midInserted = true;
                      }
                      items.push({ kind: "slide", slide, slideIndex: i });
                    });
                    if (hasMidTest && !midInserted) {
                      items.push({ kind: "midTest", slot: midTestSlot });
                    }

                    return items.map((item, combinedIdx) => {
                      if (item.kind === "midTest") {
                        return (
                          <div
                            key="midTest-card"
                            className={`p-2 -m-2 rounded-lg transition ${
                              draggedMidTest ? "opacity-50" : ""
                            }`}
                            draggable
                            onDragStart={() => {
                              setDraggedMidTest(true);
                              setDraggedSlideId("");
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={() => setDraggedMidTest(false)}
                          >
                            <div
                              className="bg-secondary/10 border-2 border-secondary/30 rounded-lg aspect-square flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-secondary/20 transition select-none"
                              onClick={() => {
                                setViewMode("midTest");
                                setMidTestRefreshKey((k) => k + 1);
                              }}
                              title="Click to configure · Drag to reposition"
                            >
                              <ClipboardList className="w-10 h-10 text-secondary mb-2" />
                              <span className="text-xs font-bold text-secondary">Mid-Test</span>
                              <span className="text-xs text-secondary/60 mt-0.5">
                                Slot {combinedIdx + 1}
                              </span>
                              <span className="text-xs text-secondary/40 mt-1">
                                ⠿ drag to move
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const { slide, slideIndex } = item;
                      return (
                        <div
                          key={slide.id}
                          className="p-2 -m-2 rounded-lg hover:bg-primary/5 transition"
                          draggable
                          onDragStart={() => handleDragStart(slide.id)}
                          onDragOver={(e) => handleSlideDragOver(e, slide.id)}
                          onDrop={handleDrop}
                          onDragEnd={handleSlideDragEnd}
                        >
                          <SlideCard
                            slide={slide}
                            onDelete={deleteSlide}
                            onDuplicate={duplicateSlide}
                            onDownload={downloadSlide}
                            onReplace={replaceSlide}
                            onView={setViewingSlide}
                            onTitleChange={updateSlideTitle}
                            isDragging={draggedSlideId === slide.id}
                            isAnySlideBeingDragged={draggedSlideId !== ""}
                            order={slideIndex + 1}
                          />
                        </div>
                      );
                    });
                  })()}

                  {/* Upload Card */}
                  <div className="p-2 -m-2 rounded-lg">
                    <div className="bg-page-bg border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center p-3 hover:bg-primary/5 transition">
                      <SlideUpload
                        onSlideAdded={addSlidesToChapter}
                        currentOrder={selectedChapter.slides.length}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No chapter selected */}
            {viewMode === "slides" && !selectedChapter && (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-dark mb-2">
                  No chapter selected
                </h3>
                <p className="text-secondary mb-6">
                  Select a chapter from the sidebar or create a new one to start adding slides
                </p>
                <button
                  onClick={() => {
                    if (selectedSection) addChapter(selectedSection.id);
                  }}
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide viewer */}
      <SlideViewerModal
        slide={viewingSlide}
        onClose={() => setViewingSlide(null)}
      />
    </div>
  );
}
