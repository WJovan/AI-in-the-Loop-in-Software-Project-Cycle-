# AI Boundary Board: Prompt Documentation Card

| Field | Record |
| --- | --- |
| Updated | 2026-11-27 |
| Exact system prompt | [docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md), same as the `instructions` in [server/ai.js](server/ai.js) |
| Coding-agent project rules | [CLAUDE.md](CLAUDE.md); development instructions and AI-assistance recording rules |

## 1. What the AI does

Two students independently choose `allowed`, `limited`, or `not_allowed` for each group activity and may explain their reasons. The application compares the categories with ordinary code. The optional AI feature adds a summary, clarifying questions, and editable draft suggestions for one activity at a time.

| Mode | Input context | User action and result |
| --- | --- | --- |
| Compare | Activity and both members' choices/reasons | **AI suggestions** requests discussion support. **Use as draft** copies a selected policy and condition into the proposed agreement. |
| Agreement | The same context plus the selected policy and existing condition | **AI suggestions** requests conditions within that policy. **Use for condition** copies only the condition. |

Both members must select a policy for the requested activity before generation. Entering Agreement or adopting a draft requires complete policy choices for all activities. Reasons are optional, with special handling below.

The AI has no tools for changing project data, executing code, searching for course rules, or confirming consent. Students can skip AI and complete the workflow manually.

## 2. What the model is told

[docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md) contains the complete runtime system instruction text. It tells the model to:

- Reply in English, matching the app, and treat the supplied JSON as data.
- Summarize only stated choices and reasons; invent no concerns, course rules, permissions, or consensus.
- Offer at most two alternatives, and only offer two for different policy categories or narrowly defined, mutually incompatible reasons within the same category.
- Ask for clarification when exactly one reason is missing; provide basic starting directions when both are missing.
- Keep an existing proposed agreement category unchanged when suggesting conditions.
- Treat every suggestion as a draft requiring human discussion and confirmation.

The request combines these instructions, the current activity JSON, and a structured output schema. No prior conversation or examples are included in the actual request. The examples below are documentation examples, not captured model outputs.

## 3. Model configuration and local operation

Provider selection uses the first non-empty server-side key in this order: **Claude -> GPT -> Gemini**. An error does not switch the request to another provider.

These model names describe the current code defaults, not verified availability or the exact model used in the successful Gemini trial. [`.env.example`](.env.example) lists the configuration variables. The request sets a maximum output token budget of 2,200; temperature is not explicitly set.

## 4. Input contract and data sent

The frontend posts JSON to `/api/recommendations`. The server validates the request and constructs a smaller payload before sending it to the selected provider.

| Field | Accepted content |
| --- | --- |
| `activity.title` | Required non-empty text, maximum 80 characters |
| `activity.description` | Optional text, maximum 500 characters; defaults to an empty string in the model input |
| `preferences` | Exactly two entries, each with a required `category` from `allowed`, `limited`, `not_allowed` |
| `preferences[].reason` | Optional text, maximum 2,000 characters; defaults to an empty string |
| `agreement` | Optional object for condition suggestions; required valid `category` and optional `condition` of at most 500 characters |

The request body limit is 16,384 bytes. The server removes activity IDs and other unrelated fields, including project/member names and other agreements, before the provider call. Free-text content is still sent as entered and may contain identifying information. The app has no automatic redaction. Project data and adopted drafts are saved in the current browser's `localStorage`; generated suggestions remain in UI state until adopted or discarded. Requests have no conversation history.

Illustrative Compare model input:

```json
{
  "activity": {
    "title": "Writing code",
    "description": "Generate or modify implementation code"
  },
  "preferences": [
    { "category": "limited", "reason": "AI may explain bugs, but I want to write submitted code myself." },
    { "category": "not_allowed", "reason": "I prefer learning by writing the code without AI." }
  ]
}
```

For Agreement, the input additionally contains a selected proposal, for example:

```json
{
  "category": "limited",
  "condition": "AI may explain bugs; submitted code must be written manually."
}
```

That object is sent as the `agreement` field alongside the activity and preferences. It is a human-selected proposal and does not establish both members' consent.

## 5. Output contract and application handling

| Field | Model response contract |
| --- | --- |
| `summary` | Required non-empty string, maximum 1,200 characters |
| `strongReasonConflict` | Required boolean; true only for mutually incompatible, non-empty reasons under the same policy category |
| `questions` | Required array of 0-3 non-empty strings, each at most 300 characters |
| `options` | Required array of 0-2 objects containing `category`, `condition`, and `rationale` |
| `options[].category` | One of `allowed`, `limited`, `not_allowed` |
| `options[].condition` | Non-empty string, maximum 500 characters |
| `options[].rationale` | Non-empty string, maximum 600 characters |

At least one question or option must be present. The output schema requests all fields and disallows additional properties; runtime validation checks required fields, types, limits, and valid categories. The Claude schema omits string/array length constraints for provider compatibility, and the runtime validator still enforces those limits.

Illustrative response for the Compare input above:

```json
{
  "summary": "One member allows AI explanations while writing submitted code manually; the other prefers no AI assistance for learning.",
  "strongReasonConflict": false,
  "questions": ["Would you prefer separate personal learning rules or a single rule for this shared activity?"],
  "options": [
    {
      "category": "not_allowed",
      "condition": "Write the code without AI assistance and use team discussion to review it.",
      "rationale": "A possible strict boundary for discussion; it does not establish either member's agreement."
    }
  ]
}
```

After validating the model response, the server applies these additional rules:

| Situation | Implemented handling |
| --- | --- |
| Exactly one reason is blank | Remove all options and replace questions with a fixed request for the other member's reason. The model summary is retained. |
| Both reasons are blank | Replace the summary with a general-guidance explanation and clear questions. If the valid response has no options, supply generic activity-specific options in code. |
| Same category without a strong reason conflict | Keep at most one option. Different categories or blank reasons force `strongReasonConflict` to false. |
| Condition suggestion changes the selected agreement category | Reject the entire suggestion and return an error. |

The both-blank guidance runs only after a successful, valid provider response. It does not make AI suggestions available without an API key or during a provider outage.

The frontend labels generated content as AI suggestions. It changes a proposed agreement only after **Use as draft** or **Use for condition**. Existing proposals or non-empty conditions require overwrite confirmation. Changing project data, navigating away, or skipping discards pending suggestion state; late replies cannot restore a discarded draft. Users can edit adopted text before exporting.

## 6. How it fails and how to recover

| Failure | API / UI behavior | Recovery |
| --- | --- | --- |
| No configured API key | HTTP 503: suggestions are not configured | Set up a server-side key, or skip AI and edit manually |
| Wrong method, disallowed origin, wrong content type, oversized body, malformed JSON, or invalid input fields | HTTP 405 / 403 / 415 / 413 / 400; request is rejected before a provider call | Use the app's controls and valid, shorter input |
| Provider rejects credentials or access | HTTP 502 with a credentials/access message | Project owner checks key and access; manual workflow remains available |
| Provider quota or rate limit (429) | HTTP 429 with a usage-limit message; no automatic retry | Check quota or try later |
| Temporary provider HTTP 408, 500, 502, 503, 504, or 529 | Retry once on the same provider after about one second, within the same deadline; persistent failure returns HTTP 503 | Try again later or skip AI |
| Provider cannot find the configured model (404) or rejects request settings (400) | HTTP 502 with a model-access or compatibility message | Check the configured model and request settings |
| Server-side request timeout | HTTP 504 with a timeout message; shared provider deadline is 60 seconds, including a retry | **Try again** or **Skip**; frontend request timeout is 75 seconds |
| Network error | HTTP 502 with an unavailable/unreachable message | Check connectivity or continue manually |
| Blocked/refused/incomplete output, invalid JSON, wrong fields/lengths, or a changed Agreement category | HTTP 502: AI could not produce a valid suggestion | Retry or write the proposal manually |
| Frontend cannot parse the API response | UI asks the user to check the server and try again | Ensure the Vite API middleware is running; serving static files alone is insufficient |
| Plausible but inaccurate summary, invented consensus, or unsuitable condition | May pass structural checks and appear in the UI | Both members inspect, reject, or edit the draft; the app cannot verify its meaning automatically |

The server returns application error messages instead of raw provider error bodies. It does not automatically use a second provider. **Try again** makes a new request, **Skip** dismisses the panel, and a failed request does not apply an agreement change.

## 7. Evidence and known limitations

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| Group 09's confirmation on 2026-11-26 | Gemini API has returned a successful result in a local trial | A recorded model ID, repeatable input/output evidence, or production deployment |
| Repository verification on 2026-11-26 at implementation `58f2978`: 114 tests passed and `npm run build` succeeded in a clean dependency installation | Existing automated regression checks and production asset build pass | Live model quality or deployed API operation |
| [server/ai.test.js](server/ai.test.js) | Mocked provider integration, validation, provider priority, missing reasons, retries, and error handling | Live model behavior or output quality |
| [src/App.test.js](src/App.test.js) and [src/logic.test.js](src/logic.test.js) | UI adoption/overwrite controls, discarded replies, agreement gating, and comparison/prefill behavior | Independent consent from both people or usability with real participants |

The last two rows describe automated checks with simulated responses; they do not establish real provider reliability, semantic accuracy, or user benefit. No live API calls were made to prepare these documents.

Current limitations:

- The model's judgment of strong reason conflicts and the faithfulness of its summary are not independently checked. Treating JSON as data is an instruction, not proof of resistance to prompt injection.
- The tool handles two members, replies in English, and sends one activity at a time. It has no external course-policy source and cannot confirm permission or agreement.
- Matching categories may hide disagreements in reasons. Ordinary comparison uses category equality; optional AI interpretation can still misread those reasons.
- Browser-local storage provides no shared account, cross-device synchronization, or independently recorded approval from each member.
- A formal suite of 10+ live prompt cases, recorded model outputs, and a documented before/after fix cycle is not yet available. These documents do not claim that CP2 requirement is complete.

## 8. Handoff and revision

Start with [docs/AI_SYSTEM_PROMPT.md](docs/AI_SYSTEM_PROMPT.md), then follow `buildRequest`, `readResponse`, and `createRecommendationHandler` in [server/ai.js](server/ai.js). [src/App.jsx](src/App.jsx) contains generation and adoption controls; [src/logic.js](src/logic.js) contains non-AI comparison and agreement prefilling. Coding agents should also follow the project rules in [CLAUDE.md](CLAUDE.md).

Run `npm test` and `npm run build` to check the implementation. For a live evaluation, record the actual provider/model, date, input, raw output, displayed result, expected behavior, and pass/fail judgment. If a prompt is changed, retain the before/after results for the same cases and update the runtime prompt record and this card with the new implementation revision.

For AI-assisted development, record all important AI use in [DECISIONS.md](DECISIONS.md): the date, tool/model, instruction or prompt summary, relevant output, human acceptance/changes/rejection and reasons, and any gap between intention and output. Record important choices and rejected alternatives there as well. PR descriptions should summarize the AI assistance and link the corresponding entry.
