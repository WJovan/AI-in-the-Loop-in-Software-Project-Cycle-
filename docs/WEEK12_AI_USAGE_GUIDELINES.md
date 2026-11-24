# Group 09 — Updated AI Usage Guidelines (Week 12)

**Project:** AI Boundary Board  
**Updated:** 2026-11-24 (proposed; subject to team review and merge)  
**Evidence:** Peer feedback recorded in [Issue #9](https://github.com/WJovan/AI-in-the-Loop-in-Software-Project-Cycle-/issues/9) and the team's experience with [prototype PR #7](https://github.com/WJovan/AI-in-the-Loop-in-Software-Project-Cycle-/pull/7).

These rules apply to **AI-assisted development** of this project (for example using a chatbot to draft code). The current prototype itself uses rule-based comparison and does not yet call a generative AI model.

## 1. Make AI assistance checkable in every PR

Each PR must say whether an AI tool was used. If yes, the author must identify the **tool/model**, the **files or functions it helped create**, a short **summary of the instruction**, and **what was changed or retained afterward**. The PR must include the actual checks run (for example unit tests, build, and manual test scenarios); unperformed checks must not be marked done.

**How the steward verifies this:** Read the PR's 'AI assistance' and 'How I checked it' sections, compare them with the changed files, and ask the author to explain any unclear AI-generated part.

## 2. Require a meaningful non-author review before merge

For any AI-assisted code PR, a teammate other than the author must inspect the diff, leave at least one concrete comment on the actual code or behavior, and formally approve before merging. The author must answer substantive questions and address necessary changes. Passing unit tests alone does not replace review.

**How the steward verifies this:** Check the PR 'Files changed' and 'Conversation' tabs for a specific comment and a submitted approval **before** the merge event.

## 3. Record significant AI-assisted design decisions

When AI output influences a substantial design choice (scope, architecture, safety boundary, or evaluation criteria), the PR must link a dated `DECISIONS.md` entry that identifies the **choice**, **reason**, **alternative considered**, and **human decision lead**. AI advice does not automatically become a project decision.

**How the steward verifies this:** Open the linked entry and confirm that it explains why the team kept or rejected the AI suggestion.

## Related scope note

AI Boundary Board currently compares people's choices using application logic. A future recommendation model may suggest possible restrictions, but users must approve the final agreement. Do not claim that model-generated recommendations or prompt tests exist until actually implemented and tested.
