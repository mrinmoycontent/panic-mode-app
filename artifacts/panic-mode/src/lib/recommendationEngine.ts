import type { PanicStatus, PrepLevel, SubjectItem } from "@/types/exam";
import { resolveTargetTopics } from "./actionPlanGenerator.ts";

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
    norm.includes("architecture")
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
    norm.includes("stoichiometry")
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
    norm.includes("trigonometry") ||
    norm.includes("statistic") ||
    norm.includes("probability") ||
    norm.includes("arithmetic") ||
    norm.includes("discrete") ||
    norm.includes("linear algebra") ||
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

/**
 * Calculates total hours remaining from timeLeft object.
 */
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
  return `"${topics[0]}", "${topics[1]}", and related topics`;
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
          "Ensure 8 hours of restorative sleep tonight — a well-rested brain consolidates long-term memory, speeds up recall, and sharpens analytical thinking on exam day.",
        step: "Power down screens 30 minutes before bed and protect a complete 8-hour sleep block.",
      };
    case "Risky":
      return {
        title: "Protected Sleep Window (Never Deprived)",
        description:
          "Protect at least 7 hours of sleep — cutting sleep under revision stress sharply impairs working memory and increases careless calculation slips.",
        step: "Cease studying by your designated bedtime and secure at least 7 hours of uninterrupted rest.",
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

  const discipline = detectSubjectDiscipline(subject);
  const { label: disciplineLabel } = getDisciplineMetadata(discipline);
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

  // Discipline-specific cards
  switch (discipline) {
    case "mathematics": {
      items.push({
        id: 1,
        title: "Active Formula & Theorem Derivation",
        category: "Formula Mastery",
        discipline,
        disciplineLabel,
        description: `Write out every core formula, identity, and theorem required for ${topicPhrase} in ${subject} from memory. Verify sign conventions, boundary restrictions, and domain limits rather than passively re-reading formulas.`,
        actionableStep: `Create a clean 1-page formula sheet for ${topicPhrase} in ${subject} with all variables and edge conditions clearly noted.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Deliberate Problem Calculation",
        category: "Active Calculation",
        discipline,
        disciplineLabel,
        description: `Solve 3 to 4 progressive numerical problems in ${topicPhrase} for ${subject} on clean paper without peeking at solution steps. Work line-by-line showing all algebraic transformations.`,
        actionableStep: `Tackle 2 medium and 2 challenging problems for ${primaryTopic} in ${subject}, checking solutions only after completing all steps.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Algebraic Error Audit & Mistake Log",
        category: "Error Analysis",
        discipline,
        disciplineLabel,
        description: `Review your past homework or mock test errors specifically for ${topicPhrase} in ${subject}. Catalogue where mistakes occurred — arithmetic slips, sign flips, or incorrect formula substitution.`,
        actionableStep: `Write out the correct solutions for 3 previously missed problems in ${topicPhrase} (${subject}) and highlight the exact step where errors happened.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Timed Exam Simulation & Past Papers",
        category: "Timed Practice",
        discipline,
        disciplineLabel,
        description: `Set a 25-minute timer and solve 2 representative past exam questions on ${topicPhrase} in ${subject} strictly under exam conditions with only your permitted calculator and formula sheet.`,
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
        description: `Test boundary conditions (such as 0, negatives, asymptotes, or extreme limits) for ${topicPhrase} in ${subject} to guarantee full method marks on tricky exam questions.`,
        actionableStep: `Identify 2 classic trick questions or boundary restrictions in ${topicPhrase} (${subject}) and annotate how to avoid losing points.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "physics": {
      items.push({
        id: 1,
        title: "Free-Body Diagrams & Coordinate Systems",
        category: "Physical Modeling",
        discipline,
        disciplineLabel,
        description: `Sketch clear, fully annotated free-body or system diagrams for physical scenarios in ${topicPhrase} (${subject}), specifying coordinate axes, force vectors, and field directions before setting up equations.`,
        actionableStep: `Draw isolated system diagrams for 2 core scenarios in ${primaryTopic} (${subject}), labeling every force vector and direction.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Fundamental Physical Laws & Derivations",
        category: "Law Application",
        discipline,
        disciplineLabel,
        description: `State the governing physical law (Newton's laws, conservation of energy/momentum, Gauss, or thermodynamics) applicable to ${topicPhrase} in ${subject} and derive working equations step-by-step.`,
        actionableStep: `Derive the working formulas for ${topicPhrase} in ${subject} from first principles on a blank sheet of paper.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Dimensional & Unit Consistency Checks",
        category: "Dimensional Analysis",
        discipline,
        disciplineLabel,
        description: `Verify SI units and conduct dimensional analysis for all key formulas in ${topicPhrase} (${subject}) to catch algebraic errors before committing to numerical calculations.`,
        actionableStep: `Confirm the base SI units for each constant and variable involved in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Multi-Step Numerical Exam Problems",
        category: "Problem Solving",
        discipline,
        disciplineLabel,
        description: `Solve 3 multi-step exam problems on ${topicPhrase} in ${subject}, focusing on identifying knowns, unknowns, and appropriate physical relationships under timed conditions.`,
        actionableStep: `Work through 2 past paper physics questions on ${primaryTopic} (${subject}) without referring to external notes.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Boundary & Limiting Case Verification",
        category: "Physical Intuition",
        discipline,
        disciplineLabel,
        description: `Check whether your solutions in ${topicPhrase} (${subject}) make physical sense at limits (e.g., when mass approaches zero, friction vanishes, or time approaches infinity).`,
        actionableStep: `Test your final formulas in ${topicPhrase} (${subject}) against extreme limiting cases to verify dimensional and physical realism.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "chemistry": {
      items.push({
        id: 1,
        title: "Balanced Chemical Equations & Mechanisms",
        category: "Reaction Mechanisms",
        discipline,
        disciplineLabel,
        description: `Write out and balance every primary equation for ${topicPhrase} in ${subject}, ensuring correct state symbols, ionic charges, and electron movement or curly arrows.`,
        actionableStep: `Write out 5 essential balanced equations or reaction mechanisms for ${primaryTopic} in ${subject} from memory.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Periodic Trends & Molecular Geometry",
        category: "Structural Chemistry",
        discipline,
        disciplineLabel,
        description: `Map out the molecular structures, bonding types (ionic, covalent, metallic, hydrogen bonding), and periodic trends governing ${topicPhrase} in ${subject}.`,
        actionableStep: `Sketch the 3D geometry or electron dot structures for key molecules in ${primaryTopic} (${subject}), indicating bond angles and dipoles.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Stoichiometry & Quantitative Calculations",
        category: "Quantitative Chemistry",
        discipline,
        disciplineLabel,
        description: `Work through 3 quantitative calculations for ${topicPhrase} in ${subject} (such as mole ratios, molar concentrations, yield, equilibrium constants, or enthalpy changes) checking significant figures.`,
        actionableStep: `Calculate the quantitative yield or equilibrium concentrations for a representative problem in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Reagents, Catalysts & Reaction Conditions",
        category: "Reaction Conditions",
        discipline,
        disciplineLabel,
        description: `Test your recall of exact conditions (temperature, pressure, catalyst, acid/base medium) required for transformations in ${topicPhrase} (${subject}).`,
        actionableStep: `Build a quick reference flash table linking each reaction in ${topicPhrase} (${subject}) to its specific catalyst, temperature, and solvent.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Mark-Scheme Diagnostic Practice",
        category: "Exam Calibration",
        discipline,
        disciplineLabel,
        description: `Solve 2 multi-part past paper questions on ${topicPhrase} in ${subject} and verify against official mark schemes to calibrate your explanation depth and required technical terms.`,
        actionableStep: `Review the official marking points for a past question on ${primaryTopic} (${subject}) to ensure no essential keywords are skipped.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "biology": {
      items.push({
        id: 1,
        title: "Anatomical & Pathway Diagram Drill",
        category: "Visual Recall",
        discipline,
        disciplineLabel,
        description: `Sketch and label the essential anatomical structures and pathway flowcharts for ${topicPhrase} in ${subject} (such as cell membranes, cellular organelles, or cycle stages) completely from memory.`,
        actionableStep: `Draw the core structural diagram or flowchart for ${primaryTopic} (${subject}) on blank paper, then verify every label against your notes.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Scientific Terminology & Keyword Precision",
        category: "Keyword Precision",
        discipline,
        disciplineLabel,
        description: `Define core biological mechanisms for ${topicPhrase} in ${subject} using precise mark-scheme vocabulary (such as enzyme-substrate specificity, active transport, concentration gradient, or selective permeability).`,
        actionableStep: `List and define 5 high-yield biological terms required for ${primaryTopic} in ${subject} with exact definitions.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Step-by-Step Process Sequencing",
        category: "Process Sequencing",
        discipline,
        disciplineLabel,
        description: `Outline the sequential stages and regulatory mechanisms of ${topicPhrase} in ${subject} from initial trigger to end-product, ensuring chronological flow and causal linkage.`,
        actionableStep: `Write a numbered 5-step sequence detailing how ${primaryTopic} (${subject}) progresses from start to finish.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Comparative Distinctions & Summary Tables",
        category: "Comparative Analysis",
        discipline,
        disciplineLabel,
        description: `Build a side-by-side comparison matrix for ${topicPhrase} in ${subject} contrasting key structures, functions, or phases to avoid confusing similar terms in exam prompts.`,
        actionableStep: `Create a 2-column contrast table distinguishing key concepts within ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Experimental Data & Past Question Analysis",
        category: "Data Analysis",
        discipline,
        disciplineLabel,
        description: `Work through 2 experimental or graphical analysis questions on ${topicPhrase} in ${subject}, practicing data interpretation, hypothesis evaluation, and control variables.`,
        actionableStep: `Analyze a sample experiment graph or data table related to ${primaryTopic} (${subject}) and write out the biological deduction.`,
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
        description: `Construct an unbroken chronological timeline for ${topicPhrase} in ${subject}, plotting key dates, turning points, and major treaties or legislative milestones.`,
        actionableStep: `Draw a timeline with the top 8 pivotal events in ${primaryTopic} (${subject}), ensuring dates and sequences are accurate.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Causal Flowcharts (Triggers vs Underlying Causes)",
        category: "Causal Analysis",
        discipline,
        disciplineLabel,
        description: `Distinguish long-term structural causes (economic, ideological, socio-political) from immediate catalytic triggers for historical developments in ${topicPhrase} (${subject}).`,
        actionableStep: `Write out 3 structural causes and 1 immediate catalyst that shaped ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Primary Sources & Historiographical Perspectives",
        category: "Source Analysis",
        discipline,
        disciplineLabel,
        description: `Analyze competing contemporary perspectives and historical interpretations regarding ${topicPhrase} in ${subject}, evaluating motive, reliability, and ideological perspective.`,
        actionableStep: `Contrast 2 differing historical viewpoints or primary source perspectives on ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Thematic Essay Outlining (PEEL/TEEL)",
        category: "Essay Structure",
        discipline,
        disciplineLabel,
        description: `Draft structured essay thesis statements and bulleted evidence paragraphs for high-probability essay prompts on ${topicPhrase} in ${subject}.`,
        actionableStep: `Outline a 3-point thematic essay response for an exam prompt centered on ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Historical Figures & Key Lexicon",
        category: "Historical Lexicon",
        discipline,
        disciplineLabel,
        description: `Review key figures, political factions, and distinct period terminology associated with ${topicPhrase} in ${subject} to enhance analytical sophistication in written answers.`,
        actionableStep: `Flash-recall the roles, motives, and outcomes of 3 major figures in ${primaryTopic} (${subject}).`,
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
        description: `Sketch and annotate the key geographical features, plate boundaries, climate zones, or demographic distributions relevant to ${topicPhrase} in ${subject}.`,
        actionableStep: `Draw an annotated sketch map illustrating the spatial distribution and landforms of ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Physical Processes vs Human Impacts",
        category: "Process Synthesis",
        discipline,
        disciplineLabel,
        description: `Create a two-column synthesis connecting physical geomorphic or atmospheric processes in ${topicPhrase} directly to human vulnerability, infrastructure, and economic impacts in ${subject}.`,
        actionableStep: `Map how physical processes in ${primaryTopic} (${subject}) directly influence local human populations and land use.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Named Case Study Fact Matrix",
        category: "Case Study Evidence",
        discipline,
        disciplineLabel,
        description: `Compile concrete facts, named locations, dates, statistics, and management outcomes for your primary case studies in ${topicPhrase} (${subject}).`,
        actionableStep: `Memorize 4 specific data points (location, magnitude/statistic, impact, response) for a case study in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Sustainable Management & Evaluation",
        category: "Management Evaluation",
        discipline,
        disciplineLabel,
        description: `Diagram the sustainable management strategies implemented for ${topicPhrase} in ${subject}, evaluating strengths, limitations, and stakeholder conflicts.`,
        actionableStep: `Evaluate 2 management solutions for ${primaryTopic} (${subject}), comparing economic costs against long-term environmental sustainability.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Map Skills & Quantitative Data Interpretation",
        category: "Data & Map Skills",
        discipline,
        disciplineLabel,
        description: `Practice reading contour maps, population pyramids, climographs, or statistical indices related to ${topicPhrase} in ${subject}.`,
        actionableStep: `Interpret a sample graph or topographic map segment associated with ${primaryTopic} (${subject}).`,
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
        description: `Map out central themes and recurring motifs in ${topicPhrase} for ${subject}, identifying the author's primary social, moral, or philosophical commentary.`,
        actionableStep: `Write out the author's core thesis or societal critique embodied in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Versatile Textual Evidence Bank",
        category: "Textual Evidence",
        discipline,
        disciplineLabel,
        description: `Memorize 5 to 7 versatile quotes for ${topicPhrase} in ${subject}, tagging each with literary devices (metaphor, imagery, symbolism, dramatic irony) and thematic connections.`,
        actionableStep: `Test your recall of 4 direct quotes from ${primaryTopic} (${subject}) and explain the effect of the literary devices used.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Analytical Writing Drill (PEEL / TEEL)",
        category: "Analytical Writing",
        discipline,
        disciplineLabel,
        description: `Write a timed 15-minute PEEL paragraph (Point, Evidence, Explanation, Link) dissecting a key scene, stanza, or passage from ${topicPhrase} in ${subject}.`,
        actionableStep: `Draft one tightly argued analytical paragraph analyzing textual evidence from ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Character Arc & Dynamic Relationship Chart",
        category: "Character Dynamics",
        discipline,
        disciplineLabel,
        description: `Diagram the trajectory of major figures in ${topicPhrase} (${subject}), noting key turning points, moral conflicts, and structural foil relationships.`,
        actionableStep: `Outline the internal conflict and transformation of a central character in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Prompt Deconstruction & Essay Planning",
        category: "Essay Strategy",
        discipline,
        disciplineLabel,
        description: `Deconstruct 2 past essay prompts on ${topicPhrase} in ${subject}, formulating nuanced thesis statements with 3 supporting topic sentences.`,
        actionableStep: `Break down an essay question on ${primaryTopic} (${subject}) into keywords, formulating an arguable thesis statement.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "computer_science": {
      items.push({
        id: 1,
        title: "Trace Table Dry-Run & Variable States",
        category: "Algorithm Tracing",
        discipline,
        disciplineLabel,
        description: `Step through key algorithms or code segments in ${topicPhrase} for ${subject} line-by-line using a trace table to record variable states at each loop iteration.`,
        actionableStep: `Execute a handwritten trace table for a loop or recursive call in ${primaryTopic} (${subject}) with a small sample input.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Big-O Time & Space Complexity Analysis",
        category: "Complexity Analysis",
        discipline,
        disciplineLabel,
        description: `Analyze the best, average, and worst-case Big-O time and space complexity for operations in ${topicPhrase} (${subject}), understanding the theoretical trade-offs.`,
        actionableStep: `State and justify the Big-O time and auxiliary space complexity for algorithms in ${primaryTopic} (${subject}).`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Edge-Case Testing Suite",
        category: "Edge Cases & Testing",
        discipline,
        disciplineLabel,
        description: `Write down tests for boundary conditions in ${topicPhrase} (${subject}): null pointers, empty collections, single-element inputs, off-by-one indices, and overflow limits.`,
        actionableStep: `List 4 edge cases for an implementation of ${primaryTopic} in ${subject} and verify how the logic handles each.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Handwritten Code / Pseudocode Implementation",
        category: "Pseudocode Drill",
        discipline,
        disciplineLabel,
        description: `Write syntactically clean pseudocode or language implementations for ${topicPhrase} in ${subject} on paper without relying on IDE auto-complete or compiler diagnostics.`,
        actionableStep: `Write the core logic or class structure for ${primaryTopic} (${subject}) on paper, checking syntax and loop termination manually.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Data Structure & Architectural Trade-offs",
        category: "System Design",
        discipline,
        disciplineLabel,
        description: `Contrast why one data structure or architectural pattern in ${topicPhrase} (${subject}) is chosen over alternatives, weighing lookup speed against memory overhead.`,
        actionableStep: `Compare two data structure choices or approaches for ${primaryTopic} in ${subject}, explaining where each is optimal.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "economics": {
      items.push({
        id: 1,
        title: "Accurately Labeled Economic Diagrams",
        category: "Diagrammatic Precision",
        discipline,
        disciplineLabel,
        description: `Draw and label every core diagram for ${topicPhrase} in ${subject} with correct axes, supply/demand curves, shift directions, and equilibrium price/quantity points.`,
        actionableStep: `Draw the primary market or macroeconomic diagram for ${primaryTopic} (${subject}), labeling all axes and shift movements clearly.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Step-by-Step Economic Transmission Chains",
        category: "Transmission Mechanism",
        discipline,
        disciplineLabel,
        description: `Write out the step-by-step causal chain explaining how shifts or policy interventions in ${topicPhrase} (${subject}) cascade through consumer behavior, investment, and market equilibrium.`,
        actionableStep: `Write a 4-step chain of reasoning linking a shock in ${primaryTopic} (${subject}) to its macroeconomic impact.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Quantitative Formulas & Elasticity Calculations",
        category: "Quantitative Economics",
        discipline,
        disciplineLabel,
        description: `Calculate elasticity coefficients, multipliers, GDP components, or revenue changes for ${topicPhrase} in ${subject} showing full working and correct signs.`,
        actionableStep: `Solve a quantitative numerical problem for ${primaryTopic} (${subject}), specifying whether demand/supply is elastic, inelastic, or unit elastic.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Policy Evaluation & Trade-off Matrix",
        category: "Policy Evaluation",
        discipline,
        disciplineLabel,
        description: `Evaluate government interventions in ${topicPhrase} for ${subject} by weighing short-term vs long-term impacts, efficiency vs equity, and government failure risks.`,
        actionableStep: `Evaluate one fiscal, monetary, or regulatory policy response addressing ${primaryTopic} in ${subject}, identifying both benefits and unintended consequences.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Real-World Empirical Case Evidence",
        category: "Empirical Application",
        discipline,
        disciplineLabel,
        description: `Pair theoretical mechanisms in ${topicPhrase} (${subject}) with 2 specific real-world economies, industry developments, or recent historical episodes.`,
        actionableStep: `Write a 3-sentence empirical example applying the theory of ${primaryTopic} in ${subject} to an actual economy.`,
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
        description: `Map out explicit constitutional clauses, statutory mandates, and institutional jurisdictions relevant to ${topicPhrase} in ${subject}.`,
        actionableStep: `Identify the primary constitutional articles or institutional powers governing ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Separation of Powers & Institutional Checks",
        category: "Institutional Checks",
        discipline,
        disciplineLabel,
        description: `Analyze how the executive, legislature, and judiciary interact or check one another within ${topicPhrase} in ${subject}, noting institutional friction and oversight mechanisms.`,
        actionableStep: `Diagram the checks and balances operating between governmental branches regarding ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Landmark Judicial Decisions & Precedents",
        category: "Legal Precedents",
        discipline,
        disciplineLabel,
        description: `Review major judicial rulings and precedents impacting ${topicPhrase} in ${subject}, noting the majority constitutional rationale and dissenting arguments.`,
        actionableStep: `Review 2 landmark judicial precedents or legal interpretations that shaped ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Comparative Political Arguments & Debates",
        category: "Argument Formulation",
        discipline,
        disciplineLabel,
        description: `Draft a balanced analytical argument on ${topicPhrase} for ${subject}, articulating both affirmative arguments and counter-perspectives on democratic legitimacy or policy efficacy.`,
        actionableStep: `Write a structured balanced argument weighing two opposing ideological stances on ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Contemporary Case Integration & Public Policy",
        category: "Contemporary Context",
        discipline,
        disciplineLabel,
        description: `Connect theoretical doctrines in ${topicPhrase} (${subject}) to current policy debates, legislative bills, electoral outcomes, or international treaties.`,
        actionableStep: `Cite a contemporary political event or policy reform that illustrates ${primaryTopic} in ${subject} in practice.`,
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
        description: `Isolate and write out the 5 essential definitions, laws, or fundamental principles of ${topicPhrase} in ${subject} from memory without consulting notes.`,
        actionableStep: `Write a clean reference summary of the core principles of ${primaryTopic} in ${subject}.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Model Case / Problem Decomposition",
        category: "Model Breakdown",
        discipline,
        disciplineLabel,
        description: `Dissect a solved example or classic framework in ${topicPhrase} (${subject}) step-by-step to understand the underlying methodology and structure.`,
        actionableStep: `Break down one model problem or framework in ${primaryTopic} (${subject}) into discrete sequential steps.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Active Recall & Feynman Explanation",
        category: "Active Recall",
        discipline,
        disciplineLabel,
        description: `Explain the core mechanism of ${topicPhrase} in ${subject} in plain language without looking at your notes, identifying where your explanation stumbles.`,
        actionableStep: `Explain ${primaryTopic} in ${subject} out loud in 3 minutes as if teaching a beginner.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Deliberate Application & Timed Questions",
        category: "Application Practice",
        discipline,
        disciplineLabel,
        description: `Tackle 2 to 3 exam-style application questions specifically on ${topicPhrase} in ${subject} under timed conditions to test functional mastery.`,
        actionableStep: `Complete 2 representative practice questions on ${primaryTopic} (${subject}) under exam timing.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Error Log & Conceptual Synthesis",
        category: "Error Analysis",
        discipline,
        disciplineLabel,
        description: `Review every question you answered incorrectly or hesitated on in ${topicPhrase} (${subject}), rewriting the correct explanation and root cause.`,
        actionableStep: `Log mistakes and write out key takeaways for ${primaryTopic} in ${subject}.`,
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
