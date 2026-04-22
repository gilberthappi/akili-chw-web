import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Activity,
  BarChart2,
  Building2,
  Shield,
} from "lucide-react";
import { IDashboardStats } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/services/analytics.service";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Use fallback data in case of error
        setStats({
          totalCourses: { value: 0, trend: { value: 0, direction: 'stable' } },
          unpublishedCourses: { value: 0, trend: { value: 0, direction: 'stable' } },
          totalStudents: { value: 0, trend: { value: 0, direction: 'stable' } },
          totalTrainers: { value: 0, trend: { value: 0, direction: 'stable' } },
          totalStaff: { value: 0, trend: { value: 0, direction: 'stable' } },
          activeUsers: { value: 0, trend: { value: 0, direction: 'stable' } },
          completionRate: { value: 0, trend: { value: 0, direction: 'stable' } },
          newEnrollments: 0,
          fiveRecentCourses: [],
          threePopularCourses: [],
          recentActivities: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3363AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.fullNames}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your platform today
          </p>
        </div>

        {/* Stats Grid - Role-based visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ADMIN only - Total Students */}
          <PermissionGuard allowedRoles={["ADMIN"]}>
            <StatCard
              title="Total Students"
              value={stats?.totalStudents?.value || 0}
              icon={<Users size={24} />}
              trend={{ 
                value: stats?.totalStudents?.trend?.value || 0, 
                direction: stats?.totalStudents?.trend?.direction || "stable" 
              }}
              description={`${stats?.newEnrollments || 0} new this month`}
            />
          </PermissionGuard>

          {/* ADMIN and TRAINER - Total Courses */}
          <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
            <StatCard
              title="Total Courses"
              value={stats?.totalCourses?.value || 0}
              icon={<BookOpen size={24} />}
              trend={{ 
                value: stats?.totalCourses?.trend?.value || 0, 
                direction: stats?.totalCourses?.trend?.direction || "stable" 
              }}
            />
          </PermissionGuard>

          {/* ADMIN only - Total Trainers */}
          {/* <PermissionGuard allowedRoles={["ADMIN"]}>
            <StatCard
              title="Total Trainers"
              value={stats?.totalTrainers || 0}
              icon={<Award size={24} />}
              trend={{ value: 3, direction: "up" }}
            />
          </PermissionGuard> */}

          {/* ADMIN only - Total Staff */}
          {/* <PermissionGuard allowedRoles={["ADMIN"]}>
            <StatCard
              title="Total Staff"
              value={stats?.totalStaff || 0}
              icon={<Users size={24} />}
              trend={{ value: 2, direction: "up" }}
            />
          </PermissionGuard> */}

          {/* All roles - Active Users */}
          <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
            <StatCard
              title="Active Users"
              value={stats?.activeUsers?.value || 0}
              icon={<TrendingUp size={24} />}
              trend={{ 
                value: stats?.activeUsers?.trend?.value || 0, 
                direction: stats?.activeUsers?.trend?.direction || "stable" 
              }}
            />
          </PermissionGuard>

          {/* TRAINEE only - My Progress */}
          <PermissionGuard allowedRoles={["TRAINEE"]}>
            <StatCard
              title="My Progress"
              value="65%"
              icon={<Activity size={24} />}
              trend={{ value: 15, direction: "up" }}
              description="3 courses in progress"
            />
          </PermissionGuard>

          {/* ADMIN and TRAINER - Completion Rate */}
          <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
            <StatCard
              title="Completion Rate"
              value={`${stats?.completionRate?.value || 0}%`}
              icon={<Award size={24} />}
              trend={{ 
                value: stats?.completionRate?.trend?.value || 0, 
                direction: stats?.completionRate?.trend?.direction || "stable" 
              }}
            />
          </PermissionGuard>

          {/* TRAINEE only - Certificates Earned */}
          <PermissionGuard allowedRoles={["TRAINEE"]}>
            <StatCard
              title="Certificates"
              value="12"
              icon={<Award size={24} />}
              description="3 pending"
            />
          </PermissionGuard>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - All authenticated users */}
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {stats?.recentActivities?.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#3363AD] text-white flex items-center justify-center font-medium">
                      {activity.userName.split(" ").map((n) => n[0]).join("")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.userName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      activity.type === "completion" ? "success" : "info"
                    }
                    size="sm"
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions - Role-based */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {/* ADMIN and TRAINER only */}
              <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
                <button className="w-full flex items-center gap-3 p-4 bg-[#3363AD] text-white rounded-lg hover:bg-[#2952] hover:text-primary transition-colors">
                  <BookOpen size={20} />
                  <span className="font-medium">Create Course</span>
                </button>
              </PermissionGuard>

              {/* ADMIN only */}
              <PermissionGuard allowedRoles={["ADMIN"]}>
                <button className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users size={20} className="text-[#3363AD]" />
                  <span className="font-medium">Add Student</span>
                </button>
              </PermissionGuard>

              {/* ADMIN and TRAINER */}
              <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
                <button className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart2 size={20} className="text-[#3363AD]" />
                  <span className="font-medium">View Reports</span>
                </button>
              </PermissionGuard>

              {/* TRAINEE only */}
              <PermissionGuard allowedRoles={["TRAINEE"]}>
                <button className="w-full flex items-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <BookOpen size={20} />
                  <span className="font-medium">Browse Courses</span>
                </button>
              </PermissionGuard>

              {/* TRAINEE only */}
              <PermissionGuard allowedRoles={["TRAINEE"]}>
                <button className="w-full flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <CheckCircle size={20} className="text-[#3363AD]" />
                  <span className="font-medium">My Certificates</span>
                </button>
              </PermissionGuard>
            </div>
          </Card>
        </div>

        {/* Combined: ADMIN from specific industries */}
        <PermissionGuard 
          allowedRoles={["ADMIN"]} 
          allowedIndustries={["SFH", "WELTEL", "RBC"]}
          requireAll={false}
        >
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-purple-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">
                Admin Controls
              </h2>
              <Badge variant="info" size="sm">Admin Only</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                <Users className="text-purple-600 mx-auto mb-2" size={24} />
                <p className="font-medium text-sm">User Management</p>
              </button>
              <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                <Building2 className="text-purple-600 mx-auto mb-2" size={24} />
                <p className="font-medium text-sm">Department Settings</p>
              </button>
              <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                <BarChart2 className="text-purple-600 mx-auto mb-2" size={24} />
                <p className="font-medium text-sm">Analytics</p>
              </button>
              <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                <Shield className="text-purple-600 mx-auto mb-2" size={24} />
                <p className="font-medium text-sm">Security</p>
              </button>
            </div>
          </Card>
        </PermissionGuard>

        {/* Popular Courses - ADMIN and TRAINER only */}
        <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.threePopularCourses?.map((course) => (
                <div
                  key={course.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#3363AD] transition-colors cursor-pointer"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-[#3363AD] to-[#2952] rounded-lg mb-3"></div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate" title={course.title}>
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {course.studentsEnrolled} students enrolled
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant={course.status === "active" ? "success" : "info"} size="sm">
                      {course.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{course.rating.toFixed(1)} ★</span>
                  </div>
                </div>
              )) || (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No popular courses available
                </div>
              )}
            </div>
          </Card>
        </PermissionGuard>

        {/* My Learning - TRAINEE only */}
        <PermissionGuard allowedRoles={["TRAINEE"]}>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              My Learning Path
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Introduction to Healthcare
                  </h3>
                  <Badge variant="info" size="sm">In Progress</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-[#3363AD] h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
                <p className="text-sm text-gray-600">65% Complete • 5 modules remaining</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Patient Communication
                  </h3>
                  <Badge variant="success" size="sm">Completed</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
                <p className="text-sm text-gray-600">100% Complete • Certificate earned</p>
              </div>
            </div>
          </Card>
        </PermissionGuard>
      </div>
  );
};
