import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Navigate } from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage";
import AdminLayout from "@/pages/Layout";
import LearningLayout from "@/components/layouts/LearningLayout";
import NotFound from "@/pages/NotFound";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { DashboardV2 } from "@/pages/dashboard/DashboardV2";
import { MyCourses } from "@/pages/dashboard/MyCourses";
import { Messaging } from "@/pages/dashboard/Messaging";
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
import NewCoursePage from "@/components/courses/NewCoursePage";
import NewCoursesBuilder from "@/pages/dashboard/NewCoursesBuilder";
import StudentsPage from "@/pages/dashboard/Students";
import DemographicLearnersPage from "@/pages/dashboard/DemographicLearners";
import StudentActivityPage from "@/components/students/StudentActivityPage";
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
import UserLookupPage from "@/pages/dashboard/UserLookupPage";
import BoardsPage from "@/pages/dashboard/BoardsPage";
import {
  APP_SHELL_ROLES,
  CEHO_ONLY,
  COLLAB_ROLES,
  COURSE_MGMT_ROLES,
  FIELD_LEARNER_ROLES,
  HEALTH_CENTER_ROLES,
  LEARNER_MGMT_ROLES,
  MEETING_ROLES,
  PLATFORM_ADMIN_ROLES,
  STAFF_MGMT_ROLES,
  STAFF_ROLES,
} from "@/utils/roles";
import { DEPARTMENT_NAV } from "@/utils/departmentNav";

const NEW_DEPT_FEATURE_ROUTES = DEPARTMENT_NAV.filter((n) => n.kind === "new");
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
            <ProtectedRoute
              allowedRoles={[...COURSE_MGMT_ROLES]}
              allowedIndustries={["SFH", "WELTEL", "RBC", "CIIC_HIN"]}
            >
              <Analytics />
            </ProtectedRoute>
          ),
          children: [
            {
              path: "courses",
              element: <CourseAnalytics />,
            },
            {
              path: "student",
              element: <StudentAnalytics />,
            },
          ],
        },
        {
          path: "courses",
          element: (
            <ProtectedRoute
              allowedRoles={[...COURSE_MGMT_ROLES]}
              allowedIndustries={["SFH", "WELTEL", "RBC", "CIIC_HIN"]}
            >
              <CoursesPage />
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
          path: "students",
          element: (
            <ProtectedRoute allowedRoles={[...LEARNER_MGMT_ROLES]}>
              <StudentsPage />
            </ProtectedRoute>
          ),
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
          path: "students/:id",
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
              <DepartmentFeaturePage />
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
          element: <Navigate to="/students" replace />,
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
