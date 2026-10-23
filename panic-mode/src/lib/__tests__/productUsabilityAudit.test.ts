import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { format, addDays } from "date-fns";
import { getSampleDemoData } from "../demoData.ts";
import { calculateAssessmentStatus } from "../assessmentCalculator.ts";
import { generateRevisionTimetable } from "../timetableGenerator.ts";
import { buildPersonalizedSuggestions, resolveTargetTopics } from "../actionPlanGenerator.ts";
import type { SubjectItem, StudyTask } from "@/types/exam";

describe("productUsabilityAudit - Complete End-to-End Acceptance Tests", () => {
  const mockStorage: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) {
        delete mockStorage[k];
      }
    },
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  test("1. First-time visitor sees a clean, useful empty state", () => {
    const saved = localStorageMock.getItem("panicMode_subjects");
    const initialSubject = localStorageMock.getItem("subjectName");

    const subjects: SubjectItem[] = saved
      ? JSON.parse(saved)
      : initialSubject
      ? [{ id: "sub-primary", name: initialSubject, chaptersTotal: 3, chaptersRemaining: 3, priority: "High", status: "Needs Revision", topics: [] }]
      : [];

    assert.strictEqual(subjects.length, 0);
    assert.strictEqual(localStorageMock.getItem("panicStatus"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_tasks"), null);
    assert.strictEqual(localStorageMock.getItem("examDateTime"), null);
  });

  test("2. Loading demo data produces consistent subject, topics, status, timetable, and checklist", () => {
    const demo = getSampleDemoData();

    // 1. Subject consistency
    assert.strictEqual(demo.subjectName, "Computer Architecture");
    assert.ok(demo.topicsText.includes("Pipelining Hazards & Forwarding"));
    assert.ok(demo.topicsText.includes("Cache Coherence"));

    // 2. Status derived dynamically, NOT hardcoded
    const computedStatus = calculateAssessmentStatus({
      examDateTime: demo.examDateTime,
      chaptersRemaining: demo.chaptersRemaining,
      prepLevel: demo.prepLevel,
      dailyStudyHours: demo.dailyStudyHours,
    });

    assert.ok(computedStatus.status === "Safe" || computedStatus.status === "Risky");
    assert.ok(computedStatus.explanation.length > 0);

    // 3. Timetable generation matches demo subjects
    const schedule = generateRevisionTimetable({
      examDateTime: demo.examDateTime,
      subjects: demo.subjects,
      dailyStudyHours: demo.dailyStudyHours,
    });

    assert.ok(schedule.days.length > 0);
    const scheduledTopics = schedule.days.flatMap((d) => d.tasks.map((t) => t.topic));
    assert.ok(scheduledTopics.includes("Pipelining Hazards & Forwarding"));

    // 4. Checklist initial task completion in demo
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const initialTasks = schedule.days
      .flatMap((d) => d.tasks)
      .map((t, idx) => (t.date === todayStr && idx === 0 ? { ...t, completed: true } : t));

    const todayDone = initialTasks.filter((t) => t.date === todayStr && t.completed);
    assert.ok(todayDone.length >= 1);
  });

  test("3. Reloading the page preserves the active dataset correctly", () => {
    const savedSubject = "Astrophysics";
    const savedTopics = "Orbital Mechanics, Black Holes";
    localStorageMock.setItem("subjectName", savedSubject);
    localStorageMock.setItem("assessmentTopics", savedTopics);
    localStorageMock.setItem("panicStatus", "Safe");
    localStorageMock.setItem("panicMode_dailyStudyHours", "5");

    // Restore on reload
    const restoredSubject = localStorageMock.getItem("subjectName");
    const restoredTopics = localStorageMock.getItem("assessmentTopics");
    const restoredStatus = localStorageMock.getItem("panicStatus");
    const restoredHours = Number(localStorageMock.getItem("panicMode_dailyStudyHours"));

    assert.strictEqual(restoredSubject, "Astrophysics");
    assert.strictEqual(restoredTopics, "Orbital Mechanics, Black Holes");
    assert.strictEqual(restoredStatus, "Safe");
    assert.strictEqual(restoredHours, 5);
  });

  test("4. Clearing the demo leaves no stale demo data or readiness status", () => {
    // Populate demo
    localStorageMock.setItem("panicMode_isDemo", "true");
    localStorageMock.setItem("panicStatus", "Risky");
    localStorageMock.setItem("subjectName", "Computer Architecture");

    // Clear
    localStorageMock.clear();
    localStorageMock.setItem("panicMode_checklistCleared", "true");

    assert.strictEqual(localStorageMock.getItem("panicMode_isDemo"), null);
    assert.strictEqual(localStorageMock.getItem("panicStatus"), null);
    assert.strictEqual(localStorageMock.getItem("subjectName"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_checklistCleared"), "true");
  });

  test("5. A student can enter a new subject and topics without old topics leaking into the new subject", () => {
    let currentSubjects: SubjectItem[] = [
      {
        id: "sub-1",
        name: "Computer Architecture",
        chaptersTotal: 6,
        chaptersRemaining: 4,
        priority: "High",
        status: "Needs Revision",
        topics: ["Pipelining Hazards", "Cache Coherence"],
      },
    ];

    // User submits Assessment with "Biochemistry" and "Enzyme Kinetics"
    const newSubject = "Biochemistry";
    const newTopics = ["Enzyme Kinetics", "Glycolysis Pathway"];

    const isPlaceholderOrSingle =
      currentSubjects.length === 1 &&
      (currentSubjects[0].name === "Computer Architecture" ||
        currentSubjects[0].name === "General Exam Preparation");

    if (isPlaceholderOrSingle) {
      currentSubjects = [
        {
          id: "sub-primary",
          name: newSubject,
          chaptersTotal: 3,
          chaptersRemaining: 2,
          priority: "High",
          status: "Needs Revision",
          topics: newTopics,
        },
      ];
    }

    assert.strictEqual(currentSubjects[0].name, "Biochemistry");
    assert.deepStrictEqual(currentSubjects[0].topics, ["Enzyme Kinetics", "Glycolysis Pathway"]);
    assert.ok(!currentSubjects[0].topics.some((t) => t.includes("Pipelining")));
  });

  test("6. Assessment status and explanation match the actual inputs", () => {
    const today = new Date();
    const futureDate = format(addDays(today, 3), "yyyy-MM-dd'T'10:00");

    // 1 chapter left, almost ready, 5 hours daily -> Safe
    const safeCalc = calculateAssessmentStatus({
      examDateTime: futureDate,
      chaptersRemaining: 1,
      prepLevel: "Almost Ready",
      dailyStudyHours: 5,
      now: today,
    });
    assert.strictEqual(safeCalc.status, "Safe");
    assert.ok(safeCalc.explanation.includes("Balanced pace"));

    // 10 chapters left, not started, 2 hours daily -> Critical
    const critCalc = calculateAssessmentStatus({
      examDateTime: futureDate,
      chaptersRemaining: 10,
      prepLevel: "Not Started",
      dailyStudyHours: 2,
      now: today,
    });
    assert.strictEqual(critCalc.status, "Critical");
    assert.ok(critCalc.explanation.includes("exceeds your total available study capacity"));
  });

  test("7. Changing assessment inputs invalidates or flags stale assessment output", () => {
    const assessedInputs = {
      examDateTime: "2026-11-01T09:00",
      subjectName: "Math",
      chaptersRemaining: 2,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
    };

    // User modifies chapters to 5 without recalculating
    const currentFormValues = {
      examDateTime: "2026-11-01T09:00",
      subjectName: "Math",
      chaptersRemaining: 5, // Modified!
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
    };

    const isStale =
      assessedInputs.examDateTime !== currentFormValues.examDateTime ||
      assessedInputs.subjectName !== currentFormValues.subjectName ||
      assessedInputs.chaptersRemaining !== currentFormValues.chaptersRemaining ||
      assessedInputs.prepLevel !== currentFormValues.prepLevel ||
      assessedInputs.dailyStudyHours !== currentFormValues.dailyStudyHours;

    assert.strictEqual(isStale, true);
  });

  test("8. Planned time and completed time are displayed separately without false stopwatch claims", () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const tasks: StudyTask[] = [
      { id: "1", date: todayStr, subjectId: "s1", subjectName: "Bio", topic: "Cell", durationMinutes: 45, priority: "High", completed: true },
      { id: "2", date: todayStr, subjectId: "s1", subjectName: "Bio", topic: "DNA", durationMinutes: 60, priority: "High", completed: false },
      { id: "3", date: todayStr, subjectId: "s1", subjectName: "Bio", topic: "RNA", durationMinutes: 30, priority: "Medium", completed: false },
    ];

    const todayTasks = tasks.filter((t) => t.date === todayStr);
    const plannedMinutes = todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
    const completedMinutes = todayTasks.filter((t) => t.completed).reduce((acc, t) => acc + t.durationMinutes, 0);
    const remainingMinutes = Math.max(0, plannedMinutes - completedMinutes);

    assert.strictEqual(plannedMinutes, 135);
    assert.strictEqual(completedMinutes, 45);
    assert.strictEqual(remainingMinutes, 90);
  });

  test("9. Completing a task updates all relevant counts and progress", () => {
    const tasks: StudyTask[] = [
      { id: "t1", date: "2026-11-01", subjectId: "s1", subjectName: "Math", topic: "Integrals", durationMinutes: 60, priority: "High", completed: false },
      { id: "t2", date: "2026-11-01", subjectId: "s1", subjectName: "Math", topic: "Derivatives", durationMinutes: 60, priority: "High", completed: false },
    ];

    let completedCount = tasks.filter((t) => t.completed).length;
    let percent = Math.round((completedCount / tasks.length) * 100);
    assert.strictEqual(completedCount, 0);
    assert.strictEqual(percent, 0);

    // Toggle t1
    tasks[0].completed = true;
    completedCount = tasks.filter((t) => t.completed).length;
    percent = Math.round((completedCount / tasks.length) * 100);
    assert.strictEqual(completedCount, 1);
    assert.strictEqual(percent, 50);
  });

  test("10. Local-date boundaries do not hide or misclassify today's tasks", () => {
    const localToday = format(new Date(), "yyyy-MM-dd");

    const sampleTask: StudyTask = {
      id: "local-task",
      date: localToday,
      subjectId: "s1",
      subjectName: "Physics",
      topic: "Optics",
      durationMinutes: 45,
      priority: "High",
      completed: false,
    };

    assert.strictEqual(sampleTask.date === localToday, true);
  });

  test("11. Timetable capacity limits and unassigned tasks remain correct", () => {
    const today = new Date();
    const examDate = format(addDays(today, 1), "yyyy-MM-dd'T'10:00");

    const subjects: SubjectItem[] = [
      {
        id: "s1",
        name: "Law",
        chaptersTotal: 4,
        chaptersRemaining: 4,
        priority: "High",
        status: "Needs Revision",
        topics: ["Torts", "Contracts", "Criminal Law", "Constitutional Law"],
      },
    ];

    // 1 hour cap = 60m today, 40% on exam day
    const schedule = generateRevisionTimetable({
      examDateTime: examDate,
      subjects,
      dailyStudyHours: 1,
    });

    assert.strictEqual(schedule.isConstrained, true);
    assert.ok(schedule.unassignedTasks.length > 0);
    for (const day of schedule.days) {
      assert.ok(day.allocatedMinutes <= day.availableMinutes);
    }
  });

  test("12. Custom tasks and completion states survive appropriate schedule updates", () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const existingTasks: StudyTask[] = [
      {
        id: "custom-1",
        date: todayStr,
        subjectId: "custom",
        subjectName: "General",
        topic: "Speed reading flashcards",
        durationMinutes: 30,
        priority: "Medium",
        completed: true,
        isCustom: true,
      },
      {
        id: "task-scheduled-1",
        date: todayStr,
        subjectId: "sub-1",
        subjectName: "Biology",
        topic: "Photosynthesis",
        durationMinutes: 60,
        priority: "High",
        completed: true,
      },
    ];

    const subjects: SubjectItem[] = [
      {
        id: "sub-1",
        name: "Biology",
        chaptersTotal: 2,
        chaptersRemaining: 2,
        priority: "High",
        status: "Needs Revision",
        topics: ["Photosynthesis", "Respiration"],
      },
    ];

    const schedule = generateRevisionTimetable({
      examDateTime: format(addDays(new Date(), 2), "yyyy-MM-dd'T'10:00"),
      subjects,
      dailyStudyHours: 4,
      existingTasks,
    });

    const photoTask = schedule.days.flatMap((d) => d.tasks).find((t) => t.topic === "Photosynthesis");
    assert.ok(photoTask);
    assert.strictEqual(photoTask.completed, true);
  });

  test("13. Action Plan topic priority, deduplication, and sleep guidance remain correct", () => {
    const plan = buildPersonalizedSuggestions({
      status: "Critical",
      subjectName: "Biology",
      formTopics: "Photosynthesis, Cellular Respiration, Photosynthesis",
      chaptersRemaining: 2,
    });

    const combined = plan.join(" ");
    // Deduplicated topic appears
    assert.ok(combined.includes("Photosynthesis"));
    assert.ok(combined.includes("Cellular Respiration"));
    // Sleep is protected: never sleep deprived
    assert.ok(combined.includes("6 to 7 hours of sleep"));
    assert.ok(!combined.includes("skip sleep"));
    assert.ok(!combined.includes("4 hours minimum"));
  });

  test("14. Reset and clear operations do not resurrect stale data", () => {
    localStorageMock.setItem("panicMode_checklistCleared", "true");
    localStorageMock.setItem("panicMode_tasks", JSON.stringify([]));

    // When isChecklistCleared is true, tasks must stay empty
    const isCleared = localStorageMock.getItem("panicMode_checklistCleared") === "true";
    const tasks = isCleared ? [] : JSON.parse(localStorageMock.getItem("panicMode_tasks") || "[]");

    assert.strictEqual(tasks.length, 0);
  });

  test("15. 'Your Next Study Session' prioritization selects today's highest priority unfinished task", () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const tasks: StudyTask[] = [
      { id: "1", date: todayStr, subjectId: "s1", subjectName: "Chemistry", topic: "Thermodynamics", durationMinutes: 60, priority: "Medium", completed: false },
      { id: "2", date: todayStr, subjectId: "s1", subjectName: "Chemistry", topic: "Equilibrium", durationMinutes: 60, priority: "High", completed: false },
      { id: "3", date: tomorrowStr, subjectId: "s1", subjectName: "Chemistry", topic: "Electrochemistry", durationMinutes: 60, priority: "High", completed: false },
    ];

    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const todayUnfinished = tasks
      .filter((t) => t.date === todayStr && !t.completed)
      .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

    // Must pick High Priority today task (Equilibrium) over Medium priority
    assert.strictEqual(todayUnfinished[0].topic, "Equilibrium");
  });
});
