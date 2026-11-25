// Usage (from the repo root): node scripts/content/build-c2.mjs [repoRoot]
// Deterministic (fixed seed): re-running reproduces content/problems/<slug>/ for the 10 C2 problems byte for byte.
// Expected outputs come from brute-force oracles (small inputs) or simple independent methods (large).
// Temporary until the M5 authoring pipeline; see docs/BUILD_GUIDE.md.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? process.cwd();
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const R = rng(20261126);
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const arr = (n, a, b) => Array.from({ length: n }, () => int(a, b));
const word = (alpha, lo, hi) => Array.from({ length: int(lo, hi) }, () => alpha[int(0, alpha.length - 1)]).join("");
const sorted = (xs) => [...xs].sort((x, y) => x - y);
const runs = (n, alpha, maxRun) => { let s = ""; while (s.length < n) s += alpha[int(0, alpha.length - 1)].repeat(int(1, maxRun)); return s.slice(0, n); };

const meta = (slug, title, difficulty, topics, patterns, similar, fn, params, returns) => ({
  $schema: "../meta.schema.json", slug, title, status: "draft", difficulty, category: "dsa", topics, patterns,
  similar_to: similar, signature: { function: fn, params: params.map(([name, type]) => ({ name, type })), returns },
  comparator: "exact", limits: { time_ms_per_case: 1000, max_total_ms: 10000, memory_mb: 256 },
  is_pro: false, pool: "public", authors: ["algogym"], reviewers: [],
});

const problems = [];

// 11 ─ Shift Rotation ───────────────────────────────────────────────────────
problems.push({
  meta: meta("shift-rotation", "Shift Rotation", "Easy", ["arrays-and-strings"], [], ["leetcode:189"], "rotateRight", [["roster", "int[]"], ["k", "int"]], "int[]"),
  statement: `A hospital rotates its duty roster every week. One rotation moves every entry one place to the right, and the last entry wraps around to the front.

Given the roster \`roster\` and the number of rotations \`k\`, return the roster after \`k\` rotations.

## Constraints

- \`1 ≤ roster.length ≤ 10^5\`
- \`−10^9 ≤ roster[i] ≤ 10^9\`
- \`0 ≤ k ≤ 10^9\`
`,
  hints: `1. Rotating one step at a time is O(n · k), and \`k\` can be 10^9.
2. After \`n\` rotations the roster is back where it started. Which rotations actually matter?
3. With \`k\` reduced to \`k mod n\`, entry \`i\` ends up at index \`(i + k) mod n\`.
`,
  editorial: `## Approach: reduce \`k\`, then place each entry directly

Rotating \`n\` times is the identity, so only \`k mod n\` rotations matter. After \`k\` rotations, the entry at index \`i\` sits at index \`(i + k) mod n\`. Build the result by writing every entry to its new index.

(An in-place alternative reverses the whole array, then the first \`k\` entries, then the rest.)

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the result |

## Common mistakes

- Not reducing \`k\`: slicing the last \`k\` entries breaks when \`k > n\` (hidden tests: \`k = n + 1\` and \`k = 10^9\`).
- Rotating left instead of right: the last entry must move to the front.
`,
  oracle: ([r, k]) => { let a = [...r]; for (let s = 0; s < k % r.length; s++) a = [a[a.length - 1], ...a.slice(0, -1)]; return a; },
  publicTests: [{ args: [[1, 2, 3, 4, 5], 2], explain: "After one rotation the roster is [5, 1, 2, 3, 4]; after the second it is [4, 5, 1, 2, 3]." }, { args: [[7, 8], 3] }],
  hidden: () => [
    [[9], 0], [[9], 1000000000], [[1, 2, 3], 0], [[1, 2, 3], 3], [[1, 2, 3], 4], [[1, 2, 3, 4], 1000000000], [[-1000000000, 1000000000], 1],
    [arr(20, -50, 50), 7], [arr(500, -1000, 1000), 499], [arr(3000, -1000000000, 1000000000), 123456789],
    [arr(100000, 0, 9), 999999937],
  ],
  solutions: {
    js: `function rotateRight(roster, k) {
  const n = roster.length;
  const shift = k % n;
  const result = new Array(n);
  for (let i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
  return result;
}
`,
    py: `class Solution:
    def rotateRight(self, roster: list[int], k: int) -> list[int]:
        shift = k % len(roster)
        return roster[-shift:] + roster[:-shift] if shift else roster[:]
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& roster, int k) {
        int n = roster.size();
        int shift = k % n;
        vector<int> result(n);
        for (int i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
        return result;
    }
};
`,
    java: `class Solution {
    public int[] rotateRight(int[] roster, int k) {
        int n = roster.length;
        int shift = k % n;
        int[] result = new int[n];
        for (int i = 0; i < n; i++) result[(i + shift) % n] = roster[i];
        return result;
    }
}
`,
  },
});

// 12 ─ Range Totals ─────────────────────────────────────────────────────────
const ranges = (n, q, wide) => { const l = [], r = []; for (let j = 0; j < q; j++) { let a, b; if (wide) { a = int(0, 100); b = int(n - 101, n - 1); } else { a = int(0, n - 1); b = int(0, n - 1); if (a > b) [a, b] = [b, a]; } l.push(a); r.push(b); } return [l, r]; };
problems.push({
  meta: meta("range-totals", "Range Totals", "Easy", ["arrays-and-strings"], ["prefix-sums"], ["leetcode:303"], "rangeTotals", [["values", "int[]"], ["lefts", "int[]"], ["rights", "int[]"]], "long[]"),
  statement: `A fitness app stores one net calorie number per day in \`values\`, where a day can be negative. It answers many questions of the form "what was the total from day \`lefts[j]\` to day \`rights[j]\`, both included?".

Return the answers, one per question, in order.

## Constraints

- \`1 ≤ values.length ≤ 10^5\`
- \`−10^4 ≤ values[i] ≤ 10^4\`
- \`1 ≤ lefts.length = rights.length ≤ 10^5\`
- \`0 ≤ lefts[j] ≤ rights[j] < values.length\`
`,
  hints: `1. Adding up each range from scratch costs O(range length) per question, up to 10^10 steps in total.
2. Precompute \`prefix[i]\`, the total of the first \`i\` values, with \`prefix[0] = 0\`.
3. The total of \`values[l..r]\` is \`prefix[r + 1] − prefix[l]\`.
`,
  editorial: `## Approach: prefix sums

Build \`prefix\` of length \`n + 1\` with \`prefix[0] = 0\` and \`prefix[i + 1] = prefix[i] + values[i]\`. Each question is then one subtraction: \`prefix[rights[j] + 1] − prefix[lefts[j]]\`.

## Complexity

| | |
| --- | --- |
| Time | O(n + q) |
| Space | O(n) for the prefix array |

## Common mistakes

- Off by one: \`prefix[r] − prefix[l]\` drops day \`r\` (hidden test: single-day ranges).
- Summing every range directly: O(n · q), too slow when ranges are long (hidden test: 20,000 questions spanning almost the whole array).
`,
  oracle: ([v, l, r]) => {
    if (l.reduce((s, a, j) => s + r[j] - a + 1, 0) <= 5e6) return l.map((a, j) => { let s = 0; for (let i = a; i <= r[j]; i++) s += v[i]; return s; });
    const inc = []; let s = 0; for (const x of v) inc.push((s += x)); // inclusive running totals
    return l.map((a, j) => inc[r[j]] - (a ? inc[a - 1] : 0));
  },
  publicTests: [{ args: [[3, -2, 5, 1, -4], [0, 1, 4], [2, 3, 4]], explain: "Days 0–2 total 3 − 2 + 5 = 6, days 1–3 total −2 + 5 + 1 = 4, and day 4 alone is −4." }, { args: [[10], [0], [0]] }],
  hidden: () => [
    [[7], [0, 0], [0, 0]], [[1, 2, 3, 4], [0, 1, 2, 3], [0, 1, 2, 3]], [[1, 2, 3, 4], [0], [3]], [[-10000, -10000, -10000], [0, 1], [2, 2]], [[5, -5, 5, -5], [0, 1, 0], [1, 2, 3]],
    [arr(30, -20, 20), ...ranges(30, 20, false)], [arr(1000, -10000, 10000), ...ranges(1000, 500, false)], [arr(3000, -10000, 10000), ...ranges(3000, 1500, false)],
    [arr(2000, -9, 9), ...ranges(2000, 2000, true)],
    [arr(100000, -9, 9), ...ranges(100000, 20000, true)],
  ],
  solutions: {
    js: `function rangeTotals(values, lefts, rights) {
  const prefix = [0];
  for (const v of values) prefix.push(prefix[prefix.length - 1] + v);
  return lefts.map((l, j) => prefix[rights[j] + 1] - prefix[l]);
}
`,
    py: `class Solution:
    def rangeTotals(self, values: list[int], lefts: list[int], rights: list[int]) -> list[int]:
        prefix = [0]
        for v in values:
            prefix.append(prefix[-1] + v)
        return [prefix[r + 1] - prefix[l] for l, r in zip(lefts, rights)]
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<long long> rangeTotals(vector<int>& values, vector<int>& lefts, vector<int>& rights) {
        vector<long long> prefix(values.size() + 1, 0);
        for (size_t i = 0; i < values.size(); i++) prefix[i + 1] = prefix[i] + values[i];
        vector<long long> answers(lefts.size());
        for (size_t j = 0; j < lefts.size(); j++) answers[j] = prefix[rights[j] + 1] - prefix[lefts[j]];
        return answers;
    }
};
`,
    java: `class Solution {
    public long[] rangeTotals(int[] values, int[] lefts, int[] rights) {
        long[] prefix = new long[values.length + 1];
        for (int i = 0; i < values.length; i++) prefix[i + 1] = prefix[i] + values[i];
        long[] answers = new long[lefts.length];
        for (int j = 0; j < lefts.length; j++) answers[j] = prefix[rights[j] + 1] - prefix[lefts[j]];
        return answers;
    }
}
`,
  },
});

// 13 ─ Run Compression ──────────────────────────────────────────────────────
problems.push({
  meta: meta("run-compression", "Run Compression", "Easy", ["arrays-and-strings"], [], ["leetcode:443"], "compressRuns", [["signal", "string"]], "string"),
  statement: `A sensor link sends long strings of status letters, and most letters repeat many times in a row. To save bandwidth, every maximal run of the same letter is replaced by the letter followed by the run's length: \`"aaabcc"\` becomes \`"a3b1c2"\`.

Return the compressed form of \`signal\`.

## Constraints

- \`1 ≤ signal.length ≤ 10^5\`
- \`signal\` contains only lowercase letters.
`,
  hints: `1. Walk the string and count how many times the current letter repeats.
2. When the letter changes, write the finished run. Don't forget the run that is still open when the string ends.
3. A run can be longer than 9; its length is written in full (\`"a12"\`).
`,
  editorial: `## Approach: one pass over runs

Keep the start of the current run. When \`signal[i]\` differs from \`signal[i − 1]\`, the run \`[start, i)\` is complete: append the letter and \`i − start\`, then start a new run at \`i\`. After the loop, append the last run.

Build the output with a string builder (or a list joined at the end) so the total work stays linear.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the output |

## Common mistakes

- Forgetting the last run (hidden test: the string ends in a long run).
- Writing only one digit of the count, so a run of 12 becomes \`"a2"\` (hidden test: runs longer than 9).
- Repeated string concatenation in a loop, which is O(n²) in some languages.
`,
  oracle: ([s]) => s.match(/(.)\1*/g).map((run) => run[0] + run.length).join(""),
  publicTests: [{ args: ["aaabcc"], explain: "The runs are \"aaa\", \"b\" and \"cc\", which become a3, b1 and c2." }, { args: ["z"] }],
  hidden: () => [
    ["ab"], ["aaaaaaaaaaaa"], ["abababab"], ["aabbbbbbbbbbbbc"], ["xyzzz"], ["q".repeat(100)],
    [runs(40, "ab", 4)], [runs(2000, "abc", 15)], [runs(3000, "abcdefghij", 3)],
    ["a".repeat(100000)], [runs(100000, "ab", 30)],
  ],
  solutions: {
    js: `function compressRuns(signal) {
  const parts = [];
  let start = 0;
  for (let i = 1; i <= signal.length; i++) {
    if (i === signal.length || signal[i] !== signal[start]) {
      parts.push(signal[start] + (i - start));
      start = i;
    }
  }
  return parts.join("");
}
`,
    py: `class Solution:
    def compressRuns(self, signal: str) -> str:
        parts: list[str] = []
        start = 0
        for i in range(1, len(signal) + 1):
            if i == len(signal) or signal[i] != signal[start]:
                parts.append(signal[start] + str(i - start))
                start = i
        return "".join(parts)
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    string compressRuns(string signal) {
        string out;
        size_t start = 0;
        for (size_t i = 1; i <= signal.size(); i++) {
            if (i == signal.size() || signal[i] != signal[start]) {
                out += signal[start];
                out += to_string(i - start);
                start = i;
            }
        }
        return out;
    }
};
`,
    java: `class Solution {
    public String compressRuns(String signal) {
        StringBuilder out = new StringBuilder();
        int start = 0;
        for (int i = 1; i <= signal.length(); i++) {
            if (i == signal.length() || signal.charAt(i) != signal.charAt(start)) {
                out.append(signal.charAt(start)).append(i - start);
                start = i;
            }
        }
        return out.toString();
    }
}
`,
  },
});

// 14 ─ Matching Receipts ────────────────────────────────────────────────────
problems.push({
  meta: meta("matching-receipts", "Matching Receipts", "Medium", ["hashing"], ["frequency-counting"], ["leetcode:1", "gfg:count-pairs-with-given-sum"], "countPairsWithTotal", [["amounts", "int[]"], ["target", "int"]], "long"),
  statement: `An auditor suspects that some invoices were paid with exactly two receipts. \`amounts[i]\` is the value of receipt \`i\`; refunds are negative.

Return the number of pairs \`(i, j)\` with \`i < j\` such that \`amounts[i] + amounts[j] == target\`.

## Constraints

- \`2 ≤ amounts.length ≤ 10^5\`
- \`−10^9 ≤ amounts[i] ≤ 10^9\`
- \`−2 × 10^9 ≤ target ≤ 2 × 10^9\`
`,
  hints: `1. For receipt \`i\`, the only partner that works has value \`target − amounts[i]\`.
2. Walk the receipts in order and remember how many times each value has appeared so far.
3. Each receipt pairs with every earlier receipt of the complementary value. Count those before you record the current receipt, so it never pairs with itself.
`,
  editorial: `## Approach: one pass with a count of earlier values

Keep \`seen[value]\`, the number of earlier receipts with that value. For each receipt \`x\`, add \`seen[target − x]\` to the answer, then increment \`seen[x]\`. Counting before recording means a receipt is never paired with itself, and each pair is counted once.

Compute \`target − x\` in 64-bit arithmetic: it can reach 3 × 10^9.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected |
| Space | O(n) for the map |

## Common mistakes

- Counting from a map of all values: when \`2x == target\`, the receipt pairs with itself (hidden test: every amount is \`target / 2\`).
- The answer can reach about 5 × 10^9 (10^5 equal receipts), so it needs \`long\`.
- Checking every pair is O(n²), too slow for 10^5 receipts.
`,
  oracle: ([a, t]) => {
    if (a.length <= 3000) { let c = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) c++; return c; }
    // Independent method: count values, then pair distinct values (and choose(c, 2) for x == t − x).
    const m = new Map(); for (const x of a) m.set(x, (m.get(x) ?? 0) + 1);
    let c = 0; for (const [x, cx] of m) { const y = t - x; if (x < y && m.has(y)) c += cx * m.get(y); else if (x === y) c += (cx * (cx - 1)) / 2; }
    return c;
  },
  publicTests: [{ args: [[4, 6, 2, 8, 6, 4], 10], explain: "4 + 6 = 10 at index pairs (0, 1), (0, 4), (1, 5) and (4, 5), and 2 + 8 = 10 at (2, 3): five pairs." }, { args: [[1, 2, 3], 100] }],
  hidden: () => [
    [[5, 5], 10], [[5, 5, 5], 10], [[5, 6], 10], [[-3, 3, 0, 0], 0], [[1000000000, 1000000000, -1000000000], 2000000000], [[-1000000000, 1000000000], 0],
    [arr(30, -5, 5), 0], [arr(1000, -50, 50), 10], [arr(3000, -1000000000, 1000000000), 7],
    [Array.from({ length: 2000 }, () => 4), 8],
    [Array.from({ length: 100000 }, () => 5), 10],
  ],
  solutions: {
    js: `function countPairsWithTotal(amounts, target) {
  const seen = new Map();
  let pairs = 0;
  for (const x of amounts) {
    pairs += seen.get(target - x) ?? 0;
    seen.set(x, (seen.get(x) ?? 0) + 1);
  }
  return pairs;
}
`,
    py: `class Solution:
    def countPairsWithTotal(self, amounts: list[int], target: int) -> int:
        seen: dict[int, int] = {}
        pairs = 0
        for x in amounts:
            pairs += seen.get(target - x, 0)
            seen[x] = seen.get(x, 0) + 1
        return pairs
`,
    cpp: `#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countPairsWithTotal(vector<int>& amounts, int target) {
        unordered_map<long long, long long> seen;
        seen.reserve(amounts.size() * 2);
        long long pairs = 0;
        for (int x : amounts) {
            auto it = seen.find((long long)target - x);
            if (it != seen.end()) pairs += it->second;
            seen[x]++;
        }
        return pairs;
    }
};
`,
    java: `import java.util.HashMap;

class Solution {
    public long countPairsWithTotal(int[] amounts, int target) {
        HashMap<Long, Long> seen = new HashMap<>();
        long pairs = 0;
        for (int x : amounts) {
            pairs += seen.getOrDefault((long) target - x, 0L);
            seen.merge((long) x, 1L, Long::sum);
        }
        return pairs;
    }
}
`,
  },
});

// 15 ─ First One-Time Visitor ───────────────────────────────────────────────
problems.push({
  meta: meta("first-one-time-visitor", "First One-Time Visitor", "Easy", ["hashing"], ["frequency-counting"], ["leetcode:387"], "firstSingleVisit", [["visitors", "string[]"]], "int"),
  statement: `A museum's door log lists visitor ids in order of entry; \`visitors[i]\` is the \`i\`-th entry. Some members come back several times on the same day.

Return the index of the first entry whose visitor appears exactly once in the whole log, or \`-1\` if every visitor came more than once.

## Constraints

- \`1 ≤ visitors.length ≤ 10^5\`
- \`1 ≤ visitors[i].length ≤ 8\`
- \`visitors[i]\` contains only lowercase letters and digits.
`,
  hints: `1. Whether an entry is a one-time visit depends on the whole log, including entries before it.
2. First count every id. Then scan the log again and return the first index whose id has a count of 1.
`,
  editorial: `## Approach: count, then scan

Pass 1: count each id in a hash map. Pass 2: return the first index \`i\` with \`count[visitors[i]] == 1\`, or \`-1\`.

## Complexity

| | |
| --- | --- |
| Time | O(n · L), with L ≤ 8 |
| Space | O(n) for the map |

## Common mistakes

- Only checking whether the id appears **later**: in \`["b", "b", "c"]\` the second \`"b"\` has no later copy but is still a repeat visitor; the answer is 2 (hidden test).
- Searching the whole log for each entry is O(n²).
`,
  oracle: ([v]) => {
    if (v.length <= 3000) { for (let i = 0; i < v.length; i++) if (v.filter((x) => x === v[i]).length === 1) return i; return -1; }
    const first = new Map(), dup = new Set(); v.forEach((x, i) => (first.has(x) ? dup.add(x) : first.set(x, i)));
    let best = -1; for (const [x, i] of first) if (!dup.has(x) && (best === -1 || i < best)) best = i; return best;
  },
  publicTests: [{ args: [["m4", "k2", "m4", "z9", "k2"]], explain: "m4 and k2 both visit twice. z9 visits only once, at index 3." }, { args: [["aa", "aa"]] }],
  hidden: () => [
    [["solo"]], [["b", "b", "c"]], [["x", "y", "x", "y"]], [["a", "b", "c"]], [["a", "a", "b", "b", "c", "c", "d"]], [["q1", "q2", "q2", "q1", "q3", "q3"]],
    [Array.from({ length: 40 }, () => word("abc", 1, 2))], [Array.from({ length: 1000 }, () => word("abcdef", 1, 3))], [Array.from({ length: 3000 }, () => word("ab0", 1, 5))],
    [[...Array.from({ length: 99999 }, (_, i) => (i % 2 ? "ab" : "ba")), "last"]],
  ],
  solutions: {
    js: `function firstSingleVisit(visitors) {
  const count = new Map();
  for (const v of visitors) count.set(v, (count.get(v) ?? 0) + 1);
  for (let i = 0; i < visitors.length; i++) if (count.get(visitors[i]) === 1) return i;
  return -1;
}
`,
    py: `from collections import Counter


class Solution:
    def firstSingleVisit(self, visitors: list[str]) -> int:
        count = Counter(visitors)
        for i, v in enumerate(visitors):
            if count[v] == 1:
                return i
        return -1
`,
    cpp: `#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    int firstSingleVisit(vector<string>& visitors) {
        unordered_map<string, int> count;
        for (const string& v : visitors) count[v]++;
        for (int i = 0; i < (int)visitors.size(); i++) if (count[visitors[i]] == 1) return i;
        return -1;
    }
};
`,
    java: `import java.util.HashMap;

class Solution {
    public int firstSingleVisit(String[] visitors) {
        HashMap<String, Integer> count = new HashMap<>();
        for (String v : visitors) count.merge(v, 1, Integer::sum);
        for (int i = 0; i < visitors.length; i++) if (count.get(visitors[i]) == 1) return i;
        return -1;
    }
}
`,
  },
});

// 16 ─ Exact Budget Streaks ─────────────────────────────────────────────────
problems.push({
  meta: meta("exact-budget-streaks", "Exact Budget Streaks", "Medium", ["hashing", "arrays-and-strings"], ["prefix-sums"], ["leetcode:560"], "countTargetStretches", [["changes", "int[]"], ["target", "int"]], "long"),
  statement: `A shared wallet records the net change of each day; \`changes[i]\` can be negative (a refund) or zero.

Return the number of stretches of consecutive days whose changes add up to exactly \`target\`.

## Constraints

- \`1 ≤ changes.length ≤ 10^5\`
- \`−10^4 ≤ changes[i] ≤ 10^4\`
- \`−10^9 ≤ target ≤ 10^9\`
`,
  hints: `1. Changes can be negative, so a growing window's total doesn't only go up. A sliding window won't work.
2. The stretch \`(i, j]\` totals \`prefix[j] − prefix[i]\`. You want \`prefix[i] = prefix[j] − target\`.
3. Walk the days keeping a running total and a count of every prefix total seen so far, starting with one empty prefix (total 0).
`,
  editorial: `## Approach: prefix sums with a hash map

Keep a running total \`s\` and \`seen[total]\`, the number of earlier prefixes with that total; start with \`seen[0] = 1\` for the empty prefix. For each day, add \`changes[i]\` to \`s\`, add \`seen[s − target]\` to the answer (one stretch per earlier prefix), then increment \`seen[s]\`.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected |
| Space | O(n) for the map |

## Common mistakes

- Using a sliding window: it assumes every change is positive (hidden test: refunds inside the stretch).
- Forgetting \`seen[0] = 1\`: stretches that start on day 0 are missed (hidden test: the whole array is the only answer).
- 10^5 zero days with target 0 give 5,000,050,000 stretches: the count needs \`long\`.
`,
  oracle: ([c, t]) => {
    if (c.length <= 3000) { let k = 0; for (let i = 0; i < c.length; i++) { let s = 0; for (let j = i; j < c.length; j++) { s += c[j]; if (s === t) k++; } } return k; }
    // Independent method for large inputs: sort the prefix totals and count equal-difference pairs by index order.
    const pre = [0]; for (const x of c) pre.push(pre[pre.length - 1] + x);
    const pos = new Map(); pre.forEach((p, i) => { if (!pos.has(p)) pos.set(p, []); pos.get(p).push(i); });
    let k = 0; for (const [p, idxs] of pos) { const earlier = pos.get(p - t); if (!earlier) continue; let e = 0; for (const j of idxs) { while (e < earlier.length && earlier[e] < j) e++; k += e; } }
    return k;
  },
  publicTests: [{ args: [[3, 4, -2, 2, 5], 7], explain: "Three stretches total 7: days 0–1 (3 + 4), days 0–3 (3 + 4 − 2 + 2) and days 3–4 (2 + 5)." }, { args: [[1, 1], 5] }],
  hidden: () => [
    [[7], 7], [[7], -7], [[0, 0, 0], 0], [[2, -2, 2, -2], 0], [[5, -1, 1, 5], 10], [[-10000, 10000, -10000], -10000],
    [arr(40, -3, 3), 2], [arr(1500, -10, 10), 5], [arr(3000, -10000, 10000), 10000],
    [Array.from({ length: 100000 }, () => 0), 0],
    [arr(3000, 1, 1), 1500],
  ],
  solutions: {
    js: `function countTargetStretches(changes, target) {
  const seen = new Map([[0, 1]]);
  let total = 0;
  let count = 0;
  for (const c of changes) {
    total += c;
    count += seen.get(total - target) ?? 0;
    seen.set(total, (seen.get(total) ?? 0) + 1);
  }
  return count;
}
`,
    py: `class Solution:
    def countTargetStretches(self, changes: list[int], target: int) -> int:
        seen = {0: 1}
        total = count = 0
        for c in changes:
            total += c
            count += seen.get(total - target, 0)
            seen[total] = seen.get(total, 0) + 1
        return count
`,
    cpp: `#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countTargetStretches(vector<int>& changes, int target) {
        unordered_map<long long, long long> seen;
        seen.reserve(changes.size() * 2);
        seen[0] = 1;
        long long total = 0, count = 0;
        for (int c : changes) {
            total += c;
            auto it = seen.find(total - target);
            if (it != seen.end()) count += it->second;
            seen[total]++;
        }
        return count;
    }
};
`,
    java: `import java.util.HashMap;

class Solution {
    public long countTargetStretches(int[] changes, int target) {
        HashMap<Long, Long> seen = new HashMap<>();
        seen.put(0L, 1L);
        long total = 0, count = 0;
        for (int c : changes) {
            total += c;
            count += seen.getOrDefault(total - target, 0L);
            seen.merge(total, 1L, Long::sum);
        }
        return count;
    }
}
`,
  },
});

// 17 ─ Noisy Palindrome ─────────────────────────────────────────────────────
const NOISE = ".,!?-_':;";
const noisy = (core) => [...core].map((ch) => (R() < 0.3 ? NOISE[int(0, NOISE.length - 1)] : "") + (R() < 0.5 ? ch.toUpperCase() : ch)).join("");
const palin = (n, alpha) => { const half = word(alpha, n, n); return half + [...half].reverse().join(""); };
problems.push({
  meta: meta("noisy-palindrome", "Noisy Palindrome", "Easy", ["two-pointers", "arrays-and-strings"], ["two-pointers"], ["leetcode:125"], "isNoisyPalindrome", [["text", "string"]], "bool"),
  statement: `A puzzle app accepts a line as a palindrome if it reads the same forwards and backwards after you ignore case and every character that isn't a letter or a digit.

Return \`true\` if \`text\` is such a palindrome, and \`false\` otherwise. A line with no letters or digits counts as a palindrome.

## Constraints

- \`1 ≤ text.length ≤ 10^5\`
- \`text\` contains letters, digits, and the characters \`. , ! ? - _ ' : ;\` (no spaces).
`,
  hints: `1. Copying the cleaned text and reversing it works, but you can do it with no extra memory.
2. Put one pointer at each end. Skip characters that aren't letters or digits, then compare the two characters ignoring case.
3. Stop when the pointers meet.
`,
  editorial: `## Approach: two pointers from both ends

Start with \`lo = 0\` and \`hi = n − 1\`. Move \`lo\` right past non-alphanumeric characters and \`hi\` left likewise. If both point at letters or digits, compare them in lower case; a mismatch means \`false\`. Otherwise step both inwards. Reaching \`lo ≥ hi\` means \`true\`.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Comparing case-sensitively: \`"Aa"\` is a palindrome (hidden test).
- Treating digits as noise: \`"1a2"\` is not a palindrome (hidden test).
- Running a pointer past the other while skipping noise on a line that is all punctuation (hidden test: \`"!?"\`).
`,
  oracle: ([s]) => { const c = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return c === [...c].reverse().join(""); },
  publicTests: [{ args: ["Step-on,no:PETS!"], explain: "Keeping only letters and digits in lower case gives \"steponnopets\", which reads the same both ways." }, { args: ["abc-ba?x"] }],
  hidden: () => [
    ["a"], ["!?"], ["Aa"], ["1a2"], ["2a2"], ["ab"], ["race-Car"], ["0P"],
    [noisy(palin(10, "abc12"))], [noisy(palin(1000, "ab"))], [noisy(palin(1400, "abcdef0123")) + "x"],
    [noisy(palin(35000, "ab"))],
  ],
  solutions: {
    js: `function isNoisyPalindrome(text) {
  const keep = (ch) => /[a-z0-9]/i.test(ch);
  let lo = 0;
  let hi = text.length - 1;
  while (lo < hi) {
    if (!keep(text[lo])) lo++;
    else if (!keep(text[hi])) hi--;
    else if (text[lo].toLowerCase() !== text[hi].toLowerCase()) return false;
    else {
      lo++;
      hi--;
    }
  }
  return true;
}
`,
    py: `class Solution:
    def isNoisyPalindrome(self, text: str) -> bool:
        lo, hi = 0, len(text) - 1
        while lo < hi:
            if not text[lo].isalnum():
                lo += 1
            elif not text[hi].isalnum():
                hi -= 1
            elif text[lo].lower() != text[hi].lower():
                return False
            else:
                lo += 1
                hi -= 1
        return True
`,
    cpp: `#include <cctype>
#include <string>
using namespace std;

class Solution {
public:
    bool isNoisyPalindrome(string text) {
        int lo = 0, hi = (int)text.size() - 1;
        while (lo < hi) {
            if (!isalnum((unsigned char)text[lo])) lo++;
            else if (!isalnum((unsigned char)text[hi])) hi--;
            else if (tolower((unsigned char)text[lo]) != tolower((unsigned char)text[hi])) return false;
            else {
                lo++;
                hi--;
            }
        }
        return true;
    }
};
`,
    java: `class Solution {
    public boolean isNoisyPalindrome(String text) {
        int lo = 0, hi = text.length() - 1;
        while (lo < hi) {
            char a = text.charAt(lo), b = text.charAt(hi);
            if (!Character.isLetterOrDigit(a)) lo++;
            else if (!Character.isLetterOrDigit(b)) hi--;
            else if (Character.toLowerCase(a) != Character.toLowerCase(b)) return false;
            else {
                lo++;
                hi--;
            }
        }
        return true;
    }
}
`,
  },
});

// 18 ─ Merge Two Shelves ────────────────────────────────────────────────────
problems.push({
  meta: meta("merge-two-shelves", "Merge Two Shelves", "Easy", ["two-pointers"], ["two-pointers"], ["leetcode:88"], "mergeSorted", [["left", "int[]"], ["right", "int[]"]], "int[]"),
  statement: `A library is combining two shelves. Each shelf's books are already ordered by catalogue number, smallest first: \`left\` and \`right\` are both sorted in non-decreasing order.

Return one list with every catalogue number from both shelves, sorted in non-decreasing order.

## Constraints

- \`0 ≤ left.length, right.length ≤ 10^5\`
- \`−10^9 ≤ left[i], right[j] ≤ 10^9\`
- Both lists are sorted in non-decreasing order.
`,
  hints: `1. The smallest remaining book is always at the front of one of the two shelves.
2. Keep a pointer into each list and repeatedly take the smaller front value.
3. When one shelf runs out, the rest of the other shelf is already in order.
`,
  editorial: `## Approach: two pointers, one per list

Keep \`i\` in \`left\` and \`j\` in \`right\`. While both have values, append the smaller of \`left[i]\` and \`right[j]\` (either on a tie) and advance that pointer. Then append whatever remains of the other list.

Concatenating and sorting also gives the right answer, but costs O((n + m) log(n + m)) and ignores the order you were given.

## Complexity

| | |
| --- | --- |
| Time | O(n + m) |
| Space | O(n + m) for the result |

## Common mistakes

- Dropping the leftover values once one list is empty (hidden test: every value in \`left\` is larger than every value in \`right\`).
- Indexing an empty list (hidden tests: one or both lists empty).
`,
  oracle: ([a, b]) => sorted([...a, ...b]),
  publicTests: [{ args: [[1, 4, 9], [2, 3, 10, 11]], explain: "Taking the smaller front value each time gives 1, 2, 3, 4, 9, then the rest of the second shelf: 10, 11." }, { args: [[], [5]] }],
  hidden: () => [
    [[], []], [[7], []], [[5, 6, 7], [1, 2]], [[1, 2], [5, 6, 7]], [[3, 3, 3], [3, 3]], [[-1000000000], [1000000000]],
    [sorted(arr(15, -20, 20)), sorted(arr(12, -20, 20))], [sorted(arr(800, 0, 100)), sorted(arr(700, 0, 100))], [sorted(arr(1500, -1000000000, 1000000000)), sorted(arr(1500, -1000000000, 1000000000))],
    [sorted(arr(50000, 0, 99)), sorted(arr(50000, 0, 99))],
  ],
  solutions: {
    js: `function mergeSorted(left, right) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) out.push(left[i] <= right[j] ? left[i++] : right[j++]);
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}
`,
    py: `class Solution:
    def mergeSorted(self, left: list[int], right: list[int]) -> list[int]:
        out: list[int] = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                out.append(left[i])
                i += 1
            else:
                out.append(right[j])
                j += 1
        out.extend(left[i:])
        out.extend(right[j:])
        return out
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> mergeSorted(vector<int>& left, vector<int>& right) {
        vector<int> out;
        out.reserve(left.size() + right.size());
        size_t i = 0, j = 0;
        while (i < left.size() && j < right.size()) out.push_back(left[i] <= right[j] ? left[i++] : right[j++]);
        while (i < left.size()) out.push_back(left[i++]);
        while (j < right.size()) out.push_back(right[j++]);
        return out;
    }
};
`,
    java: `class Solution {
    public int[] mergeSorted(int[] left, int[] right) {
        int[] out = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) out[k++] = left[i] <= right[j] ? left[i++] : right[j++];
        while (i < left.length) out[k++] = left[i++];
        while (j < right.length) out[k++] = right[j++];
        return out;
    }
}
`,
  },
});

// 19 ─ Widest Tank ──────────────────────────────────────────────────────────
problems.push({
  meta: meta("widest-tank", "Widest Tank", "Medium", ["two-pointers"], ["two-pointers"], ["leetcode:11"], "maxTankArea", [["heights", "int[]"]], "long"),
  statement: `A row of vertical panels stands one metre apart; \`heights[i]\` is the height of panel \`i\`. Pick two panels \`i < j\` as the walls of a tank. The water level can't rise above the shorter wall, so the tank's front area is \`(j − i) × min(heights[i], heights[j])\`.

Return the largest area you can get.

## Constraints

- \`2 ≤ heights.length ≤ 10^5\`
- \`0 ≤ heights[i] ≤ 10^4\`
`,
  hints: `1. Trying every pair is O(n²). Start with the widest tank: the first and last panels.
2. Moving a wall inwards makes the tank narrower. Which wall can't be part of any better tank with a narrower width?
3. The shorter wall already limits the height; pairing it with anything closer only loses width. Move the shorter wall.
`,
  editorial: `## Approach: two pointers, always move the shorter wall

Start with \`lo = 0\`, \`hi = n − 1\` and record their area. The shorter of the two walls can't do better with any wall between them (width shrinks, height can't exceed it), so discard it: move \`lo\` right if \`heights[lo] ≤ heights[hi]\`, otherwise move \`hi\` left. Repeat until the pointers meet.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Moving the taller wall: it can discard the best tank (hidden test: \`[1, 8, 6, 2, 5, 4, 8, 3, 7]\`, answer 49).
- Checking every pair: O(n²), too slow for 10^5 panels.
`,
  oracle: ([h]) => {
    if (h.length <= 3000) { let best = 0; for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) best = Math.max(best, (j - i) * Math.min(h[i], h[j])); return best; }
    // Independent method: for each height level, the widest pair of panels at least that tall (levels are small here).
    const maxH = Math.max(...h); let best = 0;
    for (let level = 1; level <= maxH; level++) { const lo = h.findIndex((x) => x >= level); if (lo < 0) break; let hi = h.length - 1; while (h[hi] < level) hi--; best = Math.max(best, (hi - lo) * level); }
    return best;
  },
  publicTests: [{ args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], explain: "Panels 1 (height 8) and 8 (height 7) are 7 apart, so the area is 7 × 7 = 49." }, { args: [[1, 1]] }],
  hidden: () => [
    [[0, 0]], [[5, 0]], [[4, 3, 2, 1, 4]], [[1, 2, 1]], [[1, 8, 6, 2, 5, 4, 8, 3, 7]], [[10000, 10000]], [[2, 3, 10, 5, 7, 8, 9]],
    [arr(30, 0, 20)], [arr(1000, 0, 10000)], [arr(3000, 0, 10000)],
    [arr(100000, 0, 99)],
  ],
  solutions: {
    js: `function maxTankArea(heights) {
  let lo = 0;
  let hi = heights.length - 1;
  let best = 0;
  while (lo < hi) {
    best = Math.max(best, (hi - lo) * Math.min(heights[lo], heights[hi]));
    if (heights[lo] <= heights[hi]) lo++;
    else hi--;
  }
  return best;
}
`,
    py: `class Solution:
    def maxTankArea(self, heights: list[int]) -> int:
        lo, hi = 0, len(heights) - 1
        best = 0
        while lo < hi:
            best = max(best, (hi - lo) * min(heights[lo], heights[hi]))
            if heights[lo] <= heights[hi]:
                lo += 1
            else:
                hi -= 1
        return best
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long maxTankArea(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        long long best = 0;
        while (lo < hi) {
            best = max(best, (long long)(hi - lo) * min(heights[lo], heights[hi]));
            if (heights[lo] <= heights[hi]) lo++;
            else hi--;
        }
        return best;
    }
};
`,
    java: `class Solution {
    public long maxTankArea(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        long best = 0;
        while (lo < hi) {
            best = Math.max(best, (long) (hi - lo) * Math.min(heights[lo], heights[hi]));
            if (heights[lo] <= heights[hi]) lo++;
            else hi--;
        }
        return best;
    }
}
`,
  },
});

// 20 ─ Shortest Funding Window ──────────────────────────────────────────────
problems.push({
  meta: meta("shortest-funding-window", "Shortest Funding Window", "Medium", ["sliding-window"], ["sliding-window"], ["leetcode:209"], "shortestWindowAtLeast", [["donations", "int[]"], ["goal", "int"]], "int"),
  statement: `A crowdfunding page lists each day's donations in order; every \`donations[i]\` is positive. The team wants the shortest run of consecutive days that together raised at least \`goal\`.

Return the length of that run, or \`0\` if even all days together fall short.

## Constraints

- \`1 ≤ donations.length ≤ 10^5\`
- \`1 ≤ donations[i] ≤ 10^4\`
- \`1 ≤ goal ≤ 10^9\`
`,
  hints: `1. All donations are positive, so extending a run only raises its total and shrinking it only lowers it.
2. Grow the window to the right until it reaches the goal, then shrink it from the left as long as it still reaches the goal.
3. Record the length each time the window reaches the goal, before shrinking further.
`,
  editorial: `## Approach: variable sliding window

Keep \`left\` and a running \`total\`. For each \`right\`, add \`donations[right]\`. **While** \`total ≥ goal\`, record \`right − left + 1\`, subtract \`donations[left]\` and move \`left\` right. Positive values guarantee that once the window falls below the goal, any shorter window ending here would too.

## Complexity

| | |
| --- | --- |
| Time | O(n): each index enters and leaves the window once |
| Space | O(1) |

## Common mistakes

- Shrinking only once (\`if\` instead of \`while\`): the window can stay longer than needed (hidden test: one huge donation after many small ones).
- Returning the first window that reaches the goal: later windows can be shorter.
- Returning infinity or n when the goal is never reached; the answer is \`0\` (hidden test).
`,
  oracle: ([d, g]) => {
    if (d.length <= 3000) { let best = 0; for (let i = 0; i < d.length; i++) { let s = 0; for (let j = i; j < d.length; j++) { s += d[j]; if (s >= g) { if (!best || j - i + 1 < best) best = j - i + 1; break; } } } return best; }
    // Independent method: binary search on the length with prefix sums.
    const pre = [0]; for (const x of d) pre.push(pre[pre.length - 1] + x);
    const ok = (len) => { for (let i = len; i < pre.length; i++) if (pre[i] - pre[i - len] >= g) return true; return false; };
    if (!ok(d.length)) return 0; let lo = 1, hi = d.length; while (lo < hi) { const m = (lo + hi) >> 1; if (ok(m)) hi = m; else lo = m + 1; } return lo;
  },
  publicTests: [{ args: [[2, 3, 1, 2, 4, 3], 7], explain: "Days 4–5 (4 + 3) raise exactly 7 in two days. No single day reaches 7." }, { args: [[1, 1, 1], 5] }],
  hidden: () => [
    [[5], 5], [[5], 6], [[1, 1, 1, 1, 10000], 10000], [[1, 1, 1, 1, 1, 1, 9], 10], [[10, 1, 1, 1, 10], 12], [[3, 3, 3], 9],
    [arr(30, 1, 10), 25], [arr(1000, 1, 100), 5000], [arr(3000, 1, 10000), 400000],
    [arr(100000, 1, 99), 2500000],
    [arr(3000, 1, 5), 1000000000],
  ],
  solutions: {
    js: `function shortestWindowAtLeast(donations, goal) {
  let left = 0;
  let total = 0;
  let best = 0;
  for (let right = 0; right < donations.length; right++) {
    total += donations[right];
    while (total >= goal) {
      const length = right - left + 1;
      if (best === 0 || length < best) best = length;
      total -= donations[left++];
    }
  }
  return best;
}
`,
    py: `class Solution:
    def shortestWindowAtLeast(self, donations: list[int], goal: int) -> int:
        left = total = best = 0
        for right, d in enumerate(donations):
            total += d
            while total >= goal:
                length = right - left + 1
                if best == 0 or length < best:
                    best = length
                total -= donations[left]
                left += 1
        return best
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int shortestWindowAtLeast(vector<int>& donations, int goal) {
        int left = 0, best = 0;
        long long total = 0;
        for (int right = 0; right < (int)donations.size(); right++) {
            total += donations[right];
            while (total >= goal) {
                int length = right - left + 1;
                if (best == 0 || length < best) best = length;
                total -= donations[left++];
            }
        }
        return best;
    }
};
`,
    java: `class Solution {
    public int shortestWindowAtLeast(int[] donations, int goal) {
        int left = 0, best = 0;
        long total = 0;
        for (int right = 0; right < donations.length; right++) {
            total += donations[right];
            while (total >= goal) {
                int length = right - left + 1;
                if (best == 0 || length < best) best = length;
                total -= donations[left++];
            }
        }
        return best;
    }
}
`,
  },
});

// ─ Write ─────────────────────────────────────────────────────────────────────
const pad = (i) => String(i + 1).padStart(2, "0");
const json = (v) => JSON.stringify(v);
for (const p of problems) {
  const dir = join(root, "content/problems", p.meta.slug);
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ["tests/public", "tests/hidden", "solutions"]) mkdirSync(join(dir, sub), { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(p.meta, null, 2) + "\n");
  writeFileSync(join(dir, "statement.md"), p.statement);
  writeFileSync(join(dir, "hints.md"), p.hints);
  writeFileSync(join(dir, "editorial.md"), p.editorial);
  p.publicTests.forEach((t, i) => {
    writeFileSync(join(dir, `tests/public/${pad(i)}.in`), json(t.args) + "\n");
    writeFileSync(join(dir, `tests/public/${pad(i)}.out`), json(p.oracle(t.args)) + "\n");
    if (t.explain) writeFileSync(join(dir, `tests/public/${pad(i)}.explain.md`), t.explain + "\n");
  });
  const hidden = p.hidden();
  if (hidden.length < 10) throw new Error(`${p.meta.slug}: only ${hidden.length} hidden tests`);
  hidden.forEach((args, i) => {
    writeFileSync(join(dir, `tests/hidden/${pad(i)}.in`), json(args) + "\n");
    writeFileSync(join(dir, `tests/hidden/${pad(i)}.out`), json(p.oracle(args)) + "\n");
  });
  const files = { js: "solution.js", py: "solution.py", cpp: "solution.cpp", java: "Solution.java" };
  for (const [lang, file] of Object.entries(files)) writeFileSync(join(dir, "solutions", file), p.solutions[lang]);
  console.log(`${p.meta.slug}: ${p.publicTests.length} public, ${hidden.length} hidden`);
}
