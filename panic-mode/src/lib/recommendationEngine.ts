#!/usr/bin/env python3
"""Patch Panic Mode's mathematics recommendation edge-case wording.

Run from any directory; the script expects the repository root to be the
current directory. It patches both mirrored source trees and their tests.
It aborts without writing if files are missing, mirrors differ, or expected
source text is not unique.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path.cwd()
ENGINE_PATHS = [
    ROOT / "artifacts/panic-mode/src/lib/recommendationEngine.ts",
    ROOT / "panic-mode/src/lib/recommendationEngine.ts",
]
TEST_PATHS = [
    ROOT / "artifacts/panic-mode/src/lib/__tests__/recommendationEngine.test.ts",
    ROOT / "panic-mode/src/lib/__tests__/recommendationEngine.test.ts",
]


def replace_once(text: str, old: str, new: str, description: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one occurrence of {description}; found {count}.")
    return text.replace(old, new, 1)


def main() -> int:
    all_paths = ENGINE_PATHS + TEST_PATHS
    missing = [str(p.relative_to(ROOT)) for p in all_paths if not p.is_file()]
    if missing:
        print("ERROR: Run this script from the repository root. Missing files:", *missing, sep="\n  ", file=sys.stderr)
        return 2

    engine_a, engine_b = (p.read_text(encoding="utf-8") for p in ENGINE_PATHS)
    tests_a, tests_b = (p.read_text(encoding="utf-8") for p in TEST_PATHS)
    if engine_a != engine_b:
        print("ERROR: recommendationEngine.ts mirror copies differ; no files changed.", file=sys.stderr)
        return 2
    if tests_a != tests_b:
        print("ERROR: recommendationEngine.test.ts mirror copies differ; no files changed.", file=sys.stderr)
        return 2

    engine = engine_a
    topic_specific_rules = [
        (
            '      errorStep: `Audit 3 classic quadratic mistake patterns for "${t}" (sign errors, discriminant miscalculations, and missing roots) and write corrected solutions.`,',
            '\n      edgeCases: `The leading coefficient a must be non-zero, the discriminant Δ = b² - 4ac determines the number of real roots, and the quadratic formula denominator 2a cannot be zero.`,\n      edgeCasesStep: `Check 3 restrictions for "${t}": confirm a ≠ 0, classify roots using Δ = b² - 4ac, and substitute candidate roots into the original equation.`,',
            "quadratic edge-case guidance",
        ),
        (
            '      errorStep: `Review 3 common error patterns in "${t}" (mode slips, missing periodic branches, and sign errors in quadrants) and log corrected methods.`,',
            '\n      edgeCases: `Function-specific domains and ranges, tangent being undefined where cos θ = 0, and retaining only solutions in the stated interval.`,\n      edgeCasesStep: `Check the domain and range for "${t}", exclude angles where the chosen function is undefined, and list only solutions in the required interval.`,',
            "trigonometry edge-case guidance",
        ),
        (
            '      errorStep: `Analyze 3 past calculus errors in "${t}" (chain rule omissions, power rule slips, and integration constant slips) and write corrected reasoning.`,',
            '\n      edgeCases: `Function-domain restrictions, zero denominators in quotient expressions, non-differentiable points such as corners or discontinuities, and interval endpoints in definite integrals.`,\n      edgeCasesStep: `Check 3 calculus restrictions for "${t}": verify the function is defined, check denominator restrictions, and handle non-differentiable points or integral endpoints as required.`,',
            "calculus edge-case guidance",
        ),
        (
            '      errorStep: `Audit 3 common probability misconceptions in "${t}" (independence confusion and conditional sample space errors) and record corrections.`,',
            '\n      edgeCases: `Probabilities must satisfy 0 ≤ P(A) ≤ 1, probabilities across an exhaustive sample space must sum to 1, and conditional probability P(A|B) = P(A ∩ B) / P(B) requires P(B) > 0; mutually exclusive events are not generally independent.`,\n      edgeCasesStep: `Check 3 Probability restrictions for "${t}": verify each probability is between 0 and 1, confirm exhaustive outcomes sum to 1, and use conditional probability only when the conditioning event has non-zero probability. Explain why mutually exclusive events are not generally independent.`,',
            "probability edge-case guidance",
        ),
        (
            '    errorStep: `Review 3 mistakes or difficult questions on "${t}", identify the exact point of error, and write out corrected reasoning.`,',
            '\n    edgeCases: `Topic-specific domain and boundary restrictions, zero denominators where division is used, and checking candidate results against the original assumptions.`,\n    edgeCasesStep: `Identify 3 boundary or domain restrictions for "${t}" based on its actual rules, and verify each candidate answer against the original conditions.`,',
            "fallback edge-case guidance",
        ),
    ]
    for old, new, label in topic_specific_rules:
        engine = replace_once(engine, old, old + new, label)

    old_description = '          description: `Test boundary conditions, valid domains, and restriction limits for "${t3}" in ${subject} (e.g., zero denominators, negative square roots, asymptotes, or extreme limits) to guarantee full method marks on tricky exam questions.`,'
    new_description = '          description: `Test boundary conditions, valid domains, and restriction limits for "${t3}" in ${subject}: ${d3.edgeCases} Apply only the restrictions relevant to this topic to avoid losing method marks on tricky exam questions.`,'
    engine = replace_once(engine, old_description, new_description, "Mathematics card 4 description")

    old_step = '          actionableStep: `Identify 3 classic trick questions or boundary restrictions for "${t3}" (${subject}) and annotate how to avoid losing points.`,'
    new_step = '          actionableStep: d3.edgeCasesStep,'
    engine = replace_once(engine, old_step, new_step, "Mathematics card 4 actionable step")

    tests = tests_a
    marker = '    assert.ok(studyCards[3].actionableStep.includes("Probability"));'
    assertions = marker + '\n' + '\n'.join([
        r'    assert.match(studyCards[3].description, /probabilities must satisfy 0 ≤ P\(A\) ≤ 1/i);',
        r'    assert.match(studyCards[3].description, /P\(B\) > 0/i);',
        r'    assert.doesNotMatch(studyCards[3].description, /negative square roots|asymptotes|extreme limits/i);',
        r'    assert.match(studyCards[3].actionableStep, /between 0 and 1/i);',
        r'    assert.match(studyCards[3].actionableStep, /non-zero probability/i);',
    ])
    tests = replace_once(tests, marker, assertions, "multi-topic Mathematics Probability assertions")
