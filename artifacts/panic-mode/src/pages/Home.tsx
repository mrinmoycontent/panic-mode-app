import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInSeconds } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

import type { PanicStatus, SubjectItem, StudyTask, PrepLevel } from "@/types/exam";
import { generateRevisionTimetable } from "@/lib/timetableGenerator";
import { getSampleDemoData } from "@/lib/demoData";
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

const SUGGESTIONS: Record<PanicStatus, string[]> = {
  Safe: [
    "Review your notes chapter by chapter",
    "Do practice questions for each chapter",
    "Get 8 hours of sleep tonight",
    "Make a brief summary sheet",
  ],
  Risky: [
    "Skip detailed reading — focus on key concepts only",
    "Prioritize the most important chapters first",
    "Use the 20/80 rule: 20% of content = 80% of exam",
    "Take 10-min breaks every hour",
  ],
  Critical: [
    "Drop everything — open your notes NOW",
    "Focus only on chapter summaries and headings",
    "Write down formulas and key definitions only",
    "Attempt past exam papers immediately",
    "Skip sleep only as last resort — 4 hours minimum",
  ],
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
    return (localStorage.getItem("panicStatus") as PanicStatus) || null;
  });
  const [noTimeError, setNoTimeError] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    return localStorage.getItem("panicMode_isDemo") === "true";
  });

  // Daily Study Hours setting
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(() => {
    const saved = localStorage.getItem("panicMode_dailyStudyHours");
    return saved ? Number(saved) : 4.5;
  });

  // Multi-subject priority list
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    const saved = localStorage.getItem("panicMode_subjects");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    // Default subject initialized from form values if available
    const initialSubject = localStorage.getItem("subjectName") || "Computer Architecture";
    const initialChapters = Number(localStorage.getItem("chaptersRemaining")) || 3;
    return [
      {
        id: "sub-default",
        name: initialSubject,
        chaptersTotal: Math.max(initialChapters, 5),
        chaptersRemaining: initialChapters,
        priority: "High",
        status: "Needs Revision",
        topics: ["Core Concepts & High Weightage Units", "Past Year Examination Questions"],
        notes: "Target exam subject.",
      },
    ];
  });

  // Tasks with completion states
  const [allTasks, setAllTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem("panicMode_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
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
    },
  });

  const { watch } = form;
  const examDateTimeValue = watch("examDateTime");
  const subjectNameValue = watch("subjectName");
  const chaptersRemainingValue = watch("chaptersRemaining");
  const prepLevelValue = watch("prepLevel");

  // Keep dark theme active
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Save base form values to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.examDateTime) localStorage.setItem("examDateTime", value.examDateTime);
      if (value.subjectName) localStorage.setItem("subjectName", value.subjectName);
      if (value.chaptersRemaining)
        localStorage.setItem("chaptersRemaining", String(value.chaptersRemaining));
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

  // Persist status
  useEffect(() => {
    if (status) {
      localStorage.setItem("panicStatus", status);
    } else {
      localStorage.removeItem("panicStatus");
    }
  }, [status]);

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
  }, [schedule]);

  // Panic status assessment logic (preserved exactly)
  const calculateStatus = useCallback(
    (data: FormValues) => {
      if (!timeLeft) {
        setNoTimeError(true);
        return;
      }
      setNoTimeError(false);

      const totalHours = timeLeft.days * 24 + timeLeft.hours + timeLeft.minutes / 60;
      const chapters = data.chaptersRemaining;
      const prep = data.prepLevel;

      if (totalHours > 48 && chapters <= 3 && (prep === "Partially Done" || prep === "Almost Ready")) {
        setStatus("Safe");
      } else if (totalHours < 12 || chapters > 7 || (prep === "Not Started" && totalHours < 24)) {
        setStatus("Critical");
      } else {
        setStatus("Risky");
      }
    },
    [timeLeft]
  );

  // Toggle single task completion
  function handleToggleTask(taskId: string) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }

  // Add custom task
  function handleAddCustomTask(newTask: Omit<StudyTask, "id">) {
    const task: StudyTask = {
      ...newTask,
      id: `custom-task-${Date.now()}`,
    };
    setAllTasks((prev) => [task, ...prev]);
  }

  // Delete custom task
  function handleDeleteCustomTask(taskId: string) {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Load rich sample demo data for portfolio presentations
  function handleLoadDemo() {
    const demo = getSampleDemoData();
    form.setValue("examDateTime", demo.examDateTime);
    form.setValue("subjectName", demo.subjectName);
    form.setValue("chaptersRemaining", demo.chaptersRemaining);
    form.setValue("prepLevel", demo.prepLevel);
    setSubjects(demo.subjects);
    setDailyStudyHours(demo.dailyStudyHours);
    setIsDemoActive(true);
    setNoTimeError(false);

    // Immediately compute demo status
    setStatus("Risky");

    // Populate pre-checked tasks for demo
    const todayStr = new Date().toISOString().split("T")[0];
    setTimeout(() => {
      setAllTasks((prev) =>
        prev.map((t, idx) => (t.date === todayStr && idx === 0 ? { ...t, completed: true } : t))
      );
    }, 100);
  }

  // Reset all state to clean slate
  function handleReset() {
    localStorage.clear();
    form.reset({
      examDateTime: "",
      subjectName: "",
      chaptersRemaining: 1,
      prepLevel: undefined,
    });
    setSubjects([
      {
        id: "sub-1",
        name: "General Exam Preparation",
        chaptersTotal: 4,
        chaptersRemaining: 2,
        priority: "High",
        status: "Needs Revision",
        topics: ["Core Syllabus Review", "Past Year Papers"],
      },
    ]);
    setAllTasks([]);
    setDailyStudyHours(4.5);
    setTimeLeft(null);
    setStatus(null);
    setNoTimeError(false);
    setIsDemoActive(false);
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
              examDateTime={examDateTimeValue}
              subjectName={subjectNameValue}
              subjects={subjects}
              tasks={allTasks}
              dailyStudyHours={dailyStudyHours}
              onNavigateTab={setActiveTab}
              onLoadDemo={handleLoadDemo}
              onReset={handleReset}
              isDemoActive={isDemoActive}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  data-testid="select-prepLevel"
                                  className="border-input focus:ring-primary bg-background text-sm h-10"
                                >
                                  <SelectValue placeholder="Select level..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-border">
                                {PREP_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level} className="text-sm">
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

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
            {status && (() => {
              const cfg = STATUS_CONFIG[status];
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 4: Study Suggestions */}
                  <Card className="border-border bg-card border">
                    <CardHeader className="pb-3 pt-4 px-4 sm:pt-5 sm:px-5">
                      <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                        Action Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                      <ul className="flex flex-col gap-2">
                        {SUGGESTIONS[status].map((tip, index) => (
                          <li
                            key={index}
                            data-testid={`tip-item-${index}`}
                            className="flex gap-3 items-start border border-border bg-background px-4 py-3"
                          >
                            <span
                              className={`font-mono text-xs font-bold mt-0.5 shrink-0 ${cfg.textColor}`}
                            >
                              {padZero(index + 1)}
                            </span>
                            <span className="text-sm text-foreground leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
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
              dailyStudyHours={dailyStudyHours}
              onUpdateDailyStudyHours={setDailyStudyHours}
              onToggleTaskCompletion={handleToggleTask}
              onNavigateTab={setActiveTab}
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
