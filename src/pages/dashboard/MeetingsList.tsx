import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  PieChart,
} from 'lucide-react';
import api from '@/services/api';
import { V2KpiCard, V2KpiSkeleton, V2PageHeader, V2SearchInput } from '@/components/v2/V2Page';
import {
  V2_CARD_SHELL,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_BLUE,
  V2_PILL_GREEN,
  V2_PILL_RED,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from '@/components/dashboard/v2/widgets/admin/v2CardStyles';

interface Meeting {
  id: string;
  title: string;
  meetingType: string;
  host: { id: string; fullNames: string; email: string } | null;
  startAt: string;
  endAt: string | null;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  participantCount: number;
  totalDurationSec: number;
}

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  totalParticipants: number;
  avgDurationSec: number;
  overallAttendancePct: number | null;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', hour12: false });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDuration = (sec: number): string => {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const STATUS_STYLE: Record<string, string> = {
  UPCOMING:  V2_PILL_BLUE,
  COMPLETED: V2_PILL_GREEN,
  CANCELLED: V2_PILL_RED,
};

const PAGE_BTN =
  'rounded-lg border text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const PAGE_BTN_IDLE =
  'border-[#B8CDE0] dark:border-slate-600 text-[#5B6575] dark:text-slate-300 hover:bg-[#EBF0F9] dark:hover:bg-slate-700';

const PAGE_SIZE = 15;

const MeetingsList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings-list'],
    queryFn: async () => {
      const res = await api.get('/attendance/meetings');
      return res.data?.data as { meetings: Meeting[]; stats: Stats };
    },
  });

  const meetings = data?.meetings ?? [];
  const stats = data?.stats;

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.host?.fullNames ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statCards = stats
    ? [
        { label: 'Total',              value: stats.total,            Icon: CalendarDays,  accent: undefined },
        { label: 'Upcoming',           value: stats.upcoming,         Icon: CalendarClock, accent: 'text-sky-600 dark:text-sky-400' },
        { label: 'Completed',          value: stats.completed,        Icon: CheckCircle2,  accent: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Cancelled',          value: stats.cancelled,        Icon: XCircle,       accent: 'text-red-500 dark:text-red-400' },
        { label: 'Participants',       value: stats.totalParticipants, Icon: Users,        accent: 'text-purple-600 dark:text-purple-400' },
        { label: 'Avg Duration',       value: formatDuration(stats.avgDurationSec), Icon: Clock, accent: 'text-orange-500 dark:text-orange-400' },
        { label: 'Attendance',         value: stats.overallAttendancePct !== null ? `${stats.overallAttendancePct}%` : '—', Icon: PieChart, accent: 'text-teal-600 dark:text-teal-400' },
      ]
    : [];

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader title="Meetings" subtitle="All my virtual meetings" />

      {/* Stat Cards */}
      {isLoading ? (
        <V2KpiSkeleton count={7} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4" />
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {statCards.map(({ label, value, Icon, accent }) => (
            <V2KpiCard key={label} label={label} value={value} Icon={Icon} accent={accent} />
          ))}
        </div>
      )}

      <V2SearchInput
        className="max-w-md w-full"
        placeholder="Search by title or host..."
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
      />

      {/* Table */}
      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#3363AD] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 ${V2_MUTED}`}>
            <CalendarDays className="w-12 h-12 mb-3 text-[#3363AD]/40" />
            <p className={`font-bold ${V2_STRONG}`}>No meetings found</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className={`${V2_TABLE_HEAD} text-left`}>
                  {['Title', 'Host', 'Date', 'Start Time', 'End Time', 'Status', 'Participants'].map((h) => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${V2_TABLE_BODY} text-sm ${V2_MUTED}`}>
                {paginated.map((m) => (
                  <tr key={m.id} className={V2_TABLE_ROW}>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-bold ${V2_STRONG}`}>{m.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${V2_STRONG}`}>{m.host?.fullNames ?? '—'}</p>
                      {m.host?.email && <p className="text-xs text-[#9AA3B2]">{m.host.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">{formatDate(m.startAt)}</td>
                    <td className="px-6 py-4 text-xs tabular-nums">{formatTime(m.startAt)}</td>
                    <td className="px-6 py-4 text-xs tabular-nums">{m.endAt ? formatTime(m.endAt) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`${V2_PILL} ${STATUS_STYLE[m.status]}`}>
                        {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/attendance/${m.id}`)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          m.participantCount > 0
                            ? 'bg-[#3363AD] text-white hover:bg-[#2B5493]'
                            : 'bg-slate-100 dark:bg-slate-700 text-[#9AA3B2] cursor-default'
                        }`}
                        disabled={m.participantCount === 0}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {m.participantCount}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className={`sm:hidden ${V2_TABLE_BODY}`}>
              {paginated.map((m) => (
                <div key={m.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-bold ${V2_STRONG}`}>{m.title}</p>
                      <p className={`text-xs ${V2_MUTED}`}>{m.host?.fullNames ?? '—'}</p>
                    </div>
                    <span className={`${V2_PILL} flex-shrink-0 ${STATUS_STYLE[m.status]}`}>
                      {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between text-xs ${V2_MUTED}`}>
                    <span>{formatDate(m.startAt)} · {formatTime(m.startAt)}{m.endAt ? ` – ${formatTime(m.endAt)}` : ''}</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/attendance/${m.id}`)}
                      className="flex items-center gap-1 text-[#3363AD] dark:text-blue-300 font-bold"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {m.participantCount} participants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className={`text-xs ${V2_MUTED}`}>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={`px-3 py-1.5 ${PAGE_BTN} ${PAGE_BTN_IDLE}`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-[#9AA3B2]">…</span>
                ) : (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 ${PAGE_BTN} ${
                      safePage === p ? 'bg-[#3363AD] text-white border-[#3363AD]' : PAGE_BTN_IDLE
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className={`px-3 py-1.5 ${PAGE_BTN} ${PAGE_BTN_IDLE}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList;
