function getMathTopicDetails(topic: string) {
  const t = (topic || "").trim();
  const lower = t.toLowerCase();

  if (lower.includes("quadratic")) {
    return {
      formulas: `standard form ax² + bx + c = 0, the discriminant Δ = b² - 4ac, and the quadratic formula x = (-b ± √(b² - 4ac)) / (2a)`,
      formulaStep: `Create a one-page formula sheet for "${t}" defining standard form, discriminant conditions, and root properties.`,
      calculation: `solving quadratic equations by factorisation, completing the square, or using the quadratic formula`,
      calculationStep: `Solve 4 progressive quadratic equations for "${t}" using different solving methods and verify the roots.`,
      worked: `step-by-step quadratic solutions, including clearing denominators, expanding brackets, and selecting an appropriate method`,
      workedStep: `Write complete worked solutions for 3 quadratic equations in "${t}", showing every intermediate step.`,
      errors: `sign errors when evaluating -b, forgetting the ± symbol, discriminant mistakes, and incorrect division by 2a`,
      errorStep: `Audit 3 common errors in "${t}" and write corrected solutions.`,
      edgeCases: `The coefficient a must not equal zero. The discriminant Δ = b² - 4ac determines whether there are two distinct real roots, one repeated real root, or no real roots. The denominator 2a in the quadratic formula must not be zero.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": confirm a ≠ 0, classify roots using Δ = b² - 4ac, and verify candidate roots by substitution.`,
    };
  }

  if (lower.includes("trig")) {
    return {
      formulas: `Pythagorean identities (sin²θ + cos²θ = 1), reciprocal identities, angle-addition formulas, exact values for 30°, 45°, and 60°, and the sine and cosine rules`,
      formulaStep: `Create a one-page reference sheet for "${t}" listing Pythagorean identities, angle-addition formulas, reciprocal identities, and exact values for standard angles.`,
      calculation: `solving trigonometric equations over specified intervals, using angle transformations, and solving multi-step triangle problems`,
      calculationStep: `Complete 4 trigonometric problems for "${t}", showing each transformation and listing every valid solution in the required interval.`,
      worked: `trigonometric identity proofs, quadrant sign analysis, multi-step equations, and triangle calculations`,
      workedStep: `Write complete solutions for 3 problems in "${t}", explaining each identity and checking the final answers.`,
      errors: `degree-versus-radian mode errors, missing periodic solutions, incorrect quadrant signs, and invalid cancellation of trigonometric expressions`,
      errorStep: `Review 3 common errors in "${t}", correct each solution, and explain the correct interval and quadrant reasoning.`,
      edgeCases: `Check the domain and range of the trigonometric functions used. Tan θ is undefined when cos θ = 0, and reciprocal functions are undefined wherever their denominators equal zero. Trigonometric equations may have multiple solutions over an interval, so the required interval and periodicity must be respected.`,
      edgeCasesStep: `Identify 3 restrictions for "${t}": find angles where the selected function is undefined, check denominator restrictions in reciprocal identities, and list all solutions within the specified interval without including invalid angles.`,
    };
  }

  if (
    lower.includes("calculus") ||
    lower.includes("differentiat") ||
    lower.includes("integrat")
  ) {
    return {
      formulas: `power, product, quotient, and chain rules; stationary-point conditions; and standard integration formulas`,
      formulaStep: `Create a one-page calculus reference sheet for "${t}" summarizing differentiation rules, tangent and normal equations, and standard integrals.`,
      calculation: `finding derivatives, evaluating stationary points, determining tangent gradients, and computing definite and indefinite integrals`,
      calculationStep: `Solve 4 progressive calculus problems for "${t}", showing each differentiation or integration step.`,
      worked: `chain-rule applications, optimization using f'(x) = 0, and area-under-the-curve calculations`,
      workedStep: `Write complete worked solutions for 3 problems in "${t}", explaining the method and every algebraic transformation.`,
      errors: `forgetting the integration constant +C, omitting inner derivatives in the chain rule, and making sign errors with negative powers`,
      errorStep: `Analyse 3 common errors in "${t}", including chain-rule omissions, power-rule mistakes, and missing integration constants. Correct each solution.`,
      edgeCases: `Check the function's domain, zero denominators in quotient expressions, points where a function is not differentiable, and endpoints when evaluating definite integrals.`,
      edgeCasesStep: `Identify 3 restrictions for "${t}": check the function's domain, verify denominator restrictions, and handle non-differentiable points or definite-integral endpoints correctly.`,
    };
  }

  if (lower.includes("probabilit") || lower.includes("statist")) {
    return {
      formulas: `probability addition rules, conditional probability P(A|B) = P(A ∩ B) / P(B), independence conditions, and expected-value formulas`,
      formulaStep: `Create a one-page formula sheet for "${t}" covering sample spaces, conditional probability, addition rules, and tree diagrams.`,
      calculation: `calculating compound and conditional probabilities using tree diagrams, Venn diagrams, and permutations and combinations`,
      calculationStep: `Complete 4 probability calculations for "${t}" and verify that probabilities across exhaustive outcomes sum to 1.`,
      worked: `multi-stage probability trees, conditional-probability calculations, and Bayes' theorem applications`,
      workedStep: `Work through 3 probability problems for "${t}", showing sample-space diagrams and every calculation step.`,
      errors: `confusing mutually exclusive events with independent events, using an incorrect denominator in conditional probability, and failing to verify probability totals`,
      errorStep: `Audit 3 probability mistakes in "${t}", correct the calculations, and explain the difference between independent and mutually exclusive events.`,
      edgeCases: `Every event probability must satisfy 0 ≤ P(A) ≤ 1. Probabilities across an exhaustive sample space must sum to 1. Conditional probability P(A|B) = P(A ∩ B) / P(B) requires P(B) > 0. Mutually exclusive events are not generally independent.`,
      edgeCasesStep: `Check 3 restrictions for "${t}": verify that each probability lies between 0 and 1, confirm that exhaustive outcomes sum to 1, and reject conditional-probability calculations when P(B) = 0. Explain why mutually exclusive events are not generally independent.`,
    };
  }

  return {
    formulas: `core definitions, equations, notation, and theorem restrictions for "${t}"`,
    formulaStep: `Create a one-page reference sheet for "${t}" defining its key formulas, symbols, rules, and applicable conditions.`,
    calculation: `progressive numerical and algebraic problems related to "${t}", checking substitutions, signs, and applicable restrictions`,
    calculationStep: `Complete 4 progressive problems on "${t}" and independently verify each result.`,
    worked: `worked examples for "${t}", identifying known values, required quantities, and valid transformations`,
    workedStep: `Write complete solutions for 3 problems on "${t}", explaining each method and intermediate step.`,
    errors: `incorrect substitutions, algebraic errors, invalid transformations, and answers that violate domain restrictions`,
    errorStep: `Review 3 mistakes involving "${t}", identify the exact error, and write the corrected reasoning.`,
    edgeCases: `Check the actual domain, boundary conditions, denominator restrictions, and validity of candidate results for "${t}".`,
    edgeCasesStep: `Identify 3 relevant boundary or domain restrictions for "${t}" and explain how to verify that each final answer satisfies the original conditions.`,
  };
}
