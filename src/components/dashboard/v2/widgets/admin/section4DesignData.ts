/** Section 4 design dummies — CHW Demographics + Recent activities */

export const SECTION4_DEMOGRAPHICS_TABS = [
  "All",
  "Gender",
  "Age Group",
  "Education Level",
  "District",
  "Health center",
] as const;

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
  {
    id: "d2",
    title: "UBUVUZI BWIBANZE KU MUDUGUDU",
    level: "Beginner",
    enrollment: 20,
    completion: 14,
    growth: "17.69%",
    growthPositive: true,
    lessons: 15,
    hours: "15h",
    preTest: "85%",
    midTest: "85%",
    postTest: "85%",
    certificate: "1100",
  },
  {
    id: "d3",
    title: "UBUVUZI BWIBANZE KU MUDUGUDU",
    level: "Beginner",
    enrollment: 90,
    completion: 72,
    growth: "17.69%",
    growthPositive: false,
    lessons: 15,
    hours: "15h",
    preTest: "85%",
    midTest: "85%",
    postTest: "85%",
    certificate: "1100",
  },
  {
    id: "d4",
    title: "UBUVUZI BWIBANZE KU MUDUGUDU",
    level: "Beginner",
    enrollment: 100,
    completion: 88,
    growth: "17.69%",
    growthPositive: true,
    lessons: 15,
    hours: "15h",
    preTest: "85%",
    midTest: "85%",
    postTest: "85%",
    certificate: "1100",
  },
] as const;

export const SECTION4_RECENT_ACTIVITIES = {
  group: "Today",
  items: [
    {
      id: "a1",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
    {
      id: "a2",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
    {
      id: "a3",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
    {
      id: "a4",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
    {
      id: "a5",
      text: "CHW named KAMANA Jean Baptiste has finished certificate exam with five trials.",
      time: "10:45 PM",
    },
  ],
} as const;
