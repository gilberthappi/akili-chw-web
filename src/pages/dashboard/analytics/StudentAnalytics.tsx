import React, { useState, useEffect } from "react";
import { Users, TrendingUp, Award, Clock, BookOpen, CheckCircle } from "lucide-react";
import { getStudentAnalytics } from "@/services/analytics.service";
import { IStudentAnalytics } from "@/types";

export const StudentAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<IStudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getStudentAnalytics();
        if (response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch student analytics:', error);
        // Use fallback data in case of error
        setAnalytics({
          totalStudents: { value: 0, trend: { value: 0, direction: 'stable' } },
          activeStudents: { value: 0, trend: { value: 0, direction: 'stable' } },
          avgStudyTime: { value: 0, trend: { value: 0, direction: 'stable' }, unit: 'hours' },
          completionRate: { value: 0, trend: { value: 0, direction: 'stable' }, unit: 'percent' },
          performanceDistribution: {
            excellent: { range: '90-100%', count: 0, percentage: 0 },
            good: { range: '80-89%', count: 0, percentage: 0 },
            average: { range: '70-79%', count: 0, percentage: 0 },
            poor: { range: '60-69%', count: 0, percentage: 0 },
            failing: { range: 'Below 60%', count: 0, percentage: 0 }
          },
          topPerformers: [],
          mostActiveLearners: [],
          recentActivity: [],
          engagementTrends: [],
          activeStudentPercentage: 0,
          averageCoursesPerStudent: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getTrendDisplay = (trend: { value: number; direction: "up" | "down" | "stable" }) => {
    const isPositive = trend.direction === 'up';
    const isNegative = trend.direction === 'down';
    const sign = isPositive ? '+' : isNegative ? '-' : '';
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div className={`text-xs mt-1 ${color}`}>
        {sign}{trend.value}% from last month
      </div>
    );
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3363AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Analytics</h1>
        <p className="text-gray-600">Track student progress, performance, and engagement metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Students</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics?.totalStudents?.value?.toLocaleString() || 0}</div>
          {analytics?.totalStudents && getTrendDisplay(analytics.totalStudents.trend)}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Students</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics?.activeStudents?.value?.toLocaleString() || 0}</div>
          {analytics?.activeStudents && (
            <div className="text-xs text-blue-600 mt-1">
              {analytics?.activeStudentPercentage || 0}% of total
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Study Time</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics?.avgStudyTime?.value?.toFixed(1) || 0}{analytics?.avgStudyTime?.unit === 'hours' ? 'h' : ''}
          </div>
          {analytics?.avgStudyTime && getTrendDisplay(analytics.avgStudyTime.trend)}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Completion Rate</span>
            <CheckCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics?.completionRate?.value?.toFixed(1) || 0}%
          </div>
          {analytics?.completionRate && getTrendDisplay(analytics.completionRate.trend)}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement Trends</h3>
          {analytics?.engagementTrends && analytics.engagementTrends.length > 0 ? (
            <div className="h-64">
              {(() => {
                const maxActivity = Math.max(...analytics.engagementTrends.map(t => t.activity));
                return (
                  <div className="h-full flex items-end justify-between gap-2 px-2">
                    {analytics.engagementTrends.map((trend, index) => {
                      const barHeight = maxActivity > 0 ? (trend.activity / maxActivity) * 200 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center mb-2">
                            <span className="text-xs font-medium text-gray-900 mb-1">
                              {trend.activity}
                            </span>
                            <div
                              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-700 ease-out hover:from-green-700 hover:to-green-500 cursor-pointer shadow-sm"
                              style={{ 
                                height: `${barHeight}px`,
                                minHeight: trend.activity > 0 ? '8px' : '0px'
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 text-center leading-tight">
                            {trend.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No engagement trend data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          {analytics?.performanceDistribution ? (
            <div className="space-y-4">
              {Object.entries(analytics.performanceDistribution).map(([key, item]) => {
                const colorMap: { [key: string]: string } = {
                  excellent: "bg-green-600",
                  good: "bg-blue-600",
                  average: "bg-yellow-600",
                  poor: "bg-orange-600",
                  failing: "bg-red-600"
                };
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.range}</span>
                      <span className="text-sm text-gray-500">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colorMap[key]} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <div className="text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No performance data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {analytics?.topPerformers && analytics.topPerformers.length > 0 ? (
              analytics.topPerformers.slice(0, 5).map((student, index) => (
                <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      {student.completedCourses} completed courses • Avg: {student.avgScore.toFixed(1)}% • {student.certificates} certificates
                    </div>
                    <div className="text-xs text-blue-600">
                      {student.district}, {student.sector}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No top performers data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Most Active Learners
          </h3>
          <div className="space-y-3">
            {analytics?.mostActiveLearners && analytics.mostActiveLearners.length > 0 ? (
              analytics.mostActiveLearners.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">
                      {student.studyHours.toFixed(1)}h study time • {student.activeCourses} active courses
                    </div>
                    <div className="text-xs text-blue-600">
                      {student.district}, {student.sector}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{formatLastActive(student.lastActive)}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No active learners data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Student Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Activity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.studentName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600" title={item.courseName}>
                      <div className="max-w-xs truncate">{item.courseName}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <span>{item.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatLastActive(item.lastActivity)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {item.district}, {item.sector}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No recent activity data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Additional Summary */}
        {analytics && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analytics.averageCoursesPerStudent}</div>
                <div className="text-sm text-gray-600">Average Courses per Student</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analytics.activeStudentPercentage}%</div>
                <div className="text-sm text-gray-600">Student Activity Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;
