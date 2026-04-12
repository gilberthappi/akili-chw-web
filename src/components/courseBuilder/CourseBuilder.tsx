import { useState, useRef } from "react";
import {
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Menu,
  BookOpen,
  ClipboardList,
  FileQuestion,
  CheckSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import SlideUpload from "@/components/courseBuilder/SlideUpload";
import SlideCard from "@/components/courseBuilder/SlideCard";
import SlideViewerModal from "@/components/courseBuilder/SlideViewerModal";
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 text-sm">{label}</h4>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-gray-300"
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
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Questions to Answer
            </label>
            <input
              type="number"
              min={1}
              value={value.questionToBeAnswered}
              onChange={(e) =>
                update({ questionToBeAnswered: Number(e.target.value) })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Marks to Pass (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={value.marksToPass}
              onChange={(e) =>
                update({ marksToPass: Number(e.target.value) })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={value.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Optional description..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
type ViewMode = "slides" | "midTest" | "preTest" | "finalTest";

interface CourseBuilderProps {
  courseData: CourseBuilderData;
  onSave: (data: CourseBuilderData) => Promise<void>;
  onBack: () => void;
}

export default function CourseBuilder({ courseData, onSave }: CourseBuilderProps) {
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
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
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
  const [isSaving, setIsSaving] = useState(false);

  // Course-level test state
  const [preTest, setPreTest] = useState<TestConfig | undefined>(
    courseData.preTest
  );
  const [finalTest, setFinalTest] = useState<TestConfig | undefined>(
    courseData.finalTest
  );

  const dragOverSlideId = useRef<string>("");
  const dragOverSectionId = useRef<string>("");
  const dragOverChapterId = useRef<string>("");
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedChapter = selectedSection?.chapters.find(
    (c) => c.id === selectedChapterId
  );

  // ── Sections ─────────────────────────────────────────────────────────────────
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

  // Update mid-test for the selected chapter
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
                  c.slides.length > 0
                    ? Math.max(...c.slides.map((sl) => sl.order))
                    : 0;
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
        slidesContainerRef.current.scrollTop +=
          direction === "up" ? -20 : 20;
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
    if (!selectedChapter || !draggedSlideId) return;
    const draggedIndex = selectedChapter.slides.findIndex(
      (s) => s.id === draggedSlideId
    );
    const targetIndex = selectedChapter.slides.findIndex(
      (s) => s.id === dragOverSlideId.current
    );
    if (
      draggedIndex === -1 ||
      targetIndex === -1 ||
      draggedIndex === targetIndex
    ) {
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
  const handleSectionDragStart = (sectionId: string) =>
    setDraggedSectionId(sectionId);

  const handleSectionDrop = () => {
    if (!draggedSectionId) return;
    const draggedIndex = sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sections.findIndex(
      (s) => s.id === dragOverSectionId.current
    );
    if (
      draggedIndex === -1 ||
      targetIndex === -1 ||
      draggedIndex === targetIndex
    ) {
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
  const handleChapterDragStart = (chapterId: string) =>
    setDraggedChapterId(chapterId);

  const handleChapterDrop = () => {
    if (!selectedSection || !draggedChapterId) return;
    const draggedIndex = selectedSection.chapters.findIndex(
      (c) => c.id === draggedChapterId
    );
    const targetIndex = selectedSection.chapters.findIndex(
      (c) => c.id === dragOverChapterId.current
    );
    if (
      draggedIndex === -1 ||
      targetIndex === -1 ||
      draggedIndex === targetIndex
    ) {
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

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }
    const updated: CourseBuilderData = {
      ...courseData,
      sections,
      preTest,
      finalTest,
      updatedAt: new Date().toISOString(),
    };
    setIsSaving(true);
    try {
      await onSave(updated);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleChapterSelect = (sectionId: string, chapterId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedChapterId(chapterId);
    setViewMode("slides");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex bg-gray-50">
      {/* ── Sidebar ── */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Sections</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
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
                    className="flex-1 px-2 py-1.5 text-sm font-bold bg-white border-2 border-blue-500 rounded focus:outline-none"
                  />
                </div>
              ) : (
                <div
                  className={`w-full text-left px-3 py-2.5 rounded font-bold text-sm transition flex items-center justify-between cursor-pointer group ${
                    selectedSectionId === section.id
                      ? "bg-blue-100 text-blue-800"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <span
                    onClick={() => startEditingSection(section)}
                    className="truncate flex-1"
                  >
                    📂 {section.title}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addChapter(section.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition text-green-500 hover:text-green-700 p-1"
                      title="Add chapter"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-1"
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
              {expandedSectionId === section.id &&
                section.chapters.length > 0 && (
                  <div className="pl-3 mt-1">
                    <div className="space-y-0.5 border-l-2 border-blue-200 pl-2 ml-1">
                      {section.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className={`transition ${
                            draggedChapterId === chapter.id ? "opacity-50" : ""
                          }`}
                          draggable
                          onDragStart={() =>
                            handleChapterDragStart(chapter.id)
                          }
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
                                onChange={(e) =>
                                  setEditingText(e.target.value)
                                }
                                onBlur={() =>
                                  saveEditingChapter(chapter.id)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    saveEditingChapter(chapter.id);
                                  if (e.key === "Escape") {
                                    setEditingChapterId("");
                                    setEditingText("");
                                  }
                                }}
                                className="flex-1 px-1.5 py-0.5 text-xs font-medium bg-white border-2 border-purple-500 rounded focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() =>
                                handleChapterSelect(section.id, chapter.id)
                              }
                              className={`w-full text-left px-2 py-1.5 text-xs rounded font-medium transition flex items-center justify-between cursor-pointer group ${
                                selectedChapterId === chapter.id
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                              }`}
                            >
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingChapter(chapter);
                                }}
                                className="truncate flex-1"
                              >
                                📘 {chapter.title}
                                {chapter.midTest && (
                                  <span className="ml-1 text-green-600 font-bold">
                                    ✓
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChapter(chapter.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-0.5 flex-shrink-0"
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

        {/* Sidebar Footer: Add Section + Course Tests */}
        <div className="sticky bottom-0 px-4 py-4 border-t border-gray-200 space-y-2 bg-white">
          {/* Course-level test buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedChapterId("");
                setViewMode("preTest");
              }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                viewMode === "preTest"
                  ? "bg-orange-100 text-orange-700 border-orange-300"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50"
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              Pre-Test
              {preTest && <span className="text-green-600 font-bold">✓</span>}
            </button>
            <button
              onClick={() => {
                setSelectedChapterId("");
                setViewMode("finalTest");
              }}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${
                viewMode === "finalTest"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-green-50"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Final Test
              {finalTest && <span className="text-green-600 font-bold">✓</span>}
            </button>
          </div>

          <button
            onClick={addSection}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
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
                  className="text-gray-600 hover:text-gray-900 p-1"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {courseData.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedChapter && selectedChapter.slides.length > 0 && viewMode === "slides" && (
                <button
                  onClick={clearAllSlides}
                  className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Course"}
              </button>
            </div>
          </div>

          {/* Breadcrumb / Tabs */}
          {viewMode === "preTest" && (
            <p className="text-sm text-orange-600 font-medium">
              📋 Course Pre-Test Configuration
            </p>
          )}
          {viewMode === "finalTest" && (
            <p className="text-sm text-green-600 font-medium">
              ✅ Course Final Test Configuration
            </p>
          )}
          {(viewMode === "slides" || viewMode === "midTest") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">📂 Section:</span>
                <span className="text-gray-900 font-medium">
                  {selectedSection?.title || "—"}
                </span>
                <span className="font-semibold ml-2">📘 Chapter:</span>
                <span className="text-gray-900 font-medium">
                  {selectedChapter?.title || "Select a chapter"}
                </span>
              </div>
              {selectedChapter && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("slides")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                      viewMode === "slides"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Slides
                  </button>
                  <button
                    onClick={() => setViewMode("midTest")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition flex items-center gap-1 ${
                      viewMode === "midTest"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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

            {/* Pre-Test Panel */}
            {viewMode === "preTest" && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Course Pre-Test
                </h3>
                <p className="text-sm text-gray-500">
                  A pre-test is given to students before starting the course to assess their prior knowledge.
                </p>
                <TestConfigForm
                  label="Pre-Test"
                  value={preTest}
                  onChange={setPreTest}
                />
              </div>
            )}

            {/* Final Test Panel */}
            {viewMode === "finalTest" && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Course Final Test
                </h3>
                <p className="text-sm text-gray-500">
                  A final test is given to students after completing the course to assess their overall learning.
                </p>
                <TestConfigForm
                  label="Final Test"
                  value={finalTest}
                  onChange={setFinalTest}
                />
              </div>
            )}

            {/* Mid-Test Panel (per chapter) */}
            {viewMode === "midTest" && selectedChapter && (
              <div className="max-w-lg space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mid-Test for "{selectedChapter.title}"
                </h3>
                <p className="text-sm text-gray-500">
                  A mid-test is given to students after completing this chapter to check their understanding.
                </p>
                <TestConfigForm
                  label="Mid-Test"
                  value={selectedChapter.midTest}
                  onChange={updateChapterMidTest}
                />
              </div>
            )}

            {/* Slides Panel */}
            {viewMode === "slides" && selectedChapter && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Slides
                </h3>
                <div
                  ref={slidesContainerRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto flex-1"
                >
                  {selectedChapter.slides
                    .sort((a, b) => a.order - b.order)
                    .map((slide, index) => (
                      <div
                        key={slide.id}
                        className="p-2 -m-2 rounded-lg hover:bg-blue-50 transition"
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
                          order={index + 1}
                        />
                      </div>
                    ))}

                  {/* Upload Card */}
                  <div className="p-2 -m-2 rounded-lg">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center p-3 hover:bg-gray-100 transition">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No chapter selected
                </h3>
                <p className="text-gray-600 mb-6">
                  Select a chapter from the sidebar or create a new one to start adding slides
                </p>
                <button
                  onClick={() => {
                    if (selectedSection) addChapter(selectedSection.id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Chapter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Slide viewer modal — rendered at root level, outside scroll containers ── */}
      <SlideViewerModal
        slide={viewingSlide}
        onClose={() => setViewingSlide(null)}
      />
    </div>
  );
}
