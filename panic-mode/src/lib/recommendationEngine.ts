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
  }

  // 2. Political Science
  if (
    norm.includes("politic") ||
    norm.includes("government") ||
    norm.includes("civics") ||
    norm.includes("constitution") ||
    norm.includes("international relation") ||
    norm.includes("public policy")
  ) {
    return "political_science";
  }

  // 3. Computer Science
  if (
    norm.includes("computer") ||
    norm.includes("software") ||
    norm.includes("program") ||
    norm.includes("coding") ||
    norm.includes("algorithm") ||
    norm.includes("data structure") ||
    norm.includes("python") ||
    norm.includes("java") ||
    norm.includes("database") ||
    norm.includes("sql") ||
    norm.includes("cyber") ||
    norm.includes("architecture") ||
    norm.includes("pipelin") ||
    norm.includes("hazard") ||
    norm.includes("forwarding") ||
    norm.includes("cache coherence") ||
    norm.includes("cache mapping") ||
    norm.includes("instruction scheduling") ||
    norm.includes("branch prediction") ||
    norm.includes("superscalar") ||
    norm.includes("mesi") ||
    /\bcpi\b/i.test(norm)
  ) {
    return "computer_science";
  }

  // 4. Economics
  if (
    norm.includes("econom") ||
    norm.includes("microecon") ||
    norm.includes("macroecon") ||
    norm.includes("finance") ||
    norm.includes("commerce")
  ) {
    return "economics";
  }

  // 5. History
  if (
    norm.includes("histor") ||
    norm.includes("civiliz") ||
    norm.includes("revolution") ||
    norm.includes("war") ||
    norm.includes("medieval") ||
    norm.includes("ancient")
  ) {
    return "history";
  }

  // 6. English / Literature
  if (
    norm.includes("english") ||
    norm.includes("literat") ||
    norm.includes("poetry") ||
    norm.includes("prose") ||
    norm.includes("drama") ||
    norm.includes("rhetoric") ||
    norm.includes("essay")
  ) {
    return "english";
  }

  // 7. Biology
  if (
    norm.includes("bio") ||
    norm.includes("anat") ||
    norm.includes("physiol") ||
    norm.includes("genet") ||
    norm.includes("zoolog") ||
    norm.includes("botan") ||
    norm.includes("ecolog") ||
    norm.includes("cellular") ||
    norm.includes("microbio")
  ) {
    return "biology";
  }

  // 8. Chemistry
  if (
    norm.includes("chem") ||
    norm.includes("organic") ||
    norm.includes("inorganic") ||
    norm.includes("biochem") ||
    norm.includes("stoichiometry") ||
    isAtomicStructureTopic(norm) ||
    isStructuralChemistryTopic(norm)
  ) {
    return "chemistry";
  }

  // 9. Physics
  if (
    norm.includes("physic") ||
    norm.includes("mechanic") ||
    norm.includes("kinematic") ||
    norm.includes("thermodynamic") ||
    norm.includes("optics") ||
    norm.includes("electromagnet") ||
    norm.includes("quantum") ||
    norm.includes("astronomy") ||
    norm.includes("astrophysic")
  ) {
    return "physics";
  }

  // 10. Mathematics
  if (
    norm.includes("math") ||
    norm.includes("algebra") ||
    norm.includes("calculus") ||
    norm.includes("geometry") ||
    norm.includes("trigonometr") ||
    norm.includes("trig") ||
    norm.includes("statistic") ||
    norm.includes("probability") ||
    norm.includes("arithmetic") ||
    norm.includes("discrete") ||
    norm.includes("linear algebra") ||
    norm.includes("quadratic") ||
    norm.includes("polynomial") ||
    norm.includes("equation") ||
    norm.includes("quant")
  ) {
    return "mathematics";
  }

  return "general";
}

/**
 * Returns human-readable label and study signature for each discipline.
 */
export function getDisciplineMetadata(discipline: SubjectDiscipline): { label: string; tag: string } {
  switch (discipline) {
    case "mathematics":
      return { label: "Mathematics", tag: "Active Calculation & Formulas" };
    case "physics":
      return { label: "Physics", tag: "Free-Body Diagrams & Physical Laws" };
    case "chemistry":
      return { label: "Chemistry", tag: "Reactions, Mechanisms & Stoichiometry" };
    case "biology":
      return { label: "Biology", tag: "Anatomical Diagrams & Process Sequences" };
    case "history":
      return { label: "History", tag: "Chronological Timelines & Causal Analysis" };
    case "geography":
      return { label: "Geography", tag: "Spatial Patterns & Case Study Evidence" };
    case "english":
      return { label: "English", tag: "Thematic Motifs & Analytical Quotes" };
    case "computer_science":
      return { label: "Computer Science", tag: "Trace Tables, Complexity & Edge Cases" };
    case "economics":
      return { label: "Economics", tag: "Economic Diagrams & Transmission Chains" };
    case "political_science":
      return { label: "Political Science", tag: "Constitutional Articles & Precedents" };
    default:
      return { label: "Custom Subject", tag: "Structured Academic Mastery" };
  }
}
export function calculateHoursLeft(
  timeLeft?: { days: number; hours: number; minutes: number; seconds: number } | null
): number | null {
  if (!timeLeft) return null;
  const days = Math.max(0, timeLeft.days || 0);
  const hours = Math.max(0, timeLeft.hours || 0);
  const minutes = Math.max(0, timeLeft.minutes || 0);
  return days * 24 + hours + minutes / 60;
}

/**
 * Formats topic list naturally for guidance text.
 */
function formatTopicPhrase(topics: string[], fallbackSubject: string): string {
  if (topics.length === 0) return fallbackSubject;
  if (topics.length === 1) return `"${topics[0]}"`;
  if (topics.length === 2) return `"${topics[0]}" and "${topics[1]}"`;
  return topics.map((topic) => `"${topic}"`).join(", ").replace(/, ([^,]*)$/, ", and $1");
}

/**
 * Formats topic and subject combination avoiding clumsy duplicates
 * like "of Quadratic Equations in Quadratic Equations" or "Mathematics in Mathematics".
 */
export function formatTopicWithSubject(
  topicOrPhrase: string,
  subject: string,
  preposition: string = "in"
): string {
  const cleanTopic = (topicOrPhrase || "").replace(/['"]/g, "").trim().toLowerCase();
  const cleanSub = (subject || "").replace(/['"]/g, "").trim().toLowerCase();

  if (!cleanTopic) return subject;
  if (!cleanSub) return topicOrPhrase;

  if (
    cleanTopic === cleanSub ||
    cleanTopic.includes(cleanSub) ||
    cleanSub.includes(cleanTopic)
  ) {
    return topicOrPhrase;
  }
  return `${topicOrPhrase} ${preposition} ${subject}`;
}

/**
 * Topic classifiers for Computer Architecture sub-disciplines.
 */
export function isPipelineTopic(text: string): boolean {
  const n = (text || "").toLowerCase();
  return (
    n.includes("pipelin") ||
    n.includes("hazard") ||
    n.includes("forwarding") ||
    n.includes("stall") ||
    n.includes("bubble") ||
    n.includes("branch predict") ||
    n.includes("instruction schedul") ||
    n.includes("superscalar") ||
    n.includes("load-use")
  );
}

export function isMesiTopic(text: string): boolean {
  const n = (text || "").toLowerCase();
  return (
    n.includes("mesi") ||
    n.includes("cache coheren") ||
    n.includes("coherence") ||
    n.includes("snoop") ||
    n.includes("bus traffic") ||
    n.includes("invalidat")
  );
}

export function isMemoryHierarchyTopic(text: string): boolean {
  const n = (text || "").toLowerCase();
  return (
    n.includes("cache map") ||
    n.includes("virtual memor") ||
    n.includes("tlb") ||
    n.includes("page table") ||
    n.includes("cache miss") ||
    (n.includes("cache") && !n.includes("coheren") && !n.includes("mesi"))
  );
}

export function isCpiTopic(text: string): boolean {
  const n = (text || "").toLowerCase();
  return (
    /\bcpi\b/i.test(n) ||
    n.includes("performance") ||
    n.includes("execution time") ||
    n.includes("clock cycle") ||
    n.includes("stall penalt")
  );
}

export function isArchitectureTopicOrSubject(text: string): boolean {
  const n = (text || "").toLowerCase();
  return (
    n.includes("architecture") ||
    isPipelineTopic(n) ||
    isMesiTopic(n) ||
    isMemoryHierarchyTopic(n) ||
    isCpiTopic(n)
  );
}

/**
 * Evaluates sleep advice strictly based on panic status.
 * Never promotes or allows sleep deprivation.
 */
function getSleepRecommendation(status: PanicStatus): { title: string; description: string; step: string } {
  switch (status) {
    case "Safe":
      return {
        title: "Full Restorative Sleep & Memory Consolidation",
        description:
          "Aim for a restorative 8 hours of sleep tonight — a well-rested brain consolidates long-term memory, speeds up recall, and sharpens analytical thinking on exam day.",
        step: "Power down screens 30 minutes before bed and protect a solid 8-hour restorative sleep window.",
      };
    case "Risky":
      return {
        title: "Protected Sleep Window (Avoid Sleep Deprivation)",
        description:
          "Protect at least 7 hours of sleep — cutting sleep under revision stress sharply impairs working memory and increases careless calculation slips.",
        step: "Cease studying by your designated cut-off and secure at least 7 hours of uninterrupted rest.",
      };
    case "Critical":
    default:
      return {
        title: "Mandatory Cognitive Rest (No All-Nighters)",
        description:
          "Get at least 6 to 7 hours of sleep before your exam — staying awake all night causes memory blanks and severe analytical errors under exam conditions.",
        step: "Never pull an all-nighter. Wrap up high-yield triage and rest at least 6 to 7 hours.",
      };
  }
}


/**
 * Creates recommendations anchored to the selected topic for every discipline.
 * This is the safe fallback for topics that do not have a dedicated specialist template:
 * it recommends topic-specific learning actions without introducing unrelated subject matter.
 */
function buildTopicAwareRecommendations(args: {
  topics: string[];
  subject: string;
  discipline: SubjectDiscipline;
  disciplineLabel: string;
  timeNote?: string;
  prepNote?: string;
}): SubjectRecommendationItem[] {
  const { topics, subject, discipline, disciplineLabel, timeNote, prepNote } = args;
  const cleanTopics = topics.map((t) => (t || "").trim()).filter(Boolean);
  const focus = formatTopicPhrase(cleanTopics, subject);
  // Keep every selected topic in actionable steps when the user selects multiple topics.
  // Previously only the first topic was used in goals, making the cards contradict their descriptions.
  const primary = cleanTopics.length > 1 ? cleanTopics.join(" / ") : (cleanTopics[0] || subject);
  const lower = `${subject} ${cleanTopics.join(" ")}`.toLowerCase();

  type CardTemplate = {
    title: string;
    category: string;
    description: (focus: string, primary: string, lower: string) => string;
    step: (primary: string, lower: string) => string;
  };

  const templates: Record<SubjectDiscipline, CardTemplate[]> = {
    mathematics: [
      { title: "Core Definitions, Symbols & Conditions", category: "Concept Foundations",
        description: (f) => `Write the definitions, notation, assumptions, and conditions that apply specifically to ${f}. Distinguish similar terms and note when each rule or method is valid.`,
        step: (p) => `Create a one-page reference for "${p}" defining each symbol, rule, condition, and restriction in your syllabus.` },
      { title: "Worked Solutions & Method Selection", category: "Worked Examples",
        description: (f) => `Study worked examples for ${f}. Identify the information given, the quantity to find, the mathematical method selected, and why each transformation is valid.`,
        step: (p) => `Solve 3 progressively harder problems on "${p}", writing every step and explaining why you chose each method.` },
      { title: "Formula Application & Calculations", category: "Calculation Practice",
        description: (f) => `Practise calculations directly related to ${f}. Check substitutions, signs, units where applicable, arithmetic, and any domain or boundary restrictions.`,
        step: (p) => `Complete 4 calculation questions on "${p}" without looking at worked solutions; check each result by substitution or an independent method where possible.` },
      { title: "Common Errors & Answer Verification", category: "Error Analysis",
        description: (f) => `Audit mistakes made in ${f}, including incorrect assumptions, skipped steps, sign errors, invalid transformations, and answers outside the permitted domain.`,
        step: (p) => `Review 3 mistakes or difficult questions on "${p}", identify the first incorrect step, and write the corrected reasoning.` },
      { title: "Timed Questions & Mixed Practice", category: "Exam Practice",
        description: (f) => `Use syllabus-level questions on ${f} to test accuracy and method selection under exam timing, then review the marking criteria.`,
        step: (p) => `Complete a timed set of 5 questions on "${p}" and record accuracy, time taken, and the main error pattern.` },
    ],
    physics: [
      { title: "Key Principles & Physical Quantities", category: "Concept Foundations",
        description: (f) => `Identify the physical principles, quantities, symbols, assumptions, and conditions that govern ${f}. Define each quantity and distinguish the relevant variables.`,
        step: (p, l) => `Write a compact concept sheet for "${p}" with definitions, governing principles, symbols, SI units, and applicable conditions${/electromagnetic induction|faraday|lenz|magnetic flux|induced emf|induced current/.test(l) ? "; include magnetic flux, Faraday's law, Lenz's law, and induced EMF" : ""}.` },
      { title: "Equations, Derivations & Conditions", category: "Law Application",
        description: (f) => `Derive or justify the equations used for ${f}. State the assumptions behind each equation and identify the conditions under which it applies.`,
        step: (p, l) => `Derive the principal equation(s) for "${p}" from your course notes and annotate every symbol and assumption${/electromagnetic induction|faraday|lenz|magnetic flux|induced emf|induced current/.test(l) ? "; practise ε = -NΔΦ/Δt and explain the sign using Lenz's law" : ""}.` },
      { title: "Numerical Problems & Unit Checks", category: "Problem Solving",
        description: (f) => `Practise numerical questions on ${f}, listing knowns and unknowns before selecting an applicable physical relationship. Check dimensions, units, and sign conventions.`,
        step: (p) => `Solve 4 numerical questions on "${p}", showing known values, equation selection, substitutions, units, and final answers.` },
      { title: "Diagrams, Graphs & Physical Interpretation", category: "Visual Analysis",
        description: (f) => `Use diagrams, experimental setups, or graphs relevant to ${f} to explain the physical situation and connect the representation to the governing principle.`,
        step: (p, l) => `Draw or interpret one diagram and one graph for "${p}", explaining what each axis, direction, variable, and trend means${/electromagnetic induction|faraday|lenz|magnetic flux|induced emf|induced current/.test(l) ? "; include the direction of flux change and induced current" : ""}.` },
      { title: "Exam Questions & Error Review", category: "Exam Practice",
        description: (f) => `Practise exam-style questions on ${f}. Review conceptual explanations, equation choice, calculations, units, and the precision required by the mark scheme.`,
        step: (p) => `Complete 3 exam-style questions on "${p}", then correct each lost mark and write the reason for the error.` },
    ],
    chemistry: [
      { title: "Key Terms, Models & Chemical Principles", category: "Concept Foundations",
        description: (f) => `Define the chemical terms, models, species, and principles that are actually part of ${f}. Distinguish similar terms and record the conditions that affect the concept.`,
        step: (p, l) => `Make a definition-and-example sheet for "${p}"${/atomic structure|subatomic|isotope|atomic number|mass number|electron configuration/.test(l) ? " covering protons, neutrons, electrons, atomic number, mass number, isotopes, and electronic configuration where relevant" : ""}${/bond|vsepr|hybrid|lewis|molecular geometr|polarity/.test(l) ? " covering valence electrons, bonding, shape, and polarity where relevant" : ""}.` },
      { title: "Representations, Equations & Mechanisms", category: "Chemical Representation",
        description: (f) => `Practise the representations required for ${f}, such as chemical equations, structures, diagrams, particle models, or reaction mechanisms when applicable. Check notation and chemical accuracy.`,
        step: (p) => `Create 3 accurate representations relevant to "${p}" and annotate what each symbol, structure, or step means.` },
      { title: "Calculations & Quantitative Reasoning", category: "Chemical Calculations",
        description: (f) => `Work through quantitative questions connected to ${f} where calculations are part of your syllabus. Show formula selection, substitutions, units, significant figures, and assumptions.`,
        step: (p) => `Solve 3 syllabus-level questions involving calculations or data interpretation for "${p}". If your syllabus treats it conceptually, replace these with three explanation questions.` },
      { title: "Conditions, Trends & Exceptions", category: "Chemical Reasoning",
        description: (f) => `Identify the conditions, trends, exceptions, and cause-and-effect relationships that explain ${f}. Avoid memorising a rule without understanding when it applies.`,
        step: (p) => `List 3 important trends, conditions, or exceptions for "${p}" and explain the chemical reason behind each.` },
      { title: "Exam Practice & Mark-Scheme Precision", category: "Exam Practice",
        description: (f) => `Answer exam-style questions on ${f}, using precise chemical terminology, correct notation, balanced equations where relevant, and evidence-based explanations.`,
        step: (p) => `Answer 3 exam-style questions on "${p}" and compare your wording, calculations, and notation with the mark scheme.` },
    ],
    biology: [
      { title: "Structures, Terms & Functions", category: "Concept Foundations",
        description: (f) => `Identify the structures, organisms, terms, and functions specifically covered by ${f}. Link each structure or component to its role rather than memorising isolated labels.`,
        step: (p) => `Create a labelled glossary for "${p}" with the essential terms, structures, and functions from your syllabus.` },
      { title: "Processes & Stepwise Explanations", category: "Process Sequencing",

        description: (f) => `Map the stages and causal relationships involved in ${f}, including inputs, outputs, control factors, and what changes at each stage where relevant.`,
        step: (p) => `Write a numbered explanation of the key process in "${p}" from beginning to end, using precise biological terms.` },
      { title: "Diagrams, Data & Evidence", category: "Visual Analysis",
        description: (f) => `Practise interpreting diagrams, graphs, tables, or experimental evidence associated with ${f}. Connect observations to justified biological conclusions.`,
        step: (p) => `Label or interpret one diagram and one data set relevant to "${p}", then write the conclusion supported by the evidence.` },
      { title: "Compare, Explain & Apply", category: "Application",
        description: (f) => `Compare related concepts within ${f} and explain similarities, differences, adaptations, mechanisms, or consequences only where they apply to the topic.`,
        step: (p) => `Answer 3 short questions on "${p}" that require a definition, a comparison, and an explanation of a mechanism or result.` },
      { title: "Exam Practice & Terminology Check", category: "Exam Practice",
        description: (f) => `Practise syllabus questions on ${f}, checking that each explanation uses the correct biological terms and links evidence to the conclusion.`,
        step: (p) => `Complete 3 exam-style questions on "${p}" and correct any missing keywords or unsupported statements.` },
    ],
    history: [
      { title: "Chronology, Context & Key Terms", category: "Historical Context",
        description: (f) => `Establish the period, location, key people, institutions, and terminology necessary to understand ${f}. Separate established facts from interpretations.`,
        step: (p) => `Create a concise fact sheet for "${p}" with key dates, people, places, and terms verified against your course material.` },
      { title: "Causes, Events & Consequences", category: "Causal Analysis",
        description: (f) => `Explain the relevant background causes, immediate triggers, major developments, and consequences of ${f}, distinguishing long-term factors from short-term events.`,
        step: (p) => `Build a cause-event-consequence timeline for "${p}" and explain the links between the main stages.` },
      { title: "Sources, Evidence & Interpretation", category: "Source Analysis",
        description: (f) => `Evaluate the evidence and interpretations used to study ${f}. Consider source origin, purpose, context, reliability, and limitations where source analysis is required.`,
        step: (p) => `Analyse one source or historical interpretation relevant to "${p}", stating what it supports and what it cannot establish.` },
      { title: "Compare Interpretations & Significance", category: "Comparative Analysis",
        description: (f) => `Compare relevant people, events, policies, or interpretations within ${f}. Support each point with specific evidence rather than broad claims.`,
        step: (p) => `Write a short comparison on "${p}" using at least 3 specific facts or examples from your syllabus.` },
      { title: "Structured Answers & Evidence Review", category: "Exam Practice",
        description: (f) => `Practise structured answers on ${f}, answering the question directly and supporting each claim with accurate dates, events, and evidence.`,
        step: (p) => `Write one timed answer on "${p}", then check factual accuracy, relevance, chronology, and how well each paragraph supports the conclusion.` },
    ],
    geography: [
      { title: "Key Processes, Terms & Locations", category: "Concept Foundations",
        description: (f) => `Define the geographical terms, processes, locations, and spatial patterns that are central to ${f}. Distinguish physical processes from human factors where relevant.`,
        step: (p) => `Create a concise topic sheet for "${p}" with key definitions, processes, locations, and spatial patterns.` },
      { title: "Annotated Diagrams & Spatial Patterns", category: "Spatial Analysis",
        description: (f) => `Use an annotated sketch, map, cross-section, or spatial diagram to explain the patterns and processes associated with ${f}, choosing a representation suited to the topic.`,
        step: (p) => `Draw or annotate a map, diagram, or process sequence for "${p}" and explain each label.` },
      { title: "Data, Graphs & Field Evidence", category: "Data Interpretation",
        description: (f) => `Interpret relevant maps, graphs, statistics, fieldwork findings, or case-study evidence for ${f}. State what the data show and avoid conclusions not supported by it.`,
        step: (p) => `Interpret one graph, map, or data table relevant to "${p}" and write 2 evidence-based conclusions.` },
      { title: "Causes, Impacts & Responses", category: "Applied Geography",
        description: (f) => `Explain the causes, spatial distribution, impacts, and management responses relevant to ${f}, selecting only the factors that fit the topic.`,
        step: (p) => `Build a cause-impact-response table for "${p}" with one specific example or case study from your syllabus.` },
      { title: "Case Evidence & Exam Evaluation", category: "Exam Practice",
        description: (f) => `Practise explaining ${f} using accurate geographical vocabulary and relevant named evidence. Evaluate the strengths and limitations of responses when the question asks for judgement.`,
        step: (p) => `Answer one exam-style question on "${p}" using named evidence, a clear explanation, and a supported conclusion.` },
    ],
    english: [
      { title: "Meaning, Context & Key Vocabulary", category: "Textual Understanding",
        description: (f) => `Identify the central ideas, terminology, context, and purpose relevant to ${f}. Use the actual text or syllabus material as evidence rather than relying on generic interpretations.`,
        step: (p) => `Write a short summary of "${p}" and list the key terms, ideas, or passages that support your understanding.` },
      { title: "Close Reading & Evidence Selection", category: "Textual Evidence",
        description: (f) => `Examine the specific wording, structure, examples, or passages connected to ${f}. Select evidence that directly supports an interpretation and explain its effect.`,
        step: (p) => `Choose 3 short pieces of evidence relevant to "${p}" and explain what each demonstrates.` },
      { title: "Structure, Technique & Effect", category: "Analytical Reading",
        description: (f) => `Analyse the language, structure, form, or rhetorical techniques relevant to ${f}, explaining their effect in context instead of merely naming a device.`,
        step: (p) => `Analyse one short passage or example from "${p}" using evidence, technique, and effect.` },
      { title: "Argument, Interpretation & Paragraph Structure", category: "Written Analysis",
        description: (f) => `Develop a clear interpretation or argument about ${f}, with a focused claim, relevant evidence, explanation, and a link back to the question.`,
        step: (p) => `Draft one analytical paragraph on "${p}" using a clear claim, precise evidence, and an explanation of its significance.` },
      { title: "Timed Response & Editing", category: "Exam Practice",
        description: (f) => `Practise the response format required for ${f}, then review relevance, clarity, grammar, evidence, and whether the answer directly addresses the prompt.`,
        step: (p) => `Write a timed response on "${p}" and edit it for clarity, evidence, structure, and direct relevance to the question.` },
    ],
    computer_science: [
      { title: "Core Concepts, Terms & System Model", category: "Concept Foundations",
        description: (f) => `Define the technical concepts, components, states, and assumptions relevant to ${f}. Explain how the parts interact instead of memorising isolated terminology.`,
        step: (p) => `Create a reference sheet for "${p}" defining the main terms, components, inputs, outputs, and assumptions.` },
      { title: "Trace, Diagram or Architecture Walkthrough", category: "System Analysis",
        description: (f) => `Trace the operation of ${f} step by step. Use a suitable diagram, state table, execution trace, data flow, or architecture sketch for the topic.`,
        step: (p) => `Produce one labelled diagram or trace table for "${p}" and explain the state or data changes at each step.` },
      { title: "Worked Problems & Edge Cases", category: "Problem Solving",
        description: (f) => `Solve problems related to ${f}, stating assumptions and checking normal cases, boundary conditions, and failure cases where applicable.`,
        step: (p) => `Work through 3 questions on "${p}", including at least one edge case or a trace that tests your understanding.` },
      { title: "Trade-offs, Complexity & Limitations", category: "Technical Evaluation",
        description: (f) => `Evaluate the performance, correctness, complexity, resource use, or design trade-offs relevant to ${f}, using only criteria appropriate to the topic.`,
        step: (p) => `List the main benefits, limitations, and trade-offs of "${p}" and support each with a technical reason.` },
      { title: "Exam Practice & Debugging", category: "Exam Practice",
        description: (f) => `Answer exam-style questions on ${f}, checking definitions, traces, diagrams, calculations, and the reasoning behind each answer.`,
        step: (p) => `Complete 3 exam-style questions on "${p}" and record any misconception or tracing error you need to revisit.` },
    ],
    economics: [
      { title: "Definitions, Assumptions & Economic Model", category: "Concept Foundations",
        description: (f) => `Define the economic terms, assumptions, variables, and models that apply to ${f}. Distinguish correlation from causation and state the context of each claim.`,
        step: (p) => `Create a definition sheet for "${p}" with key terms, assumptions, variables, and relationships.` },
      { title: "Mechanism & Causal Chain", category: "Economic Reasoning",
        description: (f) => `Explain the causal mechanism behind ${f} in a clear sequence, identifying the initial change, intermediate effects, and likely outcomes.`,
        step: (p) => `Write a step-by-step causal chain for "${p}" and identify the assumptions needed for the outcome to follow.` },
      { title: "Diagram, Formula or Data Interpretation", category: "Analytical Tools",
        description: (f) => `Use the diagram, formula, data, or model actually required for ${f}. Label variables precisely and explain what a change in each relevant variable means.`,
        step: (p) => `Draw, calculate, or interpret one syllabus-relevant diagram, formula, or data set for "${p}", with a short explanation.` },
      { title: "Evaluation, Assumptions & Trade-offs", category: "Evaluation",
        description: (f) => `Evaluate ${f} by considering the assumptions, time horizon, stakeholders, unintended consequences, and alternative explanations relevant to the question.`,
        step: (p) => `Write one balanced evaluation of "${p}" with two supported arguments, one limitation, and a justified conclusion.` },
      { title: "Applied Examples & Exam Practice", category: "Exam Practice",
        description: (f) => `Apply the economic reasoning for ${f} to a relevant example and practise writing precise, evidence-based exam answers.`,
        step: (p) => `Answer one timed question on "${p}" using a definition, a logical chain of reasoning, relevant evidence, and evaluation where required.` },
    ],
    political_science: [
      { title: "Core Concepts, Institutions & Terms", category: "Concept Foundations",
        description: (f) => `Define the political concepts, institutions, actors, and terms relevant to ${f}. Distinguish formal rules from actual political practice where relevant.`,
        step: (p) => `Build a topic sheet for "${p}" with precise definitions, key actors, institutions, and governing principles from your syllabus.` },
        title: "Rules, Powers & Institutional Relationships",
        category: "Institutional Analysis",
        description: (f) => `Map the rules, powers, responsibilities, and relationships that govern ${f}, using the correct constitutional, legal, or institutional framework for your course.`,
        step: (p) => `Create a labelled map or table for "${p}" showing the relevant institutions, powers, and relationships.` },
      { title: "Arguments, Evidence & Case Examples", category: "Evidence",
        description: (f) => `Support claims about ${f} with relevant constitutional provisions, laws, political theories, cases, or examples actually covered in your syllabus.`,
        step: (p) => `Write 3 claims about "${p}" and attach one specific syllabus-based piece of evidence to each.` },
      { title: "Compare Perspectives & Evaluate", category: "Critical Analysis",
        description: (f) => `Compare competing interpretations or viewpoints about ${f}. Explain the reasoning behind each position and assess strengths, limitations, and implications.`,
        step: (p) => `Create a two-sided argument on "${p}" and finish with a conclusion supported by evidence.` },
      { title: "Structured Answers & Current Context", category: "Exam Practice",
        description: (f) => `Practise structured answers on ${f}, keeping factual claims accurate and separating course principles from examples or contemporary developments.`,
        step: (p) => `Write one timed answer on "${p}" with a direct argument, relevant evidence, a counterpoint, and a supported conclusion.` },
    ],
    general: [
      { title: "Topic Definitions & Learning Objectives", category: "Foundations",
        description: (f) => `Identify the precise meaning, key terms, scope, and learning objectives of ${f}. Use the course material to determine which concepts and details are required.`,
        step: (p) => `Write a one-page summary of "${p}" with definitions, essential points, and questions you still cannot answer.` },
      { title: "Break the Topic into Components", category: "Structured Learning",
        description: (f) => `Divide ${f} into smaller components and explain how each component relates to the overall topic. Keep the outline tied to your actual syllabus.`,
        step: (p) => `Break "${p}" into 3–5 sub-points and write a short explanation of each using your course material.` },
      { title: "Examples, Applications & Evidence", category: "Application",
        description: (f) => `Find or work through examples directly relevant to ${f}, noting what each example demonstrates and where its assumptions or limitations lie.`,
        step: (p) => `Write down 2 course-relevant examples of "${p}" and explain what each one demonstrates.` },
      { title: "Active Recall & Knowledge Gaps", category: "Active Recall",
        description: (f) => `Test your understanding of ${f} without notes, then identify gaps in definitions, explanations, examples, or applications.`,
        step: (p) => `Answer 5 questions about "${p}" from memory, then revisit only the points you could not explain accurately.` },
      { title: "Practice, Feedback & Revision", category: "Exam Practice",
        description: (f) => `Practise the question format required for ${f}, compare your work with course guidance, and correct misunderstandings before repeating the task.`,
        step: (p) => `Complete 3 practice questions on "${p}", mark them against course guidance, and record the corrections.` },
    ],
  };

  return templates[discipline].map((template, index) => ({
    id: index + 1,
    title: template.title,
    category: template.category,
    discipline,
    disciplineLabel,
    description: template.description(focus, primary, lower),
    actionableStep: template.step(primary, lower),
    timeContext: timeNote,
    prepContext: prepNote,
  }));
}

/**
 * Generates an ordered, non-repetitive set of personalized, subject-specific recommendations.
 */
export function generateSubjectRecommendations(input: RecommendationEngineInput): SubjectRecommendationItem[] {
  const {
    status,
    subjectName = "",
    formTopics = "",
    savedSubjects = [],
    chaptersRemaining = 1,
    prepLevel = "Partially Prepared",
    dailyStudyHours = 4,
    timeLeft = null,
  } = input;

  if (!status) return [];

  const { topics, subject } = resolveTargetTopics({
    subjectName,
    formTopics,
    savedSubjects,
    chaptersRemaining,
  });

  let discipline = detectSubjectDiscipline(subject);
  // If discipline is general (or subject is generic) and explicit topics exist,
  // infer discipline from the topics so specific topic entries (like Quadratic Equations)
  // are never misclassified as general!
  if (
    (discipline === "general" ||
      subject.toLowerCase() === "target exam" ||
      subject.toLowerCase() === "general exam preparation") &&
    topics.length > 0
  ) {
    for (const t of topics) {
      const topicDisc = detectSubjectDiscipline(t);
      if (topicDisc !== "general") {
        discipline = topicDisc;
        break;
      }
    }
  }

  const { label: disciplineLabel } = getDisciplineMetadata(discipline);
  const hasExplicitTopics = topics.length > 0;
  const topicPhrase = formatTopicPhrase(topics, subject);
  const primaryTopic = topics[0] ? `"${topics[0]}"` : `"${subject}"`;
  const hoursLeft = calculateHoursLeft(timeLeft);

  // Derive time remaining guidance note
  let timeNote: string | undefined;
  if (hoursLeft !== null) {
    if (hoursLeft < 12) {
      timeNote = "🚨 Urgent deadline (<12h left): Skip non-essential reading. Focus strictly on memorizing high-yield concepts and essential questions.";
    } else if (hoursLeft < 24) {
      timeNote = "⚡ Exam within 24 hours: Restrict study to timed active recall rather than re-reading notes.";
    } else if (hoursLeft <= 72) {
      timeNote = "📅 Sprint Revision (1-3 Days): Work in focused 45-minute blocks with 10-minute pauses to maintain peak retention.";
    } else {
      timeNote = "🗓️ Structured Revision (>3 Days): Build deep mastery with progressive difficulty problem sets and comprehensive review.";
    }
  }

  // Derive prep level guidance note
  let prepNote: string | undefined;
  const normPrep = (prepLevel || "").toLowerCase();
  if (normPrep.includes("not started")) {
    prepNote = "🔰 Foundation Phase: Master fundamental definitions, worked examples, and basic principles before attempting hard questions.";
  } else if (normPrep.includes("barely") || normPrep.includes("partially") || normPrep.includes("need")) {
    prepNote = "📈 Active Consolidation Phase: Shift from reading to active problem solving and diagram sketching to fix weak areas.";
  } else {
    prepNote = "🎯 Exam Readiness Phase: Do timed exam simulations, review official mark schemes, and test complex edge cases.";
  }

  const items: SubjectRecommendationItem[] = [];

  // Keep the existing specialist templates for topics already covered by dedicated logic.
  // For other explicit topics, use a discipline-aware topic-first fallback so the engine
  // does not inject unrelated examples from a broad subject template.
  const subjectText = (subject || "").toLowerCase();
  const allTopicsAreQuadratic =
    topics.length > 0 && topics.every((topic) => topic.toLowerCase().includes("quadratic"));
  const allTopicsAreAtomicStructure =
    topics.length > 0 && topics.every((topic) => isAtomicStructureTopic(topic));
  const allTopicsAreStructuralChemistry =
    topics.length > 0 && topics.every((topic) => isStructuralChemistryTopic(topic));
  const allTopicsAreComputerArchitecture =
    topics.length > 0 && topics.every((topic) => isArchitectureTopicOrSubject(topic));

  // Specialist templates may run only when the selected topic set matches that specialist.
  // Do not let one word in a mixed topic list (e.g. Quadratic Equations + Trigonometry)
  // route the entire request into a single-topic template.
  const hasDedicatedTopicTemplate =
    (discipline === "mathematics" &&
      ((subjectText.includes("quadratic") && (topics.length === 0 || allTopicsAreQuadratic)) ||
        allTopicsAreQuadratic)) ||
    (discipline === "chemistry" &&
      ((topics.length === 0 && (isAtomicStructureTopic(subjectText) || isStructuralChemistryTopic(subjectText))) ||
        (allTopicsAreAtomicStructure || allTopicsAreStructuralChemistry))) ||
    (discipline === "computer_science" &&
      ((topics.length === 0 && isArchitectureTopicOrSubject(subjectText)) ||
        allTopicsAreComputerArchitecture));

  if (hasExplicitTopics && !hasDedicatedTopicTemplate) {
        description: (f) => `Map the stages and causal relationships involved in ${f}, including inputs, outputs, control factors, and what changes at each stage where relevant.`,
        step: (p) => `Write a numbered explanation of the key process in "${p}" from beginning to end, using precise biological terms.` },
      { title: "Diagrams, Data & Evidence", category: "Visual Analysis",
        description: (f) => `Practise interpreting diagrams, graphs, tables, or experimental evidence associated with ${f}. Connect observations to justified biological conclusions.`,
        step: (p) => `Label or interpret one diagram and one data set relevant to "${p}", then write the conclusion supported by the evidence.` },
      { title: "Compare, Explain & Apply", category: "Application",
        description: (f) => `Compare related concepts within ${f} and explain similarities, differences, adaptations, mechanisms, or consequences only where they apply to the topic.`,
        step: (p) => `Answer 3 short questions on "${p}" that require a definition, a comparison, and an explanation of a mechanism or result.` },
      { title: "Exam Practice & Terminology Check", category: "Exam Practice",
        description: (f) => `Practise syllabus questions on ${f}, checking that each explanation uses the correct biological terms and links evidence to the conclusion.`,
        step: (p) => `Complete 3 exam-style questions on "${p}" and correct any missing keywords or unsupported statements.` },
    ],
    history: [
      { title: "Chronology, Context & Key Terms", category: "Historical Context",
        description: (f) => `Establish the period, location, key people, institutions, and terminology necessary to understand ${f}. Separate established facts from interpretations.`,
        step: (p) => `Create a concise fact sheet for "${p}" with key dates, people, places, and terms verified against your course material.` },
      { title: "Causes, Events & Consequences", category: "Causal Analysis",
        description: (f) => `Explain the relevant background causes, immediate triggers, major developments, and consequences of ${f}, distinguishing long-term factors from short-term events.`,
        step: (p) => `Build a cause-event-consequence timeline for "${p}" and explain the links between the main stages.` },
      { title: "Sources, Evidence & Interpretation", category: "Source Analysis",
        description: (f) => `Evaluate the evidence and interpretations used to study ${f}. Consider source origin, purpose, context, reliability, and limitations where source analysis is required.`,
        step: (p) => `Analyse one source or historical interpretation relevant to "${p}", stating what it supports and what it cannot establish.` },
      { title: "Compare Interpretations & Significance", category: "Comparative Analysis",
        description: (f) => `Compare relevant people, events, policies, or interpretations within ${f}. Support each point with specific evidence rather than broad claims.`,
        step: (p) => `Write a short comparison on "${p}" using at least 3 specific facts or examples from your syllabus.` },
      { title: "Structured Answers & Evidence Review", category: "Exam Practice",
        description: (f) => `Practise structured answers on ${f}, answering the question directly and supporting each claim with accurate dates, events, and evidence.`,
        step: (p) => `Write one timed answer on "${p}", then check factual accuracy, relevance, chronology, and how well each paragraph supports the conclusion.` },
    ],
    geography: [
      { title: "Key Processes, Terms & Locations", category: "Concept Foundations",
        description: (f) => `Define the geographical terms, processes, locations, and spatial patterns that are central to ${f}. Distinguish physical processes from human factors where relevant.`,
        step: (p) => `Create a concise topic sheet for "${p}" with key definitions, processes, locations, and spatial patterns.` },
      { title: "Annotated Diagrams & Spatial Patterns", category: "Spatial Analysis",
        description: (f) => `Use an annotated sketch, map, cross-section, or spatial diagram to explain the patterns and processes associated with ${f}, choosing a representation suited to the topic.`,
        step: (p) => `Draw or annotate a map, diagram, or process sequence for "${p}" and explain each label.` },
      { title: "Data, Graphs & Field Evidence", category: "Data Interpretation",
        description: (f) => `Interpret relevant maps, graphs, statistics, fieldwork findings, or case-study evidence for ${f}. State what the data show and avoid conclusions not supported by it.`,
        step: (p) => `Interpret one graph, map, or data table relevant to "${p}" and write 2 evidence-based conclusions.` },
      { title: "Causes, Impacts & Responses", category: "Applied Geography",
        description: (f) => `Explain the causes, spatial distribution, impacts, and management responses relevant to ${f}, selecting only the factors that fit the topic.`,
        step: (p) => `Build a cause-impact-response table for "${p}" with one specific example or case study from your syllabus.` },
      { title: "Case Evidence & Exam Evaluation", category: "Exam Practice",
        description: (f) => `Practise explaining ${f} using accurate geographical vocabulary and relevant named evidence. Evaluate the strengths and limitations of responses when the question asks for judgement.`,
        step: (p) => `Answer one exam-style question on "${p}" using named evidence, a clear explanation, and a supported conclusion.` },
    ],
    english: [
      { title: "Meaning, Context & Key Vocabulary", category: "Textual Understanding",
        description: (f) => `Identify the central ideas, terminology, context, and purpose relevant to ${f}. Use the actual text or syllabus material as evidence rather than relying on generic interpretations.`,
        step: (p) => `Write a short summary of "${p}" and list the key terms, ideas, or passages that support your understanding.` },
      { title: "Close Reading & Evidence Selection", category: "Textual Evidence",
        description: (f) => `Examine the specific wording, structure, examples, or passages connected to ${f}. Select evidence that directly supports an interpretation and explain its effect.`,
        step: (p) => `Choose 3 short pieces of evidence relevant to "${p}" and explain what each demonstrates.` },
      { title: "Structure, Technique & Effect", category: "Analytical Reading",
        description: (f) => `Analyse the language, structure, form, or rhetorical techniques relevant to ${f}, explaining their effect in context instead of merely naming a device.`,
        step: (p) => `Analyse one short passage or example from "${p}" using evidence, technique, and effect.` },
      { title: "Argument, Interpretation & Paragraph Structure", category: "Written Analysis",
        description: (f) => `Develop a clear interpretation or argument about ${f}, with a focused claim, relevant evidence, explanation, and a link back to the question.`,
        step: (p) => `Draft one analytical paragraph on "${p}" using a clear claim, precise evidence, and an explanation of its significance.` },
      { title: "Timed Response & Editing", category: "Exam Practice",
        description: (f) => `Practise the response format required for ${f}, then review relevance, clarity, grammar, evidence, and whether the answer directly addresses the prompt.`,
        step: (p) => `Write a timed response on "${p}" and edit it for clarity, evidence, structure, and direct relevance to the question.` },
    ],
    computer_science: [
      { title: "Core Concepts, Terms & System Model", category: "Concept Foundations",
        description: (f) => `Define the technical concepts, components, states, and assumptions relevant to ${f}. Explain how the parts interact instead of memorising isolated terminology.`,
        step: (p) => `Create a reference sheet for "${p}" defining the main terms, components, inputs, outputs, and assumptions.` },
      { title: "Trace, Diagram or Architecture Walkthrough", category: "System Analysis",
        description: (f) => `Trace the operation of ${f} step by step. Use a suitable diagram, state table, execution trace, data flow, or architecture sketch for the topic.`,
        step: (p) => `Produce one labelled diagram or trace table for "${p}" and explain the state or data changes at each step.` },
      { title: "Worked Problems & Edge Cases", category: "Problem Solving",
        description: (f) => `Solve problems related to ${f}, stating assumptions and checking normal cases, boundary conditions, and failure cases where applicable.`,
        step: (p) => `Work through 3 questions on "${p}", including at least one edge case or a trace that tests your understanding.` },
      { title: "Trade-offs, Complexity & Limitations", category: "Technical Evaluation",
        description: (f) => `Evaluate the performance, correctness, complexity, resource use, or design trade-offs relevant to ${f}, using only criteria appropriate to the topic.`,
        step: (p) => `List the main benefits, limitations, and trade-offs of "${p}" and support each with a technical reason.` },
      { title: "Exam Practice & Debugging", category: "Exam Practice",
        description: (f) => `Answer exam-style questions on ${f}, checking definitions, traces, diagrams, calculations, and the reasoning behind each answer.`,
        step: (p) => `Complete 3 exam-style questions on "${p}" and record any misconception or tracing error you need to revisit.` },
    ],
    economics: [
      { title: "Definitions, Assumptions & Economic Model", category: "Concept Foundations",
        description: (f) => `Define the economic terms, assumptions, variables, and models that apply to ${f}. Distinguish correlation from causation and state the context of each claim.`,
        step: (p) => `Create a definition sheet for "${p}" with key terms, assumptions, variables, and relationships.` },
      { title: "Mechanism & Causal Chain", category: "Economic Reasoning",
        description: (f) => `Explain the causal mechanism behind ${f} in a clear sequence, identifying the initial change, intermediate effects, and likely outcomes.`,
        step: (p) => `Write a step-by-step causal chain for "${p}" and identify the assumptions needed for the outcome to follow.` },
      { title: "Diagram, Formula or Data Interpretation", category: "Analytical Tools",
        description: (f) => `Use the diagram, formula, data, or model actually required for ${f}. Label variables precisely and explain what a change in each relevant variable means.`,
        step: (p) => `Draw, calculate, or interpret one syllabus-relevant diagram, formula, or data set for "${p}", with a short explanation.` },
      { title: "Evaluation, Assumptions & Trade-offs", category: "Evaluation",
        description: (f) => `Evaluate ${f} by considering the assumptions, time horizon, stakeholders, unintended consequences, and alternative explanations relevant to the question.`,
        step: (p) => `Write one balanced evaluation of "${p}" with two supported arguments, one limitation, and a justified conclusion.` },
      { title: "Applied Examples & Exam Practice", category: "Exam Practice",
        description: (f) => `Apply the economic reasoning for ${f} to a relevant example and practise writing precise, evidence-based exam answers.`,
        step: (p) => `Answer one timed question on "${p}" using a definition, a logical chain of reasoning, relevant evidence, and evaluation where required.` },
    ],
    political_science: [
      { title: "Core Concepts, Institutions & Terms", category: "Concept Foundations",
        description: (f) => `Define the political concepts, institutions, actors, and terms relevant to ${f}. Distinguish formal rules from actual political practice where relevant.`,
        step: (p) => `Build a topic sheet for "${p}" with precise definitions, key actors, institutions, and governing principles from your syllabus.` },
      { title: "Rules, Powers & Institutional Relationships", category: "Institutional Analysis",
        description: (f) => `Map the rules, powers, responsibilities, and relationships that govern ${f}, using the correct constitutional, legal, or institutional framework for your course.`,
        step: (p) => `Create a labelled map or table for "${p}" showing the relevant institutions, powers, and relationships.` },
      { title: "Arguments, Evidence & Case Examples", category: "Evidence",
        description: (f) => `Support claims about ${f} with relevant constitutional provisions, laws, political theories, cases, or examples actually covered in your syllabus.`,
        step: (p) => `Write 3 claims about "${p}" and attach one specific syllabus-based piece of evidence to each.` },
      { title: "Compare Perspectives & Evaluate", category: "Critical Analysis",
        description: (f) => `Compare competing interpretations or viewpoints about ${f}. Explain the reasoning behind each position and assess strengths, limitations, and implications.`,
        step: (p) => `Create a two-sided argument on "${p}" and finish with a conclusion supported by evidence.` },
      { title: "Structured Answers & Current Context", category: "Exam Practice",
        description: (f) => `Practise structured answers on ${f}, keeping factual claims accurate and separating course principles from examples or contemporary developments.`,
        step: (p) => `Write one timed answer on "${p}" with a direct argument, relevant evidence, a counterpoint, and a supported conclusion.` },
    ],
    general: [
      { title: "Topic Definitions & Learning Objectives", category: "Foundations",
        description: (f) => `Identify the precise meaning, key terms, scope, and learning objectives of ${f}. Use the course material to determine which concepts and details are required.`,
        step: (p) => `Write a one-page summary of "${p}" with definitions, essential points, and questions you still cannot answer.` },
      { title: "Break the Topic into Components", category: "Structured Learning",
        description: (f) => `Divide ${f} into smaller components and explain how each component relates to the overall topic. Keep the outline tied to your actual syllabus.`,
        step: (p) => `Break "${p}" into 3–5 sub-points and write a short explanation of each using your course material.` },
      { title: "Examples, Applications & Evidence", category: "Application",
        description: (f) => `Find or work through examples directly relevant to ${f}, noting what each example demonstrates and where its assumptions or limitations lie.`,
        step: (p) => `Write down 2 course-relevant examples of "${p}" and explain what each one demonstrates.` },
      { title: "Active Recall & Knowledge Gaps", category: "Active Recall",
        description: (f) => `Test your understanding of ${f} without notes, then identify gaps in definitions, explanations, examples, or applications.`,
        step: (p) => `Answer 5 questions about "${p}" from memory, then revisit only the points you could not explain accurately.` },
      { title: "Practice, Feedback & Revision", category: "Exam Practice",
        description: (f) => `Practise the question format required for ${f}, compare your work with course guidance, and correct misunderstandings before repeating the task.`,
        step: (p) => `Complete 3 practice questions on "${p}", mark them against course guidance, and record the corrections.` },
    ],
  };

  return templates[discipline].map((template, index) => ({
    id: index + 1,
    title: template.title,
    category: template.category,
    discipline,
    disciplineLabel,
    description: template.description(focus, primary, lower),
    actionableStep: template.step(primary, lower),
    timeContext: timeNote,
    prepContext: prepNote,
  }));
}

/**
 * Generates an ordered, non-repetitive set of personalized, subject-specific recommendations.
 */
export function generateSubjectRecommendations(input: RecommendationEngineInput): SubjectRecommendationItem[] {
  const {
    status,
    subjectName = "",
    formTopics = "",
    savedSubjects = [],
    chaptersRemaining = 1,
    prepLevel = "Partially Prepared",
    dailyStudyHours = 4,
    timeLeft = null,
  } = input;

  if (!status) return [];

  const { topics, subject } = resolveTargetTopics({
    subjectName,
    formTopics,
    savedSubjects,
    chaptersRemaining,
  });

  let discipline = detectSubjectDiscipline(subject);
  // If discipline is general (or subject is generic) and explicit topics exist,
  // infer discipline from the topics so specific topic entries (like Quadratic Equations)
  // are never misclassified as general!
  if (
    (discipline === "general" ||
      subject.toLowerCase() === "target exam" ||
      subject.toLowerCase() === "general exam preparation") &&
    topics.length > 0
  ) {
    for (const t of topics) {
      const topicDisc = detectSubjectDiscipline(t);
      if (topicDisc !== "general") {
        discipline = topicDisc;
        break;
      }
    }
  }

  const { label: disciplineLabel } = getDisciplineMetadata(discipline);
  const hasExplicitTopics = topics.length > 0;
  const topicPhrase = formatTopicPhrase(topics, subject);
  const primaryTopic = topics[0] ? `"${topics[0]}"` : `"${subject}"`;
  const hoursLeft = calculateHoursLeft(timeLeft);

  // Derive time remaining guidance note
  let timeNote: string | undefined;
  if (hoursLeft !== null) {
    if (hoursLeft < 12) {
      timeNote = "🚨 Urgent deadline (<12h left): Skip non-essential reading. Focus strictly on memorizing high-yield concepts and essential questions.";
    } else if (hoursLeft < 24) {
      timeNote = "⚡ Exam within 24 hours: Restrict study to timed active recall rather than re-reading notes.";
    } else if (hoursLeft <= 72) {
      timeNote = "📅 Sprint Revision (1-3 Days): Work in focused 45-minute blocks with 10-minute pauses to maintain peak retention.";
    } else {
      timeNote = "🗓️ Structured Revision (>3 Days): Build deep mastery with progressive difficulty problem sets and comprehensive review.";
    }
  }

  // Derive prep level guidance note
  let prepNote: string | undefined;
  const normPrep = (prepLevel || "").toLowerCase();
  if (normPrep.includes("not started")) {
    prepNote = "🔰 Foundation Phase: Master fundamental definitions, worked examples, and basic principles before attempting hard questions.";
  } else if (normPrep.includes("barely") || normPrep.includes("partially") || normPrep.includes("need")) {
    prepNote = "📈 Active Consolidation Phase: Shift from reading to active problem solving and diagram sketching to fix weak areas.";
  } else {
    prepNote = "🎯 Exam Readiness Phase: Do timed exam simulations, review official mark schemes, and test complex edge cases.";
  }

  const items: SubjectRecommendationItem[] = [];

  // Keep the existing specialist templates for topics already covered by dedicated logic.
  // For other explicit topics, use a discipline-aware topic-first fallback so the engine
  // does not inject unrelated examples from a broad subject template.
  const subjectText = (subject || "").toLowerCase();
  const allTopicsAreQuadratic =
    topics.length > 0 && topics.every((topic) => topic.toLowerCase().includes("quadratic"));
  const allTopicsAreAtomicStructure =
    topics.length > 0 && topics.every((topic) => isAtomicStructureTopic(topic));
  const allTopicsAreStructuralChemistry =
    topics.length > 0 && topics.every((topic) => isStructuralChemistryTopic(topic));
  const allTopicsAreComputerArchitecture =
    topics.length > 0 && topics.every((topic) => isArchitectureTopicOrSubject(topic));

  // Specialist templates may run only when the selected topic set matches that specialist.
  // Do not let one word in a mixed topic list (e.g. Quadratic Equations + Trigonometry)
  // route the entire request into a single-topic template.
  const hasDedicatedTopicTemplate =
    (discipline === "mathematics" &&
      ((subjectText.includes("quadratic") && (topics.length === 0 || allTopicsAreQuadratic)) ||
        allTopicsAreQuadratic)) ||
    (discipline === "chemistry" &&
      ((topics.length === 0 && (isAtomicStructureTopic(subjectText) || isStructuralChemistryTopic(subjectText))) ||
        (allTopicsAreAtomicStructure || allTopicsAreStructuralChemistry))) ||
    (discipline === "computer_science" &&
      ((topics.length === 0 && isArchitectureTopicOrSubject(subjectText)) ||
        allTopicsAreComputerArchitecture));

  if (hasExplicitTopics && !hasDedicatedTopicTemplate) {
    items.push(
      ...buildTopicAwareRecommendations({
        topics,
        subject,
        discipline,
        disciplineLabel,
        timeNote,
        prepNote,
      })
    );
  }

  // Use the existing discipline-specific cards only when the selected topic has
  // a dedicated specialist template, or when no explicit topic was supplied.
  if (items.length === 0) switch (discipline) {
    case "mathematics": {
      const normSubject = (subject || "").toLowerCase();
      const isQuadraticSubject = normSubject.includes("quadratic");
      const isQuadraticOnlyTopic =
        topics.length > 0 &&
        topics.every((t) => t.toLowerCase().includes("quadratic"));
      const isGenericSubject =
        normSubject === "target exam" ||
        normSubject === "general exam preparation" ||
        normSubject === "" ||
        normSubject === "general";
      const isSingleQuadraticTopic =
        topics.length === 1 && topics[0].toLowerCase().includes("quadratic");

      const isQuadraticEquations =
        isQuadraticSubject ||
        isQuadraticOnlyTopic ||
        (isSingleQuadraticTopic &&
          (isGenericSubject || normSubject === "mathematics" || normSubject === "math"));

      if (isQuadraticEquations) {
        const isTopicSubMatch =
          !hasExplicitTopics ||
          topics.every(
            (t) =>
              t.toLowerCase().includes("quadratic") ||
              normSubject.includes(t.toLowerCase())
          );

        items.push({
          id: 1,
          title: "Standard Form & Discriminant Analysis",
          category: "Standard Form & Discriminant",
          discipline,
          disciplineLabel,
          description: `Rearrange all quadratic equations ${
            hasExplicitTopics && !isTopicSubMatch ? `for ${topicPhrase} ` : ""
          }into standard form ax² + bx + c = 0 (or ax^2 + bx + c = 0) with a > 0 before identifying coefficients. Calculate the discriminant Δ = b² - 4ac (or b^2 - 4ac) immediately to classify root nature: two distinct real roots (b² - 4ac > 0), one repeated real root (b² - 4ac = 0), or no real roots (b² - 4ac < 0).`,
          actionableStep: `Take 3 non-standard quadratic equations${
            hasExplicitTopics && !isTopicSubMatch ? ` from ${topicPhrase}` : ""
          }, rearrange them into standard form ax^2 + bx + c = 0, and compute the discriminant b^2 - 4ac to state the exact nature of their roots before solving.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Solving Strategy: Factorisation, Completing the Square, or Formula",
          category: "Method Selection",
          discipline,
          disciplineLabel,
          description: `Master choosing between factorisation, completing the square, and the quadratic formula: choose factorisation when the discriminant is a perfect square and integer factor pairs are clear; choose completing the square when a = 1 and b is an even integer (or to find vertex coordinates); and use the quadratic formula x = (-b ± √(b² - 4ac)) / (2a) for non-factorable equations or radical coefficients.`,
          actionableStep: `Classify 4 exam equations by optimal method: choose between factorisation, completing the square, and the quadratic formula, and solve each with the chosen approach.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Worked Examples with Step-by-Step Solutions",
          category: "Step-by-Step Solutions",
          discipline,
          disciplineLabel,
          description: `Work through model worked examples with step-by-step solutions${
            hasExplicitTopics && !isTopicSubMatch ? ` for ${topicPhrase}` : ""
          }, writing out every intermediate algebraic transformation: clear denominators, expand brackets, collect all terms on one side, state the chosen method, and show line-by-line simplification to secure full method marks on exams.`,
          actionableStep: `Write out complete, step-by-step worked solutions for 2 complex quadratic equations (including fractions or bracket expansions) without skipping any intermediate steps.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Verifying Roots by Substitution",
          category: "Solution Verification",
          discipline,
          disciplineLabel,
          description: `Always practice verifying roots by substitution on exam papers: plug both calculated roots back into the original unsimplified equation to confirm they balance to zero. Also verify with Vieta's formulas that the sum of roots equals -b/a and the product of roots equals c/a to catch arithmetic slips instantly.`,
          actionableStep: `Verify both roots of your solved equations by direct substitution into the original equation, catching any sign or arithmetic slips before moving on.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Timed Exam Practice & Common Mistakes",
          category: "Timed Practice & Error Elimination",
          discipline,
          disciplineLabel,
          description: `Conduct timed exam practice on past paper quadratic equations${
            hasExplicitTopics && !isTopicSubMatch ? ` covering ${topicPhrase}` : ""
          } while actively auditing against common mistakes: sign flips when evaluating -b, forgetting the ± symbol before the square root, dividing only the radical rather than (2a) across the full numerator, and failing to check for extraneous solutions in rational equations.`,
          actionableStep: `Complete a 20-minute timed exam practice drill on quadratic equations, compare your solutions against official mark schemes, and log common mistakes in an error audit log.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else {
        items.push({
          id: 1,
          title: "Active Formula & Theorem Derivation",
          category: "Formula Mastery",
          discipline,
          disciplineLabel,
          description: `Write out every core formula, identity, and theorem required ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `across your ${subject} syllabus`
          } from memory. Verify sign conventions, boundary restrictions, and domain limits rather than passively re-reading formulas.`,
          actionableStep: `Create a clean 1-page formula sheet ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `for key ${subject} problem types`
          } with all variables and edge conditions clearly noted.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Deliberate Problem Calculation",
          category: "Active Calculation",
          discipline,
          disciplineLabel,
          description: `Solve 3 to 4 progressive numerical problems ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "for")}` : `across core areas of ${subject}`
          } on clean paper without peeking at solution steps. Work line-by-line showing all algebraic transformations.`,
          actionableStep: `Tackle 2 medium and 2 challenging problems ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(primaryTopic, subject, "in")}` : `in high-yield sections of ${subject}`
          }, checking solutions only after completing all steps.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Algebraic Error Audit & Mistake Log",
          category: "Error Analysis",
          discipline,
          disciplineLabel,
          description: `Review your past homework or mock test errors specifically ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `across ${subject}`
          }. Catalogue where mistakes occurred — arithmetic slips, sign flips, or incorrect formula substitution.`,
          actionableStep: `Write out the correct solutions for 3 previously missed problems ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `in ${subject}`
          } and highlight the exact step where errors happened.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Timed Exam Simulation & Past Papers",
          category: "Timed Practice",
          discipline,
          disciplineLabel,
          description: `Set a 25-minute timer and solve 2 representative past exam questions ${
            hasExplicitTopics ? `on ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `on ${subject}`
          } strictly under exam conditions with only your permitted calculator and formula sheet.`,
          actionableStep: `Grade your answers against official step-by-step mark schemes for ${subject}, awarding marks strictly for valid methodology.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Edge Cases & Theorem Restrictions",
          category: "Edge Cases",
          discipline,
          disciplineLabel,
          description: `Test boundary conditions (such as 0, negatives, asymptotes, or extreme limits) ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `across your ${subject} syllabus`
          } to guarantee full method marks on tricky exam questions.`,
          actionableStep: `Identify 2 classic trick questions or boundary restrictions ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `in ${subject}`
          } and annotate how to avoid losing points.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      }
      break;
    }

    case "physics": {
      items.push({
        id: 1,
        title: "Free-Body Diagrams & Coordinate Systems",
        category: "Physical Modeling",
        discipline,
        disciplineLabel,
        description: `Sketch clear, fully annotated free-body or system diagrams for physical scenarios ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        }, specifying coordinate axes, force vectors, and field directions before setting up equations.`,
        actionableStep: `Draw isolated system diagrams for 2 core scenarios ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }, labeling every force vector and direction.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Fundamental Physical Laws & Derivations",
        category: "Law Application",
        discipline,
        disciplineLabel,
        description: `State the governing physical law (Newton's laws, conservation of energy/momentum, Gauss, or thermodynamics) applicable ${
          hasExplicitTopics ? `to ${topicPhrase} in ${subject}` : `to your ${subject} syllabus`
        } and derive working equations step-by-step.`,
        actionableStep: `Derive the working formulas ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for ${subject}`
        } from first principles on a blank sheet of paper.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Dimensional & Unit Consistency Checks",
        category: "Dimensional Analysis",
        discipline,
        disciplineLabel,
        description: `Verify SI units and conduct dimensional analysis for all key formulas ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } to catch algebraic errors before committing to numerical calculations.`,
        actionableStep: `Confirm the base SI units for each constant and variable involved ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Multi-Step Numerical Exam Problems",
        category: "Problem Solving",
        discipline,
        disciplineLabel,
        description: `Solve 3 multi-step exam problems ${
          hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `in ${subject}`
        }, focusing on identifying knowns, unknowns, and appropriate physical relationships under timed conditions.`,
        actionableStep: `Work through 2 past paper physics questions ${
          hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `in ${subject}`
        } without referring to external notes.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Boundary & Limiting Case Verification",
        category: "Physical Intuition",
        discipline,
        disciplineLabel,
        description: `Check whether your solutions ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } make physical sense at limits (e.g., when mass approaches zero, friction vanishes, or time approaches infinity).`,
        actionableStep: `Test your final formulas ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } against extreme limiting cases to verify dimensional and physical realism.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

        }, focusing on identifying knowns, unknowns, and appropriate physical relationships under timed conditions.`,
        actionableStep: `Work through 2 past paper physics questions ${
          hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `in ${subject}`
        } without referring to external notes.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Boundary & Limiting Case Verification",
        category: "Physical Intuition",
        discipline,
        disciplineLabel,
        description: `Check whether your solutions ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } make physical sense at limits (e.g., when mass approaches zero, friction vanishes, or time approaches infinity).`,
        actionableStep: `Test your final formulas ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } against extreme limiting cases to verify dimensional and physical realism.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "chemistry": {
      const normSubject = (subject || "").toLowerCase();
      const isAtomicSubject = isAtomicStructureTopic(normSubject);
      const isAtomicTopic = topics.some((t) => isAtomicStructureTopic(t));
      const isAtomicStructure = isAtomicSubject || isAtomicTopic;

      const isStructuralTopic = topics.some((t) => isStructuralChemistryTopic(t));
      const isStructuralSubject = isStructuralChemistryTopic(normSubject);
      const isStructuralChemistry = isStructuralSubject || isStructuralTopic;

      if (isAtomicStructure) {
        const atomicFocus = formatTopicPhrase(topics, subject);

        items.push({
          id: 1,
          title: "Subatomic Particles & Their Properties",
          category: "Subatomic Particles",
          discipline,
          disciplineLabel,
          description: `Revise the fundamental subatomic particles covered in ${atomicFocus}: protons, neutrons, and electrons. Detail their relative charges (+1, 0, -1), relative masses (1, 1, ~1/1836 or negligible), and physical locations within the dense nucleus versus orbiting in energy levels or shells.`,
          actionableStep: `Construct a reference summary table comparing protons, neutrons, and electrons across relative charge, relative mass, and atomic location for ${atomicFocus}, then answer 4 rapid recall questions.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Atomic Number, Mass Number & Isotopes",
          category: "Atomic Calculations",
          discipline,
          disciplineLabel,
          description: `Master determining particle counts for atoms, isotopes, and ions in ${atomicFocus}. Apply the atomic number (Z = number of protons) to identify the element and determine the mass number (A = protons + neutrons). Calculate electron counts for neutral atoms and positive or negative ions.`,
          actionableStep: `Calculate the exact proton, neutron, and electron counts for 5 representative species (neutral atoms, isotopes, and positive or negative ions) connected to ${atomicFocus}, checking answers against atomic notation ($^A_Z X$).`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Electronic Configuration",
          category: "Electron Arrangement",
          discipline,
          disciplineLabel,
          description: `Master electron arrangements and electronic configurations appropriate to your ${atomicFocus} syllabus, following standard energy-level filling rules (Aufbau principle, Hund's rule, and Pauli exclusion principle) across main shells (2,8,8) and subshells (s, p, d, f).`,
          actionableStep: `Write out full and abbreviated noble-gas electronic configurations for 5 syllabus-relevant elements and transition metal ions, verifying valence electron counts and orbital filling order.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Atomic Models & Energy Levels",
          category: "Atomic Models & Energy Levels",
          discipline,
          disciplineLabel,
          description: `Analyze historical and modern atomic models (Dalton, Thomson, Rutherford, Bohr, and quantum mechanical wave models) relevant to ${atomicFocus}. Explain quantized energy levels, electron transitions producing emission and absorption line spectra, and 3D orbital shapes (spherical s and dumbbell p orbitals).`,
          actionableStep: `Diagram electron energy level transitions illustrating how electromagnetic radiation is absorbed and emitted, and describe the 3D shapes and orientations of s and p orbitals for ${atomicFocus}.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Atomic Structure Exam Practice",
          category: "Exam Calibration",
          discipline,
          disciplineLabel,
          description: `Tackle topic-specific exam questions, calculations, terminology, and mark-scheme checking for ${atomicFocus}. Calculate relative atomic mass (Ar) from isotopic abundances and check definition precision for isotopes, mass number, and ionization energy.`,
          actionableStep: `Solve 3 multi-part past-paper questions on isotopic abundance calculations, particle counts, and electronic configuration for ${atomicFocus}, checking your answers against official mark schemes.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else if (isStructuralChemistry) {
        const structuralFocus = formatTopicPhrase(topics, subject);

        items.push({
          id: 1,
          title: "Lewis Structures, Valence Electrons & Formal Charge",
          category: "Electron-Dot Structures",
          discipline,
          disciplineLabel,
          description: `Build Lewis electron-dot structures specifically for ${structuralFocus}, showing valence electrons, bonding pairs, lone pairs, octet-rule exceptions where relevant, and formal charges.`,
          actionableStep: `Draw Lewis structures from memory for 3 representative species connected to ${structuralFocus}; check electron counts, formal charges, and any resonance structures against your notes.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "VSEPR Shapes & Bond-Angle Predictions",
          category: "Molecular Geometry",
          discipline,
          disciplineLabel,
          description: `Apply VSEPR theory to the molecules relevant to ${structuralFocus}. Count electron domains, distinguish bonding pairs from lone pairs, and predict electron-domain geometry, molecular shape, and approximate bond angles.`,
          actionableStep: `Complete a table for 4 representative molecules: Lewis structure, number of electron domains, lone pairs on the central atom, molecular shape, approximate bond angle, and whether the molecule is polar.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Hybridisation & Sigma/Pi Bond Analysis",
          category: "Orbital Overlap",
          discipline,
          disciplineLabel,
          description: `Connect ${structuralFocus} to orbital arrangement where applicable: identify the central atom's hybridisation, distinguish sigma and pi bonds, and relate orbital overlap to molecular geometry without introducing unrelated reaction calculations.`,
          actionableStep: `For 3 relevant molecules or species, identify the central atom's hybridisation, count sigma and pi bonds, and explain how the orbital arrangement supports the predicted shape.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Molecular Orbital Diagrams & Bond Order",
          category: "Molecular Orbital Theory",
          discipline,
          disciplineLabel,
          description: `For the molecular-orbital portion of ${structuralFocus}, fill the appropriate orbital energy diagram, count bonding and antibonding electrons, calculate bond order, and determine magnetic behaviour when the species and syllabus require it.`,
          actionableStep: `Draw and label molecular-orbital diagrams for 2 syllabus-relevant diatomic species; calculate each bond order and state whether it is paramagnetic or diamagnetic, explaining the electron configuration.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Polarity, Bonding Types & Exam-Style Retrieval",
          category: "Structure and Explanation",
          discipline,
          disciplineLabel,
          description: `Compare ionic, covalent, coordinate, and hydrogen bonding only where relevant to ${structuralFocus}; use electronegativity, molecular symmetry, and dipole vectors to distinguish bond polarity from overall molecular polarity.`,
          actionableStep: `Answer 2 exam-style questions on ${structuralFocus}. In each answer, show the electron or geometry reasoning, use precise chemical terminology, and check your explanation against your syllabus or mark scheme.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else {
        items.push({
          id: 1,
          title: "Balanced Chemical Equations & Mechanisms",
          category: "Reaction Mechanisms",
          discipline,
          disciplineLabel,
          description: `Write out and balance every primary equation ${
            hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `across your ${subject} syllabus`
          }, ensuring correct state symbols, ionic charges, and electron movement or curly arrows.`,
          actionableStep: `Write out 5 essential balanced equations or reaction mechanisms ${
            hasExplicitTopics ? `for ${primaryTopic} in ${subject}` : `in ${subject}`
          } from memory.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Periodic Trends & Molecular Geometry",
          category: "Structural Chemistry",
          discipline,
          disciplineLabel,
          description: `Map out the molecular structures, bonding types (ionic, covalent, metallic, hydrogen bonding), and periodic trends governing ${
            hasExplicitTopics ? `${topicPhrase} in ${subject}` : `your ${subject} syllabus`
          }.`,
          actionableStep: `Sketch the 3D geometry or electron dot structures for key molecules ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
          }, indicating bond angles and dipoles.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Stoichiometry & Quantitative Calculations",
          category: "Quantitative Chemistry",
          discipline,
          disciplineLabel,
          description: `Work through 3 quantitative calculations ${
            hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `in ${subject}`
          } (such as mole ratios, molar concentrations, yield, equilibrium constants, or enthalpy changes) checking significant figures.`,
          actionableStep: `Calculate the quantitative yield or equilibrium concentrations for a representative problem ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
          }.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Reagents, Catalysts & Reaction Conditions",
          category: "Reaction Conditions",
          discipline,
          disciplineLabel,
          description: `Test your recall of exact conditions (temperature, pressure, catalyst, acid/base medium) required for transformations ${
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          }.`,
          actionableStep: `Build a quick reference flash table linking each reaction ${
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          } to its specific catalyst, temperature, and solvent.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Mark-Scheme Diagnostic Practice",
          category: "Exam Calibration",
          discipline,
          disciplineLabel,
          description: `Solve 2 multi-part past paper questions ${
            hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `in ${subject}`
          } and verify against official mark schemes to calibrate your explanation depth and required technical terms.`,
          actionableStep: `Review the official marking points for a past question ${
            hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `in ${subject}`
          } to ensure no essential keywords are skipped.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      }
      break;
    }

    case "biology": {
      items.push({
        id: 1,
        title: "Anatomical & Pathway Diagram Drill",
        category: "Visual Recall",
        discipline,
      });

      items.push({
        id: 5,
        title: "Boundary & Limiting Case Verification",
        category: "Physical Intuition",
        discipline,
        disciplineLabel,
        description: `Check whether your solutions ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } make physical sense at limits (e.g., when mass approaches zero, friction vanishes, or time approaches infinity).`,
        actionableStep: `Test your final formulas ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } against extreme limiting cases to verify dimensional and physical realism.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "chemistry": {
      const normSubject = (subject || "").toLowerCase();
      const isAtomicSubject = isAtomicStructureTopic(normSubject);
      const isAtomicTopic = topics.some((t) => isAtomicStructureTopic(t));
      const isAtomicStructure = isAtomicSubject || isAtomicTopic;

      const isStructuralTopic = topics.some((t) => isStructuralChemistryTopic(t));
      const isStructuralSubject = isStructuralChemistryTopic(normSubject);
      const isStructuralChemistry = isStructuralSubject || isStructuralTopic;

      if (isAtomicStructure) {
        const atomicFocus = formatTopicPhrase(topics, subject);

        items.push({
          id: 1,
          title: "Subatomic Particles & Their Properties",
          category: "Subatomic Particles",
          discipline,
          disciplineLabel,
          description: `Revise the fundamental subatomic particles covered in ${atomicFocus}: protons, neutrons, and electrons. Detail their relative charges (+1, 0, -1), relative masses (1, 1, ~1/1836 or negligible), and physical locations within the dense nucleus versus orbiting in energy levels or shells.`,
          actionableStep: `Construct a reference summary table comparing protons, neutrons, and electrons across relative charge, relative mass, and atomic location for ${atomicFocus}, then answer 4 rapid recall questions.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Atomic Number, Mass Number & Isotopes",
          category: "Atomic Calculations",
          discipline,
          disciplineLabel,
          description: `Master determining particle counts for atoms, isotopes, and ions in ${atomicFocus}. Apply the atomic number (Z = number of protons) to identify the element and determine the mass number (A = protons + neutrons). Calculate electron counts for neutral atoms and positive or negative ions.`,
          actionableStep: `Calculate the exact proton, neutron, and electron counts for 5 representative species (neutral atoms, isotopes, and positive or negative ions) connected to ${atomicFocus}, checking answers against atomic notation ($^A_Z X$).`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Electronic Configuration",
          category: "Electron Arrangement",
          discipline,
          disciplineLabel,
          description: `Master electron arrangements and electronic configurations appropriate to your ${atomicFocus} syllabus, following standard energy-level filling rules (Aufbau principle, Hund's rule, and Pauli exclusion principle) across main shells (2,8,8) and subshells (s, p, d, f).`,
          actionableStep: `Write out full and abbreviated noble-gas electronic configurations for 5 syllabus-relevant elements and transition metal ions, verifying valence electron counts and orbital filling order.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Atomic Models & Energy Levels",
          category: "Atomic Models & Energy Levels",
          discipline,
          disciplineLabel,
          description: `Analyze historical and modern atomic models (Dalton, Thomson, Rutherford, Bohr, and quantum mechanical wave models) relevant to ${atomicFocus}. Explain quantized energy levels, electron transitions producing emission and absorption line spectra, and 3D orbital shapes (spherical s and dumbbell p orbitals).`,
          actionableStep: `Diagram electron energy level transitions illustrating how electromagnetic radiation is absorbed and emitted, and describe the 3D shapes and orientations of s and p orbitals for ${atomicFocus}.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Atomic Structure Exam Practice",
          category: "Exam Calibration",
          discipline,
          disciplineLabel,
          description: `Tackle topic-specific exam questions, calculations, terminology, and mark-scheme checking for ${atomicFocus}. Calculate relative atomic mass (Ar) from isotopic abundances and check definition precision for isotopes, mass number, and ionization energy.`,
          actionableStep: `Solve 3 multi-part past-paper questions on isotopic abundance calculations, particle counts, and electronic configuration for ${atomicFocus}, checking your answers against official mark schemes.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else if (isStructuralChemistry) {
        const structuralFocus = formatTopicPhrase(topics, subject);

        items.push({
          id: 1,
          title: "Lewis Structures, Valence Electrons & Formal Charge",
          category: "Electron-Dot Structures",
          discipline,
          disciplineLabel,
          description: `Build Lewis electron-dot structures specifically for ${structuralFocus}, showing valence electrons, bonding pairs, lone pairs, octet-rule exceptions where relevant, and formal charges.`,
          actionableStep: `Draw Lewis structures from memory for 3 representative species connected to ${structuralFocus}; check electron counts, formal charges, and any resonance structures against your notes.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "VSEPR Shapes & Bond-Angle Predictions",
          category: "Molecular Geometry",
          discipline,
          disciplineLabel,
          description: `Apply VSEPR theory to the molecules relevant to ${structuralFocus}. Count electron domains, distinguish bonding pairs from lone pairs, and predict electron-domain geometry, molecular shape, and approximate bond angles.`,
          actionableStep: `Complete a table for 4 representative molecules: Lewis structure, number of electron domains, lone pairs on the central atom, molecular shape, approximate bond angle, and whether the molecule is polar.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Hybridisation & Sigma/Pi Bond Analysis",
          category: "Orbital Overlap",
          discipline,
          disciplineLabel,
          description: `Connect ${structuralFocus} to orbital arrangement where applicable: identify the central atom's hybridisation, distinguish sigma and pi bonds, and relate orbital overlap to molecular geometry without introducing unrelated reaction calculations.`,
          actionableStep: `For 3 relevant molecules or species, identify the central atom's hybridisation, count sigma and pi bonds, and explain how the orbital arrangement supports the predicted shape.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Molecular Orbital Diagrams & Bond Order",
          category: "Molecular Orbital Theory",
          discipline,
          disciplineLabel,
          description: `For the molecular-orbital portion of ${structuralFocus}, fill the appropriate orbital energy diagram, count bonding and antibonding electrons, calculate bond order, and determine magnetic behaviour when the species and syllabus require it.`,
          actionableStep: `Draw and label molecular-orbital diagrams for 2 syllabus-relevant diatomic species; calculate each bond order and state whether it is paramagnetic or diamagnetic, explaining the electron configuration.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Polarity, Bonding Types & Exam-Style Retrieval",
          category: "Structure and Explanation",
          discipline,
          disciplineLabel,
          description: `Compare ionic, covalent, coordinate, and hydrogen bonding only where relevant to ${structuralFocus}; use electronegativity, molecular symmetry, and dipole vectors to distinguish bond polarity from overall molecular polarity.`,
          actionableStep: `Answer 2 exam-style questions on ${structuralFocus}. In each answer, show the electron or geometry reasoning, use precise chemical terminology, and check your explanation against your syllabus or mark scheme.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else {
        items.push({
          id: 1,
          title: "Balanced Chemical Equations & Mechanisms",
          category: "Reaction Mechanisms",
          discipline,
          disciplineLabel,
          description: `Write out and balance every primary equation ${
            hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `across your ${subject} syllabus`
          }, ensuring correct state symbols, ionic charges, and electron movement or curly arrows.`,
          actionableStep: `Write out 5 essential balanced equations or reaction mechanisms ${
            hasExplicitTopics ? `for ${primaryTopic} in ${subject}` : `in ${subject}`
          } from memory.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Periodic Trends & Molecular Geometry",
          category: "Structural Chemistry",
          discipline,
          disciplineLabel,
          description: `Map out the molecular structures, bonding types (ionic, covalent, metallic, hydrogen bonding), and periodic trends governing ${
            hasExplicitTopics ? `${topicPhrase} in ${subject}` : `your ${subject} syllabus`
          }.`,
          actionableStep: `Sketch the 3D geometry or electron dot structures for key molecules ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
          }, indicating bond angles and dipoles.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Stoichiometry & Quantitative Calculations",
          category: "Quantitative Chemistry",
          discipline,
          disciplineLabel,
          description: `Work through 3 quantitative calculations ${
            hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `in ${subject}`
          } (such as mole ratios, molar concentrations, yield, equilibrium constants, or enthalpy changes) checking significant figures.`,
          actionableStep: `Calculate the quantitative yield or equilibrium concentrations for a representative problem ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
          }.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Reagents, Catalysts & Reaction Conditions",
          category: "Reaction Conditions",
          discipline,
          disciplineLabel,
          description: `Test your recall of exact conditions (temperature, pressure, catalyst, acid/base medium) required for transformations ${
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          }.`,
          actionableStep: `Build a quick reference flash table linking each reaction ${
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          } to its specific catalyst, temperature, and solvent.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Mark-Scheme Diagnostic Practice",
          category: "Exam Calibration",
          discipline,
          disciplineLabel,
          description: `Solve 2 multi-part past paper questions ${
            hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `in ${subject}`
          } and verify against official mark schemes to calibrate your explanation depth and required technical terms.`,
          actionableStep: `Review the official marking points for a past question ${
            hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `in ${subject}`
          } to ensure no essential keywords are skipped.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      }
      break;
    }

    case "biology": {
      items.push({
        id: 1,
        title: "Anatomical & Pathway Diagram Drill",
        category: "Visual Recall",
        discipline,
        description: `Sketch and label the essential anatomical structures and pathway flowcharts ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `across your ${subject} syllabus`
        } (such as cell membranes, cellular organelles, or cycle stages) completely from memory.`,
        actionableStep: `Draw the core structural diagram or flowchart ${
          hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `for key ${subject} processes`
        } on blank paper, then verify every label against your notes.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Scientific Terminology & Keyword Precision",
        category: "Keyword Precision",
        discipline,
        disciplineLabel,
        description: `Define core biological mechanisms ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `in ${subject}`
        } using precise mark-scheme vocabulary (such as enzyme-substrate specificity, active transport, concentration gradient, or selective permeability).`,
        actionableStep: `List and define 5 high-yield biological terms required ${
          hasExplicitTopics ? `for ${primaryTopic} in ${subject}` : `in ${subject}`
        } with exact definitions.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Step-by-Step Process Sequencing",
        category: "Process Sequencing",
        discipline,
        disciplineLabel,
        description: `Outline the sequential stages and regulatory mechanisms ${
          hasExplicitTopics ? `of ${topicPhrase} in ${subject}` : `in ${subject}`
        } from initial trigger to end-product, ensuring chronological flow and causal linkage.`,
        actionableStep: `Write a numbered 5-step sequence detailing how key biological pathways progress from start to finish ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Comparative Distinctions & Summary Tables",
        category: "Comparative Analysis",
        discipline,
        disciplineLabel,
        description: `Build a side-by-side comparison matrix ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for your ${subject} syllabus`
        } contrasting key structures, functions, or phases to avoid confusing similar terms in exam prompts.`,
        actionableStep: `Create a 2-column contrast table distinguishing key concepts ${
          hasExplicitTopics ? `within ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Experimental Data & Past Question Analysis",
        category: "Data Analysis",
        discipline,
        disciplineLabel,
        description: `Work through 2 experimental or graphical analysis questions ${
          hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `in ${subject}`
        }, practicing data interpretation, hypothesis evaluation, and control variables.`,
        actionableStep: `Analyze a sample experiment graph or data table related to ${
          hasExplicitTopics ? `${primaryTopic} (${subject})` : `${subject}`
        } and write out the biological deduction.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "history": {
      items.push({
        id: 1,
        title: "Chronological Master Timeline",
        category: "Chronological Framework",
        discipline,
        disciplineLabel,
        description: `Construct an unbroken chronological timeline ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for ${subject}`
        }, plotting key dates, turning points, and major treaties or legislative milestones.`,
        actionableStep: `Draw a timeline with the top 8 pivotal events ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }, ensuring dates and sequences are accurate.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Causal Flowcharts (Triggers vs Underlying Causes)",
        category: "Causal Analysis",
        discipline,
        disciplineLabel,
        description: `Distinguish long-term structural causes (economic, ideological, socio-political) from immediate catalytic triggers for historical developments ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        }.`,
        actionableStep: `Write out 3 structural causes and 1 immediate catalyst that shaped events ${
          hasExplicitTopics ? `in ${primaryTopic} in ${subject}` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Primary Sources & Historiographical Perspectives",
        category: "Source Analysis",
        discipline,
        disciplineLabel,
        description: `Analyze competing contemporary perspectives and historical interpretations regarding ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        }, evaluating motive, reliability, and ideological perspective.`,
        actionableStep: `Contrast 2 differing historical viewpoints or primary source perspectives ${
          hasExplicitTopics ? `on ${primaryTopic} in ${subject}` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Thematic Essay Outlining (PEEL/TEEL)",
        category: "Essay Structure",
        discipline,
        disciplineLabel,
        description: `Draft structured essay thesis statements and bulleted evidence paragraphs for high-probability essay prompts ${
          hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `in ${subject}`
        }.`,
        actionableStep: `Outline a 3-point thematic essay response for an exam prompt centered on ${
          hasExplicitTopics ? `${primaryTopic} (${subject})` : `${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Historical Figures & Key Lexicon",
        category: "Historical Lexicon",
        discipline,
        disciplineLabel,
        description: `Review key figures, political factions, and distinct period terminology associated with ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        } to enhance analytical sophistication in written answers.`,
        actionableStep: `Flash-recall the roles, motives, and outcomes of 3 major figures ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "geography": {
      items.push({
        id: 1,
        title: "Spatial Patterns & Annotated Sketch Maps",
        category: "Spatial Representation",
        discipline,
        disciplineLabel,
        description: `Sketch and annotate the key geographical features, plate boundaries, climate zones, or demographic distributions relevant to ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        }.`,
        actionableStep: `Draw an annotated sketch map illustrating the spatial distribution and landforms ${
          hasExplicitTopics ? `of ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Physical Processes vs Human Impacts",
        category: "Process Synthesis",
        discipline,
        disciplineLabel,
        description: `Create a two-column synthesis connecting physical geomorphic or atmospheric processes ${
          hasExplicitTopics ? `in ${topicPhrase}` : `in ${subject}`
        } directly to human vulnerability, infrastructure, and economic impacts in ${subject}.`,
        actionableStep: `Map how physical processes ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        } directly influence local human populations and land use.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Named Case Study Fact Matrix",
        category: "Case Study Evidence",
        discipline,
        disciplineLabel,
        description: `Compile concrete facts, named locations, dates, statistics, and management outcomes for your primary case studies ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        }.`,
        actionableStep: `Memorize 4 specific data points (location, magnitude/statistic, impact, response) for a case study ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Sustainable Management & Evaluation",
        category: "Management Evaluation",
        discipline,
        disciplineLabel,
        description: `Diagram the sustainable management strategies implemented ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `in ${subject}`
        }, evaluating strengths, limitations, and stakeholder conflicts.`,
        actionableStep: `Evaluate 2 management solutions ${
          hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `in ${subject}`
        }, comparing economic costs against long-term environmental sustainability.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Map Skills & Quantitative Data Interpretation",
        category: "Data & Map Skills",
        discipline,
        disciplineLabel,
        description: `Practice reading contour maps, population pyramids, climographs, or statistical indices related to ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `in ${subject}`
        }.`,
        actionableStep: `Interpret a sample graph or topographic map segment associated with ${
          hasExplicitTopics ? `${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "english": {
      items.push({
        id: 1,
        title: "Thematic Matrix & Authorial Purpose",
        category: "Thematic Analysis",
        discipline,
        disciplineLabel,

            category: "Cache Miss Analysis",
            discipline,
            disciplineLabel,
            description:
              "Classify memory references using the 3C/4C miss taxonomy: Compulsory (cold) misses, Capacity misses, Conflict misses, and Coherence misses. Evaluate block replacement algorithms (LRU, FIFO, and Random) and analyze how associativity affects conflict miss rates.",
            actionableStep:
              "Analyze an address reference sequence on a 2-way set-associative cache, classifying each memory access as a hit or a compulsory, capacity, or conflict miss.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 3,
            title: "Effective CPI & Memory Access Latency",
            category: "Performance Analysis",
            discipline,
            disciplineLabel,
            description:
              "Calculate execution time using the performance equation: Execution Time = Instruction Count × Effective CPI × Clock Cycle Time. Express Effective CPI as Effective CPI = Ideal CPI + Average stall cycles per instruction. Compute memory stall cycles per instruction as Memory Access Frequency × Miss Rate × Miss Penalty, ensuring penalties are added consistently without double-counting.",
            actionableStep:
              "Calculate Effective CPI and execution speedup for a processor with an Ideal CPI of 1.0, a 25% memory instruction frequency, an L1 miss rate of 4%, and a 50-cycle main memory miss penalty.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 4,
            title: "Virtual Memory, Page Tables & TLB Translation",
            category: "Virtual Memory",
            discipline,
            disciplineLabel,
            description:
              "Trace two-level virtual-to-physical address translation: Virtual Page Number (VPN) and Page Offset mapping to Physical Frame Number (PFN). Evaluate Translation Lookaside Buffer (TLB) hits, TLB misses, and page faults, detailing the memory access penalty of page table walks.",
            actionableStep:
              "Trace a virtual memory access through a TLB and page table, calculating total memory latency for: (1) TLB hit, (2) TLB miss with page table hit, and (3) page fault.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 5,
            title: "Multi-Level Cache Hierarchy Trade-offs",
            category: "Architectural Trade-offs",
            discipline,
            disciplineLabel,
            description:
              "Evaluate architectural trade-offs in multi-level memory hierarchies: L1 latency minimization versus L2/L3 capacity scaling, write-through with write buffers versus write-back with dirty bits, and inclusive versus exclusive cache hierarchies.",
            actionableStep:
              "Write a trade-off analysis comparing write-through against write-back caching policies across memory bandwidth consumption, write stall latency, and hardware design complexity.",
            timeContext: timeNote,
            prepContext: prepNote,
          });
        }
        // Case 4: Both Pipelining and MESI (or General Architecture / Demo Data)
        else {
          items.push({
            id: 1,
            title: "Pipeline Hazards & Forwarding Cycle Trace",
            category: "Pipeline Tracing",
            discipline,
            disciplineLabel,
            description:
              "Trace execution cycle-by-cycle across the 5 standard in-order stages: Instruction Fetch (IF), Instruction Decode / Register Read (ID), Execute (EX), Memory Access (MEM), and Write-Back (WB). Identify Read-After-Write (RAW) data dependencies, map active operand forwarding paths (EX->EX and MEM->EX) that bypass register files, and determine where hardware forwarding eliminates stalls.",
            actionableStep:
              "Construct a multi-cycle pipeline execution timing diagram for a sequence with back-to-back arithmetic instructions and a dependent instruction, marking all RAW hazards, forwarding paths, and required stalls.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 2,
            title: "MESI Cache-Coherence State Transitions",
            category: "Cache Coherence",
            discipline,
            disciplineLabel,
            description:
              "Practice snooping cache coherence state transitions using the 4-state MESI protocol: Modified (M: dirty line, exclusive ownership), Exclusive (E: clean line, exclusive ownership), Shared (S: clean line, read-only copies may exist in peer caches), and Invalid (I: block contains invalid data) under a write-back, write-allocate protocol. Trace PrRd and PrWr events, broadcast bus transactions (BusRd, BusRdX), silent E->M transitions on write hits, and dirty-line writebacks when snooping peer requests.",
            actionableStep:
              "Construct a 2-core trace table tracking cache line states (M, E, S, I), bus transactions (BusRd, BusRdX), invalidations, and writebacks across an interleaved sequence of 5 read and write operations.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 3,
            title: "CPI, Stall Penalties & Pipeline Performance",
            category: "Performance Analysis",
            discipline,
            disciplineLabel,
            description:
              "Calculate processor throughput using the performance equation: Execution Time = Instruction Count × Effective CPI × Clock Cycle Time. Express Effective CPI as Effective CPI = Ideal CPI + Average stall cycles per instruction. Quantify average stall penalties per instruction contributed by pipeline data hazards (load-use latency), branch penalties, and memory latency (cache miss rate × miss penalty), ensuring distinct contributions are defined consistently without double-counting.",
            actionableStep:
              "Solve 2 quantitative problems calculating Effective CPI using Effective CPI = Ideal CPI + Average stall cycles per instruction, determining execution time changes from adding forwarding hardware or reducing cache miss penalties.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 4,
            title: "Hazard Detection & Edge Cases",
            category: "Hazard Detection",
            discipline,
            disciplineLabel,
            description:
              "Analyze corner cases in the hazard detection and forwarding units: resolve load-use data hazards by inserting a 1-cycle stall bubble before MEM-to-EX forwarding, evaluate conditional branch outcome resolution in ID vs EX stages, and trace pipeline register flushes for taken branches. Clarify that conventional in-order 5-stage pipelines avoid Write-After-Read (WAR) and Write-After-Write (WAW) hazards because instructions execute and write back strictly in program order; WAR and WAW hazards arise in architectures with out-of-order execution or variable-latency completion.",
            actionableStep:
              "Review 4 pipeline edge-case scenarios (load-use dependency, taken branch hazard, independent instructions, and out-of-order WAR/WAW contrast), deciding whether to forward data, insert a stall bubble, or flush pipeline registers.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 5,
            title: "Forwarding vs Stalling Trade-offs",
            category: "Architectural Trade-offs",
            discipline,
            disciplineLabel,
            description:
              "Critically evaluate hardware design trade-offs across processor pipelines and memory subsystems. In pipelines, compare hardware forwarding performance gains against hardware complexity (multiplexers, silicon area, and critical path propagation delay). In memory systems, evaluate how broadcast snooping bus traffic limits scalability as core counts increase, contrasting snooping with directory-based coherence.",
            actionableStep:
              "Write a structured trade-off matrix evaluating: (1) full hardware forwarding versus interlocked stalling in pipelines, and (2) broadcast snooping versus directory-based coherence in multi-core memory systems.",
            timeContext: timeNote,
            prepContext: prepNote,
          });
        }
      } else {
        items.push({
          id: 1,
          title: "Trace Table Dry-Run & Variable States",
          category: "Algorithm Tracing",
          discipline,
          disciplineLabel,
          description: `Step through key algorithms or code segments ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "for")}` : `across your ${subject} syllabus`
          } line-by-line using a trace table to record variable states at each loop iteration.`,
          actionableStep: `Execute a handwritten trace table for a loop or recursive call ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(primaryTopic, subject, "parenthesis")}` : `in ${subject}`
          } with a small sample input.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Big-O Time & Space Complexity Analysis",
          category: "Complexity Analysis",
          discipline,
          disciplineLabel,
          description: `Analyze the best, average, and worst-case Big-O time and space complexity for operations ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "parenthesis")}` : `in ${subject}`
          }, understanding the theoretical trade-offs.`,
          actionableStep: `State and justify the Big-O time and auxiliary space complexity for algorithms ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(primaryTopic, subject, "parenthesis")}` : `in ${subject}`
          }.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Edge-Case Testing Suite",
          category: "Edge Cases & Testing",
          discipline,
          disciplineLabel,
          description: `Write down tests for boundary conditions ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "parenthesis")}` : `in ${subject}`
          }: null pointers, empty collections, single-element inputs, off-by-one indices, and overflow limits.`,
          actionableStep: `List 4 edge cases for an implementation ${
            hasExplicitTopics ? `of ${formatTopicWithSubject(primaryTopic, subject, "in")}` : `in ${subject}`
          } and verify how the logic handles each.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Handwritten Code / Pseudocode Implementation",
          category: "Pseudocode Drill",
          discipline,
          disciplineLabel,
          description: `Write syntactically clean pseudocode or language implementations ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `for core ${subject} algorithms`
          } on paper without relying on IDE auto-complete or compiler diagnostics.`,
          actionableStep: `Write the core logic or class structure ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(primaryTopic, subject, "parenthesis")}` : `in ${subject}`
          } on paper, checking syntax and loop termination manually.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Data Structure & Architectural Trade-offs",
          category: "System Design",
          discipline,
          disciplineLabel,
          description: `Contrast why one data structure or architectural pattern ${
            hasExplicitTopics ? `in ${formatTopicWithSubject(topicPhrase, subject, "parenthesis")}` : `in ${subject}`
          } is chosen over alternatives, weighing lookup speed against memory overhead.`,
          actionableStep: `Compare two data structure choices or approaches ${
            hasExplicitTopics ? `for ${formatTopicWithSubject(primaryTopic, subject, "in")}` : `in ${subject}`
          }, explaining where each is optimal.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      }
      break;
    }

    case "economics": {
      items.push({
        id: 1,
        title: "Accurately Labeled Economic Diagrams",
        category: "Diagrammatic Precision",
        discipline,
        disciplineLabel,
        description: `Draw and label every core diagram ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `across your ${subject} syllabus`
        } with correct axes, supply/demand curves, shift directions, and equilibrium price/quantity points.`,
        actionableStep: `Draw the primary market or macroeconomic diagram ${
          hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `for ${subject}`
        }, labeling all axes and shift movements clearly.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Step-by-Step Economic Transmission Chains",
        category: "Transmission Mechanism",
        discipline,
        disciplineLabel,
        description: `Write out the step-by-step causal chain explaining how shifts or policy interventions ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } cascade through consumer behavior, investment, and market equilibrium.`,
        actionableStep: `Write a 4-step chain of reasoning linking a shock ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        } to its macroeconomic impact.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Quantitative Formulas & Elasticity Calculations",
        category: "Quantitative Economics",
        discipline,
        disciplineLabel,
        description: `Calculate elasticity coefficients, multipliers, GDP components, or revenue changes ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for ${subject}`
        } showing full working and correct signs.`,
        actionableStep: `Solve a quantitative numerical problem ${
          hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `in ${subject}`
        }, specifying whether demand/supply is elastic, inelastic, or unit elastic.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Policy Evaluation & Trade-off Matrix",
        category: "Policy Evaluation",
        discipline,
        disciplineLabel,
        description: `Evaluate government interventions ${
          hasExplicitTopics ? `in ${topicPhrase} for ${subject}` : `in ${subject}`
        } by weighing short-term vs long-term impacts, efficiency vs equity, and government failure risks.`,
        actionableStep: `Evaluate one fiscal, monetary, or regulatory policy response addressing ${
          hasExplicitTopics ? `${primaryTopic} in ${subject}` : `${subject}`
        }, identifying both benefits and unintended consequences.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Real-World Empirical Case Evidence",
        category: "Empirical Application",
        discipline,
        disciplineLabel,
        description: `Pair theoretical mechanisms ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } with 2 specific real-world economies, industry developments, or recent historical episodes.`,
        actionableStep: `Write a 3-sentence empirical example applying the theory ${
          hasExplicitTopics ? `of ${primaryTopic} in ${subject}` : `of ${subject}`
        } to an actual economy.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "political_science": {
      items.push({
        id: 1,
        title: "Constitutional Articles & Institutional Mandates",
        category: "Constitutional Framework",
        discipline,
        disciplineLabel,
        description: `Map out explicit constitutional clauses, statutory mandates, and institutional jurisdictions relevant ${
          hasExplicitTopics ? `to ${topicPhrase} in ${subject}` : `to ${subject}`
        }.`,
        actionableStep: `Identify the primary constitutional articles or institutional powers governing ${
          hasExplicitTopics ? `${primaryTopic} in ${subject}` : `${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Separation of Powers & Institutional Checks",
        category: "Institutional Checks",
        discipline,
        disciplineLabel,
        description: `Analyze how the executive, legislature, and judiciary interact or check one another within ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `in ${subject}`
        }, noting institutional friction and oversight mechanisms.`,
        actionableStep: `Diagram the checks and balances operating between governmental branches regarding ${
          hasExplicitTopics ? `${primaryTopic} in ${subject}` : `${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Landmark Judicial Decisions & Precedents",
        category: "Legal Precedents",
        discipline,
        disciplineLabel,
        description: `Review major judicial rulings and precedents impacting ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        }, noting the majority constitutional rationale and dissenting arguments.`,
        actionableStep: `Review 2 landmark judicial precedents or legal interpretations that shaped ${
          hasExplicitTopics ? `${primaryTopic} in ${subject}` : `${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Comparative Political Arguments & Debates",
        category: "Argument Formulation",
        discipline,
        disciplineLabel,
        description: `Draft a balanced analytical argument ${
          hasExplicitTopics ? `on ${topicPhrase} for ${subject}` : `for ${subject}`
        }, articulating both affirmative arguments and counter-perspectives on democratic legitimacy or policy efficacy.`,
        actionableStep: `Write a structured balanced argument weighing two opposing ideological stances ${
          hasExplicitTopics ? `on ${primaryTopic} in ${subject}` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Contemporary Case Integration & Public Policy",
        category: "Contemporary Context",
        discipline,
        disciplineLabel,
        description: `Connect theoretical doctrines ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        } to current policy debates, legislative bills, electoral outcomes, or international treaties.`,
        actionableStep: `Cite a contemporary political event or policy reform that illustrates ${
          hasExplicitTopics ? `${primaryTopic} in ${subject}` : `${subject}`
        } in practice.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "general":
    default: {
      items.push({
        id: 1,
        title: "Core Concept Definitions & Axioms",
        category: "Foundations",
        discipline,
        disciplineLabel,
        description: `Isolate and write out the 5 essential definitions, laws, or fundamental principles ${
          hasExplicitTopics
            ? `of ${formatTopicWithSubject(topicPhrase, subject, "in")}`
            : `of ${subject}`
        } from memory without consulting notes.`,
        actionableStep: `Write a clean reference summary of the core principles ${
          hasExplicitTopics
            ? `of ${formatTopicWithSubject(primaryTopic, subject, "in")}`
            : `of ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Model Case / Problem Decomposition",
        category: "Model Breakdown",
        discipline,
        disciplineLabel,
        description: `Dissect a solved example or classic framework ${
          hasExplicitTopics
            ? `in ${formatTopicWithSubject(topicPhrase, subject, "parenthesis")}`
            : `in ${subject}`
        } step-by-step to understand the underlying methodology and structure.`,
        actionableStep: `Break down one model problem or framework ${
          hasExplicitTopics
            ? `in ${formatTopicWithSubject(primaryTopic, subject, "parenthesis")}`
            : `in ${subject}`
        } into discrete sequential steps.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Active Recall & Feynman Explanation",
        category: "Active Recall",
        discipline,
        disciplineLabel,
        description: `Explain the core mechanism ${
          hasExplicitTopics
            ? `of ${formatTopicWithSubject(topicPhrase, subject, "in")}`
            : `of ${subject}`
        } in plain language without looking at your notes, identifying where your explanation stumbles.`,
        actionableStep: `Explain ${
          hasExplicitTopics
            ? `${formatTopicWithSubject(primaryTopic, subject, "in")}`
            : `your ${subject} core material`
        } out loud in 3 minutes as if teaching a beginner.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Deliberate Application & Timed Questions",
        category: "Application Practice",
        discipline,
        disciplineLabel,
        description: `Tackle 2 to 3 exam-style application questions specifically ${
          hasExplicitTopics
            ? `on ${formatTopicWithSubject(topicPhrase, subject, "in")}`
            : `on ${subject}`
        } under timed conditions to test functional mastery.`,
        actionableStep: `Complete 2 representative practice questions ${
          hasExplicitTopics
            ? `on ${formatTopicWithSubject(primaryTopic, subject, "parenthesis")}`
            : `in ${subject}`
        } under exam timing.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Error Log & Conceptual Synthesis",
        category: "Error Analysis",
        discipline,
        disciplineLabel,
        description: `Review every question you answered incorrectly or hesitated on ${
          hasExplicitTopics
            ? `in ${formatTopicWithSubject(topicPhrase, subject, "parenthesis")}`
            : `in ${subject}`
        }, rewriting the correct explanation and root cause.`,
        actionableStep: `Log mistakes and write out key takeaways ${
          hasExplicitTopics
            ? `for ${formatTopicWithSubject(primaryTopic, subject, "in")}`
            : `for ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }
  }

  // Card 6: Sleep & Cognitive Recovery (Essential in every plan, strictly calibrated)
  const sleepAdvice = getSleepRecommendation(status);
  items.push({
    id: 6,
    title: sleepAdvice.title,
    category: "Cognitive Readiness",
    discipline,
    disciplineLabel,
    description: sleepAdvice.description,
    actionableStep: sleepAdvice.step,
    timeContext: timeNote,
    prepContext: prepNote,
  });

  return items;
}
