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

const RoutesProvider = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute allowedRoles={["ADMIN", "TRAINEE", "TRAINER", "DEVELOPER", "SUPERVISOR", "STAFF"]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: "analytics",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}
              allowedIndustries={["SFH", "WELTEL", "RBC"]}
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
              allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}
              allowedIndustries={["SFH", "WELTEL", "RBC"]}
            >
              <CoursesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/new",
          element: (
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/builder",
          element: (
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}>
              <NewCoursesBuilder />
            </ProtectedRoute>
          ),
        },
        {
          path: "courses/edit/:id",
          element: (
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}>
              <NewCoursePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "messaging",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINEE", "TRAINER","DEVELOPER"]}
              allowedIndustries={["SFH","RBC","WELTEL"]}
            >
              <Messaging />
            </ProtectedRoute>
          ),
        },
          {
          path: "my-learning",
          element: (
            <ProtectedRoute allowedRoles={["TRAINEE", "SUPERVISOR"]}>
              <MyCourses />
            </ProtectedRoute>
          ),
        },
        {
          path: "students",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINER","DEVELOPER"]}
            >
              <StudentsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "students/:id",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINER","DEVELOPER"]}
            >
              <StudentActivityPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "staff",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN","DEVELOPER"]}
            >
              <Staff />
            </ProtectedRoute>
          ),
        },
        {
          path: "feedbacks",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINER","DEVELOPER"]}
            >
              <Feedbacks />
            </ProtectedRoute>
          ),
        },
        {
          path: "my-certificates",
          element: (
            <ProtectedRoute allowedRoles={["TRAINEE", "SUPERVISOR"]}>
              <MyCertificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates",
          element: (
            <ProtectedRoute
              allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}
            >
              <Certificates />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates/design",
          element: (
            <ProtectedRoute
              allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}
            >
              <CertificateDesignEditor />
            </ProtectedRoute>
          ),
        },
        {
          path: "certificates/design/:id",
          element: (
            <ProtectedRoute
              allowedRoles={["TRAINER", "ADMIN", "DEVELOPER"]}
            >
              <CertificateDesignEditor />
            </ProtectedRoute>
          ),
        },
          {
          path: "calender",
          element: <Calendar />,
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
          path: "hospitals",
          element: (
            <ProtectedRoute
              allowedRoles={["ADMIN", "TRAINER", "DEVELOPER"]}
              allowedIndustries={["SFH", "RBC"]}
            >
              <Hospitals />
            </ProtectedRoute>
          ),
        },
        {
          path: "announcement",
          element: <Announcement />,
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

