import { differenceInSeconds, differenceInCalendarDays, parseISO, isValid } from "date-fns";
import type { PanicStatus, PrepLevel, AssessmentResult } from "@/types/exam";

export const HOURS_PER_CHAPTER: Record<PrepLevel, number> = {
  "Not Started": 3.0,
  "Barely Started": 2.2,
  "Partially Done": 1.4,
  "Almost Ready": 0.7,
};

export function calculateAssessmentStatus({
  examDateTime,
  chaptersRemaining,
  prepLevel,
  dailyStudyHours,
  now = new Date(),
}: {
  examDateTime: string;
  chaptersRemaining: number;
  prepLevel: PrepLevel;
  dailyStudyHours: number;
  now?: Date;
}): AssessmentResult {
  if (!examDateTime) {
    return {
      status: null,
      error: "Please set your exam date and time to assess your situation.",
      requiredStudyHours: 0,
      availableStudyHours: 0,
      workloadRatio: 0,
      explanation: "Exam date and time is required.",
      totalHoursUntilExam: 0,
    };
  }

  let examDate: Date;
  try {
    examDate = parseISO(examDateTime);
  } catch {
    return {
      status: null,
      error: "Please enter a valid exam date and time.",
      requiredStudyHours: 0,
      availableStudyHours: 0,
      workloadRatio: 0,
      explanation: "Invalid exam date format.",
      totalHoursUntilExam: 0,
    };
  }

  if (!isValid(examDate) || isNaN(examDate.getTime())) {
    return {
      status: null,
      error: "Please enter a valid exam date and time.",
      requiredStudyHours: 0,
      availableStudyHours: 0,
      workloadRatio: 0,
      explanation: "Invalid exam date format.",
      totalHoursUntilExam: 0,
    };
  }

  const diffSec = differenceInSeconds(examDate, now);
  if (diffSec <= 0) {
    return {
      status: null,
      isPastDate: true,
      error: "The specified exam date and time is in the past. Please select a future date.",
      requiredStudyHours: 0,
      availableStudyHours: 0,
      workloadRatio: 0,
      explanation: "Exam date has already passed.",
      totalHoursUntilExam: 0,
    };
  }

  const totalHoursUntilExam = Number((diffSec / 3600).toFixed(1));
  const calendarDaysSpan = Math.max(1, differenceInCalendarDays(examDate, now) + 1);

  // Available study hours before exam based on daily capacity
  // On the exam day itself, allocate ~40% of daily capacity for light final recap
  const safeDailyHours = Math.max(0.5, dailyStudyHours || 4);
  const availableStudyHours = Number(
    (
      calendarDaysSpan === 1
        ? Math.min(totalHoursUntilExam * 0.7, safeDailyHours * 0.4)
        : (calendarDaysSpan - 1) * safeDailyHours + safeDailyHours * 0.4
    ).toFixed(1)
  );

  // Required revision study hours based on chapters left and preparation level
  const hoursPerChapter = HOURS_PER_CHAPTER[prepLevel] || 2.0;
  const chapters = Math.max(1, chaptersRemaining || 1);
  const requiredStudyHours = Number((chapters * hoursPerChapter).toFixed(1));

  // Workload ratio = required hours / available study hours
  const workloadRatio = Number((requiredStudyHours / Math.max(0.5, availableStudyHours)).toFixed(2));

  let status: PanicStatus;
  let explanation: string;

  // Immediate time-critical emergencies:
  if (totalHoursUntilExam < 12 && chapters > 1) {
    status = "Critical";
    explanation = `Under 12 hours remaining with ${chapters} chapters left. Emergency revision required.`;
  } else if (totalHoursUntilExam < 24 && prepLevel === "Not Started" && chapters > 2) {
    status = "Critical";
    explanation = `Under 24 hours with untouched material (${chapters} chapters). Immediate focused cramming needed.`;
  } else if (workloadRatio > 1.15) {
    status = "Critical";
    explanation = `Estimated study required (${requiredStudyHours}h) exceeds your total available study capacity (${availableStudyHours}h). Pace is severely constrained.`;
  } else if (workloadRatio > 0.72 || totalHoursUntilExam < 36) {
    status = "Risky";
    explanation = `High concentration needed: requires ${requiredStudyHours}h of your ${availableStudyHours}h available study time (${Math.round(workloadRatio * 100)}% capacity).`;
  } else {
    status = "Safe";
    explanation = `Balanced pace: ${requiredStudyHours}h required across ${availableStudyHours}h available study time (${Math.round(workloadRatio * 100)}% capacity). You have a comfortable buffer.`;
  }

  return {
    status,
    requiredStudyHours,
    availableStudyHours,
    workloadRatio,
    explanation,
    totalHoursUntilExam,
  };
}
