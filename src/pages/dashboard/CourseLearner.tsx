import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  ImageIcon,
  Loader2,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { getCourseSectionsWithChapters, getChapterSlides, getChapterMidTestId } from "@/services/course.service";
import { markSlideComplete } from "@/services/progress.service";
import { ISection, IChapter, ISlide } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────

const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "m4v", "3gp"]);

function detectFileType(url: string): "video" | "pdf" | "image" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "image";
}

// ── sub-components ────────────────────────────────────────────────────

const SlideViewer: React.FC<{ slide: ISlide }> = ({ slide }) => {
  const kind = slide.file ? detectFileType(slide.file) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Media */}
      {slide.file ? (
        <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[220px]">
          {kind === "video" && (
            <video
              key={slide.id}
              src={slide.file}
              controls
              className="w-full max-h-[480px] outline-none"
            />
          )}
          {kind === "pdf" && (
            <iframe
              key={slide.id}
              src={slide.file}
              title="Slide PDF"
              className="w-full h-[480px] border-0"
            />
          )}
          {kind === "image" && (
            <img
              key={slide.id}
              src={slide.file}
              alt={slide.note || "Slide"}
              className="max-w-full max-h-[480px] object-contain"
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-100 flex items-center justify-center min-h-[220px] text-gray-400">
          <FileText size={48} className="opacity-40" />
        </div>
      )}

      {/* Slide content */}
      {slide.note && (
        <h2 className="text-lg font-semibold text-gray-900">{slide.note}</h2>
      )}
      {slide.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{slide.description}</p>
      )}
    </div>
  );
};

const SlideIcon: React.FC<{ url?: string }> = ({ url }) => {
  if (!url) return <Circle size={14} className="text-gray-300" />;
  const kind = detectFileType(url);
  if (kind === "video") return <PlayCircle size={14} className="text-[#3363AD]" />;
  if (kind === "pdf") return <FileText size={14} className="text-orange-500" />;
  return <ImageIcon size={14} className="text-green-500" />;
};

// ── main component ────────────────────────────────────────────────────

const CourseLearner: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState("");
  const [sections, setSections] = useState<ISection[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Currently open section in sidebar
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  // Currently selected chapter + loaded slides
  const [activeChapter, setActiveChapter] = useState<IChapter | null>(null);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  // Current slide index within the active chapter
  const [slideIndex, setSlideIndex] = useState(0);
  // Completed slide ids (session-level; backend persists the truth)
  const [completedSlideIds, setCompletedSlideIds] = useState<Set<string>>(new Set());
  // Mid-test id for the currently active chapter (null if none)
  const [chapterMidTestId, setChapterMidTestId] = useState<string | null>(null);
  // Mobile outline drawer
  const [outlineOpen, setOutlineOpen] = useState(false);
  const markingRef = useRef(false);

  // ── load course outline ───────────────────────────────────────────

  useEffect(() => {
    if (!courseId) return;
    setIsLoadingCourse(true);
    setCourseError(null);
    getCourseSectionsWithChapters(courseId)
      .then((res) => {
        const data = res.data as unknown as { title?: string; sections?: ISection[] };
        setCourseTitle(data?.title ?? "Course");
        const secs: ISection[] = data?.sections ?? [];
        setSections(secs);
        // Auto-open first section
        if (secs.length > 0) setOpenSectionId(secs[0].id);
      })
      .catch(() => setCourseError("Failed to load course. Please go back and try again."))
      .finally(() => setIsLoadingCourse(false));
  }, [courseId]);

  // ── load chapter slides ───────────────────────────────────────────

  const loadChapter = useCallback(async (chapter: IChapter) => {
    setActiveChapter(chapter);
    setSlideIndex(0);
    setSlides([]);
    setChapterMidTestId(null);
    setIsLoadingSlides(true);
    try {
      const res = await getChapterSlides(chapter.id);
      const data = res.data as unknown as { slides?: ISlide[] };
      setSlides(data?.slides ?? []);
    } catch {
      setSlides([]);
    } finally {
      setIsLoadingSlides(false);
    }
    // Fetch mid-test id silently in background (doesn't block slide loading)
    getChapterMidTestId(chapter.id).then(setChapterMidTestId).catch(() => {});
    setOutlineOpen(false);
  }, []);

  // ── mark slide complete ───────────────────────────────────────────

  const markCurrentComplete = useCallback(async () => {
    const slide = slides[slideIndex];
    if (!slide || completedSlideIds.has(slide.id) || markingRef.current) return;
    markingRef.current = true;
    try {
      await markSlideComplete(slide.id);
      setCompletedSlideIds((prev) => new Set(prev).add(slide.id));
    } finally {
      markingRef.current = false;
    }
  }, [slides, slideIndex, completedSlideIds]);

  // ── navigation ────────────────────────────────────────────────────

  const goToSlide = (index: number) => {
    markCurrentComplete();
    setSlideIndex(index);
  };

  const handlePrev = () => {
    if (slideIndex > 0) goToSlide(slideIndex - 1);
  };

  const handleNext = async () => {
    await markCurrentComplete();
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
    }
    // If last slide, mark and stay — chapter mid-test (T4) will appear here later
  };

  // ── derived ───────────────────────────────────────────────────────

  const isChapterDone = (chapter: IChapter): boolean => {
    // A chapter is done if we've tracked at least one slide from it as completed
    // (full check requires per-slide tracking which we do in completedSlideIds)
    return completedSlideIds.has(chapter.id); // placeholder until backend round-trip
  };

  const currentSlide = slides[slideIndex] ?? null;
  const totalSlides = slides.length;
  const completedInChapter = slides.filter((s) => completedSlideIds.has(s.id)).length;
  const chapterProgress = totalSlides > 0 ? Math.round((completedInChapter / totalSlides) * 100) : 0;

  // ── render ────────────────────────────────────────────────────────

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-[#3363AD]" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex flex-col items-center gap-3 min-h-64 justify-center text-sm text-red-500">
        <p>{courseError}</p>
        <Button size="sm" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{courseTitle}</h1>
          {activeChapter && (
            <p className="text-xs text-gray-400 truncate">{activeChapter.title}</p>
          )}
        </div>
        {/* Pre-Test button */}
        <button
          onClick={() => navigate(`/learn/${courseId}/pre-test`)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#3363AD] border border-[#3363AD]/30 hover:bg-[#3363AD]/5 transition-colors flex-shrink-0"
          title="Take Pre-Test"
        >
          <ClipboardList size={14} />
          Pre-Test
        </button>
        {/* Chapter Test button — only shown when active chapter has a mid-test */}
        {chapterMidTestId && activeChapter && (
          <button
            onClick={() =>
              navigate(
                `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(activeChapter.title)}`
              )
            }
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 border border-amber-300 hover:bg-amber-50 transition-colors flex-shrink-0"
            title="Take Chapter Test"
          >
            <ClipboardList size={14} />
            Chapter Test
          </button>
        )}
        {/* Mobile outline toggle */}
        <button
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          onClick={() => setOutlineOpen((o) => !o)}
        >
          {outlineOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — outline */}
        <aside
          className={`
            ${outlineOpen ? "flex" : "hidden"} md:flex
            flex-col w-full md:w-64 flex-shrink-0
            border-r border-gray-200 bg-gray-50
            absolute md:relative inset-0 z-20 md:z-auto
            overflow-y-auto
          `}
        >
          <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200">
            Course Outline
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {sections.map((section) => (
              <div key={section.id}>
                {/* Section header */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    setOpenSectionId((prev) => (prev === section.id ? null : section.id))
                  }
                >
                  <span className="text-left line-clamp-2">{section.title}</span>
                  <ChevronDown
                    size={14}
                    className={`flex-shrink-0 ml-2 transition-transform ${openSectionId === section.id ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Chapter list */}
                {openSectionId === section.id && (
                  <ul className="ml-3 border-l border-gray-200">
                    {(section.chapters ?? []).map((chapter) => {
                      const isActive = activeChapter?.id === chapter.id;
                      return (
                        <li key={chapter.id}>
                          <button
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                              isActive
                                ? "bg-[#3363AD]/10 text-[#3363AD] font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                            onClick={() => loadChapter(chapter)}
                          >
                            {isChapterDone(chapter) ? (
                              <CheckCircle2 size={14} className="flex-shrink-0 text-green-500" />
                            ) : (
                              <Circle size={14} className={`flex-shrink-0 ${isActive ? "text-[#3363AD]" : "text-gray-300"}`} />
                            )}
                            <span className="line-clamp-2">{chapter.title}</span>
                            {isActive && <ChevronRight size={12} className="ml-auto flex-shrink-0" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!activeChapter ? (
            /* No chapter selected yet */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
              <PlayCircle size={48} className="opacity-30" />
              <p className="text-sm text-center">
                Select a chapter from the outline to start learning.
              </p>
            </div>
          ) : isLoadingSlides ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[#3363AD]" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              No slides available for this chapter.
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Progress bar for this chapter */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>
                    Slide {slideIndex + 1} of {totalSlides}
                  </span>
                  <span>{chapterProgress}% done</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3363AD] rounded-full transition-all"
                    style={{ width: `${chapterProgress}%` }}
                  />
                </div>

                {/* Slide dots */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToSlide(i)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                        i === slideIndex
                          ? "bg-[#3363AD] text-white"
                          : completedSlideIds.has(s.id)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                      }`}
                      title={s.note || `Slide ${i + 1}`}
                    >
                      {completedSlideIds.has(s.id) && i !== slideIndex ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <SlideIcon url={s.file} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slide viewer */}
              <div className="flex-1 px-6 py-4">
                {currentSlide && <SlideViewer slide={currentSlide} />}
              </div>

              {/* Navigation */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 sticky bottom-0 bg-white">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={slideIndex === 0}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  Previous
                </Button>

                <span className="text-xs text-gray-400">
                  {slideIndex + 1} / {totalSlides}
                </span>

                {slideIndex === totalSlides - 1 && chapterMidTestId ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(activeChapter?.title ?? "")}`
                      )
                    }
                    className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <ClipboardList size={14} />
                    Chapter Test
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={slideIndex === totalSlides - 1}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseLearner;
