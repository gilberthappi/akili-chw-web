import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, EyeSlashIcon, TrashIcon, PlayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  getAllRecordings,
  publishRecording,
  unpublishRecording,
  deleteRecording,
  buildRecordingUrl,
  type IMeetingRecording,
} from '@/services/recording.service';

const MeetingRecordings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<IMeetingRecording | null>(null);
  const [previewRecording, setPreviewRecording] = useState<IMeetingRecording | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['recordings-admin'],
    queryFn: async () => {
      const res = await getAllRecordings();
      return res.data ?? [];
    },
  });

  const recordings: IMeetingRecording[] = data ?? [];

  const publishMutation = useMutation({
    mutationFn: publishRecording,
    onSuccess: () => {
      toast.success('Recording published');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
    },
    onError: () => toast.error('Failed to publish recording'),
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishRecording,
    onSuccess: () => {
      toast.success('Recording unpublished');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
    },
    onError: () => toast.error('Failed to unpublish recording'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => {
      toast.success('Recording deleted');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete recording'),
  });

  const filtered = recordings.filter((r) => {
    const matchesSearch =
      (r.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.event?.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user?.fullNames ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && r.isPublished) ||
      (statusFilter === 'draft' && !r.isPublished);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/calender')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Recordings</h1>
            <p className="text-sm text-gray-500">Publish recordings to make them available for trainees</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {recordings.filter((r) => r.isPublished).length} of {recordings.length} published
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by title, meeting, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <PlayIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No recordings found</p>
            <p className="text-sm">Recordings will appear here once meetings are completed</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recording</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Meeting</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded by</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((recording) => (
                <tr key={recording.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PlayIcon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">
                        {recording.title ?? recording.event?.title ?? 'Untitled Recording'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{recording.event?.title ?? '—'}</div>
                    {recording.event?.startAt && (
                      <div className="text-xs text-gray-400">{formatDate(recording.event.startAt)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {recording.user?.photo && (
                        <img
                          src={recording.user.photo}
                          alt={recording.user.fullNames}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-700">{recording.user?.fullNames ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(recording.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        recording.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {recording.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewRecording(recording)}
                        title="Preview"
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          recording.isPublished
                            ? unpublishMutation.mutate(recording.id)
                            : publishMutation.mutate(recording.id)
                        }
                        disabled={publishMutation.isPending || unpublishMutation.isPending}
                        title={recording.isPublished ? 'Unpublish' : 'Publish'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          recording.isPublished
                            ? 'text-green-600 hover:text-orange-500 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {recording.isPublished ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(recording)}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {previewRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {previewRecording.title ?? previewRecording.event?.title ?? 'Recording Preview'}
              </h3>
              <button
                onClick={() => setPreviewRecording(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="bg-black">
              <video
                src={buildRecordingUrl(previewRecording.url)}
                controls
                autoPlay
                className="w-full max-h-[60vh]"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {previewRecording.event?.title ?? 'No meeting linked'} • {formatDate(previewRecording.createdAt)}
              </span>
              <a
                href={buildRecordingUrl(previewRecording.url)}
                download
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#4d81d2] transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Recording?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the recording file and cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRecordings;
