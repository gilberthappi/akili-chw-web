import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Navigate, useLocation, useParams } from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage";
import AdminLayout from "@/pages/Layout";
import LearningLayout from "@/components/layouts/LearningLayout";
import NotFound from "@/pages/NotFound";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { DashboardV2 } from "@/pages/dashboard/DashboardV2";
import { MyCourses } from "@/pages/dashboard/MyCourses";
import { Messaging } from "@/pages/dashboard/Messaging";
import { MessagingRedesign } from "@/pages/dashboard/MessagingRedesign";
import { Staff } from "@/pages/dashboard/Staff";
import { Feedbacks } from "@/pages/dashboard/Feedbacks";
import Certificates from "@/pages/dashboard/CertificatesManagement";
import MyCertificates from "@/pages/dashboard/MyCertificates";
import CertificateDesignEditor from "@/pages/dashboard/CertificateDesignEditor";
import { Settings } from "@/pages/dashboard/Settings";
import { Analytics } from "@/pages/dashboard/analytics/Analytics";
import { CourseAnalytics } from "@/pages/dashboard/analytics/CourseAnalytics";
import { StudentAnalytics } from "@/pages/dashboard/analytics/StudentAnalytics";
import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { Terms } from "@/pages/auth/Terms";
import CoursesPage from "@/pages/dashboard/Courses";
import CourseAnalysisV2 from "@/pages/dashboard/CourseAnalysisV2";
import NewCoursePage from "@/components/courses/NewCoursePage";
import NewCoursesBuilder from "@/pages/dashboard/NewCoursesBuilder";
import SlideDesignStudio from "@/pages/dashboard/SlideDesignStudio";
import StudentsPage from "@/pages/dashboard/Students";
import TestersPage from "@/pages/dashboard/Testers";
import ChwRegistryPage from "@/pages/dashboard/ChwRegistry";
import DictionaryPage from "@/pages/dashboard/Dictionary";
import DemographicLearnersPage from "@/pages/dashboard/DemographicLearners";
import { StudentDetailsV2 } from "@/components/students/StudentDetailsV2";
import Calendar from "@/pages/dashboard/Calender";
import MeetingRecordings from "@/pages/dashboard/MeetingRecordings";
import WatchRecordings from "@/pages/dashboard/WatchRecordings";
import MeetingAttendance from "@/pages/dashboard/MeetingAttendance";
import MeetingsList from "@/pages/dashboard/MeetingsList";
import Help from "@/pages/dashboard/Help";
import HealthCenters from "@/pages/dashboard/HealthCenters";
import HealthCenterDetail from "@/pages/dashboard/HealthCenterDetail";

import Announcement from "@/pages/dashboard/Announcement";
import NotificationsPage from "@/pages/dashboard/NotificationsPage";
import CourseCatalog from "@/pages/dashboard/CourseCatalog";
import CourseLearner from "@/pages/dashboard/CourseLearner";
import PreTest from "@/pages/dashboard/PreTest";
import MidTest from "@/pages/dashboard/MidTest";
import FinalTestPage from "@/pages/dashboard/FinalTestPage";
import CEHOGroupPage from "@/pages/dashboard/CEHOGroup";
import CEHOGroupInvitePage from "@/pages/dashboard/CEHOGroupInvite";
import AdminCEHOGroupDetailPage from "@/pages/dashboard/AdminCEHOGroupDetail";
import VerifyCertificate from "@/pages/VerifyCertificate";
import IssuedCertificatesPage from "@/pages/dashboard/IssuedCertificatesPage";
import DepartmentFeaturePage from "@/pages/dashboard/DepartmentFeaturePage";
import DocumentsLibrary from "@/pages/dashboard/DocumentsLibrary";
import UserLookupPage from "@/pages/dashboard/UserLookupPage";
import BoardsPage from "@/pages/dashboard/BoardsPage";
import {
  APP_SHELL_ROLES,
  CEHO_ONLY,
  CHW_REGISTRY_ROLES,
  COLLAB_ROLES,
  COURSE_MGMT_ROLES,
  FIELD_LEARNER_ROLES,
  HEALTH_CENTER_ROLES,
  LEARNER_MGMT_ROLES,
  MEETING_ROLES,
  PLATFORM_ADMIN_ROLES,
  STAFF_MGMT_ROLES,
  STAFF_ROLES,
  TESTER_MGMT_ROLES,
} from "@/utils/roles";
import { DEPARTMENT_NAV } from "@/utils/departmentNav";

// Several departments can share one path (e.g. /documents); the router only
// matches the first route, so merge their roles into a single entry.
const NEW_DEPT_FEATURE_ROUTES = Array.from(
  DEPARTMENT_NAV.filter((n) => n.kind === "new")
    .reduce((byPath, item) => {
      const existing = byPath.get(item.path);
      byPath.set(
        item.path,
        existing
          ? { ...existing, roles: Array.from(new Set([...existing.roles, ...item.roles])) }
          : { ...item, roles: [...item.roles] },
      );
      return byPath;
    }, new Map<string, (typeof DEPARTMENT_NAV)[number]>())
    .values(),
);
const WELTEL_USER_LOOKUP_ROLES = [
  "WELTEL_SUPPORT",
  "WELTEL_ADMIN",
  "WELTEL_DEVELOPER",
] as const;
const WELTEL_BOARDS_ROLES = [
  "WELTEL_SUPPORT",
  "WELTEL_ADMIN",
  "WELTEL_DEVELOPER",
  "CIIC_CONTENT_LEAD",
  "CIIC_EDITOR",
  "CIIC_REVIEWER",
] as const;

const LegacyLearnersRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/demographics/learners${search}`} replace />;
};

const LegacyStudentDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/chw/${id}`} replace />;
};

const RoutesProvider = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute allowedRoles={[...APP_SHELL_ROLES]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <DashboardV2 />,
        },
        {
          path: "classic",
          element: <Dashboard />,
        },
        {
          path: "v2",
          element: <Navigate to="/" replace />,
        },
        {
          path: "new",
          element: <Navigate to="/" replace />,
        },
        {
          path: "analytics",
          element: (
            <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
              <Analytics />
            </ProtectedRoute>
          ),
          children: [
            {
              path: "courses",
              element: (
                <ProtectedRoute
                  allowedRoles={[...COURSE_MGMT_ROLES]}
                  allowedIndustries={["SFH", "WELTEL", "RBC", "CIIC_HIN"]}
                >
                  <CourseAnalytics />
                </ProtectedRoute>
              ),
            },
            {
              path: "student",
              element: (
                <ProtectedRoute
                  allowedRoles={[...COURSE_MGMT_ROLES]}
                  allowedIndustries={["SFH", "WELTEL", "RBC", "CIIC_HIN"]}
                >
                  <StudentAnalytics />
                </ProtectedRoute>
              ),
            },
            {
              path: "learners",
              element: <LegacyLearnersRedirect />,
            },
          ],
        },
        {
          path: "courses",
          element: (
            <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
              <CoursesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/:courseId/analysis",
          element: (
            <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
              <CourseAnalysisV2 />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/new",
          element: (
            <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/edit/:id",
          element: (
            <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "messaging",
          element: (
            <ProtectedRoute allowedRoles={[...COLLAB_ROLES]}>
              <Messaging />
            </ProtectedRoute>
          ),
        },
        {
          path: "messaging-redesign",
          element: (
            <ProtectedRoute allowedRoles={[...COLLAB_ROLES]}>
              <MessagingRedesign />
            </ProtectedRoute>
          ),
        },
        {
          path: "my-learning",
          element: (
            <ProtectedRoute allowedRoles={[...FIELD_LEARNER_ROLES]}>
              <MyCourses />
            </ProtectedRoute>
          ),
        },
        {
          path: "course-catalog",
          element: (
            <ProtectedRoute allowedRoles={[...FIELD_LEARNER_ROLES]}>
              <CourseCatalog />
            </ProtectedRoute>
          ),
        },
        {
          path: "chw",
          element: (
            <ProtectedRoute allowedRoles={[...LEARNER_MGMT_ROLES]}>
              <StudentsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "students",
          element: <Navigate to="/chw" replace />,
        },
        {
          path: "students/:id",
          element: <LegacyStudentDetailRedirect />,
        },
        {
          path: "testers",
          element: (
            <ProtectedRoute allowedRoles={[...TESTER_MGMT_ROLES]}>
              <TestersPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "chw-registry",
          element: (
            <ProtectedRoute allowedRoles={[...CHW_REGISTRY_ROLES]}>
              <ChwRegistryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "dictionary",
          element: (
            <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <DictionaryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "glossary",
          element: <Navigate to="/dictionary" replace />,
        },
        {
          path: "demographics/learners",
          element: (
            <ProtectedRoute allowedRoles={[...MEETING_ROLES]}>
              <DemographicLearnersPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "chw/:id",
          element: (
            <ProtectedRoute allowedRoles={[...MEETING_ROLES]}>
              <StudentDetailsV2 />
            </ProtectedRoute>
          ),
        },
        {
          path: "staff",
          element: (
            <ProtectedRoute allowedRoles={[...STAFF_MGMT_ROLES]}>
              <Staff />
            </ProtectedRoute>
          ),
        },
        {
          path: "feedbacks",
          element: (
            <ProtectedRoute allowedRoles={[...LEARNER_MGMT_ROLES]}>
              <Feedbacks />
            </ProtectedRoute>
          ),
        },
        {
          path: "my-certificates",
          element: (
            <ProtectedRoute allowedRoles={[...FIELD_LEARNER_ROLES]}>
              <MyCertificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates",
          element: (
            <ProtectedRoute allowedRoles={[...LEARNER_MGMT_ROLES]}>
              <Certificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates/issued",
          element: (
            <ProtectedRoute allowedRoles={[...LEARNER_MGMT_ROLES]}>
              <IssuedCertificatesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "calender",
          element: <Calendar />,
        },
        {
          path: "recordings",
          element: (
            <ProtectedRoute allowedRoles={[...PLATFORM_ADMIN_ROLES, ...STAFF_ROLES]}>
              <MeetingRecordings />
            </ProtectedRoute>
          ),

        },
        {
          path: "recordings/watch",
          element: (
            <ProtectedRoute allowedRoles={[...FIELD_LEARNER_ROLES]}>
              <WatchRecordings />
            </ProtectedRoute>
          ),
        },
        {
          path: "attendance/:eventId",
          element: (
            <ProtectedRoute allowedRoles={[...MEETING_ROLES]}>
              <MeetingAttendance />
            </ProtectedRoute>
          ),
        },
        {
          path: "meetings",
          element: (
            <ProtectedRoute allowedRoles={[...MEETING_ROLES]}>
              <MeetingsList />
            </ProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: <Settings />,
        },
        {
          path: "help",
          element: <Help />,
        },
        {
          path: "healthCenters",
          element: (
            <ProtectedRoute
              allowedRoles={[...HEALTH_CENTER_ROLES]}
              requireAll={false}
            >
              <HealthCenters />
            </ProtectedRoute>
          ),
        },
        {
          path: "healthCenters/:id",
          element: (
            <ProtectedRoute
              allowedRoles={[...HEALTH_CENTER_ROLES]}
              requireAll={false}
            >
              <HealthCenterDetail />
            </ProtectedRoute>
          ),
        },


        {
          path: "announcement",
          element: <Announcement />,
        },
        {
          path: "notifications",
          element: <NotificationsPage />,
        },
        // Department feature pages (demo data) — role-gated
        ...NEW_DEPT_FEATURE_ROUTES.map((item) => ({
          path: item.path.replace(/^\//, ""),
          element: (
            <ProtectedRoute allowedRoles={[...item.roles]}>
              {item.path === "/documents" ? <DocumentsLibrary /> : <DepartmentFeaturePage />}
            </ProtectedRoute>
          ),
        })),
        {
          path: "user-lookup",
          element: (
            <ProtectedRoute allowedRoles={[...WELTEL_USER_LOOKUP_ROLES]}>
              <UserLookupPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "kanban-board",
          element: (
            <ProtectedRoute allowedRoles={[...WELTEL_BOARDS_ROLES]}>
              <BoardsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "ceho-group",
          element: (
            <ProtectedRoute allowedRoles={[...CEHO_ONLY]}>
              <CEHOGroupPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "ceho-group/invite",
          element: (
            <ProtectedRoute allowedRoles={[...CEHO_ONLY]}>
              <CEHOGroupInvitePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin/ceho-groups",
          element: <Navigate to="/chw" replace />,
        },
        {
          path: "admin/ceho-groups/:id",
          element: (
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <AdminCEHOGroupDetailPage />
            </ProtectedRoute>
          ),
        },
      ],
    },

    // ── Certificate builder (no sidebar, full-screen editor) ─────────
    {
      path: "/certificates/design",
      element: (
        <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
          <div className="h-screen overflow-hidden">
            <CertificateDesignEditor />
          </div>
        </ProtectedRoute>
      ),
    },
    {
      path: "/certificates/design/:id",
      element: (
        <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
          <div className="h-screen overflow-hidden">
            <CertificateDesignEditor />
          </div>
        </ProtectedRoute>
      ),
    },

    // ── Course builder (no sidebar, full-screen editor) ───────────────
    {
      path: "/courses/builder",
      element: (
        <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
          <div className="h-screen overflow-hidden">
            <NewCoursesBuilder />
          </div>
        </ProtectedRoute>
      ),
    },

    // ── Slide Design Studio (Full-screen presentation studio) ─────────
    {
      path: "/courses/slide-studio",
      element: (
        <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
          <SlideDesignStudio />
        </ProtectedRoute>
      ),
    },
    {
      path: "/courses/slide-studio/:id",
      element: (
        <ProtectedRoute allowedRoles={[...COURSE_MGMT_ROLES]}>
          <SlideDesignStudio />
        </ProtectedRoute>
      ),
    },

    // ── Immersive learning layout (no sidebar) ────────────────────────
    {
      element: (
        <ProtectedRoute allowedRoles={[...FIELD_LEARNER_ROLES]}>
          <LearningLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/learn/:courseId",
          element: <CourseLearner />,
        },
        {
          path: "/learn/:courseId/pre-test",
          element: <PreTest />,
        },
        {
          path: "/learn/:courseId/mid-test/:midTestId",
          element: <MidTest />,
        },
        {
          path: "/learn/:courseId/final-test/:testId",
          element: <FinalTestPage mode="finalTest" />,
        },
        {
          path: "/learn/:courseId/final-exam/:testId",
          element: <FinalTestPage mode="finalExam" />,
        },
      ],
    },

    {
      path: "/auth/login",
      element: <Login />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/auth/signup",
      element: <Signup />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/auth/forgot-password",
      element: <ForgotPassword />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/auth/reset-password",
      element: <ResetPassword />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/terms",
      element: <Terms />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/verify/:code",
      element: <VerifyCertificate />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/certificates/verify/:code",
      element: <VerifyCertificate />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/auth",
      element: <Navigate to="/auth/login" replace />,
    },
    {
      path: "*",
      element: <NotFound />,
      errorElement: <ErrorPage />,
    },
  ]);
  return <RouterProvider router={router} />;
};

export default RoutesProvider;
