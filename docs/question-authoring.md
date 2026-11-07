# Question authoring guide

## Product principle

Write a practical rules puzzle, not a trivia question. The player should reason from a clearly described game state and determine what happens.

## Required fields

See `question-schema.json` and `content/questions/batch-001.json` for the canonical shape.

Every question must include:
- Stable unique ID (`rules-###` or another documented prefix).
- Category and difficulty.
- Format assumptions (two-player, Commander, multiplayer, tournament REL, etc.).
- Complete scenario description.
- One unambiguous prompt.
- At least two distinct answer choices.
- Exactly one correct answer.
- Explanation that walks through the relevant sequence.
- Specific rules references and the rules-document version.
- Editorial status and rules-verification status.

## Rules accuracy

1. Identify the exact game state and all relevant assumptions.
2. Work through the timing in order: action, priority, resolution, state-based actions, triggers, and priority as applicable.
3. Check the current Comprehensive Rules and official policy documents.
4. Make sure each cited rule actually supports the statement.
5. Explain why the correct answer is correct and why plausible alternatives are wrong.
6. Distinguish colloquial language from rules terminology. For example, a spell whose targets are all illegal doesn't resolve under CR 608.2b. Players often call this "fizzling"; do not casually describe it as being countered by a counterspell.
7. If the answer depends on a disputed interpretation, omitted assumption, or complicated interaction, set `review.rules` to `needs_expert`. Do not publish it as verified.

## Question quality

Prefer:
- Scenarios based on common gameplay situations.
- Short setups with enough detail to establish the game state.
- Distractors based on plausible misconceptions.
- Explanations that teach one main concept.
- A range of formats and rules topics.

Avoid:
- Gotchas based on missing information.
- Questions requiring players to memorize obscure card text.
- Multiple answers that are technically equivalent.
- Ambiguous pronouns or unclear ownership/controller references.
- Unnecessary card images or copied card text.
- Questions where the answer changes with an unstated format or tournament policy assumption.

## Status lifecycle

- `draft`: generated or authored, not yet reviewed.
- `editorial_review`: wording and player experience need review.
- `rules_review`: technical rules check is outstanding.
- `correction_needed`: a specific issue must be fixed.
- `approved`: editorially approved and rules verified.
- `rejected`: not suitable for the game.

The daily game only selects questions with both `status: "approved"` and `review.rules: "verified"`.

## Batch generation prompt

Use this as a starting prompt when asking an assistant to create a batch:

> Create 5 candidate Rules Lawyer daily Magic rules puzzles. Read the Rules Lawyer question-authoring guide and match its JSON schema exactly. Focus on [TOPICS]. Avoid duplicating these existing IDs/topics: [PASTE COVERAGE SUMMARY]. Use current official rules sources, cite exact rule numbers, and state the Comprehensive Rules version. Do not invent citations. If you cannot verify a ruling, mark `review.rules` as `needs_expert` and explain the uncertainty in `review.notes`. Return valid JSON only, with a top-level `questions` array. Do not mark a question approved merely because you generated it. Include a concise editorial intent and review focus for each question.

AI-generated content is a proposal, not a source of truth. An independent rules check is required before publication.
