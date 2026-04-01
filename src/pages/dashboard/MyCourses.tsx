import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Download,
  Upload,
  Settings,
} from "lucide-react";
import { User, ICourseFake } from "@/types";
import Modal from "@/components/common/Modal";
// import { getAllCourses } from "@/services/course.service"; // Disabled for now

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<ICourseFake[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null); // For future use

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    
    if (!userData || !token) {
      navigate("/auth/login");
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.clear();
      navigate("/auth/login");
      return;
    }
    
    setIsLoading(false);

    // Fetch courses
    const fetchCourses = async () => {
      // Temporarily disabled backend connection - using mock data
      // try {
      //   const response = await getAllCourses();
      //   setCourses(response.data);
      // } catch {
        // Mock data
        setCourses([
          {
            id: "1",
            creatorId: "1",
            title: "Healthcare Fundamentals",
            rating: 4.8,
            coverImage: "",
            description: "Learn the basics of healthcare",
            isPublished: true,
            category: "Healthcare",
            level: "Beginner",
            duration: 40,
            enrolledCount: 245,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            modules: [],
            students: [],
          },
          {
            id: "2",
            creatorId: "1",
            title: "Advanced Patient Care",
            rating: 4.9,
            coverImage: "",
            description: "Master advanced patient care techniques",
            isPublished: true,
            category: "Healthcare",
            level: "Advanced",
            duration: 60,
            enrolledCount: 187,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            modules: [],
            students: [],
          },
        ]);
      // }
    };

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3363AD] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header with Role-Based Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
            <p className="text-gray-600">
              Manage and organize your training courses
            </p>
          </div>
          
          {/* Create Course - ADMIN or TRAINER only */}
          <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Create Course
            </Button>
          </PermissionGuard>
        </div>

        {/* Stats - Different for each role */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Courses - Visible to all */}
          <Card padding={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#3363AD]/10 rounded-lg flex items-center justify-center">
                <BookOpen className="text-[#3363AD]" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </Card>

          {/* Active Students - ADMIN and TRAINER only */}
          <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
            <Card padding={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">432</p>
                </div>
              </div>
            </Card>
          </PermissionGuard>

          {/* Completion Rate - ADMIN only */}
          <PermissionGuard allowedRoles={["ADMIN"]}>
            <Card padding={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">87%</p>
                </div>
              </div>
            </Card>
          </PermissionGuard>

          {/* My Enrollments - TRAINEE only */}
          <PermissionGuard allowedRoles={["TRAINEE"]}>
            <Card padding={false} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">My Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </Card>
          </PermissionGuard>
        </div>

        {/* Bulk Actions - ADMIN only */}
        <PermissionGuard allowedRoles={["ADMIN"]}>
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Bulk Operations</h3>
                <p className="text-sm text-gray-600">Manage multiple courses at once</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Upload size={16} />
                  Bulk Upload
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Download size={16} />
                  Export Courses
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Settings size={16} />
                  Settings
                </Button>
              </div>
            </div>
          </Card>
        </PermissionGuard>

        {/* Industry-Specific Sections */}
        
        {/* SFH Healthcare Courses */}
        <PermissionGuard allowedIndustries={["SFH"]}>
          <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SFH Healthcare Training</h3>
                <p className="text-sm text-gray-600">Specialized medical and healthcare courses</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Patient Care</p>
                <p className="text-xl font-bold text-gray-900">12 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Medical Ethics</p>
                <p className="text-xl font-bold text-gray-900">8 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Emergency Response</p>
                <p className="text-xl font-bold text-gray-900">5 Courses</p>
              </div>
            </div>
          </Card>
        </PermissionGuard>

        {/* WELTEL Telecom Courses */}
        <PermissionGuard allowedIndustries={["WELTEL"]}>
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WELTEL Telecom Training</h3>
                <p className="text-sm text-gray-600">Telecommunications and network courses</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Network Engineering</p>
                <p className="text-xl font-bold text-gray-900">15 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Customer Service</p>
                <p className="text-xl font-bold text-gray-900">10 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">5G Technology</p>
                <p className="text-xl font-bold text-gray-900">6 Courses</p>
              </div>
            </div>
          </Card>
        </PermissionGuard>

        {/* RBC Banking Courses */}
        <PermissionGuard allowedIndustries={["RBC"]}>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">RBC Banking Training</h3>
                <p className="text-sm text-gray-600">Financial services and compliance courses</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Compliance Training</p>
                <p className="text-xl font-bold text-gray-900">20 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Financial Products</p>
                <p className="text-xl font-bold text-gray-900">14 Courses</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Risk Management</p>
                <p className="text-xl font-bold text-gray-900">9 Courses</p>
              </div>
            </div>
          </Card>
        </PermissionGuard>

        {/* ADMIN Analytics - Across all industries (OR logic) */}
        <PermissionGuard 
          allowedRoles={["ADMIN"]} 
          allowedIndustries={["SFH", "WELTEL", "RBC"]}
          requireAll={false}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Course Analytics</h3>
                <p className="text-sm text-gray-600">Visible to admins from SFH, WELTEL, or RBC</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">$124,500</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Avg. Completion</p>
                <p className="text-xl font-bold text-gray-900">87%</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Active Trainers</p>
                <p className="text-xl font-bold text-gray-900">45</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </Card>
        </PermissionGuard>

        {/* Courses Grid with Permission-Based Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} padding={false} hover>
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-[#3363AD] to-[#2952] rounded-t-lg flex items-center justify-center">
                  <BookOpen className="text-white" size={48} />
                </div>
                <Badge
                  variant={course.isPublished ? "success" : "warning"}
                  size="sm"
                  className="absolute top-3 right-3"
                >
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{course.enrolledCount} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{course.duration}h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-medium text-gray-900">
                      {course.rating}
                    </span>
                  </div>
                  <Badge size="sm">{course.level}</Badge>
                </div>

                {/* Permission-Based Actions */}
                <div className="flex gap-2 pt-2">
                  {/* View - Available to all authenticated users */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-1"
                  >
                    <Eye size={16} />
                    View
                  </Button>
                  
                  {/* Edit - ADMIN or TRAINER only */}
                  <PermissionGuard allowedRoles={["ADMIN", "TRAINER"]}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center justify-center"
                    >
                      <Edit size={16} />
                    </Button>
                  </PermissionGuard>
                  
                  {/* Delete - ADMIN only */}
                  <PermissionGuard allowedRoles={["ADMIN"]}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center justify-center text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </Card>
          ))}
        </div>
     

      {/* Create Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Course"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Create a new training course for your students...
          </p>
          {/* Add form fields here */}
        </div>
      </Modal>
       </div>
  );
};
