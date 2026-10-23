import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { PanicStatus, SubjectItem, StudyTask } from "@/types/exam";

interface DashboardOverviewProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number } | null;
  status: PanicStatus | null;
  examDateTime: string;
  subjectName: string;
  subjects: SubjectItem[];
  tasks: StudyTask[];
  dailyStudyHours: number;
  onNavigateTab: (tab: string) => void;
  onLoadDemo: () => void;
  onReset: () => void;
  isDemoActive: boolean;
}

export function DashboardOverview({
  timeLeft,
  status,
  examDateTime,
  subjectName,
  subjects,
  tasks,
  dailyStudyHours,
  onNavigateTab,
  onLoadDemo,
  onReset,
  isDemoActive,
}: DashboardOverviewProps) {
  // Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const todayCompletedTasks = todayTasks.filter((t) => t.completed);
  const todayTotalMinutes = todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const todayCompletedMinutes = todayCompletedTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const todayProgressPercent =
    todayTasks.length > 0
      ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100)
      : 0;

  // Overall subjects progress
  const totalChapters = subjects.reduce((acc, s) => acc + (s.chaptersTotal || 1), 0);
  const remainingChapters = subjects.reduce((acc, s) => acc + (s.chaptersRemaining || 0), 0);
  const completedChapters = Math.max(0, totalChapters - remainingChapters);
  const overallProgressPercent =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const totalAllTasks = tasks.length;
  const completedAllTasks = tasks.filter((t) => t.completed).length;

  const needsRevisionCount = subjects.filter((s) => s.status === "Needs Revision").length;
  const highPriorityCount = subjects.filter((s) => s.priority === "High").length;

  const padZero = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col gap-5">
      {/* Demo Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
              Portfolio Client Demonstration
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isDemoActive
                ? "Realistic sample dataset active. Feel free to explore and edit."
                : "Explore complete features instantly with pre-populated realistic data."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onLoadDemo}
            className="text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {isDemoActive ? "Reload Demo" : "Load Sample Data"}
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

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Time Remaining */}
        <Card className="border border-border bg-card/90">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Exam Countdown
              </span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="my-2.5">
              {timeLeft ? (
                <div className="font-mono text-2xl font-black text-foreground tabular-nums tracking-tight">
                  {timeLeft.days}d {padZero(timeLeft.hours)}h {padZero(timeLeft.minutes)}m
                  <span className="text-xs text-primary ml-1 font-bold">{padZero(timeLeft.seconds)}s</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No date configured</span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="truncate">{subjectName || "Target Exam"}</span>
              <button
                onClick={() => onNavigateTab("panic")}
                className="text-primary hover:underline font-medium inline-flex items-center ml-1"
              >
                Assess <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Today's Planned Study Time */}
        <Card className="border border-border bg-card/90">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today&apos;s Study Time
              </span>
              <Calendar className="w-4 h-4 text-orange-400" />
            </div>
            <div className="my-2.5">
              <div className="font-mono text-2xl font-black text-foreground">
                {(todayTotalMinutes / 60).toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {dailyStudyHours} hrs cap
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{(todayCompletedMinutes / 60).toFixed(1)} hrs completed</span>
                <span>{Math.round((todayTotalMinutes / (dailyStudyHours * 60 || 1)) * 100)}% capacity</span>
              </div>
              <Progress
                value={Math.min(100, (todayTotalMinutes / (dailyStudyHours * 60 || 1)) * 100)}
                className="h-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Today's Checklist Tasks */}
        <Card className="border border-border bg-card/90">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tasks Today
              </span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="my-2.5 flex items-baseline gap-2">
              <div className="font-mono text-2xl font-black text-foreground">
                {todayCompletedTasks.length}
                <span className="text-muted-foreground text-sm font-normal"> / {todayTasks.length}</span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-border">
                {todayTasks.length - todayCompletedTasks.length} Pending
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{todayProgressPercent}% Finished</span>
                <button
                  onClick={() => onNavigateTab("checklist")}
                  className="text-primary hover:underline font-medium inline-flex items-center"
                >
                  View <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
              <Progress value={todayProgressPercent} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Overall Preparation Progress */}
        <Card className="border border-border bg-card/90">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preparation Progress
              </span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-2.5 flex items-baseline gap-2">
              <div className="font-mono text-2xl font-black text-foreground">
                {overallProgressPercent}%
              </div>
              <span className="text-xs text-muted-foreground">
                ({completedChapters}/{totalChapters} chapters)
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{totalAllTasks > 0 ? `${completedAllTasks}/${totalAllTasks} total tasks` : "No tasks"}</span>
                <span>{remainingChapters} left</span>
              </div>
              <Progress value={overallProgressPercent} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panic Status Banner & High Priority Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="md:col-span-1 border border-border bg-card flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Readiness
              </CardTitle>
              {status === "Safe" && <ShieldCheck className="w-4 h-4 text-green-400" />}
              {status === "Risky" && <ShieldAlert className="w-4 h-4 text-orange-400" />}
              {status === "Critical" && <Flame className="w-4 h-4 text-red-500" />}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`text-2xl font-black font-mono uppercase ${
                  status === "Safe"
                    ? "text-green-400"
                    : status === "Risky"
                    ? "text-orange-400"
                    : status === "Critical"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {status || "UNASSESSED"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {status === "Safe" && "On track! Maintain your steady pace and ensure 8 hours of sleep."}
              {status === "Risky" && "Pace is tight. Stick strictly to the daily timetable and high-yield topics."}
              {status === "Critical" && "Emergency mode! Focus exclusively on High Priority and Needs Revision chapters."}
              {!status && "Run an assessment in the Panic Assessment tab to compute your status level."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab("panic")}
              className="w-full text-xs font-semibold h-8 mt-1 border-border"
            >
              Recalculate Status
            </Button>
          </CardContent>
        </Card>

        {/* Priority Focus Overview */}
        <Card className="md:col-span-2 border border-border bg-card flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Focus Highlights
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="destructive" className="text-[10px] uppercase">
                  {needsRevisionCount} Needs Revision
                </Badge>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {highPriorityCount} High Priority
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col gap-3">
            {subjects.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg py-8 text-center text-muted-foreground text-xs">
                No subjects added yet. Run an Assessment or load Demo Mode to see priority highlights.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subjects.slice(0, 4).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 rounded border border-border bg-background"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-foreground truncate">{sub.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {sub.chaptersRemaining} / {sub.chaptersTotal} ch left
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          sub.priority === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : sub.priority === "Medium"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {sub.priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{sub.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Manage all subject priorities and topics
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab("subjects")}
                className="text-xs font-semibold h-7 text-primary hover:text-primary/90"
              >
                Open Subject Manager <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
