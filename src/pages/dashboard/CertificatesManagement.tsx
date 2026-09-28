import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  Send,
} from "lucide-react";
import { V2KpiCard, V2PageHeader, V2SearchInput, V2Tabs } from "@/components/v2/V2Page";
import {
  V2_BONE,
  V2_BTN_DANGER,
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import toast from "react-hot-toast";
import {
  listCertificateTemplates,
  getLinkedCourses,
  deleteCertificateTemplate,
} from "@/services/certificateTemplate.service";
import { getDashboardV2Certificates } from "@/services/analytics.service";
import type {
  CertificateTemplateSummary,
  LinkedCourse,
} from "@/services/certificateTemplate.service";
import { formatDate } from "@/utils/formats/formats";
import Modal from "@/components/common/Modal";

interface TemplateWithCourses extends CertificateTemplateSummary {
  linkedCourses: LinkedCourse[];
}

export default function CertificatesManagement() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateWithCourses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<TemplateWithCourses | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [earned, setEarned] = useState({ total: 0, chw: 0, tester: 0, ceho: 0 });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    (async () => {
      try {
        const earnedTotal = (role = "") =>
          getDashboardV2Certificates(role ? `role=${role}` : "")
            .then((r) => r.data?.total ?? 0)
            .catch(() => 0);
        const [list, total, chw, tester, ceho] = await Promise.all([
          listCertificateTemplates(),
          earnedTotal(),
          earnedTotal("TRAINEE"),
          earnedTotal("TESTER"),
          earnedTotal("CEHO"),
        ]);
        const withCourses = await Promise.all(
          list.map(async (t) => {
            try {
              const courses = await getLinkedCourses(t.id);
              return { ...t, linkedCourses: courses };
            } catch {
              return { ...t, linkedCourses: [] };
            }
          })
        );
        if (!cancelledRef.current) {
          setTemplates(withCourses);
          setEarned({ total, chw, tester, ceho });
        }
      } catch {
        if (!cancelledRef.current) toast.error("Failed to load certificate templates");
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();
    return () => { cancelledRef.current = true; };
  }, []);

  const getStatus = (t: TemplateWithCourses) =>
    t.linkedCourses.length > 0 ? "active" : "draft";

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return templates.filter((t) => {
      const status = getStatus(t);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.linkedCourses.some((c) => c.title.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [templates, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((t) => t.linkedCourses.length > 0).length,
    draft: templates.filter((t) => t.linkedCourses.length === 0).length,
  }), [templates]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCertificateTemplate(deleteTarget.id);
      setTemplates((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success("Template deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="Certificate Management"
        subtitle="Create, manage, and distribute certificates for your workshops"
        actions={
          <button type="button" onClick={() => navigate("/certificates/design")} className={V2_BTN_PRIMARY}>
            <Plus className="w-4 h-4" />
            Create New Certificate
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <V2KpiCard
          label="Certificates Earned"
          value={earned.total.toLocaleString()}
          Icon={Send}
          sub={`CHWs ${earned.chw.toLocaleString()} · Testers ${earned.tester.toLocaleString()} · CEHO ${earned.ceho.toLocaleString()}`}
          onClick={() => navigate("/certificates/issued")}
        />
        <V2KpiCard label="Templates" value={stats.total} Icon={Award} sub="Certificate designs" />
        <V2KpiCard
          label="Active Templates"
          value={stats.active}
          Icon={CheckCircle2}
          accent="text-emerald-600 dark:text-emerald-400"
          sub="Linked to a course"
        />
        <V2KpiCard
          label="Draft Templates"
          value={stats.draft}
          Icon={FileText}
          accent="text-amber-500 dark:text-amber-400"
          sub="Not linked yet"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <V2SearchInput
          className="flex-1 max-w-md"
          placeholder="Search by certificate or linked course..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <V2Tabs
          items={[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "draft", label: "Draft" },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${V2_CARD_SHELL} overflow-hidden animate-pulse`}>
              <div className={`${V2_BONE} h-36 !rounded-none`} />
              <div className="p-4 space-y-3">
                <div className={`${V2_BONE} h-4 w-2/3`} />
                <div className={`${V2_BONE} h-3 w-1/3`} />
                <div className={`${V2_BONE} h-3 w-1/2`} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${V2_CARD_SHELL} flex flex-col items-center justify-center py-20 ${V2_MUTED}`}>
          <Award className="w-12 h-12 mb-3 text-[#3363AD]/40" />
          <p className={`font-bold ${V2_STRONG}`}>No certificates found</p>
          <p className="text-sm mt-1">
            {searchQuery ? "Try a different search term" : "Create your first certificate template"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => {
            const status = getStatus(t);
            return (
              <div
                key={t.id}
                className={`${V2_CARD_SHELL} overflow-hidden flex flex-col hover:border-[#3363AD]/50 transition-colors`}
              >
                {/* Thumbnail — taller for better preview */}
                <div className="relative h-52 bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {t.thumbnail ? (
                    <img
                      src={t.thumbnail}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#3363AD]/30">
                      <FileText className="w-10 h-10" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 ${V2_PILL} ${status === "active" ? V2_PILL_GREEN : V2_PILL_AMBER}`}
                  >
                    {status === "active" ? "Active" : "Draft"}
                  </span>
                </div>

                {/* Body — 2 rows */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  {/* Row 1: Name + date */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-sm leading-tight line-clamp-1 ${V2_STRONG}`}>
                      {t.name}
                    </h3>
                    <span className="text-xs text-[#9AA3B2] shrink-0">{formatDate(t.createdAt)}</span>
                  </div>

                  {/* Row 2: courses + issued + Edit + Delete */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8EEF4] dark:border-slate-700">
                    {/* Left: course chips only */}
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <BookOpen className="w-3.5 h-3.5 text-[#9AA3B2] shrink-0" />
                      {t.linkedCourses.length === 0 ? (
                        <span className="text-xs text-[#9AA3B2]">No course linked</span>
                      ) : (
                        <>
                          {t.linkedCourses.slice(0, 1).map((c) => (
                            <span
                              key={c.id}
                              className={`${V2_PILL} ${V2_PILL_BLUE} min-w-0`}
                            >
                              {c.coverIcon && (
                                <img src={c.coverIcon} alt="" className="w-3 h-3 rounded-full object-cover shrink-0" />
                              )}
                              <span className="truncate max-w-[80px]">{c.title}</span>
                            </span>
                          ))}
                          {t.linkedCourses.length > 1 && (
                            <span className={`${V2_PILL} ${V2_PILL_GRAY} shrink-0`}>
                              +{t.linkedCourses.length - 1}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Right: issued + Edit + Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className={`flex items-center gap-1 text-xs mr-1 ${V2_MUTED}`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{t.issuedCount}</span>
                        {t.issuedCount > 0 && (
                          <button
                            onClick={() =>
                              navigate("/certificates/issued", {
                                state: { templateId: t.id, templateName: t.name },
                              })
                            }
                            className="text-xs font-bold text-[#3363AD] hover:text-[#2B5493] dark:text-blue-300 underline underline-offset-2 transition"
                          >
                            View
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/certificates/design/${t.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#3363AD] bg-[#EBF0F9] hover:bg-[#DCE8F8] dark:bg-slate-700 dark:text-blue-300 rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="flex items-center justify-center w-7 h-7 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Certificate Template"
        centered
      >
        <div className="space-y-5">
          <p className={`text-sm ${V2_MUTED}`}>
            Are you sure you want to delete{" "}
            <span className={`font-semibold ${V2_STRONG}`}>"{deleteTarget?.name}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className={`${V2_BTN_SECONDARY} disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={V2_BTN_DANGER}
            >
              {deleting && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}