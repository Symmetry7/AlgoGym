-- Design Twitter is also used by the system-design sheet with a separate article URL.
-- Give the LeetCode exercise its own canonical ID so both resources keep correct links.
insert into public.interview_questions(id,title,source,url,difficulty,tags) values
('pattern-design-twitter','Design Twitter','LeetCode','https://leetcode.com/problems/design-twitter/','Medium',array['Design Data Structure'])
on conflict(id) do nothing;
update public.interview_category_questions
set question_id='pattern-design-twitter'
where category_slug='patterns' and question_id='lc-design-twitter';
