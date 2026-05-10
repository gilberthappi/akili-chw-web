import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  GraduationCap,
  BookOpen,
  Trophy,
  Layers,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import TopBar from "@/components/navigation/TopBar";
import { getCourseSectionsWithChapters, getChapterSlides, getChapterMidTestId } from "@/services/course.service";
import { getCourseFinalTestIds } from "@/services/finaltest.service";
import { markSlideComplete, getCourseProgress, getStudentStatistics } from "@/services/progress.service";
import { ISection, IChapter, ISlide } from "@/types";

const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "m4v", "3gp"]);

function detectFileType(url: string): "video" | "pdf" | "image" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "image";
}

const SlideViewer: React.FC<{ slide: ISlide }> = ({ slide }) => {
  const kind = slide.file ? detectFileType(slide.file) : null;

  if (kind === "pdf") {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
        <iframe
          key={slide.id}
          src={slide.file}
          title="Slide PDF"
          className="flex-1 w-full border-0 min-h-0"
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {slide.file ? (
        <>
          {kind === "video" && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-sm" style={{ paddingBottom: "56.25%" }}>
              <video
                key={slide.id}
                src={slide.file}
                controls
                className="absolute inset-0 w-full h-full outline-none"
              />
            </div>
          )}
          {kind === "image" && (
            <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex justify-center shadow-sm">
              <img
                key={slide.id}
                src={slide.file}
                alt={slide.note || "Slide"}
                className="max-w-full object-contain"
                style={{ maxHeight: "70vh" }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center" style={{ minHeight: 200 }}>
          <FileText size={48} className="text-gray-200" />
        </div>
      )}

      {(slide.note || slide.description) && (
        <div className="space-y-2 pb-4">
          {slide.note && (
            <h2 className="text-xl font-semibold text-gray-900">{slide.note}</h2>
          )}
          {slide.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{slide.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

const SlideIcon: React.FC<{ url?: string; size?: number }> = ({ url, size = 14 }) => {
  if (!url) return <Circle size={size} className="text-gray-300" />;
  const kind = detectFileType(url);
  if (kind === "video") return <PlayCircle size={size} className="text-[#3363AD]" />;
  if (kind === "pdf") return <FileText size={size} className="text-orange-500" />;
  return <ImageIcon size={size} className="text-green-500" />;
};

const CourseLearner: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState("");
  const [sections, setSections] = useState<ISection[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<IChapter | null>(null);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completedSlideIds, setCompletedSlideIds] = useState<Set<string>>(new Set());
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [chapterMidTestId, setChapterMidTestId] = useState<string | null>(null);
  const [finalTestId, setFinalTestId] = useState<string | null>(null);
  const [finalExamId, setFinalExamId] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const markingRef = useRef(false);

  const loadChapter = useCallback(async (chapter: IChapter, initialSlideId?: string) => {
    setActiveChapter(chapter);
    setSlideIndex(0);
    setSlides([]);
    setChapterMidTestId(null);
    setIsLoadingSlides(true);
    try {
      const res = await getChapterSlides(chapter.id);
      const data = res.data as unknown as { slides?: ISlide[] };
      const loadedSlides = data?.slides ?? [];
      setSlides(loadedSlides);
      if (initialSlideId) {
        const idx = loadedSlides.findIndex((s) => s.id === initialSlideId);
        if (idx > 0) setSlideIndex(idx);
      }
    } catch {
      setSlides([]);
    } finally {
      setIsLoadingSlides(false);
    }
    getChapterMidTestId(chapter.id).then(setChapterMidTestId).catch(() => {});
    setOutlineOpen(false);
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setIsLoadingCourse(true);
    setCourseError(null);
    getCourseSectionsWithChapters(courseId)
      .then(async (res) => {
        const data = res.data as unknown as { title?: string; sections?: ISection[] };
        setCourseTitle(data?.title ?? "Course");
        const secs: ISection[] = data?.sections ?? [];
        setSections(secs);
        if (secs.length === 0) return;
        try {
          const [stats, progress] = await Promise.all([
            getStudentStatistics(),
            getCourseProgress(courseId),
          ]);
          if (progress) {
            setCompletedSlideIds(new Set(progress.completedSlideIds));
            const doneChapters = progress.chapterProgress
              .filter((cp) => cp.isCompleted)
              .map((cp) => cp.chapterId);
            setCompletedChapterIds(new Set(doneChapters));
          }
          const loc = stats.lastViewedLocation;
          if (loc && loc.courseId === courseId) {
            for (const sec of secs) {
              const ch = sec.chapters?.find((c) => c.id === loc.chapterId);
              if (ch) {
                setOpenSectionId(sec.id);
                loadChapter(ch, loc.slideId);
                return;
              }
            }
          }
        } catch { /* fall through to default */ }
        setOpenSectionId(secs[0].id);
      })
      .catch(() => setCourseError("Failed to load course. Please go back and try again."))
      .finally(() => setIsLoadingCourse(false));
    getCourseFinalTestIds(courseId)
      .then(({ finalTestId: ftId, finalExamId: feId }) => {
        setFinalTestId(ftId);
        setFinalExamId(feId);
      })
      .catch(() => {});
  }, [courseId, loadChapter]);

  const markCurrentComplete = useCallback(async () => {
    const slide = slides[slideIndex];
    if (!slide || completedSlideIds.has(slide.id) || markingRef.current) return;
    markingRef.current = true;
    try {
      await markSlideComplete(slide.id);
      setCompletedSlideIds((prev) => {
        const next = new Set(prev).add(slide.id);
        const allDone = slides.every((s) => next.has(s.id));
        if (allDone && activeChapter) {
          setCompletedChapterIds((prev2) => new Set(prev2).add(activeChapter.id));
        }
        return next;
      });
    } finally {
      markingRef.current = false;
    }
  }, [slides, slideIndex, completedSlideIds, activeChapter]);

  const goToSlide = (index: number) => {
    markCurrentComplete();
    setSlideIndex(index);
  };

  const handlePrev = () => {
    if (slideIndex > 0) goToSlide(slideIndex - 1);
  };

  const handleNext = async () => {
    await markCurrentComplete();
    if (slideIndex < slides.length - 1) setSlideIndex(slideIndex + 1);
  };

  const isChapterDone = (chapter: IChapter) => completedChapterIds.has(chapter.id);

  const currentSlide = slides[slideIndex] ?? null;
  const totalSlides = slides.length;
  const completedInChapter = slides.filter((s) => completedSlideIds.has(s.id)).length;
  const chapterProgress = totalSlides > 0 ? Math.round((completedInChapter / totalSlides) * 100) : 0;

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center flex-1 bg-white">
        <Loader2 size={28} className="animate-spin text-[#3363AD]" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex flex-col items-center gap-3 flex-1 justify-center text-sm text-red-500 p-8">
        <p>{courseError}</p>
        <Button size="sm" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          ${outlineOpen ? "flex" : "hidden"} md:flex
          flex-col w-full md:w-72 flex-shrink-0
          border-r border-gray-100 bg-gray-50
          absolute md:relative inset-0 z-20 md:z-auto
          overflow-hidden
        `}
      >
          {/* ── Brand header ──────────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-r from-primary to-primary/90 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white border-2 border-white/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <img src="/chw.png" alt="eBumenyi" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-white font-semibold text-sm">eBumenyi</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-1">
            {/* Pre-Test */}
            <div className="px-3">
              <button
                onClick={() => { navigate(`/learn/${courseId}/pre-test`); setOutlineOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#3363AD] hover:bg-[#3363AD]/8 border border-[#3363AD]/20 bg-white transition-colors"
              >
                <ClipboardList size={15} className="flex-shrink-0" />
                Pre-Test
              </button>
            </div>

            {/* Course content */}
            <div className="px-3 pt-2">
              <p className="px-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Course Content
              </p>
              {sections.map((section) => (
                <div key={section.id} className="mb-1">
                  <button
                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() =>
                      setOpenSectionId((prev) => (prev === section.id ? null : section.id))
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={12} className="flex-shrink-0 text-gray-400" />
                      <span className="text-left line-clamp-1">{section.title}</span>
                    </div>
                    <ChevronDown
                      size={12}
                      className={`flex-shrink-0 ml-1 transition-transform ${openSectionId === section.id ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openSectionId === section.id && (
                    <div className="ml-1 mt-0.5 space-y-0.5">
                      {(section.chapters ?? []).map((chapter) => {
                        const isActiveChapter = activeChapter?.id === chapter.id;
                        return (
                          <div key={chapter.id}>
                            <button
                              onClick={() => loadChapter(chapter)}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                                isActiveChapter
                                  ? "bg-[#3363AD]/10 text-[#3363AD]"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {isChapterDone(chapter) ? (
                                <CheckCircle2 size={13} className="flex-shrink-0 text-green-500" />
                              ) : (
                                <Circle
                                  size={13}
                                  className={`flex-shrink-0 ${isActiveChapter ? "text-[#3363AD]" : "text-gray-300"}`}
                                />
                              )}
                              <span className="line-clamp-1 font-medium">{chapter.title}</span>
                              {isActiveChapter && <ChevronRight size={11} className="ml-auto flex-shrink-0 text-[#3363AD]" />}
                            </button>

                            {/* Slides under active chapter */}
                            {isActiveChapter && !isLoadingSlides && slides.length > 0 && (
                              <div className="ml-5 border-l-2 border-[#3363AD]/20 pl-2 mt-0.5 space-y-0.5 pb-1">
                                {slides.map((slide, i) => (
                                  <button
                                    key={slide.id}
                                    onClick={() => goToSlide(i)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                                      i === slideIndex
                                        ? "bg-[#3363AD]/10 text-[#3363AD] font-medium"
                                        : completedSlideIds.has(slide.id)
                                        ? "text-green-600 hover:bg-green-50"
                                        : "text-gray-500 hover:bg-gray-100"
                                    }`}
                                  >
                                    <SlideIcon url={slide.file} size={12} />
                                    <span className="line-clamp-1 flex-1">
                                      {slide.note || `Slide ${i + 1}`}
                                    </span>
                                    {completedSlideIds.has(slide.id) && i !== slideIndex && (
                                      <CheckCircle2 size={10} className="flex-shrink-0 text-green-500" />
                                    )}
                                  </button>
                                ))}

                                {/* Chapter Test after slides */}
                                {chapterMidTestId && (
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(chapter.title)}`
                                      )
                                    }
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                                  >
                                    <ClipboardList size={12} className="flex-shrink-0" />
                                    Chapter Test
                                  </button>
                                )}
                              </div>
                            )}

                            {isActiveChapter && isLoadingSlides && (
                              <div className="ml-5 py-2 flex items-center gap-2 text-xs text-gray-400 pl-2">
                                <Loader2 size={11} className="animate-spin" />
                                Loading slides...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final assessments */}
            {(finalTestId || finalExamId) && (
              <div className="px-3 pt-2">
                <p className="px-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Final Assessments
                </p>
                <div className="space-y-1">
                  {finalTestId && (
                    <button
                      onClick={() => { navigate(`/learn/${courseId}/final-test/${finalTestId}`); setOutlineOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 border border-green-200 bg-white transition-colors"
                    >
                      <Trophy size={14} className="flex-shrink-0" />
                      Final Test
                    </button>
                  )}
                  {finalExamId && (
                    <button
                      onClick={() => { navigate(`/learn/${courseId}/final-exam/${finalExamId}`); setOutlineOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50 border border-purple-200 bg-white transition-colors"
                    >
                      <GraduationCap size={14} className="flex-shrink-0" />
                      Final Exam
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
      </aside>

      {/* ── Right column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <TopBar onMenuClick={() => setOutlineOpen((o) => !o)} /> */}

        {/* Course context strip */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 h-10 border-b border-gray-100 bg-gray-50/70">
          <button
            onClick={() => navigate("/my-learning")}
            className="p-1 rounded text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Back to My Learning"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 truncate">{courseTitle}</span>
            {activeChapter && (
              <>
                <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">{activeChapter.title}</span>
              </>
            )}
          </div>
          {totalSlides > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-0.5 flex-shrink-0">
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3363AD] rounded-full transition-all" style={{ width: `${chapterProgress}%` }} />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{chapterProgress}%</span>
            </div>
          )}
          <button
            className="md:hidden p-1 rounded text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            onClick={() => setOutlineOpen((o) => !o)}
          >
            {outlineOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {!activeChapter ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-300 p-8">
              <BookOpen size={56} className="opacity-40" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-500">Select a lesson to begin</p>
                <p className="text-xs text-gray-400">
                  Choose a chapter from the outline on the left
                </p>
              </div>
            </div>
          ) : isLoadingSlides ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[#3363AD]" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              No content available for this chapter.
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Slide progress strip */}
              <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 truncate max-w-xs">
                    {activeChapter.title}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {slideIndex + 1} / {totalSlides}
                  </span>
                </div>
                {/* Segmented progress bar */}
                <div className="flex gap-1 h-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToSlide(i)}
                      className={`flex-1 rounded-full transition-colors ${
                        i === slideIndex
                          ? "bg-[#3363AD]"
                          : completedSlideIds.has(s.id)
                          ? "bg-green-400"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Slide viewer — scrollable */}
              <div className="flex-1 overflow-y-auto">
                {currentSlide && <SlideViewer slide={currentSlide} />}
              </div>

              {/* Navigation bar */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white px-6 py-3 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={slideIndex === 0}
                  className="flex items-center gap-1.5 min-w-[90px]"
                >
                  <ArrowLeft size={14} />
                  Previous
                </Button>

                <span className="text-sm text-gray-400">{slideIndex + 1} of {totalSlides}</span>

                {slideIndex === totalSlides - 1 && chapterMidTestId ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/learn/${courseId}/mid-test/${chapterMidTestId}?chapter=${encodeURIComponent(activeChapter?.title ?? "")}`
                      )
                    }
                    className="flex items-center gap-1.5 min-w-[110px] bg-amber-600 hover:bg-amber-700"
                  >
                    <ClipboardList size={14} />
                    Chapter Test
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={slideIndex === totalSlides - 1}
                    className="flex items-center gap-1.5 min-w-[90px]"
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
