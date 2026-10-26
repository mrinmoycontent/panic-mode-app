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

  // Discipline-specific cards
  switch (discipline) {
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
        timeContext: timeNote,
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

    case "chemistry": {
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
      break;
    }

    case "biology": {
      items.push({
        id: 1,
        title: "Anatomical & Pathway Diagram Drill",
        category: "Visual Recall",
        discipline,
        disciplineLabel,
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
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        }.`,
        actionableStep: `Interpret a sample graph or topographic map segment associated with ${
          hasExplicitTopics ? `${primaryTopic} (${subject})` : `${subject}`
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
        description: `Map out central themes and recurring motifs ${
          hasExplicitTopics ? `in ${topicPhrase} for ${subject}` : `across your ${subject} texts`
        }, identifying the author's primary social, moral, or philosophical commentary.`,
        actionableStep: `Write out the author's core thesis or societal critique embodied ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Versatile Textual Evidence Bank",
        category: "Textual Evidence",
        discipline,
        disciplineLabel,
        description: `Memorize 5 to 7 versatile quotes ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for ${subject}`
        }, tagging each with literary devices (metaphor, imagery, symbolism, dramatic irony) and thematic connections.`,
        actionableStep: `Test your recall of 4 direct quotes ${
          hasExplicitTopics ? `from ${primaryTopic} (${subject})` : `for ${subject}`
        } and explain the effect of the literary devices used.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Analytical Writing Drill (PEEL / TEEL)",
        category: "Analytical Writing",
        discipline,
        disciplineLabel,
        description: `Write a timed 15-minute PEEL paragraph (Point, Evidence, Explanation, Link) dissecting a key scene, stanza, or passage ${
          hasExplicitTopics ? `from ${topicPhrase} in ${subject}` : `from ${subject}`
        }.`,
        actionableStep: `Draft one tightly argued analytical paragraph analyzing textual evidence ${
          hasExplicitTopics ? `from ${primaryTopic} (${subject})` : `for ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Character Arc & Dynamic Relationship Chart",
        category: "Character Dynamics",
        discipline,
        disciplineLabel,
        description: `Diagram the trajectory of major figures ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        }, noting key turning points, moral conflicts, and structural foil relationships.`,
        actionableStep: `Outline the internal conflict and transformation of a central character ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Prompt Deconstruction & Essay Planning",
        category: "Essay Strategy",
        discipline,
        disciplineLabel,
        description: `Deconstruct 2 past essay prompts ${
          hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `for ${subject}`
        }, formulating nuanced thesis statements with 3 supporting topic sentences.`,
        actionableStep: `Break down an essay question ${
          hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `on ${subject}`
        } into keywords, formulating an arguable thesis statement.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "computer_science": {
      const normSubject = (subject || "").toLowerCase();
      const isArchitectureTopicOrSubject = (text: string) => {
        const n = (text || "").toLowerCase();
        return (
          n.includes("architecture") ||
          n.includes("pipelin") ||
          n.includes("hazard") ||
          n.includes("forwarding") ||
          n.includes("cache coherence") ||
          n.includes("cache mapping") ||
          n.includes("instruction scheduling") ||
          n.includes("branch prediction") ||
          n.includes("superscalar") ||
          n.includes("mesi") ||
          /\bcpi\b/i.test(n)
        );
      };

      const isArchitectureSubject = isArchitectureTopicOrSubject(normSubject);
      const isArchitectureTopic = topics.some((t) => isArchitectureTopicOrSubject(t));
      const isComputerArchitecture = isArchitectureSubject || isArchitectureTopic;

      if (isComputerArchitecture) {
        const isTopicSubMatch =
          !hasExplicitTopics ||
          topics.every(
            (t) =>
              t.toLowerCase().includes("architecture") ||
              normSubject.includes(t.toLowerCase())
          );

        items.push({
          id: 1,
          title: "Pipeline Hazards & Forwarding Cycle Trace",
          category: "Pipeline Tracing",
          discipline,
          disciplineLabel,
          description: `Trace execution cycle-by-cycle across the 5 standard pipeline stages: Instruction Fetch (IF), Instruction Decode / Register Read (ID), Execute (EX), Memory Access (MEM), and Write-Back (WB)${
            hasExplicitTopics && !isTopicSubMatch ? ` for ${topicPhrase}` : ""
          }. Identify Read-After-Write (RAW) data hazards, map active forwarding paths (EX->EX and MEM->EX) that bypass register files, and calculate required stalls or pipeline bubbles when operands cannot be forwarded.`,
          actionableStep: `Construct a multi-cycle pipeline execution timing diagram for a 4-to-5 instruction sequence containing back-to-back arithmetic instructions and a load dependency, marking all RAW hazards, forwarding paths, stalls, and bubbles.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "MESI Cache-Coherence State Transitions",
          category: "Cache Coherence",
          discipline,
          disciplineLabel,
          description: `Practice snooping cache coherence state transitions using the 4-state MESI protocol: Modified (M), Exclusive (E), Shared (S), and Invalid (I) across multiple processor cores sharing a common bus${
            hasExplicitTopics && !isTopicSubMatch ? ` for ${topicPhrase}` : ""
          }. For every CPU read hit/miss and CPU write hit/miss, determine exact state changes, whether bus reads (BusRd) or bus read with intent to modify (BusRdX) are broadcast, when cache lines must be invalidated, and when dirty blocks trigger writebacks to memory.`,
          actionableStep: `Construct a 2-core trace table tracking cache line states (Modified, Exclusive, Shared, and Invalid), bus transactions (BusRd/BusRdX), invalidations, and writebacks across an interleaved sequence of 5 read and write operations.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "CPI, Stall Penalties & Pipeline Performance",
          category: "Performance Analysis",
          discipline,
          disciplineLabel,
          description: `Calculate pipeline execution time and processor throughput using the classic performance equation: Execution Time = Instruction Count × CPI × Clock Cycle Time. Compute effective Cycles Per Instruction (CPI_effective = CPI_ideal + Memory Stalls + RAW Stalls + Branch Stalls)${
            hasExplicitTopics && !isTopicSubMatch ? ` for ${topicPhrase}` : ""
          }, quantifying clock cycle penalties from data dependency interlocks and branch mispredictions.`,
          actionableStep: `Solve 2 quantitative problems calculating effective CPI, total clock cycles, stall penalties, and overall execution-time changes resulting from adding operand forwarding or branch prediction hardware.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Hazard Detection & Edge Cases",
          category: "Hazard Detection",
          discipline,
          disciplineLabel,
          description: `Test edge cases in the hazard detection and forwarding units: analyze load-use dependencies (requiring a 1-cycle stall before forwarding from MEM to EX), conditional branch hazards (evaluating branch outcome resolution and pipeline flushes), independent instructions that can be reordered, and repeated register writes (WAW/WAR hazards)${
            hasExplicitTopics && !isTopicSubMatch ? ` for ${topicPhrase}` : ""
          }. Determine exactly when the control unit must forward, stall, or flush.`,
          actionableStep: `Review 4 pipeline edge-case scenarios (load-use dependency, taken branch hazard, independent instructions, and repeated destination register writes), deciding for each whether to forward data, insert a stall bubble, or flush pipeline registers.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Forwarding vs Stalling Trade-offs",
          category: "Architectural Trade-offs",
          discipline,
          disciplineLabel,
          description: `Critically evaluate hardware design trade-offs between forwarding paths and pipeline stalling${
            hasExplicitTopics && !isTopicSubMatch ? ` across ${topicPhrase}` : ""
          }. Compare performance gains (reduced CPI and faster execution time) against hardware complexity (multiplexers, comparator logic, silicon area, and critical path propagation delay). Analyze how snooping bus traffic impacts cache coherence scalability as the number of cores increases.`,
          actionableStep: `Write a comparative trade-off matrix evaluating full operand forwarding versus interlocked stalling across 5 criteria: performance, effective CPI, hardware complexity, bus traffic, and multi-core scalability.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else {
        items.push({
          id: 1,
          title: "Trace Table Dry-Run & Variable States",
          category: "Algorithm Tracing",
          discipline,
          disciplineLabel,
          description: `Step through key algorithms or code segments ${
            hasExplicitTopics ? `in ${topicPhrase} for ${subject}` : `across your ${subject} syllabus`
          } line-by-line using a trace table to record variable states at each loop iteration.`,
          actionableStep: `Execute a handwritten trace table for a loop or recursive call ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          }, understanding the theoretical trade-offs.`,
          actionableStep: `State and justify the Big-O time and auxiliary space complexity for algorithms ${
            hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          }: null pointers, empty collections, single-element inputs, off-by-one indices, and overflow limits.`,
          actionableStep: `List 4 edge cases for an implementation ${
            hasExplicitTopics ? `of ${primaryTopic} in ${subject}` : `in ${subject}`
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
            hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for core ${subject} algorithms`
          } on paper without relying on IDE auto-complete or compiler diagnostics.`,
          actionableStep: `Write the core logic or class structure ${
            hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
          } is chosen over alternatives, weighing lookup speed against memory overhead.`,
          actionableStep: `Compare two data structure choices or approaches ${
            hasExplicitTopics ? `for ${primaryTopic} in ${subject}` : `in ${subject}`
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
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
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
