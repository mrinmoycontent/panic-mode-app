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

export function isQuadraticEquationsTopic(text: string): boolean {
  const norm = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!norm) return false;
  return (
    norm.includes("quadratic") ||
    norm.includes("discriminant") ||
    norm.includes("completing the square") ||
    norm.includes("factorisation") ||
    norm.includes("factorization") ||
    norm.includes("roots of equation") ||
    norm.includes("quadratic formula") ||
    norm.includes("parabola")
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

  // 1. Geography
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
    isQuadraticEquationsTopic(norm) ||
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
 * Formats topic list naturally for guidance text, retaining all topics in original order.
 * Never drops topics or replaces them with "and related topics".
 */
export function formatTopicPhrase(topics: string[], fallbackSubject: string): string {
  if (!topics || topics.length === 0) return fallbackSubject;
  if (topics.length === 1) return `"${topics[0]}"`;
  if (topics.length === 2) return `"${topics[0]}" and "${topics[1]}"`;
  const allExceptLast = topics.slice(0, -1).map((t) => `"${t}"`).join(", ");
  const last = `"${topics[topics.length - 1]}"`;
  return `${allExceptLast}, and ${last}`;
}

/**
 * Topic detail helpers providing curriculum-accurate mathematical concepts.
 * Each topic includes its own valid domain and boundary restrictions for Card 4.
 */
function getMathTopicDetails(topic: string) {
  const t = (topic || "").trim();
  const lower = t.toLowerCase();

  if (lower.includes("quadratic")) {
    return {
      formulas: `standard form ax² + bx + c = 0, the discriminant Δ = b² - 4ac to classify root nature, and the quadratic formula x = (-b ± √(b² - 4ac)) / (2a)`,
      formulaStep: `Create a one-page formula sheet for "${t}" defining standard form ax² + bx + c = 0, discriminant conditions, and root properties.`,
      calculation: `solving quadratic equations by factorisation, completing the square, or using the quadratic formula with line-by-line working`,
      calculationStep: `Solve 4 progressive quadratic equations for "${t}" using factorisation, completing the square, and the quadratic formula without peeking at solutions.`,
      worked: `model quadratic equations step-by-step: clearing denominators, expanding brackets, and justifying method selection`,
      workedStep: `Write out complete step-by-step worked solutions for 3 quadratic equations in "${t}", showing all intermediate transformations and verifying roots by substitution.`,
      errors: `sign flips when evaluating -b, forgetting the ± symbol, dividing only the radical, and checking for extraneous solutions`,
      errorStep: `Audit 3 classic quadratic mistake patterns for "${t}" (sign errors, discriminant miscalculations, and missing roots) and write corrected solutions.`,
      edgeCases: `The coefficient a must not equal zero. The discriminant Δ = b² - 4ac determines whether there are two distinct real roots, one repeated real root, or no real roots. The denominator 2a in the quadratic formula must not be zero.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": confirm a ≠ 0, classify roots using Δ = b² - 4ac, and verify candidate roots by substitution.`,
    };
  }

  if (lower.includes("trig")) {
    return {
      formulas: `Pythagorean identities (sin²θ + cos²θ = 1), reciprocal ratios, exact special angles (30°, 45°, 60°), and the sine and cosine rules`,
      formulaStep: `Create a one-page reference sheet for "${t}" listing Pythagorean identities, angle addition rules, and exact values for standard angles.`,
      calculation: `evaluating trigonometric equations across specified intervals, angle transformations, and multi-step triangle calculations`,
      calculationStep: `Complete 4 trigonometric calculation problems for "${t}" on clean paper, finding all solutions within the domain without consulting worked notes.`,
      worked: `trigonometric identity proofs and multi-step angle calculations, showing every algebraic substitution and quadrant sign check`,
      workedStep: `Write out full step-by-step proofs and equation solutions for 3 multi-step problems in "${t}", justifying each identity used.`,
      errors: `degree versus radian mode errors, missing solutions across periodic intervals, and invalid cancellation inside trigonometric arguments`,
      errorStep: `Review 3 common error patterns in "${t}" (mode slips, missing periodic branches, and sign errors in quadrants) and log corrected methods.`,
      edgeCases: `Check function-specific domains and ranges. Tan θ is undefined when cos θ = 0, and reciprocal trigonometric functions are undefined wherever their denominators are zero. Retain only solutions in the required interval and account for periodic solutions.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": identify angles where the chosen function is undefined, check denominator restrictions in reciprocal identities, and list all valid solutions within the specified interval.`,
    };
  }

  if (lower.includes("calculus") || lower.includes("differentiat") || lower.includes("integrat")) {
    return {
      formulas: `differentiation rules (power, product, quotient, and chain rules), stationary point conditions, and fundamental integration formulas`,
      formulaStep: `Create a clean 1-page calculus reference for "${t}" summarizing differentiation rules, tangent/normal equations, and standard integrals.`,
      calculation: `finding derivatives, evaluating stationary points, determining tangents and normals, and computing definite and indefinite integrals`,
      calculationStep: `Solve 4 progressive calculus problems for "${t}" (derivatives, tangent slopes, and definite integrals) showing every step.`,
      worked: `composite function differentiation using the chain rule, optimization by setting f'(x) = 0, and area under curve evaluations`,
      workedStep: `Write out 3 detailed worked calculus solutions for "${t}", explicitly justifying method choice and showing all algebraic simplification.`,
      errors: `forgetting the constant of integration +C, omitting inner derivatives during chain rule application, and sign errors with negative powers`,
      errorStep: `Analyze 3 past calculus errors in "${t}" (chain rule omissions, power rule slips, and integration constant slips) and write corrected reasoning.`,
      edgeCases: `Check function-domain restrictions, zero denominators in quotient expressions, points where the function is not differentiable, and endpoints when evaluating definite integrals.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": verify the function is defined, check denominator restrictions, and handle non-differentiable points or definite-integral endpoints correctly.`,
    };
  }

  if (lower.includes("probabilit") || lower.includes("statist")) {
    return {
      formulas: `probability rules: addition rule P(A ∪ B), conditional probability P(A|B) = P(A ∩ B) / P(B), independence conditions, and expected value formulas`,
      formulaStep: `Create a 1-page formula summary for "${t}" covering sample space definitions, conditional probability formulas, and tree diagram rules.`,
      calculation: `calculating compound and conditional probabilities using tree diagrams, Venn diagrams, and permutations/combinations`,
      calculationStep: `Complete 4 progressive probability calculations for "${t}", verifying that all branch probabilities sum to 1.`,
      worked: `multi-stage probability trees, conditional probability derivations, and Bayes' theorem applications without skipping steps`,
      workedStep: `Work through 3 multi-stage probability problems for "${t}", drawing complete sample space diagrams and writing explicit calculation steps.`,
      errors: `confusing independent with mutually exclusive events, denominator errors in conditional probability, and failing to verify probabilities sum to 1`,
      errorStep: `Audit 3 common probability misconceptions in "${t}" (independence confusion and conditional sample space errors) and record corrections.`,
      edgeCases: `Every event probability must satisfy 0 ≤ P(A) ≤ 1. Probabilities across an exhaustive sample space must sum to 1. Conditional probability P(A|B) = P(A ∩ B) / P(B) requires P(B) > 0. Mutually exclusive events are not generally independent.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": verify probabilities lie between 0 and 1, confirm exhaustive outcomes sum to 1, and do not calculate conditional probability when P(B) = 0. Explain the distinction between mutually exclusive and independent events.`,
    };
  }

  return {
    formulas: `core definitions, governing equations, symbolic notation, and theorem restrictions for "${t}"`,
    formulaStep: `Create a one-page formula and identity reference sheet for "${t}" defining all symbols, rules, and applicable conditions.`,
    calculation: `progressive numerical and algebraic problems directly related to "${t}", checking substitutions, signs, and boundary restrictions`,
    calculationStep: `Complete 4 progressive calculation problems on "${t}" on clean paper, verifying each result independently.`,
    worked: `model worked examples for "${t}", identifying given information, required quantities, and valid algebraic transformations`,
    workedStep: `Write out complete step-by-step worked solutions for 3 problems on "${t}", explaining the mathematical method selected for each.`,
    errors: `algebraic manipulation errors, sign flips, invalid transformations, and answers outside valid domain constraints`,
    errorStep: `Review 3 mistakes or difficult questions on "${t}", identify the exact point of error, and write out corrected reasoning.`,
    edgeCases: `Check topic-specific domain restrictions, boundary conditions, zero denominators where division is used, and whether candidate results satisfy the original assumptions for "${t}".`,
    edgeCasesStep: `Identify 3 domain or boundary restrictions for "${t}" based on its actual rules and verify that each candidate answer satisfies the original conditions.`,
  };
}

/**
 * Topic detail helpers providing curriculum-accurate geographical concepts.
 */
function getGeoTopicDetails(topic: string) {
  const t = (topic || "").trim();
  const lower = t.toLowerCase();

  if (lower.includes("tectonic") || lower.includes("earthquake") || lower.includes("volcano") || lower.includes("plate")) {
    return {
      isTectonic: true,
      process: `Analyze the physical geomorphic processes of "${t}": trace mantle convection currents, ridge push, slab pull, and how plate movements at destructive, constructive, and conservative boundaries drive seismic shockwaves and volcanic activity without confusing with atmospheric or climatic processes.`,
      processStep: `Construct a cause-and-effect flow diagram for "${t}" (Geography) linking mantle convection currents to plate boundary interactions and seismic/volcanic hazard risks.`,
      map: `Sketch and annotate key spatial features of "${t}" in Geography: destructive (subduction zones and trenches), constructive (mid-ocean ridges), and conservative plate boundaries, fold mountains, and global epicenter distributions without confusing with climatic processes.`,
      mapStep: `Draw an annotated sketch map or cross-section for "${t}" (Geography), illustrating plate boundary movements, subduction zones, magma convection currents, and earthquake epicenters.`,
      caseStudy: `Compile concrete facts, named locations, Richter/Mercalli magnitudes, casualty statistics, and emergency responses for contrasting tectonic hazard case studies in "${t}" (comparing high-income and low-income country impacts).`,
      caseStudyStep: `Memorize 4 specific case-study data points (named location, magnitude/statistic, primary/secondary impacts, and emergency response) for a tectonic event in "${t}" (Geography).`,
      management: `Evaluate sustainable hazard management strategies implemented for "${t}" in Geography, assessing earthquake-resistant building design, tsunami early-warning systems, and land-use zoning.`,
      managementStep: `Evaluate 2 hazard management strategies for "${t}" (Geography), weighing structural engineering costs against lives saved and community resilience.`,
    };
  }

  if (lower.includes("climate") || lower.includes("weather") || lower.includes("atmospher") || lower.includes("global warm")) {
    return {
      isClimate: true,
      process: `Analyze the physical atmospheric mechanisms and socio-economic impacts of "${t}": examine greenhouse gas radiative forcing, the enhanced greenhouse effect versus natural orbital cycles, and direct consequences such as sea level rise, glacial retreat, and extreme weather frequency without confusing with tectonic processes.`,
      processStep: `Construct a cause-and-effect flow diagram for "${t}" (Geography) linking anthropogenic greenhouse gas emissions to atmospheric temperature rise, altered precipitation patterns, and human vulnerability.`,
      map: `Sketch and annotate global climatic distributions and vulnerability maps for "${t}", illustrating global atmospheric circulation cells, climographs, sea-surface temperature shifts, and regional drought or flood hazard hotspots.`,
      mapStep: `Draw an annotated sketch map or climograph for "${t}" (Geography), detailing shifting climate zones, storm track trajectories, and regional vulnerability hotspots.`,
      caseStudy: `Compile concrete facts, named locations, greenhouse emission figures, temperature anomaly statistics, and socio-economic consequences for primary case studies in "${t}" (such as low-lying coastal regions or drought-prone agricultural basins).`,
      caseStudyStep: `Memorize 4 precise data points (named location, climate metric/statistic, community impact, and adaptation measure) for a case study in "${t}" (Geography).`,
      management: `Evaluate sustainable management strategies and international agreements implemented for "${t}" in Geography, contrasting carbon mitigation policies against localized flood/heat adaptation measures.`,
      managementStep: `Evaluate 2 sustainable management solutions for "${t}" (Geography), comparing economic implementation costs against long-term environmental sustainability.`,
    };
  }

  if (lower.includes("resource") || lower.includes("energy") || lower.includes("mineral") || lower.includes("water")) {
    return {
      isResource: true,
      process: `Analyze the exploitation, distribution, and environmental impacts of "${t}": examine reserve depletion, extraction methodologies, ecological degradation from mining or extraction, and socio-economic dependencies across global regions.`,
      processStep: `Construct a process flow diagram for "${t}" (Geography) tracing extraction, transportation, consumption patterns, and resulting ecological and human impacts.`,
      map: `Sketch and annotate spatial distribution maps and resource flow networks for "${t}", illustrating global reserve locations, supply pipelines/shipping lanes, and spatial disparities between consuming and producing regions.`,
      mapStep: `Draw an annotated sketch map for "${t}" (Geography) showing spatial distributions of major reserves, extraction centers, and consumption disparities.`,
      caseStudy: `Compile concrete facts, named locations, reserve depletion statistics, extraction volumes, and stakeholder conflicts for primary case studies in "${t}", detailing environmental and economic trade-offs.`,
      caseStudyStep: `Memorize 4 concrete case-study facts (named location, extraction/reserve statistic, environmental impact, and policy response) for "${t}" (Geography).`,
      management: `Evaluate sustainable management strategies implemented for "${t}" in Geography, assessing renewable energy substitution, circular economy recycling, conservation policies, and environmental impact assessments.`,
      managementStep: `Evaluate 2 sustainable resource management solutions for "${t}" (Geography), comparing economic viability against resource conservation.`,
    };
  }

  return {
    process: `Create a synthesis connecting physical geomorphic or atmospheric processes in "${t}" directly to human vulnerability, infrastructure, and land-use impacts in ${topic}.`,
    processStep: `Map how physical processes in "${t}" (Geography) directly influence local human populations, settlement patterns, and economic activity.`,
    map: `Sketch and annotate key geographical features, landforms, spatial distributions, or demographic patterns relevant to "${t}" in Geography.`,
    mapStep: `Draw an annotated sketch map or landform cross-section illustrating the spatial distribution and features of "${t}" (Geography).`,
    caseStudy: `Compile concrete facts, named locations, dates, statistics, and management outcomes for your primary case studies in "${t}" (Geography).`,
    caseStudyStep: `Memorize 4 specific data points (location, magnitude/statistic, impact, and response) for a case study in "${t}" (Geography).`,
    management: `Diagram sustainable management strategies implemented for "${t}" in Geography, evaluating strengths, limitations, and stakeholder conflicts.`,
    managementStep: `Evaluate 2 management solutions for "${t}" (Geography), comparing economic costs against long-term environmental sustainability.`,
  };
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
  const getTopicForCard = (idx: number): string => {
    if (!hasExplicitTopics) return `"${subject}"`;
    return `"${topics[idx % topics.length]}"`;
  };
  const hoursLeft = calculateHoursLeft(timeLeft);

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

  switch (discipline) {
    case "mathematics": {
      const normSubject = (subject || "").toLowerCase();
      const isQuadraticSubject = isQuadraticEquationsTopic(normSubject);
      const isAllQuadraticTopics =
        topics.length > 0 && topics.every((t) => isQuadraticEquationsTopic(t));
      const isSingleQuadraticTopic =
        topics.length === 1 && isQuadraticEquationsTopic(topics[0]);
      const isGenericSubject =
        normSubject === "target exam" ||
        normSubject === "general exam preparation" ||
        normSubject === "" ||
        normSubject === "general" ||
        normSubject === "mathematics" ||
        normSubject === "math";

      const isQuadraticEquations =
        isAllQuadraticTopics ||
        (isSingleQuadraticTopic && isGenericSubject) ||
        (isQuadraticSubject && (topics.length === 0 || isAllQuadraticTopics));

      if (isQuadraticEquations) {
        const isTopicSubMatch =
          !hasExplicitTopics ||
          topics.every(
            (t) =>
              isQuadraticEquationsTopic(t) ||
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
      } else if (hasExplicitTopics) {
        const N = topics.length;
        const t0 = topics[0];
        const t1 = topics[1 % N];
        const t2 = topics[2 % N];
        const t3 = topics[3 % N];

        const d0 = getMathTopicDetails(t0);
        const d1 = getMathTopicDetails(t1);
        const d2 = getMathTopicDetails(t2);
        const d3 = getMathTopicDetails(t3);

        items.push({
          id: 1,
          title: "Active Formula & Theorem Derivation",
          category: "Formula Mastery",
          discipline,
          disciplineLabel,
          description: `Write out every core formula, identity, and theorem required for "${t0}" in ${subject} from memory (including ${d0.formulas}). Verify sign conventions, boundary restrictions, and domain limits rather than passively re-reading formulas.`,
          actionableStep: d0.formulaStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Deliberate Problem Calculation",
          category: "Active Calculation",
          discipline,
          disciplineLabel,
          description: `Solve progressive numerical and algebraic problems in "${t1}" (${subject}) on clean paper without peeking at solution steps: practice ${d1.calculation}. Work line-by-line showing all algebraic transformations.`,
          actionableStep: d1.calculationStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Algebraic Error Audit & Mistake Log",
          category: "Error Analysis",
          discipline,
          disciplineLabel,
          description: `Review your past homework or mock test errors specifically for "${t2}" in ${subject}: catalogue where mistakes occurred — ${d2.errors}.`,
          actionableStep: d2.errorStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Edge Cases & Theorem Restrictions",
          category: "Edge Cases",
          discipline,
          disciplineLabel,
          description: `Test boundary conditions, valid domains, and restriction limits for "${t3}" in ${subject}: ${d3.edgeCases} Apply only the restrictions relevant to this topic to avoid losing method marks on tricky exam questions.`,
          actionableStep: d3.edgeCasesStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Timed Exam Simulation & Past Papers",
          category: "Timed Practice",
          discipline,
          disciplineLabel,
          description: `Set a 25-minute timer and solve representative past exam questions across ${topicPhrase} in ${subject} strictly under exam conditions with only your permitted calculator and formula sheet.`,
          actionableStep: `Complete a timed 25-minute mixed practice paper covering questions from ${topicPhrase} (${subject}) and grade your answers against official step-by-step mark schemes.`,
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
          description: `Write out every core formula, identity, and theorem required across your ${subject} syllabus from memory. Verify sign conventions, boundary restrictions, and domain limits rather than passively re-reading formulas.`,
          actionableStep: `Create a clean 1-page formula sheet for key ${subject} problem types with all variables and edge conditions clearly noted.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Deliberate Problem Calculation",
          category: "Active Calculation",
          discipline,
          disciplineLabel,
          description: `Solve 3 to 4 progressive numerical problems across core areas of ${subject} on clean paper without peeking at solution steps. Work line-by-line showing all algebraic transformations.`,
          actionableStep: `Tackle 2 medium and 2 challenging problems in high-yield sections of ${subject}, checking solutions only after completing all steps.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Algebraic Error Audit & Mistake Log",
          category: "Error Analysis",
          discipline,
          disciplineLabel,
          description: `Review your past homework or mock test errors specifically across ${subject}. Catalogue where mistakes occurred — arithmetic slips, sign flips, or incorrect formula substitution.`,
          actionableStep: `Write out the correct solutions for 3 previously missed problems in ${subject} and highlight the exact step where errors happened.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Timed Exam Simulation & Past Papers",
          category: "Timed Practice",
          discipline,
          disciplineLabel,
          description: `Set a 25-minute timer and solve 2 representative past exam questions on ${subject} strictly under exam conditions with only your permitted calculator and formula sheet.`,
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
          description: `Test boundary conditions (such as 0, negatives, asymptotes, or extreme limits) across your ${subject} syllabus to guarantee full method marks on tricky exam questions.`,
          actionableStep: `Identify 2 classic trick questions or boundary restrictions in ${subject} and annotate how to avoid losing points.`,
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
          hasExplicitTopics ? `in ${getTopicForCard(0)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `for ${getTopicForCard(1)} in ${subject}` : `for ${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(2)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `on ${getTopicForCard(3)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `across ${topicPhrase} (${subject})` : `in ${subject}`
        } against extreme limiting cases to verify dimensional and physical realism.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "chemistry": {
      const normSubject = (subject || "").toLowerCase();
      const isAtomicSubject = isAtomicStructureTopic(normSubject);
      const isAtomicStructure =
        (isAtomicSubject && (!hasExplicitTopics || topics.every((t) => isAtomicStructureTopic(t)))) ||
        (hasExplicitTopics && topics.every((t) => isAtomicStructureTopic(t)));

      const isStructuralSubject = isStructuralChemistryTopic(normSubject);
      const isStructuralChemistry =
        (isStructuralSubject && (!hasExplicitTopics || topics.every((t) => isStructuralChemistryTopic(t)))) ||
        (hasExplicitTopics && topics.every((t) => isStructuralChemistryTopic(t)));

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
            hasExplicitTopics ? `for ${getTopicForCard(0)} in ${subject}` : `in ${subject}`
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
            hasExplicitTopics ? `in ${getTopicForCard(1)} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `in ${getTopicForCard(2)} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `in ${getTopicForCard(3)} (${subject})` : `in ${subject}`
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
            hasExplicitTopics ? `on ${topicPhrase} (${subject})` : `in ${subject}`
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
        disciplineLabel,
        description: `Sketch and label the essential anatomical structures and pathway flowcharts ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `across your ${subject} syllabus`
        } (such as cell membranes, cellular organelles, or cycle stages) completely from memory.`,
        actionableStep: `Draw the core structural diagram or flowchart ${
          hasExplicitTopics ? `for ${getTopicForCard(0)} (${subject})` : `for key ${subject} processes`
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
          hasExplicitTopics ? `for ${getTopicForCard(1)} in ${subject}` : `in ${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(2)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `within ${getTopicForCard(3)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `${topicPhrase} (${subject})` : `${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(0)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(1)} in ${subject}` : `in ${subject}`
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
          hasExplicitTopics ? `on ${getTopicForCard(2)} in ${subject}` : `in ${subject}`
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
          hasExplicitTopics ? `${getTopicForCard(3)} (${subject})` : `${subject}`
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
          hasExplicitTopics ? `across ${topicPhrase} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "geography": {
      if (hasExplicitTopics) {
        const N = topics.length;

        const tectonicTopic = topics.find((t) => {
          const l = t.toLowerCase();
          return l.includes("tectonic") || l.includes("plate") || l.includes("earthquake") || l.includes("volcano");
        });
        const climateTopic = topics.find((t) => {
          const l = t.toLowerCase();
          return l.includes("climate") || l.includes("weather") || l.includes("atmospher") || l.includes("warm");
        });
        const resourceTopic = topics.find((t) => {
          const l = t.toLowerCase();
          return l.includes("resource") || l.includes("energy") || l.includes("mineral") || l.includes("water");
        });

        const card1Topic = tectonicTopic || topics[0];
        const card2Topic = climateTopic || (N > 1 ? topics[1 % N] : topics[0]);
        const card3Topic = resourceTopic || (N > 2 ? topics[2 % N] : topics[0]);
        const card4Topic = N >= 4 ? topics[3 % N] : (resourceTopic || climateTopic || topics[0]);

        const d1 = getGeoTopicDetails(card1Topic);
        const d2 = getGeoTopicDetails(card2Topic);
        const d3 = getGeoTopicDetails(card3Topic);
        const d4 = getGeoTopicDetails(card4Topic);

        items.push({
          id: 1,
          title: "Spatial Patterns & Annotated Sketch Maps",
          category: "Spatial Representation",
          discipline,
          disciplineLabel,
          description: d1.map,
          actionableStep: d1.mapStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Physical Processes vs Human Impacts",
          category: "Process Synthesis",
          discipline,
          disciplineLabel,
          description: d2.process,
          actionableStep: d2.processStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Named Case Study Fact Matrix",
          category: "Case Study Evidence",
          discipline,
          disciplineLabel,
          description: d3.caseStudy,
          actionableStep: d3.caseStudyStep,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        const card4Desc = N >= 4
          ? d4.management
          : (climateTopic && resourceTopic
              ? `Evaluate sustainable management strategies and conservation policies implemented across "${climateTopic}" and "${resourceTopic}" in Geography: contrast carbon mitigation and renewable energy transition against localized economic costs and stakeholder conflicts.`
              : d4.management);

        const card4Step = N >= 4
          ? d4.managementStep
          : (climateTopic && resourceTopic
              ? `Evaluate 2 sustainable management solutions across "${climateTopic}" and "${resourceTopic}" (Geography), weighing economic viability against environmental protection.`
              : d4.managementStep);

        items.push({
          id: 4,
          title: "Sustainable Management & Evaluation",
          category: "Management Evaluation",
          discipline,
          disciplineLabel,
          description: card4Desc,
          actionableStep: card4Step,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Map Skills & Quantitative Data Interpretation",
          category: "Data & Map Skills",
          discipline,
          disciplineLabel,
          description: `Practice reading climographs, hazard epicenter distribution maps, and quantitative resource consumption charts across ${topicPhrase} in Geography.`,
          actionableStep: `Interpret sample quantitative graphs, climographs, and spatial maps covering ${topicPhrase} (Geography), identifying spatial trends, data anomalies, and underlying geographical factors.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      } else {
        items.push({
          id: 1,
          title: "Spatial Patterns & Annotated Sketch Maps",
          category: "Spatial Representation",
          discipline,
          disciplineLabel,
          description: `Sketch and annotate the key geographical features, plate boundaries, climate zones, or demographic distributions across your ${subject} syllabus.`,
          actionableStep: `Draw an annotated sketch map illustrating spatial distributions and landforms in ${subject}.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 2,
          title: "Physical Processes vs Human Impacts",
          category: "Process Synthesis",
          discipline,
          disciplineLabel,
          description: `Create a two-column synthesis connecting physical geomorphic or atmospheric processes directly to human vulnerability, infrastructure, and economic impacts in ${subject}.`,
          actionableStep: `Map how physical processes in ${subject} directly influence local human populations and land use.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 3,
          title: "Named Case Study Fact Matrix",
          category: "Case Study Evidence",
          discipline,
          disciplineLabel,
          description: `Compile concrete facts, named locations, dates, statistics, and management outcomes for your primary case studies in ${subject}.`,
          actionableStep: `Memorize 4 specific data points (location, magnitude/statistic, impact, response) for a case study in ${subject}.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 4,
          title: "Sustainable Management & Evaluation",
          category: "Management Evaluation",
          discipline,
          disciplineLabel,
          description: `Diagram the sustainable management strategies implemented across your ${subject} syllabus, evaluating strengths, limitations, and stakeholder conflicts.`,
          actionableStep: `Evaluate 2 management solutions in ${subject}, comparing economic costs against long-term environmental sustainability.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });

        items.push({
          id: 5,
          title: "Map Skills & Quantitative Data Interpretation",
          category: "Data & Map Skills",
          discipline,
          disciplineLabel,
          description: `Practice reading contour maps, population pyramids, climographs, or statistical indices across your ${subject} syllabus.`,
          actionableStep: `Interpret a sample graph or topographic map segment associated with ${subject}.`,
          timeContext: timeNote,
          prepContext: prepNote,
        });
      }
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
          hasExplicitTopics ? `in ${getTopicForCard(0)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `from ${getTopicForCard(1)} (${subject})` : `for ${subject}`
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
          hasExplicitTopics ? `from ${getTopicForCard(2)} (${subject})` : `for ${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(3)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `across ${topicPhrase} (${subject})` : `on ${subject}`
        } into keywords, formulating an arguable thesis statement.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "computer_science": {
      const normSubject = (subject || "").toLowerCase();
      const isArchitectureSubject = isArchitectureTopicOrSubject(normSubject);
      const isComputerArchitecture =
        (isArchitectureSubject && (!hasExplicitTopics || topics.every((t) => isArchitectureTopicOrSubject(t)))) ||
        (hasExplicitTopics && topics.every((t) => isArchitectureTopicOrSubject(t)));

      if (isComputerArchitecture) {
        const hasPipeline = topics.some((t) => isPipelineTopic(t));
        const hasMesi = topics.some((t) => isMesiTopic(t));
        const hasMemory = topics.some((t) => isMemoryHierarchyTopic(t));

        if (hasPipeline && !hasMesi) {
          items.push({
            id: 1,
            title: "Pipeline Hazards & Forwarding Cycle Trace",
            category: "Pipeline Tracing",
            discipline,
            disciplineLabel,
            description:
              "Construct clock-cycle pipeline execution diagrams across the 5 standard in-order stages: Instruction Fetch (IF), Instruction Decode / Register Read (ID), Execute (EX), Memory Access (MEM), and Write-Back (WB). Identify Read-After-Write (RAW) data dependencies, map active operand forwarding paths (EX->EX and MEM->EX) that bypass register files, and determine where hardware forwarding eliminates stalls.",
            actionableStep:
              "Draw a cycle-by-cycle multi-instruction timing chart for a sequence with back-to-back arithmetic instructions and a dependent instruction, tracing all active forwarding paths and verifying register values.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 2,
            title: "Load-Use Data Hazards & Stall Bubble Insertion",
            category: "Hazard Resolution",
            discipline,
            disciplineLabel,
            description:
              "Analyze the classic load-use data hazard where an instruction immediately depends on the result of a preceding load instruction. Because loaded memory data is only available at the end of the MEM stage, forwarding alone cannot supply the operand in time for the EX stage of the immediately following instruction; the hazard unit must freeze the PC and IF/ID pipeline registers and insert a 1-cycle stall bubble.",
            actionableStep:
              "Diagram a load-use dependency sequence (LW followed by ADD), identifying the exact clock cycle where the pipeline freezes IF/ID registers and inserts a NOP bubble into the EX stage.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 3,
            title: "Effective CPI & Pipeline Hazard Penalties",
            category: "Performance Analysis",
            discipline,
            disciplineLabel,
            description:
              "Calculate processor throughput using the performance equation: Execution Time = Instruction Count × Effective CPI × Clock Cycle Time. Express Effective CPI as Effective CPI = Ideal CPI + Average stall cycles per instruction. Quantify average stall penalties contributed specifically by data hazard load-use interlocks and branch mispredictions, ensuring penalties are defined per instruction without double-counting.",
            actionableStep:
              "Calculate Effective CPI using Effective CPI = Ideal CPI + Average stall cycles per instruction for a 5-stage pipeline with an Ideal CPI of 1.0, a 20% load frequency where half cause a 1-cycle stall, and a 15% branch frequency with a 2-cycle penalty.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 4,
            title: "Control Hazards, Branch Resolution & In-Order Invariants",
            category: "Control Hazards",
            discipline,
            disciplineLabel,
            description:
              "Analyze control hazard penalties for conditional and unconditional branches. Compare resolving branch outcomes and target addresses in the ID stage (1-cycle penalty) versus the EX stage (2-cycle penalty), and detail how the control unit flushes speculatively fetched instructions by converting pipeline register control signals to NOPs. Clarify that conventional in-order 5-stage pipelines avoid Write-After-Read (WAR) and Write-After-Write (WAW) hazards because instructions execute and write back strictly in program order; WAR and WAW hazards arise in architectures with out-of-order execution or variable-latency completion.",
            actionableStep:
              "Trace a taken conditional branch through the pipeline, marking the exact cycle when the branch condition resolves, which instructions are flushed from earlier stages, and why in-order writeback prevents WAR/WAW hazards.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 5,
            title: "Forwarding Hardware vs Compiler Scheduling Trade-offs",
            category: "Architectural Trade-offs",
            discipline,
            disciplineLabel,
            description:
              "Critically evaluate the architectural trade-offs between hardware operand forwarding and software compiler instruction scheduling. Compare performance gains (reduced stall cycles and lower Effective CPI) against hardware complexity (multiplexers, comparator circuits, silicon area, and critical path propagation delay). Contrast full forwarding, partial forwarding, and software delay-slot scheduling.",
            actionableStep:
              "Write a comparative evaluation matrix contrasting full hardware forwarding against software compiler code reordering across 4 criteria: Effective CPI, hardware complexity, critical path timing, and code size overhead.",
            timeContext: timeNote,
            prepContext: prepNote,
          });
        } else if (hasMesi && !hasPipeline) {
          items.push({
            id: 1,
            title: "MESI Four-State Definitions & Coherence Invariants",
            category: "State Definitions",
            discipline,
            disciplineLabel,
            description:
              "Define the 4 states of the snooping-based MESI protocol: Modified (M: dirty line, single exclusive owner, memory stale), Exclusive (E: clean line, single exclusive owner, matches memory), Shared (S: clean line, read-only copies may exist in peer caches), and Invalid (I: block contains invalid data). Explain the fundamental coherence invariant: single-writer multiple-reader (SWMR), ensuring no core ever observes stale data.",
            actionableStep:
              "Construct a reference summary table listing each MESI state (M, E, S, I) with its validity, dirtiness, ownership status, and whether peer caches may hold valid copies.",
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
              "Trace state transitions for local processor requests (PrRd, PrWr) and snooped broadcast bus transactions under a write-back, write-allocate protocol. Trace PrRd misses transitioning to E (if no peer caches share the block) or S (if shared line asserted). Detail silent transitions (E->M on a local write hit without bus activity) versus PrWr misses that broadcast BusRdX (read with intent to modify) to invalidate all peer copies.",
            actionableStep:
              "Construct a 2-core trace table tracking cache line states (M, E, S, I) across an interleaved sequence of 5 read and write operations, making protocol and bus assumptions explicit.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 3,
            title: "Bus Transactions, Invalidation & Dirty-Line Writebacks",
            category: "Bus Snooping Protocol",
            discipline,
            disciplineLabel,
            description:
              "Analyze snooping controller actions upon observing broadcast bus transactions. Detail when a core holding a block in state M must intervene to supply dirty data and perform a writeback to main memory upon snooping a BusRd or BusRdX. Explain when cores holding blocks in states E or S must transition to I upon observing a BusRdX or BusUpgr invalidation signal.",
            actionableStep:
              "Map the bus transactions (BusRd, BusRdX, BusUpgr) and peer cache snooping responses for a scenario where Core 0 writes to a block currently cached in state S by Core 1.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 4,
            title: "Coherence Miss Penalties & Effective CPI",
            category: "Performance Analysis",
            discipline,
            disciplineLabel,
            description:
              "Analyze the performance impact of cache coherence using the processor performance equation: Execution Time = Instruction Count × Effective CPI × Clock Cycle Time. Express Effective CPI as Effective CPI = Ideal CPI + Average stall cycles per instruction. Quantify average memory stall cycles contributed specifically by coherence misses (true sharing and false sharing invalidations) and bus contention delays, ensuring stall terms are defined per instruction without double-counting.",
            actionableStep:
              "Solve a quantitative memory hierarchy problem calculating Effective CPI from cache miss rates, coherence invalidation miss penalties, and average bus latency cycles per instruction.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 5,
            title: "Snooping Bus Scalability & Multi-Core Trade-offs",
            category: "Architectural Trade-offs",
            discipline,
            disciplineLabel,
            description:
              "Evaluate the architectural scalability trade-offs between shared broadcast snooping buses and directory-based coherence protocols as processor core counts scale. Analyze how broadcast traffic (BusRd, BusRdX, and invalidations) saturates shared bus bandwidth on symmetric multiprocessors (SMPs), and contrast with directory-based point-to-point messaging on distributed shared-memory architectures.",
            actionableStep:
              "Write a structured comparative summary contrasting broadcast snooping against directory-based coherence across 4 dimensions: bus bandwidth overhead, cache controller complexity, latency, and core count scalability.",
            timeContext: timeNote,
            prepContext: prepNote,
          });
        } else if (hasMemory && !hasPipeline && !hasMesi) {
          items.push({
            id: 1,
            title: "Cache Mapping & Address Decomposition",
            category: "Cache Organization",
            discipline,
            disciplineLabel,
            description:
              "Master address bit decomposition into Tag, Index, and Block Offset fields for direct-mapped, set-associative, and fully associative cache organizations. Calculate total cache capacity, data storage, and tag overhead bits for a given physical address width and block size.",
            actionableStep:
              "Deconstruct 3 32-bit memory addresses into Tag, Index, and Offset fields for a 64KB 4-way set-associative cache with 64-byte blocks, identifying target set indices.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 2,
            title: "Cache Miss Taxonomy & Replacement Policies",
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
        } else {
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
            hasExplicitTopics ? `in ${formatTopicWithSubject(getTopicForCard(0), subject, "parenthesis")}` : `in ${subject}`
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
            hasExplicitTopics ? `in ${formatTopicWithSubject(getTopicForCard(1), subject, "parenthesis")}` : `in ${subject}`
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
            hasExplicitTopics ? `of ${formatTopicWithSubject(getTopicForCard(2), subject, "in")}` : `in ${subject}`
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
            hasExplicitTopics ? `for ${formatTopicWithSubject(getTopicForCard(3), subject, "parenthesis")}` : `in ${subject}`
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
            hasExplicitTopics ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}` : `in ${subject}`
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
          hasExplicitTopics ? `for ${getTopicForCard(0)} (${subject})` : `for ${subject}`
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
          hasExplicitTopics ? `in ${getTopicForCard(1)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `for ${getTopicForCard(2)} (${subject})` : `in ${subject}`
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
          hasExplicitTopics ? `${getTopicForCard(3)} in ${subject}` : `${subject}`
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
          hasExplicitTopics ? `of ${topicPhrase} in ${subject}` : `of ${subject}`
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
          hasExplicitTopics ? `${getTopicForCard(0)} in ${subject}` : `${subject}`
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
          hasExplicitTopics ? `${getTopicForCard(1)} in ${subject}` : `${subject}`
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
          hasExplicitTopics ? `${getTopicForCard(2)} in ${subject}` : `${subject}`
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
          hasExplicitTopics ? `on ${getTopicForCard(3)} in ${subject}` : `in ${subject}`
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
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
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
            ? `of ${formatTopicWithSubject(getTopicForCard(0), subject, "in")}`
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
            ? `in ${formatTopicWithSubject(getTopicForCard(1), subject, "parenthesis")}`
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
            ? `${formatTopicWithSubject(getTopicForCard(2), subject, "in")}`
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
            ? `on ${formatTopicWithSubject(getTopicForCard(3), subject, "parenthesis")}`
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
            ? `for ${formatTopicWithSubject(topicPhrase, subject, "in")}`
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
