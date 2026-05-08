import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { getMidTestById, submitMidTestAttempt, IMidTestAttemptResult } from "@/services/midtest.service";
import { IMidTest, IQuestionnaire } from "@/types";

const MidTest: React.FC = () => {
  const { courseId, midTestId } = useParams<{ courseId: string; midTestId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterTitle = searchParams.get("chapter") ?? "Chapter";

  const [midTest, setMidTest] = useState<IMidTest | null>(null);
  const [questions, setQuestions] = useState<IQuestionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // answers: questionnaireId → Set<optionId>
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IMidTestAttemptResult | null>(null);

  const loadMidTest = useCallback(async () => {
    if (!midTestId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMidTestById(midTestId);
      if (!data) {
        setError("Mid-test not found.");
        return;
      }
      setMidTest(data);
      const qs = data.questionnaires ?? [];
      setQuestions(qs.slice(0, data.questionToBeAnswered));
    } catch {
      setError("Failed to load mid-test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [midTestId]);

  useEffect(() => {
    loadMidTest();
  }, [loadMidTest]);

  const toggleOption = (questionId: string, optionId: string, allowMultiple: boolean) => {
    setAnswers((prev) => {
      if (!allowMultiple) {
        return { ...prev, [questionId]: new Set([optionId]) };
      }
      const current = new Set(prev[questionId] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        current.add(optionId);
      }
      return { ...prev, [questionId]: new Set(current) };
    });
  };

  const handleSubmit = async () => {
    if (!midTest) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const questionAnswers = questions.map((q) => ({
        questionnaireId: q.id,
        selectedAnswerIds: Array.from(answers[q.id] ?? []),
      }));
      const res = await submitMidTestAttempt(midTest.id, questionAnswers);
      setResult(res);
    } catch {
      setError("Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const marksToPass = midTest?.marksToPass ?? 0;
  const score = Math.round(result?.marks ?? 0);
  const passed = result?.isCompleted ?? false;
  const allAnswered = questions.length > 0 && questions.every((q) => (answers[q.id]?.size ?? 0) > 0);
  const answeredCount = questions.filter((q) => (answers[q.id]?.size ?? 0) > 0).length;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-[#3363AD]" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="flex flex-col items-center gap-3 min-h-64 justify-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" onClick={loadMidTest}>Retry</Button>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="max-w-lg mx-auto py-10 px-4 space-y-6">
        <div className="text-center space-y-5">
          {passed ? (
            <CheckCircle2 size={56} className="mx-auto text-green-500" />
          ) : (
            <XCircle size={56} className="mx-auto text-orange-400" />
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chapter Test Complete</h1>
            <p className="text-sm text-gray-500 mt-1">{chapterTitle}</p>
          </div>

          {/* Score circle */}
          <div className="flex items-center justify-center">
            <div
              className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${
                passed ? "border-green-400" : "border-orange-400"
              } bg-gray-50`}
            >
              <span className={`text-4xl font-bold ${passed ? "text-green-600" : "text-orange-500"}`}>
                {score}%
              </span>
            </div>
          </div>

          <div className={`rounded-lg px-4 py-3 text-sm ${passed ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"}`}>
            {passed
              ? `Great work! You passed with ${score}% (required: ${marksToPass}%).`
              : `You scored ${score}% — the passing mark is ${marksToPass}%. Review the chapter and try again.`}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate(`/learn/${courseId}`)}
          >
            Continue Learning
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Retake Chapter Test
          </Button>
        </div>
      </div>
    );
  }

  // ── Questions screen ──────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/learn/${courseId}`)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">Chapter Test</h1>
          <p className="text-xs text-gray-500 truncate">{chapterTitle}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {midTest?.description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          {midTest.description}
        </div>
      )}

      {/* Passing mark notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
        <ClipboardList size={14} className="flex-shrink-0" />
        Passing mark: <span className="font-semibold">{marksToPass}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3363AD] rounded-full transition-all"
          style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const selected = answers[q.id] ?? new Set<string>();
          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {/* Question */}
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3363AD]/10 text-[#3363AD] text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
                  {q.questionImage && (
                    <img
                      src={q.questionImage}
                      alt=""
                      className="rounded-lg max-h-48 object-contain border border-gray-100"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  {q.allowMultiple && (
                    <p className="text-xs text-gray-400">Select all that apply</p>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-10">
                {q.options.map((opt) => {
                  const isSelected = selected.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(q.id, opt.id, q.allowMultiple)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
                        isSelected
                          ? "border-[#3363AD] bg-[#3363AD]/5 text-[#3363AD] font-medium"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {/* Radio / Checkbox indicator */}
                      <span
                        className={`flex-shrink-0 w-4 h-4 flex items-center justify-center border-2 transition-colors ${
                          q.allowMultiple ? "rounded" : "rounded-full"
                        } ${isSelected ? "border-[#3363AD] bg-[#3363AD]" : "border-gray-300 bg-white"}`}
                      >
                        {isSelected && (
                          <span
                            className={`block bg-white ${q.allowMultiple ? "w-2 h-1.5 border-b-2 border-l-2 -rotate-45 -translate-y-px" : "w-1.5 h-1.5 rounded-full"}`}
                          />
                        )}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {opt.image && (
                        <img
                          src={opt.image}
                          alt=""
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
          {!allAnswered && (
            <p className="text-xs text-gray-400 text-center">
              Answer all {questions.length} questions to submit ({questions.length - answeredCount} remaining)
            </p>
          )}
          <Button
            className="w-full flex items-center justify-center gap-2"
            disabled={!allAnswered || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ClipboardList size={16} />
            )}
            {isSubmitting ? "Submitting..." : "Submit Chapter Test"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MidTest;
