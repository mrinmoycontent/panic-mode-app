import { test, describe } from "node:test";
import assert from "node:assert";
import {
  detectSubjectDiscipline,
  generateSubjectRecommendations,
  calculateHoursLeft,
  normalizeTopics,
  isSyntheticTopic,
  type SubjectRecommendationItem,
} from "../recommendationEngine.ts";
import type { SubjectItem, StudyTask } from "@/types/exam";

describe("recommendationEngine — Comprehensive Acceptance Tests", () => {
  const sampleSavedSubjects: SubjectItem[] = [
    {
      id: "sub-math",
      name: "Mathematics",
      chaptersTotal: 6,
      chaptersRemaining: 3,
      priority: "High",
      status: "Needs Revision",
      topics: ["Calculus", "Probability"],
    },
    {
      id: "sub-bio",
      name: "Biology",
      chaptersTotal: 4,
      chaptersRemaining: 2,
      priority: "High",
      status: "Needs Revision",
      topics: ["Cell Biology", "Genetics"],
    },
  ];

  // -------------------------------------------------------------
  // Scenario 1: Mathematics + Algebra
  // -------------------------------------------------------------
  test("1. Scenario: Mathematics with 'Algebra' produces active calculation, formulas, and error audits", () => {
    const recs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Mathematics",
      formTopics: "Linear Algebra, Quadratic Equations",
      prepLevel: "Partially Done",
      chaptersRemaining: 2,
    });

    assert.strictEqual(recs.length, 6);
    assert.strictEqual(detectSubjectDiscipline("Mathematics"), "mathematics");
    assert.strictEqual(recs[0].discipline, "mathematics");

    const titles = recs.map((r) => r.title);
    assert.ok(titles.includes("Active Formula & Theorem Derivation"));
    assert.ok(titles.includes("Deliberate Problem Calculation"));
    assert.ok(titles.includes("Algebraic Error Audit & Mistake Log"));
    assert.ok(titles.includes("Timed Exam Simulation & Past Papers"));
    assert.ok(titles.includes("Edge Cases & Theorem Restrictions"));

    const combinedText = recs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(combinedText.includes("Linear Algebra"));
    assert.ok(combinedText.includes("Quadratic Equations"));
    assert.match(combinedText, /formula|theorem/i);
    assert.match(combinedText, /calculation|algebraic/i);
  });

  // -------------------------------------------------------------
  // Scenario 2: Biology + Cell Biology
  // -------------------------------------------------------------
  test("2. Scenario: Biology with 'Cell Biology' produces diagram drills, keyword precision, and process sequencing", () => {
    const recs = generateSubjectRecommendations({
      status: "Risky",
      subjectName: "Biology",
      formTopics: "Cell Biology, Organelles",
      prepLevel: "Barely Started",
      chaptersRemaining: 3,
    });

    assert.strictEqual(detectSubjectDiscipline("Biology"), "biology");
    assert.strictEqual(recs[0].discipline, "biology");

    const titles = recs.map((r) => r.title);
    assert.ok(titles.includes("Anatomical & Pathway Diagram Drill"));
    assert.ok(titles.includes("Scientific Terminology & Keyword Precision"));
    assert.ok(titles.includes("Step-by-Step Process Sequencing"));
    assert.ok(titles.includes("Comparative Distinctions & Summary Tables"));

    const combinedText = recs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(combinedText.includes("Cell Biology"));
    assert.match(combinedText, /diagram|flowchart/i);
    assert.match(combinedText, /enzyme|membrane|keyword/i);
  });

  // -------------------------------------------------------------
  // Scenario 3: History + Event (French Revolution)
  // -------------------------------------------------------------
  test("3. Scenario: History with 'French Revolution' produces timeline, triggers vs causes, and PEEL essay structure", () => {
    const recs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "History",
      formTopics: "French Revolution, Fall of the Bastille",
      prepLevel: "Almost Ready",
      chaptersRemaining: 2,
    });

    assert.strictEqual(detectSubjectDiscipline("Modern World History"), "history");
    assert.strictEqual(recs[0].discipline, "history");

    const titles = recs.map((r) => r.title);
    assert.ok(titles.includes("Chronological Master Timeline"));
    assert.ok(titles.includes("Causal Flowcharts (Triggers vs Underlying Causes)"));
    assert.ok(titles.includes("Primary Sources & Historiographical Perspectives"));
    assert.ok(titles.includes("Thematic Essay Outlining (PEEL/TEEL)"));

    const combinedText = recs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(combinedText.includes("French Revolution"));
    assert.match(combinedText, /timeline|chronological/i);
    assert.match(combinedText, /causes|triggers/i);
    assert.match(combinedText, /PEEL|thesis|essay/i);
  });

  // -------------------------------------------------------------
  // Scenario 4: Broad Core Disciplines Verification
  // -------------------------------------------------------------
  test("4. Scenario: Supports Physics, Chemistry, Geography, English, Computer Science, Economics, Political Science", () => {
    // Physics
    const physicsRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "AP Physics C",
      formTopics: "Rotational Dynamics",
    });
    assert.strictEqual(physicsRecs[0].discipline, "physics");
    assert.ok(physicsRecs.some((r) => r.title.includes("Free-Body Diagrams")));
    assert.ok(physicsRecs.some((r) => r.title.includes("Dimensional & Unit")));

    // Chemistry
    const chemRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Organic Chemistry",
      formTopics: "Electrophilic Addition",
    });
    assert.strictEqual(chemRecs[0].discipline, "chemistry");
    assert.ok(chemRecs.some((r) => r.title.includes("Balanced Chemical Equations")));
    assert.ok(chemRecs.some((r) => r.title.includes("Stoichiometry")));

    // Geography
    const geoRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Physical Geography",
      formTopics: "Plate Tectonics",
    });
    assert.strictEqual(geoRecs[0].discipline, "geography");
    assert.ok(geoRecs.some((r) => r.title.includes("Spatial Patterns & Annotated Sketch Maps")));
    assert.ok(geoRecs.some((r) => r.title.includes("Case Study Fact Matrix")));

    // English
    const engRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "English Literature",
      formTopics: "Macbeth Act 1",
    });
    assert.strictEqual(engRecs[0].discipline, "english");
    assert.ok(engRecs.some((r) => r.title.includes("Thematic Matrix")));
    assert.ok(engRecs.some((r) => r.title.includes("Versatile Textual Evidence Bank")));

    // Computer Science
    const csRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Computer Science",
      formTopics: "Binary Search Trees",
    });
    assert.strictEqual(csRecs[0].discipline, "computer_science");
    assert.ok(csRecs.some((r) => r.title.includes("Trace Table Dry-Run")));
    assert.ok(csRecs.some((r) => r.title.includes("Big-O Time & Space Complexity")));

    // Economics
    const econRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Macroeconomics",
      formTopics: "Fiscal Policy Multipliers",
    });
    assert.strictEqual(econRecs[0].discipline, "economics");
    assert.ok(econRecs.some((r) => r.title.includes("Economic Diagrams")));
    assert.ok(econRecs.some((r) => r.title.includes("Transmission Chains")));

    // Political Science
    const poliRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Political Science",
      formTopics: "Constitutional Separation of Powers",
    });
    assert.strictEqual(poliRecs[0].discipline, "political_science");
    assert.ok(poliRecs.some((r) => r.title.includes("Constitutional Articles")));
    assert.ok(poliRecs.some((r) => r.title.includes("Judicial Decisions")));
  });

  // -------------------------------------------------------------
  // Scenario 5: Unfamiliar / Custom Subjects and Topics
  // -------------------------------------------------------------
  test("5. Scenario: Custom / unfamiliar subject ('Linguistics 101') handles topics without hallucinating", () => {
    const customRecs = generateSubjectRecommendations({
      status: "Critical",
      subjectName: "Linguistics 101",
      formTopics: "Phonological Assimilation Rules",
      prepLevel: "Not Started",
      chaptersRemaining: 2,
    });

    assert.strictEqual(customRecs.length, 6);
    // General structured academic mastery
    assert.strictEqual(customRecs[0].discipline, "general");
    const combined = customRecs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(combined.includes("Phonological Assimilation Rules"));
    assert.ok(combined.includes("Linguistics 101"));
    assert.match(combined, /definitions|principles|Feynman/i);
  });

  // -------------------------------------------------------------
  // Scenario 6: Different Prep Levels for Same Subject/Topic
  // -------------------------------------------------------------
  test("6. Scenario: Differentiates guidance between 'Not Started' and 'Almost Ready'", () => {
    const notStartedRecs = generateSubjectRecommendations({
      status: "Risky",
      subjectName: "Mathematics",
      formTopics: "Calculus",
      prepLevel: "Not Started",
    });

    const almostReadyRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Mathematics",
      formTopics: "Calculus",
      prepLevel: "Almost Ready",
    });

    assert.ok(notStartedRecs[0].prepContext?.includes("Foundation Phase"));
    assert.ok(notStartedRecs[0].prepContext?.includes("Master fundamental definitions"));

    assert.ok(almostReadyRecs[0].prepContext?.includes("Exam Readiness Phase"));
    assert.ok(almostReadyRecs[0].prepContext?.includes("timed exam simulations"));
  });

  // -------------------------------------------------------------
  // Scenario 7: Time Horizons (<12h, <24h, >3 days)
  // -------------------------------------------------------------
  test("7. Scenario: Differentiates urgent <12h triage from >3 days comprehensive revision", () => {
    const urgentRecs = generateSubjectRecommendations({
      status: "Critical",
      subjectName: "Chemistry",
      formTopics: "Acids and Bases",
      timeLeft: { days: 0, hours: 8, minutes: 30, seconds: 0 },
    });

    const structuredRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Chemistry",
      formTopics: "Acids and Bases",
      timeLeft: { days: 5, hours: 10, minutes: 0, seconds: 0 },
    });

    assert.ok(urgentRecs[0].timeContext?.includes("Urgent deadline (<12h left)"));
    assert.ok(urgentRecs[0].timeContext?.includes("Skip non-essential reading"));

    assert.ok(structuredRecs[0].timeContext?.includes("Structured Revision (>3 Days)"));
    assert.ok(structuredRecs[0].timeContext?.includes("progressive difficulty"));
  });

  // -------------------------------------------------------------
  // Scenario 8: Next / Back Stepper Navigation Logic & Invariants
  // -------------------------------------------------------------
  test("8. Scenario: Next and Back stepper navigation preserves state and enforces bounds", () => {
    const recs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Physics",
      formTopics: "Thermodynamics",
    });

    assert.strictEqual(recs.length, 6);

    // Initial state: Step 0
    let currentIndex = 0;
    assert.strictEqual(currentIndex, 0);
    const step0Title = recs[currentIndex].title;

    // Simulate clicking "Next"
    if (currentIndex < recs.length - 1) {
      currentIndex += 1;
    }
    assert.strictEqual(currentIndex, 1);
    assert.strictEqual(recs[currentIndex].id, 2);

    // Simulate clicking "Next" again to Step 2
    if (currentIndex < recs.length - 1) {
      currentIndex += 1;
    }
    assert.strictEqual(currentIndex, 2);

    // Simulate clicking "Back" — MUST restore exact previous state
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
    assert.strictEqual(currentIndex, 1);
    assert.strictEqual(recs[currentIndex].id, 2);

    // Simulate clicking "Back" again to Step 0
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
    assert.strictEqual(currentIndex, 0);
    assert.strictEqual(recs[currentIndex].title, step0Title);

    // Verify boundary: Back on Step 0 cannot go below 0
    const clampedBack = Math.max(0, currentIndex - 1);
    assert.strictEqual(clampedBack, 0);

    // Fast-forward to final step
    currentIndex = recs.length - 1;
    assert.strictEqual(currentIndex, 5);
    // Next at end is capped
    const clampedNext = Math.min(recs.length - 1, currentIndex + 1);
    assert.strictEqual(clampedNext, 5);

    // Restart set action
    currentIndex = 0;
    assert.strictEqual(currentIndex, 0);
    assert.strictEqual(recs[currentIndex].title, step0Title);
  });

  // -------------------------------------------------------------
  // Scenario 9: Duplicate Prevention
  // -------------------------------------------------------------
  test("9. Scenario: Every recommendation item within a session is unique", () => {
    const recs = generateSubjectRecommendations({
      status: "Risky",
      subjectName: "Computer Science",
      formTopics: "Recursion, Dynamic Programming",
    });

    const seenIds = new Set<number>();
    const seenTitles = new Set<string>();

    for (const rec of recs) {
      assert.ok(!seenIds.has(rec.id), `Duplicate ID found: ${rec.id}`);
      assert.ok(!seenTitles.has(rec.title), `Duplicate Title found: ${rec.title}`);
      seenIds.add(rec.id);
      seenTitles.add(rec.title);
    }

    assert.strictEqual(recs.length, seenTitles.size);
  });

  // -------------------------------------------------------------
  // Scenario 10: Empty Topic Input — Clean Subject-Level Wording
  // -------------------------------------------------------------
  test("10. Scenario: Empty topic input returns meaningful subject-level guidance without fabricated chapter names", () => {
    // Null status returns empty array
    // @ts-expect-error testing null status
    const emptyRecs = generateSubjectRecommendations({ status: null });
    assert.deepStrictEqual(emptyRecs, []);

    // Empty topics generates subject-level guidance
    const fallbackRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Economics",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 4,
    });

    assert.strictEqual(fallbackRecs.length, 6);
    const combined = fallbackRecs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(combined.includes("Economics"));

    // CRITICAL: NEVER contains synthetic chapter labels or awkward repetition
    assert.ok(!combined.includes("Chapter 1"));
    assert.ok(!combined.includes("Chapter 2"));
    assert.ok(!combined.includes("Chapter 3"));
    assert.ok(!combined.includes("Chapter 4"));
    assert.ok(!combined.includes("Economics in Economics"));
    assert.ok(!combined.includes("Economics (Economics)"));
    assert.match(combined, /syllabus|market|macroeconomic/i);
  });

  // -------------------------------------------------------------
  // Scenario 11: Sleep Protection (Never Sleep Deprived)
  // -------------------------------------------------------------
  test("11. Scenario: Strict sleep protection across all statuses", () => {
    const safeRecs = generateSubjectRecommendations({ status: "Safe", subjectName: "Biology" });
    const riskyRecs = generateSubjectRecommendations({ status: "Risky", subjectName: "Biology" });
    const critRecs = generateSubjectRecommendations({ status: "Critical", subjectName: "Biology" });

    const safeSleep = safeRecs[5].description;
    const riskySleep = riskyRecs[5].description;
    const critSleep = critRecs[5].description;

    assert.match(safeSleep, /8 hours/i);
    assert.match(riskySleep, /7 hours/i);
    assert.match(critSleep, /6 to 7 hours/i);

    // CRITICAL MUST NEVER RECOMMEND ALL-NIGHTERS
    assert.ok(!critSleep.includes("skip sleep"));
    assert.ok(!critSleep.includes("all night studying"));
    assert.match(critSleep, /staying awake all night causes memory blanks/i);
  });

  // -------------------------------------------------------------
  // Scenario 12: Priority Resolution & Saved Subject Fallback
  // -------------------------------------------------------------
  test("12. Scenario: Prioritizes form topics > saved subjects > clean subject guidance", () => {
    // Priority 1: Form topics override saved subjects
    const withForm = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Biology",
      formTopics: "Ecology and Biomes",
      savedSubjects: sampleSavedSubjects, // saved topics: "Cell Biology", "Genetics"
    });
    assert.ok(withForm[0].description.includes("Ecology and Biomes"));
    assert.ok(!withForm[0].description.includes("Cell Biology"));

    // Priority 2: Empty form topics fall back to saved subjects
    const withSaved = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Biology",
      formTopics: "  ",
      savedSubjects: sampleSavedSubjects,
    });
    assert.ok(withSaved[0].description.includes("Cell Biology"));

    // Priority 3: Fall back to meaningful subject-level guidance if neither exists
    const withNeither = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Biology",
      formTopics: "",
      savedSubjects: [],
      chaptersRemaining: 3,
    });

    const neitherCombined = withNeither.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(!neitherCombined.includes("Chapter 1"));
    assert.ok(!neitherCombined.includes("Chapter 2"));
    assert.ok(!neitherCombined.includes("Chapter 3"));
    assert.ok(!neitherCombined.includes("Biology in Biology"));
    assert.ok(neitherCombined.includes("Biology"));
  });

  // -------------------------------------------------------------
  // Scenario 13: Legacy Placeholder Cleaning in Saved Subjects & Tasks
  // -------------------------------------------------------------
  test("13. Scenario: Legacy placeholder topics in saved subjects are rejected and cleaned", () => {
    const legacySavedSubjects: SubjectItem[] = [
      {
        id: "sub-legacy-math",
        name: "Mathematics",
        chaptersTotal: 4,
        chaptersRemaining: 3,
        priority: "High",
        status: "Needs Revision",
        topics: ["Mathematics: Chapter 1", "Mathematics: Chapter 2", "Chapter 3", "B: Chapter 1"],
      },
    ];

    // When saved subject contains only synthetic labels, recommendation engine treats it as empty topics
    const recs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Mathematics",
      formTopics: "",
      savedSubjects: legacySavedSubjects,
      chaptersRemaining: 3,
    });

    const combined = recs.map((r) => r.description + " " + r.actionableStep).join(" ");
    assert.ok(!combined.includes("Mathematics: Chapter 1"));
    assert.ok(!combined.includes("Chapter 2"));
    assert.ok(!combined.includes("Chapter 3"));
    assert.ok(!combined.includes("B: Chapter 1"));
    assert.ok(combined.includes("Mathematics"));

    // Test cleaning legacy tasks
    const legacyTasks: StudyTask[] = [
      { id: "1", date: "2026-10-26", subjectId: "s1", subjectName: "Mathematics", topic: "Mathematics: Chapter 1", durationMinutes: 45, priority: "High", completed: false },
      { id: "2", date: "2026-10-26", subjectId: "s1", subjectName: "Mathematics", topic: "B: Chapter 1", durationMinutes: 45, priority: "High", completed: false },
      { id: "3", date: "2026-10-26", subjectId: "s1", subjectName: "Mathematics", topic: "Calculus", durationMinutes: 45, priority: "High", completed: false },
    ];

    const cleanedTasks = legacyTasks.filter((t) => !isSyntheticTopic(t.topic));
    assert.strictEqual(cleanedTasks.length, 1);
    assert.strictEqual(cleanedTasks[0].topic, "Calculus");
  });

  // -------------------------------------------------------------
  // Scenario 14: No Invented Chapter Names Across All Ten Disciplines When Topics Blank
  // -------------------------------------------------------------
  test("14. Scenario: No invented chapter names across all 10 subjects when topics are blank", () => {
    const subjects = [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "English",
      "Computer Science",
      "Economics",
      "Political Science",
    ];

    for (const sub of subjects) {
      const recs = generateSubjectRecommendations({
        status: "Safe",
        subjectName: sub,
        formTopics: "",
        savedSubjects: [],
        chaptersRemaining: 3,
      });

      assert.strictEqual(recs.length, 6);
      const combined = recs.map((r) => r.description + " " + r.actionableStep).join(" ");

      assert.ok(!combined.includes("Chapter 1"), `${sub} contains "Chapter 1"`);
      assert.ok(!combined.includes("Chapter 2"), `${sub} contains "Chapter 2"`);
      assert.ok(!combined.includes("Chapter 3"), `${sub} contains "Chapter 3"`);
      assert.ok(!combined.includes(`${sub} in ${sub}`), `${sub} contains awkward duplicate "${sub} in ${sub}"`);
      assert.ok(combined.includes(sub), `${sub} recommendations must reference subject`);
    }
  });

  // -------------------------------------------------------------
  // Scenario 15: Subject Detection for Mathematical Disciplines & Polynomials
  // -------------------------------------------------------------
  test("15. Scenario: detectSubjectDiscipline correctly classifies Quadratic Equations, Polynomials, and math branches", () => {
    // Quadratic Equations
    assert.strictEqual(detectSubjectDiscipline("Quadratic Equations"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("quadratic equations"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Quadratics"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Quadratic Equation & Functions"), "mathematics");

    // Polynomials
    assert.strictEqual(detectSubjectDiscipline("Polynomials"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Polynomial Functions"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("polynomial"), "mathematics");

    // Core mathematical branches
    assert.strictEqual(detectSubjectDiscipline("Algebra"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Calculus"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Geometry"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Trigonometry"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Trig"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Differential Equations"), "mathematics");
  });

  // -------------------------------------------------------------
  // Scenario 16: Quadratic Equations Produces Tailored Subject-Specific Guidance
  // -------------------------------------------------------------
  test("16. Scenario: Quadratic Equations produces tailored recommendations covering standard form, methods, worked examples, roots, and mistakes", () => {
    const recs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Quadratic Equations",
      formTopics: "Discriminant, Quadratic Formula",
      prepLevel: "Partially Done",
      chaptersRemaining: 2,
    });

    assert.strictEqual(recs.length, 6);
    assert.strictEqual(recs[0].discipline, "mathematics");
    assert.strictEqual(recs[0].disciplineLabel, "Mathematics");

    const titles = recs.map((r) => r.title);
    assert.ok(titles.includes("Standard Form & Discriminant Analysis"));
    assert.ok(titles.includes("Solving Strategy: Factorisation, Completing the Square, or Formula"));
    assert.ok(titles.includes("Worked Examples with Step-by-Step Solutions"));
    assert.ok(titles.includes("Verifying Roots by Substitution"));
    assert.ok(titles.includes("Timed Exam Practice & Common Mistakes"));

    const combinedText = recs.map((r) => r.description + " " + r.actionableStep).join(" ");

    // 1. Standard form ax^2 + bx + c = 0 and discriminant b^2 - 4ac
    assert.match(combinedText, /standard form/i);
    assert.match(combinedText, /ax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*0|ax²\s*\+\s*bx\s*\+\s*c\s*=\s*0/i);
    assert.match(combinedText, /discriminant/i);
    assert.match(combinedText, /b\^2\s*-\s*4ac|b²\s*-\s*4ac/i);

    // 2. Choosing between factorisation, completing the square, and the quadratic formula
    assert.match(combinedText, /factorisation/i);
    assert.match(combinedText, /completing the square/i);
    assert.match(combinedText, /quadratic formula/i);

    // 3. Worked examples with step-by-step solutions
    assert.match(combinedText, /worked examples.*step-by-step|step-by-step worked solutions/i);

    // 4. Verifying roots by substitution
    assert.match(combinedText, /verifying roots by substitution|verify.*roots.*substitution/i);

    // 5. Timed exam practice and common mistakes
    assert.match(combinedText, /timed exam practice/i);
    assert.match(combinedText, /common mistakes/i);

    // Confirm generic recommendations are not returned
    assert.ok(!titles.includes("Core Concept Definitions & Axioms"));
    assert.ok(!titles.includes("Model Case / Problem Decomposition"));
  });

  // -------------------------------------------------------------
  // Scenario 17: Existing Subjects & Recommendation Behavior Unaffected
  // -------------------------------------------------------------
  test("17. Scenario: Existing subject classification and general fallback behavior remain intact", () => {
    assert.strictEqual(detectSubjectDiscipline("Mathematics"), "mathematics");
    assert.strictEqual(detectSubjectDiscipline("Physics"), "physics");
    assert.strictEqual(detectSubjectDiscipline("Chemistry"), "chemistry");
    assert.strictEqual(detectSubjectDiscipline("Biology"), "biology");
    assert.strictEqual(detectSubjectDiscipline("History"), "history");
    assert.strictEqual(detectSubjectDiscipline("Geography"), "geography");
    assert.strictEqual(detectSubjectDiscipline("English"), "english");
    assert.strictEqual(detectSubjectDiscipline("Computer Science"), "computer_science");
    assert.strictEqual(detectSubjectDiscipline("Economics"), "economics");
    assert.strictEqual(detectSubjectDiscipline("Political Science"), "political_science");
    assert.strictEqual(detectSubjectDiscipline("Linguistics 101"), "general");

    // Standard Mathematics recommendations are still intact when not specifically quadratic
    const standardMathRecs = generateSubjectRecommendations({
      status: "Safe",
      subjectName: "Mathematics",
      formTopics: "Calculus",
    });
    const mathTitles = standardMathRecs.map((r) => r.title);
    assert.ok(mathTitles.includes("Active Formula & Theorem Derivation"));
    assert.ok(mathTitles.includes("Deliberate Problem Calculation"));
  });
});
