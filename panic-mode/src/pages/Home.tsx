import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInSeconds, format } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  Sparkles,
  RotateCcw,
  LayoutDashboard,
  Flame,
  ListTodo,
  CalendarDays,
  BookmarkCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { PanicStatus, SubjectItem, StudyTask, PrepLevel, SubjectPriority } from "@/types/exam";
import { generateRevisionTimetable } from "@/lib/timetableGenerator";
import { getSampleDemoData } from "@/lib/demoData";
import { calculateAssessmentStatus } from "@/lib/assessmentCalculator";
import { buildPersonalizedSuggestions } from "@/lib/actionPlanGenerator";
import { generateSubjectRecommendations } from "@/lib/recommendationEngine";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SubjectsManager } from "@/components/SubjectsManager";
import { RevisionTimetable } from "@/components/RevisionTimetable";
import { DailyChecklist } from "@/components/DailyChecklist";

const PREP_LEVELS = ["Not Started", "Barely Started", "Partially Done", "Almost Ready"] as const;

const formSchema = z.object({
  examDateTime: z.string().min(1, "Exam date and time is required"),
  subjectName: z.string().min(1, "Subject name is required"),
  chaptersRemaining: z.coerce.number().min(1, "Must have at least 1 chapter remaining"),
  prepLevel: z.enum(PREP_LEVELS, {
    required_error: "Please select a preparation level",
  }),
  topics: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const STATUS_CONFIG: Record<
  PanicStatus,
  {
    label: string;
    subLabel: string;
    textColor: string;
    borderColor: string;
    bgColor: string;
    barColor: string;
  }
> = {
  Safe: {
    label: "SAFE",
    subLabel: "You have got this",
    textColor: "text-green-400",
    borderColor: "border-green-500",
    bgColor: "bg-green-500/10",
    barColor: "bg-green-500",
  },
  Risky: {
    label: "RISKY",
    subLabel: "Focus now",
    textColor: "text-orange-400",
    borderColor: "border-orange-400",
    bgColor: "bg-orange-400/10",
    barColor: "bg-orange-400",
  },
  Critical: {
    label: "CRITICAL",
    subLabel: "Emergency mode",
    textColor: "text-red-500",
    borderColor: "border-red-500",
    bgColor: "bg-red-500/10",
    barColor: "bg-red-500",
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [status, setStatus] = useState<PanicStatus | null>(() => {
    const saved = localStorage.getItem("panicStatus");
    return saved && (saved === "Safe" || saved === "Risky" || saved === "Critical")
      ? (saved as PanicStatus)
      : null;
  });
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentExplanation, setAssessmentExplanation] = useState<string | null>(() => {
    return localStorage.getItem("panicExplanation") || null;
  });
  const [lastAssessedInputs, setLastAssessedInputs] = useState<{
    examDateTime: string;
    subjectName: string;
    chaptersRemaining: number;
    prepLevel?: string;
    dailyStudyHours: number;
  } | null>(() => {
    const saved = localStorage.getItem("panicMode_lastAssessedInputs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [noTimeError, setNoTimeError] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    return localStorage.getItem("panicMode_isDemo") === "true";
  });
  const [isChecklistCleared, setIsChecklistCleared] = useState<boolean>(() => {
    return localStorage.getItem("panicMode_checklistCleared") === "true";
  });

  // Daily Study Hours setting
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(() => {
    const saved = localStorage.getItem("panicMode_dailyStudyHours");
    return saved ? Number(saved) : 4.5;
  });

  // Multi-subject priority list (clean slate on unconfigured start)
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    const saved = localStorage.getItem("panicMode_subjects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Clean initial state: no hardcoded default subjects unless saved
    const initialSubject = localStorage.getItem("subjectName");
    if (initialSubject && initialSubject.trim()) {
      const initialChapters = Number(localStorage.getItem("chaptersRemaining")) || 3;
      const savedTopics = localStorage.getItem("assessmentTopics");
      const parsedTopics = savedTopics
        ? savedTopics.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      return [
        {
          id: "sub-primary",
          name: initialSubject.trim(),
          chaptersTotal: Math.max(initialChapters, 5),
          chaptersRemaining: initialChapters,
          priority: "High",
          status: "Needs Revision",
          topics:
            parsedTopics.length > 0
              ? parsedTopics
              : [`${initialSubject.trim()}: Chapter 1`, `${initialSubject.trim()}: Chapter 2`],
          notes: "Primary assessment subject.",
        },
      ];
    }
    return [];
  });

  // Tasks with completion states (sanitizing durations: min 15m, 15m increments)
  const [allTasks, setAllTasks] = useState<StudyTask[]>(() => {
    if (localStorage.getItem("panicMode_checklistCleared") === "true") {
      return [];
    }
    const saved = localStorage.getItem("panicMode_tasks");
    if (saved) {
      try {
        const parsed: StudyTask[] = JSON.parse(saved);
        return parsed.map((t) => {
          const raw = Number(t.durationMinutes);
          const normalized =
            isNaN(raw) || raw < 15
              ? raw > 0 && raw <= 12
                ? Math.round((raw * 60) / 15) * 15
                : 45
              : Math.round(raw / 15) * 15;
          return {
            ...t,
            durationMinutes: Math.max(15, normalized),
          };
        });
      } catch {
        // Fallback
      }
    }
    return [];
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examDateTime: localStorage.getItem("examDateTime") || "",
      subjectName: localStorage.getItem("subjectName") || "",
      chaptersRemaining: localStorage.getItem("chaptersRemaining")
        ? Number(localStorage.getItem("chaptersRemaining"))
        : 1,
      prepLevel: (localStorage.getItem("prepLevel") as FormValues["prepLevel"]) || undefined,
      topics: localStorage.getItem("assessmentTopics") || "",
    },
  });

  const { watch } = form;
  const examDateTimeValue = watch("examDateTime");
  const subjectNameValue = watch("subjectName");
  const chaptersRemainingValue = watch("chaptersRemaining");
  const prepLevelValue = watch("prepLevel");
  const topicsValue = watch("topics");

  // Dynamic, topic-aware personalized action plan suggestions
  const suggestionsList = useMemo(() => {
    if (!status) return [];
    return buildPersonalizedSuggestions({
      status,
      subjectName: subjectNameValue || form.getValues("subjectName"),
      formTopics: topicsValue !== undefined ? topicsValue : form.getValues("topics"),
      savedSubjects: subjects,
      chaptersRemaining: chaptersRemainingValue || form.getValues("chaptersRemaining") || 1,
      prepLevel: prepLevelValue || form.getValues("prepLevel"),
      dailyStudyHours,
      timeLeft,
    });
  }, [
    status,
    subjectNameValue,
    topicsValue,
    chaptersRemainingValue,
    prepLevelValue,
    subjects,
    dailyStudyHours,
    timeLeft,
    form,
  ]);

  // Active recommendation index for interactive Next/Back stepper navigation
  const [activeRecIndex, setActiveRecIndex] = useState(0);

  // Subject-specific pedagogical recommendations
  const recommendations = useMemo(() => {
    if (!status) return [];
    return generateSubjectRecommendations({
      status,
      subjectName: subjectNameValue || form.getValues("subjectName"),
      formTopics: topicsValue !== undefined ? topicsValue : form.getValues("topics"),
      savedSubjects: subjects,
      chaptersRemaining: chaptersRemainingValue || form.getValues("chaptersRemaining") || 1,
      prepLevel: prepLevelValue || form.getValues("prepLevel"),
      dailyStudyHours,
      timeLeft,
    });
  }, [
    status,
    subjectNameValue,
    topicsValue,
    chaptersRemainingValue,
    prepLevelValue,
    subjects,
    dailyStudyHours,
    timeLeft,
    form,
  ]);

  // Reset recommendation stepper navigation when user starts a new session or inputs change materially
  useEffect(() => {
    setActiveRecIndex(0);
  }, [subjectNameValue, topicsValue, prepLevelValue, chaptersRemainingValue, examDateTimeValue, status]);

  // Check if form inputs have changed since status was last assessed
  const isAssessmentStale = useMemo(() => {
    if (!status || !lastAssessedInputs) return false;
    return (
      (lastAssessedInputs.examDateTime || "") !== (examDateTimeValue || "") ||
      (lastAssessedInputs.subjectName || "") !== (subjectNameValue || "") ||
      lastAssessedInputs.chaptersRemaining !== Number(chaptersRemainingValue || 1) ||
      (lastAssessedInputs.prepLevel || "") !== (prepLevelValue || "") ||
      lastAssessedInputs.dailyStudyHours !== dailyStudyHours
    );
  }, [
    status,
    lastAssessedInputs,
    examDateTimeValue,
    subjectNameValue,
    chaptersRemainingValue,
    prepLevelValue,
    dailyStudyHours,
  ]);

  // Keep dark theme active
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Save base form values to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.examDateTime) localStorage.setItem("examDateTime", value.examDateTime);
      if (value.topics !== undefined) localStorage.setItem("assessmentTopics", value.topics);
      if (value.subjectName) {
        localStorage.setItem("subjectName", value.subjectName);
        setSubjects((prev) => {
          if (prev.length === 0) {
            const parsedTopics = value.topics
              ? value.topics.split(",").map((t) => t.trim()).filter(Boolean)
              : [];
            return [
              {
                id: "sub-primary",
                name: value.subjectName!,
                chaptersTotal: Number(value.chaptersRemaining) || 3,
                chaptersRemaining: Number(value.chaptersRemaining) || 3,
                priority: "High",
                status: "Needs Revision",
                topics:
                  parsedTopics.length > 0
                    ? parsedTopics
                    : [`${value.subjectName}: Chapter 1`, `${value.subjectName}: Chapter 2`],
                notes: "Target exam subject.",
              },
            ];
          }
          if (
            prev.length === 1 &&
            (prev[0].id === "sub-default" ||
              prev[0].id === "sub-primary" ||
              prev[0].id === "sub-1" ||
              prev[0].name === "Computer Architecture" ||
              prev[0].name === "General Exam Preparation" ||
              prev[0].name.toLowerCase() === value.subjectName!.toLowerCase())
          ) {
            return [
              {
                ...prev[0],
                name: value.subjectName!,
              },
            ];
          }
          return prev;
        });
      }
      if (value.chaptersRemaining) {
        localStorage.setItem("chaptersRemaining", String(value.chaptersRemaining));
        setSubjects((prev) => {
          if (
            prev.length === 1 &&
            (prev[0].id === "sub-default" || prev[0].id === "sub-primary" || prev[0].id === "sub-1")
          ) {
            return [
              {
                ...prev[0],
                chaptersRemaining: Number(value.chaptersRemaining),
                chaptersTotal: Math.max(Number(value.chaptersRemaining), prev[0].chaptersTotal),
              },
            ];
          }
          return prev;
        });
      }
      if (value.prepLevel) localStorage.setItem("prepLevel", value.prepLevel);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Persist subjects
  useEffect(() => {
    localStorage.setItem("panicMode_subjects", JSON.stringify(subjects));
  }, [subjects]);

  // Persist tasks
  useEffect(() => {
    localStorage.setItem("panicMode_tasks", JSON.stringify(allTasks));
  }, [allTasks]);

  // Persist daily hours
  useEffect(() => {
    localStorage.setItem("panicMode_dailyStudyHours", String(dailyStudyHours));
  }, [dailyStudyHours]);

  // Persist demo state
  useEffect(() => {
    localStorage.setItem("panicMode_isDemo", String(isDemoActive));
  }, [isDemoActive]);

  // Persist status and explanation
  useEffect(() => {
    if (status) {
      localStorage.setItem("panicStatus", status);
    } else {
      localStorage.removeItem("panicStatus");
    }
  }, [status]);

  useEffect(() => {
    if (assessmentExplanation) {
      localStorage.setItem("panicExplanation", assessmentExplanation);
    } else {
      localStorage.removeItem("panicExplanation");
    }
  }, [assessmentExplanation]);

  // Countdown clock ticker
  useEffect(() => {
    if (!examDateTimeValue) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const now = new Date();
      const target = new Date(examDateTimeValue);
      const diffSeconds = differenceInSeconds(target, now);

      if (diffSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffSeconds / (3600 * 24));
      const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [examDateTimeValue]);

  // Compute revision timetable
  const schedule = useMemo(() => {
    return generateRevisionTimetable({
      examDateTime: examDateTimeValue,
      subjects,
      dailyStudyHours,
      existingTasks: allTasks,
    });
  }, [examDateTimeValue, subjects, dailyStudyHours, allTasks]);

  // Keep allTasks synchronized with schedule tasks without losing completion state
  useEffect(() => {
    if (isChecklistCleared || localStorage.getItem("panicMode_checklistCleared") === "true") {
      return;
    }
    const scheduledTasks = schedule.days.flatMap((d) => d.tasks);
    setAllTasks((prev) => {
      const prevMap = new Map<string, StudyTask>();
      for (const t of prev) {
        prevMap.set(t.id, t);
      }

      // Preserve custom tasks added by user
      const customTasks = prev.filter((t) => t.isCustom);

      const mergedScheduled = scheduledTasks.map((st) => {
        const existing = prevMap.get(st.id);
        return existing ? { ...st, completed: existing.completed } : st;
      });

      return [...mergedScheduled, ...customTasks];
    });
  }, [schedule, isChecklistCleared]);

  // Panic status assessment logic using rigorous explainable calculation
  const calculateStatus = useCallback(
    (data: FormValues) => {
      const result = calculateAssessmentStatus({
        examDateTime: data.examDateTime,
        chaptersRemaining: data.chaptersRemaining,
        prepLevel: data.prepLevel,
        dailyStudyHours,
      });

      if (result.error) {
        setAssessmentError(result.error);
        setStatus(null);
        setAssessmentExplanation(null);
        return;
      }

      setAssessmentError(null);
      setNoTimeError(false);
      setStatus(result.status);
      setAssessmentExplanation(result.explanation);
      setActiveRecIndex(0);

      const currentAssessed = {
        examDateTime: data.examDateTime,
        subjectName: data.subjectName,
        chaptersRemaining: data.chaptersRemaining,
        prepLevel: data.prepLevel,
        dailyStudyHours,
      };
      setLastAssessedInputs(currentAssessed);
      localStorage.setItem("panicMode_lastAssessedInputs", JSON.stringify(currentAssessed));

      // Flow primary subject and actual topics consistently
      const parsedTopics = data.topics
        ? data.topics.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const trimmedSubject = data.subjectName.trim();
      const generatedTopics =
        parsedTopics.length > 0
          ? parsedTopics
          : Array.from(
              { length: Math.min(data.chaptersRemaining, 10) },
              (_, i) => `${trimmedSubject}: Chapter ${i + 1}`
            );

      setSubjects((prev) => {
        const existingIdx = prev.findIndex(
          (s) => s.name.toLowerCase() === trimmedSubject.toLowerCase()
        );

        if (existingIdx >= 0) {
          const updated = [...prev];
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            name: trimmedSubject,
            chaptersRemaining: data.chaptersRemaining,
            chaptersTotal: Math.max(existing.chaptersTotal, data.chaptersRemaining),
            topics:
              parsedTopics.length > 0
                ? parsedTopics
                : existing.topics.length > 0
                ? existing.topics
                : generatedTopics,
            priority: existing.priority || "High",
            status: existing.status || "Needs Revision",
          };
          return updated;
        }

        if (
          prev.length <= 1 &&
          (prev.length === 0 ||
            prev[0].id === "sub-default" ||
            prev[0].id === "sub-primary" ||
            prev[0].id === "sub-1" ||
            prev[0].name === "Computer Architecture" ||
            prev[0].name === "General Exam Preparation")
        ) {
          return [
            {
              id: "sub-primary",
              name: trimmedSubject,
              chaptersTotal: Math.max(data.chaptersRemaining, 5),
              chaptersRemaining: data.chaptersRemaining,
              priority: "High",
              status: "Needs Revision",
              topics: generatedTopics,
              notes: "Primary assessment subject",
            },
          ];
        }

        return [
          ...prev,
          {
            id: `sub-${Date.now()}`,
            name: trimmedSubject,
            chaptersTotal: Math.max(data.chaptersRemaining, 5),
            chaptersRemaining: data.chaptersRemaining,
            priority: "High",
            status: "Needs Revision",
            topics: generatedTopics,
            notes: "Primary assessment subject",
          },
        ];
      });
    },
    [dailyStudyHours]
  );

  // Toggle single task completion
  function handleToggleTask(taskId: string) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }

  // Add topic to timetable subjects source
  const handleAddTimetableTopic = useCallback(
    ({
      subjectName,
      topic,
      priority = "High",
    }: {
      subjectName: string;
      topic: string;
      priority?: SubjectPriority;
    }) => {
      const trimmedTopic = topic.trim();
      const trimmedSubject = subjectName.trim() || "Revision Subject";
      if (!trimmedTopic) return;

      setSubjects((prev) => {
        // Find existing subject matching name (case-insensitive)
        const existingIdx = prev.findIndex(
          (s) => s.name.toLowerCase() === trimmedSubject.toLowerCase()
        );

        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          // If already has topic, preserve without duplicate
          if (existing.topics.includes(trimmedTopic)) {
            return prev;
          }
          const updated = [...prev];
          updated[existingIdx] = {
            ...existing,
            topics: [...existing.topics, trimmedTopic],
          };
          return updated;
        } else {
          // Create new subject with this topic
          const newSub: SubjectItem = {
            id: `sub-${Date.now()}`,
            name: trimmedSubject,
            chaptersTotal: 3,
            chaptersRemaining: 1,
            priority: priority,
            status: "Needs Revision",
            topics: [trimmedTopic],
            notes: "Added to revision timetable",
          };
          return [...prev, newSub];
        }
      });
    },
    []
  );

  // Add custom task (and optionally add topic to timetable source if requested)
  function handleAddCustomTask(
    newTask: Omit<StudyTask, "id">,
    alsoAddToTimetable?: boolean
  ) {
    const task: StudyTask = {
      ...newTask,
      id: `custom-task-${Date.now()}`,
    };
    setIsChecklistCleared(false);
    localStorage.removeItem("panicMode_checklistCleared");
    setAllTasks((prev) => [task, ...prev]);

    if (alsoAddToTimetable) {
      handleAddTimetableTopic({
        subjectName: newTask.subjectName,
        topic: newTask.topic,
        priority: newTask.priority,
      });
    }
  }

  // Clear all checklist items and completed states
  function handleClearChecklist() {
    setIsChecklistCleared(true);
    localStorage.setItem("panicMode_checklistCleared", "true");
    setAllTasks([]);
    localStorage.setItem("panicMode_tasks", JSON.stringify([]));
  }

  // Delete custom task
  function handleDeleteCustomTask(taskId: string) {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Load rich sample demo data with coherent, calculated assessment
  function handleLoadDemo() {
    const demo = getSampleDemoData();
    form.setValue("examDateTime", demo.examDateTime);
    form.setValue("subjectName", demo.subjectName);
    form.setValue("chaptersRemaining", demo.chaptersRemaining);
    form.setValue("prepLevel", demo.prepLevel);
    form.setValue("topics", demo.topicsText);
    setSubjects(demo.subjects);
    setDailyStudyHours(demo.dailyStudyHours);
    setIsDemoActive(true);
    setIsChecklistCleared(false);
    localStorage.removeItem("panicMode_checklistCleared");
    setNoTimeError(false);

    // Compute actual assessment status from the demo inputs
    const assessment = calculateAssessmentStatus({
      examDateTime: demo.examDateTime,
      chaptersRemaining: demo.chaptersRemaining,
      prepLevel: demo.prepLevel,
      dailyStudyHours: demo.dailyStudyHours,
    });

    setStatus(assessment.status);
    setAssessmentExplanation(assessment.explanation);
    setAssessmentError(null);
    setActiveRecIndex(0);

    const assessedInputs = {
      examDateTime: demo.examDateTime,
      subjectName: demo.subjectName,
      chaptersRemaining: demo.chaptersRemaining,
      prepLevel: demo.prepLevel,
      dailyStudyHours: demo.dailyStudyHours,
    };
    setLastAssessedInputs(assessedInputs);

    // Generate revision timetable and initialize demo tasks atomically
    const demoSchedule = generateRevisionTimetable({
      examDateTime: demo.examDateTime,
      subjects: demo.subjects,
      dailyStudyHours: demo.dailyStudyHours,
    });
    const scheduledTasks = demoSchedule.days.flatMap((d) => d.tasks);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const initialDemoTasks = scheduledTasks.map((t, idx) =>
      t.date === todayStr && idx === 0 ? { ...t, completed: true } : t
    );
    setAllTasks(initialDemoTasks);

    // Atomically persist demo state
    localStorage.setItem("panicMode_isDemo", "true");
    localStorage.setItem("panicMode_subjects", JSON.stringify(demo.subjects));
    localStorage.setItem("panicMode_tasks", JSON.stringify(initialDemoTasks));
    localStorage.setItem("panicMode_dailyStudyHours", String(demo.dailyStudyHours));
    if (assessment.status) localStorage.setItem("panicStatus", assessment.status);
    if (assessment.explanation) localStorage.setItem("panicExplanation", assessment.explanation);
    localStorage.setItem("examDateTime", demo.examDateTime);
    localStorage.setItem("subjectName", demo.subjectName);
    localStorage.setItem("chaptersRemaining", String(demo.chaptersRemaining));
    localStorage.setItem("prepLevel", demo.prepLevel);
    localStorage.setItem("assessmentTopics", demo.topicsText);
    localStorage.setItem("panicMode_lastAssessedInputs", JSON.stringify(assessedInputs));
  }

  // Reset all state to genuine clean slate
  function handleReset() {
    localStorage.clear();
    form.reset({
      examDateTime: "",
      subjectName: "",
      chaptersRemaining: 1,
      prepLevel: undefined,
      topics: "",
    });
    setSubjects([]);
    setAllTasks([]);
    setDailyStudyHours(4.5);
    setTimeLeft(null);
    setStatus(null);
    setAssessmentError(null);
    setAssessmentExplanation(null);
    setLastAssessedInputs(null);
    setNoTimeError(false);
    setIsDemoActive(false);
    setActiveRecIndex(0);
    setIsChecklistCleared(true);
    localStorage.setItem("panicMode_checklistCleared", "true");
  }

  const padZero = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground pb-12">
      <div className="max-w-[840px] mx-auto px-3 py-4 sm:px-6 sm:py-7 flex flex-col gap-4 sm:gap-6">
        {/* Navigation & Brand Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Panic<span className="text-primary">Mode</span>
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                  Pro Revision
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted Exam Preparation &amp; Capacity-Bounded Revision Timetable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadDemo}
              className="text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/10"
              title="Pre-populate realistic dataset for demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Demo Mode
            </Button>
            <Button
              data-testid="button-reset"
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="text-xs font-semibold h-8 text-muted-foreground hover:text-foreground"
              title="Reset all data to empty"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </header>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-card border border-border rounded-lg gap-1">
            <TabsTrigger
              value="dashboard"
              className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5 justify-center"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="panic"
              className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5 justify-center"
            >
              <Flame className="w-3.5 h-3.5" />
              Assessment
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5 justify-center"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Subjects
            </TabsTrigger>
            <TabsTrigger
              value="timetable"
              className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5 justify-center"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Timetable
            </TabsTrigger>
            <TabsTrigger
              value="checklist"
              className="col-span-2 sm:col-span-1 text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5 justify-center"
            >
              <ListTodo className="w-3.5 h-3.5" />
              Checklist
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="mt-4 sm:mt-5 focus-visible:outline-none">
            <DashboardOverview
              timeLeft={timeLeft}
              status={status}
              assessmentExplanation={assessmentExplanation}
              isAssessmentStale={isAssessmentStale}
              examDateTime={examDateTimeValue}
              subjectName={subjectNameValue}
              subjects={subjects}
              tasks={allTasks}
              dailyStudyHours={dailyStudyHours}
              onNavigateTab={setActiveTab}
              onLoadDemo={handleLoadDemo}
              onReset={handleReset}
              isDemoActive={isDemoActive}
              onToggleTaskCompletion={handleToggleTask}
              prepLevel={prepLevelValue}
            />
          </TabsContent>

          {/* TAB 2: PANIC ASSESSMENT (Preserved Original Core Feature) */}
          <TabsContent value="panic" className="mt-4 sm:mt-5 space-y-4 focus-visible:outline-none">
            {/* Section 1: Exam Countdown Timer */}
            <Card className="border-border bg-card border">
              <CardHeader className="pb-3 pt-4 px-4 sm:pt-5 sm:px-5">
                <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  Exam Countdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                {timeLeft ? (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                    {[
                      { value: timeLeft.days, label: "Days" },
                      { value: timeLeft.hours, label: "Hours" },
                      { value: timeLeft.minutes, label: "Mins" },
                      { value: timeLeft.seconds, label: "Secs" },
                    ].map(({ value, label }) => (
                      <div
                        key={label}
                        className="flex flex-col border border-border bg-background py-3 px-1 sm:py-4"
                      >
                        <span
                          data-testid={`countdown-${label.toLowerCase()}`}
                          className="text-3xl sm:text-5xl font-black font-mono text-primary leading-none tabular-nums"
                        >
                          {padZero(value)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-2 uppercase tracking-widest">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border py-8 text-center text-muted-foreground text-sm">
                    Set exam date &amp; time below to start the timer
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Study Planner Form */}
            <Card className="border-border bg-card border">
              <CardHeader className="pb-3 pt-4 px-4 sm:pt-5 sm:px-5">
                <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                  Study Details &amp; Panic Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(calculateStatus)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
                      <FormField
                        control={form.control}
                        name="examDateTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                              Exam Date &amp; Time
                            </FormLabel>
                            <FormControl>
                              <Input
                                data-testid="input-examDateTime"
                                type="datetime-local"
                                className="border-input focus-visible:ring-primary bg-background font-mono text-sm h-10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subjectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                              Primary Subject
                            </FormLabel>
                            <FormControl>
                              <Input
                                data-testid="input-subjectName"
                                placeholder="e.g. Thermodynamics"
                                className="border-input focus-visible:ring-primary bg-background text-sm h-10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="chaptersRemaining"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                              Chapters Left
                            </FormLabel>
                            <FormControl>
                              <Input
                                data-testid="input-chaptersRemaining"
                                type="number"
                                min={1}
                                className="border-input focus-visible:ring-primary bg-background font-mono text-sm h-10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="prepLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                              Prep Level
                            </FormLabel>
                            <FormControl>
                              <select
                                data-testid="select-prepLevel"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              >
                                <option value="" disabled className="bg-popover text-muted-foreground">
                                  Select level...
                                </option>
                                {PREP_LEVELS.map((level) => (
                                  <option key={level} value={level} className="bg-popover text-popover-foreground">
                                    {level}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="topics"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground font-medium">
                              Topics / Chapters (Optional, comma-separated)
                            </FormLabel>
                            <FormControl>
                              <Input
                                data-testid="input-assessment-topics"
                                placeholder="e.g. Photosynthesis and Its Process, Cellular Respiration"
                                className="border-input focus-visible:ring-primary bg-background text-sm h-10"
                                {...field}
                              />
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground">
                              Custom topics will automatically schedule into your Timetable, Checklist, and Subject Manager.
                            </p>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {assessmentError && (
                      <p className="text-destructive text-sm font-medium" data-testid="error-assessment">
                        {assessmentError}
                      </p>
                    )}

                    {noTimeError && (
                      <p className="text-destructive text-sm font-medium" data-testid="error-noTime">
                        Set your exam date and time first to assess your situation.
                      </p>
                    )}

                    <Button
                      data-testid="button-assess"
                      type="submit"
                      className="w-full font-bold uppercase tracking-widest text-sm h-12 bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                    >
                      Assess Situation
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Section 3: Panic Status Card */}
            {status && isAssessmentStale && (
              <div
                data-testid="alert-assessment-stale"
                className="p-3.5 rounded-lg border border-orange-500/40 bg-orange-950/20 text-xs text-orange-300 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    Form inputs have changed since this status was assessed. Click <strong>&ldquo;Assess Situation&rdquo;</strong> to update your readiness status and Action Plan.
                  </span>
                </div>
              </div>
            )}

            {status && status in STATUS_CONFIG && (() => {
              const cfg = STATUS_CONFIG[status as PanicStatus];
              return (
                <>
                  <Card
                    data-testid="card-status"
                    className={`border ${cfg.borderColor} ${cfg.bgColor}`}
                  >
                    <CardContent className="px-4 py-5 sm:px-5 sm:py-6">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Current Status
                      </p>
                      <div className="flex items-center gap-4">
                        <div className={`w-1 self-stretch rounded-full ${cfg.barColor} shrink-0`} />
                        <div>
                          <p
                            data-testid="text-statusLabel"
                            className={`text-3xl sm:text-4xl font-black uppercase leading-none ${cfg.textColor}`}
                          >
                            {cfg.label}
                          </p>
                          <p className="text-muted-foreground text-sm mt-1.5">{cfg.subLabel}</p>
                          {assessmentExplanation && (
                            <p
                              data-testid="text-assessmentExplanation"
                              className="text-xs text-muted-foreground/90 mt-2 font-mono bg-background/50 px-2.5 py-1.5 rounded border border-border"
                            >
                              {assessmentExplanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4: Study Suggestions & Interactive Stepper */}
                  {recommendations.length > 0 && (() => {
                    const safeRecIndex = Math.min(
                      Math.max(0, activeRecIndex),
                      recommendations.length - 1
                    );
                    const currentRec = recommendations[safeRecIndex];
                    const progressPercent = Math.round(
                      ((safeRecIndex + 1) / recommendations.length) * 100
                    );

                    return (
                      <Card className="border-border bg-card border" data-testid="card-action-plan">
                        <CardHeader className="pb-3 pt-4 px-4 sm:pt-5 sm:px-5 border-b border-border">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                                Action Plan &amp; Study Recommendations
                              </CardTitle>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Subject-tailored revision strategy based on your countdown and preparation level.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                data-testid="badge-rec-category"
                                className="text-[11px] font-semibold py-0.5 border-primary/40 bg-primary/10 text-primary"
                              >
                                {currentRec.disciplineLabel} &bull; {currentRec.category}
                              </Badge>
                              <span
                                data-testid="text-rec-progress"
                                className="text-xs font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded"
                              >
                                Recommendation {safeRecIndex + 1} of {recommendations.length}
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-3">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </CardHeader>

                        <CardContent className="px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-4">
                          {/* Active Recommendation Stepper Card */}
                          <div
                            data-testid="card-active-recommendation"
                            className="p-4 sm:p-5 rounded-lg border border-border bg-background flex flex-col gap-3 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                data-testid="text-rec-title"
                                className="text-base sm:text-lg font-bold text-foreground leading-snug"
                              >
                                <span className={`font-mono mr-2 ${cfg.textColor}`}>
                                  {padZero(safeRecIndex + 1)}.
                                </span>
                                {currentRec.title}
                              </h3>
                            </div>

                            <p
                              data-testid="text-rec-description"
                              className="text-sm text-foreground/90 leading-relaxed"
                            >
                              {currentRec.description}
                            </p>

                            <div
                              data-testid="text-rec-step"
                              className="p-3 rounded-md bg-secondary/50 border border-border flex items-start gap-2.5 text-xs text-foreground"
                            >
                              <BookmarkCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-primary uppercase tracking-wider text-[11px]">
                                  Actionable Revision Goal:
                                </span>
                                <span className="leading-relaxed">{currentRec.actionableStep}</span>
                              </div>
                            </div>

                            {/* Time & Preparation Context Notes */}
                            {(currentRec.timeContext || currentRec.prepContext) && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60 text-[11px]">
                                {currentRec.timeContext && (
                                  <span
                                    data-testid="tag-rec-time"
                                    className="inline-flex items-center gap-1 text-muted-foreground font-mono bg-background px-2.5 py-1 rounded border border-border"
                                  >
                                    {currentRec.timeContext}
                                  </span>
                                )}
                                {currentRec.prepContext && (
                                  <span
                                    data-testid="tag-rec-prep"
                                    className="inline-flex items-center gap-1 text-muted-foreground font-mono bg-background px-2.5 py-1 rounded border border-border"
                                  >
                                    {currentRec.prepContext}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Stepper Navigation Buttons */}
                            <div className="flex items-center justify-between gap-2 sm:gap-4 mt-2 pt-3 border-t border-border">
                              <Button
                                data-testid="button-rec-back"
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={safeRecIndex === 0}
                                onClick={() => setActiveRecIndex((prev) => Math.max(0, prev - 1))}
                                className="text-xs font-semibold h-8"
                              >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                Back
                              </Button>

                              {/* Stepper Dots */}
                              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                                {recommendations.map((_, dotIdx) => (
                                  <button
                                    key={dotIdx}
                                    type="button"
                                    data-testid={`dot-rec-${dotIdx}`}
                                    onClick={() => setActiveRecIndex(dotIdx)}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                      dotIdx === safeRecIndex
                                        ? "bg-primary w-5"
                                        : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2"
                                    }`}
                                    title={`Go to recommendation ${dotIdx + 1}`}
                                  />
                                ))}
                              </div>

                              {safeRecIndex < recommendations.length - 1 ? (
                                <Button
                                  data-testid="button-rec-next"
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    setActiveRecIndex((prev) =>
                                      Math.min(recommendations.length - 1, prev + 1)
                                    )
                                  }
                                  className="text-xs font-semibold h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  Next
                                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              ) : (
                                <Button
                                  data-testid="button-rec-restart"
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setActiveRecIndex(0)}
                                  className="text-xs font-semibold h-8 hover:bg-secondary/80"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                  Restart Set
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Complete Plan Overview */}
                          <div className="mt-2 pt-3 border-t border-border">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                              Complete Plan Overview ({recommendations.length} Steps)
                            </p>
                            <ul className="flex flex-col gap-2">
                              {recommendations.map((rec, index) => {
                                const isActive = index === safeRecIndex;
                                return (
                                  <li
                                    key={rec.id}
                                    data-testid={`tip-item-${index}`}
                                    onClick={() => setActiveRecIndex(index)}
                                    className={`flex gap-3 items-start border px-4 py-3 rounded cursor-pointer transition-colors ${
                                      isActive
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-background hover:bg-secondary/30"
                                    }`}
                                  >
                                    <span
                                      className={`font-mono text-xs font-bold mt-0.5 shrink-0 ${
                                        isActive ? "text-primary" : cfg.textColor
                                      }`}
                                    >
                                      {padZero(index + 1)}
                                    </span>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-foreground">
                                          {rec.title}
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-secondary">
                                          {rec.category}
                                        </span>
                                      </div>
                                      <span className="text-sm text-foreground/90 leading-relaxed mt-0.5">
                                        {rec.description}
                                      </span>
                                      <span className="text-xs text-primary/90 font-medium mt-1">
                                        Goal: {rec.actionableStep}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </>
              );
            })()}
          </TabsContent>

          {/* TAB 3: SUBJECTS MANAGER */}
          <TabsContent value="subjects" className="mt-4 sm:mt-5 focus-visible:outline-none">
            <SubjectsManager subjects={subjects} onUpdateSubjects={setSubjects} />
          </TabsContent>

          {/* TAB 4: REVISION TIMETABLE */}
          <TabsContent value="timetable" className="mt-4 sm:mt-5 focus-visible:outline-none">
            <RevisionTimetable
              schedule={schedule}
              subjects={subjects}
              dailyStudyHours={dailyStudyHours}
              onUpdateDailyStudyHours={setDailyStudyHours}
              onToggleTaskCompletion={handleToggleTask}
              onNavigateTab={setActiveTab}
              onAddTimetableTopic={handleAddTimetableTopic}
            />
          </TabsContent>

          {/* TAB 5: DAILY CHECKLIST */}
          <TabsContent value="checklist" className="mt-4 sm:mt-5 focus-visible:outline-none">
            <DailyChecklist
              days={schedule.days}
              allTasks={allTasks}
              onToggleTask={handleToggleTask}
              onAddCustomTask={handleAddCustomTask}
              onDeleteCustomTask={handleDeleteCustomTask}
              onClearChecklist={handleClearChecklist}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
