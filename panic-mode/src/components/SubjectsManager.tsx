import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  BookOpen,
  CheckCircle,
  X,
  Filter,
} from "lucide-react";
import type { SubjectItem, SubjectPriority, SubjectStatus } from "@/types/exam";

interface SubjectsManagerProps {
  subjects: SubjectItem[];
  onUpdateSubjects: (updated: SubjectItem[]) => void;
}

export function SubjectsManager({ subjects, onUpdateSubjects }: SubjectsManagerProps) {
  const [filter, setFilter] = useState<string>("all");
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formTotal, setFormTotal] = useState(4);
  const [formRemaining, setFormRemaining] = useState(2);
  const [formPriority, setFormPriority] = useState<SubjectPriority>("High");
  const [formStatus, setFormStatus] = useState<SubjectStatus>("Needs Revision");
  const [formTopicsText, setFormTopicsText] = useState("");
  const [formNotes, setFormNotes] = useState("");

  function openAddForm() {
    setEditingSubject(null);
    setFormName("");
    setFormTotal(5);
    setFormRemaining(3);
    setFormPriority("High");
    setFormStatus("Needs Revision");
    setFormTopicsText("");
    setFormNotes("");
    setIsAddingNew(true);
  }

  function openEditForm(sub: SubjectItem) {
    setEditingSubject(sub);
    setFormName(sub.name);
    setFormTotal(sub.chaptersTotal);
    setFormRemaining(sub.chaptersRemaining);
    setFormPriority(sub.priority);
    setFormStatus(sub.status);
    setFormTopicsText(sub.topics.join(", "));
    setFormNotes(sub.notes || "");
    setIsAddingNew(true);
  }

  function handleSave() {
    if (!formName.trim()) return;

    const topicsArray = formTopicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingSubject) {
      // Update existing
      const updated = subjects.map((s) =>
        s.id === editingSubject.id
          ? {
              ...s,
              name: formName.trim(),
              chaptersTotal: Number(formTotal) || 1,
              chaptersRemaining: Math.min(Number(formTotal) || 1, Number(formRemaining) || 0),
              priority: formPriority,
              status: formStatus,
              topics: topicsArray,
              notes: formNotes.trim(),
            }
          : s
      );
      onUpdateSubjects(updated);
    } else {
      // Create new
      const newSubject: SubjectItem = {
        id: `sub-${Date.now()}`,
        name: formName.trim(),
        chaptersTotal: Number(formTotal) || 1,
        chaptersRemaining: Math.min(Number(formTotal) || 1, Number(formRemaining) || 0),
        priority: formPriority,
        status: formStatus,
        topics: topicsArray.length > 0 ? topicsArray : [`Chapter 1 Review`],
        notes: formNotes.trim(),
      };
      onUpdateSubjects([...subjects, newSubject]);
    }

    setIsAddingNew(false);
    setEditingSubject(null);
  }

  function handleDelete(id: string) {
    if (subjects.length <= 1) {
      alert("At least one subject is recommended for timetable planning.");
    }
    onUpdateSubjects(subjects.filter((s) => s.id !== id));
  }

  function toggleQuickStatus(id: string) {
    const statusCycle: SubjectStatus[] = [
      "Needs Revision",
      "In Progress",
      "Mastered",
      "Not Started",
    ];
    const updated = subjects.map((s) => {
      if (s.id !== id) return s;
      const currentIndex = statusCycle.indexOf(s.status);
      const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
      return { ...s, status: nextStatus };
    });
    onUpdateSubjects(updated);
  }

  const filteredSubjects = subjects.filter((s) => {
    if (filter === "needs-revision") return s.status === "Needs Revision";
    if (filter === "high-priority") return s.priority === "High";
    if (filter === "in-progress") return s.status === "In Progress";
    if (filter === "mastered") return s.status === "Mastered";
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            Subject-Wise Priorities
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify high-weightage topics and flag areas that urgently need revision.
          </p>
        </div>
        <Button
          onClick={openAddForm}
          size="sm"
          className="text-xs font-bold uppercase tracking-wider h-9 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Subject
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
        {[
          { key: "all", label: "All Subjects" },
          { key: "needs-revision", label: "Needs Revision" },
          { key: "high-priority", label: "High Priority" },
          { key: "in-progress", label: "In Progress" },
          { key: "mastered", label: "Mastered" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.key
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add / Edit Inline Modal Panel */}
      {isAddingNew && (
        <Card className="border border-primary/50 bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Subject Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Distributed Systems"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Chapters
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formTotal}
                  onChange={(e) => setFormTotal(Math.max(1, Number(e.target.value)))}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Chapters Left
                </label>
                <Input
                  type="number"
                  min={0}
                  max={formTotal}
                  value={formRemaining}
                  onChange={(e) => setFormRemaining(Math.max(0, Number(e.target.value)))}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <Select
                value={formPriority}
                onValueChange={(val) => setFormPriority(val as SubjectPriority)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High (High exam weight / Urgency)</SelectItem>
                  <SelectItem value="Medium">Medium (Moderate coverage needed)</SelectItem>
                  <SelectItem value="Low">Low (Quick recap / Minor questions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as SubjectStatus)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Needs Revision">Needs Revision (Urgent!)</SelectItem>
                  <SelectItem value="In Progress">In Progress (Underway)</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Mastered">Mastered (Confident)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Specific Topics / Chapters (comma-separated)
              </label>
              <Input
                value={formTopicsText}
                onChange={(e) => setFormTopicsText(e.target.value)}
                placeholder="e.g. Raft Consensus, CAP Theorem, Vector Clocks"
                className="h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                These topics will be scheduled directly into your revision timetable.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notes &amp; Weak Areas
              </label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Focus on past year numerical questions"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs font-bold uppercase tracking-wider h-8 bg-primary text-primary-foreground"
            >
              {editingSubject ? "Save Changes" : "Create Subject"}
            </Button>
          </div>
        </Card>
      )}

      {/* Subjects Cards List */}
      <div className="flex flex-col gap-3">
        {filteredSubjects.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-12 text-center text-muted-foreground text-sm">
            No subjects match the selected filter.
          </div>
        ) : (
          filteredSubjects.map((sub) => {
            const isCritical = sub.status === "Needs Revision" || sub.priority === "High";
            return (
              <Card
                key={sub.id}
                className={`border bg-card transition-all ${
                  sub.status === "Needs Revision"
                    ? "border-red-500/40 bg-red-950/5"
                    : "border-border"
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-8 rounded-full shrink-0 ${
                          sub.priority === "High"
                            ? "bg-red-500"
                            : sub.priority === "Medium"
                            ? "bg-orange-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{sub.name}</h3>
                          <Badge
                            className={`text-[10px] font-mono uppercase font-bold ${
                              sub.priority === "High"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : sub.priority === "Medium"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {sub.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sub.chaptersRemaining} chapters remaining of {sub.chaptersTotal} total
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => toggleQuickStatus(sub.id)}
                        className={`text-xs px-2.5 py-1 rounded border font-semibold cursor-pointer transition-colors ${
                          sub.status === "Needs Revision"
                            ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                            : sub.status === "In Progress"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20"
                            : sub.status === "Mastered"
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                        title="Click to toggle status"
                      >
                        {sub.status === "Needs Revision" && (
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {sub.status === "Mastered" && (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {sub.status}
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(sub)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sub.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        title="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Topics List Chips */}
                  {sub.topics && sub.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-background text-muted-foreground"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {sub.notes && (
                    <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2.5">
                      {sub.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
