import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Calendar,
  Sparkles,
  Trash2,
  CheckCheck,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import type { StudyTask, TimetableDay, SubjectPriority } from "@/types/exam";

interface DailyChecklistProps {
  days: TimetableDay[];
  allTasks: StudyTask[];
  onToggleTask: (taskId: string) => void;
  onAddCustomTask: (task: Omit<StudyTask, "id">, alsoAddToTimetable?: boolean) => void;
  onDeleteCustomTask: (taskId: string) => void;
  onClearChecklist: () => void;
}

export function DailyChecklist({
  days,
  allTasks,
  onToggleTask,
  onAddCustomTask,
  onDeleteCustomTask,
  onClearChecklist,
}: DailyChecklistProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Form for custom impromptu task
  const [isAdding, setIsAdding] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [customSubject, setCustomSubject] = useState("Custom Revision");
  const [customDuration, setCustomDuration] = useState<number | string>(45);
  const [customPriority, setCustomPriority] = useState<SubjectPriority>("High");
  const [alsoAddToTimetable, setAlsoAddToTimetable] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Get tasks for selected date
  const dayTasks = allTasks.filter((t) => t.date === selectedDate);
  const completedTasks = dayTasks.filter((t) => t.completed);
  const completedPercent =
    dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0;

  const totalMinutes = dayTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const completedMinutes = completedTasks.reduce((acc, t) => acc + t.durationMinutes, 0);

  function handleCreateTask() {
    const trimmedTopic = customTopic.trim();
    if (!trimmedTopic) {
      setTopicError("Task or topic name is required.");
      return;
    }
    setTopicError(null);

    const rawNum = Number(customDuration);
    if (isNaN(rawNum) || rawNum <= 0) {
      setDurationError("Please enter a valid positive duration in minutes.");
      return;
    }

    // Enforce minimum 15 minutes - never allow 4.5 minutes or decimal values below 15
    if (rawNum < 15) {
      setDurationError("Duration must be at least 15 minutes (in 15-minute increments: 15, 30, 45, 60...).");
      return;
    }

    // Enforce 15-minute increments: normalize to nearest multiple of 15
    const normalizedMinutes = Math.max(15, Math.round(rawNum / 15) * 15);
    setDurationError(null);

    onAddCustomTask(
      {
        date: selectedDate,
        subjectId: "custom",
        subjectName: customSubject.trim() || "Quick Review",
        topic: trimmedTopic,
        durationMinutes: normalizedMinutes,
        priority: customPriority,
        completed: false,
        isCustom: true,
      },
      alsoAddToTimetable
    );

    setCustomTopic("");
    setCustomDuration(45);
    setAlsoAddToTimetable(false);
    setIsAdding(false);
  }

  // Ensure available date options
  const dateOptions = days.map((d) => ({
    date: d.date,
    label:
      d.date === todayStr
        ? `Today (${d.displayDate})`
        : `${d.dayOfWeek} (${d.displayDate})`,
  }));

  // Fallback if today isn't explicitly in days
  if (!dateOptions.find((o) => o.date === todayStr)) {
    dateOptions.unshift({ date: todayStr, label: "Today" });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Date Switcher & Completion Header */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-foreground">
                Daily Revision Checklist
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check off topics as you finish them. Progress is saved locally in real time.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                data-testid="button-clear-checklist"
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                disabled={allTasks.length === 0}
                className="text-xs font-semibold h-8 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Clear all checklist items and completed states"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>

              <Button
                data-testid="button-open-add-task"
                onClick={() => setIsAdding(!isAdding)}
                size="sm"
                className="text-xs font-bold uppercase tracking-wider h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Revision Task
              </Button>
            </div>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
            {dateOptions.map((opt) => (
              <button
                key={opt.date}
                onClick={() => setSelectedDate(opt.date)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedDate === opt.date
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Progress Bar for the day */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {completedTasks.length} of {dayTasks.length} tasks completed ({completedPercent}%)
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {(completedMinutes / 60).toFixed(1)} / {(totalMinutes / 60).toFixed(1)} hrs done
              </span>
            </div>
            <Progress value={completedPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Task Form */}
      {isAdding && (
        <Card className="border border-primary/50 bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Add Quick Task for {selectedDate}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Task / Topic Name *
              </label>
              <Input
                data-testid="input-custom-topic"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  if (topicError) setTopicError(null);
                }}
                placeholder="e.g. Photosynthesis and Its Process"
                className={`h-8 text-xs ${topicError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {topicError && (
                <p className="text-[10px] text-destructive font-medium">{topicError}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Subject
              </label>
              <Input
                data-testid="input-custom-subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Subject name"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Duration (minutes) *
              </label>
              <Input
                data-testid="input-custom-duration"
                type="number"
                min={15}
                step={15}
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  if (durationError) setDurationError(null);
                }}
                placeholder="45"
                className={`h-8 text-xs font-mono ${durationError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <span className="text-[10px] text-muted-foreground block">
                Min 15m, 15m steps (15, 30, 45, 60...)
              </span>
              {durationError && (
                <p data-testid="error-task-duration" className="text-[10px] text-destructive font-medium leading-tight">
                  {durationError}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Priority
              </label>
              <select
                data-testid="select-custom-priority"
                value={customPriority}
                onChange={(e) => setCustomPriority(e.target.value as SubjectPriority)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                data-testid="button-create-task"
                size="sm"
                onClick={handleCreateTask}
                className="h-8 text-xs font-bold uppercase bg-primary text-primary-foreground flex-1"
              >
                Add Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setDurationError(null);
                  setTopicError(null);
                }}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>

            {/* Checkbox: Also add topic to revision timetable */}
            <div className="sm:col-span-3 flex items-start gap-2 pt-1 border-t border-border mt-1">
              <input
                data-testid="checkbox-add-to-timetable"
                type="checkbox"
                id="also-add-timetable"
                checked={alsoAddToTimetable}
                onChange={(e) => setAlsoAddToTimetable(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary cursor-pointer accent-primary"
              />
              <div className="flex flex-col">
                <label
                  htmlFor="also-add-timetable"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  Also add this topic to Revision Timetable schedule
                </label>
                <p className="text-[10px] text-muted-foreground">
                  When enabled, saves topic to the subject source so the timetable generator automatically schedules it.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Checklist Tasks List */}
      <div className="flex flex-col gap-2.5">
        {dayTasks.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-12 text-center text-muted-foreground text-sm">
            No revision tasks scheduled for this day. Click &ldquo;Add Revision Task&rdquo; above to create one.
          </div>
        ) : (
          dayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                task.completed
                  ? "border-green-500/30 bg-green-950/10 text-muted-foreground"
                  : "border-border bg-card hover:border-foreground/30 text-foreground"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  className="shrink-0 text-primary hover:scale-105 transition-transform"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        task.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.topic}
                    </p>
                    <Badge
                      className={`text-[9px] uppercase font-bold py-0 px-1.5 ${
                        task.priority === "High"
                          ? "bg-red-500/20 text-red-400"
                          : task.priority === "Medium"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {task.subjectName} • {task.durationMinutes} mins
                  </p>
                </div>
              </div>

              {task.isCustom && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomTask(task.id);
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0"
                  title="Delete custom task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Clearing All Items */}
      {showClearDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-foreground animate-in zoom-in-95 duration-150"
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-destructive shrink-0" />
                Clear All Checklist Items?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will clear all checklist items and reset their completed states. Saved checklist data in localStorage will be cleared.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                type="button"
                data-testid="button-cancel-clear"
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(false)}
                className="text-xs h-8 border-border text-foreground hover:bg-muted font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                data-testid="button-confirm-clear"
                size="sm"
                onClick={() => {
                  onClearChecklist();
                  setShowClearDialog(false);
                }}
                className="text-xs h-8 font-bold uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
