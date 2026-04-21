import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Navigate } from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage";
import AdminLayout from "@/pages/Layout";
import NotFound from "@/pages/NotFound";
import { Dashboard } from "@/pages/dashboard/Dashboard";
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
import StudentActivityPage from "@/components/students/StudentActivityPage";
import Calendar from "@/pages/dashboard/Calender";
import Help from "@/pages/dashboard/Help";
import Hospitals from "@/pages/dashboard/Hospitals";
import Announcement from "@/pages/dashboard/Announcement";
import Forbidden from "@/pages/Forbidden";

// Convenience role groups — keep in sync with ROLE_PERMISSIONS in permissions.ts
const MANAGEMENT_ROLES  = ["ADMIN", "DEVELOPER"] as const;
const CONTENT_ROLES     = ["ADMIN", "TRAINER", "DEVELOPER"] as const;
const ALL_STAFF_ROLES   = ["ADMIN", "TRAINER", "DEVELOPER", "SUPERVISOR"] as const;
const ALL_ROLES         = ["ADMIN", "TRAINER", "TRAINEE", "DEVELOPER", "SUPERVISOR"] as const;
const MESSAGING_INDUSTRIES = ["SFH", "RBC", "WELTEL"] as const;

const RoutesProvider = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        // ── Dashboard ──────────────────────────────────────────────────────
        {
          index: true,
          element: <Dashboard />,
        },

        // ── Analytics (all staff; TRAINEE blocked) ─────────────────────────
        {
          path: "analytics",
          element: (
            <ProtectedRoute allowedRoles={[...ALL_STAFF_ROLES]}>
              <Analytics />
            </ProtectedRoute>
          ),
          children: [
            { path: "courses",  element: <CourseAnalytics /> },
            { path: "student",  element: <StudentAnalytics /> },
          ],
        },

        // ── Courses ────────────────────────────────────────────────────────
        {
          path: "courses",
          element: <CoursesPage />, // visible to all; create/edit buttons gated in UI
        },
        {
          path: "courses/new",
          element: (
            <ProtectedRoute allowedRoles={[...CONTENT_ROLES]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/edit/:id",
          element: (
            <ProtectedRoute allowedRoles={[...CONTENT_ROLES]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/builder",
          element: (
            <ProtectedRoute allowedRoles={[...CONTENT_ROLES]}>
              <NewCoursesBuilder />
            </ProtectedRoute>
          ),
        },

        // ── My Learning (TRAINEE only) ─────────────────────────────────────
        {
          path: "my-learning",
          element: (
            <ProtectedRoute allowedRoles={["TRAINEE"]}>
              <MyCourses />
            </ProtectedRoute>
          ),
        },

        // ── Students ───────────────────────────────────────────────────────
        {
          path: "students",
          element: (
            <ProtectedRoute allowedRoles={[...ALL_STAFF_ROLES]}>
              <StudentsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "students/:id",
          element: (
            <ProtectedRoute allowedRoles={[...ALL_STAFF_ROLES]}>
              <StudentActivityPage />
            </ProtectedRoute>
          ),
        },

        // ── Staff (admin + developer only) ────────────────────────────────
        {
          path: "staff",
          element: (
            <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]}>
              <Staff />
            </ProtectedRoute>
          ),
        },

        // ── Feedbacks ──────────────────────────────────────────────────────
        {
          path: "feedbacks",
          element: (
            <ProtectedRoute allowedRoles={[...CONTENT_ROLES]}>
              <Feedbacks />
            </ProtectedRoute>
          ),
        },

        // ── Certificates ───────────────────────────────────────────────────
        {
          path: "my-certificates",
          element: (
            <ProtectedRoute allowedRoles={["TRAINEE", "TRAINER", "ADMIN", "DEVELOPER"]}>
              <MyCertificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates",
          element: (
            <ProtectedRoute allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}>
              <Certificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates/design",
          element: (
            <ProtectedRoute allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}>
              <CertificateDesignEditor />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates/design/:id",
          element: (
            <ProtectedRoute allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}>
              <CertificateDesignEditor />
            </ProtectedRoute>
          ),
        },

        // ── Messaging (industry-gated) ─────────────────────────────────────
        {
          path: "messaging",
          element: (
            <ProtectedRoute
              allowedRoles={[...ALL_ROLES]}
              allowedIndustries={[...MESSAGING_INDUSTRIES]}
            >
              <Messaging />
            </ProtectedRoute>
          ),
        },

        // ── Hospitals (all staff + supervisor; TRAINEE blocked) ────────────
        {
          path: "hospitals",
          element: (
            <ProtectedRoute allowedRoles={[...ALL_STAFF_ROLES]}>
              <Hospitals />
            </ProtectedRoute>
          ),
        },

        // ── Announcements (all authenticated) ─────────────────────────────
        {
          path: "announcement",
          element: (
            <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
              <Announcement />
            </ProtectedRoute>
          ),
        },

        // ── Calendar, Settings, Help (all authenticated) ───────────────────
        { path: "calender",  element: <Calendar /> },
        { path: "settings",  element: <Settings /> },
        { path: "help",      element: <Help /> },
      ],
    },

    // ── Auth routes ──────────────────────────────────────────────────────────
    { path: "/auth/login",           element: <Login />,          errorElement: <ErrorPage /> },
    { path: "/auth/signup",          element: <Signup />,         errorElement: <ErrorPage /> },
    { path: "/auth/forgot-password", element: <ForgotPassword />, errorElement: <ErrorPage /> },
    { path: "/auth/reset-password",  element: <ResetPassword />,  errorElement: <ErrorPage /> },
    { path: "/terms",                element: <Terms />,          errorElement: <ErrorPage /> },
    { path: "/auth",                 element: <Navigate to="/auth/login" replace /> },
    { path: "/forbidden",             element: <Forbidden />,      errorElement: <ErrorPage /> },
    { path: "*",                     element: <NotFound />,       errorElement: <ErrorPage /> },
  ]);

  return <RouterProvider router={router} />;
};

export default RoutesProvider;
