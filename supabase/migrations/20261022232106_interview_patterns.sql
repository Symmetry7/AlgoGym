insert into public.interview_questions(id,title,source,url,difficulty,tags)
values
('lc-linked-list-cycle','Linked List Cycle','LeetCode','https://leetcode.com/problems/linked-list-cycle/','Easy',array['Fast and Slow Pointer','Linked List']),
('lc-missing-number','Missing Number','LeetCode','https://leetcode.com/problems/missing-number/','Easy',array['Cyclic Sort','Arrays']),
('lc-binary-tree-level-order-traversal','Binary Tree Level Order Traversal','LeetCode','https://leetcode.com/problems/binary-tree-level-order-traversal/','Medium',array['BFS','Trees']),
('lc-subsets','Subsets','LeetCode','https://leetcode.com/problems/subsets/','Medium',array['Backtracking']),
('lc-single-number','Single Number','LeetCode','https://leetcode.com/problems/single-number/','Easy',array['Bitwise XOR']),
('lc-merge-k-sorted-lists','Merge k Sorted Lists','LeetCode','https://leetcode.com/problems/merge-k-sorted-lists/','Hard',array['K-way Merge','Heap']),
('lc-find-median-from-data-stream','Find Median from Data Stream','LeetCode','https://leetcode.com/problems/find-median-from-data-stream/','Hard',array['Two Heaps','Design']),
('lc-daily-temperatures','Daily Temperatures','LeetCode','https://leetcode.com/problems/daily-temperatures/','Medium',array['Monotonic Stack']),
('lc-maximum-depth-of-binary-tree','Maximum Depth of Binary Tree','LeetCode','https://leetcode.com/problems/maximum-depth-of-binary-tree/','Easy',array['Trees','DFS']),
('lc-jump-game','Jump Game','LeetCode','https://leetcode.com/problems/jump-game/','Medium',array['Greedy'])
on conflict(id) do nothing;
insert into public.interview_category_questions(category_slug,question_id,position)
select 'patterns',q.id,row_number() over(order by q.title)::integer-1
from public.interview_questions q where q.id like 'lc-%'
on conflict(category_slug,question_id) do nothing;
