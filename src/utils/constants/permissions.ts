// ─── Permission keys ──────────────────────────────────────────────────────────
// Use these in PermissionGuard / usePermission's can() instead of hard-coding
// role lists inside every component.

export const PERMISSIONS = {
  // Analytics
  ANALYTICS_VIEW:     "analytics:view",       // can open /analytics at all
  ANALYTICS_VIEW_ALL: "analytics:view_all",   // sees platform-wide stats; others see only their own data

  // Courses
  COURSE_CREATE:      "course:create",
  COURSE_EDIT_OWN:    "course:edit_own",      // trainer: only courses where creatorId === user.id
  COURSE_EDIT_ANY:    "course:edit_any",      // admin/developer: any course
  COURSE_DELETE_OWN:  "course:delete_own",
  COURSE_DELETE_ANY:  "course:delete_any",
  COURSE_PUBLISH:     "course:publish",
  COURSE_BUILDER:     "course:builder",

  // Students
  STUDENT_VIEW_ALL:   "student:view_all",     // see all students (own industry only, enforced by API)
  STUDENT_VIEW_OWN:   "student:view_own",     // trainer: only students enrolled in their courses
  STUDENT_MANAGE:     "student:manage",       // create/edit/deactivate student records

  // Staff
  STAFF_VIEW:         "staff:view",
  STAFF_MANAGE:       "staff:manage",

  // Certificates
  CERTIFICATE_MANAGE:   "certificate:manage",   // design templates + issue to students
  CERTIFICATE_VIEW_OWN: "certificate:view_own", // trainee: view their earned certificates

  // Hospitals / CHW
  HOSPITAL_VIEW:    "hospital:view",
  HOSPITAL_MANAGE:  "hospital:manage",

  // Announcements
  ANNOUNCEMENT_CREATE: "announcement:create",
  ANNOUNCEMENT_VIEW:   "announcement:view",

  // Feedback
  FEEDBACK_VIEW_ALL: "feedback:view_all",   // all course feedback
  FEEDBACK_VIEW_OWN: "feedback:view_own",   // trainer: only their courses' feedback

  // Messaging (industry-gated at route level separately)
  MESSAGING_ACCESS: "messaging:access",

  // Settings
  SETTINGS_FULL:    "settings:full",    // all settings tabs
  SETTINGS_LIMITED: "settings:limited", // profile + password only
} as const;

export type AppPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → permissions map ──────────────────────────────────────────────────
// Industry isolation is enforced by the API (JWT carries industry).
// Frontend only needs to gate features, not re-filter data.

const FULL_COURSE_ACCESS: AppPermission[] = [
  PERMISSIONS.COURSE_CREATE,
  PERMISSIONS.COURSE_EDIT_ANY,
  PERMISSIONS.COURSE_DELETE_ANY,
  PERMISSIONS.COURSE_PUBLISH,
  PERMISSIONS.COURSE_BUILDER,
];

const FULL_ANALYTICS: AppPermission[] = [
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.ANALYTICS_VIEW_ALL,
];

export const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  ADMIN: [
    ...FULL_ANALYTICS,
    ...FULL_COURSE_ACCESS,
    PERMISSIONS.STUDENT_VIEW_ALL,
    PERMISSIONS.STUDENT_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.CERTIFICATE_MANAGE,
    PERMISSIONS.HOSPITAL_VIEW,
    PERMISSIONS.HOSPITAL_MANAGE,
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_VIEW,
    PERMISSIONS.FEEDBACK_VIEW_ALL,
    PERMISSIONS.MESSAGING_ACCESS,
    PERMISSIONS.SETTINGS_FULL,
  ],

  DEVELOPER: [
    ...FULL_ANALYTICS,
    ...FULL_COURSE_ACCESS,
    PERMISSIONS.STUDENT_VIEW_ALL,
    PERMISSIONS.STUDENT_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.CERTIFICATE_MANAGE,
    PERMISSIONS.HOSPITAL_VIEW,
    PERMISSIONS.HOSPITAL_MANAGE,
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_VIEW,
    PERMISSIONS.FEEDBACK_VIEW_ALL,
    PERMISSIONS.MESSAGING_ACCESS,
    PERMISSIONS.SETTINGS_FULL,
  ],

  TRAINER: [
    PERMISSIONS.ANALYTICS_VIEW,           // own courses only
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_EDIT_OWN,
    PERMISSIONS.COURSE_DELETE_OWN,
    PERMISSIONS.COURSE_PUBLISH,
    PERMISSIONS.COURSE_BUILDER,
    PERMISSIONS.STUDENT_VIEW_OWN,
    PERMISSIONS.CERTIFICATE_MANAGE,
    PERMISSIONS.HOSPITAL_VIEW,
    PERMISSIONS.ANNOUNCEMENT_VIEW,
    PERMISSIONS.FEEDBACK_VIEW_OWN,
    PERMISSIONS.MESSAGING_ACCESS,
    PERMISSIONS.SETTINGS_LIMITED,
  ],

  SUPERVISOR: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.STUDENT_VIEW_ALL,
    PERMISSIONS.HOSPITAL_VIEW,
    PERMISSIONS.HOSPITAL_MANAGE,
    PERMISSIONS.ANNOUNCEMENT_VIEW,
    PERMISSIONS.MESSAGING_ACCESS,
    PERMISSIONS.SETTINGS_LIMITED,
  ],

  TRAINEE: [
    PERMISSIONS.CERTIFICATE_VIEW_OWN,
    PERMISSIONS.ANNOUNCEMENT_VIEW,
    PERMISSIONS.MESSAGING_ACCESS,
    PERMISSIONS.SETTINGS_LIMITED,
  ],
};
