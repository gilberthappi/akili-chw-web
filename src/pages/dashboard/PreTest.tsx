import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  AlertCircle,
  FileQuestion,
  GraduationCap,
  ListChecks,
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

  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IAttemptResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  const loadPreTest = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPreTestByCourseId(courseId);
      if (!data) { setNoPreTest(true); return; }
      setPreTest(data);
      setQuestions((data.course?.questionnaires ?? []).slice(0, data.questionToBeAnswered));
    } catch {
      setError("Failed to load pre-test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadPreTest(); }, [loadPreTest]);

  const toggleOption = (questionId: string, optionId: string, allowMultiple: boolean) => {
    setAnswers((prev) => {
      if (!allowMultiple) return { ...prev, [questionId]: new Set([optionId]) };
      const current = new Set(prev[questionId] ?? []);
      current.has(optionId) ? current.delete(optionId) : current.add(optionId);
      return { ...prev, [questionId]: current };
    });
  };

  const handleSubmit = async () => {
    if (!preTest) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await submitPreTestAttempt(
        preTest.id,
        questions.map((q) => ({ questionnaireId: q.id, selectedAnswerIds: Array.from(answers[q.id] ?? []) }))
      );
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
  const answeredCount = questions.filter((q) => (answers[q.id]?.size ?? 0) > 0).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const currentQuestion = questions[currentQIndex] ?? null;
  const currentSelected = answers[currentQuestion?.id ?? ""] ?? new Set<string>();

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#3363AD]" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="flex-1 flex flex-col items-center gap-3 justify-center p-8">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" onClick={loadPreTest}>Retry</Button>
      </div>
    );
  }

  if (noPreTest) {
    return (
      <div className="flex-1 flex flex-col items-center gap-4 justify-center text-center px-6">
        <FileQuestion size={52} className="text-gray-200" />
        <div>
          <p className="text-sm font-semibold text-gray-700">No pre-test for this course</p>
          <p className="text-xs text-gray-400 mt-1">Go straight to the lessons.</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/learn/${courseId}`)}>Go to Course</Button>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────

  if (result) {
    if (showReview) {
      return (
        <div className="flex flex-col h-full bg-gray-50">
          <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowReview(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900">Answer Review</h1>
              <p className="text-xs text-gray-400">{courseTitle}</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{questions.length} questions</span>
          </header>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
              {questions.map((q, i) => {
                const correctLabels = new Set((q.answers ?? []).map((a) => a.label.trim().toLowerCase()));
                const hasCorrectData = correctLabels.size > 0;
                const selectedIds = answers[q.id] ?? new Set<string>();
                return (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#3363AD]/10 text-[#3363AD] text-sm font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
                          {q.questionImage && (
                            <img src={q.questionImage} alt="" className="rounded-xl max-h-40 object-contain border border-gray-100"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = hasCorrectData ? correctLabels.has(opt.label.trim().toLowerCase()) : false;
                          const isSelected = selectedIds.has(opt.id);
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm ${
                                hasCorrectData
                                  ? isCorrect && isSelected
                                    ? "border-green-400 bg-green-50 text-gray-900"
                                    : isCorrect && !isSelected
                                  ? "border-green-300 border-dashed bg-green-50/40 text-gray-700"
                                    : !isCorrect && isSelected
                                    ? "border-red-400 bg-red-50 text-gray-900"
                                    : "border-gray-100 bg-gray-50 text-gray-500"
                                  : isSelected
                                  ? "border-[#3363AD] bg-[#3363AD]/5 text-gray-900"
                                  : "border-gray-100 bg-gray-50 text-gray-500"
                              }`}
                            >
                              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                hasCorrectData
                                  ? isCorrect && isSelected ? "bg-green-500 border-green-500 text-white" :
                                    isCorrect ? "bg-green-100 border-green-300 text-green-700" :
                                    isSelected ? "bg-red-500 border-red-500 text-white" :
                                    "border-gray-300 text-gray-400"
                                  : isSelected
                                  ? "bg-[#3363AD] border-[#3363AD] text-white"
                                  : "border-gray-300 text-gray-400"
                              }`}>{letter}</span>
                              <span className="flex-1">{opt.label}</span>
                              {opt.image && <img src={opt.image} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                              {hasCorrectData && isCorrect && isSelected && <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />}
                              {hasCorrectData && isCorrect && !isSelected && <CheckCircle2 size={16} className="flex-shrink-0 text-green-400 opacity-60" />}
                              {hasCorrectData && !isCorrect && isSelected && <XCircle size={16} className="flex-shrink-0 text-red-500" />}
                            </div>
                          );
                        })}
                      </div>
                      {q.feedbackStatement && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                          <span className="font-semibold">Explanation: </span>{q.feedbackStatement}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(`/learn/${courseId}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Pre-Test</h1>
            <p className="text-xs text-gray-400">{courseTitle}</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
            {passed
              ? <CheckCircle2 size={56} className="mx-auto text-green-500" />
              : <XCircle size={56} className="mx-auto text-orange-400" />
            }
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pre-Test Complete</h2>
              <p className="text-sm text-gray-400 mt-1">{courseTitle}</p>
            </div>
            <div className={`w-32 h-32 rounded-full border-8 mx-auto flex flex-col items-center justify-center ${passed ? "border-green-400" : "border-orange-300"}`}>
              <span className={`text-4xl font-bold ${passed ? "text-green-600" : "text-orange-500"}`}>{score}%</span>
            </div>
            <div className={`rounded-xl px-4 py-3 text-sm ${passed ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"}`}>
              {passed
                ? `Great work! You scored above the ${marksToPass}% passing mark.`
                : `You scored below the ${marksToPass}% target — that's OK! This helps gauge your starting knowledge.`}
            </div>
            <div className="space-y-2">
              <Button className="w-full flex items-center justify-center gap-2" onClick={() => navigate(`/learn/${courseId}`)}>
                <GraduationCap size={16} />
                Continue to Course
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setShowReview(true)}>
                <ListChecks size={16} />
                Review Answers
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setResult(null); setAnswers({}); setCurrentQIndex(0); setShowReview(false); }}>
                Retake Pre-Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Questions screen ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/learn/${courseId}`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-gray-900">Pre-Test</h1>
              <p className="text-xs text-gray-400 truncate">{courseTitle}</p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
              {currentQIndex + 1} / {questions.length}
            </span>
          </div>

          {preTest?.description && (
            <div className="mt-3 text-xs text-[#3363AD] bg-[#3363AD]/5 border border-[#3363AD]/20 rounded-lg px-3 py-2">
              {preTest.description}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3363AD] rounded-full transition-all"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-400">
              <span>{answeredCount} answered</span>
              <span>{questions.length - answeredCount} remaining</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
          {/* Question palette */}
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isAnswered = (answers[q.id]?.size ?? 0) > 0;
              const isCurrent = i === currentQIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(i)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-[#3363AD] text-white shadow-sm ring-2 ring-[#3363AD] ring-offset-2"
                      : isAnswered
                      ? "bg-[#3363AD]/10 text-[#3363AD] border border-[#3363AD]/20"
                      : "bg-white text-gray-400 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Active question */}
          {currentQuestion && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#3363AD]/10 text-[#3363AD] text-sm font-bold flex items-center justify-center">
                    {currentQIndex + 1}
                  </span>
                  <div className="space-y-3 flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 leading-snug">
                      {currentQuestion.question}
                    </p>
                    {currentQuestion.questionImage && (
                      <img
                        src={currentQuestion.questionImage}
                        alt=""
                        className="rounded-xl max-h-56 object-contain border border-gray-100"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    {currentQuestion.allowMultiple && (
                      <span className="inline-block text-xs font-medium text-[#3363AD] bg-[#3363AD]/8 rounded-lg px-2.5 py-1">
                        Select all that apply
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = currentSelected.has(opt.id);
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(currentQuestion.id, opt.id, currentQuestion.allowMultiple)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm text-left transition-all ${
                          isSelected
                            ? "border-[#3363AD] bg-[#3363AD]/5 text-gray-900"
                            : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isSelected
                              ? "border-[#3363AD] bg-[#3363AD] text-white"
                              : "border-gray-300 text-gray-400"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1">{opt.label}</span>
                        {opt.image && (
                          <img
                            src={opt.image}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
            disabled={currentQIndex === 0}
            className="flex items-center gap-1.5 min-w-[90px]"
          >
            <ArrowLeft size={14} />
            Previous
          </Button>

          <span className="text-sm text-gray-400">{currentQIndex + 1} of {questions.length}</span>

          {currentQIndex === questions.length - 1 ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="flex items-center gap-1.5 min-w-[120px]"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentQIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1.5 min-w-[90px]"
            >
              Next
              <ChevronRight size={14} />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
      </footer>
    </div>
  );
};

export default PreTest;
