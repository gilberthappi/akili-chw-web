/** Section 4 design constants — CHW Demographics + Recent activities */

export const DEMOGRAPHICS_GENDERS = ["Male", "Female"] as const;

export const DEMOGRAPHICS_AGE_GROUPS = [
  "<30",
  "30-49",
  "50-59",
  "60+",
] as const;

/** Same values as mobile registration (`akili-chw-mobile/app/auth/signup.tsx`). */
export const DEMOGRAPHICS_EDUCATION_LEVELS = [
  { value: "NONE", label: "None" },
  { value: "PRIMARY_SCHOOL", label: "Primary school" },
  { value: "O_LEVEL", label: "O Level" },
  { value: "HIGH_SCHOOL", label: "High School / Secondary" },
  { value: "ASSOCIATE_DEGREE_A1", label: "Associate Degree (A1)" },
  { value: "BACHELORS_DEGREE_A0", label: "Bachelor's Degree (A0)" },
  { value: "MASTERS_DEGREE", label: "Master's Degree" },
  { value: "PHD", label: "PhD" },
] as const;

/** @deprecated Tabs replaced by dimension dropdowns */
export const SECTION4_DEMOGRAPHICS_TABS = [
  "All",
  "Gender",
  "Age Group",
  "Education Level",
  "District",
  "Health center",
] as const;

/** @deprecated Design dummies — use GET /export/dashboard/v2/demographics-performance */
export const SECTION4_DEMOGRAPHICS_ROWS = [
  {
    id: "d1",
    title: "UBUVUZI BWIBANZE KU MUDUGUDU",
    level: "Beginner",
    enrollment: 130,
    completion: 117,
    growth: "17.69%",
    growthPositive: false,
    lessons: 15,
    hours: "15h",
    preTest: "85%",
    midTest: "85%",
    postTest: "85%",
    certificate: "1100",
  },
] as const;

/** @deprecated Design dummies — Recent activities now uses GET /export/dashboard/v2/recent-activities */
export const SECTION4_RECENT_ACTIVITIES = {
  group: "Today",
  items: [
    {
      id: "a1",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
  ],
} as const;
