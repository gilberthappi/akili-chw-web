import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import {
  V2_BTN_SECONDARY,
  V2_INPUT,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import DocumentUploadQueue from "./DocumentUploadQueue";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
  courses: { id: string; title: string }[];
  defaultCourseId?: string;
}

export default function UploadDocumentsDialog({ isOpen, onClose, onUploaded, courses, defaultCourseId }: Props) {
  const [courseId, setCourseId] = useState(defaultCourseId ?? "");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (isOpen) setCourseId(defaultCourseId ?? "");
  }, [isOpen, defaultCourseId]);

  return (
    <Modal isOpen={isOpen} onClose={() => !running && onClose()} title="Upload documents" centered>
      <div className="space-y-4">
        <div>
          <label className={`block text-xs font-bold mb-1 ${V2_STRONG}`}>Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={running}
            className={`w-full px-3 py-2 text-sm ${V2_INPUT}`}
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {isOpen && (
          <DocumentUploadQueue courseId={courseId} onUploaded={onUploaded} onRunningChange={setRunning} />
        )}

        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className={V2_BTN_SECONDARY} disabled={running}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
