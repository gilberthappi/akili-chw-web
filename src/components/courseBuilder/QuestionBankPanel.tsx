import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCourseById } from "@/services/course.service";
import {
  createQuestionnaire,
  createOption,
  createAnswer,
  deleteQuestionnaire,
  updateQuestionnaire,
  updateOption,
  deleteOption,
  deleteAnswer,
  checkBulkDuplicates,
} from "@/services/questionnaire.service";
import { IQuestionnaire, ICourse } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OptionDraft {
  id: string;
  serverId?: string; // set for existing options when editing
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

interface ExtendedQuestionnaire extends IQuestionnaire {
  originChapterTitle?: string;
}

export default function QuestionBankPanel({
  courseId,
  midTestId,
  refreshKey,
}: QuestionBankPanelProps) {
  const [questions, setQuestions] = useState<ExtendedQuestionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft());
  const [editingQuestion, setEditingQuestion] = useState<IQuestionnaire | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"all" | "bank" | "midtest">("all");

  // ── JSON Upload & Bulk Import State ──────────────────────────────────────────
  const [modalTab, setModalTab] = useState<"single" | "json">("single");
  const [jsonText, setJsonText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<
    Array<{
      tempId: string;
      question: string;
      allowMultiple: boolean;
      feedbackStatement: string;
      options: Array<{ label: string; isCorrect: boolean }>;
      isDuplicate: boolean;
      existingLocation?: string;
    }>
  >([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  const QUESTIONS_PER_PAGE = 10;

  const effectiveCourseId = courseId ?? "";

  const handleExtractJson = async () => {
    const rawText = jsonText.trim();
    if (!rawText) {
      toast.error("Please paste JSON text or upload a JSON file.");
      return;
    }

    setIsExtracting(true);

    let parsed: any[];
    try {
      parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        toast.error("JSON root must be an array of question objects (e.g. [{...}])");
        setIsExtracting(false);
        return;
      }
    } catch {
      toast.error("Invalid JSON syntax. Please check your JSON structure.");
      setIsExtracting(false);
      return;
    }

    const questionsToExtract: Array<{
      tempId: string;
      question: string;
      allowMultiple: boolean;
      feedbackStatement: string;
      options: Array<{ label: string; isCorrect: boolean }>;
      isDuplicate: boolean;
      existingLocation?: string;
    }> = [];

    const titlesToCheck: string[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || typeof item.question !== "string" || !item.question.trim()) {
        continue;
      }

      const rawOpts = Array.isArray(item.options) ? item.options : [];
      const options = rawOpts
        .filter((o: any) => o && (typeof o === "string" || typeof o.label === "string"))
        .map((o: any) => {
          if (typeof o === "string") {
            return { label: o.trim(), isCorrect: false };
          }
          return {
            label: String(o.label || "").trim(),
            isCorrect: Boolean(o.isCorrect),
          };
        });

      if (options.length < 2) continue; // Skip questions with fewer than 2 options

      const qTitle = item.question.trim();
      titlesToCheck.push(qTitle);

      questionsToExtract.push({
        tempId: `q_${Date.now()}_${i}`,
        question: qTitle,
        allowMultiple: Boolean(item.allowMultiple),
        feedbackStatement: String(item.feedbackStatement || "").trim(),
        options,
        isDuplicate: false,
      });
    }

    if (questionsToExtract.length === 0) {
      toast.error("No valid question objects found in JSON");
      setIsExtracting(false);
      return;
    }

    // Check bulk duplicates via API safely
    try {
      const dupResults = await checkBulkDuplicates(titlesToCheck);
      const dupMap = new Map<string, { isDuplicate: boolean; existingLocation?: string }>();
      dupResults.forEach((r) => {
        dupMap.set(r.question.trim().toLowerCase(), {
          isDuplicate: r.isDuplicate,
          existingLocation: r.existingLocation,
        });
      });

      const updatedExtracted = questionsToExtract.map((item) => {
        const dup = dupMap.get(item.question.trim().toLowerCase());
        return {
          ...item,
          isDuplicate: dup?.isDuplicate ?? false,
          existingLocation: dup?.existingLocation,
        };
      });

      setExtractedQuestions(updatedExtracted);
      toast.success(`Extracted ${updatedExtracted.length} question(s) from JSON`);
    } catch {
      // Fallback if duplicate check fails: show extracted questions without duplicate labels
      setExtractedQuestions(questionsToExtract);
      toast.success(`Extracted ${questionsToExtract.length} question(s) from JSON`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonText(content);
        toast.success(`Loaded file "${file.name}"`);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleJson = () => {
    const sample = [
      {
        question: "What is the main sign of malaria?",
        allowMultiple: false,
        feedbackStatement: "High fever is the primary early symptom.",
        options: [
          { label: "High fever", isCorrect: true },
          { label: "Skin rash", isCorrect: false },
          { label: "Cough", isCorrect: false },
        ],
      },
      {
        question: "Which of these are non-communicable diseases?",
        allowMultiple: true,
        feedbackStatement: "Diabetes and Hypertension are NCDs.",
        options: [
          { label: "Diabetes", isCorrect: true },
          { label: "Hypertension", isCorrect: true },
          { label: "Influenza", isCorrect: false },
        ],
      },
    ];
    setJsonText(JSON.stringify(sample, null, 2));
    toast.success("Sample JSON loaded into textarea");
  };

  const handleRemoveExtractedItem = (tempId: string) => {
    setExtractedQuestions((items) => items.filter((item) => item.tempId !== tempId));
  };

  const handleImportValidQuestions = async () => {
    const validQuestions = extractedQuestions.filter((q) => !q.isDuplicate);
    if (validQuestions.length === 0) {
      toast.error("No valid non-duplicate questions to import");
      return;
    }

    setIsBatchSaving(true);
    let successCount = 0;

    for (const q of validQuestions) {
      try {
        const questionnaire = await createQuestionnaire({
          question: q.question,
          feedbackStatement: q.feedbackStatement || undefined,
          allowMultiple: q.allowMultiple,
          courseId: midTestId ? null : effectiveCourseId,
          midTestId: midTestId ?? null,
        });

        if (questionnaire?.id) {
          for (const opt of q.options) {
            await createOption({
              label: opt.label,
              questionnaireId: questionnaire.id,
            });
            if (opt.isCorrect) {
              await createAnswer({
                label: opt.label,
                questionnaireId: questionnaire.id,
              });
            }
          }
          successCount++;
        }
      } catch (err: any) {
        console.error("Batch save item failed:", err);
      }
    }

    setIsBatchSaving(false);
    setShowAddForm(false);
    setJsonText("");
    setExtractedQuestions([]);
    setModalTab("single");
    fetchQuestions();

    const skippedCount = extractedQuestions.length - validQuestions.length;
    toast.success(
      `Imported ${successCount} question(s) successfully!${
        skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ""
      }`,
    );
  };

  // ── Fetch questions ───────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (!effectiveCourseId) return;
    setLoading(true);
    try {
      const res = await getCourseById(effectiveCourseId);
      const course = res.data as ICourse;

      if (midTestId) {
        let found: ExtendedQuestionnaire[] = [];
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
        const allQuestions: ExtendedQuestionnaire[] = [
          ...(course.questionnaires ?? []),
        ];

        for (const section of course.sections ?? []) {
          for (const chapter of section.chapters ?? []) {
            const midQs = chapter.midTest?.questionnaires ?? [];
            for (const q of midQs) {
              allQuestions.push({
                ...q,
                originChapterTitle:
                  chapter.title ||
                  `Chapter ${chapter.chapterNumber ?? ""}`.trim(),
              });
            }
          }
        }
        setQuestions(allQuestions);
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

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const handleEditClick = (q: IQuestionnaire) => {
    setEditingQuestion(q);
    setDraft({
      question: q.question,
      feedbackStatement: q.feedbackStatement ?? "",
      allowMultiple: q.allowMultiple,
      options: (q.options ?? []).map((opt) => ({
        id: opt.id,
        serverId: opt.id,
        label: opt.label,
        isCorrect: (q.answers ?? []).some(
          (a) => a.label.trim().toLowerCase() === opt.label.trim().toLowerCase()
        ),
      })),
    });
    setShowAddForm(true);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId("");
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

  // ── Save (create or update) ───────────────────────────────────────────────────
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
      if (editingQuestion) {
        // UPDATE flow
        await updateQuestionnaire(editingQuestion.id, {
          question: draft.question.trim(),
          feedbackStatement: draft.feedbackStatement.trim() || undefined,
          allowMultiple: draft.allowMultiple,
        });

        const draftServerIds = new Set(
          filledOptions.filter((o) => o.serverId).map((o) => o.serverId!)
        );
        // Delete options removed from the draft
        await Promise.all(
          (editingQuestion.options ?? [])
            .filter((o) => !draftServerIds.has(o.id))
            .map((o) => deleteOption(o.id))
        );
        // Update existing options / create new ones
        await Promise.all(
          filledOptions.map((opt) =>
            opt.serverId
              ? updateOption(opt.serverId, { label: opt.label.trim(), questionnaireId: editingQuestion.id })
              : createOption({ label: opt.label.trim(), questionnaireId: editingQuestion.id })
          )
        );
        // Delete all old answers and recreate from correct options
        await Promise.all((editingQuestion.answers ?? []).map((a) => deleteAnswer(a.id)));
        await Promise.all(
          correctOptions.map((opt) =>
            createAnswer({ label: opt.label.trim(), questionnaireId: editingQuestion.id })
          )
        );

        toast.success("Question updated");
      } else {
        // CREATE flow
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
      }

      setDraft(emptyDraft());
      setShowAddForm(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch {
      // Error toast is automatically handled by the axios response interceptor in api.ts
    } finally {
      setSaving(false);
    }
  };

  const bankCount = useMemo(
    () => questions.filter((q) => !q.midTestId).length,
    [questions],
  );
  const midTestCount = useMemo(
    () => questions.filter((q) => !!q.midTestId).length,
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    if (midTestId) return questions;
    if (filterTab === "bank") return questions.filter((q) => !q.midTestId);
    if (filterTab === "midtest") return questions.filter((q) => !!q.midTestId);
    return questions;
  }, [questions, filterTab, midTestId]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE),
  );
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      {/* Summary bar — sticky so Add Question button stays visible while scrolling */}
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between py-3 border-b border-gray-200">
        <span className="text-sm text-secondary">
          {loading
            ? "Loading…"
            : midTestId
            ? `${questions.length} question${questions.length !== 1 ? "s" : ""} in test`
            : `${questions.length} questions total (${bankCount} Bank • ${midTestCount} Mid-Tests)`}
        </span>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Category filter tabs — shown when viewing main Question Bank */}
      {!midTestId && !loading && questions.length > 0 && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => {
              setFilterTab("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterTab === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => {
              setFilterTab("bank");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterTab === "bank"
                ? "bg-primary text-white"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            Question Bank ({bankCount})
          </button>
          <button
            onClick={() => {
              setFilterTab("midtest");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterTab === "midtest"
                ? "bg-primary text-white"
                : "bg-gray-100 text-secondary hover:bg-gray-200"
            }`}
          >
            Mid-Tests ({midTestCount})
          </button>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-base text-dark">
                  {editingQuestion ? "Edit Question" : "Add Questions"}
                </h4>
                {!editingQuestion && (
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setModalTab("single")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                        modalTab === "single"
                          ? "bg-white text-primary shadow-sm"
                          : "text-secondary hover:text-dark"
                      }`}
                    >
                      Single Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("json")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                        modalTab === "json"
                          ? "bg-white text-primary shadow-sm"
                          : "text-secondary hover:text-dark"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import JSON
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setDraft(emptyDraft());
                  setEditingQuestion(null);
                  setExtractedQuestions([]);
                  setJsonText("");
                  setModalTab("single");
                }}
                className="text-gray-400 hover:text-dark transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {modalTab === "single" || editingQuestion ? (
                <>
                  <div>
                    <label className="block text-xs text-secondary mb-1">
                      Question <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={draft.question}
                      onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-white"
                      placeholder="Enter your question..."
                      autoFocus
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
                          className="flex-shrink-0 text-primary focus:ring-primary cursor-pointer"
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
                      placeholder="Shown after CHW answers..."
                    />
                  </div>
                </>
              ) : (
                /* JSON IMPORT VIEW */
                <div className="space-y-4">
                  {extractedQuestions.length === 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary font-medium">
                          Upload a .json file or paste raw JSON array
                        </span>
                        <button
                          type="button"
                          onClick={handleLoadSampleJson}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Load Sample JSON
                        </button>
                      </div>

                      {/* File Picker */}
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary/50 cursor-pointer bg-gray-50/50 transition">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-secondary">
                          Click to select .json file
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Accepts array of question objects
                        </span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <div>
                        <textarea
                          rows={8}
                          value={jsonText}
                          onChange={(e) => setJsonText(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                          placeholder={`[\n  {\n    "question": "What is malaria?",\n    "allowMultiple": false,\n    "options": [\n      { "label": "Fever", "isCorrect": true },\n      { "label": "Rash", "isCorrect": false }\n    ]\n  }\n]`}
                        />
                      </div>
                    </>
                  ) : (
                    /* EXTRACTION PREVIEW LIST */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg text-xs">
                        <span className="font-semibold text-dark">
                          Extracted {extractedQuestions.length} questions
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {extractedQuestions.filter((q) => !q.isDuplicate).length} Ready
                          </span>
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {extractedQuestions.filter((q) => q.isDuplicate).length} Duplicates
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {extractedQuestions.map((q, idx) => (
                          <div
                            key={q.tempId}
                            className={`p-3 rounded-lg border text-xs space-y-2 ${
                              q.isDuplicate
                                ? "border-amber-300 bg-amber-50/50"
                                : "border-green-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <p className="font-semibold text-dark">
                                  {idx + 1}. {q.question}
                                </p>
                                {q.isDuplicate ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Already exists in {q.existingLocation} — Will be skipped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-800 bg-green-100 px-2 py-0.5 rounded border border-green-300">
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    Ready to import
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExtractedItem(q.tempId)}
                                className="text-gray-400 hover:text-destructive transition p-0.5"
                                title="Remove from import batch"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="pl-2 space-y-0.5 text-secondary">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-1.5">
                                  {opt.isCorrect ? (
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <span className="w-3 h-3 rounded-full border border-gray-300 inline-block" />
                                  )}
                                  <span className={opt.isCorrect ? "font-medium text-green-800" : ""}>
                                    {opt.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
              {modalTab === "single" || editingQuestion ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editingQuestion ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      editingQuestion ? "Update Question" : "Save Question"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setDraft(emptyDraft());
                      setEditingQuestion(null);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-white text-secondary text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : extractedQuestions.length === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleExtractJson}
                    disabled={isExtracting || !jsonText.trim()}
                    className="flex-1 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-1.5 font-medium"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Extract & Check Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setJsonText("");
                    }}
                    className="px-4 py-2 bg-white text-secondary text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExtractedQuestions([])}
                    disabled={isBatchSaving}
                    className="px-4 py-2 bg-white text-secondary text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Reset / Paste New JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleImportValidQuestions}
                    disabled={
                      isBatchSaving ||
                      extractedQuestions.filter((q) => !q.isDuplicate).length === 0
                    }
                    className="flex-1 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-1.5 font-medium"
                  >
                    {isBatchSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Import {extractedQuestions.filter((q) => !q.isDuplicate).length} Valid Questions
                  </button>
                </>
              )}
            </div>
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
      {!loading && filteredQuestions.length === 0 && !showAddForm && (
        <div className="text-center py-10 text-secondary border-2 border-dashed border-gray-200 rounded-lg">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">
            {questions.length === 0
              ? "No questions yet. Add your first question above."
              : "No questions found for this filter."}
          </p>
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
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-dark">
                    {globalIdx + 1}. {q.question}
                  </p>
                  {(q.midTestId || q.originChapterTitle) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      Mid-Test{q.originChapterTitle ? `: ${q.originChapterTitle}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditClick(q)}
                    className="text-secondary/60 hover:text-primary transition p-0.5"
                    title="Edit question"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="text-destructive/60 hover:text-destructive transition p-0.5 disabled:opacity-50"
                  >
                    {deletingId === q.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-base font-bold text-dark">Delete question?</h3>
            </div>
            <p className="text-sm text-secondary">
              This question will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmDeleteId("")}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-secondary hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-destructive text-white hover:bg-destructive/90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
