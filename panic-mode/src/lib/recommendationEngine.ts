import type { PanicStatus, PrepLevel, SubjectItem } from "@/types/exam";
import {
  resolveTargetTopics,
  normalizeTopics,
  isSyntheticTopic,
} from "./actionPlanGenerator.ts";

export { normalizeTopics, isSyntheticTopic };

export type SubjectDiscipline =
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "english"
  | "computer_science"
  | "economics"
  | "political_science"
  | "general";

export interface SubjectRecommendationItem {
  id: number;
  title: string;
  category: string;
  discipline: SubjectDiscipline;
  disciplineLabel: string;
  description: string;
  actionableStep: string;
  timeContext?: string;
  prepContext?: string;
}

export interface RecommendationEngineInput {
  status: PanicStatus;
  subjectName?: string;
  formTopics?: string;
  savedSubjects?: SubjectItem[];
  chaptersRemaining?: number;
  prepLevel?: PrepLevel;
  dailyStudyHours?: number;
  timeLeft?: { days: number; hours: number; minutes: number; seconds: number } | null;
}

/**
 * Topic classifiers for Chemistry sub-disciplines.
 */
export function isAtomicStructureTopic(text: string): boolean {
  const norm = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!norm) return false;
  return (
    norm.includes("atomic structure") ||
    norm.includes("subatomic") ||
    /\bprotons?\b/i.test(norm) ||
    /\bneutrons?\b/i.test(norm) ||
    /\bisotopes?\b/i.test(norm) ||
    norm.includes("atomic number") ||
    norm.includes("mass number") ||
    norm.includes("electronic configuration") ||
    norm.includes("electron configuration") ||
    norm.includes("atomic model") ||
    norm.includes("energy level") ||
    norm.includes("atomic orbital") ||
    norm.includes("quantum number")
  );
}

export function isStructuralChemistryTopic(text: string): boolean {
  const norm = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!norm) return false;
  return /chemical bond|bonding|vsepr|molecular geometr|hybridis|hybridiz|molecular orbital|lewis structure|electron dot|bond angle|molecular polarity|intermolecular force/i.test(
    norm
  );
}

/**
 * Normalizes and detects the academic discipline from the subject name.
 * Supports the 10 common disciplines plus a robust fallback for custom/unfamiliar subjects.
 * Priority ordering prevents false matches (e.g., "Physical Geography" is Geography, not Physics).
 */
export function detectSubjectDiscipline(subjectName: string = ""): SubjectDiscipline {
  const norm = (subjectName || "").trim().toLowerCase();
  if (!norm) return "general";

  // 1. Geography (checked before Physics so "Physical Geography" is Geography)
  if (
    norm.includes("geograph") ||
    norm.includes("geolog") ||
    norm.includes("earth science") ||
    norm.includes("climatolog") ||
    norm.includes("topograph") ||
    norm.includes("cartograph") ||
    norm.includes("geomorph")
  ) {
    return "geography";
