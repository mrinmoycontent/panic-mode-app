import { test, describe } from "node:test";
import assert from "node:assert";
import { calculateAssessmentStatus, HOURS_PER_CHAPTER } from "../assessmentCalculator.ts";
import { addDays, subDays, addHours, formatISO } from "date-fns";

describe("assessmentCalculator", () => {
  const baseNow = new Date("2026-11-01T10:00:00Z");

  test("returns error for empty or missing exam date", () => {
    const result = calculateAssessmentStatus({
      examDateTime: "",
      chaptersRemaining: 3,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, null);
    assert.ok(result.error);
    assert.match(result.error, /Please set your exam date/i);
  });

  test("returns error for invalid date format", () => {
    const result = calculateAssessmentStatus({
      examDateTime: "invalid-not-a-date",
      chaptersRemaining: 3,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, null);
    assert.ok(result.error);
    assert.match(result.error, /valid exam date/i);
  });

  test("handles past exam dates correctly with isPastDate flag", () => {
    const pastDateStr = formatISO(subDays(baseNow, 2));
    const result = calculateAssessmentStatus({
      examDateTime: pastDateStr,
      chaptersRemaining: 3,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, null);
    assert.strictEqual(result.isPastDate, true);
    assert.match(result.error || "", /in the past/i);
  });

  test("calculates Safe status when study workload is comfortably manageable", () => {
    // 5 days away, 1 chapter left, almost ready, 4h daily cap
    const futureDateStr = formatISO(addDays(baseNow, 5));
    const result = calculateAssessmentStatus({
      examDateTime: futureDateStr,
      chaptersRemaining: 1,
      prepLevel: "Almost Ready",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, "Safe");
    assert.ok(result.workloadRatio < 0.72);
    assert.ok(result.explanation.includes("Balanced pace"));
  });

  test("calculates Risky status when study hours are tight relative to workload", () => {
    // 2 calendar days away, 5 chapters left, partially done (5 * 1.4 = 7.0h required; available ~ 9.6h => ~73% ratio)
    const futureDateStr = formatISO(addDays(baseNow, 2));
    const result = calculateAssessmentStatus({
      examDateTime: futureDateStr,
      chaptersRemaining: 5,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, "Risky");
    assert.ok(result.workloadRatio >= 0.72);
    assert.ok(result.workloadRatio <= 1.15);
    assert.ok(result.explanation.includes("High concentration needed"));
  });

  test("calculates Critical status when required study hours exceed capacity", () => {
    // 2 days away, 8 chapters left, not started (8 * 3.0 = 24h required; available ~ 5.6h)
    const futureDateStr = formatISO(addDays(baseNow, 2));
    const result = calculateAssessmentStatus({
      examDateTime: futureDateStr,
      chaptersRemaining: 8,
      prepLevel: "Not Started",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, "Critical");
    assert.ok(result.workloadRatio > 1.15);
    assert.ok(result.explanation.includes("exceeds your total available study capacity"));
  });

  test("escalates to Critical for urgent deadlines under 12 hours with multiple chapters", () => {
    // 8 hours away, 2 chapters
    const futureDateStr = formatISO(addHours(baseNow, 8));
    const result = calculateAssessmentStatus({
      examDateTime: futureDateStr,
      chaptersRemaining: 2,
      prepLevel: "Partially Done",
      dailyStudyHours: 4,
      now: baseNow,
    });

    assert.strictEqual(result.status, "Critical");
    assert.match(result.explanation, /Under 12 hours remaining/i);
  });

  test("differentiates outcomes properly across preparation levels", () => {
    const futureDateStr = formatISO(addDays(baseNow, 3));
    const prepLevels = ["Almost Ready", "Partially Done", "Barely Started", "Not Started"] as const;

    const results = prepLevels.map((level) =>
      calculateAssessmentStatus({
        examDateTime: futureDateStr,
        chaptersRemaining: 4,
        prepLevel: level,
        dailyStudyHours: 3.5,
        now: baseNow,
      })
    );

    // Required study hours must monotonically increase from Almost Ready to Not Started
    assert.ok(results[0].requiredStudyHours < results[1].requiredStudyHours);
    assert.ok(results[1].requiredStudyHours < results[2].requiredStudyHours);
    assert.ok(results[2].requiredStudyHours < results[3].requiredStudyHours);

    // Workload ratios must also strictly increase
    assert.ok(results[0].workloadRatio < results[1].workloadRatio);
    assert.ok(results[1].workloadRatio < results[2].workloadRatio);
    assert.ok(results[2].workloadRatio < results[3].workloadRatio);
  });
});
