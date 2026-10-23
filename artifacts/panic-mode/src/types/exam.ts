export type PanicStatus = "Safe" | "Risky" | "Critical";

export type PrepLevel =
  | "Not Started"
  | "Barely Started"
  | "Partially Done"
  | "Almost Ready";

export type SubjectPriority = "High" | "Medium" | "Low";

export type SubjectStatus =
  | "Needs Revision"
  | "In Progress"
  | "Not Started"
  | "Mastered";

export interface SubjectItem {
  id: string;
  name: string;
  chaptersTotal: number;
  chaptersRemaining: number;
  priority: SubjectPriority;
  status: SubjectStatus;
  topics: string[];
  notes?: string;
}

export interface StudyTask {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  topic: string;
  durationMinutes: number;
  priority: SubjectPriority;
  completed: boolean;
  isCustom?: boolean;
}

export interface TimetableDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  displayDate: string;
  availableMinutes: number;
  allocatedMinutes: number;
  tasks: StudyTask[];
  isExamDay: boolean;
  isOverCapacity: boolean;
}

export interface RevisionScheduleResult {
  days: TimetableDay[];
  totalAvailableHours: number;
  totalRequiredHours: number;
  unassignedTasks: Array<{ subjectName: string; topic: string; durationMinutes: number }>;
  isConstrained: boolean;
}

export interface AssessmentResult {
  status: PanicStatus | null;
  error?: string;
  isPastDate?: boolean;
  requiredStudyHours: number;
  availableStudyHours: number;
  workloadRatio: number;
  explanation: string;
  totalHoursUntilExam: number;
}
