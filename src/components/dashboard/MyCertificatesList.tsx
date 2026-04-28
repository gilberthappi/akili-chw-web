import React from "react";
import { Award, Download } from "lucide-react";
import { Card } from "@/components/common/Card";
import { IMyCertificate } from "@/types";

interface MyCertificatesListProps {
  certificates: IMyCertificate[];
  isLoading: boolean;
}

export const MyCertificatesList: React.FC<MyCertificatesListProps> = ({
  certificates,
  isLoading,
}) => {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Award size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-800">
          My Certificates
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Award size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No certificates yet</p>
          <p className="text-xs text-gray-300 mt-1">
            Complete a course to earn a certificate
          </p>
        </div>
      ) : (
        <div>
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Award size={16} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {cert.courseTitle}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(cert.createdAt).toLocaleDateString("fr-RW", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <a
                href={cert.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs text-[#3363AD] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={13} />
                PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
