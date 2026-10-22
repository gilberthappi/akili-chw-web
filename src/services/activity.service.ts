import api from "./api";

export interface StudyLocationFix {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

let locationDenied = false;

/** Foreground position for the study heartbeat. Null when location is unavailable. */
export const currentStudyLocation = (): Promise<StudyLocationFix | null> => {
  if (locationDenied || typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve(null);
          return;
        }
        if (typeof accuracy === "number" && accuracy > 300) {
          resolve(null);
          return;
        }
        resolve({
          latitude,
          longitude,
          ...(typeof accuracy === "number" ? { accuracyMeters: accuracy } : {}),
        });
      },
      (err) => {
        if (err.code === 1) locationDenied = true;
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
};

export const postHeartbeat = async (
  courseId?: string,
  location?: StudyLocationFix | null,
): Promise<void> => {
  try {
    await api.post("/activity/heartbeat", {
      ...(courseId ? { courseId } : {}),
      ...(location ?? {}),
    });
  } catch {
    // Fire-and-forget telemetry — never let a failed heartbeat affect the UI.
  }
};
