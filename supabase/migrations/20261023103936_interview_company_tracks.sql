-- Publicly linked, independently selected AlgoGym practice additions. These
-- assignments are editorial routes, not reports of company interview history.
insert into public.interview_questions(id,title,source,url,difficulty,tags) values
('lc-valid-anagram','Valid Anagram','LeetCode','https://leetcode.com/problems/valid-anagram/','Easy',array['Strings','Hash Table']),
('lc-group-anagrams','Group Anagrams','LeetCode','https://leetcode.com/problems/group-anagrams/','Medium',array['Strings','Hash Table']),
('lc-longest-consecutive-sequence','Longest Consecutive Sequence','LeetCode','https://leetcode.com/problems/longest-consecutive-sequence/','Medium',array['Arrays','Hash Table']),
('lc-container-with-most-water','Container With Most Water','LeetCode','https://leetcode.com/problems/container-with-most-water/','Medium',array['Two Pointers','Arrays']),
('lc-trapping-rain-water','Trapping Rain Water','LeetCode','https://leetcode.com/problems/trapping-rain-water/','Hard',array['Two Pointers','Stack']),
('lc-minimum-window-substring','Minimum Window Substring','LeetCode','https://leetcode.com/problems/minimum-window-substring/','Hard',array['Sliding Window','Strings']),
('lc-longest-repeating-character-replacement','Longest Repeating Character Replacement','LeetCode','https://leetcode.com/problems/longest-repeating-character-replacement/','Medium',array['Sliding Window','Strings']),
('lc-find-minimum-in-rotated-sorted-array','Find Minimum in Rotated Sorted Array','LeetCode','https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/','Medium',array['Binary Search','Arrays']),
('lc-reorder-list','Reorder List','LeetCode','https://leetcode.com/problems/reorder-list/','Medium',array['Linked List','Two Pointers']),
('lc-add-two-numbers','Add Two Numbers','LeetCode','https://leetcode.com/problems/add-two-numbers/','Medium',array['Linked List','Math']),
('lc-invert-binary-tree','Invert Binary Tree','LeetCode','https://leetcode.com/problems/invert-binary-tree/','Easy',array['Trees','DFS']),
('lc-validate-binary-search-tree','Validate Binary Search Tree','LeetCode','https://leetcode.com/problems/validate-binary-search-tree/','Medium',array['Trees','DFS']),
('lc-lowest-common-ancestor-of-a-binary-search-tree','Lowest Common Ancestor of a Binary Search Tree','LeetCode','https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/','Medium',array['Trees','DFS']),
('lc-serialize-and-deserialize-binary-tree','Serialize and Deserialize Binary Tree','LeetCode','https://leetcode.com/problems/serialize-and-deserialize-binary-tree/','Hard',array['Trees','Design']),
('lc-clone-graph','Clone Graph','LeetCode','https://leetcode.com/problems/clone-graph/','Medium',array['Graphs','DFS']),
('lc-pacific-atlantic-water-flow','Pacific Atlantic Water Flow','LeetCode','https://leetcode.com/problems/pacific-atlantic-water-flow/','Medium',array['Graphs','DFS']),
('lc-word-ladder','Word Ladder','LeetCode','https://leetcode.com/problems/word-ladder/','Hard',array['Graphs','BFS']),
('lc-combination-sum','Combination Sum','LeetCode','https://leetcode.com/problems/combination-sum/','Medium',array['Backtracking','Arrays']),
('lc-word-search','Word Search','LeetCode','https://leetcode.com/problems/word-search/','Medium',array['Backtracking','Matrix']),
('lc-house-robber','House Robber','LeetCode','https://leetcode.com/problems/house-robber/','Medium',array['Dynamic Programming','Arrays']),
('lc-longest-increasing-subsequence','Longest Increasing Subsequence','LeetCode','https://leetcode.com/problems/longest-increasing-subsequence/','Medium',array['Dynamic Programming','Binary Search']),
('lc-decode-ways','Decode Ways','LeetCode','https://leetcode.com/problems/decode-ways/','Medium',array['Dynamic Programming','Strings']),
('lc-unique-paths','Unique Paths','LeetCode','https://leetcode.com/problems/unique-paths/','Medium',array['Dynamic Programming','Matrix']),
('lc-task-scheduler','Task Scheduler','LeetCode','https://leetcode.com/problems/task-scheduler/','Medium',array['Greedy','Heap']),
('lc-partition-equal-subset-sum','Partition Equal Subset Sum','LeetCode','https://leetcode.com/problems/partition-equal-subset-sum/','Medium',array['Dynamic Programming','Arrays']),
('lc-kth-largest-element-in-an-array','Kth Largest Element in an Array','LeetCode','https://leetcode.com/problems/kth-largest-element-in-an-array/','Medium',array['Heap','Arrays'])
on conflict(id) do nothing;

-- Each company gets a distinct, balanced public practice track. The original
-- 20 questions remain assigned so existing completion percentages and saved
-- state are never deleted or invalidated.
with additions as (
  select id, row_number() over(order by id)::integer - 1 as n
  from public.interview_questions
  where id in (
    'lc-valid-anagram','lc-group-anagrams','lc-longest-consecutive-sequence','lc-container-with-most-water',
    'lc-trapping-rain-water','lc-minimum-window-substring','lc-longest-repeating-character-replacement',
    'lc-find-minimum-in-rotated-sorted-array','lc-reorder-list','lc-add-two-numbers','lc-invert-binary-tree',
    'lc-validate-binary-search-tree','lc-lowest-common-ancestor-of-a-binary-search-tree',
    'lc-serialize-and-deserialize-binary-tree','lc-clone-graph','lc-pacific-atlantic-water-flow',
    'lc-word-ladder','lc-combination-sum','lc-word-search','lc-house-robber',
    'lc-longest-increasing-subsequence','lc-decode-ways','lc-unique-paths','lc-task-scheduler',
    'lc-partition-equal-subset-sum','lc-kth-largest-element-in-an-array'
  )
)
insert into public.interview_sheet_questions(company_slug,question_id,position)
select c.slug,a.id,1000+a.n
from public.interview_companies c cross join additions a
where ((a.n + c.position * 7) % 26) < 10
on conflict do nothing;

insert into public.interview_category_questions(category_slug,question_id,position)
select 'patterns', q.id, 1000 + row_number() over(order by q.title)::integer
from public.interview_questions q
where q.id in (
  'lc-valid-anagram','lc-group-anagrams','lc-longest-consecutive-sequence','lc-container-with-most-water',
  'lc-trapping-rain-water','lc-minimum-window-substring','lc-longest-repeating-character-replacement',
  'lc-find-minimum-in-rotated-sorted-array','lc-reorder-list','lc-add-two-numbers','lc-invert-binary-tree',
  'lc-validate-binary-search-tree','lc-lowest-common-ancestor-of-a-binary-search-tree',
  'lc-serialize-and-deserialize-binary-tree','lc-clone-graph','lc-pacific-atlantic-water-flow',
  'lc-word-ladder','lc-combination-sum','lc-word-search','lc-house-robber',
  'lc-longest-increasing-subsequence','lc-decode-ways','lc-unique-paths','lc-task-scheduler',
  'lc-partition-equal-subset-sum','lc-kth-largest-element-in-an-array'
)
on conflict do nothing;
