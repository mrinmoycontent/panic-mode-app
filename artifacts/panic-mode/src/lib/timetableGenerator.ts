import { format, addDays, differenceInCalendarDays, parseISO, isBefore, startOfDay, isValid } from "date-fns";
import type { SubjectItem, StudyTask, TimetableDay, RevisionScheduleResult, SubjectPriority } from "@/types/exam";
import { normalizeTopics } from "./actionPlanGenerator.ts";

const PRIORITY_WEIGHTS: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const STATUS_WEIGHTS: Record<string, number> = {
  "Needs Revision": 4,
  "Not Started": 3,
  "In Progress": 2,
  Mastered: 1,
};

/**
 * Generates a realistic day-by-day revision schedule strictly respecting
 * the student's available daily study hours and real subject topics.
 */
export function generateRevisionTimetable({
  examDateTime,
  subjects,
  dailyStudyHours,
  existingTasks = [],
}: {
  examDateTime: string;
  subjects: SubjectItem[];
  dailyStudyHours: number;
  existingTasks?: StudyTask[];
}): RevisionScheduleResult {
  const dailyAvailableMinutes = Math.max(15, Math.round((dailyStudyHours || 4) * 60));
  const today = startOfDay(new Date());

  // Determine exam day and days span
  let daysSpan = 1;
  let examDate: Date | null = null;
  let isPastExam = false;

  if (examDateTime) {
    try {
      const parsed = parseISO(examDateTime);
      if (isValid(parsed) && !isNaN(parsed.getTime())) {
        examDate = startOfDay(parsed);
        const diff = differenceInCalendarDays(examDate, today);
        if (diff < 0) {
          isPastExam = true;
          daysSpan = 0;
        } else {
          // Today through exam day
          daysSpan = Math.max(1, diff + 1);
        }
      }
    } catch {
      daysSpan = 1;
    }
  }

  // Cap span to a realistic planning horizon (max 30 days) to prevent runaway loops
  const scheduleDaysCount = Math.min(daysSpan, 30);

  // Initialize schedule days
  const scheduleDays: TimetableDay[] = [];
  for (let i = 0; i < scheduleDaysCount; i++) {
    const currentDay = addDays(today, i);
    const dateStr = format(currentDay, "yyyy-MM-dd");
    const isExamDay = examDate ? differenceInCalendarDays(examDate, currentDay) === 0 : false;

    // On exam day, allocate ~40% of regular study hours (light review before paper)
    const availableForDay = isExamDay
      ? Math.max(15, Math.round((dailyAvailableMinutes * 0.4) / 15) * 15)
      : dailyAvailableMinutes;

    scheduleDays.push({
      date: dateStr,
      dayOfWeek: format(currentDay, "EEE"),
      displayDate: format(currentDay, "MMM d"),
      availableMinutes: availableForDay,
      allocatedMinutes: 0,
      tasks: [],
      isExamDay,
      isOverCapacity: false,
    });
  }

  // Flatten and prioritize topics from subjects
  interface TopicQueueItem {
    subjectId: string;
    subjectName: string;
    topic: string;
    priority: SubjectPriority;
    status: string;
    durationMinutes: number;
  }

  const topicQueue: TopicQueueItem[] = [];

  // Sort subjects by priority first, then status urgency
  const sortedSubjects = [...subjects].sort((a, b) => {
    const pDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return (STATUS_WEIGHTS[b.status] || 0) - (STATUS_WEIGHTS[a.status] || 0);
  });

  for (const sub of sortedSubjects) {
    const duration = sub.priority === "High" ? 60 : sub.priority === "Medium" ? 45 : 30;

    const cleanTopics = normalizeTopics(sub.topics);
    // If explicit user topics list is provided, schedule the user's REAL topics
    if (cleanTopics.length > 0) {
      for (const topicName of cleanTopics) {
        if (!topicName || !topicName.trim()) continue;
        topicQueue.push({
          subjectId: sub.id,
          subjectName: sub.name,
          topic: topicName.trim(),
          priority: sub.priority,
          status: sub.status,
          durationMinutes: duration,
        });
      }
    } else {
      // If no explicit topics list, create chapters titled after the subject (never generic placeholders)
      const chaptersCount = Math.max(1, sub.chaptersRemaining || 1);
      for (let ch = 1; ch <= chaptersCount; ch++) {
        topicQueue.push({
          subjectId: sub.id,
          subjectName: sub.name,
          topic: `${sub.name}: Chapter ${ch}`,
          priority: sub.priority,
          status: sub.status,
          durationMinutes: duration,
        });
      }
    }
  }

  // Maintain quick lookup of existing completed task states to preserve completion
  const completedMap = new Map<string, boolean>();
  for (const t of existingTasks) {
    completedMap.set(t.id, t.completed);
    completedMap.set(`${t.subjectId}-${t.topic.toLowerCase()}`, t.completed);
    completedMap.set(`${t.subjectName.toLowerCase()}-${t.topic.toLowerCase()}`, t.completed);
    completedMap.set(t.topic.toLowerCase(), t.completed);
  }

  const unassignedTasks: Array<{ subjectName: string; topic: string; durationMinutes: number; priority: SubjectPriority }> = [];
  let currentDayIndex = 0;
  let totalAllocatedMinutes = 0;
  const totalRequiredMinutes = topicQueue.reduce((acc, t) => acc + t.durationMinutes, 0);

  // If exam date is in the past, all topics cannot be scheduled
  if (isPastExam || scheduleDays.length === 0) {
    for (const item of topicQueue) {
      unassignedTasks.push({
        subjectName: item.subjectName,
        topic: item.topic,
        durationMinutes: item.durationMinutes,
        priority: item.priority,
      });
    }
  } else {
    // Assign topics to days strictly respecting each day's available capacity
    for (const item of topicQueue) {
      let placed = false;

      while (currentDayIndex < scheduleDays.length) {
        const day = scheduleDays[currentDayIndex];
        const remainingMinutesInDay = day.availableMinutes - day.allocatedMinutes;

        // Check if task fits in the current day's remaining capacity
        if (item.durationMinutes <= remainingMinutesInDay) {
          // Stable collision-free taskId
          const safeSlug = encodeURIComponent(item.topic.toLowerCase().replace(/\s+/g, "-")).slice(0, 40);
          const taskId = `task-${day.date}-${item.subjectId}-${safeSlug}`;

          const wasCompleted =
            completedMap.get(taskId) ||
            completedMap.get(`${item.subjectId}-${item.topic.toLowerCase()}`) ||
            completedMap.get(`${item.subjectName.toLowerCase()}-${item.topic.toLowerCase()}`) ||
            completedMap.get(item.topic.toLowerCase()) ||
            false;

          const task: StudyTask = {
            id: taskId,
            date: day.date,
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            topic: item.topic,
            durationMinutes: item.durationMinutes,
            priority: item.priority,
            completed: wasCompleted,
          };

          day.tasks.push(task);
          day.allocatedMinutes += item.durationMinutes;
          totalAllocatedMinutes += item.durationMinutes;
          placed = true;
          break;
        } else {
          // Current day cannot fit task; proceed to next day
          currentDayIndex++;
        }
      }

      if (!placed) {
        // All scheduled days are at full capacity! Place in unassigned pool (never discard)
        unassignedTasks.push({
          subjectName: item.subjectName,
          topic: item.topic,
          durationMinutes: item.durationMinutes,
          priority: item.priority,
        });
      }
    }
  }

  const totalAvailableMinutes = scheduleDays.reduce((acc, d) => acc + d.availableMinutes, 0);

  return {
    days: scheduleDays,
    totalAvailableHours: Number((totalAvailableMinutes / 60).toFixed(1)),
    totalRequiredHours: Number((totalRequiredMinutes / 60).toFixed(1)),
    unassignedTasks,
    isConstrained: unassignedTasks.length > 0,
  };
}
