import React, { useState } from "react";
import { Folder, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ICourseStatEntry } from "@/services/progress.service";

interface ProgramCoursesGridV2Props {
  courses?: ICourseStatEntry[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  summaryData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  adoptionData?: any;
}

export const ProgramCoursesGridV2: React.FC<ProgramCoursesGridV2Props> = ({
  courses = [],
  summaryData,
  adoptionData,
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("Recently added");

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const displayList = (courses || []).slice(0, 4).map((c: any, idx: number) => {
    const courseId = c.courseId || c.id || `c_${idx}`;
    const courseTitle = c.title || "Health Training Course";

    // 1. Sections Count (from c.sections array or c.sectionsCount)
    const sectionsCount = Array.isArray(c.sections) ? c.sections.length : (c.sectionsCount || 0);

    // 2. Chapters Count (sum across sections or c.chapters array)
    let chaptersCount = 0;
    if (Array.isArray(c.sections)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.sections.forEach((sec: any) => {
        if (Array.isArray(sec.chapters)) {
          chaptersCount += sec.chapters.length;
        }
      });
    }
    if (chaptersCount === 0) {
      chaptersCount = c.totalChapters || c.chaptersCount || (Array.isArray(c.chapters) ? c.chapters.length : 0);
    }

    // 3. Media Files Count (sum slides across chapters or c.slides or c.mediaFilesCount)
    let mediaFilesCount = 0;
    if (Array.isArray(c.sections)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.sections.forEach((sec: any) => {
        if (Array.isArray(sec.chapters)) {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          sec.chapters.forEach((chap: any) => {
            if (Array.isArray(chap.slides)) {
              mediaFilesCount += chap.slides.length;
            }
          });
        }
      });
    }
    if (mediaFilesCount === 0) {
      mediaFilesCount = c.mediaFilesCount || (Array.isArray(c.slides) ? c.slides.length : 0) || (Array.isArray(c.media) ? c.media.length : 0);
    }

    // 4. Questions Count (sum questionnaires across standalone, preTests, midTests, finalTest, finalExam)
    let questionsCount = Array.isArray(c.questionnaires) ? c.questionnaires.length : (c.questionsCount || 0);
    if (Array.isArray(c.sections)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.sections.forEach((sec: any) => {
        if (Array.isArray(sec.chapters)) {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          sec.chapters.forEach((chap: any) => {
            if (chap.midTest && Array.isArray(chap.midTest.questionnaires)) {
              questionsCount += chap.midTest.questionnaires.length;
            }
          });
        }
      });
    }
    if (Array.isArray(c.preTests)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.preTests.forEach((pt: any) => {
        if (Array.isArray(pt.questionnaires)) questionsCount += pt.questionnaires.length;
      });
    }
    if (Array.isArray(c.finalTest)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.finalTest.forEach((ft: any) => {
        if (Array.isArray(ft.questionnaires)) questionsCount += ft.questionnaires.length;
      });
    }
    if (Array.isArray(c.finalExam)) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      c.finalExam.forEach((fe: any) => {
        if (Array.isArray(fe.questionnaires)) questionsCount += fe.questionnaires.length;
      });
    }

    // 5. Enrollments (true database student enrollments)
    const enrollmentsCount = c.totalEnrollments || c.enrollmentCount || c.studentsCount || (Array.isArray(c.progresses) ? c.progresses.length : 0);

    // 6. Test Attempts (true database test attempts for this course)
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const testScoreMatch = adoptionData?.testScores?.byCourse?.find(
      (ts: any) =>
        ts.courseId === courseId ||
        (ts.courseTitle && courseTitle && (
          ts.courseTitle.toLowerCase() === courseTitle.toLowerCase() ||
          courseTitle.toLowerCase().includes(ts.courseTitle.toLowerCase()) ||
          ts.courseTitle.toLowerCase().includes(courseTitle.toLowerCase())
        ))
    );

    let attemptsCount =
      testScoreMatch?.totalAttempts ||
      (testScoreMatch ? (testScoreMatch.preTest || 0) + (testScoreMatch.midTest || 0) + (testScoreMatch.finalTest || 0) + (testScoreMatch.finalExam || 0) : 0) ||
      c.totalAttempts ||
      c.attemptsCount ||
      c.completedTests ||
      0;

    // 7. Certificates (True database certificates issued per course)
    const rawBreakdown = summaryData?.certification?.byCourse || summaryData?.certification?.byCategory || [];
    let certsCount = c.certificatesEarned || c.certificatesCount || c.certificates || 0;

    if (rawBreakdown.length > 0) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const match = rawBreakdown.find(
        (item: any) =>
          item.courseId === courseId ||
          (item.courseTitle && courseTitle && item.courseTitle.toLowerCase() === courseTitle.toLowerCase())
      );
      if (match) {
        certsCount = Number(match.certificates || match.count || match.value || 0);
      }
    }

    return {
      courseId,
      title: courseTitle,
      chapters: chaptersCount,
      sections: sectionsCount,
      mediaFiles: mediaFilesCount,
      questions: questionsCount,
      enrollments: enrollmentsCount,
      attempts: attemptsCount,
      certificates: certsCount,
    };
  });

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Program Courses ({courses.length > 0 ? courses.length : 14})
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option>Recently added</option>
              <option>Most Enrolled</option>
            </select>
          </div>

          <button
            onClick={() => navigate("/courses")}
            className="px-3.5 py-1 bg-[#3363AD] text-white text-xs font-bold rounded-xl hover:bg-[#284f8a] transition-colors shadow-2xs"
          >
            See All
          </button>
        </div>
      </div>

      {/* Grid of 4 Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {displayList.map((item, idx) => (
          <div
            key={item.courseId || idx}
            onClick={() => navigate(`/courses`)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#3363AD]/30 transition-all cursor-pointer group"
          >
            {/* Title & Icon Header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3363AD] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Folder size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-gray-900 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[#3363AD] transition-colors">
                  {item.title}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-0.5">
                <MoreHorizontal size={15} />
              </button>
            </div>

            {/* Gray Badge Pills Row matching Figma mockup */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.chapters} Chapters
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.sections} Sections
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.mediaFiles} Media files
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.questions} Questions
              </span>
            </div>

            {/* Bottom Footer Stats matching Figma mockup */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
              <span>{item.enrollments} Enrollments</span>
              <span>{item.attempts} test attempts</span>
              <span>{item.certificates} certificates</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
