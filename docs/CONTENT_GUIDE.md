# Content guide

How problems and lessons are written, tested and reviewed. Read this before copying a template.

- Problem template: [`content/problems/_template/`](../content/problems/_template/) (a complete example, "Quiet Hours")
- Problem schema: [`content/problems/meta.schema.json`](../content/problems/meta.schema.json)
- Lesson template: [`content/learn/_template.mdx`](../content/learn/_template.mdx)
- Targets per week: [BUILD_GUIDE.md, Content track](./BUILD_GUIDE.md#content-track)

## Ground rules

1. **Playable problems are Algogym originals** ([DECISIONS.md](./DECISIONS.md)). Never copy or paraphrase a statement, example or test from LeetCode, GFG or any other site. Writing an original that practises the same idea is fine. List that problem in `similar_to`.
2. **Every claim is tested.** Each example in the statement is a public test, and every reference solution passes every test in all 4 languages.
3. **Two people per item.** The author can't be the reviewer. Nothing reaches `ready` without a reviewer in `reviewers`.
4. **Quality over volume.** If a week's target is at risk, ship fewer problems rather than weaker ones.

## Status workflow

`draft` → `review` → `ready`. Only `ready` items are seeded. `example` marks format samples (the templates) and is never seeded. Folders and files starting with `_` are skipped too.

## Problems

### Folder layout

```
content/problems/<slug>/
├─ meta.json            # schema: content/problems/meta.schema.json
├─ statement.md         # description + "## Constraints"; no examples (they come from tests/public)
├─ hints.md             # numbered list, 2–4 hints, each one step closer
├─ editorial.md         # approach, complexity table, common mistakes
├─ tests/
│  ├─ public/NN.in, NN.out, NN.explain.md (optional)   # 2–3 cases, shown as examples
│  └─ hidden/NN.in, NN.out                             # at least 10 cases
└─ solutions/solution.js, solution.py, solution.cpp, Solution.java
```

The slug is lowercase-hyphenated, matches the folder name, and becomes `/problems/<slug>`.

### Signature and test format

`meta.json` declares one function: `signature.function` (camelCase, the same name in every language), typed `params`, and a `returns` type. Allowed types: `int`, `long`, `double`, `bool`, `string`, and arrays of these (`int[]`, `int[][]`, `string[][]` and so on, as listed in the schema).

Tests are plain JSON:

- `NN.in` is the **argument list** as one JSON array, e.g. `[[3, 1, 4], 4]` for `(levels, limit)`.
- `NN.out` is the **return value** as JSON, e.g. `4`.

No number in a test may exceed ±2^53, the limit for exact JavaScript numbers. `comparator` decides how outputs are compared: `exact` (default), `float_tolerance` (1e-6), or `unordered` (when the answer may come in any order).

### Solutions

| Language | File | Shape |
| --- | --- | --- |
| JavaScript | `solution.js` | `function <name>(...)` |
| Python | `solution.py` | `class Solution` with method `<name>(self, ...)` |
| C++ | `solution.cpp` | `class Solution` with public method `<name>(...)`, arrays as `vector<T>&` |
| Java | `Solution.java` | `class Solution` with public method `<name>(...)` |

Use only the standard library. Reference solutions are the editorial's approach, written clearly; they are what Pro users see.

### Starter code and harness: generated

The starter stub and the hidden driver for each language are **generated from `meta.json`'s signature** (M5), following the judge contract in [SYSTEM_ARCHITECTURE.md §4.2](./SYSTEM_ARCHITECTURE.md#42-code-harness). A problem that needs something unusual can add `starter/` or `harness/` overrides. This replaces hand-writing 8 files per problem (approved, see DECISIONS.md).

- Generator: `packages/judge/src/generate.mjs`. Overrides use the solution file names in `starter/` (`solution.js`, `solution.py`, `solution.cpp`, `Solution.java`) and `harness.js`, `harness.py`, `harness.cpp` and `Main.java` in `harness/`. A harness override must keep the `__AG_USER_CODE__`, `__AG_NONCE__` and `__AG_BUDGET_MS__` markers.
- C++ code is compiled with `#include <bits/stdc++.h>` and `using namespace std;` already in place, and Python with `from typing import *`.

### Generated max-size tests

Large inputs can come from a seeded generator instead of hand-made files. Add `tests/gen.mjs` (see `_template/tests/gen.mjs`): it exports a `seed` and a default function that returns a list of argument lists, built with the helpers in `packages/judge/src/gen.mjs` (`int`, `arr`, `word`, `words`, `pick`, `sorted`). `npm run content:gen -- <folder>` writes them as `tests/hidden/g01.in`, `g02.in`, … with outputs from the JavaScript reference solution. Commit the generated files. The validator fails if they don't match `gen.mjs`.

### Validate before review

`npm run content:validate` (or `npm run content:validate -- <folder>`) checks a problem the way CI does:

- `meta.json` matches the schema.
- Statement, hints, editorial and all 4 solutions exist.
- There are 2–3 public tests and at least 10 hidden ones.
- Every test value fits its declared type (an `int` must fit in 32 bits).
- Generated tests are up to date.
- In all 4 languages, the starter compiles and the reference solution passes every test.

It warns when a reference solution has less than 3× margin under `time_ms_per_case`. It needs Node, Python 3 (`py` on Windows, `python3` elsewhere, or set `AG_PYTHON`), g++ and a JDK on `PATH`.

### Tests checklist

- [ ] 2–3 public tests that teach: a normal case, plus one that shows a rule from the statement
- [ ] At least 10 hidden tests, including: the smallest input, the largest input at the constraint limits (to catch slow solutions), all-equal values, no valid answer (when that's possible), and the boundary of every condition (e.g. a value exactly equal to `limit`)
- [ ] At least one hidden test that a common wrong approach fails. Name it in the editorial's "Common mistakes"
- [ ] `limits.time_ms_per_case` lets the reference solutions pass with ~3× margin, and a clearly worse complexity time out

### Statement style

- The first sentence sets up a concrete situation; the second states the task. Use the parameter names from the signature in `code`.
- Use "Return …", not "Print …"; the harness handles I/O.
- `## Constraints` lists every bound the tests rely on, written as `1 ≤ n ≤ 10^5`.
- Indian English spelling (*practise* the verb, *practice* the noun). No company names in statements.

## Lessons

One MDX file per roadmap topic: `content/learn/<track>/<topic>.mdx`, copied from the template. The section order is fixed: The idea → Intuition → Step through it → Worked example → Code → Complexity → Common mistakes. The quiz (exactly 3 questions) and the "Practice this" list live in the frontmatter.

- Quote free-text frontmatter values (`summary`, `question`, `why`) in single quotes, writing `''` for an apostrophe. An unquoted value containing `: ` is invalid YAML.
- Aim for a 10-minute read. Cut anything that doesn't help someone solve the topic's first problem.
- Code in all 4 languages implements the same algorithm with the same variable names as the editorials.
- `practice` lists `ready` problem slugs, easiest first.
- Diagrams go in `apps/web/public/learn/<track>/<topic>/` as **SVG** (dark theme, DESIGN.md tokens, system fonts), with alt text that describes what the picture shows. Use WebP only for screenshots or photos. The C2 diagrams are generated by `scripts/content/build-figures-c2.mjs`.
- The `<Figure>`, `<StepThrough>`, `<CodeTabs>` and `<Callout>` components are built in M14; until then, write them as in the template.

## Review checklist (reviewer)

- [ ] Original: no text, examples or tests taken from another site
- [ ] Statement is unambiguous; every constraint the tests use is stated
- [ ] All solutions pass all tests in 4 languages (the validator from M5; until then, run them by hand)
- [ ] Hidden tests cover the checklist above
- [ ] Hints build up one step at a time; the last hint doesn't hand over the code
- [ ] Editorial complexity matches the reference solutions
- [ ] Spelling, units and names are consistent across statement, hints, editorial and code
