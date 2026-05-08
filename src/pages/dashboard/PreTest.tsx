import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  getPreTestByCourseId,
  submitPreTestAttempt,
  IPreTest,
  IPreTestQuestion,
  IAttemptResult,
} from "@/services/pretest.service";

const PreTest: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [preTest, setPreTest] = useState<IPreTest | null>(null);
  const [questions, setQuestions] = useState<IPreTestQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPreTest, setNoPreTest] = useState(false);

  // answers: questionnaireId → Set<optionId>
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IAttemptResult | null>(null);

  const loadPreTest = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPreTestByCourseId(courseId);
      if (!data) {
        setNoPreTest(true);
        return;
      }
      setPreTest(data);
      const qs = data.course?.questionnaires ?? [];
      setQuestions(qs.slice(0, data.questionToBeAnswered));
    } catch {
      setError("Failed to load pre-test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    loadPreTest();
  }, [loadPreTest]);

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
    if (!preTest) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const questionAnswers = questions.map((q) => ({
        questionnaireId: q.id,
        selectedAnswerIds: Array.from(answers[q.id] ?? []),
      }));
      const res = await submitPreTestAttempt(preTest.id, questionAnswers);
      setResult(res);
    } catch {
      setError("Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const courseTitle = preTest?.course?.title ?? "Course";
  const marksToPass = preTest?.marksToPass ?? 0;
  const score = Math.round(result?.marks ?? 0);
  const passed = score >= marksToPass;
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
        <Button size="sm" onClick={loadPreTest}>Retry</Button>
      </div>
    );
  }

  if (noPreTest) {
    return (
      <div className="flex flex-col items-center gap-4 min-h-64 justify-center text-center px-6">
        <FileQuestion size={48} className="text-gray-300" />
        <div>
          <p className="text-sm font-medium text-gray-700">No pre-test for this course</p>
          <p className="text-xs text-gray-400 mt-1">This course doesn't have a pre-test. You can go straight to the lessons.</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/learn/${courseId}`)}>
          Go to Course
        </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Pre-Test Complete</h1>
            <p className="text-sm text-gray-500 mt-1">{courseTitle}</p>
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
              ? `Great work! You scored above the ${marksToPass}% passing mark.`
              : `You scored below the ${marksToPass}% target — but that's OK! This test is just to gauge your starting knowledge. You can still start the course.`}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate(`/learn/${courseId}`)}
          >
            Continue to Course
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Retake Pre-Test
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
          <h1 className="text-lg font-bold text-gray-900">Pre-Test</h1>
          <p className="text-xs text-gray-500 truncate">{courseTitle}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {preTest?.description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          {preTest.description}
        </div>
      )}

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
            {isSubmitting ? "Submitting..." : "Submit Pre-Test"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreTest;
