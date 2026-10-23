import type { PanicStatus, PrepLevel, SubjectItem } from "@/types/exam";

export interface ActionPlanInput {
  status: PanicStatus;
  subjectName?: string;
  formTopics?: string;
  savedSubjects?: SubjectItem[];
  chaptersRemaining?: number;
  prepLevel?: PrepLevel;
  dailyStudyHours?: number;
  timeLeft?: { days: number; hours: number; minutes: number; seconds: number } | null;
}

export interface ResolvedTopicsResult {
  topics: string[];
  isChapterFallback: boolean;
  subject: string;
}

/**
 * Resolves the target topics following strict priority:
 * 1. Topics entered in the current Assessment form
 * 2. Topics saved for that subject in Subjects Manager
 * 3. Chapter-based fallback guidance if no topics are available
 *
 * Avoids duplicate topics and empty values. Never hallucinates outside content.
 */
export function resolveTargetTopics({
  subjectName = "",
  formTopics = "",
  savedSubjects = [],
  chaptersRemaining = 1,
}: {
  subjectName?: string;
  formTopics?: string;
  savedSubjects?: SubjectItem[];
  chaptersRemaining?: number;
}): ResolvedTopicsResult {
  const cleanSubject = subjectName.trim() || "Target Exam";

  // Priority 1: Topics entered in current Assessment form
  if (formTopics && typeof formTopics === "string") {
    const rawParsed = formTopics
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const dedupedFormTopics: string[] = [];
    const seen = new Set<string>();
    for (const t of rawParsed) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        dedupedFormTopics.push(t);
      }
    }

    if (dedupedFormTopics.length > 0) {
      return {
        topics: dedupedFormTopics,
        isChapterFallback: false,
        subject: cleanSubject,
      };
    }
  }

  // Priority 2: Topics saved for that subject in Subjects Manager
  if (savedSubjects && Array.isArray(savedSubjects) && savedSubjects.length > 0) {
    const matchedSubject = savedSubjects.find(
      (s) => s.name.trim().toLowerCase() === cleanSubject.toLowerCase()
    );

    if (matchedSubject && Array.isArray(matchedSubject.topics)) {
      const validSaved = matchedSubject.topics
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const dedupedSaved: string[] = [];
      const seen = new Set<string>();
      for (const t of validSaved) {
        const lower = t.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          dedupedSaved.push(t);
        }
      }

      if (dedupedSaved.length > 0) {
        return {
          topics: dedupedSaved,
          isChapterFallback: false,
          subject: matchedSubject.name || cleanSubject,
        };
      }
    }
  }

  // Priority 3: Chapter-based fallback guidance
  const safeChapters = Math.max(1, chaptersRemaining || 1);
  const chapterFallback: string[] = [];
  const displayCount = Math.min(safeChapters, 4);
  for (let i = 1; i <= displayCount; i++) {
    chapterFallback.push(`${cleanSubject}: Chapter ${i}`);
  }

  return {
    topics: chapterFallback,
    isChapterFallback: true,
    subject: cleanSubject,
  };
}

/**
 * Formats a list of topics into natural English for inline guidance sentences.
 */
function formatTopicList(topics: string[]): string {
  if (topics.length === 0) return "your core syllabus";
  if (topics.length === 1) return `"${topics[0]}"`;
  if (topics.length === 2) return `"${topics[0]}" and "${topics[1]}"`;
  if (topics.length === 3) return `"${topics[0]}", "${topics[1]}", and "${topics[2]}"`;
  return `"${topics[0]}", "${topics[1]}", and ${topics.length - 2} other key topics`;
}

/**
 * Generates personalized, topic-aware revision guidance strictly tailored
 * to the student's actual inputs, assessment status, and available study time.
 */
export function buildPersonalizedSuggestions(input: ActionPlanInput): string[] {
  const {
    status,
    subjectName = "",
    formTopics = "",
    savedSubjects = [],
    chaptersRemaining = 1,
    dailyStudyHours = 4,
  } = input;

  const { topics, isChapterFallback, subject } = resolveTargetTopics({
    subjectName,
    formTopics,
    savedSubjects,
    chaptersRemaining,
  });

  const topicsPhrase = formatTopicList(topics);
  const primaryTopic = topics[0] ? `"${topics[0]}"` : `"${subject}"`;
  const secondaryTopic = topics[1] ? `"${topics[1]}"` : null;
  const chaptersCount = Math.max(1, chaptersRemaining || 1);
  const dailyHoursStr = (dailyStudyHours || 4).toString();

  switch (status) {
    case "Safe": {
      const tips: string[] = [];

      // Tip 1: Systematic topic review
      if (!isChapterFallback) {
        tips.push(
          `Review your notes for ${topicsPhrase} systematically, focusing on understanding key definitions, principles, and high-yield concepts in ${subject}.`
        );
      } else {
        tips.push(
          `Review your ${subject} notes chapter by chapter (${chaptersCount} chapters remaining), verifying core concepts and summaries for each section.`
        );
      }

      // Tip 2: Topic-based active practice
      if (!isChapterFallback) {
        tips.push(
          `Do practice questions and past-paper problems specifically targeting ${topicsPhrase}, testing yourself without referring to notes.`
        );
      } else {
        tips.push(
          `Solve targeted practice questions for each of the ${chaptersCount} remaining ${subject} chapters to test active recall.`
        );
      }

      // Tip 3: Mistake log
      tips.push(
        `Maintain a concise mistake log during practice for ${subject}: review every incorrect answer immediately to solidify weak concepts before exam day.`
      );

      // Tip 4: Steady pace & study blocks
      tips.push(
        `Maintain a steady pace with your planned ${dailyHoursStr}h daily study cap, taking a 10-minute break after each 45-to-60 minute study session.`
      );

      // Tip 5: Full restorative sleep
      tips.push(
        `Ensure 8 hours of restorative sleep tonight — a well-rested brain consolidates memory and improves problem-solving speed during the exam.`
      );

      return tips;
    }

    case "Risky": {
      const tips: string[] = [];

      // Tip 1: Prioritize difficult/unfinished topics
      if (!isChapterFallback) {
        tips.push(
          `Immediately prioritize your most challenging or unfinished topics first: start with ${primaryTopic}${
            secondaryTopic ? ` followed by ${secondaryTopic}` : ""
          } in ${subject}.`
        );
      } else {
        tips.push(
          `Prioritize the most challenging of your ${chaptersCount} remaining ${subject} chapters first, targeting sections where you feel least confident.`
        );
      }

      // Tip 2: High-yield revision from notes
      if (!isChapterFallback) {
        tips.push(
          `Focus your study sessions on core summaries, primary definitions, and worked examples for ${topicsPhrase} rather than re-reading entire textbook chapters.`
        );
      } else {
        tips.push(
          `Focus directly on chapter summaries, core principles, and formula sheets for ${subject} rather than passive re-reading.`
        );
      }

      // Tip 3: Timed practice & error analysis
      if (!isChapterFallback) {
        tips.push(
          `Attempt 3 to 5 representative exam questions on ${topicsPhrase} under timed conditions, then immediately review and correct your mistakes.`
        );
      } else {
        tips.push(
          `Attempt representative past exam questions for your remaining ${subject} chapters under timed conditions to identify weak points.`
        );
      }

      // Tip 4: Strict time allocation
      tips.push(
        `Allocate your ${dailyHoursStr}h daily study cap strictly according to topic urgency, working in 45-minute focused blocks with 10-minute pauses.`
      );

      // Tip 5: Protected sleep (never deprived)
      tips.push(
        `Protect at least 7 hours of sleep — cutting sleep under stress sharply impairs retention, concentration, and analytical thinking on exam day.`
      );

      return tips;
    }

    case "Critical": {
      const tips: string[] = [];

      // Tip 1: Emergency triage on top priority
      if (!isChapterFallback) {
        tips.push(
          `Zero in exclusively on your top unfinished topic right now: ${primaryTopic}${
            secondaryTopic ? ` (then ${secondaryTopic})` : ""
          } in ${subject}. Defer all lower-priority tasks.`
        );
      } else {
        tips.push(
          `Zero in exclusively on your most critical remaining chapter of ${subject} right now. Defer all low-priority or already-reviewed sections.`
        );
      }

      // Tip 2: Concise summaries from notes (no new material)
      if (!isChapterFallback) {
        tips.push(
          `Revise concise summaries, essential formulas, and core definitions for ${topicsPhrase} directly from your own notes or syllabus. Do not attempt unread textbook chapters.`
        );
      } else {
        tips.push(
          `Review only key formulas, summary sheets, and high-frequency definitions for ${subject} directly from your own notes.`
        );
      }

      // Tip 3: High-frequency exam questions
      if (!isChapterFallback) {
        tips.push(
          `Work through 2 to 3 high-probability past exam questions on ${topicsPhrase}, review the solution keys immediately, and correct errors.`
        );
      } else {
        tips.push(
          `Solve 2 to 3 representative past year exam questions on ${subject}, checking step-by-step solutions immediately to secure essential marks.`
        );
      }

      // Tip 4: Sprint intervals with strict recovery
      tips.push(
        `Work in focused 25-minute study sprints followed by 5-minute offline breaks to maximize mental retention under time pressure.`
      );

      // Tip 5: Mandatory cognitive rest (never sleep deprived)
      tips.push(
        `Get at least 6 to 7 hours of sleep before your exam — staying awake all night causes memory blanks and severe analytical errors under exam conditions.`
      );

      return tips;
    }

    default:
      return [];
  }
}
