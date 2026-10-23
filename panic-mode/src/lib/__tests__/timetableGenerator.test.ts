import { test, describe } from "node:test";
import assert from "node:assert";
import { generateRevisionTimetable } from "../timetableGenerator.ts";
import type { SubjectItem, StudyTask } from "@/types/exam";
import { addDays, subDays, formatISO } from "date-fns";

describe("timetableGenerator", () => {
  const baseNow = new Date();
  const futureExamDate = formatISO(addDays(baseNow, 3));

  test("schedules user's real topics without substituting generic tasks", () => {
    const subjects: SubjectItem[] = [
      {
        id: "sub-bio",
        name: "Biology",
        chaptersTotal: 2,
        chaptersRemaining: 2,
        priority: "High",
        status: "Needs Revision",
        topics: ["Photosynthesis and Its Process", "Cellular Respiration and ATP"],
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: futureExamDate,
      subjects,
      dailyStudyHours: 4,
    });

    assert.ok(result.days.length > 0);
    const scheduledTopics = result.days.flatMap((d) => d.tasks.map((t) => t.topic));

    assert.ok(scheduledTopics.includes("Photosynthesis and Its Process"));
    assert.ok(scheduledTopics.includes("Cellular Respiration and ATP"));
    // Ensure generic topics are NOT inserted
    assert.ok(!scheduledTopics.includes("Core Syllabus Review"));
    assert.ok(!scheduledTopics.includes("Past Year Papers"));
  });

  test("generates subject-branded chapters when explicit topics array is empty", () => {
    const subjects: SubjectItem[] = [
      {
        id: "sub-chem",
        name: "Organic Chemistry",
        chaptersTotal: 3,
        chaptersRemaining: 3,
        priority: "Medium",
        status: "Needs Revision",
        topics: [],
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: futureExamDate,
      subjects,
      dailyStudyHours: 4,
    });

    const scheduledTopics = result.days.flatMap((d) => d.tasks.map((t) => t.topic));
    assert.ok(scheduledTopics.includes("Organic Chemistry: Chapter 1"));
    assert.ok(scheduledTopics.includes("Organic Chemistry: Chapter 2"));
    assert.ok(scheduledTopics.includes("Organic Chemistry: Chapter 3"));
    assert.ok(!scheduledTopics.some((t) => t.includes("Computer Architecture")));
  });

  test("strictly enforces daily study capacity limits", () => {
    // 2 hours daily study = 120 minutes max per day
    const subjects: SubjectItem[] = [
      {
        id: "sub-1",
        name: "Physics",
        chaptersTotal: 5,
        chaptersRemaining: 5,
        priority: "High", // 60 min each
        status: "Needs Revision",
        topics: [
          "Kinematics",
          "Dynamics",
          "Rotational Motion",
          "Thermodynamics",
          "Electromagnetism",
        ],
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: futureExamDate,
      subjects,
      dailyStudyHours: 2,
    });

    for (const day of result.days) {
      assert.ok(
        day.allocatedMinutes <= day.availableMinutes,
        `Day ${day.date} allocated ${day.allocatedMinutes}m exceeds available ${day.availableMinutes}m`
      );
    }
  });

  test("allocates 40% reduced hours on exam day for final light review", () => {
    const subjects: SubjectItem[] = [
      {
        id: "sub-math",
        name: "Mathematics",
        chaptersTotal: 1,
        chaptersRemaining: 1,
        priority: "High",
        status: "Needs Revision",
        topics: ["Calculus Formulas"],
      },
    ];

    const dailyHours = 5; // 300 min regular; 40% = 120 min on exam day
    const result = generateRevisionTimetable({
      examDateTime: futureExamDate,
      subjects,
      dailyStudyHours: dailyHours,
    });

    const examDay = result.days.find((d) => d.isExamDay);
    assert.ok(examDay);
    assert.strictEqual(examDay.availableMinutes, Math.round((300 * 0.4) / 15) * 15); // 120 min
  });

  test("places un-schedulable topics in unassignedTasks without discarding them", () => {
    // 1 day span, 1 hour cap (60 min available on day 0, 40% = 15m min)
    // 4 High priority topics (4 * 60m = 240m required)
    const tomorrowStr = formatISO(addDays(baseNow, 1));
    const subjects: SubjectItem[] = [
      {
        id: "sub-huge",
        name: "Literature",
        chaptersTotal: 4,
        chaptersRemaining: 4,
        priority: "High",
        status: "Needs Revision",
        topics: ["Poetry", "Prose", "Drama", "Critical Essays"],
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: tomorrowStr,
      subjects,
      dailyStudyHours: 1, // Only 60 min available today
    });

    assert.strictEqual(result.isConstrained, true);
    assert.ok(result.unassignedTasks.length > 0);
    // Sum of allocated tasks + unassigned tasks must equal all 4 topics
    const scheduledCount = result.days.flatMap((d) => d.tasks).length;
    assert.strictEqual(scheduledCount + result.unassignedTasks.length, 4);
  });

  test("preserves task completion states across schedule changes", () => {
    const subjects: SubjectItem[] = [
      {
        id: "sub-bio",
        name: "Biology",
        chaptersTotal: 2,
        chaptersRemaining: 2,
        priority: "High",
        status: "Needs Revision",
        topics: ["Photosynthesis", "Cellular Respiration"],
      },
    ];

    // Simulate an existing task that was completed previously
    const existingTasks: StudyTask[] = [
      {
        id: "old-task-id",
        date: "2026-11-01",
        subjectId: "sub-bio",
        subjectName: "Biology",
        topic: "Photosynthesis",
        durationMinutes: 60,
        priority: "High",
        completed: true,
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: futureExamDate,
      subjects,
      dailyStudyHours: 4,
      existingTasks,
    });

    const allScheduledTasks = result.days.flatMap((d) => d.tasks);
    const photoTask = allScheduledTasks.find((t) => t.topic === "Photosynthesis");
    assert.ok(photoTask);
    assert.strictEqual(photoTask.completed, true);

    const respTask = allScheduledTasks.find((t) => t.topic === "Cellular Respiration");
    assert.ok(respTask);
    assert.strictEqual(respTask.completed, false);
  });

  test("handles past exam dates gracefully without crashing or creating negative spans", () => {
    const pastExamDate = formatISO(subDays(baseNow, 2));
    const subjects: SubjectItem[] = [
      {
        id: "sub-past",
        name: "History",
        chaptersTotal: 2,
        chaptersRemaining: 2,
        priority: "High",
        status: "Needs Revision",
        topics: ["WW1", "WW2"],
      },
    ];

    const result = generateRevisionTimetable({
      examDateTime: pastExamDate,
      subjects,
      dailyStudyHours: 4,
    });

    assert.strictEqual(result.days.length, 0);
    assert.strictEqual(result.unassignedTasks.length, 2);
    assert.strictEqual(result.isConstrained, true);
  });
});
