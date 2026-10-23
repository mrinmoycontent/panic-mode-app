import { test, describe } from "node:test";
import assert from "node:assert";
import {
  buildPersonalizedSuggestions,
  resolveTargetTopics,
} from "../actionPlanGenerator.ts";
import type { SubjectItem } from "@/types/exam";

describe("actionPlanGenerator", () => {
  const sampleSavedSubjects: SubjectItem[] = [
    {
      id: "sub-1",
      name: "Biology",
      chaptersTotal: 4,
      chaptersRemaining: 2,
      priority: "High",
      status: "Needs Revision",
      topics: ["Cellular Respiration", "Genetics"],
    },
    {
      id: "sub-2",
      name: "Computer Science",
      chaptersTotal: 5,
      chaptersRemaining: 3,
      priority: "High",
      status: "Needs Revision",
      topics: ["Dynamic Programming", "Cache Coherence"],
    },
  ];

  test("1. Scenario: Biology with topic 'Photosynthesis and Its Process' without hallucinating content", () => {
    const suggestions = buildPersonalizedSuggestions({
      status: "Safe",
      subjectName: "Biology",
      formTopics: "Photosynthesis and Its Process",
      chaptersRemaining: 2,
      dailyStudyHours: 4,
    });

    assert.ok(suggestions.length >= 4);

    // Verify exact topic name and subject appear in suggestions
    const combinedText = suggestions.join(" ");
    assert.ok(combinedText.includes("Photosynthesis and Its Process"));
    assert.ok(combinedText.includes("Biology"));

    // Verify it does NOT hallucinate subtopics not supplied by the student
    assert.ok(!combinedText.includes("Calvin cycle"));
    assert.ok(!combinedText.includes("light-dependent"));
    assert.ok(!combinedText.includes("chloroplast"));
    assert.ok(!combinedText.includes("ATP synthase"));
  });

  test("2. Scenario: A different subject with completely different topics", () => {
    const suggestions = buildPersonalizedSuggestions({
      status: "Risky",
      subjectName: "Computer Science",
      formTopics: "Dynamic Programming, Cache Coherence",
      chaptersRemaining: 3,
      dailyStudyHours: 4.5,
    });

    const combinedText = suggestions.join(" ");
    assert.ok(combinedText.includes("Computer Science"));
    assert.ok(combinedText.includes("Dynamic Programming"));
    assert.ok(combinedText.includes("Cache Coherence"));

    // Must NOT mention Biology or Photosynthesis
    assert.ok(!combinedText.includes("Biology"));
    assert.ok(!combinedText.includes("Photosynthesis"));
  });

  test("3. Scenario: Multiple comma-separated topics with deduplication and whitespace trimming", () => {
    const resolved = resolveTargetTopics({
      subjectName: "Physics",
      formTopics: "  Kinematics , Dynamics, Kinematics , rotational motion  ",
      chaptersRemaining: 3,
    });

    assert.strictEqual(resolved.isChapterFallback, false);
    assert.strictEqual(resolved.subject, "Physics");
    // Should deduplicate 'Kinematics' case-insensitively
    assert.deepStrictEqual(resolved.topics, ["Kinematics", "Dynamics", "rotational motion"]);

    const suggestions = buildPersonalizedSuggestions({
      status: "Critical",
      subjectName: "Physics",
      formTopics: "  Kinematics , Dynamics, Kinematics , rotational motion  ",
      chaptersRemaining: 3,
    });

    const combinedText = suggestions.join(" ");
    assert.ok(combinedText.includes("Kinematics"));
    assert.ok(combinedText.includes("Dynamics"));
  });

  test("4. Scenario: No topics entered — chapter-based fallback works cleanly", () => {
    const resolved = resolveTargetTopics({
      subjectName: "Organic Chemistry",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 3,
    });

    assert.strictEqual(resolved.isChapterFallback, true);
    assert.strictEqual(resolved.subject, "Organic Chemistry");
    assert.deepStrictEqual(resolved.topics, [
      "Organic Chemistry: Chapter 1",
      "Organic Chemistry: Chapter 2",
      "Organic Chemistry: Chapter 3",
    ]);

    const safeSuggestions = buildPersonalizedSuggestions({
      status: "Safe",
      subjectName: "Organic Chemistry",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 3,
    });

    const safeText = safeSuggestions.join(" ");
    assert.ok(safeText.includes("Organic Chemistry"));
    assert.ok(safeText.includes("3 chapters remaining"));

    const criticalSuggestions = buildPersonalizedSuggestions({
      status: "Critical",
      subjectName: "Organic Chemistry",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 3,
    });

    const critText = criticalSuggestions.join(" ");
    assert.ok(critText.includes("Organic Chemistry"));
    assert.ok(critText.includes("critical remaining chapter"));
  });

  test("5. Scenario: Status-specific plans and sleep guidance", () => {
    // SAFE
    const safePlan = buildPersonalizedSuggestions({
      status: "Safe",
      subjectName: "Biology",
      formTopics: "Photosynthesis and Its Process",
      chaptersRemaining: 2,
    });
    const safeText = safePlan.join(" ");
    assert.match(safeText, /systematically/i);
    assert.match(safeText, /practice questions/i);
    assert.match(safeText, /8 hours of (restorative )?sleep/i);
    // Safe must avoid emergency language
    assert.ok(!safeText.includes("Emergency"));
    assert.ok(!safeText.includes("Zero in exclusively"));

    // RISKY
    const riskyPlan = buildPersonalizedSuggestions({
      status: "Risky",
      subjectName: "Biology",
      formTopics: "Photosynthesis and Its Process",
      chaptersRemaining: 2,
    });
    const riskyText = riskyPlan.join(" ");
    assert.match(riskyText, /prioritize/i);
    assert.match(riskyText, /7 hours of sleep/i);

    // CRITICAL
    const critPlan = buildPersonalizedSuggestions({
      status: "Critical",
      subjectName: "Biology",
      formTopics: "Photosynthesis and Its Process",
      chaptersRemaining: 2,
    });
    const critText = critPlan.join(" ");
    assert.match(critText, /zero in exclusively/i);
    assert.match(critText, /6 to 7 hours of sleep/i);
    // CRITICAL MUST NEVER recommend sleep deprivation
    assert.ok(!critText.includes("skip sleep"));
    assert.ok(!critText.includes("4 hours minimum"));
    assert.match(critText, /staying awake all night causes memory blanks/i);
  });

  test("6. Scenario: Priority resolution (Form topics > Saved subject topics > Chapter fallback)", () => {
    // A: Form topics take precedence over saved subjects
    const withForm = resolveTargetTopics({
      subjectName: "Biology",
      formTopics: "Photosynthesis and Its Process",
      savedSubjects: sampleSavedSubjects, // has "Cellular Respiration", "Genetics"
    });
    assert.deepStrictEqual(withForm.topics, ["Photosynthesis and Its Process"]);

    // B: When form topics are empty, saved subject topics are used
    const withSaved = resolveTargetTopics({
      subjectName: "Biology",
      formTopics: "   ",
      savedSubjects: sampleSavedSubjects,
    });
    assert.deepStrictEqual(withSaved.topics, ["Cellular Respiration", "Genetics"]);

    // C: When both are empty, chapter-based fallback is used
    const withNeither = resolveTargetTopics({
      subjectName: "Biology",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 2,
    });
    assert.strictEqual(withNeither.isChapterFallback, true);
    assert.deepStrictEqual(withNeither.topics, ["Biology: Chapter 1", "Biology: Chapter 2"]);
  });
});
