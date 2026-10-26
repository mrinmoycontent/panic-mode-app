
import {
  format,
  addDays,
  differenceInCalendarDays,
  parseISO,
  startOfDay,
  isValid,
} from "date-fns";
import type {
  SubjectItem,
  StudyTask,
  TimetableDay,
  RevisionScheduleResult,
  SubjectPriority,
} from "@/types/exam";
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
 * Generates a day-by-day revision schedule while respecting
 * available daily study time and the student's actual topics.
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
  const dailyAvailableMinutes = Math.max(
    15,
    Math.round((dailyStudyHours || 4) * 60)
  );
  const today = startOfDay(new Date());

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
          daysSpan = Math.max(1, diff + 1);
        }
      }
    } catch {
      daysSpan = 1;
    }
  }

  const scheduleDaysCount = Math.min(daysSpan, 30);
  const scheduleDays: TimetableDay[] = [];

  for (let i = 0; i < scheduleDaysCount; i++) {
    const currentDay = addDays(today, i);
    const dateStr = format(currentDay, "yyyy-MM-dd");
    const isExamDay = examDate
      ? differenceInCalendarDays(examDate, currentDay) === 0
      : false;

    const availableForDay = isExamDay
      ? Math.max(
          15,
          Math.round((dailyAvailableMinutes * 0.4) / 15) * 15
        )
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

  interface TopicQueueItem {
    subjectId: string;
    subjectName: string;
    topic: string;
    priority: SubjectPriority;
    status: string;
    durationMinutes: number;
  }

  const topicQueue: TopicQueueItem[] = [];

  const sortedSubjects = [...subjects].sort((a, b) => {
    const priorityDifference =
      (PRIORITY_WEIGHTS[b.priority] || 0) -
      (PRIORITY_WEIGHTS[a.priority] || 0);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      (STATUS_WEIGHTS[b.status] || 0) -
      (STATUS_WEIGHTS[a.status] || 0)
    );
  });

  for (const subject of sortedSubjects) {
    const duration =
      subject.priority === "High"
        ? 60
        : subject.priority === "Medium"
          ? 45
          : 30;

    const cleanTopics = normalizeTopics(subject.topics);

    if (cleanTopics.length > 0) {
      for (const topicName of cleanTopics) {
        if (!topicName || !topicName.trim()) continue;

        topicQueue.push({
          subjectId: subject.id,
          subjectName: subject.name,
          topic: topicName.trim(),
          priority: subject.priority,
          status: subject.status,
          durationMinutes: duration,
        });
      }
    } else {
      const chaptersCount = Math.max(
        1,
        subject.chaptersRemaining || 1
      );

      for (let chapter = 1; chapter <= chaptersCount; chapter++) {
        topicQueue.push({
          subjectId: subject.id,
          subjectName: subject.name,
          topic: `${subject.name}: Chapter ${chapter}`,
          priority: subject.priority,
          status: subject.status,
          durationMinutes: duration,
        });
      }
    }
  }

  // Preserve completion states when the timetable is regenerated.
  const completedMap = new Map<string, boolean>();

  for (const task of existingTasks) {
    completedMap.set(task.id, task.completed);
    completedMap.set(
      `${task.subjectId}-${task.topic.toLowerCase()}`,
      task.completed
    );
    completedMap.set(
      `${task.subjectName.toLowerCase()}-${task.topic.toLowerCase()}`,
      task.completed
    );
    completedMap.set(task.topic.toLowerCase(), task.completed);
  }

  const unassignedTasks: Array<{
    subjectName: string;
    topic: string;
    durationMinutes: number;
    priority: SubjectPriority;
  }> = [];

  const totalRequiredMinutes = topicQueue.reduce(
    (total, topic) => total + topic.durationMinutes,
    0
  );

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
    // Distribute topics across the least-loaded regular study days.
    // Use exam day only when no regular day can fit the topic.
    for (const item of topicQueue) {
      const eligibleRegularDays = scheduleDays
        .filter(
          (day) =>
            !day.isExamDay &&
            item.durationMinutes <=
              day.availableMinutes - day.allocatedMinutes
        )
        .sort((a, b) => {
          const loadA = a.allocatedMinutes / a.availableMinutes;
          const loadB = b.allocatedMinutes / b.availableMinutes;

          return loadA - loadB || a.date.localeCompare(b.date);
        });

      const eligibleExamDays = scheduleDays
        .filter(
          (day) =>
            day.isExamDay &&
            item.durationMinutes <=
              day.availableMinutes - day.allocatedMinutes
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      const day = eligibleRegularDays[0] ?? eligibleExamDays[0];

      if (!day) {
        unassignedTasks.push({
          subjectName: item.subjectName,
          topic: item.topic,
          durationMinutes: item.durationMinutes,
          priority: item.priority,
        });
        continue;
      }

      const safeSlug = encodeURIComponent(
        item.topic.toLowerCase().replace(/\s+/g, "-")
      ).slice(0, 40);

      const taskId = `task-${day.date}-${item.subjectId}-${safeSlug}`;

      const wasCompleted =
        completedMap.get(taskId) ||
        completedMap.get(
          `${item.subjectId}-${item.topic.toLowerCase()}`
        ) ||
        completedMap.get(
          `${item.subjectName.toLowerCase()}-${item.topic.toLowerCase()}`
        ) ||
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
    }
  }

  const totalAvailableMinutes = scheduleDays.reduce(
    (total, day) => total + day.availableMinutes,
    0
  );

  return {
    days: scheduleDays,
    totalAvailableHours: Number(
      (totalAvailableMinutes / 60).toFixed(1)
    ),
    totalRequiredHours: Number(
      (totalRequiredMinutes / 60).toFixed(1)
    ),
    unassignedTasks,
    isConstrained: unassignedTasks.length > 0,
  };
}
