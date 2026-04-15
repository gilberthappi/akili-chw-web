import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getCourseById } from "@/services/course.service";
import {
  createQuestionnaire,
  createOption,
  createAnswer,
  deleteQuestionnaire,
} from "@/services/questionnaire.service";
import { IQuestionnaire, ICourse } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OptionDraft {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  question: string;
  feedbackStatement: string;
  allowMultiple: boolean;
  options: OptionDraft[];
}

const emptyDraft = (): QuestionDraft => ({
  question: "",
  feedbackStatement: "",
  allowMultiple: false,
  options: [
    { id: crypto.randomUUID(), label: "", isCorrect: false },
    { id: crypto.randomUUID(), label: "", isCorrect: false },
  ],
});

// ─── Props ──────────────────────────────────────────────────────────────────────

interface QuestionBankPanelProps {
  /** Pass courseId for course-level Question Bank (pre-test, final-test, exam) */
  courseId?: string;
  /** Pass midTestId for chapter mid-test questions */
  midTestId?: string;
  /** Trigger a refresh from outside (e.g. when switching chapters) */
  refreshKey?: string | number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function QuestionBankPanel({
  courseId,
  midTestId,
  refreshKey,
}: QuestionBankPanelProps) {
  const [questions, setQuestions] = useState<IQuestionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft());
  const [currentPage, setCurrentPage] = useState(1);

  const QUESTIONS_PER_PAGE = 10;

  const effectiveCourseId = courseId ?? "";

  // ── Fetch questions ───────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (!effectiveCourseId) return;
    setLoading(true);
    try {
      const res = await getCourseById(effectiveCourseId);
      const course = res.data as ICourse;

      if (midTestId) {
        let found: IQuestionnaire[] = [];
        for (const section of course.sections ?? []) {
          for (const chapter of section.chapters ?? []) {
            if (chapter.midTest?.id === midTestId) {
              found = chapter.midTest.questionnaires ?? [];
              break;
            }
          }
          if (found.length > 0) break;
        }
        setQuestions(found);
      } else {
        setQuestions(course.questionnaires ?? []);
      }
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [effectiveCourseId, midTestId]);

  useEffect(() => {
    fetchQuestions();
    setDraft(emptyDraft());
    setShowAddForm(false);
    setCurrentPage(1);
  }, [fetchQuestions, refreshKey]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteQuestionnaire(id);
      toast.success("Question deleted");
      setQuestions((prev) => {
        const updated = prev.filter((q) => q.id !== id);
        // Clamp page if current page no longer exists after deletion
        const maxPage = Math.max(1, Math.ceil(updated.length / QUESTIONS_PER_PAGE));
        setCurrentPage((p) => Math.min(p, maxPage));
        return updated;
      });
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeletingId("");
    }
  };

  // ── Draft helpers ─────────────────────────────────────────────────────────────
  const updateDraftOption = (optId: string, label: string) => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => (o.id === optId ? { ...o, label } : o)),
    }));
  };

  const toggleOptionCorrect = (optId: string) => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => {
        if (d.allowMultiple) {
          return o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o;
        }
        return { ...o, isCorrect: o.id === optId ? !o.isCorrect : false };
      }),
    }));
  };

  const addOption = () => {
    setDraft((d) => ({
      ...d,
      options: [...d.options, { id: crypto.randomUUID(), label: "", isCorrect: false }],
    }));
  };

  const removeOption = (optId: string) => {
    setDraft((d) => {
      if (d.options.length <= 2) {
        toast.error("At least 2 options are required");
        return d;
      }
      return { ...d, options: d.options.filter((o) => o.id !== optId) };
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    const filledOptions = draft.options.filter((o) => o.label.trim());
    if (filledOptions.length < 2) {
      toast.error("At least 2 options with text are required");
      return;
    }
    const correctOptions = filledOptions.filter((o) => o.isCorrect);
    if (correctOptions.length === 0) {
      toast.error("Mark at least one option as correct");
      return;
    }

    setSaving(true);
    try {
      const questionnaire = await createQuestionnaire({
        question: draft.question.trim(),
        feedbackStatement: draft.feedbackStatement.trim() || undefined,
        allowMultiple: draft.allowMultiple,
        courseId: midTestId ? null : effectiveCourseId,
        midTestId: midTestId ?? null,
      });

      if (!questionnaire?.id) throw new Error("No questionnaire ID returned");

      await Promise.all(
        filledOptions.map((opt) =>
          createOption({ label: opt.label.trim(), questionnaireId: questionnaire.id })
        )
      );

      await Promise.all(
        correctOptions.map((opt) =>
          createAnswer({ label: opt.label.trim(), questionnaireId: questionnaire.id })
        )
      );

      toast.success("Question added");
      setDraft(emptyDraft());
      setShowAddForm(false);
      // Jump to the page where the new question will appear (always the last page)
      const newLastPage = Math.ceil((questions.length + 1) / QUESTIONS_PER_PAGE);
      setCurrentPage(newLastPage);
      fetchQuestions();
    } catch {
      toast.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const paginatedQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-secondary">
          {loading
            ? "Loading…"
            : `${questions.length} question${questions.length !== 1 ? "s" : ""} in bank`}
        </span>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}
      </div>

      {/* Add Question Form — shown at TOP so it's always accessible without scrolling */}
      {showAddForm && (
        <div className="border-2 border-primary/20 rounded-lg p-4 space-y-3 bg-primary/5">
          <h4 className="font-semibold text-sm text-primary">New Question</h4>

          <div>
            <label className="block text-xs text-secondary mb-1">
              Question <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={2}
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-white"
              placeholder="Enter your question..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.allowMultiple}
              onChange={(e) => setDraft((d) => ({ ...d, allowMultiple: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-secondary">Allow multiple correct answers</span>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-secondary font-medium">
                Options <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {draft.allowMultiple ? "Check all correct answers" : "Select one correct answer"}
              </span>
            </div>

            {draft.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type={draft.allowMultiple ? "checkbox" : "radio"}
                  name="correctAnswer"
                  checked={opt.isCorrect}
                  onChange={() => toggleOptionCorrect(opt.id)}
                  className="flex-shrink-0 text-primary focus:ring-primary"
                  title="Mark as correct"
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => updateDraftOption(opt.id, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
                />
                <button
                  onClick={() => removeOption(opt.id)}
                  className="text-gray-400 hover:text-destructive transition flex-shrink-0"
                  title="Remove option"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addOption}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add option
            </button>
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1">
              Feedback Statement <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={draft.feedbackStatement}
              onChange={(e) => setDraft((d) => ({ ...d, feedbackStatement: e.target.value }))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
              placeholder="Shown after student answers..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Question"
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setDraft(emptyDraft());
              }}
              disabled={saving}
              className="px-4 py-2 bg-white text-secondary text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-secondary gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading questions…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && questions.length === 0 && !showAddForm && (
        <div className="text-center py-10 text-secondary border-2 border-dashed border-gray-200 rounded-lg">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No questions yet. Add your first question above.</p>
        </div>
      )}

      {/* Question list (paginated) */}
      {!loading &&
        paginatedQuestions.map((q, idx) => {
          const globalIdx = (currentPage - 1) * QUESTIONS_PER_PAGE + idx;
          return (
            <div
              key={q.id}
              className="border border-gray-200 rounded-lg p-4 space-y-2 bg-page-bg"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-dark">
                  {globalIdx + 1}. {q.question}
                </p>
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deletingId === q.id}
                  className="flex-shrink-0 text-destructive/60 hover:text-destructive transition p-0.5 disabled:opacity-50"
                >
                  {deletingId === q.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="space-y-1 pl-2">
                {(q.options ?? []).map((opt) => {
                  const isCorrect = (q.answers ?? []).some(
                    (a) => a.label.trim().toLowerCase() === opt.label.trim().toLowerCase()
                  );
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0 inline-block" />
                      )}
                      <span
                        className={`text-xs ${
                          isCorrect ? "text-green-700 font-medium" : "text-secondary"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {q.feedbackStatement && (
                <p className="text-xs text-primary italic pl-2">
                  Feedback: {q.feedbackStatement}
                </p>
              )}

              {q.allowMultiple && (
                <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Multiple answers
                </span>
              )}
            </div>
          );
        })}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-xs text-secondary">
            Page {currentPage} of {totalPages} &nbsp;·&nbsp;{" "}
            {(currentPage - 1) * QUESTIONS_PER_PAGE + 1}–
            {Math.min(currentPage * QUESTIONS_PER_PAGE, questions.length)} of {questions.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-300 text-secondary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[2rem] h-8 text-xs font-semibold rounded border transition ${
                  page === currentPage
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-secondary border-gray-300 hover:bg-primary/5"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-300 text-secondary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
