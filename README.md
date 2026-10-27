# Panic Mode — Exam Revision & Capacity-Bounded Study Planner

**A rule-based EdTech application for exam urgency assessment, personalized revision recommendations, and time-constrained study planning.**

[**Live Demo**](https://mrinmoycontent.github.io/panic-mode-app/) · [**GitHub Repository**](https://github.com/mrinmoycontent/panic-mode-app)

## 1. Project Overview

Panic Mode is a browser-based exam preparation and revision planning application designed to help students organize their remaining syllabus, evaluate their available study time, prioritize revision, and track daily tasks before an examination.

The application addresses a practical planning problem: students have a finite amount of time before an exam, but the amount of revision required depends on how much syllabus remains and how prepared they are.

I designed and developed a rule-based workflow that combines exam deadlines, remaining chapters, preparation levels, daily study capacity, topic-specific recommendations, and task completion tracking within one interface.

The application uses deterministic rules and calculations rather than a machine learning model or generative AI API.

## 2. Problem Statement

Students preparing for examinations often struggle with three interconnected questions:

- How much revision remains compared with the time available?
- Which topics and activities should receive attention first?
- How can a realistic revision timetable be created without exceeding daily study capacity?

Panic Mode translates these inputs into an estimated urgency status, actionable revision guidance, a capacity-constrained timetable, and a daily progress checklist.

The goal is to support more structured, transparent study planning rather than promise exam results or replace academic guidance.

## 3. Key Features

### Exam Urgency Assessment

The assessment uses the exam date and time, remaining chapters, preparation level, and available daily study hours to estimate required versus available revision time.

It classifies the assessment as:

- **Safe:** The estimated workload fits within the model's planning assumptions.
- **Risky:** The available time is becoming constrained.
- **Critical:** The estimated workload exceeds the model's threshold or the deadline is very close.

The application also handles missing inputs, invalid dates, and examinations scheduled in the past.

### Topic-Aware Recommendation Engine

The recommendation engine generates structured study activities based on the detected subject and topics.

Supported subject classifications include Mathematics, Physics, Chemistry, Biology, History, Geography, English, Computer Science, Economics, Political Science, and a general fallback.

Depending on the subject and topic, recommendations can include formula revision, numerical problem solving, error analysis, worked examples, topic-specific restrictions, exam simulation, and other discipline-specific activities.

The implementation uses rule-based topic detection and predefined educational guidance. It does not retrieve official syllabuses or automatically verify every recommendation against a particular examination board's marking scheme.

### Capacity-Constrained Revision Timetable

The timetable generator distributes revision tasks across the available planning period while respecting a daily study-time limit.

The scheduling logic considers subject priority, revision status, task duration, remaining daily capacity, and the exam date. The planning horizon is capped at 30 days.

Tasks that cannot be accommodated are identified as unassigned rather than silently treated as scheduled.

### Subject Management

Users can add, edit, and manage subjects, including chapter counts, remaining chapters, priority, revision status, actual topics, and optional notes.

Topic normalization trims whitespace, removes duplicates, and rejects synthetic chapter labels such as automatically invented chapter placeholders.

### Dashboard and Daily Checklist

The dashboard summarizes study progress, pending work, completed tasks, and upcoming revision activities.

The checklist supports task completion, custom revision tasks, and progress tracking. Task durations are normalized to 15-minute increments with a minimum duration of 15 minutes.

### Browser Persistence and Demo Mode

The application stores planning data in browser `localStorage`, allowing users to retain their assessment inputs and revision progress in the same browser.

Demo Mode populates example data to make the application easier to demonstrate without manually entering a complete study plan.

A web app manifest and service worker provide basic progressive web app support and asset caching.

## 4. Application Workflow

The application follows this sequence:

1. **Capture inputs:** Enter the examination deadline, subject, topics, chapters remaining, preparation level, and daily study capacity.
2. **Estimate workload:** Calculate the estimated revision hours and compare them with the estimated available hours.
3. **Determine urgency:** Apply rule-based thresholds to classify the assessment as Safe, Risky, or Critical.
4. **Generate recommendations:** Select subject-specific study activities based on the recognized discipline and supplied topics.
5. **Allocate revision tasks:** Generate a timetable that respects the configured study capacity and prioritization rules.
6. **Track progress:** Use the dashboard and checklist to monitor completed and remaining work.
7. **Persist the session:** Save the current planning state locally in the browser.

**Workflow summary**

`User Inputs → Workload Assessment → Urgency Classification → Topic Recommendations → Timetable Allocation → Progress Tracking`

## 5. Technical Architecture

The project separates the user interface from the main calculation and scheduling logic.

| Module | Responsibility |
|---|---|
| `Home.tsx` | Main application interface, form state, navigation, and session coordination |
| `assessmentCalculator.ts` | Estimates required study time, available capacity, workload ratio, and urgency status |
| `recommendationEngine.ts` | Detects subject disciplines and creates topic-aware study recommendations |
| `actionPlanGenerator.ts` | Normalizes topics, resolves target topics, and generates personalized guidance |
| `timetableGenerator.ts` | Allocates revision tasks across days while respecting available study time |
| `DashboardOverview.tsx` | Displays progress, remaining tasks, and study summaries |
| `SubjectsManager.tsx` | Manages subjects, topics, priorities, and revision status |
| `RevisionTimetable.tsx` | Displays and manages the generated revision schedule |
| `DailyChecklist.tsx` | Supports daily task completion and custom study tasks |

The main application is built as a React and TypeScript single-page application. The current deployment uses a static build hosted through GitHub Pages.

## 6. Technology Stack and Tools

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Build and development | Vite, pnpm |
| Styling and UI | Tailwind CSS, Radix-based UI components |
| Icons | Lucide React |
| Forms and validation | React Hook Form, Zod |
| Date and time calculations | date-fns |
| State and persistence | React hooks, browser `localStorage` |
| Automated tests | Node.js built-in test runner and assertions |
| Type checking | TypeScript compiler |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |
| PWA fundamentals | Web app manifest, service worker |

No external database, authentication service, machine learning model, or generative AI API is required for the core planning workflow.

## 7. Engineering Skills Demonstrated

### Frontend Engineering
- Building component-based interfaces with React.
- Managing reactive application state and derived calculations.
- Implementing forms, input validation, and error handling.
- Designing responsive layouts and reusable UI components.
- Persisting client-side state across page reloads.

### TypeScript and Application Architecture
- Defining typed data models and interfaces.
- Separating interface code from assessment, recommendation, and scheduling logic.
- Applying deterministic rules and reusable functions.
- Normalizing and validating user-provided topic data.

### Algorithmic and Analytical Thinking
- Converting real-world constraints into calculation rules.
- Estimating required workload against available capacity.
- Implementing priority-based scheduling under time constraints.
- Handling edge cases, including invalid dates, empty topics, and unassigned tasks.
- Creating subject-specific recommendation branches with a general fallback.

### Quality Engineering and Deployment
- Writing automated acceptance and regression tests.
- Running static type checks.
- Building a production-ready static application.
- Automating verification and deployment through GitHub Actions.
- Publishing the application through GitHub Pages.

## 8. Industry Relevance and Potential Beneficiaries

**EdTech and digital learning:** The project demonstrates how educational workflows can be converted into an interactive planning tool using deterministic business rules.

**Students and independent learners:** It provides a structured way to review workload, organize revision, and track daily progress.

**Tutors and coaching programs:** The application could serve as a starting point for personalized revision planning and student progress reviews.

**Frontend and product engineering teams:** The code demonstrates component architecture, data modeling, validation, scheduling logic, state management, and a deployment workflow.

**Business and systems analysis:** The project also illustrates requirement translation, workflow design, constraint handling, edge-case management, and explainable decision rules.

These are potential applications rather than measured commercial outcomes. The project has not established that it improves examination scores or learning outcomes.

## 9. Limitations and Current Scope

A credible project should make clear what it does not yet solve.

1. **Heuristic assessment:** Required study hours are estimated using predefined preparation-level factors. The model does not measure an individual's actual learning speed, topic difficulty, or retention.
2. **Rule-based recommendations:** Topic recognition and recommendation selection use predefined rules and keyword matching. Unrecognized or ambiguous topics may receive general guidance.
3. **No external syllabus verification:** The application does not automatically retrieve official curricula, current exam papers, or authoritative marking schemes.
4. **Local-only persistence:** Session data is stored in the browser. There are no user accounts, cloud synchronization, or cross-device data recovery.
5. **Limited integrations:** External calendar synchronization, push notifications, learning management system integrations, and centralized reporting are not part of the current core implementation.
6. **Limited offline support:** The manifest and service worker provide basic PWA capabilities; they should not be interpreted as proof that every feature works fully offline.
7. **No demonstrated educational validation:** The rules and thresholds are engineering assumptions. They require evaluation with real students and educators before being treated as validated educational recommendations.
8. **Testing scope:** Automated tests cover application logic and acceptance scenarios. A passing test suite does not by itself establish complete browser compatibility, accessibility compliance, security assurance, or real-world effectiveness.

The project is a planning and productivity aid, not a substitute for a teacher, counselor, or official examination guidance.

## 10. Testing and Deployment

The GitHub Actions workflow is configured to run the following steps when changes are pushed to the `main` branch:

1. Install dependencies using pnpm.
2. Run the TypeScript type check.
3. Execute the automated test suite.
4. Build the production application.
5. Upload the static build and deploy it to GitHub Pages.

**Latest verified pipeline result available during project review:** The October 26, 2026 deployment completed successfully, with 78 tests passing and 0 failures, followed by a successful build and GitHub Pages deployment.

[View the GitHub Actions workflow runs](https://github.com/mrinmoycontent/panic-mode-app/actions)

These results describe that workflow run; they do not replace manual testing of the live application or prove that every user scenario has been validated.

## 11. Future Improvements

Potential next steps include:

- Add browser end-to-end tests for complete assessment and timetable workflows.
- Expand regression coverage for topic-specific recommendations and scheduling edge cases.
- Introduce optional authenticated cloud storage and session synchronization.
- Add calendar export and configurable reminder integrations.
- Evaluate workload thresholds with educators and real user feedback.
- Improve topic classification using structured curricula and clearly sourced educational content.
- Conduct accessibility, mobile-browser compatibility, and performance audits.
- Introduce privacy-conscious usage analytics only with appropriate consent and data protection.

## 12. Interview Discussion Points

When presenting this project, focus on the engineering decisions rather than describing it only as a study planner.

**Problem solving:** I translated exam deadlines, preparation levels, chapter counts, and daily study limits into a deterministic assessment and planning workflow.

**Architecture:** I separated assessment calculations, recommendation rules, timetable generation, and UI components so each concern can be understood and tested independently.

**Edge cases:** I accounted for invalid or past exam dates, empty or duplicate topics, synthetic chapter labels, limited daily capacity, and work that cannot be scheduled.

**Trade-offs:** I chose a rule-based, client-side implementation to keep the core workflow simple and inexpensive to host. This avoids dependence on a paid AI API, but it limits personalization, external knowledge retrieval, and cross-device persistence.

**Quality assurance:** I configured type checking, automated tests, a production build, and GitHub Actions deployment. I distinguish successful pipeline execution from manual verification of the complete user experience.

### Interview Summary

Panic Mode is a React and TypeScript-based exam revision planner that I developed to convert exam deadlines and remaining syllabus into an estimated urgency status, topic-aware revision recommendations, and a capacity-constrained timetable. The project demonstrates frontend engineering, rule-based application logic, data validation, scheduling under constraints, automated testing, and CI/CD deployment. Its current limitations include heuristic workload estimates, browser-only persistence, and the absence of validated educational outcome data.

## Project Links

- **Live application:** https://mrinmoycontent.github.io/panic-mode-app/
- **Source code:** https://github.com/mrinmoycontent/panic-mode-app
