/** Section 5 design dummies — Knowledge Gain, Map performance, Enrollment, Feedback */

export const SECTION5_KNOWLEDGE_ROWS = [
  {
    idNo: "NID-607071",
    name: "KAMANA Jean Baptiste",
    course: "UBUVUZI BWIBANZE KU MUDUGUDU",
    healthCenter: "Kacyiru HC",
    preScore: 42,
    postScore: 85,
    gain: 43,
  },
  {
    idNo: "NID-608142",
    name: "UWASE Marie Claire",
    course: "GUKUMIRA MALARIYA",
    healthCenter: "Remera HC",
    preScore: 38,
    postScore: 88,
    gain: 50,
  },
  {
    idNo: "NID-609253",
    name: "HABIMANA Eric",
    course: "HIV n'UBUVUZI BWA TB",
    healthCenter: "Nyamirambo HC",
    preScore: 51,
    postScore: 91,
    gain: 40,
  },
  {
    idNo: "NID-610364",
    name: "MUKAMANA Grace",
    course: "MNCH — Umubyeyi n'Umwana",
    healthCenter: "Kimironko HC",
    preScore: 45,
    postScore: 86,
    gain: 41,
  },
  {
    idNo: "NID-611475",
    name: "NIYONZIMA Patrick",
    course: "iCCM — Infection zo mu ruhuha",
    healthCenter: "Gisozi HC",
    preScore: 40,
    postScore: 84,
    gain: 44,
  },
  {
    idNo: "NID-612586",
    name: "INGABIRE Divine",
    course: "Indahinzo z'imirire",
    healthCenter: "Kanombe HC",
    preScore: 48,
    postScore: 90,
    gain: 42,
  },
] as const;

export const SECTION5_KNOWLEDGE_CHART = [
  { label: "HIV", preTest: 42, postTest: 88 },
  { label: "Malaria", preTest: 38, postTest: 85 },
  { label: "TB", preTest: 50, postTest: 92 },
  { label: "MNCH", preTest: 45, postTest: 89 },
  { label: "iCCM", preTest: 41, postTest: 86 },
  { label: "Nutrition", preTest: 47, postTest: 90 },
] as const;

export const SECTION5_DISTRICT_PERFORMANCE = [
  { district: "Kamonyi", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Gakenke", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Rulindo", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Musanze", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Rwamagana", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Nyarugenge", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Gasabo", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Kicukiro", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Muhanga", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Huye", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Rubavu", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  { district: "Nyagatare", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
] as const;

/** Crossing dual-line chart (design board style) */
export const SECTION5_ENROLLMENT_TRENDS = [
  { month: "Jan", activeEnrollments: 18, testAttempts: 28 },
  { month: "Feb", activeEnrollments: 22, testAttempts: 24 },
  { month: "Mar", activeEnrollments: 30, testAttempts: 20 },
  { month: "Apr", activeEnrollments: 38, testAttempts: 18 },
  { month: "May", activeEnrollments: 42, testAttempts: 22 },
  { month: "Jun", activeEnrollments: 48, testAttempts: 28 },
  { month: "Jul", activeEnrollments: 44, testAttempts: 35 },
  { month: "Aug", activeEnrollments: 36, testAttempts: 40 },
  { month: "Sep", activeEnrollments: 28, testAttempts: 42 },
  { month: "Oct", activeEnrollments: 24, testAttempts: 38 },
  { month: "Nov", activeEnrollments: 20, testAttempts: 32 },
  { month: "Dec", activeEnrollments: 16, testAttempts: 26 },
] as const;

export const SECTION5_FEEDBACK = [
  { id: "f1", title: "Intego z'icyi kigwa zirasoanutse", name: "KAMANA Jean Baptiste"},
  { id: "f2", title: "Intego z'icyi kigwa zirasoanutse", name : "UWASE Marie Claire"},
  { id: "f3", title: "Intego z'icyi kigwa zirasoanutse", name : "HABIMANA Eric"},
  { id: "f4", title: "Intego z'icyi kigwa zirasoanutse", name : "MUKAMANA Grace"},
  { id: "f5", title: "Intego z'icyi kigwa zirasoanutse", name : "NIYONZIMA Patrick"},
  { id: "f6", title: "Intego z'icyi kigwa zirasoanutse", name : "INGABIRE Divine"},
  { id: "f7", title: "Intego z'icyi kigwa zirasoanutse", name : "NIYONZIMA Patrick"},
  { id: "f8", title: "Intego z'icyi kigwa zirasoanutse", name : "INGABIRE Divine"},
] as const;
