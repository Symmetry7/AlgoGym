// Builds the 10 C1 problems into <root>/content/problems/<slug>/.
// Expected outputs come from brute-force oracles (small inputs) or simple independent methods (large).
// Usage (from the repo root): node scripts/content/build-c1.mjs [repoRoot]
// Deterministic (fixed seed): re-running reproduces content/problems/<slug>/ for the 10 C1 problems byte for byte.
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
const R = rng(20261125);
const int = (a, b) => a + Math.floor(R() * (b - a + 1));
const arr = (n, a, b) => Array.from({ length: n }, () => int(a, b));
const word = (alpha, lo, hi) => Array.from({ length: int(lo, hi) }, () => alpha[int(0, alpha.length - 1)]).join("");
const sorted = (xs) => [...xs].sort((x, y) => x - y);
const LOWER = "abcdefghijklmnopqrstuvwxyz";

const meta = (slug, title, difficulty, topics, patterns, similar, fn, params, returns, comparator = "exact") => ({
  $schema: "../meta.schema.json", slug, title, status: "draft", difficulty, category: "dsa", topics, patterns,
  similar_to: similar, signature: { function: fn, params: params.map(([name, type]) => ({ name, type })), returns },
  comparator, limits: { time_ms_per_case: 1000, max_total_ms: 10000, memory_mb: 256 },
  is_pro: false, pool: "public", authors: ["algogym"], reviewers: [],
});

const problems = [];

// 1 ─ Quiet Hours ────────────────────────────────────────────────────────────
problems.push({
  meta: meta("quiet-hours", "Quiet Hours", "Easy", ["arrays-and-strings"], [], ["leetcode:485"], "longestQuietRun", [["levels", "int[]"], ["limit", "int"]], "int"),
  statement: `A library logs the noise level in its reading room once an hour. \`levels[i]\` is the reading for hour \`i\`.

An hour is **quiet** when its reading is at most \`limit\`. Return the length of the longest run of consecutive quiet hours. If no hour is quiet, return \`0\`.

## Constraints

- \`1 ≤ levels.length ≤ 10^5\`
- \`0 ≤ levels[i] ≤ 10^4\`
- \`0 ≤ limit ≤ 10^4\`
`,
  hints: `1. You only need to know how long the current quiet run is, not where it started.
2. Walk the array once. Extend the current run on a quiet hour, reset it to zero on a loud one.
3. Keep the best run seen so far; the answer is that value after the last hour.
`,
  editorial: `## Approach: one pass with a running count

Every quiet run ends either at a loud hour or at the end of the array. Keep \`current\`, the length of the quiet run ending at the hour you are looking at, and \`best\`, the longest run so far.

- Quiet hour: \`current += 1\`, then \`best = max(best, current)\`.
- Loud hour: \`current = 0\`.

## Complexity

| | |
| --- | --- |
| Time | O(n): one pass over \`levels\` |
| Space | O(1): two integers |

## Common mistakes

- Returning \`current\` instead of \`best\`: the longest run is not always the last one (hidden test: a long run followed by a short one).
- Using \`< limit\`: a reading equal to \`limit\` is still quiet (hidden test: every reading equals \`limit\`).
`,
  oracle: ([levels, limit]) => {
    let best = 0;
    for (let i = 0; i < levels.length; i++) { let j = i; while (j < levels.length && levels[j] <= limit) j++; best = Math.max(best, j - i); }
    return best;
  },
  publicTests: [{ args: [[3, 1, 4, 1, 5, 9, 2, 6], 4], explain: "Hours 0 to 3 read 3, 1, 4 and 1, all at most 4. Hour 4 reads 5, which ends the run, and no later run is longer." }, { args: [[7, 8, 9], 5] }],
  hidden: () => [
    [[5], 5], [[7], 6], [[4, 4, 4], 4], [[10, 10], 9], [[1, 2, 3, 4, 5, 6], 10], [[9, 0, 0, 9, 0, 0, 0], 0],
    [[0, 0, 0, 0, 9, 0], 0], [[9, 9, 0, 0], 0],
    [arr(30, 0, 10), 5], [arr(200, 0, 20), 12], [arr(1000, 0, 100), 90],
    [arr(100000, 0, 99), 95],
  ],
  solutions: {
    js: `function longestQuietRun(levels, limit) {
  let best = 0;
  let current = 0;
  for (const level of levels) {
    current = level <= limit ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}
`,
    py: `class Solution:
    def longestQuietRun(self, levels: list[int], limit: int) -> int:
        best = current = 0
        for level in levels:
            current = current + 1 if level <= limit else 0
            best = max(best, current)
        return best
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int longestQuietRun(vector<int>& levels, int limit) {
        int best = 0, current = 0;
        for (int level : levels) {
            current = level <= limit ? current + 1 : 0;
            best = max(best, current);
        }
        return best;
    }
};
`,
    java: `class Solution {
    public int longestQuietRun(int[] levels, int limit) {
        int best = 0, current = 0;
        for (int level : levels) {
            current = level <= limit ? current + 1 : 0;
            best = Math.max(best, current);
        }
        return best;
    }
}
`,
  },
});

// 2 ─ Badge Collisions ───────────────────────────────────────────────────────
problems.push({
  meta: meta("badge-collisions", "Badge Collisions", "Easy", ["hashing"], ["frequency-counting"], ["leetcode:1512"], "countSharedBadgePairs", [["badges", "string[]"]], "long"),
  statement: `At a hackathon every entry to the hall is logged by scanning a badge; \`badges[i]\` is the code read on the \`i\`-th scan. Two scans **collide** when they read the same code.

Return the number of pairs of scans \`(i, j)\` with \`i < j\` that collide.

## Constraints

- \`1 ≤ badges.length ≤ 10^5\`
- \`1 ≤ badges[i].length ≤ 8\`
- \`badges[i]\` contains only lowercase letters and digits.
`,
  hints: `1. Comparing every pair is too slow for 100,000 scans. What do two colliding scans have in common?
2. Group scans by code. A code that appears \`c\` times forms \`c × (c − 1) / 2\` pairs.
3. You can also add up the answer while scanning: each new scan collides with every earlier scan of the same code.
4. The answer can be larger than 2^31 − 1. Pick an integer type that holds it.
`,
  editorial: `## Approach: count codes in a hash map

Walk the scans in order and keep \`seen[code]\`, how many earlier scans had this code. The new scan collides with each of them, so add \`seen[code]\` to the answer, then increment it.

## Complexity

| | |
| --- | --- |
| Time | O(n · L): one hash-map update per scan, where L ≤ 8 is the code length |
| Space | O(n) for the map |

## Common mistakes

- Overflow: 100,000 scans of one code give 4,999,950,000 pairs, more than a 32-bit \`int\` holds (hidden test: every scan has the same code). Use \`long\` / \`long long\` for the total.
- Counting ordered pairs (adding \`c × (c − 1)\`) doubles the answer.
`,
  oracle: ([badges]) => {
    if (badges.length <= 3000) { let c = 0; for (let i = 0; i < badges.length; i++) for (let j = i + 1; j < badges.length; j++) if (badges[i] === badges[j]) c++; return c; }
    const m = new Map(); for (const b of badges) m.set(b, (m.get(b) ?? 0) + 1);
    let c = 0; for (const v of m.values()) c += (v * (v - 1)) / 2; return c;
  },
  publicTests: [{ args: [["a7", "b2", "a7", "c1", "a7"]], explain: "Code a7 appears on scans 0, 2 and 4, which gives the pairs (0, 2), (0, 4) and (2, 4). No other code repeats." }, { args: [["x", "y"]] }],
  hidden: () => [
    [["q"]], [["zz", "zz"]], [["a", "b", "c", "d"]], [["k", "k", "k", "k", "k", "k"]], [["ab", "ba", "ab"]], [["1", "01", "1", "001"]],
    [Array.from({ length: 40 }, () => word("ab", 1, 2))], [Array.from({ length: 500 }, () => word("abc12", 1, 3))], [Array.from({ length: 2500 }, () => word(LOWER, 1, 2))],
    [Array.from({ length: 100000 }, () => "d")],
    [Array.from({ length: 3000 }, () => word("ab0", 1, 2))],
  ],
  solutions: {
    js: `function countSharedBadgePairs(badges) {
  const seen = new Map();
  let pairs = 0;
  for (const code of badges) {
    const earlier = seen.get(code) ?? 0;
    pairs += earlier;
    seen.set(code, earlier + 1);
  }
  return pairs;
}
`,
    py: `class Solution:
    def countSharedBadgePairs(self, badges: list[str]) -> int:
        seen: dict[str, int] = {}
        pairs = 0
        for code in badges:
            earlier = seen.get(code, 0)
            pairs += earlier
            seen[code] = earlier + 1
        return pairs
`,
    cpp: `#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    long long countSharedBadgePairs(vector<string>& badges) {
        unordered_map<string, long long> seen;
        long long pairs = 0;
        for (const string& code : badges) {
            long long& earlier = seen[code];
            pairs += earlier;
            earlier++;
        }
        return pairs;
    }
};
`,
    java: `import java.util.HashMap;

class Solution {
    public long countSharedBadgePairs(String[] badges) {
        HashMap<String, Long> seen = new HashMap<>();
        long pairs = 0;
        for (String code : badges) {
            long earlier = seen.getOrDefault(code, 0L);
            pairs += earlier;
            seen.put(code, earlier + 1);
        }
        return pairs;
    }
}
`,
  },
});

// 3 ─ Pair Budget ────────────────────────────────────────────────────────────
const sortedArr = (n, a, b) => sorted(arr(n, a, b));
problems.push({
  meta: meta("pair-budget", "Pair Budget", "Medium", ["two-pointers"], ["two-pointers"], ["leetcode:2824"], "countAffordablePairs", [["prices", "int[]"], ["budget", "int"]], "long"),
  statement: `A gift shop lists its prices in non-decreasing order: \`prices[0] ≤ prices[1] ≤ …\`. You want to buy two different items and spend at most \`budget\` in total.

Return the number of index pairs \`(i, j)\` with \`i < j\` such that \`prices[i] + prices[j] ≤ budget\`.

## Constraints

- \`2 ≤ prices.length ≤ 10^5\`
- \`1 ≤ prices[i] ≤ 2 × 10^9\`, and \`prices\` is sorted in non-decreasing order
- \`1 ≤ budget ≤ 2 × 10^9\`
`,
  hints: `1. Checking all pairs is O(n²), too slow for 10^5 prices. Use the fact that the list is sorted.
2. Put one pointer on the cheapest item and one on the most expensive. What does it tell you if they fit the budget together?
3. If \`prices[lo] + prices[hi] ≤ budget\`, then \`lo\` pairs with every index from \`lo + 1\` to \`hi\`. Count them all at once and move \`lo\` right. Otherwise move \`hi\` left.
4. Two prices can add up to 4 × 10^9, which overflows a 32-bit \`int\`.
`,
  editorial: `## Approach: two pointers from both ends

Start with \`lo = 0\` and \`hi = n − 1\`.

- If \`prices[lo] + prices[hi] ≤ budget\`, then \`prices[lo]\` also fits with every cheaper item between them, which is \`hi − lo\` pairs. Add them and move \`lo\` right.
- Otherwise \`prices[hi]\` is too expensive to pair with anything left, so move \`hi\` left.

Each step moves one pointer, so the loop runs at most n times.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Adding two \`int\` prices: 2 × 10^9 + 2 × 10^9 overflows to a negative number that looks affordable (hidden test: two prices of 2 × 10^9 with a budget of 2 × 10^9, answer 0). Add them as 64-bit integers.
- The count can reach about 5 × 10^9 (10^5 items priced 1), so the total needs \`long\` too.
- Counting \`(i, i)\` or both \`(i, j)\` and \`(j, i)\`.
`,
  oracle: ([p, b]) => {
    if (p.length <= 3000) { let c = 0; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] + p[j] <= b) c++; return c; }
    // Independent method for large inputs: for each i, binary search the last j with p[i] + p[j] <= b.
    let c = 0;
    for (let i = 0; i < p.length; i++) { let lo = i + 1, hi = p.length; while (lo < hi) { const m = (lo + hi) >> 1; if (p[i] + p[m] <= b) lo = m + 1; else hi = m; } c += lo - (i + 1); }
    return c;
  },
  publicTests: [{ args: [[1, 2, 3, 4, 5], 6], explain: "The pairs that fit are (1, 2), (1, 3), (1, 4), (1, 5), (2, 3) and (2, 4) by price." }, { args: [[3, 3, 3], 5] }],
  hidden: () => [
    [[1, 1], 2], [[1, 1], 1], [[2000000000, 2000000000], 2000000000], [[1500000000, 2000000000], 2000000000], [[1000000000, 1000000000], 2000000000], [[2, 2, 2, 2], 4],
    [[1, 5, 9, 13], 14], [sortedArr(12, 1, 20), 18], [sortedArr(300, 1, 1000), 900], [sortedArr(3000, 1, 1000000000), 1000000000],
    [Array.from({ length: 100000 }, () => 1), 2],
    [sortedArr(3000, 1, 1000), 1500],
  ],
  solutions: {
    js: `function countAffordablePairs(prices, budget) {
  let lo = 0;
  let hi = prices.length - 1;
  let pairs = 0;
  while (lo < hi) {
    if (prices[lo] + prices[hi] <= budget) {
      pairs += hi - lo;
      lo++;
    } else {
      hi--;
    }
  }
  return pairs;
}
`,
    py: `class Solution:
    def countAffordablePairs(self, prices: list[int], budget: int) -> int:
        lo, hi = 0, len(prices) - 1
        pairs = 0
        while lo < hi:
            if prices[lo] + prices[hi] <= budget:
                pairs += hi - lo
                lo += 1
            else:
                hi -= 1
        return pairs
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    long long countAffordablePairs(vector<int>& prices, int budget) {
        int lo = 0, hi = (int)prices.size() - 1;
        long long pairs = 0;
        while (lo < hi) {
            if ((long long)prices[lo] + prices[hi] <= budget) {
                pairs += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return pairs;
    }
};
`,
    java: `class Solution {
    public long countAffordablePairs(int[] prices, int budget) {
        int lo = 0, hi = prices.length - 1;
        long pairs = 0;
        while (lo < hi) {
            if ((long) prices[lo] + prices[hi] <= budget) {
                pairs += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return pairs;
    }
}
`,
  },
});

// 4 ─ Best Window ────────────────────────────────────────────────────────────
problems.push({
  meta: meta("best-window", "Best Window", "Easy", ["sliding-window"], ["sliding-window"], ["leetcode:643"], "maxWindowSum", [["readings", "int[]"], ["k", "int"]], "long"),
  statement: `A solar panel reports its net output once a minute; \`readings[i]\` can be negative when the panel draws more than it makes.

Return the largest total of any \`k\` consecutive readings.

## Constraints

- \`1 ≤ k ≤ readings.length ≤ 10^5\`
- \`−10^4 ≤ readings[i] ≤ 10^4\`
`,
  hints: `1. Re-adding \`k\` readings for every window is O(n · k). How do two neighbouring windows differ?
2. Moving the window one step right adds one reading and removes one.
3. Start the best total from the first window's sum, not from 0: every window may be negative.
`,
  editorial: `## Approach: fixed-size sliding window

Sum the first \`k\` readings; that is the first window and the starting \`best\`. Then for each \`i\` from \`k\` to \`n − 1\`, add \`readings[i]\` and subtract \`readings[i − k]\`, and update \`best\`.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Initialising \`best = 0\`: when every reading is negative the answer is negative (hidden test: all readings negative).
- Off-by-one when sliding: the reading that leaves is \`readings[i − k]\`, not \`readings[i − k − 1]\`.
`,
  oracle: ([r, k]) => {
    if ((r.length - k + 1) * k <= 4e6) { let best = -Infinity; for (let i = 0; i + k <= r.length; i++) { let s = 0; for (let j = i; j < i + k; j++) s += r[j]; best = Math.max(best, s); } return best; }
    const pre = [0]; for (const x of r) pre.push(pre[pre.length - 1] + x);
    let best = -Infinity; for (let i = k; i <= r.length; i++) best = Math.max(best, pre[i] - pre[i - k]); return best;
  },
  publicTests: [{ args: [[2, -1, 3, 5, -2, 4], 3], explain: "The windows total 4, 7, 6 and 7. The best is 7, reached twice." }, { args: [[-5, -2, -9], 2] }],
  hidden: () => [
    [[7], 1], [[-3], 1], [[-4, -1, -7, -2], 1], [[-4, -1, -7, -2], 4], [[1, 2, 3], 3], [[0, 0, 0, 0], 2],
    [[10000, -10000, 10000, -10000, 10000], 2], [arr(50, -20, 20), 7], [arr(2000, -10000, 10000), 300],
    [arr(3000, -10000, 10000), 1], [arr(3000, -50, 50), 2999], [arr(100000, -99, 99), 50000],
  ],
  solutions: {
    js: `function maxWindowSum(readings, k) {
  let window = 0;
  for (let i = 0; i < k; i++) window += readings[i];
  let best = window;
  for (let i = k; i < readings.length; i++) {
    window += readings[i] - readings[i - k];
    if (window > best) best = window;
  }
  return best;
}
`,
    py: `class Solution:
    def maxWindowSum(self, readings: list[int], k: int) -> int:
        window = sum(readings[:k])
        best = window
        for i in range(k, len(readings)):
            window += readings[i] - readings[i - k]
            best = max(best, window)
        return best
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long maxWindowSum(vector<int>& readings, int k) {
        long long window = 0;
        for (int i = 0; i < k; i++) window += readings[i];
        long long best = window;
        for (int i = k; i < (int)readings.size(); i++) {
            window += readings[i] - readings[i - k];
            best = max(best, window);
        }
        return best;
    }
};
`,
    java: `class Solution {
    public long maxWindowSum(int[] readings, int k) {
        long window = 0;
        for (int i = 0; i < k; i++) window += readings[i];
        long best = window;
        for (int i = k; i < readings.length; i++) {
            window += readings[i] - readings[i - k];
            best = Math.max(best, window);
        }
        return best;
    }
}
`,
  },
});

// 5 ─ Playlist Without Repeats ───────────────────────────────────────────────
problems.push({
  meta: meta("playlist-without-repeats", "Playlist Without Repeats", "Medium", ["sliding-window", "hashing"], ["sliding-window"], ["leetcode:3"], "longestUniqueStretch", [["songs", "int[]"]], "int"),
  statement: `A radio station logs the id of every song it plays, in order; \`songs[i]\` is the \`i\`-th play.

Return the length of the longest stretch of consecutive plays in which no song id appears twice.

## Constraints

- \`1 ≤ songs.length ≤ 10^5\`
- \`1 ≤ songs[i] ≤ 10^9\`
`,
  hints: `1. Keep a window \`[left, right]\` with no repeats and grow it one play at a time.
2. When \`songs[right]\` is already in the window, the window must start after that song's previous play.
3. Remember the last index of every id. The new \`left\` is \`max(left, last[id] + 1)\`; it must never move backwards.
`,
  editorial: `## Approach: variable sliding window with last-seen positions

Scan with \`right\` from 0 to n − 1 and keep \`last[id]\`, the most recent index where each id was played. Before adding \`songs[right]\`, if its last play is inside the window, move \`left\` to \`last[id] + 1\`. The window \`[left, right]\` then has no repeats; record its length.

## Complexity

| | |
| --- | --- |
| Time | O(n) expected, with a hash map |
| Space | O(n) |

## Common mistakes

- Setting \`left = last[id] + 1\` without \`max\`: an id last seen before the window pulls \`left\` backwards and lets a repeat back in (hidden test: \`[1, 2, 2, 1]\`, answer 2).
- Clearing the whole set and restarting at \`right\`: that drops plays that are still valid.
`,
  oracle: ([s]) => {
    if (s.length <= 3000) { let best = 0; for (let i = 0; i < s.length; i++) { const seen = new Set(); let j = i; while (j < s.length && !seen.has(s[j])) seen.add(s[j++]); best = Math.max(best, j - i); } return best; }
    // Independent method: two pointers with a counting map, shrinking one step at a time.
    const cnt = new Map(); let best = 0, l = 0;
    for (let r = 0; r < s.length; r++) { cnt.set(s[r], (cnt.get(s[r]) ?? 0) + 1); while (cnt.get(s[r]) > 1) { cnt.set(s[l], cnt.get(s[l]) - 1); l++; } best = Math.max(best, r - l + 1); }
    return best;
  },
  publicTests: [{ args: [[4, 7, 4, 9, 7, 1]], explain: "Plays 2 to 5 (4, 9, 7, 1) have no repeat. Every stretch of five plays repeats a song." }, { args: [[5, 5, 5]] }],
  hidden: () => [
    [[42]], [[1, 2, 2, 1]], [[1, 2, 3, 4, 5]], [[3, 1, 3, 1, 3]], [[1, 2, 1, 3, 2, 4, 5, 1]], [[1000000000, 1, 1000000000]],
    [arr(40, 1, 6)], [arr(2000, 1, 300)], [arr(3000, 1, 3000)],
    [arr(2500, 1, 50)], [arr(1500, 1, 1000000000)], [Array.from({ length: 100000 }, (_, i) => i + 1)],
  ],
  solutions: {
    js: `function longestUniqueStretch(songs) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < songs.length; right++) {
    const seenAt = last.get(songs[right]);
    if (seenAt !== undefined && seenAt >= left) left = seenAt + 1;
    last.set(songs[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
`,
    py: `class Solution:
    def longestUniqueStretch(self, songs: list[int]) -> int:
        last: dict[int, int] = {}
        left = best = 0
        for right, song in enumerate(songs):
            seen_at = last.get(song)
            if seen_at is not None and seen_at >= left:
                left = seen_at + 1
            last[song] = right
            best = max(best, right - left + 1)
        return best
`,
    cpp: `#include <algorithm>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    int longestUniqueStretch(vector<int>& songs) {
        unordered_map<int, int> last;
        last.reserve(songs.size() * 2);
        int left = 0, best = 0;
        for (int right = 0; right < (int)songs.size(); right++) {
            auto it = last.find(songs[right]);
            if (it != last.end() && it->second >= left) left = it->second + 1;
            last[songs[right]] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};
`,
    java: `import java.util.HashMap;

class Solution {
    public int longestUniqueStretch(int[] songs) {
        HashMap<Integer, Integer> last = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < songs.length; right++) {
            Integer seenAt = last.get(songs[right]);
            if (seenAt != null && seenAt >= left) left = seenAt + 1;
            last.put(songs[right], right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
`,
  },
});

// 6 ─ Daily Pages ────────────────────────────────────────────────────────────
problems.push({
  meta: meta("daily-pages", "Daily Pages", "Medium", ["binary-search"], ["binary-search-on-answer"], ["leetcode:410", "gfg:allocate-minimum-number-of-pages"], "minDailyLoad", [["pages", "int[]"], ["days", "int"]], "long"),
  statement: `You will read a book's chapters in order; chapter \`i\` has \`pages[i]\` pages. Each day you read one or more whole chapters, continuing where you stopped, and you must finish within \`days\` days.

Return the smallest possible value of the most pages you read on any single day.

## Constraints

- \`1 ≤ pages.length ≤ 10^5\`
- \`1 ≤ pages[i] ≤ 10^4\`
- \`1 ≤ days ≤ pages.length\`
`,
  hints: `1. Flip the question: given a daily limit \`X\`, can you finish in \`days\` days?
2. With a fixed \`X\`, reading greedily (keep adding chapters until the next one would exceed \`X\`) uses the fewest days.
3. If limit \`X\` works, every larger limit works too. That makes the answer searchable with binary search.
4. The answer is at least the longest chapter and at most the total page count.
`,
  editorial: `## Approach: binary search on the daily limit

\`fits(X)\`: walk the chapters, adding each to today's total; when the next chapter would push today past \`X\`, start a new day. \`X\` works if this uses at most \`days\` days. Greedy is optimal for a fixed \`X\` because ending a day earlier never helps.

\`fits\` is monotonic, so binary search \`X\` between \`max(pages)\` and \`sum(pages)\` for the smallest value that fits.

## Complexity

| | |
| --- | --- |
| Time | O(n · log(sum)): about 30 greedy passes |
| Space | O(1) |

## Common mistakes

- Starting the search at 1 with a \`fits\` that never checks a single chapter against \`X\`: a chapter longer than \`X\` then looks fine (hidden test: \`[1, 100]\` in 2 days, answer 100).
- Returning the first \`X\` that fits in a linear scan from 1: correct but far too slow for 10^5 chapters of 10^4 pages.
`,
  oracle: ([p, d]) => {
    if (p.length <= 12) {
      let best = Infinity;
      const go = (i, used, mx) => { if (i === p.length) { best = Math.min(best, mx); return; } if (used === d) return; let s = 0; for (let j = i; j < p.length; j++) { s += p[j]; go(j + 1, used + 1, Math.max(mx, s)); } };
      go(0, 0, 0); return best;
    }
    // Independent method: binary search with a separate greedy written as a count of "day breaks".
    const total = p.reduce((a, b) => a + b, 0); let lo = Math.max(...p), hi = total;
    const daysNeeded = (x) => { let n = 1, s = 0; for (const v of p) { if (s + v > x) { n++; s = 0; } s += v; } return n; };
    while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (daysNeeded(m) <= d) hi = m; else lo = m + 1; }
    return lo;
  },
  publicTests: [{ args: [[30, 10, 40, 20, 50], 3], explain: "Read 30 + 10 on day 1, 40 + 20 on day 2 and 50 on day 3. The busiest day has 60 pages; no split into 3 days does better." }, { args: [[7, 2, 9], 3] }],
  hidden: () => [
    [[5], 1], [[1, 100], 2], [[1, 100], 1], [[4, 4, 4, 4], 2], [[4, 4, 4, 4], 4], [[10, 1, 1, 1, 1, 1], 2],
    [arr(8, 1, 50), 3], [arr(12, 1, 10000), 5], [arr(500, 1, 10000), 40],
    [arr(3000, 1, 10000), 1], [arr(3000, 1, 10000), 3000], [arr(100000, 1, 99), 777],
  ],
  solutions: {
    js: `function minDailyLoad(pages, days) {
  const fits = (limit) => {
    let used = 1;
    let today = 0;
    for (const p of pages) {
      if (today + p > limit) {
        used++;
        today = 0;
      }
      today += p;
    }
    return used <= days;
  };
  let lo = Math.max(...pages);
  let hi = pages.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
`,
    py: `class Solution:
    def minDailyLoad(self, pages: list[int], days: int) -> int:
        def fits(limit: int) -> bool:
            used, today = 1, 0
            for p in pages:
                if today + p > limit:
                    used += 1
                    today = 0
                today += p
            return used <= days

        lo, hi = max(pages), sum(pages)
        while lo < hi:
            mid = (lo + hi) // 2
            if fits(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    cpp: `#include <algorithm>
#include <numeric>
#include <vector>
using namespace std;

class Solution {
public:
    long long minDailyLoad(vector<int>& pages, int days) {
        auto fits = [&](long long limit) {
            int used = 1;
            long long today = 0;
            for (int p : pages) {
                if (today + p > limit) {
                    used++;
                    today = 0;
                }
                today += p;
            }
            return used <= days;
        };
        long long lo = *max_element(pages.begin(), pages.end());
        long long hi = accumulate(pages.begin(), pages.end(), 0LL);
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            if (fits(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
`,
    java: `class Solution {
    public long minDailyLoad(int[] pages, int days) {
        long lo = 0, hi = 0;
        for (int p : pages) {
            lo = Math.max(lo, p);
            hi += p;
        }
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (fits(pages, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean fits(int[] pages, int days, long limit) {
        int used = 1;
        long today = 0;
        for (int p : pages) {
            if (today + p > limit) {
                used++;
                today = 0;
            }
            today += p;
        }
        return used <= days;
    }
}
`,
  },
});

// 7 ─ Ticket Window ──────────────────────────────────────────────────────────
problems.push({
  meta: meta("ticket-window", "Ticket Window", "Easy", ["binary-search"], ["binary-search"], [], "countOpenedBy", [["times", "int[]"], ["queries", "int[]"]], "int[]"),
  statement: `A help desk records the minute each support ticket was opened. \`times\` is sorted in non-decreasing order, and several tickets can open in the same minute.

For each \`queries[j]\`, count the tickets opened at or before minute \`queries[j]\`. Return the counts in the same order as \`queries\`.

## Constraints

- \`1 ≤ times.length, queries.length ≤ 10^5\`
- \`0 ≤ times[i], queries[j] ≤ 10^9\`, and \`times\` is sorted in non-decreasing order
- \`queries\` is in any order.
`,
  hints: `1. Scanning \`times\` for every query is O(n · q), up to 10^10 steps.
2. In a sorted list, the tickets opened at or before \`q\` form a prefix. You need the length of that prefix.
3. Binary search for the first time that is **greater** than \`q\`; its index is the count. Tickets opened exactly at \`q\` must be included.
`,
  editorial: `## Approach: upper-bound binary search per query

For a query \`q\`, find the first index \`i\` with \`times[i] > q\` (the "upper bound"). Every ticket before \`i\` opened at or before \`q\`, so the answer is \`i\`.

Keep \`lo = 0\`, \`hi = n\`. While \`lo < hi\`, look at \`mid\`: if \`times[mid] ≤ q\`, the boundary is to the right (\`lo = mid + 1\`); otherwise \`hi = mid\`.

## Complexity

| | |
| --- | --- |
| Time | O((n + q) · log n): q binary searches |
| Space | O(1) besides the output |

## Common mistakes

- Searching for the first time \`≥ q\` (lower bound): tickets opened exactly at minute \`q\` are then missed (hidden test: many tickets share the queried minute).
- Sorting \`queries\` and returning answers in sorted order instead of the original order.
`,
  oracle: ([t, q]) => {
    if (t.length * q.length <= 4e6) return q.map((x) => t.filter((v) => v <= x).length);
    // Independent method: offline merge over sorted queries.
    const order = q.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]); const out = new Array(q.length); let i = 0;
    for (const [x, j] of order) { while (i < t.length && t[i] <= x) i++; out[j] = i; }
    return out;
  },
  publicTests: [{ args: [[1, 3, 3, 7], [0, 3, 5, 10]], explain: "No ticket opened by minute 0. Three opened by minute 3 (both tickets at minute 3 count), still three by minute 5, and all four by minute 10." }, { args: [[5], [5, 4]] }],
  hidden: () => [
    [[0], [0]], [[0], [1000000000]], [[10, 20, 30], [5, 10, 15, 30, 31]], [[4, 4, 4, 4, 4], [3, 4, 5]], [[1, 2, 3], [3, 2, 1, 0]],
    [[1000000000], [999999999, 1000000000]], [sortedArr(20, 0, 30), arr(15, 0, 35)], [sortedArr(1000, 0, 500), arr(1000, 0, 520)],
    [sortedArr(2000, 0, 1000000000), arr(2000, 0, 1000000000)],
    [sortedArr(3000, 0, 100), arr(3000, 0, 110)],
    [Array.from({ length: 100000 }, () => 7), arr(20000, 0, 14)],
  ],
  solutions: {
    js: `function countOpenedBy(times, queries) {
  const upperBound = (q) => {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= q) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return queries.map(upperBound);
}
`,
    py: `from bisect import bisect_right


class Solution:
    def countOpenedBy(self, times: list[int], queries: list[int]) -> list[int]:
        return [bisect_right(times, q) for q in queries]
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> countOpenedBy(vector<int>& times, vector<int>& queries) {
        vector<int> counts;
        counts.reserve(queries.size());
        for (int q : queries) {
            counts.push_back((int)(upper_bound(times.begin(), times.end(), q) - times.begin()));
        }
        return counts;
    }
};
`,
    java: `class Solution {
    public int[] countOpenedBy(int[] times, int[] queries) {
        int[] counts = new int[queries.length];
        for (int j = 0; j < queries.length; j++) {
            int lo = 0, hi = times.length;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (times[mid] <= queries[j]) lo = mid + 1;
                else hi = mid;
            }
            counts[j] = lo;
        }
        return counts;
    }
}
`,
  },
});

// 8 ─ Price Alert ────────────────────────────────────────────────────────────
problems.push({
  meta: meta("price-alert", "Price Alert", "Medium", ["stacks-and-queues"], ["monotonic-stack"], ["leetcode:739"], "nextHigherPriceDay", [["prices", "int[]"]], "int[]"),
  statement: `A price tracker records one closing price per day; \`prices[i]\` is day \`i\`. For each day, the tracker wants to know the first later day on which the price is **strictly higher**.

Return an array where entry \`i\` is that day's index, or \`-1\` if the price never goes higher after day \`i\`.

## Constraints

- \`1 ≤ prices.length ≤ 10^5\`
- \`1 ≤ prices[i] ≤ 10^9\`
`,
  hints: `1. Looking ahead from every day is O(n²) when prices keep falling.
2. Walk the days in order and keep the days that are still waiting for a higher price. What order are their prices in?
3. The waiting prices never increase from bottom to top of a stack. A new day answers every waiting day with a lower price, popping them from the top.
`,
  editorial: `## Approach: monotonic stack of waiting days

Keep a stack of day indices still waiting for a higher price. For each day \`i\`:

1. While the stack's top day has a price **lower** than \`prices[i]\`, pop it and set its answer to \`i\`.
2. Push \`i\`.

Days left on the stack at the end get \`-1\`. Each day is pushed and popped at most once.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) for the stack |

## Common mistakes

- Popping on \`≤\` instead of \`<\`: an equal price is not higher (hidden test: runs of equal prices).
- The nested "look ahead" loop is O(n²) on a falling market (hidden test: 10^5 strictly decreasing prices).
`,
  oracle: ([p]) => {
    if (p.length <= 3000) return p.map((v, i) => { for (let j = i + 1; j < p.length; j++) if (p[j] > v) return j; return -1; });
    // Independent method: scan right to left keeping candidate indices.
    const out = new Array(p.length).fill(-1); const st = [];
    for (let i = p.length - 1; i >= 0; i--) { while (st.length && p[st[st.length - 1]] <= p[i]) st.pop(); out[i] = st.length ? st[st.length - 1] : -1; st.push(i); }
    return out;
  },
  publicTests: [{ args: [[3, 1, 4, 1, 5]], explain: "Day 0 (3) and day 1 (1) are first beaten on day 2 (4). Days 2 and 3 are beaten on day 4 (5). Nothing beats day 4." }, { args: [[5, 5, 4]] }],
  hidden: () => [
    [[9]], [[1, 2]], [[2, 1]], [[2, 2, 2, 3]], [[5, 4, 3, 2, 1, 6]], [[1, 3, 2, 3, 1, 3]],
    [arr(30, 1, 5)], [arr(2000, 1, 50)], [arr(3000, 1, 1000000000)],
    [Array.from({ length: 3000 }, () => int(1, 3))], [Array.from({ length: 3000 }, (_, i) => 3000 - i)], [Array.from({ length: 100000 }, (_, i) => 100000 - i)],
  ],
  solutions: {
    js: `function nextHigherPriceDay(prices) {
  const answer = new Array(prices.length).fill(-1);
  const waiting = [];
  for (let i = 0; i < prices.length; i++) {
    while (waiting.length && prices[waiting[waiting.length - 1]] < prices[i]) {
      answer[waiting.pop()] = i;
    }
    waiting.push(i);
  }
  return answer;
}
`,
    py: `class Solution:
    def nextHigherPriceDay(self, prices: list[int]) -> list[int]:
        answer = [-1] * len(prices)
        waiting: list[int] = []
        for i, price in enumerate(prices):
            while waiting and prices[waiting[-1]] < price:
                answer[waiting.pop()] = i
            waiting.append(i)
        return answer
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> nextHigherPriceDay(vector<int>& prices) {
        vector<int> answer(prices.size(), -1);
        vector<int> waiting;
        for (int i = 0; i < (int)prices.size(); i++) {
            while (!waiting.empty() && prices[waiting.back()] < prices[i]) {
                answer[waiting.back()] = i;
                waiting.pop_back();
            }
            waiting.push_back(i);
        }
        return answer;
    }
};
`,
    java: `import java.util.ArrayDeque;
import java.util.Arrays;

class Solution {
    public int[] nextHigherPriceDay(int[] prices) {
        int[] answer = new int[prices.length];
        Arrays.fill(answer, -1);
        ArrayDeque<Integer> waiting = new ArrayDeque<>();
        for (int i = 0; i < prices.length; i++) {
            while (!waiting.isEmpty() && prices[waiting.peek()] < prices[i]) {
                answer[waiting.pop()] = i;
            }
            waiting.push(i);
        }
        return answer;
    }
}
`,
  },
});

// 9 ─ Undo and Redo ──────────────────────────────────────────────────────────
const actions = (n, pWord, pUndo, alpha = "abcde") => Array.from({ length: n }, () => { const r = R(); return r < pWord ? word(alpha, 1, 4) : r < pWord + pUndo ? "<" : ">"; });
problems.push({
  meta: meta("undo-and-redo", "Undo and Redo", "Medium", ["stacks-and-queues"], ["stack"], [], "finalDocument", [["actions", "string[]"]], "string"),
  statement: `A tiny editor starts with an empty document. Each entry of \`actions\` is one of:

- a lowercase word: append it to the end of the document;
- \`"<"\`: **undo** the most recent append that is still in the document;
- \`">"\`: **redo** the most recently undone append.

Appending a new word clears everything that could be redone. An undo with nothing to undo, or a redo with nothing to redo, does nothing.

Return the final document as its words joined by single spaces, or an empty string if it has no words.

## Constraints

- \`1 ≤ actions.length ≤ 10^5\`
- Each action is \`"<"\`, \`">"\`, or a word of 1 to 4 lowercase letters.
`,
  hints: `1. Undo always removes the last word, so the document behaves like a stack.
2. Keep a second stack of undone words. Undo moves a word from the document to it; redo moves it back.
3. What must happen to the redo stack when a new word is typed?
`,
  editorial: `## Approach: two stacks

- Word: push it onto \`document\` and **clear** \`redo\`.
- \`<\`: if \`document\` is not empty, pop its last word and push it onto \`redo\`.
- \`>\`: if \`redo\` is not empty, pop its last word and push it onto \`document\`.

At the end, join \`document\` with spaces.

## Complexity

| | |
| --- | --- |
| Time | O(n + total output length) |
| Space | O(n) |

## Common mistakes

- Not clearing the redo stack on a new word: \`["a", "b", "<", "c", ">"]\` must give \`"a c"\`, not \`"a c b"\` (hidden test).
- Saving a full copy of the document for every action: O(n²) time and memory on long logs (hidden test: 10^5 actions).
`,
  oracle: ([acts]) => {
    // Straight simulation with explicit history snapshots on small inputs; plain two stacks on large ones.
    if (acts.length <= 2000) {
      const history = [[]]; let at = 0;
      for (const a of acts) { if (a === "<") { if (at > 0) at--; } else if (a === ">") { if (at < history.length - 1) at++; } else { history.length = at + 1; history.push([...history[at], a]); at++; } }
      return history[at].join(" ");
    }
    const doc = [], redo = [];
    for (const a of acts) { if (a === "<") { if (doc.length) redo.push(doc.pop()); } else if (a === ">") { if (redo.length) doc.push(redo.pop()); } else { doc.push(a); redo.length = 0; } }
    return doc.join(" ");
  },
  publicTests: [{ args: [["we", "ship", "<", "code", "<", ">"]], explain: "After \"we ship\", undo removes \"ship\". Typing \"code\" clears the redo history, so the last undo and redo remove and restore \"code\"." }, { args: [["<", ">", "hi"]] }],
  hidden: () => [
    [["solo"]], [["<"]], [[">", ">"]], [["a", "b", "<", "c", ">"]], [["a", "<", "<", ">", ">", ">"]], [["x", "y", "z", "<", "<", "<", ">", ">"]],
    [actions(30, 0.5, 0.3)], [actions(500, 0.4, 0.35)], [actions(2000, 0.34, 0.33)],
    [actions(3000, 0.45, 0.3)], [Array.from({ length: 100000 }, (_, i) => (i < 50000 ? "ab" : i < 75000 ? "<" : ">"))],
  ],
  solutions: {
    js: `function finalDocument(actions) {
  const document = [];
  const redo = [];
  for (const action of actions) {
    if (action === "<") {
      if (document.length) redo.push(document.pop());
    } else if (action === ">") {
      if (redo.length) document.push(redo.pop());
    } else {
      document.push(action);
      redo.length = 0;
    }
  }
  return document.join(" ");
}
`,
    py: `class Solution:
    def finalDocument(self, actions: list[str]) -> str:
        document: list[str] = []
        redo: list[str] = []
        for action in actions:
            if action == "<":
                if document:
                    redo.append(document.pop())
            elif action == ">":
                if redo:
                    document.append(redo.pop())
            else:
                document.append(action)
                redo.clear()
        return " ".join(document)
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string finalDocument(vector<string>& actions) {
        vector<string> document, redo;
        for (const string& action : actions) {
            if (action == "<") {
                if (!document.empty()) {
                    redo.push_back(document.back());
                    document.pop_back();
                }
            } else if (action == ">") {
                if (!redo.empty()) {
                    document.push_back(redo.back());
                    redo.pop_back();
                }
            } else {
                document.push_back(action);
                redo.clear();
            }
        }
        string result;
        for (size_t i = 0; i < document.size(); i++) {
            if (i) result += ' ';
            result += document[i];
        }
        return result;
    }
};
`,
    java: `import java.util.ArrayList;

class Solution {
    public String finalDocument(String[] actions) {
        ArrayList<String> document = new ArrayList<>();
        ArrayList<String> redo = new ArrayList<>();
        for (String action : actions) {
            if (action.equals("<")) {
                if (!document.isEmpty()) redo.add(document.remove(document.size() - 1));
            } else if (action.equals(">")) {
                if (!redo.isEmpty()) document.add(redo.remove(redo.size() - 1));
            } else {
                document.add(action);
                redo.clear();
            }
        }
        return String.join(" ", document);
    }
}
`,
  },
});

// 10 ─ Anagram Groups ────────────────────────────────────────────────────────
problems.push({
  meta: meta("anagram-groups", "Anagram Groups", "Easy", ["hashing", "arrays-and-strings"], ["frequency-counting"], ["leetcode:49"], "countAnagramGroups", [["words", "string[]"]], "int"),
  statement: `A word-game server wants to know how many distinct letter sets its players used. Two words belong to the same **group** when one is a rearrangement of the other's letters, using every letter the same number of times.

Return the number of groups among \`words\`. Repeated words belong to the same group.

## Constraints

- \`1 ≤ words.length ≤ 5 × 10^4\`
- \`1 ≤ words[i].length ≤ 12\`
- \`words[i]\` contains only lowercase letters.
`,
  hints: `1. You need a key that is identical for two words exactly when they are rearrangements of each other.
2. Sorting a word's letters gives such a key. So does a count of each of the 26 letters.
3. Put every key in a set; the answer is the set's size.
`,
  editorial: `## Approach: canonical key in a hash set

For each word, build a key that ignores letter order: either the word's letters sorted, or its 26 letter counts written out. Two words share a key exactly when they are anagrams. Add each key to a set and return its size.

## Complexity

| | |
| --- | --- |
| Time | O(n · L log L) with sorting (L ≤ 12), or O(n · (L + 26)) with counts |
| Space | O(n · L) for the set |

## Common mistakes

- Keys that are not unique, such as the sum of letter codes: \`"ad"\` and \`"bc"\` have the same sum but are different groups (hidden test).
- Comparing every pair of words: O(n²) comparisons time out on 5 × 10^4 words.
`,
  oracle: ([w]) => {
    const isAnagram = (a, b) => { if (a.length !== b.length) return false; const c = new Array(26).fill(0); for (const ch of a) c[ch.charCodeAt(0) - 97]++; for (const ch of b) c[ch.charCodeAt(0) - 97]--; return c.every((x) => x === 0); };
    if (w.length <= 1500) { const reps = []; for (const x of w) if (!reps.some((r) => isAnagram(r, x))) reps.push(x); return reps.length; }
    return new Set(w.map((x) => { const c = new Array(26).fill(0); for (const ch of x) c[ch.charCodeAt(0) - 97]++; return c.join(","); })).size;
  },
  publicTests: [{ args: [["listen", "silent", "enlist", "google", "gogole", "cat"]], explain: "listen, silent and enlist form one group, google and gogole a second, and cat a third." }, { args: [["a"]] }],
  hidden: () => [
    [["ad", "bc"]], [["abc", "abc", "cba"]], [["a", "aa", "aaa"]], [["ab", "ba", "abb", "bab", "bba"]], [["z"]], [["stop", "pots", "tops", "opts", "post", "spot"]],
    [Array.from({ length: 40 }, () => word("abc", 1, 3))], [Array.from({ length: 1200 }, () => word("abcde", 2, 5))], [Array.from({ length: 1500 }, () => word(LOWER, 1, 4))],
    [Array.from({ length: 1500 }, () => word(LOWER, 10, 12))], [Array.from({ length: 50000 }, () => word("abcd", 1, 6))],
  ],
  solutions: {
    js: `function countAnagramGroups(words) {
  const keys = new Set();
  for (const word of words) keys.add([...word].sort().join(""));
  return keys.size;
}
`,
    py: `class Solution:
    def countAnagramGroups(self, words: list[str]) -> int:
        return len({"".join(sorted(word)) for word in words})
`,
    cpp: `#include <algorithm>
#include <string>
#include <unordered_set>
#include <vector>
using namespace std;

class Solution {
public:
    int countAnagramGroups(vector<string>& words) {
        unordered_set<string> keys;
        for (string word : words) {
            sort(word.begin(), word.end());
            keys.insert(word);
        }
        return (int)keys.size();
    }
};
`,
    java: `import java.util.Arrays;
import java.util.HashSet;

class Solution {
    public int countAnagramGroups(String[] words) {
        HashSet<String> keys = new HashSet<>();
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            keys.add(new String(letters));
        }
        return keys.size();
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
