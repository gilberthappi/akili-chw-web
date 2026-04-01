import React, { useState, useMemo } from "react";
import {
  Award,
  Download,
  Filter,
  Search as SearchIcon,
  CheckCircle,
  Share2,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/form/Button";
import { ITraineeCertificate } from "@/types/certificates.d";
import { formatDate } from "@/utils/formats/formats";

// Mock data
const MOCK_CERTIFICATES: ITraineeCertificate[] = [
  {
    id: "cert-001",
    traineeId: "user-123",
    courseId: "course-001",
    courseName: "Advanced React Development",
    certificateNumber: "CHW-2024-001",
    score: 92,
    instructor: {
      id: "inst-001",
      name: "John Doe",
      email: "john@chw.com",
    },
    skills: ["React", "TypeScript", "State Management", "Component Design"],
    status: "active",
    completedDate: "2024-01-15",
    issueDate: "2024-01-15",
    expiryDate: "2026-01-15",
    certificateUrl: "https://certificates.chw.com/cert-001.pdf",
    thumbnailUrl: "https://certificates.chw.com/cert-001-thumb.jpg",
    verified: true,
    duration: "8 weeks",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "cert-002",
    traineeId: "user-123",
    courseId: "course-002",
    courseName: "Full Stack JavaScript Bootcamp",
    certificateNumber: "CHW-2024-002",
    score: 88,
    instructor: {
      id: "inst-002",
      name: "Jane Smith",
      email: "jane@chw.com",
    },
    skills: ["Node.js", "Express", "MongoDB", "REST APIs"],
    status: "active",
    completedDate: "2024-03-20",
    issueDate: "2024-03-20",
    expiryDate: "2026-03-20",
    certificateUrl: "https://certificates.chw.com/cert-002.pdf",
    thumbnailUrl: "https://certificates.chw.com/cert-002-thumb.jpg",
    verified: true,
    duration: "12 weeks",
    createdAt: "2024-03-20",
    updatedAt: "2024-03-20",
  },
  {
    id: "cert-003",
    traineeId: "user-123",
    courseId: "course-003",
    courseName: "Web Design Fundamentals",
    certificateNumber: "CHW-2023-045",
    score: 85,
    instructor: {
      id: "inst-003",
      name: "Mike Johnson",
      email: "mike@chw.com",
    },
    skills: ["CSS", "HTML", "Design Principles", "UX/UI"],
    status: "expired",
    completedDate: "2023-04-10",
    issueDate: "2023-04-10",
    expiryDate: "2024-04-10",
    certificateUrl: "https://certificates.chw.com/cert-003.pdf",
    thumbnailUrl: "https://certificates.chw.com/cert-003-thumb.jpg",
    verified: true,
    duration: "6 weeks",
    createdAt: "2023-04-10",
    updatedAt: "2023-04-10",
  },
  {
    id: "cert-004",
    traineeId: "user-123",
    courseId: "course-004",
    courseName: "Python for Data Science",
    certificateNumber: "CHW-2024-005",
    score: 95,
    instructor: {
      id: "inst-004",
      name: "Sarah Williams",
      email: "sarah@chw.com",
    },
    skills: ["Python", "Pandas", "NumPy", "Data Analysis"],
    status: "active",
    completedDate: "2024-06-01",
    issueDate: "2024-06-01",
    expiryDate: "2026-06-01",
    certificateUrl: "https://certificates.chw.com/cert-004.pdf",
    thumbnailUrl: "https://certificates.chw.com/cert-004-thumb.jpg",
    verified: true,
    duration: "10 weeks",
    createdAt: "2024-06-01",
    updatedAt: "2024-06-01",
  },
  {
    id: "cert-005",
    traineeId: "user-123",
    courseId: "course-005",
    courseName: "Healthcare Communication",
    certificateNumber: "CHW-2024-008",
    score: 90,
    instructor: {
      id: "inst-005",
      name: "Dr. Emily Brown",
      email: "emily@chw.com",
    },
    skills: ["Patient Communication", "Empathy", "Medical Terminology", "Documentation"],
    status: "active",
    completedDate: "2024-07-15",
    issueDate: "2024-07-15",
    expiryDate: "2025-07-15",
    certificateUrl: "https://certificates.chw.com/cert-005.pdf",
    thumbnailUrl: "https://certificates.chw.com/cert-005-thumb.jpg",
    verified: true,
    duration: "5 weeks",
    createdAt: "2024-07-15",
    updatedAt: "2024-07-15",
  },
];

const MyCertificates: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCertificate, setSelectedCertificate] =
    useState<ITraineeCertificate | null>(null);

  const itemsPerPage = 12;

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  // Filter and search certificates
  const filteredCertificates = useMemo(() => {
    return MOCK_CERTIFICATES.filter((cert) => {
      const matchesSearch = cert.courseName
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || cert.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchKeyword, filterStatus]);

  const certificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalCertificates = filteredCertificates.length;
  const totalPages = Math.ceil(totalCertificates / itemsPerPage);

  // Download certificate
  const handleDownload = async (cert: ITraineeCertificate) => {
    try {
      // Mock PDF generation
      const pdfContent = `Certificate of Completion\n\n${cert.courseName}\n\nAchieved by: ${cert.traineeId}\nScore: ${cert.score}%\nInstructor: ${cert.instructor}`;
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cert.courseName}-${cert.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      toast.error("Failed to download certificate");
      console.error(error);
    }
  };

  // Share certificate
  const handleShare = async (cert: ITraineeCertificate) => {
    try {
      // Copy certificate URL to clipboard
      navigator.clipboard.writeText(cert.certificateUrl);
      toast.success("Certificate link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy certificate link");
      console.error(error);
    }
  };

  // Stats
  const activeCertificates = MOCK_CERTIFICATES.filter((c) => c.status === "active").length;
  const expiredCertificates = MOCK_CERTIFICATES.filter((c) => c.status === "expired").length;
  const averageScore =
    MOCK_CERTIFICATES.length > 0
      ? Math.round(MOCK_CERTIFICATES.reduce((sum, c) => sum + c.score, 0) / MOCK_CERTIFICATES.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">View and manage your earned certificates and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{totalCertificates}</p>
            </div>
            <Award className="w-8 h-8 text-blue-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCertificates}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expiredCertificates}</p>
            </div>
            <Clock className="w-8 h-8 text-red-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-amber-600">{averageScore}%</p>
            </div>
            <Star className="w-8 h-8 text-amber-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Certificates
              </label>
                  <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by course name or certificate number"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Certificates</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="space-y-6">
        {certificates.length === 0 ? (
          <div className="text-center py-20">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No certificates found</p>
            <p className="text-gray-500 text-sm mt-2">
              Complete courses to earn certificates
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {(certificates as ITraineeCertificate[]).map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedCertificate(cert)}
                >
                  {/* Certificate Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-400 to-purple-600 overflow-hidden">
                    {cert.thumbnailUrl ? (
                      <img
                        src={cert.thumbnailUrl}
                        alt={cert.courseName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-16 h-16 text-white opacity-30" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cert.status === "active"
                            ? "bg-green-100 text-green-800"
                            : cert.status === "expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {cert.status === "active"
                          ? "Active"
                          : cert.status === "expired"
                          ? "Expired"
                          : "Revoked"}
                      </span>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {cert.courseName}
                    </h3>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(cert.issueDate)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{cert.duration}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Star className="w-4 h-4 mr-2" />
                        <span>Score: {cert.score}%</span>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="border-t pt-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Instructor</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cert.instructor.name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(cert);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(cert);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedCertificate.courseName}</h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-2xl leading-none hover:opacity-75"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Certificate Number</p>
                  <p className="font-mono text-sm font-semibold">
                    {selectedCertificate.certificateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(selectedCertificate.issueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <p className="text-sm font-medium">{selectedCertificate.score}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-medium">{selectedCertificate.duration}</p>
                </div>
              </div>

              {/* Instructor Info */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Instructor</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-900">
                    {selectedCertificate.instructor.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedCertificate.instructor.email}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {selectedCertificate.skills.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Skills Acquired</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCertificate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex gap-3">
                <Button
                  onClick={() => handleDownload(selectedCertificate)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleShare(selectedCertificate)}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
