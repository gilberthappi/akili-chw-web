import { ChangeEvent, useRef, useState } from "react";
import { ImagePlus, Pin, PinOff, Plus } from "lucide-react";

export interface StudioSlideNode {
  id: string;
  title: string;
}

export interface StudioChapterNode {
  id: string;
  title: string;
  slides: StudioSlideNode[];
}

export interface StudioSectionNode {
  id: string;
  title: string;
  chapters: StudioChapterNode[];
}

interface CourseStudioOutlineProps {
  courseTitle: string;
  shortName: string;
  description: string;
  coverUrl: string;
  sections: StudioSectionNode[];
  activeSlideId: string;
  onCourseTitle: (value: string) => void;
  onShortName: (value: string) => void;
  onDescription: (value: string) => void;
  onCover: (url: string) => void;
  onRenameSection: (sectionId: string, title: string) => void;
  onRenameChapter: (sectionId: string, chapterId: string, title: string) => void;
  onRenameSlide: (slideId: string, title: string) => void;
  onAddSection: () => void;
  onAddChapter: (sectionId: string) => void;
  onAddSlide: (sectionId: string, chapterId: string) => void;
  onSelectSlide: (slideId: string) => void;
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15";

export function CourseStudioOutline({
  courseTitle,
  shortName,
  description,
  coverUrl,
  sections,
  activeSlideId,
  onCourseTitle,
  onShortName,
  onDescription,
  onCover,
  onRenameSection,
  onRenameChapter,
  onRenameSlide,
  onAddSection,
  onAddChapter,
  onAddSlide,
  onSelectSlide,
}: CourseStudioOutlineProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = pinned || hovered || focused;

  const handleCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onCover(URL.createObjectURL(file));
    event.target.value = "";
  };

  return (
    <div
      className={`relative h-full shrink-0 transition-[width] duration-200 ${
        pinned ? "w-[272px]" : "w-3"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
    <aside
      className={`absolute inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        open ? "w-[272px] shadow-lg" : "w-3 overflow-hidden"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-wide text-slate-400 [writing-mode:vertical-rl] ${
          open ? "opacity-0" : "opacity-100"
        }`}
      >
        Course
      </span>
      <div className="border-b border-slate-100 px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Course
          </p>
          <button
            type="button"
            onClick={() => setPinned((current) => !current)}
            aria-pressed={pinned}
            title={pinned ? "Unpin course panel" : "Keep course panel open"}
            className={`rounded-md p-1 transition ${
              pinned
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="mt-2 flex h-16 w-full items-center gap-2 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 text-left hover:border-blue-300 hover:bg-blue-50/40"
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400">
              <ImagePlus className="h-4 w-4" />
            </span>
          )}
          <span className="text-xs font-medium text-slate-600">Cover photo</span>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCover}
        />
        {/* <label className="mt-2 block text-[11px] font-medium text-slate-500">
          Title
          <input
            value={courseTitle}
            onChange={(event) => onCourseTitle(event.target.value)}
            className={`${fieldClass} mt-1`}
          />
        </label> */}
        <label className="mt-2 block text-[11px] font-medium text-slate-500">
          Short name
          <input
            value={shortName}
            onChange={(event) => onShortName(event.target.value)}
            maxLength={40}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="mt-2 block text-[11px] font-medium text-slate-500">
          Description
          <textarea
            value={description}
            onChange={(event) => onDescription(event.target.value)}
            rows={2}
            className={`${fieldClass} mt-1 resize-none`}
          />
        </label>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Outline
        </p>
        <button
          type="button"
          onClick={onAddSection}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
        >
          <Plus className="h-3 w-3" />
          Section
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <input
              value={section.title}
              onChange={(event) => onRenameSection(section.id, event.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
              aria-label={`Section ${sectionIndex + 1} title`}
            />
            <div className="mt-1 space-y-2 border-l border-slate-200 pl-2">
              {section.chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id}>
                  <input
                    value={chapter.title}
                    onChange={(event) =>
                      onRenameChapter(section.id, chapter.id, event.target.value)
                    }
                    className="w-full bg-transparent text-[11px] font-medium text-slate-600 outline-none"
                    aria-label={`Chapter ${chapterIndex + 1} title`}
                  />
                  <div className="mt-1 space-y-1">
                    {chapter.slides.map((slide, slideIndex) => {
                      const selected = slide.id === activeSlideId;
                      return (
                        <div
                          key={slide.id}
                          onClick={() => onSelectSlide(slide.id)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-left ${
                            selected
                              ? "bg-blue-50 ring-1 ring-blue-200"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold ${
                              selected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {slideIndex + 1}
                          </span>
                          <input
                            value={slide.title}
                            onChange={(event) => onRenameSlide(slide.id, event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none"
                            aria-label={`Slide ${slideIndex + 1} title`}
                          />
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onAddSlide(section.id, chapter.id)}
                      className="inline-flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-700"
                    >
                      <Plus className="h-3 w-3" />
                      Slide
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onAddChapter(section.id)}
                className="inline-flex items-center gap-1 px-1 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" />
                Chapter
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
    </div>
  );
}
