import { useState, useRef } from "react";
import {
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Menu,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import SlideUpload from "@/components/courseBuilder/SlideUpload";
import SlideCard from "@/components/courseBuilder/SlideCard";
import { CourseBuilderData, CourseSection, CourseChapter, CourseSlide } from "@/types/courseBuilder.d";

interface CourseBuilderProps {
  courseData: CourseBuilderData;
  onSave: (data: CourseBuilderData) => void;
  onBack: () => void;
}

export default function CourseBuilder({
  courseData,
  onSave,
}: CourseBuilderProps) {
  const defaultSections = courseData.sections.length > 0
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
  const [draggedSectionId, setDraggedSectionId] = useState<string>("");
  const [draggedChapterId, setDraggedChapterId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const dragOverSlideId = useRef<string>("");
  const dragOverSectionId = useRef<string>("");
  const dragOverChapterId = useRef<string>("");
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedChapter = selectedSection?.chapters.find((c) => c.id === selectedChapterId);

  // Add new section
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

  // Update section title
  const updateSectionTitle = (id: string, title: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  // Start editing section title
  const startEditingSection = (section: CourseSection) => {
    setEditingSectionId(section.id);
    setEditingText(section.title);
  };

  // Save edited section title
  const saveEditingSection = (id: string) => {
    if (editingText.trim()) {
      updateSectionTitle(id, editingText);
    }
    setEditingSectionId("");
    setEditingText("");
  };

  // Start editing chapter title
  const startEditingChapter = (chapter: CourseChapter) => {
    setEditingChapterId(chapter.id);
    setEditingText(chapter.title);
  };

  // Save edited chapter title
  const saveEditingChapter = (id: string) => {
    if (editingText.trim()) {
      updateChapterTitle(id, editingText);
    }
    setEditingChapterId("");
    setEditingText("");
  };

  // Update chapter title
  const updateChapterTitle = (id: string, title: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => (c.id === id ? { ...c, title } : c)),
          };
        }
        return s;
      })
    );
  };

  // Delete section
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

  // Add new chapter to section
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
      sections.map((s) => {
        if (s.id === targetSectionId) {
          return {
            ...s,
            chapters: [...s.chapters, newChapter],
          };
        }
        return s;
      })
    );
    // Auto-expand the section when adding a chapter
    setExpandedSectionId(targetSectionId);
    toast.success("Chapter added");
  };

  // Delete chapter
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
          return {
            ...s,
            chapters: remaining,
          };
        }
        return s;
      })
    );
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(selectedSection.chapters[0]?.id || "");
    }
    toast.success("Chapter deleted");
  };

  // Add slides to chapter
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

  // Delete slide
  const deleteSlide = (slideId: string) => {
    if (!selectedChapter) return;

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                return {
                  ...c,
                  slides: c.slides.filter((sl) => sl.id !== slideId),
                };
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

  // Duplicate slide
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
                return {
                  ...c,
                  slides: [...c.slides, duplicatedSlide],
                };
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

  // Download slide
  const downloadSlide = (slide: CourseSlide) => {
    const a = document.createElement("a");
    a.href = slide.fileUrl;
    a.download = slide.fileName;
    a.click();
    toast.success("Downloading slide...");
  };

  // Update slide title
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

  // Handle drag start
  const handleDragStart = (slideId: string) => {
    setDraggedSlideId(slideId);
  };

  // Handle drag over
  const handleDragOver = (slideId: string) => {
    dragOverSlideId.current = slideId;
  };

  // Auto-scroll when dragging near edges
  const startAutoScroll = (direction: 'up' | 'down') => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    
    autoScrollIntervalRef.current = setInterval(() => {
      if (slidesContainerRef.current) {
        const scrollAmount = 20;
        if (direction === 'up') {
          slidesContainerRef.current.scrollTop -= scrollAmount;
        } else {
          slidesContainerRef.current.scrollTop += scrollAmount;
        }
      }
    }, 50);
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // Handle drag move with auto-scroll
  const handleSlideDragOver = (e: React.DragEvent, slideId: string) => {
    e.preventDefault();
    handleDragOver(slideId);

    if (slidesContainerRef.current) {
      const rect = slidesContainerRef.current.getBoundingClientRect();
      const distance = 80; // Pixels from edge to trigger scroll

      if (e.clientY - rect.top < distance) {
        startAutoScroll('up');
      } else if (rect.bottom - e.clientY < distance) {
        startAutoScroll('down');
      } else {
        stopAutoScroll();
      }
    }
  };

  const handleSlideDragEnd = () => {
    stopAutoScroll();
    setDraggedSlideId("");
  };

  // Handle drop
  const handleDrop = () => {
    if (!selectedChapter || !draggedSlideId) return;

    const draggedIndex = selectedChapter.slides.findIndex(
      (s) => s.id === draggedSlideId
    );
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

    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index + 1,
    }));

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return {
            ...s,
            chapters: s.chapters.map((c) => {
              if (c.id === selectedChapterId) {
                return { ...c, slides: reorderedSlides };
              }
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

  // Handle section drag start
  const handleSectionDragStart = (sectionId: string) => {
    setDraggedSectionId(sectionId);
  };

  // Handle section drag over
  const handleSectionDragOver = (sectionId: string) => {
    dragOverSectionId.current = sectionId;
  };

  // Handle section drop
  const handleSectionDrop = () => {
    if (!draggedSectionId) return;

    const draggedIndex = sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sections.findIndex(
      (s) => s.id === dragOverSectionId.current
    );

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedSectionId("");
      return;
    }

    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));

    setSections(reorderedSections);
    setDraggedSectionId("");
    dragOverSectionId.current = "";
    toast.success("Section reordered");
  };

  // Handle chapter drag start
  const handleChapterDragStart = (chapterId: string) => {
    setDraggedChapterId(chapterId);
  };

  // Handle chapter drag over
  const handleChapterDragOver = (chapterId: string) => {
    dragOverChapterId.current = chapterId;
  };

  // Handle chapter drop
  const handleChapterDrop = () => {
    if (!selectedSection || !draggedChapterId) return;

    const draggedIndex = selectedSection.chapters.findIndex(
      (c) => c.id === draggedChapterId
    );
    const targetIndex = selectedSection.chapters.findIndex(
      (c) => c.id === dragOverChapterId.current
    );

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedChapterId("");
      return;
    }

    const newChapters = [...selectedSection.chapters];
    const [draggedChapter] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, draggedChapter);

    const reorderedChapters = newChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));

    setSections(
      sections.map((s) => {
        if (s.id === selectedSectionId) {
          return { ...s, chapters: reorderedChapters };
        }
        return s;
      })
    );

    setDraggedChapterId("");
    dragOverChapterId.current = "";
    toast.success("Chapter reordered");
  };

  // Handle save
  const handleSave = () => {
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    const updated: CourseBuilderData = {
      ...courseData,
      sections,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    toast.success("Course saved successfully!");
  };

  // Clear all slides
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
                if (c.id === selectedChapterId) {
                  return { ...c, slides: [] };
                }
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

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Sections & Chapters */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-80" : "w-0"} overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
             Sections
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Close sidebar"
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
              className={`space-y-0 transition ${draggedSectionId === section.id ? "opacity-50" : ""}`}
              draggable
              onDragStart={() => handleSectionDragStart(section.id)}
              onDragOver={(e) => {
                e.preventDefault();
                handleSectionDragOver(section.id);
              }}
              onDrop={handleSectionDrop}
              onDragEnd={() => setDraggedSectionId("")}
            >
              {/* Section Header - Inline Editable */}
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
                        setExpandedSectionId(section.id);
                      }}
                      className="flex-shrink-0"
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

              {/* Section Options */}
              {expandedSectionId === section.id && (
                <div className="pl-3 space-y-1">

                  {/* Chapters in Section */}
                  {section.chapters.length > 0 && (
                    <div className="mt-2 space-y-0.5 border-l-2 border-blue-200 pl-2 ml-1">
                      {section.chapters.map((chapter) => (
                        <div 
                          key={chapter.id}
                          className={`transition ${draggedChapterId === chapter.id ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={() => handleChapterDragStart(chapter.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            handleChapterDragOver(chapter.id);
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
                                className="flex-1 px-1.5 py-0.5 text-xs font-medium bg-white border-2 border-purple-500 rounded focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                setSelectedChapterId(chapter.id);
                              }}
                              className={`w-full text-left px-2 py-1.5 text-xs rounded font-medium transition flex items-center justify-between cursor-pointer group ${
                                selectedChapterId === chapter.id
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                              }`}
                            >
                              <span 
                                onClick={() => startEditingChapter(chapter)}
                                className="truncate flex-1"
                              >
                                📘 {chapter.title}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChapter(chapter.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-0.5 flex-shrink-0"
                                title="Delete chapter"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 px-4 py-4 border-t border-gray-200 space-y-2 bg-white">
          <button
            onClick={addSection}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {/* Main Content - Chapters & Slides */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedChapter ? (
          <>
            {/* Chapter Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-gray-600 hover:text-gray-900 p-1 flex-shrink-0"
                    title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {!sidebarOpen &&(<Menu className="w-6 h-6" />)}
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {courseData.title}
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Course
                </button>
                {selectedChapter.slides.length > 0 && (
                    <button
                      onClick={clearAllSlides}
                      className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
              </div>
              
              {/* Breadcrumb Navigation */}
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📂 Section:</span>
                  <span className="text-gray-900 font-medium">{selectedSection?.title || "Select a section"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📘 Chapter:</span>
                  <span className="text-gray-900 font-medium">{selectedChapterId ? selectedChapter?.title : "Select or create a chapter"}</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              <div className="max-w-8xl mx-auto p-6">
                {/* Slides Grid */}
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
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header with Course/Section/Chapter Info */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-gray-600 hover:text-gray-900 p-1 flex-shrink-0"
                    title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {!sidebarOpen && (<Menu className="w-6 h-6" />)}
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {courseData.title}
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Course
                </button>
              </div>
              
              {/* Breadcrumb Navigation */}
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📂 Section:</span>
                  <span className="text-gray-900 font-medium">{selectedSection?.title || "Select a section"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📘 Chapter:</span>
                  <span className="text-gray-900 font-medium">{selectedChapterId ? selectedChapter?.title : "Select or create a chapter"}</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              <div className="max-w-8xl mx-auto p-6">
                {!selectedChapterId ? (
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
                        if (selectedSection) {
                          addChapter(selectedSection.id);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Chapter
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
