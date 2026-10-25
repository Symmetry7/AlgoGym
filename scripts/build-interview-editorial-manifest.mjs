import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync } from "node:fs";

// These are AlgoGym editorial practice themes. They are not reports of questions
// asked by the named employers. Do not replace this input with an unlicensed
// third-party company's question compilation.
export const companyFocus = [
  ["google", ["Graph", "Sliding Window", "Binary Search", "String"], ["lc-two-sum", "lc-longest-substring-without-repeating-characters", "lc-container-with-most-water"]],
  ["meta", ["Tree", "Graph", "Two Pointers", "String"], ["lc-valid-palindrome", "lc-binary-tree-level-order-traversal"]],
  ["microsoft", ["Dynamic Programming", "Tree", "Matrix", "String"], ["lc-merge-intervals", "lc-reverse-linked-list"]],
  ["netflix", ["Design", "Heap", "Sliding Window", "Linked List"], ["lc-lru-cache", "lc-find-median-from-data-stream"]],
  ["amazon", ["Heap", "Hash Table", "Dynamic Programming", "Graph"], ["lc-two-sum", "lc-lru-cache", "lc-top-k-frequent-elements"]],
  ["apple", ["Linked List", "Two Pointers", "String", "Matrix"], ["lc-reverse-linked-list", "lc-rotate-image"]],
  ["linkedin", ["Graph", "Tree", "String", "Hash Table"], ["lc-clone-graph", "lc-word-ladder"]],
  ["atlassian", ["Graph", "Design", "String", "Stack"], ["lc-course-schedule", "lc-min-stack"]],
  ["uber", ["Graph", "Matrix", "Heap", "Greedy", "Two Pointers"], ["lc-number-of-islands", "lc-merge-intervals"]],
  ["d-e-shaw", ["Bit Manipulation", "Math", "Dynamic Programming", "Backtracking"], ["lc-single-number", "lc-n-queens"]],
  ["bloomberg", ["Heap", "Design", "String", "Hash Table"], ["lc-lru-cache", "lc-find-median-from-data-stream"]],
  ["tower-research-capital", ["Math", "Bit Manipulation", "Greedy", "Dynamic Programming"], ["lc-median-of-two-sorted-arrays", "lc-single-number"]],
  ["stripe", ["String", "Design", "Hash Table", "Simulation"], ["lc-string-to-integer-atoi", "lc-lru-cache"]],
  ["paypal", ["Dynamic Programming", "Graph", "Hash Table", "Heap"], ["lc-coin-change", "lc-course-schedule"]],
  ["salesforce", ["Tree", "Graph", "String", "Design"], ["lc-implement-trie-prefix-tree", "lc-clone-graph"]],
  ["adobe", ["String", "Two Pointers", "Dynamic Programming", "Linked List"], ["lc-text-justification", "lc-edit-distance"]],
  ["flipkart", ["Heap", "Matrix", "Dynamic Programming", "Greedy"], ["lc-top-k-frequent-elements", "lc-unique-paths"]],
  ["phonepe", ["Dynamic Programming", "Graph", "Design", "Hash Table"], ["lc-coin-change", "lc-lru-cache"]],
  ["meesho", ["Heap", "Stack", "Dynamic Programming", "Matrix"], ["lc-daily-temperatures", "lc-top-k-frequent-elements"]],
  ["cred", ["Design", "Hash Table", "Binary Search", "Graph"], ["lc-lru-cache", "lc-search-in-rotated-sorted-array"]],
  ["razorpay", ["Heap", "Sliding Window", "Greedy", "Design", "Hash Table"], ["lc-minimum-window-substring", "lc-lru-cache"]],
  ["zomato", ["Graph", "Heap", "Greedy", "Matrix", "Two Pointers"], ["lc-number-of-islands", "lc-course-schedule"]],
  ["swiggy", ["Graph", "Sliding Window", "Two Pointers", "Greedy"], ["lc-longest-substring-without-repeating-characters", "lc-jump-game"]],
  ["zepto", ["Heap", "Greedy", "Sorting", "Graph", "Dynamic Programming"], ["lc-top-k-frequent-elements", "lc-merge-intervals"]],
  ["paytm", ["Dynamic Programming", "Hash Table", "Graph", "Math"], ["lc-coin-change", "lc-two-sum"]],
  ["servicenow", ["Graph", "Tree", "String", "Design"], ["lc-course-schedule", "lc-implement-trie-prefix-tree"]],
  ["intuit", ["String", "Tree", "Dynamic Programming", "Graph"], ["lc-decode-ways", "lc-validate-binary-search-tree"]],
  ["walmart", ["Graph", "Greedy", "Dynamic Programming", "Matrix"], ["lc-unique-paths", "lc-jump-game"]],
  ["goldman-sachs", ["Math", "Sliding Window", "Greedy", "Dynamic Programming"], ["lc-maximum-subarray", "lc-coin-change"]],
  ["j-p-morgan-chase", ["Math", "Dynamic Programming", "Hash Table", "Design"], ["lc-two-sum", "lc-lru-cache"]],
  ["morgan-stanley", ["Design", "Tree", "Math", "Dynamic Programming"], ["lc-lru-cache", "lc-validate-binary-search-tree"]],
  ["oracle", ["Tree", "Hash Table", "Matrix", "Design"], ["lc-binary-search-tree-iterator", "lc-rotate-image"]],
  ["cisco", ["Bit Manipulation", "Graph", "Trie", "String"], ["lc-implement-trie-prefix-tree", "lc-number-of-1-bits"]],
  ["visa", ["Dynamic Programming", "Graph", "Hash Table", "Math"], ["lc-coin-change", "lc-happy-number"]],
  ["mastercard", ["Hash Table", "String", "Dynamic Programming", "Tree"], ["lc-two-sum", "lc-decode-ways"]],
  ["barclays", ["Array", "Linked List", "Tree", "Hash Table"], ["lc-reverse-linked-list", "lc-two-sum"]],
  ["hsbc", ["Array", "String", "Linked List", "Tree"], ["lc-valid-parentheses", "lc-merge-two-sorted-lists"]],
  ["accenture", ["Array", "String", "Math", "Simulation"], ["lc-two-sum", "lc-palindrome-number"]],
  ["tcs-tcs-nqt", ["Array", "String", "Math", "Sorting"], ["lc-two-sum", "lc-reverse-integer"]],
  ["infosys", ["Array", "Math", "String", "Greedy"], ["lc-majority-element", "lc-jump-game"]],
  ["cognizant", ["Array", "String", "Two Pointers", "Sorting"], ["lc-merge-sorted-array", "lc-valid-palindrome"]],
  ["wipro", ["Array", "Math", "String", "Bit Manipulation"], ["lc-palindrome-number", "lc-single-number"]],
  ["hcltech", ["Array", "String", "Math", "Simulation"], ["lc-reverse-integer", "lc-valid-parentheses"]],
  ["tech-mahindra", ["Array", "String", "Bit Manipulation", "Matrix"], ["lc-single-number", "lc-spiral-matrix"]],
  ["capgemini", ["Array", "String", "Recursion", "Dynamic Programming"], ["lc-climbing-stairs", "lc-maximum-subarray"]],
];

export const patternGroups = [
  ["Fast and Slow Pointer", ["Fast and Slow Pointer"], ["lc-linked-list-cycle", "lc-linked-list-cycle-ii"]],
  ["Overlapping Intervals", ["Intervals"], ["lc-merge-intervals", "lc-insert-interval"]],
  ["Prefix Sum", ["Prefix Sum"], ["lc-product-of-array-except-self", "lc-subarray-sum-equals-k"]],
  ["Sliding Window", ["Sliding Window"], []],
  ["Two Pointers", ["Two Pointers"], []],
  ["Cyclic Sort", ["Cyclic Sort"], ["lc-missing-number"]],
  ["Reversal of Linked List", ["Linked List"], ["lc-reverse-linked-list", "lc-reverse-linked-list-ii", "lc-reorder-list"]],
  ["Matrix Manipulation", ["Matrix"], []],
  ["Breadth-First Search", ["Breadth-First Search", "BFS"], []],
  ["Depth-First Search", ["Depth-First Search", "DFS"], []],
  ["Backtracking", ["Backtracking"], []],
  ["Modified Binary Search", ["Binary Search"], []],
  ["Bitwise XOR", ["Bit Manipulation", "Bitwise XOR"], []],
  ["Top K Elements", ["Heap"], ["lc-top-k-frequent-elements", "lc-kth-largest-element-in-an-array"]],
  ["K-way Merge", ["K-way Merge"], ["lc-merge-k-sorted-lists"]],
  ["Two Heaps", ["Two Heaps"], ["lc-find-median-from-data-stream"]],
  ["Monotonic Stack", ["Monotonic Stack"], []],
  ["Trees", ["Tree", "Trees", "Binary Tree"], []],
  ["Dynamic Programming", ["Dynamic Programming"], []],
  ["Graphs", ["Graph", "Graphs"], []],
  ["Greedy", ["Greedy"], []],
  ["Design Data Structure", ["Design"], []],
];

const sourceFiles = readdirSync("supabase/migrations")
  .filter((name) => name <= "20261023120152_interview_public_practice_expansion.sql" && name.endsWith(".sql"))
  .sort();
const catalog = new Map();
const row = /\('(lc-[^']+)','((?:''|[^'])*)','LeetCode','(https:\/\/[^']+)','(Easy|Medium|Hard)',array\[(.*?)\](?:::text\[\])?\)/gs;
for (const file of sourceFiles) {
  const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
  for (const match of sql.matchAll(row)) {
    const [, id, rawTitle, url, difficulty, rawTags] = match;
    if (catalog.has(id)) continue;
    const tags = [...rawTags.matchAll(/'((?:''|[^'])*)'/g)].map((tag) => tag[1].replaceAll("''", "'"));
    catalog.set(id, { id, title: rawTitle.replaceAll("''", "'"), url, difficulty, tags });
  }
}
if (catalog.size < 200) throw new Error(`Only ${catalog.size} public LeetCode records found`);
const norm = (tag) => tag.toLowerCase().replace(/s$/, "").replace("depth-first search", "dfs").replace("breadth-first search", "bfs");
const score = (q, tags) => tags.filter((tag) => q.tags.some((item) => norm(item) === norm(tag))).length;
const dsa = [...catalog.values()].filter((q) => !q.tags.some((tag) => ["database", "shell"].includes(tag.toLowerCase())));
const sqlQuote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const manifest = {};
for (const [slug, tags, featured] of companyFocus) {
  for (const id of featured) if (!catalog.has(id)) throw new Error(`Missing ${id} for ${slug}`);
  const matches = dsa.filter((q) => score(q, tags) > 0);
  const ordered = [...new Set([...featured, ...matches.sort((a, b) =>
    score(b, tags) - score(a, tags) || a.difficulty.localeCompare(b.difficulty) || a.id.localeCompare(b.id)
  ).map((q) => q.id)])].slice(0, 80);
  if (ordered.length < 22) throw new Error(`Only ${ordered.length} tagged problems for ${slug}`);
  manifest[slug] = { source: "AlgoGym editorial topic practice; no employer frequency claim", focus: tags, questionIds: ordered };
}
if (Object.keys(manifest).length !== 45) throw new Error("Expected 45 independently configured companies");
const sequences = Object.values(manifest).map((entry) => entry.questionIds.join(","));
if (new Set(sequences).size !== sequences.length) {
  const repeats = Object.entries(manifest).filter(([, entry], index) => sequences.indexOf(entry.questionIds.join(",")) !== index).map(([slug]) => slug);
  throw new Error(`A full company sequence was duplicated: ${repeats.join(", ")}`);
}

// Include only questions that have a named pattern group. Each canonical ID
// has one primary group here; it can still appear in other AlgoGym sheets.
const patternIds = Object.fromEntries(patternGroups.map(([name]) => [name, []]));
const ungrouped = [];
for (const q of dsa) {
  const groups = patternGroups.filter(([, tags, featured]) => featured.includes(q.id) || score(q, tags) > 0);
  if (groups.length) for (const [name] of groups) patternIds[name].push(q.id);
  else ungrouped.push(q.id);
}
const selectedPatterns = [...new Set(Object.values(patternIds).flat())];
if (selectedPatterns.length < 150) throw new Error(`Only ${selectedPatterns.length} pattern problems found`);
const output = {
  observedAt: "2026-10-24",
  catalogCount: catalog.size,
  companyTracks: manifest,
  patterns: patternIds,
  ungrouped,
};
writeFileSync("docs/interview-editorial-manifest.json", JSON.stringify(output, null, 2) + "\n");
writeFileSync("src/screens/interview-pattern-groups.json", JSON.stringify(patternIds, null, 2) + "\n");

const placementRows = Object.entries(manifest).flatMap(([slug, track]) =>
  track.questionIds.map((id, position) => `(${sqlQuote(slug)},${sqlQuote(id)},${position})`)
);
const patternRows = selectedPatterns.map((id, position) => `('patterns',${sqlQuote(id)},${position})`);
const migration = `-- Replace the uniform generated company tracks with explicit AlgoGym editorial topic tracks.
-- These problem-to-company relationships are NOT verified interview reports.
-- Canonical user completion/bookmark rows are preserved.
create schema if not exists private;
create table if not exists private.interview_sheet_questions_before_editorial_repair_20261024
  as select * from public.interview_sheet_questions;
revoke all on private.interview_sheet_questions_before_editorial_repair_20261024 from anon, authenticated;
delete from public.interview_sheet_questions where company_slug in (${companyFocus.map(([slug]) => sqlQuote(slug)).join(",")});
insert into public.interview_sheet_questions(company_slug,question_id,position) values
${placementRows.join(",\n")};
delete from public.interview_category_questions where category_slug='patterns';
insert into public.interview_category_questions(category_slug,question_id,position) values
${patternRows.join(",\n")};
`;
writeFileSync("supabase/migrations/20261024135500_interview_editorial_track_repair.sql", migration);
console.log(JSON.stringify({ catalog: catalog.size, companies: Object.keys(manifest).length, placements: placementRows.length, patterns: selectedPatterns.length, minCompany: Math.min(...Object.values(manifest).map((x) => x.questionIds.length)), maxCompany: Math.max(...Object.values(manifest).map((x) => x.questionIds.length)) }));
