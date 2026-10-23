import React from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Flame,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import type { PanicStatus, SubjectItem, StudyTask } from "@/types/exam";

interface DashboardOverviewProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number } | null;
  status: PanicStatus | null;
  assessmentExplanation?: string | null;
  isAssessmentStale?: boolean;
  examDateTime: string;
  subjectName: string;
  subjects: SubjectItem[];
  tasks: StudyTask[];
  dailyStudyHours: number;
  onNavigateTab: (tab: string) => void;
  onLoadDemo: () => void;
  onReset: () => void;
  isDemoActive: boolean;
  onToggleTaskCompletion?: (taskId: string) => void;
  prepLevel?: string;
}

export function DashboardOverview({
  timeLeft,
  status,
  assessmentExplanation,
  isAssessmentStale = false,
  examDateTime,
  subjectName,
  subjects,
  tasks,
  dailyStudyHours,
  onNavigateTab,
  onLoadDemo,
  onReset,
  isDemoActive,
  onToggleTaskCompletion,
}: DashboardOverviewProps) {
  // Use consistent local calendar date
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Calculations for Today's Planned Study Time
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const todayCompletedTasks = todayTasks.filter((t) => t.completed);
  const todayTotalMinutes = todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const todayCompletedMinutes = todayCompletedTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const todayRemainingMinutes = Math.max(0, todayTotalMinutes - todayCompletedMinutes);
  const todayProgressPercent =
    todayTasks.length > 0
      ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100)
      : 0;

  // Overall subjects & tasks progress
  const totalChapters = subjects.reduce((acc, s) => acc + (s.chaptersTotal || 1), 0);
  const remainingChapters = subjects.reduce((acc, s) => acc + (s.chaptersRemaining || 0), 0);
  const completedChapters = Math.max(0, totalChapters - remainingChapters);

  const totalAllTasks = tasks.length;
  const completedAllTasks = tasks.filter((t) => t.completed).length;
  const overallTaskProgressPercent =
    totalAllTasks > 0 ? Math.round((completedAllTasks / totalAllTasks) * 100) : 0;

  // Find next actionable task (Highest-priority eligible unfinished task)
  const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

  const todayUnfinished = tasks
    .filter((t) => t.date === todayStr && !t.completed)
    .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

  const upcomingUnfinished = tasks
    .filter((t) => t.date > todayStr && !t.completed)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

  const anyUnfinished = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

  const nextTask = todayUnfinished[0] || upcomingUnfinished[0] || anyUnfinished[0] || null;

  function getWhyThisTaskNow(task: StudyTask): string {
    const matchedSub = subjects.find(
      (s) => s.id === task.subjectId || s.name.toLowerCase() === task.subjectName.toLowerCase()
    );
    const subPriority = matchedSub?.priority || task.priority;
    const chaptersLeft = matchedSub?.chaptersRemaining || 1;

    if (status === "Critical") {
      return `Critical deadline urgency: completing ${task.topic} first prevents bottlenecking your remaining revision capacity.`;
    }
    if (subPriority === "High") {
      return `Marked High Priority in your syllabus with ${chaptersLeft} ${
        chaptersLeft === 1 ? "chapter" : "chapters"
      } remaining to revise in ${task.subjectName}.`;
    }
    if (task.date === todayStr) {
      return `Scheduled as part of today's study plan to maintain your steady daily revision pace in ${task.subjectName}.`;
    }
    return `Next sequential topic in your ${task.subjectName} revision schedule to stay on track before exam day.`;
  }

  // Top focus priority topics
  const urgentSubjects = [...subjects]
    .filter((s) => s.chaptersRemaining > 0)
    .sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return b.chaptersRemaining - a.chaptersRemaining;
    })
    .slice(0, 4);

  const padZero = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Demo Mode Banner — ONLY displayed when isDemoActive is true */}
      {isDemoActive && (
        <div
          data-testid="banner-demo-active"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg border border-primary/40 bg-primary/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="p-1.5 rounded-md bg-primary/20 text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground tracking-wide uppercase">
                Demo Mode Active
              </p>
              <p className="text-[11px] text-muted-foreground">
                Showing realistic sample dataset for Computer Architecture. Click &quot;Clear&quot; to begin your own exam plan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onLoadDemo}
              className="text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Reload Demo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="text-xs font-semibold h-8 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* 2. Section A: Exam Overview Hero */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Exam
                </span>
                {isAssessmentStale && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Inputs Modified — Reassessment Recommended
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight mt-0.5">
                {subjectName || "No Subject Configured"}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Readiness Status
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {status === "Safe" && (
                    <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 font-bold uppercase text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      SAFE
                    </Badge>
                  )}
                  {status === "Risky" && (
                    <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold uppercase text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      RISKY
                    </Badge>
                  )}
                  {status === "Critical" && (
                    <Badge className="bg-red-500/10 text-red-500 border border-red-500/30 font-bold uppercase text-xs">
                      <Flame className="w-3.5 h-3.5 mr-1" />
                      CRITICAL
                    </Badge>
                  )}
                  {!status && (
                    <Badge variant="outline" className="text-muted-foreground text-xs uppercase font-mono">
                      Not Assessed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Countdown */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">
                  Time Until Exam
                </span>
                {timeLeft ? (
                  <p className="font-mono text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">
                    {timeLeft.days}d {padZero(timeLeft.hours)}h {padZero(timeLeft.minutes)}m{" "}
                    <span className="text-xs text-primary font-bold">{padZero(timeLeft.seconds)}s</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No exam date configured</p>
                )}
              </div>
            </div>

            {/* Assessment Reason / Guidance */}
            <div className="flex flex-col justify-between sm:border-l sm:border-border sm:pl-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessmentExplanation ||
                  (status === "Safe"
                    ? "Study workload is comfortably balanced across your available daily capacity."
                    : status === "Risky"
                    ? "Study pace is constrained. Strictly stick to prioritized topics and study caps."
                    : status === "Critical"
                    ? "Workload exceeds available hours. Emergency revision of top topics required."
                    : "Run an assessment in the Assessment tab to calculate your readiness status.")}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onNavigateTab("panic")}
                  className="text-xs text-primary hover:underline font-semibold inline-flex items-center"
                >
                  {status ? "Update Assessment" : "Set Up Assessment"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Section B: "Your Next Study Session" (Primary Feature) */}
      <Card
        data-testid="card-next-session"
        className="border-2 border-primary/40 bg-gradient-to-br from-card to-primary/5 shadow-sm"
      >
        <CardHeader className="p-4 sm:p-5 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                Your Next Study Session
              </CardTitle>
            </div>
            {nextTask && (
              <Badge
                className={`text-[10px] uppercase font-bold ${
                  nextTask.priority === "High"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : nextTask.priority === "Medium"
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                }`}
              >
                {nextTask.priority} Priority
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-1">
          {nextTask ? (
            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {nextTask.subjectName}
                  </span>
                  <span className="text-muted-foreground text-xs">&bull;</span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {nextTask.durationMinutes} mins allocated
                  </span>
                  <span className="text-muted-foreground text-xs">&bull;</span>
                  <span className="text-[11px] text-muted-foreground">
                    {nextTask.date === todayStr ? "Scheduled for Today" : `Scheduled for ${nextTask.date}`}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  {nextTask.topic}
                </h3>
              </div>

              {/* Grounded "Why this task now" reasoning */}
              <div className="p-3 rounded-lg border border-border/80 bg-background/60 text-xs text-muted-foreground flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block mb-0.5">Why this task now:</span>
                  <p className="leading-relaxed">{getWhyThisTaskNow(nextTask)}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {onToggleTaskCompletion && (
                  <Button
                    size="sm"
                    onClick={() => onToggleTaskCompletion(nextTask.id)}
                    className="font-bold text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Mark Session Complete
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateTab("checklist")}
                  className="text-xs font-semibold h-9 border-border"
                >
                  Open in Checklist <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigateTab("timetable")}
                  className="text-xs font-semibold h-9 text-muted-foreground hover:text-foreground"
                >
                  View in Timetable
                </Button>
              </div>
            </div>
          ) : tasks.length > 0 && tasks.every((t) => t.completed) ? (
            <div className="py-6 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <p className="font-bold text-sm text-foreground">All Scheduled Tasks Completed!</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Great work! You have finished all {tasks.length} scheduled revision tasks. Protect your sleep, review summary notes, or add custom practice tasks in the Checklist.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab("checklist")}
                className="mt-2 text-xs font-semibold h-8"
              >
                Go to Checklist
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8 text-muted-foreground/60" />
              <p className="font-bold text-sm text-foreground">No Revision Tasks Scheduled</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Set up your exam date and primary subject to automatically generate your personalized revision schedule.
              </p>
              <Button
                size="sm"
                onClick={() => onNavigateTab("panic")}
                className="mt-2 text-xs font-bold h-8 bg-primary text-primary-foreground"
              >
                Set Up Assessment <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Section C & D: Today's Study Plan + Preparation Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Study Plan */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s Study Plan
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                {dailyStudyHours}h Daily Cap
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 flex flex-col gap-3.5">
            <div className="grid grid-cols-3 gap-2 py-1 border-b border-border text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Planned
                </span>
                <span className="font-mono text-base font-bold text-foreground">
                  {(todayTotalMinutes / 60).toFixed(1)}h
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {todayTotalMinutes}m
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Completed
                </span>
                <span className="font-mono text-base font-bold text-green-400">
                  {(todayCompletedMinutes / 60).toFixed(1)}h
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {todayCompletedMinutes}m
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Remaining
                </span>
                <span className="font-mono text-base font-bold text-orange-400">
                  {(todayRemainingMinutes / 60).toFixed(1)}h
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {todayRemainingMinutes}m
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {todayCompletedTasks.length} of {todayTasks.length} tasks finished today
                </span>
                <span className="font-mono font-bold text-foreground">{todayProgressPercent}%</span>
              </div>
              <Progress value={todayProgressPercent} className="h-2" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                * Planned duration reflects scheduled timetable blocks, not elapsed stopwatch time.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab("checklist")}
                className="text-xs text-primary hover:underline font-semibold shrink-0 ml-2"
              >
                View Checklist &rarr;
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Preparation Progress */}
        <Card className="border border-border bg-card flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preparation Progress
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                {totalChapters} Total Chapters
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2 flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-2 py-1 border-b border-border text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Tasks Completed
                </span>
                <span className="font-mono text-base font-bold text-foreground">
                  {completedAllTasks} / {totalAllTasks}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {overallTaskProgressPercent}% total
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Chapters Remaining
                </span>
                <span className="font-mono text-base font-bold text-foreground">
                  {remainingChapters} left
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {completedChapters} covered
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Timetable task completion progress</span>
                <span className="font-mono font-bold text-foreground">{overallTaskProgressPercent}%</span>
              </div>
              <Progress value={overallTaskProgressPercent} className="h-2" />
            </div>

            <p className="text-[10px] text-muted-foreground italic leading-tight pt-1">
              * Progress is calculated strictly from completed study tasks. Mastering a subject requires full revision and practice.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Section E: Focus Priorities */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Priorities (Most Urgent Unfinished Areas)
            </CardTitle>
            <button
              type="button"
              onClick={() => onNavigateTab("subjects")}
              className="text-xs text-primary hover:underline font-semibold inline-flex items-center"
            >
              Manage Subjects <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          {urgentSubjects.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg py-8 text-center text-muted-foreground text-xs">
              No subjects configured yet. Run an Assessment or load Demo Mode to populate your revision priorities.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {urgentSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground truncate">{sub.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sub.chaptersRemaining} of {sub.chaptersTotal} ch remaining &bull;{" "}
                      <span className="text-foreground/80">{sub.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className={`text-[10px] font-bold ${
                        sub.priority === "High"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : sub.priority === "Medium"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {sub.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
