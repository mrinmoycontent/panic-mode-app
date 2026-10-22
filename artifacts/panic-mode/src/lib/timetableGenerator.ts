import { format, addDays, differenceInCalendarDays, parseISO, isBefore, startOfDay } from "date-fns";
import type { SubjectItem, StudyTask, TimetableDay, RevisionScheduleResult } from "@/types/exam";

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
 * Generates a realistic day-by-day revision schedule without overloading any day
 * beyond the student's stated available daily study hours.
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
  const dailyAvailableMinutes = Math.max(30, Math.round(dailyStudyHours * 60));
  const today = startOfDay(new Date());

  // Determine exam day and days span
  let daysSpan = 1;
  let examDate: Date | null = null;

  if (examDateTime) {
    try {
      examDate = startOfDay(parseISO(examDateTime));
      if (!isNaN(examDate.getTime())) {
        const diff = differenceInCalendarDays(examDate, today);
        // If exam is in the future, span is diff + 1 (today up through exam day)
        daysSpan = Math.max(1, diff + 1);
      }
    } catch {
      daysSpan = 3;
    }
  }

  // Cap span to a realistic horizon (e.g., 30 days) to prevent runaway calculations
  const scheduleDaysCount = Math.min(daysSpan, 30);

  // Initialize schedule days
  const scheduleDays: TimetableDay[] = [];
  for (let i = 0; i < scheduleDaysCount; i++) {
    const currentDay = addDays(today, i);
    const dateStr = format(currentDay, "yyyy-MM-dd");
    const isExamDay = examDate ? differenceInCalendarDays(examDate, currentDay) === 0 : false;
    
    // On exam day itself, allocate half study time for final light review
    const availableForDay = isExamDay
      ? Math.round(dailyAvailableMinutes * 0.4)
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
    priority: "High" | "Medium" | "Low";
    status: string;
    durationMinutes: number;
  }

  const topicQueue: TopicQueueItem[] = [];

  // Sort subjects by priority first, then status
  const sortedSubjects = [...subjects].sort((a, b) => {
    const pDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return (STATUS_WEIGHTS[b.status] || 0) - (STATUS_WEIGHTS[a.status] || 0);
  });

  for (const sub of sortedSubjects) {
    // If topics list is provided, use them
    if (sub.topics && sub.topics.length > 0) {
      for (const topicName of sub.topics) {
        // High priority topics get ~60m, others get 45-60m
        const duration = sub.priority === "High" ? 60 : 45;
        topicQueue.push({
          subjectId: sub.id,
          subjectName: sub.name,
          topic: topicName,
          priority: sub.priority,
          status: sub.status,
          durationMinutes: duration,
        });
      }
    } else {
      // If no explicit topics list, create chapter review units for chapters remaining
      const chaptersCount = Math.max(1, sub.chaptersRemaining || 1);
      for (let ch = 1; ch <= chaptersCount; ch++) {
        topicQueue.push({
          subjectId: sub.id,
          subjectName: sub.name,
          topic: `Chapter ${ch} Core Review`,
          priority: sub.priority,
          status: sub.status,
          durationMinutes: sub.priority === "High" ? 60 : 45,
        });
      }
    }
  }

  // Maintain quick lookup of existing completed task states
  const completedMap = new Map<string, boolean>();
  for (const t of existingTasks) {
    completedMap.set(`${t.subjectId}-${t.topic}`, t.completed);
    completedMap.set(t.id, t.completed);
  }

  const unassignedTasks: Array<{ subjectName: string; topic: string; durationMinutes: number }> = [];
  let currentDayIndex = 0;

  let totalAllocatedMinutes = 0;
  const totalRequiredMinutes = topicQueue.reduce((acc, t) => acc + t.durationMinutes, 0);

  // Assign topics to days strictly respecting each day's available minutes
  for (const item of topicQueue) {
    let placed = false;

    while (currentDayIndex < scheduleDays.length) {
      const day = scheduleDays[currentDayIndex];
      const remainingMinutesInDay = day.availableMinutes - day.allocatedMinutes;

      // Check if task fits in the current day's remaining capacity
      if (item.durationMinutes <= remainingMinutesInDay) {
        const taskId = `task-${day.date}-${item.subjectId}-${encodeURIComponent(item.topic).slice(0, 20)}`;
        const wasCompleted = completedMap.get(taskId) || completedMap.get(`${item.subjectId}-${item.topic}`) || false;

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
        // Move to next day if current day cannot fit the task
        currentDayIndex++;
      }
    }

    if (!placed) {
      // All scheduled days are full! Do NOT overload days; place into unassigned pool
      unassignedTasks.push({
        subjectName: item.subjectName,
        topic: item.topic,
        durationMinutes: item.durationMinutes,
      });
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
