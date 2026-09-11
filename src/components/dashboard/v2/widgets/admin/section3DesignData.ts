/** Section 3 design dummies — Program Courses, AI Recommendation, Schedule calendar */

export const SECTION3_PROGRAM_COURSES = {
  totalCount: 14,
  items: [
    {
      id: "c1",
      title: "GUKUMIRA MALARIYA KU RWEGO RW'UMUDUGUDU",
      iconColor: "#3363AD",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: false,
    },
    {
      id: "c2",
      title: "UBUVUZI BW'INFECTION YA HIV N'UBUVUZI BWA TB",
      iconColor: "#7C3AED",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: true,
    },
    {
      id: "c3",
      title: "UBUZIMA BW'UMUBYEYI N'UMWANA (MNCH)",
      iconColor: "#DB2777",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: false,
    },
    {
      id: "c4",
      title: "I CCM — UBUVUZI BW'INFECTION ZO MU RUHUHA",
      iconColor: "#D97706",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: true,
    },
    {
      id: "c5",
      title: "INDAHINZO Z'IMIRIRE N'UBUZIMA BWIZA",
      iconColor: "#059669",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: true,
    },
    {
      id: "c6",
      title: "UBUZIMA BW'UBWONGE N'UBUVUZI BW'AMITIMA",
      iconColor: "#0EA5E9",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: false,
    },
    {
      id: "c7",
      title: "UBUVUZI BW'INFECTION YA TUBERCULOSE",
      iconColor: "#4B82BA",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: true,
    },
    {
      id: "c8",
      title: "GUKANGURIRA ABANTU KU BIJYANYE N'UBWANA",
      iconColor: "#EAB308",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
      growth: "17.69%",
      growthPositive: false,
    },
  ],
} as const;

export const SECTION3_AI_RECOMMENDATIONS = [
  { score: 70, title: "HIV", chapters: 8, candidates: 150 },
  { score: 70, title: "Malaria", chapters: 10, candidates: 210 },
  { score: 70, title: "TB", chapters: 7, candidates: 120 },
  { score: 70, title: "MNCH", chapters: 9, candidates: 180 },
  { score: 70, title: "iCCM", chapters: 6, candidates: 95 },
  { score: 70, title: "Nutrition", chapters: 8, candidates: 140 },
  { score: 70, title: "NCDs", chapters: 7, candidates: 110 },
  { score: 70, title: "Mental health", chapters: 5, candidates: 85 },
] as const;

/** @deprecated Design dummies — Schedule calendar now uses GET /export/dashboard/v2/schedule */
export const SECTION3_SCHEDULE = [
  // —— Today ——
  {
    id: "t1",
    timeframe: "Today",
    time: "09:00 AM",
    badge: "Virtual meeting",
    title: "HIV — Mid-test coaching session",
  },
  {
    id: "t2",
    timeframe: "Today",
    time: "11:30 AM",
    badge: "In-person",
    title: "Malaria case review with CEHO supervisors",
    active: true,
  },
  {
    id: "t3",
    timeframe: "Today",
    time: "02:00 PM",
    badge: "Virtual meeting",
    title: "TB contact tracing briefing",
  },
  {
    id: "t4",
    timeframe: "Today",
    time: "04:15 PM",
    badge: "Training",
    title: "MNCH chapter 3 walkthrough",
  },

  // —— This Week (beyond today) ——
  {
    id: "w1",
    timeframe: "This Week",
    time: "Mon 10:00",
    badge: "Virtual meeting",
    title: "iCCM weekly stand-up",
  },
  {
    id: "w2",
    timeframe: "This Week",
    time: "Tue 01:30",
    badge: "Workshop",
    title: "Nutrition counseling practice",
  },
  {
    id: "w3",
    timeframe: "This Week",
    time: "Wed 03:00",
    badge: "Virtual meeting",
    title: "NCDs peer mentoring circle",
    active: true,
  },
  {
    id: "w4",
    timeframe: "This Week",
    time: "Thu 09:30",
    badge: "In-person",
    title: "Mental health referral pathway review",
  },
  {
    id: "w5",
    timeframe: "This Week",
    time: "Fri 02:45",
    badge: "Training",
    title: "Family Planning module kickoff",
  },

  // —— This Month (beyond this week) ——
  {
    id: "m1",
    timeframe: "This Month",
    time: "12 Sep",
    badge: "Virtual meeting",
    title: "District CEHO coordination call",
  },
  {
    id: "m2",
    timeframe: "This Month",
    time: "18 Sep",
    badge: "Workshop",
    title: "Immunization campaign prep",
    active: true,
  },
  {
    id: "m3",
    timeframe: "This Month",
    time: "22 Sep",
    badge: "In-person",
    title: "CHW graduation rehearsal — Gasabo",
  },
  {
    id: "m4",
    timeframe: "This Month",
    time: "28 Sep",
    badge: "Training",
    title: "Final exam coaching — Malaria cohort",
  },

  // —— This Year (beyond this month) ——
  {
    id: "y1",
    timeframe: "This Year",
    time: "Oct",
    badge: "Summit",
    title: "National CHW learning summit",
  },
  {
    id: "y2",
    timeframe: "This Year",
    time: "Nov",
    badge: "Virtual meeting",
    title: "Year-end certification push briefing",
    active: true,
  },
  {
    id: "y3",
    timeframe: "This Year",
    time: "Dec",
    badge: "Workshop",
    title: "2027 curriculum planning workshop",
  },
] as const;

/** @deprecated Use API schedule endpoint; kept for reference only. */
export const scheduleForTimeframe = (
  timeframe: string,
): (typeof SECTION3_SCHEDULE)[number][] => {
  const order = ["Today", "This Week", "This Month", "This Year"] as const;
  const idx = order.indexOf(timeframe as (typeof order)[number]);
  const max = idx >= 0 ? idx : 0;
  const allowed = new Set(order.slice(0, max + 1));
  return SECTION3_SCHEDULE.filter((m) => allowed.has(m.timeframe));
};
