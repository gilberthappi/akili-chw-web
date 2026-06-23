import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { getBackendURL } from '@/config/api.config';
import { formatDate } from '@/utils/formats/formats';

interface AttendanceRecord {
  id: string;
  userId: string | null;
  guestName: string | null;
  joinedAt: string;
  leftAt: string | null;
  durationSec: number | null;
  user?: {
    id: string;
    fullNames: string;
    email: string;
    photo: string | null;
  };
  event?: {
    id: string;
    title: string;
    startAt: string;
  };
}

const formatDuration = (sec: number | null): string => {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

const MeetingAttendance: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', eventId],
    queryFn: async () => {
      const res = await api.get(`/attendance/event/${eventId}`);
      return (res.data?.data ?? []) as AttendanceRecord[];
    },
    enabled: !!eventId,
  });

  const records = data ?? [];

  const eventTitle = records[0]?.event?.title;

  const filtered = records.filter((r) => {
    const name = r.user?.fullNames ?? r.guestName ?? '';
    const email = r.user?.email ?? '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const handleExport = () => {
    const url = `${getBackendURL()}/api/attendance/event/${eventId}/export`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${eventId}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/calender')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meeting Attendance</h1>
            {eventTitle && (
              <p className="text-sm text-gray-500 mt-0.5">{eventTitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#4d81d2] transition-colors flex-shrink-0"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary chips */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <UserGroupIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-gray-700">
              {records.length} attendee{records.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="px-4 py-2 bg-green-50 rounded-lg text-sm font-medium text-green-700">
            {records.filter((r) => r.userId).length} registered
          </div>
          <div className="px-4 py-2 bg-orange-50 rounded-lg text-sm font-medium text-orange-700">
            {records.filter((r) => !r.userId).length} guests
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <UserGroupIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No attendance records</p>
            <p className="text-sm">Records appear after participants join the meeting</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined At</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Left At</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((record) => {
                  const name = record.user?.fullNames ?? record.guestName ?? 'Unknown';
                  const email = record.user?.email;
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {record.user?.photo ? (
                            <img src={record.user.photo} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600">
                                {name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                            {email && <p className="text-xs text-gray-400">{email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.userId ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {record.userId ? 'Registered' : 'Guest'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(record.joinedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.leftAt ? formatDate(record.leftAt) : <span className="text-green-600 font-medium">In meeting</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {formatDuration(record.durationSec)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((record) => {
                const name = record.user?.fullNames ?? record.guestName ?? 'Unknown';
                return (
                  <div key={record.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{name}</p>
                          {record.user?.email && (
                            <p className="text-xs text-gray-400">{record.user.email}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.userId ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {record.userId ? 'Registered' : 'Guest'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 pl-10">
                      <span>In: {formatDate(record.joinedAt)}</span>
                      <span>Duration: {formatDuration(record.durationSec)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingAttendance;
