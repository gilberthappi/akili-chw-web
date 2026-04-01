import React, { useState, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { toast } from 'react-hot-toast';

interface Announcement {
  id: number;
  title: string;
  date: string;
  category: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: 'draft' | 'published';
  author: string;
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
}

const Announcement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "New Community Health Training Program Launched",
      date: "2024-12-15",
      category: "Training",
      content: "We're excited to announce the launch of our new Community Health Training Program. This comprehensive program will equip community health workers with essential skills and knowledge.",
      priority: "high",
      status: "published",
      author: "Dr. Marie Claire Uwimana",
      targetAudience: ["CHWs", "Supervisors"],
      createdAt: "2024-12-15T08:00:00Z",
      updatedAt: "2024-12-15T08:00:00Z"
    },
    {
      id: 2,
      title: "System Maintenance Scheduled for December 20th",
      date: "2024-12-10",
      category: "Maintenance",
      content: "The platform will undergo scheduled maintenance on December 20th from 2:00 AM to 4:00 AM EAT. Some services may be temporarily unavailable during this period.",
      priority: "medium",
      status: "published",
      author: "System Admin",
      targetAudience: ["All Users"],
      createdAt: "2024-12-10T08:00:00Z",
      updatedAt: "2024-12-10T08:00:00Z"
    },
    {
      id: 3,
      title: "COVID-19 Vaccination Campaign Update",
      date: "2024-12-08",
      category: "Health Alert",
      content: "The latest round of COVID-19 vaccinations is now available at all participating hospitals. Eligible individuals are encouraged to get vaccinated.",
      priority: "high",
      status: "published",
      author: "Health Ministry",
      targetAudience: ["CHWs", "Public"],
      createdAt: "2024-12-08T08:00:00Z",
      updatedAt: "2024-12-08T08:00:00Z"
    },
    {
      id: 4,
      title: "New Mobile App Features Released",
      date: "2024-12-05",
      category: "Updates",
      content: "We've released several new features in our mobile app, including offline course access and improved notification system. Update your app to access these features.",
      priority: "low",
      status: "draft",
      author: "Development Team",
      targetAudience: ["App Users"],
      createdAt: "2024-12-05T08:00:00Z",
      updatedAt: "2024-12-05T08:00:00Z"
    },
    {
      id: 5,
      title: "Annual Health Conference Registration Open",
      date: "2024-12-01",
      category: "Events",
      content: "Registration is now open for the Annual Community Health Conference scheduled for January 15-17, 2025. Early bird discounts available until December 31st.",
      priority: "medium",
      status: "published",
      author: "Conference Committee",
      targetAudience: ["Healthcare Professionals"],
      createdAt: "2024-12-01T08:00:00Z",
      updatedAt: "2024-12-01T08:00:00Z"
    },
    {
      id: 6,
      title: "Partnership with Local NGOs Announced",
      date: "2024-11-28",
      category: "Partnerships",
      content: "We're proud to announce our new partnership with three local NGOs to expand community health services across rural areas in Rwanda.",
      priority: "low",
      status: "published",
      author: "Partnership Manager",
      targetAudience: ["CHWs", "NGOs"],
      createdAt: "2024-11-28T08:00:00Z",
      updatedAt: "2024-11-28T08:00:00Z"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; announcement: Announcement | null }>({
    isOpen: false,
    announcement: null
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'draft' as 'draft' | 'published',
    targetAudience: [] as string[]
  });

  const categories = ['Training', 'Maintenance', 'Health Alert', 'Updates', 'Events', 'Partnerships'];
  const audienceOptions = ['All Users', 'CHWs', 'Supervisors', 'Healthcare Professionals', 'NGOs', 'Public', 'App Users'];

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           announcement.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || announcement.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [announcements, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'published'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      category: '',
      content: '',
      priority: 'medium',
      status: 'draft',
      targetAudience: []
    });
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      category: announcement.category,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status,
      targetAudience: announcement.targetAudience
    });
    setIsDialogOpen(true);
  };

  const handleSaveAnnouncement = () => {
    if (!formData.title || !formData.category || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();

    if (editingAnnouncement) {
      // Update existing announcement
      setAnnouncements(prev => prev.map(ann =>
        ann.id === editingAnnouncement.id
          ? {
              ...ann,
              ...formData,
              updatedAt: now
            }
          : ann
      ));
      toast.success('Announcement updated successfully');
    } else {
      // Create new announcement
      const newAnnouncement: Announcement = {
        id: Math.max(...announcements.map(a => a.id)) + 1,
        ...formData,
        date: new Date().toISOString().split('T')[0],
        author: 'Admin User', // In real app, get from auth context
        createdAt: now,
        updatedAt: now
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('Announcement created successfully');
    }

    setIsDialogOpen(false);
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    setDeleteConfirm({ isOpen: true, announcement });
  };

  const confirmDelete = () => {
    if (deleteConfirm.announcement) {
      setAnnouncements(prev => prev.filter(ann => ann.id !== deleteConfirm.announcement!.id));
      toast.success('Announcement deleted successfully');
      setDeleteConfirm({ isOpen: false, announcement: null });
    }
  };

  const handleToggleStatus = (id: number) => {
    setAnnouncements(prev => prev.map(ann =>
      ann.id === id
        ? {
            ...ann,
            status: ann.status === 'published' ? 'draft' : 'published',
            updatedAt: new Date().toISOString()
          }
        : ann
    ));
    toast.success('Announcement status updated');
  };

  const handleAudienceChange = (audience: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: checked
        ? [...prev.targetAudience, audience]
        : prev.targetAudience.filter(a => a !== audience)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcement Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and publish announcements for the community</p>
        </div>
        <Button onClick={handleCreateAnnouncement} className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-blue-600">{announcements.length}</div>
            <p className="text-sm text-gray-600">Total Announcements</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {announcements.filter(a => a.status === 'published').length}
            </div>
            <p className="text-sm text-gray-600">Published</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {announcements.filter(a => a.status === 'draft').length}
            </div>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {announcements.filter(a => a.priority === 'high').length}
            </div>
            <p className="text-sm text-gray-600">High Priority</p>
          </div>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                    <Badge className={getStatusColor(announcement.status)}>
                      {announcement.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>{new Date(announcement.date).toLocaleDateString()}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {announcement.category}
                    </span>
                    <span>By {announcement.author}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">{announcement.content}</p>
                  <div className="flex flex-wrap gap-1">
                    {announcement.targetAudience.map(audience => (
                      <Badge key={audience} variant="default" className="text-xs">
                        {audience}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(announcement.id)}
                    className="flex items-center gap-1"
                  >
                    {announcement.status === 'published' ? (
                      <>
                        <EyeSlashIcon className="w-4 h-4" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <EyeIcon className="w-4 h-4" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAnnouncement(announcement)}
                    className="flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAnnouncement(announcement)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No announcements found matching your criteria.</p>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
        big={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter announcement title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter announcement content"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <div className="grid grid-cols-2 gap-2">
              {audienceOptions.map(audience => (
                <label key={audience} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes(audience)}
                    onChange={(e) => handleAudienceChange(audience, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{audience}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnnouncement}>
              {editingAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, announcement: null })}
        title="Delete Announcement"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete "{deleteConfirm.announcement?.title}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ isOpen: false, announcement: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Under Construction Watermark */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <div className="transform rotate-12 bg-red-500 bg-opacity-20 text-red-800 text-4xl font-bold px-8 py-4 rounded-lg border-2 border-red-500 border-opacity-30">
          UNDER CONSTRUCTION
        </div>
      </div>
    </div>
  );
};

export default Announcement;