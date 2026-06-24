import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import { getBackendURL } from '@/config/api.config';

interface UserRoleEntry {
  name: string;
}

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
    gender: string | null;
    district: string | null;
    sector: string | null;
    cell: string | null;
    village: string | null;
    userRoles: UserRoleEntry[];
  };
  event?: {
    id: string;
    title: string;
    startAt: string;
    createdById: string;
  };
}

interface AggregatedAttendee {
  key: string;
  userId: string | null;
  name: string;
  email: string | null;
  photo: string | null;
  role: string;
  gender: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  totalDurationSec: number;
  isGuest: boolean;
  isHost: boolean;
}

const formatDuration = (sec: number): string => {
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

  // Group by user — sum duration for repeat joins within the same meeting.
  // For records where the participant never left (durationSec is null), estimate
  // duration as time elapsed since joinedAt so their time is still counted.
  const attendees = useMemo<AggregatedAttendee[]>(() => {
    const now = Date.now();
    const hostId = records[0]?.event?.createdById ?? null;
    const map = new Map<string, AggregatedAttendee>();
    for (const r of records) {
      const key = r.userId ?? `guest:${r.guestName ?? 'unknown'}`;
      const estimatedDuration = r.durationSec ??
        Math.round((now - new Date(r.joinedAt).getTime()) / 1000);

      if (!map.has(key)) {
        map.set(key, {
          key,
          userId: r.userId,
          name: r.user?.fullNames ?? r.guestName ?? 'Unknown',
          email: r.user?.email ?? null,
          photo: r.user?.photo ?? null,
          role: r.user?.userRoles?.[0]?.name ?? '—',
          gender: r.user?.gender ?? '—',
          district: r.user?.district ?? '—',
          sector: r.user?.sector ?? '—',
          cell: r.user?.cell ?? '—',
          village: r.user?.village ?? '—',
          totalDurationSec: estimatedDuration,
          isGuest: !r.userId,
          isHost: !!r.userId && r.userId === hostId,
        });
      } else {
        map.get(key)!.totalDurationSec += estimatedDuration;
      }
    }
    // Host always first, then registered users, then guests
    return [...map.values()].sort((a, b) => {
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
      if (a.isGuest !== b.isGuest) return a.isGuest ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [records]);

  const registered = attendees.filter((a) => !a.isGuest);
  const guests = attendees.filter((a) => a.isGuest);
  const avgDurationSec =
    attendees.length > 0
      ? Math.round(attendees.reduce((s, a) => s + a.totalDurationSec, 0) / attendees.length)
      : 0;

  const filtered = attendees.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      (a.email ?? '').toLowerCase().includes(term)
    );
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
            {eventTitle && <p className="text-sm text-gray-500 mt-0.5">{eventTitle}</p>}
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

      {/* Stat Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{attendees.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registered.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Registered</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{guests.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Guests</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(avgDurationSec)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg Duration</p>
            </div>
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
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cell</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Village</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((attendee) => (
                  <tr key={attendee.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {attendee.photo ? (
                          <img src={attendee.photo} alt={attendee.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-600">
                              {attendee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900">{attendee.name}</p>
                            {attendee.isHost && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-white">
                                Host
                              </span>
                            )}
                          </div>
                          {attendee.email && <p className="text-xs text-gray-400">{attendee.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        attendee.isGuest
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {attendee.isGuest ? 'Guest' : attendee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {attendee.gender}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{attendee.district}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{attendee.sector}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{attendee.cell}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{attendee.village}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {formatDuration(attendee.totalDurationSec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((attendee) => (
                <div key={attendee.key} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {attendee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{attendee.name}</p>
                        {attendee.email && <p className="text-xs text-gray-400">{attendee.email}</p>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      attendee.isGuest ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {attendee.isGuest ? 'Guest' : attendee.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 pl-10">
                    <span className="capitalize">{attendee.gender}</span>
                    <span>·</span>
                    <span>{attendee.district}</span>
                    <span>·</span>
                    <span>{attendee.sector}</span>
                    <span>·</span>
                    <span>{attendee.cell}</span>
                    <span>·</span>
                    <span>{attendee.village}</span>
                    <span>·</span>
                    <span className="font-medium text-gray-700">{formatDuration(attendee.totalDurationSec)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingAttendance;
