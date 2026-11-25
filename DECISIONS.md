# Project Decisions

## Decision 001: Initial Project Direction

Date: 23/10/2026

Decision:
Develop AI Boundary Board, a collaborative tool
for discussing AI usage in group assignments.

Reason:
Students may have different preferences about
when AI should or should not be used.
We want to investigate whether a shared
decision-making workflow can help.

Alternatives considered:
- General group chat
- Shared Google document

Status:  Accepted

Current code steward: **Kimi Jenson Tjan (曾健倫) is the initial code steward for the team.**

## Decision 002: Optional AI discussion suggestions

Date: 23/11/2026

Decision:
Add optional, per-activity AI suggestions to Compare after both members have answered. Preserve rule-based comparison and human control of the final agreement.

Reason:
Comparing categories alone does not interpret members' reasons or help write concrete conditions. AI can summarize stated concerns, offer alternatives, and provide general suggestion when reasons are missing. Suggestions require an explicit action to become an editable proposed policy.

Implementation:
Use the existing Vite server/preview middleware and native fetch with Claude Messages, OpenAI Responses, or Gemini generateContent and structured JSON output. Select the first non-empty server-side API key in the user-requested order: Claude, GPT, Gemini. Show errors from the selected provider without automatically sending the activity to another provider. Keep a shared response format and validation, adapting Claude's schema to its supported constraints.
