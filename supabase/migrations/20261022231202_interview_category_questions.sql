create table if not exists public.interview_category_questions (
  category_slug text not null check (category_slug ~ '^[a-z0-9-]{2,80}$'),
  question_id text not null references public.interview_questions(id) on delete cascade,
  position integer not null check (position >= 0),
  primary key(category_slug,question_id)
);
create index if not exists interview_category_order_idx on public.interview_category_questions(category_slug,position);
alter table public.interview_category_questions enable row level security;
create policy interview_category_read on public.interview_category_questions for select to anon,authenticated using (
  exists(select 1 from public.interview_questions q where q.id=question_id and q.published)
);
grant select on public.interview_category_questions to anon,authenticated;
insert into public.interview_questions(id,title,source,url,difficulty,tags)
values
('sql-combine-two-tables','Combine Two Tables','LeetCode','https://leetcode.com/problems/combine-two-tables/','Easy',array['SQL','Joins']),
('sql-second-highest-salary','Second Highest Salary','LeetCode','https://leetcode.com/problems/second-highest-salary/','Medium',array['SQL','Subqueries']),
('sql-employees-earning-more-than-managers','Employees Earning More Than Their Managers','LeetCode','https://leetcode.com/problems/employees-earning-more-than-their-managers/','Easy',array['SQL','Self Join']),
('sql-duplicate-emails','Duplicate Emails','LeetCode','https://leetcode.com/problems/duplicate-emails/','Easy',array['SQL','Grouping']),
('sql-customers-who-never-order','Customers Who Never Order','LeetCode','https://leetcode.com/problems/customers-who-never-order/','Easy',array['SQL','Anti Join']),
('sql-rank-scores','Rank Scores','LeetCode','https://leetcode.com/problems/rank-scores/','Medium',array['SQL','Window Functions']),
('sql-department-highest-salary','Department Highest Salary','LeetCode','https://leetcode.com/problems/department-highest-salary/','Medium',array['SQL','Grouping']),
('sql-consecutive-numbers','Consecutive Numbers','LeetCode','https://leetcode.com/problems/consecutive-numbers/','Medium',array['SQL','Window Functions'])
on conflict(id) do nothing;
insert into public.interview_category_questions(category_slug,question_id,position)
values
('sql','sql-combine-two-tables',0),('sql','sql-duplicate-emails',1),('sql','sql-customers-who-never-order',2),
('sql','sql-employees-earning-more-than-managers',3),('sql','sql-second-highest-salary',4),('sql','sql-rank-scores',5),
('sql','sql-department-highest-salary',6),('sql','sql-consecutive-numbers',7)
on conflict(category_slug,question_id) do nothing;
