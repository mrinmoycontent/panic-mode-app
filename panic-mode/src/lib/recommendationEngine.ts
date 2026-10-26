#!/usr/bin/env python3
"""Safely patch Panic Mode's topic-specific Mathematics edge-case recommendations.

Run from the repository root:
  python apply_panic_mode_recommendation_fix.py
Or pass the root explicitly:
  python apply_panic_mode_recommendation_fix.py --repo /path/to/panic-mode-app

The script edits both mirrored source files and both mirrored test files only after
all expected markers, file mirrors, and validations have passed. It then runs the
repository's typecheck, tests, and production build. It does not commit or push.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys

ENGINE_REL = [
    Path("artifacts/panic-mode/src/lib/recommendationEngine.ts"),
    Path("panic-mode/src/lib/recommendationEngine.ts"),
]
TEST_REL = [
    Path("artifacts/panic-mode/src/lib/__tests__/recommendationEngine.test.ts"),
    Path("panic-mode/src/lib/__tests__/recommendationEngine.test.ts"),
]


def replace_once(text: str, old: str, new: str, description: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one occurrence of {description}; found {count}. No files written.")
    return text.replace(old, new, 1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="Path to the panic-mode-app repository root")
    parser.add_argument("--skip-checks", action="store_true", help="Apply the patch without running pnpm checks")
    args = parser.parse_args()
    root = args.repo.resolve()
    all_rel = ENGINE_REL + TEST_REL
    missing = [str(p) for p in all_rel if not (root / p).is_file()]
    if missing:
        print("ERROR: Repository files not found under", root, file=sys.stderr)
        for p in missing:
            print("  -", p, file=sys.stderr)
        return 2

    engine_a, engine_b = [(root / p).read_text(encoding="utf-8") for p in ENGINE_REL]
    tests_a, tests_b = [(root / p).read_text(encoding="utf-8") for p in TEST_REL]
    if engine_a != engine_b:
        print("ERROR: recommendationEngine.ts mirror copies differ. No files written.", file=sys.stderr)
        return 2
    if tests_a != tests_b:
        print("ERROR: recommendationEngine.test.ts mirror copies differ. No files written.", file=sys.stderr)
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
    for old, addition, label in topic_specific_rules:
        engine = replace_once(engine, old, old + addition, label)

    old_description = '          description: `Test boundary conditions, valid domains, and restriction limits for "${t3}" in ${subject} (e.g., zero denominators, negative square roots, asymptotes, or extreme limits) to guarantee full method marks on tricky exam questions.`,'
    new_description = '          description: `Test boundary conditions, valid domains, and restriction limits for "${t3}" in ${subject}: ${d3.edgeCases} Apply only the restrictions relevant to this topic to avoid losing method marks on tricky exam questions.`,'
    engine = replace_once(engine, old_description, new_description, "Mathematics card 4 description")
