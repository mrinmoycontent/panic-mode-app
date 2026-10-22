import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type { RevisionScheduleResult, StudyTask } from "@/types/exam";

interface RevisionTimetableProps {
  schedule: RevisionScheduleResult;
  dailyStudyHours: number;
  onUpdateDailyStudyHours: (hours: number) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function RevisionTimetable({
  schedule,
  dailyStudyHours,
  onUpdateDailyStudyHours,
  onToggleTaskCompletion,
  onNavigateTab,
}: RevisionTimetableProps) {
  const { days, totalAvailableHours, totalRequiredHours, unassignedTasks, isConstrained } = schedule;

  return (
    <div className="flex flex-col gap-5">
      {/* Configuration & Capacity Summary */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                Revision Timetable Engine
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Strict capacity-bounded schedule. Tasks will never be assigned beyond your daily study cap.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-background border border-border px-3 py-1.5 rounded-lg shrink-0">
              <Clock className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                  Daily Study Cap
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    step={0.5}
                    value={dailyStudyHours}
                    onChange={(e) => onUpdateDailyStudyHours(Math.max(1, Math.min(14, Number(e.target.value))))}
                    className="h-7 w-16 text-xs font-mono font-bold text-center p-1 bg-transparent border-input"
                  />
                  <span className="text-xs text-muted-foreground">hrs / day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2.5 p-2.5 rounded bg-background border border-border">
              <Hourglass className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Total Available Time
                </p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {totalAvailableHours} hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded bg-background border border-border">
              <Layers className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Estimated Revision Needed
                </p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {totalRequiredHours} hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded bg-background border border-border">
              {isConstrained ? (
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              )}
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Schedule Feasibility
                </p>
                <p
                  className={`text-sm font-bold ${
                    isConstrained ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isConstrained ? "Over-Constrained" : "Realistic & Balanced"}
                </p>
              </div>
            </div>
          </div>

          {/* Over-capacity alert if topics cannot fit */}
          {isConstrained && (
            <div className="p-3 rounded border border-red-500/40 bg-red-950/20 text-xs text-red-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {unassignedTasks.length} topics could not be scheduled within available hours before exam!
                </p>
                <p className="text-red-400/90 text-[11px] leading-relaxed">
                  To fit all topics: increase your daily study hours above, or prioritize only High-priority chapters in the Subject Manager.
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {unassignedTasks.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/40 border border-red-700/50"
                    >
                      {t.subjectName}: {t.topic} ({t.durationMinutes}m)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Days Schedule List */}
      <div className="flex flex-col gap-3.5">
        {days.map((day, dayIndex) => {
          const capacityPercent = Math.min(
            100,
            Math.round((day.allocatedMinutes / (day.availableMinutes || 1)) * 100)
          );
          const completedTasksCount = day.tasks.filter((t) => t.completed).length;

          return (
            <Card
              key={day.date}
              className={`border bg-card transition-all ${
                day.isExamDay ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5">
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded border border-border bg-background">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-base font-black font-mono text-foreground leading-tight mt-0.5">
                        {day.displayDate.split(" ")[1]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {dayIndex === 0
                            ? "Today's Schedule"
                            : dayIndex === 1
                            ? "Tomorrow's Schedule"
                            : `${day.dayOfWeek}, ${day.displayDate}`}
                        </h3>
                        {day.isExamDay && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold">
                            Exam Day
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {day.tasks.length} topics scheduled • {completedTasksCount}/{day.tasks.length} completed
                      </p>
                    </div>
                  </div>

                  {/* Daily Capacity Gauge */}
                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="font-bold text-foreground">
                        {(day.allocatedMinutes / 60).toFixed(1)} hrs
                      </span>
                      <span className="text-muted-foreground">
                        / {(day.availableMinutes / 60).toFixed(1)} hrs max
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({capacityPercent}%)
                      </span>
                    </div>
                    <Progress value={capacityPercent} className="w-full sm:w-36 h-1.5" />
                  </div>
                </div>

                {/* Day's Tasks */}
                {day.tasks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    {day.isExamDay
                      ? "Rest & exam morning preparation. No heavy study blocks scheduled."
                      : "No revision tasks assigned for this day."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTaskCompletion(task.id)}
                        className={`p-3 rounded border transition-all cursor-pointer flex items-start gap-2.5 ${
                          task.completed
                            ? "border-green-500/30 bg-green-950/10 opacity-75"
                            : "border-border bg-background hover:border-foreground/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}} // Handled by div click
                          className="mt-1 h-4 w-4 rounded border-border text-primary cursor-pointer accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                task.priority === "High"
                                  ? "text-red-400 bg-red-500/10"
                                  : task.priority === "Medium"
                                  ? "text-orange-400 bg-orange-500/10"
                                  : "text-blue-400 bg-blue-500/10"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {task.durationMinutes} mins
                            </span>
                          </div>
                          <p
                            className={`text-xs font-semibold mt-1 text-foreground leading-snug ${
                              task.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {task.topic}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {task.subjectName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
