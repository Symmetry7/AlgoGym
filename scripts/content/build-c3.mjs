// Usage (from the repo root): node scripts/content/build-c3.mjs
// Writes the 15 C3 problems (binary search, stacks and queues, linked lists, recursion) to content/problems/<slug>/.
// Expected outputs of handwritten tests come from an independent oracle (brute force or a different method), and every
// JavaScript reference is checked against that oracle on all handwritten cases plus 300 random small ones before
// anything is written. Max-size tests come from each problem's tests/gen.mjs: run `npm run content:gen` afterwards,
// then `npm run content:validate` checks all 4 languages.
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { helpers } from "../../packages/judge/src/gen.mjs";
import { compare } from "../../packages/judge/src/judge.mjs";

const root = process.cwd();
const meta = ({ slug, title, difficulty, topics, patterns, similar, fn, params, returns, comparator = "exact" }) => ({
  $schema: "../meta.schema.json", slug, title, status: "draft", difficulty, category: "dsa", topics, patterns, similar_to: similar,
  signature: { function: fn, params: params.map(([name, type]) => ({ name, type })), returns },
  comparator, limits: { time_ms_per_case: 1000, max_total_ms: 10000, memory_mb: 256 }, is_pro: false, pool: "public", authors: ["algogym"], reviewers: [],
});

// Shared small-input helpers for the random checks.
const chain = (g, n) => { // a random single chain through all n nodes: { next, head }
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const next = Array(n).fill(-1);
  for (let i = 0; i + 1 < n; i++) next[order[i]] = order[i + 1];
  return { next, head: order[0] };
};
const walk = (next, head) => { const out = []; for (let c = head; c !== -1; c = next[c]) out.push(c); return out; };
const CHAIN_GEN = `const chain = (g, n) => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = g.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
  const next = Array(n).fill(-1);
  for (let i = 0; i + 1 < n; i++) next[order[i]] = order[i + 1];
  return { next, head: order[0] };
};`;

const P = [];

// ─── Binary search ──────────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "first-departure", title: "First Departure", difficulty: "Easy", topics: ["binary-search"], patterns: ["binary-search"], similar: ["leetcode:35"],
    fn: "firstDeparture", params: [["departures", "int[]"], ["arrival", "int"]], returns: "int" }),
  statement: `A railway enquiry screen lists the day's departures from one platform in time order. You reach the platform at minute \`arrival\` and will take the first train that leaves at that minute or later.

Given the sorted departure times \`departures\` and your arrival time \`arrival\`, return the index of the first departure at or after \`arrival\`. If every train has already left, return \`departures.length\`.

## Constraints

- \`1 ≤ departures.length ≤ 10^5\`
- \`0 ≤ departures[i] ≤ 10^9\`, sorted in non-decreasing order (several trains can share a minute)
- \`0 ≤ arrival ≤ 10^9\`
`,
  hints: `1. Scanning from the start works but is O(n). The list is sorted: what does one comparison in the middle tell you?
2. If \`departures[mid] < arrival\`, that train and every one before it has left. Otherwise \`mid\` might be the answer, but an earlier train could be too.
3. Keep a half-open range \`[lo, hi)\` that always contains the answer, starting with \`[0, n)\`, and stop when it is empty.
`,
  editorial: `## Approach: lower bound

The answer is the first index whose time is at least \`arrival\`. Everything before it is smaller, everything from it on is at least \`arrival\`, so the array splits into two runs and binary search finds the boundary.

Keep \`lo = 0\` and \`hi = n\`. While \`lo < hi\`, look at \`mid = (lo + hi) / 2\`. If \`departures[mid] < arrival\`, the boundary is to the right, so \`lo = mid + 1\`; otherwise \`hi = mid\`. When they meet, \`lo\` is the answer, and it is \`n\` when no train qualifies.

## Complexity

| | |
| --- | --- |
| Time | O(log n) |
| Space | O(1) |

## Common mistakes

- Returning as soon as \`departures[mid] == arrival\`: with several trains in the same minute that may not be the first one (hidden test: \`[1, 3, 3, 3, 9]\` with \`arrival = 3\` expects \`1\`).
- Searching in \`[0, n − 1]\` and forgetting the "all trains left" answer \`n\`.
`,
  solutions: {
    js: `function firstDeparture(departures, arrival) {
  let lo = 0;
  let hi = departures.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (departures[mid] < arrival) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
`,
    py: `class Solution:
    def firstDeparture(self, departures: list[int], arrival: int) -> int:
        lo, hi = 0, len(departures)
        while lo < hi:
            mid = (lo + hi) // 2
            if departures[mid] < arrival:
                lo = mid + 1
            else:
                hi = mid
        return lo
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int firstDeparture(vector<int>& departures, int arrival) {
        int lo = 0, hi = departures.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (departures[mid] < arrival) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};
`,
    java: `class Solution {
    public int firstDeparture(int[] departures, int arrival) {
        int lo = 0, hi = departures.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (departures[mid] < arrival) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
`,
  },
  oracle: (d, a) => { const i = d.findIndex((x) => x >= a); return i < 0 ? d.length : i; },
  public: [
    { args: [[540, 555, 570, 600, 630], 560], explain: "The 540 and 555 trains have left. The 570 train, at index 2, is the first you can catch." },
    { args: [[600, 600, 615], 600] },
  ],
  hidden: [[[5], 5], [[5], 6], [[5], 4], [[7, 7, 7, 7], 7], [[7, 7, 7], 8], [[1, 3, 3, 3, 9], 3], [[1, 3, 3, 3, 9], 4], [[0, 1000000000], 1000000000], [[1, 2, 3, 4, 5, 6], 0]],
  small: (g) => { const d = g.sorted(g.arr(g.int(1, 12), 0, 20)); return [d, g.int(0, 22)]; },
  gen: `export const seed = 3101;

export default (g) => {
  const n = 100000;
  const spread = g.sorted(g.arr(n, 0, 1000000000));
  const crowded = g.sorted(g.arr(n, 0, 1439));
  return [
    [spread, spread[n >> 1]],
    [crowded, 720],
    [Array(n).fill(1000000000), 1000000000],
    [spread, 1000000000],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "ration-counter", title: "Ration Counter", difficulty: "Medium", topics: ["binary-search"], patterns: ["binary-search-on-answer"], similar: ["leetcode:1011"],
    fn: "minCapacity", params: [["bags", "int[]"], ["days", "int"]], returns: "int" }),
  statement: `A ration shop must hand out its bags in the order they were packed. Each day the counter hands out bags one after another, but it stops for the day when the next bag would push the day's total weight above the counter's capacity. That bag waits for the next day.

Given the bag weights \`bags\` (in kilograms, in packing order) and the number of days \`days\`, return the smallest whole-number capacity that lets the shop hand out every bag within \`days\` days.

## Constraints

- \`1 ≤ days ≤ bags.length ≤ 5 × 10^4\`
- \`1 ≤ bags[i] ≤ 500\`
`,
  hints: `1. If a capacity works, any larger capacity works too. That one-way property means you can binary search on the answer.
2. For a fixed capacity, a single greedy pass counts the days needed: keep adding bags to today until the next one doesn't fit.
3. The capacity can't be below the heaviest bag, and the total weight always works. Search between those two.
`,
  editorial: `## Approach: binary search on the capacity

Write \`daysNeeded(c)\`: walk through the bags, adding each to today's load, and start a new day when the next bag would exceed \`c\`. Filling each day as much as possible is optimal, because pushing a bag to a later day never helps.

\`daysNeeded\` only goes down as \`c\` grows, so the valid capacities are exactly the ones from some smallest value upwards. Binary search for it between \`lo = max(bags)\` (every bag must fit on its own) and \`hi = sum(bags)\` (everything in one day). If \`daysNeeded(mid) ≤ days\`, then \`mid\` works and the answer is at most \`mid\`; otherwise it is above \`mid\`.

## Complexity

| | |
| --- | --- |
| Time | O(n log S), where S is the total weight |
| Space | O(1) |

## Common mistakes

- Starting the search at 1 instead of the heaviest bag: a capacity below one bag's weight can never hand that bag out, and a naive count treats it as "fits" (hidden test: \`[500, 1, 1, 1]\` over 4 days expects \`500\`).
- Linear search over capacities: up to 2.5 × 10^7 candidates times n is far too slow.
`,
  solutions: {
    js: `function minCapacity(bags, days) {
  let lo = 0;
  let hi = 0;
  for (const b of bags) {
    lo = Math.max(lo, b);
    hi += b;
  }
  const daysNeeded = (cap) => {
    let used = 1;
    let load = 0;
    for (const b of bags) {
      if (load + b > cap) {
        used++;
        load = 0;
      }
      load += b;
    }
    return used;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (daysNeeded(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
`,
    py: `class Solution:
    def minCapacity(self, bags: list[int], days: int) -> int:
        def days_needed(cap: int) -> int:
            used, load = 1, 0
            for b in bags:
                if load + b > cap:
                    used += 1
                    load = 0
                load += b
            return used

        lo, hi = max(bags), sum(bags)
        while lo < hi:
            mid = (lo + hi) // 2
            if days_needed(mid) <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& bags, int days) {
        int lo = 0, hi = 0;
        for (int b : bags) {
            lo = max(lo, b);
            hi += b;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(bags, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

private:
    int daysNeeded(const vector<int>& bags, int cap) {
        int used = 1, load = 0;
        for (int b : bags) {
            if (load + b > cap) {
                used++;
                load = 0;
            }
            load += b;
        }
        return used;
    }
};
`,
    java: `class Solution {
    public int minCapacity(int[] bags, int days) {
        int lo = 0, hi = 0;
        for (int b : bags) {
            lo = Math.max(lo, b);
            hi += b;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(bags, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private int daysNeeded(int[] bags, int cap) {
        int used = 1, load = 0;
        for (int b : bags) {
            if (load + b > cap) {
                used++;
                load = 0;
            }
            load += b;
        }
        return used;
    }
}
`,
  },
  oracle: (bags, days) => {
    for (let c = Math.max(...bags); ; c++) {
      let used = 1, load = 0;
      for (const b of bags) { if (load + b > c) { used++; load = 0; } load += b; }
      if (used <= days) return c;
    }
  },
  public: [
    { args: [[3, 2, 2, 4, 1, 4], 3], explain: "With capacity 6 the days are [3, 2], [2, 4] and [1, 4]. Capacity 5 would need four days: [3, 2], [2], [4, 1], [4]." },
    { args: [[1, 2, 3, 1, 1], 4] },
  ],
  hidden: [[[5], 1], [[1, 1, 1, 1], 4], [[1, 1, 1, 1], 1], [[10, 10, 10, 10, 10], 2], [[500, 1, 1, 1], 4], [[500, 1, 1, 1], 2], [[7, 2, 5, 10, 8], 2], [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], [[9, 1, 1, 1, 9], 3]],
  small: (g) => { const n = g.int(1, 10); return [g.arr(n, 1, 15), g.int(1, n)]; },
  gen: `export const seed = 3102;

export default (g) => {
  const n = 50000;
  return [
    [g.arr(n, 1, 500), 37],
    [g.arr(n, 1, 500), 1],
    [g.arr(n, 1, 500), n],
    [Array(n).fill(500), 7],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "rotated-timetable", title: "Rotated Timetable", difficulty: "Medium", topics: ["binary-search"], patterns: ["binary-search"], similar: ["leetcode:33"],
    fn: "findTrain", params: [["trains", "int[]"], ["target", "int"]], returns: "int" }),
  statement: `A station's display shows train numbers in increasing order, but it scrolls: it starts somewhere in the middle of the list, runs to the end, then wraps around to the beginning. The numbers are all different.

Given the display \`trains\` and a train number \`target\`, return the index where \`target\` appears, or \`-1\` if it isn't shown. Aim for O(log n) time.

## Constraints

- \`1 ≤ trains.length ≤ 10^5\`
- \`−10^9 ≤ trains[i], target ≤ 10^9\`, all values in \`trains\` distinct
- \`trains\` is a sorted array rotated by some amount (possibly zero)
`,
  hints: `1. Cut the array at any \`mid\`. At least one of the two halves is still sorted. How can you tell which one?
2. Compare \`trains[lo]\` with \`trains[mid]\`. If \`trains[lo] ≤ trains[mid]\`, the left half is sorted.
3. In the sorted half, a range check tells you whether \`target\` is there. If not, it must be in the other half.
`,
  editorial: `## Approach: binary search with a sorted half

At every step, either \`[lo, mid]\` or \`[mid, hi]\` is in increasing order, because the wrap-around point can only be on one side. If \`trains[lo] ≤ trains[mid]\`, the left half is sorted: if \`trains[lo] ≤ target < trains[mid]\` search left, otherwise search right. Otherwise the right half is sorted: if \`trains[mid] < target ≤ trains[hi]\` search right, otherwise left. Each step halves the range.

## Complexity

| | |
| --- | --- |
| Time | O(log n) |
| Space | O(1) |

## Common mistakes

- Using \`<\` instead of \`≤\` in \`trains[lo] ≤ trains[mid]\`: when \`lo == mid\` the one-element left half is sorted (hidden test: \`[3, 1]\` with \`target = 1\`).
- Finding the rotation point first and then forgetting the case with no rotation.
`,
  solutions: {
    js: `function findTrain(trains, target) {
  let lo = 0;
  let hi = trains.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (trains[mid] === target) return mid;
    if (trains[lo] <= trains[mid]) {
      if (trains[lo] <= target && target < trains[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (trains[mid] < target && target <= trains[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
`,
    py: `class Solution:
    def findTrain(self, trains: list[int], target: int) -> int:
        lo, hi = 0, len(trains) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if trains[mid] == target:
                return mid
            if trains[lo] <= trains[mid]:
                if trains[lo] <= target < trains[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if trains[mid] < target <= trains[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return -1
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int findTrain(vector<int>& trains, int target) {
        int lo = 0, hi = (int)trains.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (trains[mid] == target) return mid;
            if (trains[lo] <= trains[mid]) {
                if (trains[lo] <= target && target < trains[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (trains[mid] < target && target <= trains[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};
`,
    java: `class Solution {
    public int findTrain(int[] trains, int target) {
        int lo = 0, hi = trains.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (trains[mid] == target) return mid;
            if (trains[lo] <= trains[mid]) {
                if (trains[lo] <= target && target < trains[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (trains[mid] < target && target <= trains[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
`,
  },
  oracle: (t, x) => t.indexOf(x),
  public: [
    { args: [[12951, 12953, 22691, 10101, 11013, 12627], 11013], explain: "The display wrapped after 22691. Train 11013 is at index 4." },
    { args: [[4, 5, 6, 7, 0, 1, 2], 3] },
  ],
  hidden: [[[1], 1], [[1], 2], [[2, 1], 1], [[3, 1], 1], [[3, 1], 3], [[1, 2, 3, 4, 5], 5], [[1, 2, 3, 4, 5], 0], [[5, 1, 2, 3, 4], 5], [[2, 3, 4, 5, 1], 1], [[30, 40, 50, 10, 20], 35], [[-1000000000, 1000000000], 1000000000]],
  small: (g) => {
    const vals = [...new Set(g.arr(g.int(1, 12), -30, 30))].sort((a, b) => a - b);
    const k = g.int(0, vals.length - 1);
    return [[...vals.slice(k), ...vals.slice(0, k)], g.int(0, 1) ? g.pick(vals) : g.int(-31, 31)];
  },
  gen: `export const seed = 3103;

const rotatedDistinct = (g, n) => {
  const vals = [];
  let v = -1000000000;
  for (let i = 0; i < n; i++) { v += g.int(1, 19000); vals.push(v); }
  const k = g.int(0, n - 1);
  return [...vals.slice(k), ...vals.slice(0, k)];
};

export default (g) => {
  const n = 100000;
  const a = rotatedDistinct(g, n);
  const b = rotatedDistinct(g, n);
  return [
    [a, a[g.int(0, n - 1)]],
    [a, a[0] - 1],
    [b, b[n - 1]],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "square-plot", title: "Square Plot", difficulty: "Easy", topics: ["binary-search"], patterns: ["binary-search-on-answer"], similar: ["leetcode:69"],
    fn: "largestSide", params: [["area", "long"]], returns: "long" }),
  statement: `A farmer has enough tiles to cover \`area\` square metres and wants to tile a square plot whose side is a whole number of metres.

Given \`area\`, return the largest side length \`s\` with \`s × s ≤ area\`. Don't use a built-in square-root function.

## Constraints

- \`0 ≤ area ≤ 10^15\`
`,
  hints: `1. Trying \`s = 0, 1, 2, …\` works but takes up to 3 × 10^7 steps. Can you halve the candidates each time?
2. \`s × s ≤ area\` is true for every \`s\` up to the answer and false after it: binary search for the last true.
3. Watch the multiplication: \`s × s\` near \`3 × 10^7\` is about \`10^15\`, which overflows a 32-bit integer.
`,
  editorial: `## Approach: binary search on the side

The predicate \`s × s ≤ area\` holds for \`s = 0, 1, …, answer\` and fails after that. Search \`s\` in \`[0, min(area, 31622777)]\` (31622777² already exceeds \`10^15\`). With \`mid\` rounded up, keep \`lo = mid\` when \`mid × mid ≤ area\`, otherwise \`hi = mid − 1\`. Use 64-bit integers for the product.

## Complexity

| | |
| --- | --- |
| Time | O(log area) |
| Space | O(1) |

## Common mistakes

- Squaring in 32-bit integers: \`mid × mid\` overflows for large areas (hidden test: \`area = 10^15\` expects \`31622776\`).
- Rounding \`mid\` down with \`lo = mid\`: the loop never ends when \`hi = lo + 1\`.
- Floating-point square roots can be off by one just below a perfect square (hidden test: \`999999961946175\`).
`,
  solutions: {
    js: `function largestSide(area) {
  let lo = 0;
  let hi = Math.min(area, 31622777);
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (mid * mid <= area) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
`,
    py: `class Solution:
    def largestSide(self, area: int) -> int:
        lo, hi = 0, min(area, 31622777)
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if mid * mid <= area:
                lo = mid
            else:
                hi = mid - 1
        return lo
`,
    cpp: `#include <algorithm>
using namespace std;

class Solution {
public:
    long long largestSide(long long area) {
        long long lo = 0, hi = min(area, 31622777LL);
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            if (mid * mid <= area) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
};
`,
    java: `class Solution {
    public long largestSide(long area) {
        long lo = 0, hi = Math.min(area, 31622777L);
        while (lo < hi) {
            long mid = (lo + hi + 1) / 2;
            if (mid * mid <= area) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
}
`,
  },
  oracle: (area) => {
    const a = BigInt(area);
    let s = BigInt(Math.floor(Math.sqrt(area)));
    while ((s + 1n) * (s + 1n) <= a) s++;
    while (s * s > a) s--;
    return Number(s);
  },
  public: [
    { args: [20], explain: "A 4 × 4 plot uses 16 tiles; 5 × 5 would need 25." },
    { args: [49] },
  ],
  hidden: [[0], [1], [2], [3], [4], [8], [9], [15], [16], [1000000000000000], [999999961946176], [999999961946175], [2147395599], [2147395600]],
  small: (g) => [g.int(0, 5000)],
  gen: `export const seed = 3104;

export default (g) => [
  [g.int(900000000, 999999999) * 1000000 + g.int(0, 999999)],
  [g.int(1, 99999999) * 10000000],
];
`,
});

// ─── Stacks and queues ──────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "bracket-log", title: "Bracket Log", difficulty: "Easy", topics: ["stacks-and-queues"], patterns: ["stack"], similar: ["leetcode:20"],
    fn: "isBalanced", params: [["log", "string"]], returns: "bool" }),
  statement: `A code formatter strips everything except brackets from a file and writes the rest to a log, so the log contains only \`(\`, \`)\`, \`[\`, \`]\`, \`{\` and \`}\`.

Given the log \`log\`, return \`true\` if every opening bracket is closed by the same kind of bracket, in the right order, and every closing bracket has an opening one. Otherwise return \`false\`.

## Constraints

- \`1 ≤ log.length ≤ 10^5\`
- \`log\` contains only \`()[]{}\`
`,
  hints: `1. Counting each kind separately isn't enough: \`([)]\` has matching counts but is wrong.
2. A closing bracket must match the most recent opening bracket that is still open. Which structure gives you "most recent" in O(1)?
3. Push opening brackets on a stack. On a closing bracket, the top must be its partner. At the end, the stack must be empty.
`,
  editorial: `## Approach: a stack of open brackets

Scan the log. Push every opening bracket. For a closing bracket, the stack must be non-empty and its top must be the matching opening bracket; pop it. The log is balanced exactly when no check fails and the stack is empty at the end.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(n) in the worst case (all opening brackets) |

## Common mistakes

- Counting brackets per kind instead of using a stack (hidden test: \`{[}]\` expects \`false\`, like the public \`([)]\`).
- Forgetting the final emptiness check (hidden test: \`((((\` expects \`false\`).
- Popping from an empty stack on a leading closing bracket (hidden test: \`]\`).
`,
  solutions: {
    js: `function isBalanced(log) {
  const partner = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const c of log) {
    if (c === "(" || c === "[" || c === "{") stack.push(c);
    else if (stack.pop() !== partner[c]) return false;
  }
  return stack.length === 0;
}
`,
    py: `class Solution:
    def isBalanced(self, log: str) -> bool:
        partner = {")": "(", "]": "[", "}": "{"}
        stack = []
        for c in log:
            if c in "([{":
                stack.append(c)
            elif not stack or stack.pop() != partner[c]:
                return False
        return not stack
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isBalanced(string log) {
        vector<char> stack;
        for (char c : log) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push_back(c);
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (stack.empty() || stack.back() != want) return false;
            stack.pop_back();
        }
        return stack.empty();
    }
};
`,
    java: `class Solution {
    public boolean isBalanced(String log) {
        char[] stack = new char[log.length()];
        int top = 0;
        for (int i = 0; i < log.length(); i++) {
            char c = log.charAt(i);
            if (c == '(' || c == '[' || c == '{') {
                stack[top++] = c;
                continue;
            }
            char want = c == ')' ? '(' : c == ']' ? '[' : '{';
            if (top == 0 || stack[top - 1] != want) return false;
            top--;
        }
        return top == 0;
    }
}
`,
  },
  oracle: (s) => { let t = s, prev; do { prev = t; t = t.replace(/\(\)|\[\]|\{\}/g, ""); } while (t !== prev); return t === ""; },
  public: [
    { args: ["{[()()]}"], explain: "Each pair closes inside the one around it, so the log is balanced." },
    { args: ["([)]"] },
  ],
  hidden: [["("], [")"], ["]"], ["()"], ["([]{})"], ["(((("], ["))(("], ["{[}]"], ["()[]{}"], ["(([]){})"], ["(([]){}"]],
  small: (g) => [g.word("()[]{}", 1, 10)],
  gen: `export const seed = 3105;

// A random balanced string of n pairs, built with a stack so the nesting is varied.
const balanced = (g, n) => {
  const open = "([{", close = ")]}";
  const out = [], stack = [];
  let left = n;
  while (left > 0 || stack.length) {
    if (left > 0 && (stack.length === 0 || g.int(0, 1))) { const k = g.int(0, 2); out.push(open[k]); stack.push(k); left--; }
    else out.push(close[stack.pop()]);
  }
  return out.join("");
};

export default (g) => {
  const ok = balanced(g, 50000);
  return [
    [ok],
    [ok.slice(0, -1) + (ok.endsWith(")") ? "]" : ")")],
    ["(".repeat(50000) + ")".repeat(50000)],
    ["[".repeat(100000)],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "warmer-day", title: "Warmer Day", difficulty: "Medium", topics: ["stacks-and-queues"], patterns: ["monotonic-stack"], similar: ["leetcode:739"],
    fn: "daysToWarmer", params: [["temps", "int[]"]], returns: "int[]" }),
  statement: `A weather station in Shimla logs one maximum temperature per day. For planning a trek, you want to know how long each day has to wait for warmer weather.

Given the daily temperatures \`temps\`, return an array where entry \`i\` is the number of days after day \`i\` until a strictly warmer day. If no later day is warmer, the entry is \`0\`.

## Constraints

- \`1 ≤ temps.length ≤ 10^5\`
- \`−50 ≤ temps[i] ≤ 60\`
`,
  hints: `1. Checking every later day for every day is O(n²): too slow for 10^5 days.
2. Scan left to right and keep the days that are still waiting for a warmer one. What order are their temperatures in?
3. Waiting days form a stack with non-increasing temperatures. A new day answers every waiting day colder than it: pop them and record the gap.
`,
  editorial: `## Approach: monotonic stack of waiting days

Keep a stack of indices whose warmer day hasn't arrived. Their temperatures never increase from bottom to top, because a warmer day would already have answered the ones below it. For each new day \`i\`, pop every index \`j\` with \`temps[j] < temps[i]\` and set \`answer[j] = i − j\`, then push \`i\`. Indices left on the stack keep the answer \`0\`.

## Complexity

| | |
| --- | --- |
| Time | O(n): each index is pushed and popped at most once |
| Space | O(n) |

## Common mistakes

- Popping on \`≤\` instead of \`<\`: an equal temperature is not warmer (hidden test: all days at 30°C expect all zeros).
- Nested loops: a strictly falling week of 10^5 days makes the O(n²) scan time out (hidden test).
`,
  solutions: {
    js: `function daysToWarmer(temps) {
  const answer = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
      const j = stack.pop();
      answer[j] = i - j;
    }
    stack.push(i);
  }
  return answer;
}
`,
    py: `class Solution:
    def daysToWarmer(self, temps: list[int]) -> list[int]:
        answer = [0] * len(temps)
        stack = []
        for i, t in enumerate(temps):
            while stack and temps[stack[-1]] < t:
                j = stack.pop()
                answer[j] = i - j
            stack.append(i)
        return answer
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> daysToWarmer(vector<int>& temps) {
        vector<int> answer(temps.size(), 0), stack;
        for (int i = 0; i < (int)temps.size(); i++) {
            while (!stack.empty() && temps[stack.back()] < temps[i]) {
                answer[stack.back()] = i - stack.back();
                stack.pop_back();
            }
            stack.push_back(i);
        }
        return answer;
    }
};
`,
    java: `class Solution {
    public int[] daysToWarmer(int[] temps) {
        int[] answer = new int[temps.length];
        int[] stack = new int[temps.length];
        int top = 0;
        for (int i = 0; i < temps.length; i++) {
            while (top > 0 && temps[stack[top - 1]] < temps[i]) {
                int j = stack[--top];
                answer[j] = i - j;
            }
            stack[top++] = i;
        }
        return answer;
    }
}
`,
  },
  oracle: (t) => t.map((v, i) => { for (let j = i + 1; j < t.length; j++) if (t[j] > v) return j - i; return 0; }),
  public: [
    { args: [[18, 19, 21, 16, 15, 17, 22, 20]], explain: "Day 0 (18°) waits one day for 19°. Day 3 (16°) waits until day 5 (17°). Days 6 and 7 never see a warmer day." },
    { args: [[30, 25, 20]] },
  ],
  hidden: [[[5]], [[30, 30, 30, 30]], [[1, 2, 3, 4, 5]], [[5, 4, 3, 2, 1]], [[-50, 60]], [[60, -50]], [[3, 1, 2, 1, 4]], [[10, 10, 11]], [[2, 1, 1, 1, 3]]],
  small: (g) => [g.arr(g.int(1, 15), -5, 5)],
  gen: `export const seed = 3106;

export default (g) => {
  const n = 100000;
  const falling = Array.from({ length: n }, (_, i) => 60 - Math.floor((i * 110) / n));
  return [
    [g.arr(n, -50, 60)],
    [falling],
    [Array(n).fill(25)],
    [[...falling.slice(1), 60]],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "tiffin-queue", title: "Tiffin Queue", difficulty: "Easy", topics: ["stacks-and-queues"], patterns: ["queue-simulation"], similar: ["leetcode:1700"],
    fn: "unserved", params: [["students", "int[]"], ["tiffins", "int[]"]], returns: "int" }),
  statement: `At a hostel mess, students wait in a queue and the tiffins are stacked on the counter. Each student wants either a veg tiffin (\`0\`) or a non-veg tiffin (\`1\`), and so is each tiffin.

The student at the front looks at the top tiffin. If it is what they want, they take it and leave. If not, they go to the back of the queue. This repeats until nobody left in the queue wants the top tiffin.

Given the queue \`students\` (front first) and the stack \`tiffins\` (top first), return how many students go without a tiffin.

## Constraints

- \`1 ≤ students.length = tiffins.length ≤ 10^5\`
- every \`students[i]\` and \`tiffins[i]\` is \`0\` or \`1\`
`,
  hints: `1. Simulating the queue works, but a student can rotate many times. What actually decides whether the top tiffin gets taken?
2. The order of the queue doesn't matter: the top tiffin is taken as long as at least one waiting student wants that kind.
3. Count how many students want each kind, then walk down the stack until you reach a tiffin nobody wants.
`,
  editorial: `## Approach: count preferences, then walk the stack

Rotating the queue only changes who is at the front, never who is in it. So the top tiffin is eventually taken if and only if some waiting student wants that kind. Count \`want[0]\` and \`want[1]\`. Go through \`tiffins\` from the top: if \`want[t] > 0\`, one such student takes it (\`want[t]−−\`); otherwise everything stops. The answer is \`want[0] + want[1]\` at that point.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Simulating rotations with a fixed cap like "stop after n moves": the queue can need up to n rotations per tiffin, so a cap gives wrong answers, and an uncapped simulation is O(n²) on 10^5 students (hidden test).
- Stopping only when the queue is empty: it can get stuck with students who all want the other kind (hidden test: all students want veg, all tiffins non-veg).
`,
  solutions: {
    js: `function unserved(students, tiffins) {
  const want = [0, 0];
  for (const s of students) want[s]++;
  for (const t of tiffins) {
    if (want[t] === 0) break;
    want[t]--;
  }
  return want[0] + want[1];
}
`,
    py: `class Solution:
    def unserved(self, students: list[int], tiffins: list[int]) -> int:
        want = [0, 0]
        for s in students:
            want[s] += 1
        for t in tiffins:
            if want[t] == 0:
                break
            want[t] -= 1
        return want[0] + want[1]
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int unserved(vector<int>& students, vector<int>& tiffins) {
        int want[2] = {0, 0};
        for (int s : students) want[s]++;
        for (int t : tiffins) {
            if (want[t] == 0) break;
            want[t]--;
        }
        return want[0] + want[1];
    }
};
`,
    java: `class Solution {
    public int unserved(int[] students, int[] tiffins) {
        int[] want = new int[2];
        for (int s : students) want[s]++;
        for (int t : tiffins) {
            if (want[t] == 0) break;
            want[t]--;
        }
        return want[0] + want[1];
    }
}
`,
  },
  oracle: (students, tiffins) => {
    const q = [...students];
    let top = 0, rotations = 0;
    while (q.length && rotations < q.length) {
      if (q[0] === tiffins[top]) { q.shift(); top++; rotations = 0; } else { q.push(q.shift()); rotations++; }
    }
    return q.length;
  },
  public: [
    { args: [[1, 1, 0, 0], [0, 1, 0, 1]], explain: "The queue rotates until a veg student reaches the front each time a veg tiffin is on top, and so on. Everyone is served." },
    { args: [[1, 1, 1, 0, 0, 1], [1, 0, 0, 0, 1, 1]] },
  ],
  hidden: [[[0], [0]], [[0], [1]], [[0, 0, 0], [1, 1, 1]], [[1, 1, 1], [1, 1, 1]], [[0, 1], [1, 0]], [[0, 0, 1], [1, 1, 0]], [[1, 0, 1, 0], [0, 0, 1, 1]], [[0, 0, 0, 1], [0, 1, 1, 0]], [[1, 1, 0], [0, 0, 1]]],
  small: (g) => { const n = g.int(1, 10); return [g.arr(n, 0, 1), g.arr(n, 0, 1)]; },
  gen: `export const seed = 3107;

export default (g) => {
  const n = 100000;
  const half = Array.from({ length: n }, (_, i) => (i < n / 2 ? 1 : 0));
  return [
    [g.arr(n, 0, 1), g.arr(n, 0, 1)],
    [half, [...half].reverse()],
    [Array(n).fill(0), Array(n).fill(1)],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "widest-banner", title: "Widest Banner", difficulty: "Hard", topics: ["stacks-and-queues"], patterns: ["monotonic-stack"], similar: ["leetcode:84"],
    fn: "largestBanner", params: [["heights", "int[]"]], returns: "long" }),
  statement: `For a festival, a rectangular banner will hang flat against a row of shops. Shop \`i\` is 1 metre wide and \`heights[i]\` metres tall. The banner must cover whole shops next to each other and can't rise above the shortest shop it covers.

Given \`heights\`, return the largest possible banner area in square metres.

## Constraints

- \`1 ≤ heights.length ≤ 10^5\`
- \`0 ≤ heights[i] ≤ 10^9\`
`,
  hints: `1. Every best banner is as tall as one of the shops it covers. For shop \`i\` as the shortest, how far can the banner stretch left and right?
2. It stretches until the first shorter shop on each side. Finding "the nearest shorter shop" for every shop is a job for a stack.
3. Keep a stack of shops with increasing heights. When a shorter shop arrives, each popped shop now knows both its limits: the new shop on the right and the shop below it on the stack on the left.
`,
  editorial: `## Approach: monotonic stack of rising heights

Keep indices on a stack with increasing heights. When shop \`i\` is shorter than the top, pop the top \`j\`: shop \`i\` is the first shorter shop to its right, and the new top (or \`−1\` if empty) is the first shorter one to its left. So the widest banner of height \`heights[j]\` has width \`i − left − 1\`. Process a sentinel of height 0 after the last shop so every index is popped. Use 64-bit integers: the area can reach 10^14.

## Complexity

| | |
| --- | --- |
| Time | O(n): each shop is pushed and popped once |
| Space | O(n) |

## Common mistakes

- 32-bit areas: 10^5 shops of height 10^9 give 10^14 (hidden test).
- Forgetting to flush the stack at the end: a strictly rising row never pops during the scan (hidden test).
- Trying every pair of edges: O(n²) times out on 10^5 shops.
`,
  solutions: {
    js: `function largestBanner(heights) {
  const n = heights.length;
  const stack = [];
  let best = 0;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const top = stack.pop();
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, heights[top] * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}
`,
    py: `class Solution:
    def largestBanner(self, heights: list[int]) -> int:
        n = len(heights)
        stack = []
        best = 0
        for i in range(n + 1):
            h = 0 if i == n else heights[i]
            while stack and heights[stack[-1]] >= h:
                top = stack.pop()
                left = stack[-1] if stack else -1
                best = max(best, heights[top] * (i - left - 1))
            stack.append(i)
        return best
`,
    cpp: `#include <algorithm>
#include <vector>
using namespace std;

class Solution {
public:
    long long largestBanner(vector<int>& heights) {
        int n = heights.size();
        vector<int> stack;
        long long best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];
            while (!stack.empty() && heights[stack.back()] >= h) {
                int top = stack.back();
                stack.pop_back();
                int left = stack.empty() ? -1 : stack.back();
                best = max(best, (long long)heights[top] * (i - left - 1));
            }
            stack.push_back(i);
        }
        return best;
    }
};
`,
    java: `class Solution {
    public long largestBanner(int[] heights) {
        int n = heights.length;
        int[] stack = new int[n + 1];
        int top = 0;
        long best = 0;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];
            while (top > 0 && heights[stack[top - 1]] >= h) {
                int j = stack[--top];
                int left = top > 0 ? stack[top - 1] : -1;
                best = Math.max(best, (long) heights[j] * (i - left - 1));
            }
            stack[top++] = i;
        }
        return best;
    }
}
`,
  },
  oracle: (h) => { let best = 0; for (let i = 0; i < h.length; i++) { let m = Infinity; for (let j = i; j < h.length; j++) { m = Math.min(m, h[j]); best = Math.max(best, m * (j - i + 1)); } } return best; },
  public: [
    { args: [[2, 1, 5, 6, 2, 3]], explain: "A banner 5 m tall across the shops of height 5 and 6 covers 10 m²." },
    { args: [[2, 4]] },
  ],
  hidden: [[[0]], [[7]], [[0, 0, 0]], [[1, 2, 3, 4, 5]], [[5, 4, 3, 2, 1]], [[3, 3, 3, 3]], [[1000000000, 1000000000]], [[2, 0, 2]], [[6, 2, 5, 4, 5, 1, 6]], [[1, 1, 1, 9]]],
  small: (g) => [g.arr(g.int(1, 12), 0, 9)],
  gen: `export const seed = 3108;

export default (g) => {
  const n = 100000;
  return [
    [g.arr(n, 0, 1000000000)],
    [Array.from({ length: n }, (_, i) => i + 1)],
    [Array(n).fill(1000000000)],
    [Array.from({ length: n }, (_, i) => n - i)],
  ];
};
`,
});

// ─── Linked lists (as next[] index arrays) ──────────────────────────────────────────────────

const LL_NOTE = "Nodes are numbered `0` to `n − 1`. `next[i]` is the node after node `i`, or `-1` if node `i` is the last one.";

P.push({
  meta: meta({ slug: "relay-reversal", title: "Relay Reversal", difficulty: "Easy", topics: ["linked-lists"], patterns: ["in-place-reversal"], similar: ["leetcode:206"],
    fn: "reverseRelay", params: [["values", "int[]"], ["next", "int[]"], ["head", "int"]], returns: "int[]" }),
  statement: `In a school relay, each runner knows only who runs after them. The coach wants to run the race backwards, last runner first, without building a second list.

The runners form a linked list. ${LL_NOTE} Runner \`i\` wears bib number \`values[i]\`, and \`head\` is the first runner.

Reverse the list by changing the links, then return the bib numbers in the new order, from the new head.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = values.length = next.length\`
- following \`next\` from \`head\` visits every node exactly once and ends at \`-1\`
- \`−10^9 ≤ values[i] ≤ 10^9\`
`,
  hints: `1. Walk the list from \`head\`. At each node you know the node behind you and the node ahead.
2. Point the current node back at the previous one. Save the old \`next\` first, or you lose the rest of the list.
3. Three variables are enough: \`prev\`, \`cur\` and the saved next node. When \`cur\` reaches \`-1\`, \`prev\` is the new head.
`,
  editorial: `## Approach: reverse the links in one pass

Start with \`prev = -1\` and \`cur = head\`. Repeat: save \`ahead = next[cur]\`, set \`next[cur] = prev\`, then move \`prev = cur\` and \`cur = ahead\`. When \`cur\` becomes \`-1\`, every link points backwards and \`prev\` is the new head. Walk from there to read the bib numbers.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) besides the output |

## Common mistakes

- Overwriting \`next[cur]\` before saving it, which cuts off the rest of the list.
- Assuming node \`0\` is the head, or that \`next\` runs \`0 → 1 → 2 …\` (hidden tests use shuffled links).
`,
  solutions: {
    js: `function reverseRelay(values, next, head) {
  const link = next.slice();
  let prev = -1;
  let cur = head;
  while (cur !== -1) {
    const ahead = link[cur];
    link[cur] = prev;
    prev = cur;
    cur = ahead;
  }
  const order = [];
  for (let node = prev; node !== -1; node = link[node]) order.push(values[node]);
  return order;
}
`,
    py: `class Solution:
    def reverseRelay(self, values: list[int], next: list[int], head: int) -> list[int]:
        link = next[:]
        prev, cur = -1, head
        while cur != -1:
            ahead = link[cur]
            link[cur] = prev
            prev, cur = cur, ahead
        order = []
        node = prev
        while node != -1:
            order.append(values[node])
            node = link[node]
        return order
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> reverseRelay(vector<int>& values, vector<int>& next, int head) {
        vector<int> link = next;
        int prev = -1, cur = head;
        while (cur != -1) {
            int ahead = link[cur];
            link[cur] = prev;
            prev = cur;
            cur = ahead;
        }
        vector<int> order;
        for (int node = prev; node != -1; node = link[node]) order.push_back(values[node]);
        return order;
    }
};
`,
    java: `class Solution {
    public int[] reverseRelay(int[] values, int[] next, int head) {
        int[] link = next.clone();
        int prev = -1, cur = head;
        while (cur != -1) {
            int ahead = link[cur];
            link[cur] = prev;
            prev = cur;
            cur = ahead;
        }
        int[] order = new int[values.length];
        int k = 0;
        for (int node = prev; node != -1; node = link[node]) order[k++] = values[node];
        return order;
    }
}
`,
  },
  oracle: (values, next, head) => walk(next, head).map((i) => values[i]).reverse(),
  public: [
    { args: [[11, 22, 33, 44], [1, 2, 3, -1], 0], explain: "The relay 11 → 22 → 33 → 44 becomes 44 → 33 → 22 → 11." },
    { args: [[5, 9, 7], [-1, 2, 0], 1] },
  ],
  hidden: [[[42], [-1], 0], [[1, 2], [1, -1], 0], [[1, 2], [-1, 0], 1], [[3, 3, 3], [1, 2, -1], 0], [[-1000000000, 1000000000, 0], [2, 0, -1], 1], [[1, 2, 3, 4, 5], [4, 0, 1, -1, 3], 2], [[10, 20, 30, 40], [3, 0, 1, -1], 2], [[6, 5, 4, 3, 2, 1], [1, 2, 3, 4, 5, -1], 0], [[7, 8, 9], [-1, 0, 1], 2]],
  small: (g) => { const n = g.int(1, 10); const { next, head } = chain(g, n); return [g.arr(n, -20, 20), next, head]; },
  gen: `export const seed = 3109;

${CHAIN_GEN}

export default (g) => {
  const n = 100000;
  const a = chain(g, n);
  const straight = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
  return [
    [g.arr(n, -1000000000, 1000000000), a.next, a.head],
    [Array.from({ length: n }, (_, i) => i), straight, 0],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "middle-coach", title: "Middle Coach", difficulty: "Easy", topics: ["linked-lists"], patterns: ["fast-and-slow-pointers"], similar: ["leetcode:876"],
    fn: "middleCoach", params: [["values", "int[]"], ["next", "int[]"], ["head", "int"]], returns: "int" }),
  statement: `A train's coaches are coupled one after another, and each coach only knows the coach behind it. The pantry car must go in the middle coach, and you have to find it in a single walk along the train.

The coaches form a linked list. ${LL_NOTE} Coach \`i\` has number \`values[i]\`, and \`head\` is the engine-side coach.

Return the number of the middle coach. With an even number of coaches there are two middles; return the second one.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = values.length = next.length\`
- following \`next\` from \`head\` visits every node exactly once and ends at \`-1\`
- \`−10^9 ≤ values[i] ≤ 10^9\`
`,
  hints: `1. Counting the coaches first and then walking half-way takes two passes. Can one walker tell you where the middle is?
2. Send two walkers from the head: one moves one coach per step, the other two coaches per step.
3. When the fast walker can't take another double step, the slow one is at the middle. Check which middle you get for 2 and 4 coaches.
`,
  editorial: `## Approach: fast and slow pointers

Start \`slow\` and \`fast\` at \`head\`. While \`fast\` and \`next[fast]\` both exist, move \`slow\` one step and \`fast\` two steps. When \`fast\` stops, it has travelled about twice as far as \`slow\`, so \`slow\` is in the middle. With this stopping rule, an even-length train gives the second middle (for 4 coaches, \`slow\` ends on the third).

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Stopping one step early (\`while next[next[fast]]\` exists), which returns the first middle on even lengths (hidden test: two coaches expect the second).
- Reading \`next[-1]\` when the fast pointer runs off the end.
`,
  solutions: {
    js: `function middleCoach(values, next, head) {
  let slow = head;
  let fast = head;
  while (fast !== -1 && next[fast] !== -1) {
    slow = next[slow];
    fast = next[next[fast]];
  }
  return values[slow];
}
`,
    py: `class Solution:
    def middleCoach(self, values: list[int], next: list[int], head: int) -> int:
        slow = fast = head
        while fast != -1 and next[fast] != -1:
            slow = next[slow]
            fast = next[next[fast]]
        return values[slow]
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int middleCoach(vector<int>& values, vector<int>& next, int head) {
        int slow = head, fast = head;
        while (fast != -1 && next[fast] != -1) {
            slow = next[slow];
            fast = next[next[fast]];
        }
        return values[slow];
    }
};
`,
    java: `class Solution {
    public int middleCoach(int[] values, int[] next, int head) {
        int slow = head, fast = head;
        while (fast != -1 && next[fast] != -1) {
            slow = next[slow];
            fast = next[next[fast]];
        }
        return values[slow];
    }
}
`,
  },
  oracle: (values, next, head) => { const w = walk(next, head); return values[w[Math.floor(w.length / 2)]]; },
  public: [
    { args: [[101, 102, 103, 104, 105], [1, 2, 3, 4, -1], 0], explain: "Five coaches: the third, 103, has two on each side." },
    { args: [[7, 3, 9, 4], [3, 2, -1, 1], 0] },
  ],
  hidden: [[[9], [-1], 0], [[1, 2], [1, -1], 0], [[1, 2], [-1, 0], 1], [[5, 5, 5, 5], [1, 2, 3, -1], 0], [[1, 2, 3], [2, -1, 1], 0], [[10, 20, 30, 40, 50, 60], [5, 0, 1, 2, 3, -1], 4], [[-1000000000, 0, 1000000000], [1, 2, -1], 0], [[4, 3, 2, 1], [-1, 0, 1, 2], 3], [[8, 6, 7, 5, 3, 0, 9], [1, 2, 3, 4, 5, 6, -1], 0]],
  small: (g) => { const n = g.int(1, 11); const { next, head } = chain(g, n); return [g.arr(n, -20, 20), next, head]; },
  gen: `export const seed = 3110;

${CHAIN_GEN}

export default (g) => {
  const odd = chain(g, 99999);
  const even = chain(g, 100000);
  return [
    [g.arr(99999, -1000000000, 1000000000), odd.next, odd.head],
    [g.arr(100000, -1000000000, 1000000000), even.next, even.head],
  ];
};
`,
});

P.push({
  meta: meta({ slug: "delivery-loop", title: "Delivery Loop", difficulty: "Medium", topics: ["linked-lists"], patterns: ["fast-and-slow-pointers"], similar: ["leetcode:142"],
    fn: "loopStart", params: [["next", "int[]"], ["head", "int"]], returns: "int" }),
  statement: `A delivery app gives each stop a pointer to the next stop. A bug may have created a loop, sending riders round the same stops forever.

The stops form a linked list. ${LL_NOTE} The route starts at \`head\`.

If following \`next\` from \`head\` eventually repeats a stop, return the first stop on the route that is part of the loop. Otherwise return \`-1\`. Try to use O(1) extra memory.

## Constraints

- \`1 ≤ next.length ≤ 10^5\`
- \`−1 ≤ next[i] < next.length\`
- \`0 ≤ head < next.length\`; stops not reachable from \`head\` can be ignored
`,
  hints: `1. A set of visited stops finds the loop, but uses O(n) memory. Two walkers at different speeds use none.
2. A fast walker (two steps) and a slow walker (one step) meet inside the loop if there is one. If the fast walker reaches \`-1\`, there is no loop.
3. After they meet, start a new walker at \`head\` and move it and the slow walker one step at a time. They meet exactly at the start of the loop.
`,
  editorial: `## Approach: Floyd's cycle detection

Move \`slow\` one step and \`fast\` two steps until \`fast\` hits the end (no loop) or the two meet. Say the tail before the loop has length \`a\`, the meeting point is \`b\` steps into the loop, and the loop has length \`L\`. Fast walked twice as far as slow: \`2(a + b) = a + b + kL\`, so \`a = kL − b\`. Walking \`a\` more steps from the meeting point therefore lands on the loop start, the same place a walker starting at \`head\` reaches after \`a\` steps. Move both one step at a time until they meet.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) |

## Common mistakes

- Returning the meeting point: it is somewhere inside the loop, not necessarily its start (hidden tests where the tail and the loop have different lengths).
- Missing a self-loop, where a stop points to itself (hidden test).
`,
  solutions: {
    js: `function loopStart(next, head) {
  let slow = head;
  let fast = head;
  while (fast !== -1 && next[fast] !== -1) {
    slow = next[slow];
    fast = next[next[fast]];
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = next[p];
        slow = next[slow];
      }
      return p;
    }
  }
  return -1;
}
`,
    py: `class Solution:
    def loopStart(self, next: list[int], head: int) -> int:
        slow = fast = head
        while fast != -1 and next[fast] != -1:
            slow = next[slow]
            fast = next[next[fast]]
            if slow == fast:
                p = head
                while p != slow:
                    p = next[p]
                    slow = next[slow]
                return p
        return -1
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int loopStart(vector<int>& next, int head) {
        int slow = head, fast = head;
        while (fast != -1 && next[fast] != -1) {
            slow = next[slow];
            fast = next[next[fast]];
            if (slow == fast) {
                int p = head;
                while (p != slow) {
                    p = next[p];
                    slow = next[slow];
                }
                return p;
            }
        }
        return -1;
    }
};
`,
    java: `class Solution {
    public int loopStart(int[] next, int head) {
        int slow = head, fast = head;
        while (fast != -1 && next[fast] != -1) {
            slow = next[slow];
            fast = next[next[fast]];
            if (slow == fast) {
                int p = head;
                while (p != slow) {
                    p = next[p];
                    slow = next[slow];
                }
                return p;
            }
        }
        return -1;
    }
}
`,
  },
  oracle: (next, head) => { const seen = new Set(); for (let c = head; c !== -1; c = next[c]) { if (seen.has(c)) return c; seen.add(c); } return -1; },
  public: [
    { args: [[1, 2, 3, 4, 2], 0], explain: "The route goes 0 → 1 → 2 → 3 → 4 and then back to 2, so the loop starts at stop 2." },
    { args: [[1, 2, -1], 0] },
  ],
  hidden: [[[-1], 0], [[0], 0], [[1, 0], 0], [[1, 1], 0], [[1, 2, 3, -1], 0], [[3, 0, 1, 2], 2], [[1, 2, 3, 4, 5, 3], 0], [[2, -1, 1, 4, 3], 0], [[1, 2, 0, 0, 3], 4], [[5, 0, 1, 2, 3, 4], 0]],
  small: (g) => { const n = g.int(1, 10); return [Array.from({ length: n }, () => g.int(-1, n - 1)), g.int(0, n - 1)]; },
  gen: `export const seed = 3111;

${CHAIN_GEN}

// A route of n stops in random order: a tail of length tail, then a loop through the rest.
const rho = (g, n, tail) => {
  const c = chain(g, n);
  const order = [];
  for (let s = c.head; s !== -1; s = c.next[s]) order.push(s);
  c.next[order[n - 1]] = order[tail];
  return c;
};

export default (g) => {
  const n = 100000;
  // Tail and loop lengths differ, so the walkers meet away from the loop start.
  const half = rho(g, n, 31234);
  const longTail = rho(g, n, n - 1);
  const noLoop = chain(g, n);
  const whole = rho(g, n, 0);
  return [[half.next, half.head], [longTail.next, longTail.head], [noLoop.next, noLoop.head], [whole.next, whole.head]];
};
`,
});

P.push({
  meta: meta({ slug: "drop-from-end", title: "Drop From End", difficulty: "Medium", topics: ["linked-lists"], patterns: ["two-pointers"], similar: ["leetcode:19"],
    fn: "dropFromEnd", params: [["values", "int[]"], ["next", "int[]"], ["head", "int"], ["k", "int"]], returns: "int[]" }),
  statement: `A playlist is stored as a linked list, and the listener wants to remove the song that is \`k\` places from the end.

${LL_NOTE} Song \`i\` has id \`values[i]\`, and \`head\` is the first song.

Remove the \`k\`-th song from the end (\`k = 1\` is the last song) and return the remaining song ids in playlist order. Try to find the song in a single pass.

## Constraints

- \`1 ≤ n ≤ 10^5\`, where \`n = values.length = next.length\`
- following \`next\` from \`head\` visits every node exactly once and ends at \`-1\`
- \`1 ≤ k ≤ n\`
- \`−10^9 ≤ values[i] ≤ 10^9\`
`,
  hints: `1. Counting the songs first works in two passes. For one pass, think about a gap between two walkers.
2. Move a \`lead\` walker \`k\` songs ahead. Then move \`lead\` and a \`trail\` walker together until \`lead\` is on the last song.
3. \`trail\` now sits just before the song to remove. Handle \`k = n\` separately: then the head itself goes.
`,
  editorial: `## Approach: a gap of \`k\` between two pointers

Advance \`lead\` by \`k\` nodes. If \`lead\` is now \`-1\`, the song to drop is the head, so the new head is \`next[head]\`. Otherwise start \`trail\` at \`head\` and move both until \`next[lead]\` is \`-1\`: the gap stays \`k\`, so \`trail\` is the node just before the one to remove. Set \`next[trail] = next[next[trail]]\` and read the list from the head.

## Complexity

| | |
| --- | --- |
| Time | O(n) |
| Space | O(1) besides the output |

## Common mistakes

- Not handling \`k = n\` (removing the head), which leaves \`trail\` with nothing before it (hidden test).
- An off-by-one gap that removes the \`(k + 1)\`-th or \`(k − 1)\`-th song from the end.
`,
  solutions: {
    js: `function dropFromEnd(values, next, head, k) {
  const link = next.slice();
  let lead = head;
  for (let i = 0; i < k; i++) lead = link[lead];
  let start = head;
  if (lead === -1) {
    start = link[head];
  } else {
    let trail = head;
    while (link[lead] !== -1) {
      lead = link[lead];
      trail = link[trail];
    }
    link[trail] = link[link[trail]];
  }
  const out = [];
  for (let node = start; node !== -1; node = link[node]) out.push(values[node]);
  return out;
}
`,
    py: `class Solution:
    def dropFromEnd(self, values: list[int], next: list[int], head: int, k: int) -> list[int]:
        link = next[:]
        lead = head
        for _ in range(k):
            lead = link[lead]
        start = head
        if lead == -1:
            start = link[head]
        else:
            trail = head
            while link[lead] != -1:
                lead = link[lead]
                trail = link[trail]
            link[trail] = link[link[trail]]
        out = []
        node = start
        while node != -1:
            out.append(values[node])
            node = link[node]
        return out
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> dropFromEnd(vector<int>& values, vector<int>& next, int head, int k) {
        vector<int> link = next;
        int lead = head;
        for (int i = 0; i < k; i++) lead = link[lead];
        int start = head;
        if (lead == -1) {
            start = link[head];
        } else {
            int trail = head;
            while (link[lead] != -1) {
                lead = link[lead];
                trail = link[trail];
            }
            link[trail] = link[link[trail]];
        }
        vector<int> out;
        for (int node = start; node != -1; node = link[node]) out.push_back(values[node]);
        return out;
    }
};
`,
    java: `class Solution {
    public int[] dropFromEnd(int[] values, int[] next, int head, int k) {
        int[] link = next.clone();
        int lead = head;
        for (int i = 0; i < k; i++) lead = link[lead];
        int start = head;
        if (lead == -1) {
            start = link[head];
        } else {
            int trail = head;
            while (link[lead] != -1) {
                lead = link[lead];
                trail = link[trail];
            }
            link[trail] = link[link[trail]];
        }
        int[] out = new int[values.length - 1];
        int i = 0;
        for (int node = start; node != -1; node = link[node]) out[i++] = values[node];
        return out;
    }
}
`,
  },
  oracle: (values, next, head, k) => { const w = walk(next, head).map((i) => values[i]); w.splice(w.length - k, 1); return w; },
  public: [
    { args: [[10, 20, 30, 40, 50], [1, 2, 3, 4, -1], 0, 2], explain: "The 2nd song from the end is 40. Removing it leaves 10, 20, 30, 50." },
    { args: [[7, 8], [-1, 0], 1, 2] },
  ],
  hidden: [[[5], [-1], 0, 1], [[1, 2], [1, -1], 0, 1], [[1, 2], [1, -1], 0, 2], [[1, 2, 3], [1, 2, -1], 0, 3], [[1, 2, 3], [1, 2, -1], 0, 1], [[4, 4, 4, 4], [1, 2, 3, -1], 0, 2], [[1, 2, 3, 4, 5], [4, 0, 1, -1, 3], 2, 5], [[9, 8, 7, 6], [-1, 0, 1, 2], 3, 1], [[-1000000000, 0, 1000000000], [2, 0, -1], 1, 2]],
  small: (g) => { const n = g.int(1, 10); const { next, head } = chain(g, n); return [g.arr(n, -20, 20), next, head, g.int(1, n)]; },
  gen: `export const seed = 3112;

${CHAIN_GEN}

export default (g) => {
  const n = 100000;
  const a = chain(g, n);
  const b = chain(g, n);
  const values = g.arr(n, -1000000000, 1000000000);
  return [
    [values, a.next, a.head, g.int(2, n - 1)],
    [values, b.next, b.head, n],
    [values, b.next, b.head, 1],
  ];
};
`,
});

// ─── Recursion ──────────────────────────────────────────────────────────────────────────────

P.push({
  meta: meta({ slug: "outfit-picks", title: "Outfit Picks", difficulty: "Medium", topics: ["recursion"], patterns: ["backtracking"], similar: ["leetcode:78"],
    fn: "allPicks", params: [["items", "string[]"]], returns: "string[][]", comparator: "unordered" }),
  statement: `You are packing for a wedding weekend and want to see every way to pick accessories from \`items\`: any number of them, including none.

Given the distinct item names \`items\`, return every possible pick. Inside each pick, list the items in the same order as in \`items\`. The picks themselves can be returned in any order.

## Constraints

- \`1 ≤ items.length ≤ 12\`
- each \`items[i]\` is 1 to 10 lowercase letters, and all items are distinct
`,
  hints: `1. For each item there are exactly two choices: take it or leave it. How many picks does that give for \`n\` items?
2. Write a function \`go(i)\` that decides item \`i\` both ways and recurses on \`i + 1\`. When \`i == n\`, the current pick is complete.
3. Keep one working list: append the item, recurse, then remove it again before trying the "leave it" branch (backtracking).
`,
  editorial: `## Approach: include or exclude, recursively

\`go(i)\` has decided items \`0\` to \`i − 1\`; the current choices are in \`cur\`. If \`i == n\`, record a copy of \`cur\`. Otherwise call \`go(i + 1)\` without item \`i\`, then append item \`i\`, call \`go(i + 1)\` again and pop it. The recursion tree has depth \`n\` and \`2^n\` leaves, one per pick, and items are always added in input order.

## Complexity

| | |
| --- | --- |
| Time | O(n · 2^n): 2^n picks, each copied in O(n) |
| Space | O(n) recursion depth, plus the output |

## Common mistakes

- Recording \`cur\` itself instead of a copy: every pick then ends up empty after backtracking.
- Forgetting the empty pick (hidden test: one item expects \`[[], ["watch"]]\`).
`,
  solutions: {
    js: `function allPicks(items) {
  const out = [];
  const cur = [];
  const go = (i) => {
    if (i === items.length) {
      out.push(cur.slice());
      return;
    }
    go(i + 1);
    cur.push(items[i]);
    go(i + 1);
    cur.pop();
  };
  go(0);
  return out;
}
`,
    py: `class Solution:
    def allPicks(self, items: list[str]) -> list[list[str]]:
        out, cur = [], []

        def go(i: int) -> None:
            if i == len(items):
                out.append(cur[:])
                return
            go(i + 1)
            cur.append(items[i])
            go(i + 1)
            cur.pop()

        go(0)
        return out
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<string>> allPicks(vector<string>& items) {
        vector<vector<string>> out;
        vector<string> cur;
        go(items, 0, cur, out);
        return out;
    }

private:
    void go(const vector<string>& items, int i, vector<string>& cur, vector<vector<string>>& out) {
        if (i == (int)items.size()) {
            out.push_back(cur);
            return;
        }
        go(items, i + 1, cur, out);
        cur.push_back(items[i]);
        go(items, i + 1, cur, out);
        cur.pop_back();
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public String[][] allPicks(String[] items) {
        List<String[]> out = new ArrayList<>();
        go(items, 0, new ArrayList<>(), out);
        return out.toArray(new String[0][]);
    }

    private void go(String[] items, int i, List<String> cur, List<String[]> out) {
        if (i == items.length) {
            out.add(cur.toArray(new String[0]));
            return;
        }
        go(items, i + 1, cur, out);
        cur.add(items[i]);
        go(items, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
`,
  },
  oracle: (items) => { const out = []; for (let m = 0; m < 1 << items.length; m++) out.push(items.filter((_, i) => m & (1 << i))); return out; },
  public: [
    { args: [["bangles", "dupatta", "watch"]], explain: "Three items give 2 × 2 × 2 = 8 picks, from none to all three." },
    { args: [["ring", "scarf"]] },
  ],
  hidden: [[["watch"]], [["a", "b"]], [["zz", "a", "m"]], [["kurta", "jutti", "stole", "bindi"]], [["p", "q", "r", "s", "t"]], [["one", "two", "three", "four", "five", "six"]], [["x", "xx", "xxx", "xxxx", "xxxxx", "xxxxxx", "xxxxxxx"]], [["abcdefghij", "b"]], [["e", "d", "c", "b", "a"]]],
  small: (g) => [[...new Set(g.words(g.int(1, 6), "abcd", 1, 3))]],
  gen: `export const seed = 3113;

const distinct = (g, n) => {
  const seen = new Set();
  while (seen.size < n) seen.add(g.word("abcdefghijklmnopqrstuvwxyz", 1, 10));
  return [...seen];
};

export default (g) => [[distinct(g, 12)], [distinct(g, 11)], [distinct(g, 10)]];
`,
});

P.push({
  meta: meta({ slug: "keypad-messages", title: "Keypad Messages", difficulty: "Medium", topics: ["recursion"], patterns: ["backtracking"], similar: ["leetcode:17"],
    fn: "keypadMessages", params: [["digits", "string"]], returns: "string[]", comparator: "unordered" }),
  statement: `On an old feature phone, each digit key from 2 to 9 carries letters: 2 = abc, 3 = def, 4 = ghi, 5 = jkl, 6 = mno, 7 = pqrs, 8 = tuv, 9 = wxyz. Pressing a key once can stand for any of its letters.

Given the keys pressed \`digits\`, return every string of letters those presses could stand for, one letter per digit, in any order. If \`digits\` is empty, return an empty list.

## Constraints

- \`0 ≤ digits.length ≤ 7\`
- every character of \`digits\` is between \`2\` and \`9\`
`,
  hints: `1. The first digit has 3 or 4 letter choices, and for each of them the rest of the digits are the same smaller problem.
2. Write \`go(i, prefix)\`: if \`i == digits.length\`, record \`prefix\`; otherwise try each letter of key \`digits[i]\`.
3. The empty input is special: it has no messages, not one empty message.
`,
  editorial: `## Approach: one recursion level per digit

\`go(i, prefix)\` has chosen letters for the first \`i\` digits. If \`i\` equals the length, \`prefix\` is a complete message. Otherwise, for each letter on key \`digits[i]\`, call \`go(i + 1, prefix + letter)\`. Start with \`go(0, "")\`, but return an empty list straight away for empty input. With a character buffer instead of string concatenation, each message costs O(n) to build.

## Complexity

| | |
| --- | --- |
| Time | O(n · 4^n) |
| Space | O(n) recursion depth, plus the output |

## Common mistakes

- Returning \`[""]\` for empty input (hidden test expects \`[]\`).
- Giving 7 and 9 three letters instead of four (hidden tests use both).
`,
  solutions: {
    js: `function keypadMessages(digits) {
  if (digits.length === 0) return [];
  const keys = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
  const out = [];
  const buf = [];
  const go = (i) => {
    if (i === digits.length) {
      out.push(buf.join(""));
      return;
    }
    for (const c of keys[digits.charCodeAt(i) - 48]) {
      buf.push(c);
      go(i + 1);
      buf.pop();
    }
  };
  go(0);
  return out;
}
`,
    py: `class Solution:
    def keypadMessages(self, digits: str) -> list[str]:
        if not digits:
            return []
        keys = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
        out, buf = [], []

        def go(i: int) -> None:
            if i == len(digits):
                out.append("".join(buf))
                return
            for c in keys[int(digits[i])]:
                buf.append(c)
                go(i + 1)
                buf.pop()

        go(0)
        return out
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<string> keypadMessages(string digits) {
        vector<string> out;
        if (digits.empty()) return out;
        string buf;
        go(digits, 0, buf, out);
        return out;
    }

private:
    const vector<string> keys = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    void go(const string& digits, int i, string& buf, vector<string>& out) {
        if (i == (int)digits.size()) {
            out.push_back(buf);
            return;
        }
        for (char c : keys[digits[i] - '0']) {
            buf.push_back(c);
            go(digits, i + 1, buf, out);
            buf.pop_back();
        }
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    public String[] keypadMessages(String digits) {
        List<String> out = new ArrayList<>();
        if (!digits.isEmpty()) go(digits, 0, new StringBuilder(), out);
        return out.toArray(new String[0]);
    }

    private void go(String digits, int i, StringBuilder buf, List<String> out) {
        if (i == digits.length()) {
            out.add(buf.toString());
            return;
        }
        for (char c : KEYS[digits.charAt(i) - '0'].toCharArray()) {
            buf.append(c);
            go(digits, i + 1, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
    }
}
`,
  },
  oracle: (digits) => {
    const keys = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };
    if (!digits) return [];
    let acc = [""];
    for (const d of digits) acc = acc.flatMap((p) => [...keys[d]].map((c) => p + c));
    return acc;
  },
  public: [
    { args: ["29"], explain: "Key 2 gives a, b or c and key 9 gives w, x, y or z: 3 × 4 = 12 messages." },
    { args: ["7"] },
  ],
  hidden: [[""], ["2"], ["9"], ["22"], ["79"], ["234"], ["777"], ["5678"], ["98765"], ["2468"]],
  small: (g) => [g.word("23456789", 0, 4)],
  gen: `export const seed = 3114;

export default (g) => [["7979797"], [g.word("23456789", 7)], ["2345678"]];
`,
});

P.push({
  meta: meta({ slug: "bracket-layouts", title: "Bracket Layouts", difficulty: "Medium", topics: ["recursion"], patterns: ["backtracking"], similar: ["leetcode:22"],
    fn: "bracketLayouts", params: [["pairs", "int"], ["maxDepth", "int"]], returns: "string[]", comparator: "unordered" }),
  statement: `A style checker accepts nested brackets only up to a limit, so a test generator needs every correctly nested string within that limit.

Given \`pairs\` and \`maxDepth\`, return every string of \`pairs\` opening and \`pairs\` closing round brackets that is correctly nested and never has more than \`maxDepth\` brackets open at once. Return them in any order.

## Constraints

- \`1 ≤ maxDepth ≤ pairs ≤ 10\`
`,
  hints: `1. Build the string one character at a time. At any point, how many \`(\` can you still add, and when is a \`)\` allowed?
2. You may add \`(\` while fewer than \`pairs\` are used and fewer than \`maxDepth\` are open. You may add \`)\` while some bracket is still open.
3. Every path that follows both rules ends in a valid string, so the recursion never builds anything it throws away.
`,
  editorial: `## Approach: backtracking with two counters

Track \`open\` (opening brackets used) and \`close\` (closing brackets used). The current depth is \`open − close\`. From any prefix, add \`(\` if \`open < pairs\` and \`open − close < maxDepth\`, and add \`)\` if \`close < open\`. When the length reaches \`2 × pairs\`, the string is complete. Every branch the rules allow leads to a valid answer, so the work is proportional to the output.

## Complexity

| | |
| --- | --- |
| Time | O(pairs × answer count); at most the 10th Catalan number, 16,796 strings |
| Space | O(pairs) recursion depth, plus the output |

## Common mistakes

- Generating all 2^(2 × pairs) strings and filtering: about a million strings at \`pairs = 10\`.
- Checking the depth limit only at the end instead of while building (hidden tests with \`maxDepth = 1\` expect just \`()()…()\`).
`,
  solutions: {
    js: `function bracketLayouts(pairs, maxDepth) {
  const out = [];
  const buf = [];
  const go = (open, close) => {
    if (buf.length === 2 * pairs) {
      out.push(buf.join(""));
      return;
    }
    if (open < pairs && open - close < maxDepth) {
      buf.push("(");
      go(open + 1, close);
      buf.pop();
    }
    if (close < open) {
      buf.push(")");
      go(open, close + 1);
      buf.pop();
    }
  };
  go(0, 0);
  return out;
}
`,
    py: `class Solution:
    def bracketLayouts(self, pairs: int, maxDepth: int) -> list[str]:
        out, buf = [], []

        def go(open_: int, close: int) -> None:
            if len(buf) == 2 * pairs:
                out.append("".join(buf))
                return
            if open_ < pairs and open_ - close < maxDepth:
                buf.append("(")
                go(open_ + 1, close)
                buf.pop()
            if close < open_:
                buf.append(")")
                go(open_, close + 1)
                buf.pop()

        go(0, 0)
        return out
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    vector<string> bracketLayouts(int pairs, int maxDepth) {
        vector<string> out;
        string buf;
        go(pairs, maxDepth, 0, 0, buf, out);
        return out;
    }

private:
    void go(int pairs, int maxDepth, int open, int close, string& buf, vector<string>& out) {
        if ((int)buf.size() == 2 * pairs) {
            out.push_back(buf);
            return;
        }
        if (open < pairs && open - close < maxDepth) {
            buf.push_back('(');
            go(pairs, maxDepth, open + 1, close, buf, out);
            buf.pop_back();
        }
        if (close < open) {
            buf.push_back(')');
            go(pairs, maxDepth, open, close + 1, buf, out);
            buf.pop_back();
        }
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public String[] bracketLayouts(int pairs, int maxDepth) {
        List<String> out = new ArrayList<>();
        go(pairs, maxDepth, 0, 0, new StringBuilder(), out);
        return out.toArray(new String[0]);
    }

    private void go(int pairs, int maxDepth, int open, int close, StringBuilder buf, List<String> out) {
        if (buf.length() == 2 * pairs) {
            out.add(buf.toString());
            return;
        }
        if (open < pairs && open - close < maxDepth) {
            buf.append('(');
            go(pairs, maxDepth, open + 1, close, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
        if (close < open) {
            buf.append(')');
            go(pairs, maxDepth, open, close + 1, buf, out);
            buf.deleteCharAt(buf.length() - 1);
        }
    }
}
`,
  },
  oracle: (pairs, maxDepth) => {
    const out = [];
    for (let m = 0; m < 1 << (2 * pairs); m++) {
      let depth = 0, ok = true, s = "";
      for (let i = 0; i < 2 * pairs && ok; i++) {
        const open = (m >> i) & 1;
        depth += open ? 1 : -1;
        s += open ? "(" : ")";
        if (depth < 0 || depth > maxDepth) ok = false;
      }
      if (ok && depth === 0) out.push(s);
    }
    return out;
  },
  public: [
    { args: [3, 2], explain: "Of the five correctly nested strings with three pairs, only ((())) goes three deep, so four remain." },
    { args: [2, 2] },
  ],
  hidden: [[1, 1], [2, 1], [3, 1], [3, 3], [4, 2], [4, 4], [5, 3], [6, 2], [6, 6], [7, 4]],
  small: (g) => { const p = g.int(1, 5); return [p, g.int(1, p)]; },
  gen: `export const seed = 3115;

export default () => [[10, 10], [10, 4], [9, 9]];
`,
});

// ─── Build ──────────────────────────────────────────────────────────────────────────────────

const g = helpers(20261127);
for (const p of P) {
  const { slug, signature, comparator } = p.meta;
  const ref = new Function(`${p.solutions.js}\nreturn ${signature.function};`)();
  const check = (args) => {
    const want = p.oracle(...structuredClone(args));
    const got = ref(...structuredClone(args));
    assert.ok(compare(comparator, got, want), `${slug}: reference disagrees with oracle on ${JSON.stringify(args).slice(0, 200)}: got ${JSON.stringify(got).slice(0, 120)}, want ${JSON.stringify(want).slice(0, 120)}`);
    return want;
  };
  for (let i = 0; i < 300; i++) check(p.small(g));
  const pub = p.public.map((t) => ({ ...t, out: check(t.args) }));
  const hid = p.hidden.map((args) => ({ args, out: check(args) }));
  assert.ok(pub.length >= 2 && pub.length <= 3 && hid.length >= 8, `${slug}: test counts`);

  const dir = join(root, "content/problems", slug);
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ["solutions", "tests/public", "tests/hidden"]) mkdirSync(join(dir, sub), { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(p.meta, null, 2) + "\n");
  writeFileSync(join(dir, "statement.md"), p.statement);
  writeFileSync(join(dir, "hints.md"), p.hints);
  writeFileSync(join(dir, "editorial.md"), p.editorial);
  writeFileSync(join(dir, "solutions/solution.js"), p.solutions.js);
  writeFileSync(join(dir, "solutions/solution.py"), p.solutions.py);
  writeFileSync(join(dir, "solutions/solution.cpp"), p.solutions.cpp);
  writeFileSync(join(dir, "solutions/Solution.java"), p.solutions.java);
  const nn = (i) => String(i + 1).padStart(2, "0");
  pub.forEach((t, i) => {
    writeFileSync(join(dir, `tests/public/${nn(i)}.in`), JSON.stringify(t.args) + "\n");
    writeFileSync(join(dir, `tests/public/${nn(i)}.out`), JSON.stringify(t.out) + "\n");
    if (t.explain) writeFileSync(join(dir, `tests/public/${nn(i)}.explain.md`), t.explain + "\n");
  });
  hid.forEach((t, i) => {
    writeFileSync(join(dir, `tests/hidden/${nn(i)}.in`), JSON.stringify(t.args) + "\n");
    writeFileSync(join(dir, `tests/hidden/${nn(i)}.out`), JSON.stringify(t.out) + "\n");
  });
  writeFileSync(join(dir, "tests/gen.mjs"), p.gen);
  console.log(`${slug}: ${pub.length} public, ${hid.length} handwritten hidden, reference matches oracle`);
}
console.log(`wrote ${P.length} problems; now run npm run content:gen and npm run content:validate`);
