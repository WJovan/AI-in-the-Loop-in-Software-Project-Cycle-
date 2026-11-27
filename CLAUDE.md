# AI Boundary Board: Project Rules for Coding Agents

**Owner:** Group 09  
**Updated:** 2026-11-26

These are project instructions for an AI agent helping develop this repository. Follow them when implementing, reviewing, testing, or documenting changes.

## Project context

AI Boundary Board helps two students compare their AI-use preferences, discuss differences, and record a proposed agreement. The frontend uses React and Vite. [server/ai.js](server/ai.js) provides an optional AI recommendation endpoint through Vite middleware.

Read [README.md](README.md) for the project and AI usage guidelines, and [DECISIONS.md](DECISIONS.md) for accepted decisions. The product's exact runtime instructions are documented in [docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md), with its behavior and failures described in [PROMPT_CARD.md](PROMPT_CARD.md).

## Commands and verification

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the dependencies from the lockfile |
| `npm run dev` | Start the local app and AI API middleware |
| `npm test` | Run the logic, UI, and mocked provider regression checks |
| `npm run build` | Build the production frontend assets |
| `npm run preview` | Preview a completed build with the API middleware |

- After each completed change, run `npm test`. Before handing off changes, also run `npm run build`.
- **Ask the user before modifying existing tests.** This includes changing assertions, fixtures, expected results, skipping tests, or removing tests. Complete other work in the same question while awaiting an answer; leave dependent test changes pending until explicitly approve.
- Always investigate failures before proposing any fix. Do not weaken tests to make a change pass.
- If checks are blocked by dependencies, permissions, networking, or configuration, state the exact limitation and what was actually checked. A clean temporary copy may be used for verification; identify that environment in the handoff.
- Distinguish automated tests with simulated provider responses from live model evaluation. Report only checks that were actually performed.

## Implementation boundaries

- Preserve human control over final agreements. AI output is only a draft that require human verify; generating a suggestion must not silently accept it or imply both members consented.
- Always keep rule-based comparison and manual agreement editing usable, since the AI function may be unavailable. Preserve explicit adoption and overwrite confirmation.
- Keep API keys on the server in environment variables. Use [`.env.example`](.env.example) to document configuration without adding actual key values.
- Preserve the documented model provider order, and input/output contract unless it was asked to change explicitly. Update the relevant documentation when behavior changes.
- Read and understand generated code before keeping it. Keep changes focused, explain their purpose, and preserve unrelated user edits.

## Record meaningful AI assistance

Record all important AI assistance in [DECISIONS.md](DECISIONS.md), including interactions that generate retained code/text, materially affect an implementation or design, solve a significant problem, or influence a decision.

Each entry should identify its date, tool/model, related change, and these four parts:

1. **What we asked the AI to do:** include the prompt or an accurate summary with relevant context in the entry.
2. **What the AI produced:** describe the relevant output and include important excerpts or references to the affected files.
3. **What we accepted, modified, or rejected, and why:** describe the human review and resulting changes.
4. **The gap between intention and output:** record mistakes, omissions, unexpected behavior, and remaining uncertainty.

Do not invent a transcript, model name, human review, test result, or past activity. Mark unavailable information honestly. Minor lookups follow the scope of the AI usage guidelines in README.

## PR descriptions and important decisions

- A PR should explain what changed and why, identify the AI tool/model and generated files or functions when AI was used, and give a one-sentence summary of the instruction. Link the corresponding [DECISIONS.md](DECISIONS.md) entry; keep long prompts and supporting AI-use details in that entry.
- Describe what humans changed afterward, the checks actually run and their results, and relevant risks or alternatives. Include a meaningful non-author review before merging AI-generated code, following the team's human-review guidelines.
- Record significant choices in [DECISIONS.md](DECISIONS.md): the decision, reason, rejected alternatives, date, human lead, and related PR where available. A prompt transcript is not a substitute for explaining a decision.

## Maintain product prompt documentation

The executable runtime prompt remains the `instructions` string in [server/ai.js](server/ai.js). When changing the prompt, schema, or response handling, update [docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md) and [PROMPT_CARD.md](PROMPT_CARD.md) together. Obtain approval before modifying existing tests under the rule above.

Record real before/after outputs for prompt revisions when evaluated. Keep configured model defaults separate from models actually verified in a live trial. A successful build or mocked test run does not establish live output quality, deployment, or a completed prompt evaluation suite.
