import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { BookOpen, Users, Star, FileText, Plus, CheckCircle2, Download, Loader2, Sparkles } from "lucide-react";
import { V2KpiCard, V2PageHeader, V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import { V2_BTN_PRIMARY, V2_BTN_SECONDARY, V2_PAGE_CANVAS } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import CourseList from "@/components/courses/CourseList";
import CreateCourseModal from "@/components/courseBuilder/CreateCourseModal";
import { CourseCreationForm } from "@/types/courseBuilder.d";
import { createCourse, exportCoursesToExcel, getAllCoursesNoPagination, getAllCoursesStats } from "@/services/course.service";
import { uploadImage } from "@/services/uploader.api";
import { courseKeys } from "@/utils/constants/queryKeys";
import type { ICourse } from "@/types";

type CreatedCourseDraft = {
  id: string;
  title: string;
  description?: string;
  coverIcon: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type SuperCourseCreateResponse = {
  statusCode: number;
  message: string;
  data?: { course?: CreatedCourseDraft };
};

const CoursesPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCourseBuilderModal, setShowCourseBuilderModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const tabItems: V2TabItem<string>[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
  ];

  const getFilterString = (tabKey: string) => {
    if (tabKey === "published") return "published";
    if (tabKey === "draft") return "draft";
    return "all";
  };

  // Fetch accurate counts from dedicated stats endpoint
  const { data: courseStatsRes } = useQuery({
    queryKey: [...courseKeys.all, "dashboard-stats"],
    queryFn: () => getAllCoursesStats(),
  });

  // Fetch all courses for enrolled / avgRating aggregation
  const { data: allCoursesRes } = useQuery({
    queryKey: [...courseKeys.all, "all-no-pagination"],
    queryFn: () => getAllCoursesNoPagination(),
  });

  const stats = useMemo(() => {
    const total = courseStatsRes?.data?.totalCourses?.value ?? 0;
    const draft = courseStatsRes?.data?.unpublishedCourses?.value ?? 0;
    const published = Math.max(0, total - draft);
    const courses = (allCoursesRes?.data as ICourse[]) ?? [];
    const enrolled = courses.reduce((sum, c) => sum + (c.progresses?.length || 0), 0);
    const avgRating =
      courses.length > 0
        ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
        : 0;
    return { total, published, draft, enrolled, avgRating };
  }, [courseStatsRes, allCoursesRes]);

  const createCourseMutation = useMutation({ mutationFn: createCourse });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (selectedTab === "published") params.append("isPublished", "true");
    else if (selectedTab === "draft") params.append("isPublished", "false");
    if (searchKeyword) params.append("searchq", searchKeyword);
    const qs = params.toString();

    setIsExporting(true);
    try {
      const blob = await exportCoursesToExcel(qs ? `?${qs}` : "");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `courses_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Courses exported");
    } catch {
      toast.error("Failed to export courses");
    } finally {
      setIsExporting(false);
    }
  };

  const uploadCoverIconIfNeeded = async (coverIcon: string): Promise<string> => {
    if (!coverIcon.startsWith("data:image/")) return coverIcon;
    const response = await fetch(coverIcon);
    const blob = await response.blob();
    const ext = blob.type.split("/")[1] || "png";
    const file = new File([blob], `course-icon-${Date.now()}.${ext}`, { type: blob.type });
    const uploadResponse = await uploadImage(file);
    if (!uploadResponse.data?.url) throw new Error("Failed to upload course icon");
    return uploadResponse.data.url;
  };

  const handleCourseBuilderSubmit = async (formData: CourseCreationForm) => {
    try {
      const coverIconUrl = await uploadCoverIconIfNeeded(formData.coverIcon);
      const response = (await createCourseMutation.mutateAsync({
        title: formData.title.trim(),
        shortName: formData.shortName?.trim() || null,
        level: formData.level ?? "BEGINNER",
        description: formData.description.trim(),
        coverIcon: coverIconUrl,
        isPublished: false,
        courseIntro: {
          title: formData.title.trim(),
          summary: formData.description.trim(),
          bannerImage: coverIconUrl,
          thumbnail: coverIconUrl,
        },
        sections: [],
      })) as SuperCourseCreateResponse;

      const createdCourse = response.data?.course;
      if (!createdCourse?.id) throw new Error("Course was created but no course ID was returned");

      await queryClient.invalidateQueries({ queryKey: courseKeys.all });
      setShowCourseBuilderModal(false);
      toast.success("Draft course created");
      navigate("/courses/builder", {
        state: { courseForm: { ...formData, coverIcon: coverIconUrl }, createdCourse },
      });
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create course";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className={V2_PAGE_CANVAS}>
        <V2PageHeader
          title="Courses"
          subtitle="Manage and distribute your learning content"
          actions={
            <>
              <V2Tabs items={tabItems} active={selectedTab} onChange={setSelectedTab} />
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className={V2_BTN_SECONDARY}
                title="Export the courses shown (current tab and search) to Excel"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses/slide-studio")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs transition"
                title="Launch the Unrestricted Slide Canvas Studio"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Slide Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCourseBuilderModal(true)}
                className={V2_BTN_PRIMARY}
              >
                <Plus className="w-4 h-4" />
                New Course
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <V2KpiCard label="Total Courses" value={stats.total} Icon={BookOpen} />
          <V2KpiCard
            label="Published"
            value={stats.published}
            Icon={CheckCircle2}
            accent="text-emerald-600 dark:text-emerald-400"
            sub="Live courses"
          />
          <V2KpiCard
            label="Draft"
            value={stats.draft}
            Icon={FileText}
            accent="text-amber-500 dark:text-amber-400"
            sub="Not published"
          />
          <V2KpiCard label="Total Enrolled" value={stats.enrolled} Icon={Users} sub="Across all courses" />
          <V2KpiCard
            label="Avg. Rating"
            value={stats.total > 0 ? stats.avgRating.toFixed(1) : "—"}
            Icon={Star}
            accent="text-amber-500 dark:text-amber-400"
            sub="Out of 5"
          />
        </div>

        <CourseList
          hideHeader={true}
          filter={getFilterString(selectedTab)}
          onSearchChange={setSearchKeyword}
        />
      </div>

      <CreateCourseModal
        isOpen={showCourseBuilderModal}
        onClose={() => setShowCourseBuilderModal(false)}
        onSubmit={handleCourseBuilderSubmit}
      />
    </>
  );
};
export default CoursesPage;
