# Group 09 — Updated AI Usage Guidelines (Week 12)

**Project:** AI Boundary Board  
**Updated:** 2026-11-28 (revised following PR #14 review feedback)
**Evidence:** Peer feedback recorded in [Issue #9](https://github.com/WJovan/AI-in-the-Loop-in-Software-Project-Cycle-/issues/9) and the team's experience with [prototype PR #7](https://github.com/WJovan/AI-in-the-Loop-in-Software-Project-Cycle-/pull/7).

These rules apply to **AI-assisted development** of this project
(for example, using a chatbot to draft code).

AI Boundary Board initially used rule-based logic to compare
students' preferences. For CP2, optional AI-assisted boundary
suggestions were added through PR #16.

The AI suggestions depend on an available AI provider.
The final agreement remains a human decision.

## 1. Make AI assistance checkable in every PR

Each PR must say whether an AI tool was used. If yes, the author must identify the **tool/model**, the **files or functions it helped create**, a short **summary of the instruction**, and **what was changed or retained afterward**. The PR must include the actual checks run (for example unit tests, build, and manual test scenarios); unperformed checks must not be marked done.

**How the steward verifies this:** Read the PR's 'AI assistance' and 'How I checked it' sections, compare them with the changed files, and ask the author to explain any unclear AI-generated part.

## 2. Require a meaningful non-author review before merge

Every pull request, including code and documentation changes, must be reviewed by another team member before merging.

The reviewer must inspect the changes, leave at least one meaningful comment, and submit a formal approval.

The author must respond to important review comments and address required changes before merging.

The code steward verifies that the review process has been completed.

## 3. Record significant AI-assisted design decisions

When AI output influences a substantial design choice (scope, architecture, safety boundary, or evaluation criteria), the PR must link a dated `DECISIONS.md` entry that identifies the **choice**, **reason**, **alternative considered**, and **human decision lead**. AI advice does not automatically become a project decision.

**How the steward verifies this:** Open the linked entry and confirm that it explains why the team kept or rejected the AI suggestion.

## Related scope note

AI Boundary Board originally used rule-based logic to compare users' preferences.

Optional AI-assisted boundary suggestions were implemented through PR #16.

The AI feature can suggest possible restrictions based on users' preferences, but users remain responsible for the final agreement.

AI suggestions must be reviewed by users before acceptance. The application should still support manual decision-making when AI suggestions are unavailable.