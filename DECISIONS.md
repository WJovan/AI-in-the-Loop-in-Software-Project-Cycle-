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

## Decision 003: Handle temporary AI service failures

Date: 24/11/2026

Decision:
Retry temporary upstream HTTP errors once on the selected provider within a shared 60-second deadline. Keep an additional 15 seconds on the browser and distinguish service overload from rejected requests, inaccessible models and credentials.

Reason:
A live request using the configured Gemini key returned HTTP 503 / UNAVAILABLE with a high-demand message, while model metadata requests succeeded. The previous generic error incorrectly suggested checking the model. Browser verification also reproduced a timeout with the 60-second limit, so provider availability remains an external limitation.

Validation:
84 tests and the client build passed, including retry recovery, persistent overload, provider priority and private-key protection. Computer-use verification exercised the real Gemini request; no successful live recommendation is claimed. A private key found in `.env.example` was cleared while preserving `.env`.

AI involvement:
OpenAI Codex (GPT-6) diagnosed the reported failures and assisted with the bounded retry, shared timeout, error messages and regression tests.

Status: Implemented; pending human review.

## Decision 004: Use a verified Gemini model for the prototype

Date: 24/11/2026

Decision:
Change the Gemini default and the local `.env` model setting from `gemini-3.8-flash` to `gemini-3.5-flash-lite`. Preserve private keys, provider priority and the existing request/response workflow.

Reason:
The former model repeatedly returned service-overload errors or timed out. A live request using the same Gemini key and the complete recommendation schema succeeded on `gemini-3.5-flash-lite`, returning HTTP 200 and two validated alternatives in approximately 4.3 seconds. This is a working configuration at the time of testing, not a guarantee of future provider availability.

AI involvement:
OpenAI Codex (GPT-6) verified the available models, tested the alternative and updated the model setting, matching default, example, instructions and existing request test. Runtime verification uses the WSL environment serving the project.

Validation:
84 tests, the client build and the client key-exposure check passed in WSL. The live website on port 5173 displayed two generated recommendation drafts after one upstream 503 was retried successfully. The original WSL development service was restored with the new model, and temporary request tracing was removed. Linux dependencies were repaired without changing the package lockfile.

Status: Implemented; pending human review.

## Decision 005: AI suggestions for agreement conditions

Date: 24/11/2026

Decision:
Add optional AI suggestions beside Agreement's Conditions or restrictions field, using the existing provider selection, API and suggestion panel. Require a selected policy and send its category and current condition as context. Apply only the condition after an explicit action; replacing existing text requires confirmation.

Reason:
Members can ask for concrete restrictions while editing their proposed agreement. The selected category stays under human control. The API rejects suggested alternatives that change the supplied category, and editing a proposal clears outdated suggestions.

AI involvement:
OpenAI Codex (GPT-6) assisted with the shared panel, condition context and validation, regression tests and instructions. No new dependencies or API key settings were added.

Validation:
100 tests and the client build passed in WSL. A live Gemini request returned two conditions matching the supplied Allowed policy. An isolated browser test using a mock provider verified selecting a policy, showing inline suggestions and filling only the condition field. The existing port 5173 site serves the updated interface and API; private keys remain absent from the client build.

Status: Implemented; pending human review.

## Decision 006: Give general guidance when both reasons are blank

Date: 24/11/2026

Decision:
When both members select policies but leave their reasons blank, use the activity context to provide basic starting directions instead of reporting that preferences are missing. Keep clarification-only responses when exactly one member's reason is blank. Provide a local fallback if the configured model still returns only a missing-preferences question.

Reason:
Two blank optional reason fields still contain enough context for a useful general suggestion. For Debugging, the fallback directs the team toward finding potential issues or understanding code behavior while respecting the selected policy categories.

AI involvement:
OpenAI Codex (GPT-5.6) assisted with the prompt, fallback behavior, regression tests and documentation.

Validation:
104 tests and the client build passed in WSL. Provider-specific regression tests verify that two blank reasons produce Debugging guidance about potential issues or code behavior, while one blank reason still produces clarification questions without an adoptable draft.

Status: Implemented; pending human review.

## Decision 007: Restrict when AI may offer two directions

Date: 24/11/2026

Decision:
Return one main direction by default. Allow two alternatives only when members select different policy categories, or when both non-empty reasons describe mutually incompatible AI-use boundaries despite the same category. Treat differences in wording, examples, priorities or risk emphasis as one direction. Enforce the limit on the server after validating the model response.

Reason:
Multiple drafts add noise when members already agree on the policy or express compatible concerns. Two directions are useful only when the team must choose between meaningfully different boundaries.

AI involvement:
OpenAI Codex (GPT-5.6) assisted with the structured conflict signal, server-side enforcement, regression tests and documentation.

Validation:
109 tests and the client build passed in WSL. Regression tests cover compatible same-policy reasons, strongly conflicting same-policy boundaries, different policies, and blank reasons. The server reduces extra model output to one direction whenever the stricter conditions are not met.

Status: Implemented; pending human review.

