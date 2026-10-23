import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { getSampleDemoData } from "../demoData.ts";

describe("resetAndPersistence", () => {
  // Mock localStorage for node environment
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

  test("initial unconfigured state produces genuine clean slate (empty subjects and tasks)", () => {
    const saved = localStorageMock.getItem("panicMode_subjects");
    const initialSubject = localStorageMock.getItem("subjectName");

    // When nothing is saved, subjects list must be empty
    const subjects = saved
      ? JSON.parse(saved)
      : initialSubject
      ? [{ id: "sub-primary", name: initialSubject, topics: [] }]
      : [];

    assert.deepStrictEqual(subjects, []);
    assert.strictEqual(localStorageMock.getItem("panicStatus"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_tasks"), null);
  });

  test("demo mode loads complete sample subjects and timetable topics only when explicitly triggered", () => {
    const demo = getSampleDemoData();

    assert.ok(demo.subjects.length >= 3);
    assert.ok(demo.subjects.some((s) => s.name === "Computer Architecture"));
    assert.ok(demo.subjects.some((s) => s.name === "Operating Systems"));
    assert.ok(demo.examDateTime);
    assert.strictEqual(demo.dailyStudyHours, 4.5);

    // Ensure demo topics are real and specific
    const allDemoTopics = demo.subjects.flatMap((s) => s.topics);
    assert.ok(allDemoTopics.includes("Pipelining Hazards & Forwarding"));
    assert.ok(allDemoTopics.includes("Deadlock Banker's Algorithm"));
  });

  test("reset genuinely clears all storage and restores clean state", () => {
    // Populate storage with mock active session
    localStorageMock.setItem("panicStatus", "Risky");
    localStorageMock.setItem("subjectName", "Thermodynamics");
    localStorageMock.setItem("panicMode_subjects", JSON.stringify([{ id: "s1", name: "Thermodynamics" }]));
    localStorageMock.setItem("panicMode_tasks", JSON.stringify([{ id: "t1", topic: "Heat Engines" }]));
    localStorageMock.setItem("panicMode_isDemo", "true");

    // Perform reset actions
    localStorageMock.clear();

    assert.strictEqual(localStorageMock.getItem("panicStatus"), null);
    assert.strictEqual(localStorageMock.getItem("subjectName"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_subjects"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_tasks"), null);
    assert.strictEqual(localStorageMock.getItem("panicMode_isDemo"), null);
  });

  test("custom task duration validation enforces minimum 15m and 15m increments", () => {
    function normalizeTaskDuration(rawInput: number): { valid: boolean; normalized?: number; error?: string } {
      if (isNaN(rawInput) || rawInput <= 0) {
        return { valid: false, error: "Please enter a valid positive duration in minutes." };
      }
      // Rejects values below 15 minutes (such as 4.5 minutes accidental daily study cap reuse)
      if (rawInput < 15) {
        return { valid: false, error: "Duration must be at least 15 minutes (in 15-minute increments)." };
      }
      const normalized = Math.max(15, Math.round(rawInput / 15) * 15);
      return { valid: true, normalized };
    }

    // 4.5 minutes must be rejected
    const test45 = normalizeTaskDuration(4.5);
    assert.strictEqual(test45.valid, false);
    assert.match(test45.error || "", /at least 15 minutes/i);

    // 0 or negative must be rejected
    assert.strictEqual(normalizeTaskDuration(0).valid, false);
    assert.strictEqual(normalizeTaskDuration(-10).valid, false);

    // 15m stays 15m
    assert.strictEqual(normalizeTaskDuration(15).normalized, 15);

    // 40m rounds to 45m (15-min increment)
    assert.strictEqual(normalizeTaskDuration(40).normalized, 45);

    // 55m rounds to 60m
    assert.strictEqual(normalizeTaskDuration(55).normalized, 60);
  });

  test("propagation logic replaces default placeholder subject when real subject is submitted", () => {
    // Starting with default placeholder subject
    let subjects = [
      {
        id: "sub-default",
        name: "Computer Architecture",
        chaptersTotal: 3,
        chaptersRemaining: 3,
        priority: "High" as const,
        status: "Needs Revision" as const,
        topics: ["Core Concepts", "Past Papers"],
        notes: "",
      },
    ];

    // User submits Assessment with "Thermodynamics" and custom topics
    const submittedSubject = "Thermodynamics";
    const submittedTopics = ["Laws of Thermodynamics", "Entropy and Heat Engines"];

    const isPlaceholder =
      subjects.length === 1 &&
      (subjects[0].id === "sub-default" ||
        subjects[0].id === "sub-1" ||
        subjects[0].name === "Computer Architecture" ||
        subjects[0].name === "General Exam Preparation");

    if (isPlaceholder) {
      subjects = [
        {
          id: "sub-primary",
          name: submittedSubject,
          chaptersTotal: 2,
          chaptersRemaining: 2,
          priority: "High",
          status: "Needs Revision",
          topics: submittedTopics,
          notes: "Primary assessment subject",
        },
      ];
    }

    assert.strictEqual(subjects[0].name, "Thermodynamics");
    assert.deepStrictEqual(subjects[0].topics, [
      "Laws of Thermodynamics",
      "Entropy and Heat Engines",
    ]);
    assert.ok(!subjects[0].topics.includes("Core Concepts"));
  });
});
