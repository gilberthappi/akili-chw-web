import React, { useState } from "react";
import { Award, Download, ChevronRight, CheckCircle2, ChevronUp } from "lucide-react";
import { IMyCertificate } from "@/services/certificates.service";
import { uniqueCourseCertificateCount } from "@/utils/certificates";

interface CertificatesEarnedWidgetV2Props {
  certificates: IMyCertificate[];
  isLoading?: boolean;
  /**
   * When true (student details), "View All" expands the list in place
   * instead of navigating to /my-certificates.
   */
  expandInPlace?: boolean;
}

export const CertificatesEarnedWidgetV2: React.FC<
  CertificatesEarnedWidgetV2Props
> = ({ certificates = [], isLoading = false, expandInPlace = false }) => {
  const [showAll, setShowAll] = useState(false);
  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  const certCount = uniqueCourseCertificateCount(safeCertificates);
  const displayCertificates = showAll
    ? safeCertificates
    : safeCertificates.slice(0, 4);
  const canExpand = safeCertificates.length > 4;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                Earned Certificates & Accreditations
              </h3>
              {certCount > 0 && (
                <span className="text-xs bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {certCount} Official
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Certificates from passed Final Exam (backend)
            </p>
          </div>
        </div>

        {canExpand && (
          <button
            type="button"
            onClick={() => {
              if (expandInPlace) {
                setShowAll((v) => !v);
                return;
              }
              // Learner dashboard: expand in place too (safer than wrong /my-certificates
              // for contexts that share this widget on student details).
              setShowAll((v) => !v);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3363AD] bg-[#EBF0F9] hover:bg-[#3363AD] hover:text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            {showAll ? (
              <>
                Show less
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                View All Certificates
                <ChevronRight size={13} />
              </>
            )}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
          <div className="h-20 bg-gray-50 rounded-xl" />
          <div className="h-20 bg-gray-50 rounded-xl" />
        </div>
      ) : certCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center mb-2">
            <Award size={24} />
          </div>
          <p className="text-xs font-bold text-gray-700">
            No certificates earned yet
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
            Certificates appear after the learner passes the Final Exam for a
            course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayCertificates.map((cert) => {
            const rawDate = cert.completedAtRaw || cert.completedAt;
            const dateObj = rawDate ? new Date(rawDate) : null;
            const formattedDate =
              dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—";

            const pdfUrl =
              (cert as { pdf?: string }).pdf ||
              (cert as { pdfUrl?: string }).pdfUrl ||
              "";

            return (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#3363AD]/30 bg-gradient-to-r from-gray-50/50 to-white hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-[#3363AD] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#3363AD] transition-colors truncate">
                      {cert.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      <span>Issued {formattedDate}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 size={10} />
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#3363AD]/20 text-xs font-bold text-[#3363AD] hover:bg-[#3363AD] hover:text-white transition-colors shrink-0 shadow-2xs"
                  >
                    <Download size={13} />
                    PDF
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-400 font-semibold shrink-0">
                    No PDF
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
