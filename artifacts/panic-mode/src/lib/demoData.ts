import { addDays, format } from "date-fns";
import type { SubjectItem, PrepLevel } from "@/types/exam";

export function getSampleDemoData(): {
  examDateTime: string;
  subjectName: string;
  chaptersRemaining: number;
  prepLevel: PrepLevel;
  dailyStudyHours: number;
  subjects: SubjectItem[];
} {
  // Dynamically set exam to 4 days ahead at 09:00 AM
  const targetDate = addDays(new Date(), 4);
  targetDate.setHours(9, 0, 0, 0);
  const examDateTime = format(targetDate, "yyyy-MM-dd'T'HH:mm");

  const subjects: SubjectItem[] = [
    {
      id: "sub-1",
      name: "Computer Architecture",
      chaptersTotal: 6,
      chaptersRemaining: 4,
      priority: "High",
      status: "Needs Revision",
      topics: [
        "Pipelining Hazards & Forwarding",
        "Cache Coherence (MESI Protocol)",
        "Virtual Memory & TLB Miss Handling",
        "Superscalar & Branch Prediction",
      ],
      notes: "Heavy weightage on memory hierarchy and pipelining in midterm.",
    },
    {
      id: "sub-2",
      name: "Operating Systems",
      chaptersTotal: 5,
      chaptersRemaining: 2,
      priority: "High",
      status: "In Progress",
      topics: [
        "Semaphores & Dining Philosophers",
        "Deadlock Banker's Algorithm",
      ],
      notes: "Review code implementations for synchronization primitives.",
    },
    {
      id: "sub-3",
      name: "Design & Analysis of Algorithms",
      chaptersTotal: 8,
      chaptersRemaining: 3,
      priority: "Medium",
      status: "In Progress",
      topics: [
        "Dynamic Programming (0/1 Knapsack & LCS)",
        "Graph Minimum Spanning Trees (Kruskal/Prim)",
        "Network Flow (Ford-Fulkerson)",
      ],
      notes: "Practice past exam problem sets.",
    },
    {
      id: "sub-4",
      name: "Database Systems",
      chaptersTotal: 5,
      chaptersRemaining: 1,
      priority: "Low",
      status: "Mastered",
      topics: [
        "ACID Properties & Two-Phase Locking",
      ],
      notes: "Quick formula and index recap only.",
    },
  ];

  return {
    examDateTime,
    subjectName: "Computer Architecture",
    chaptersRemaining: 4,
    prepLevel: "Partially Done",
    dailyStudyHours: 4.5,
    subjects,
  };
}
