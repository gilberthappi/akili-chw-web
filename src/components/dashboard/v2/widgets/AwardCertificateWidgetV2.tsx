import React from "react";
import { Award } from "lucide-react";
import { IMyCertificate } from "@/services/certificates.service";
import { useNavigate } from "react-router-dom";

interface AwardCertificateWidgetV2Props {
  certificates?: IMyCertificate[];
}

export const AwardCertificateWidgetV2: React.FC<AwardCertificateWidgetV2Props> = ({
  certificates = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5">
      <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
        Award & Certificate
      </h3>

      {certificates.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
          <Award size={20} className="mx-auto text-slate-400" />
          <p className="text-xs font-bold text-gray-700">No Certificates Earned Yet</p>
          <p className="text-[11px] text-gray-500">
            Complete training modules to earn official MOH certifications.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {certificates.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => navigate("/my-certificates")}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Award size={14} />
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-[#3363AD] transition-colors truncate">
                {item.title || "Health Module Certification"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
