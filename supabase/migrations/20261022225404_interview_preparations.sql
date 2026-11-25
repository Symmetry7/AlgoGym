-- Interview preparation content and canonical per-user progress.
create table if not exists public.interview_companies (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  description text not null default '',
  published boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.interview_questions (
  id text primary key check (id ~ '^[a-z0-9-]{2,120}$'),
  title text not null,
  source text not null,
  url text not null check (url ~ '^https://'),
  difficulty text check (difficulty in ('Easy','Medium','Hard')),
  tags text[] not null default '{}',
  popularity text check (popularity in ('Very Hot','Hot','Warm','Cold')),
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.interview_sheet_questions (
  company_slug text not null references public.interview_companies(slug) on delete cascade,
  question_id text not null references public.interview_questions(id) on delete restrict,
  position integer not null check (position >= 0),
  primary key(company_slug,question_id),
  unique(company_slug,position)
);
create table if not exists public.interview_user_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.interview_questions(id) on delete cascade,
  completed boolean not null default false,
  bookmarked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,question_id)
);
create index if not exists interview_company_name_idx on public.interview_companies(lower(name));
create index if not exists interview_sheet_position_idx on public.interview_sheet_questions(company_slug,position);
create index if not exists interview_user_bookmarks_idx on public.interview_user_questions(user_id) where bookmarked;
alter table public.interview_companies enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_sheet_questions enable row level security;
alter table public.interview_user_questions enable row level security;
create policy interview_company_read on public.interview_companies for select to anon, authenticated using (published);
create policy interview_question_read on public.interview_questions for select to anon, authenticated using (published);
create policy interview_sheet_read on public.interview_sheet_questions for select to anon, authenticated using (
  exists(select 1 from public.interview_companies c where c.slug=company_slug and c.published)
  and exists(select 1 from public.interview_questions q where q.id=question_id and q.published)
);
create policy interview_own_state_read on public.interview_user_questions for select to authenticated using (user_id=auth.uid());
create policy interview_own_state_insert on public.interview_user_questions for insert to authenticated with check (user_id=auth.uid());
create policy interview_own_state_update on public.interview_user_questions for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select on public.interview_companies,public.interview_questions,public.interview_sheet_questions to anon,authenticated;
grant select,insert,update on public.interview_user_questions to authenticated;

insert into public.interview_companies(slug,name,description,position)
select regexp_replace(lower(name),'[^a-z0-9]+','-','g'),name,
  'An AlgoGym starter set of public DSA practice problems. Company-specific interview frequency has not been verified.',ord::integer
from unnest(array[
 'Google','Meta','Microsoft','Netflix','Amazon','Apple','LinkedIn','Atlassian','Uber','D.E. Shaw','Bloomberg','Tower Research Capital','Stripe','PayPal','Salesforce','Adobe','Flipkart','PhonePe','Meesho','CRED','Razorpay','Zomato','Swiggy','Zepto','Paytm','ServiceNow','Intuit','Walmart','Goldman Sachs','J.P. Morgan Chase','Morgan Stanley','Oracle','Cisco','Visa','Mastercard','Barclays','HSBC','Accenture','TCS + TCS NQT','Infosys','Cognizant','Wipro','HCLTech','Tech Mahindra','Capgemini'
]) with ordinality as companies(name,ord) on conflict(slug) do nothing;

insert into public.interview_questions(id,title,source,url,difficulty,tags)
values
('lc-two-sum','Two Sum','LeetCode','https://leetcode.com/problems/two-sum/','Easy',array['Arrays','Hash Table']),
('lc-valid-parentheses','Valid Parentheses','LeetCode','https://leetcode.com/problems/valid-parentheses/','Easy',array['Stack','Strings']),
('lc-reverse-linked-list','Reverse Linked List','LeetCode','https://leetcode.com/problems/reverse-linked-list/','Easy',array['Linked List']),
('lc-best-time-to-buy-and-sell-stock','Best Time to Buy and Sell Stock','LeetCode','https://leetcode.com/problems/best-time-to-buy-and-sell-stock/','Easy',array['Arrays','Dynamic Programming']),
('lc-contains-duplicate','Contains Duplicate','LeetCode','https://leetcode.com/problems/contains-duplicate/','Easy',array['Arrays','Hash Table']),
('lc-binary-search','Binary Search','LeetCode','https://leetcode.com/problems/binary-search/','Easy',array['Binary Search']),
('lc-merge-two-sorted-lists','Merge Two Sorted Lists','LeetCode','https://leetcode.com/problems/merge-two-sorted-lists/','Easy',array['Linked List']),
('lc-maximum-subarray','Maximum Subarray','LeetCode','https://leetcode.com/problems/maximum-subarray/','Medium',array['Arrays','Dynamic Programming']),
('lc-product-of-array-except-self','Product of Array Except Self','LeetCode','https://leetcode.com/problems/product-of-array-except-self/','Medium',array['Arrays','Prefix Sum']),
('lc-3sum','3Sum','LeetCode','https://leetcode.com/problems/3sum/','Medium',array['Arrays','Two Pointers']),
('lc-longest-substring-without-repeating-characters','Longest Substring Without Repeating Characters','LeetCode','https://leetcode.com/problems/longest-substring-without-repeating-characters/','Medium',array['Sliding Window','Strings']),
('lc-number-of-islands','Number of Islands','LeetCode','https://leetcode.com/problems/number-of-islands/','Medium',array['Graphs','DFS']),
('lc-course-schedule','Course Schedule','LeetCode','https://leetcode.com/problems/course-schedule/','Medium',array['Graphs','Topological Sort']),
('lc-search-in-rotated-sorted-array','Search in Rotated Sorted Array','LeetCode','https://leetcode.com/problems/search-in-rotated-sorted-array/','Medium',array['Binary Search']),
('lc-coin-change','Coin Change','LeetCode','https://leetcode.com/problems/coin-change/','Medium',array['Dynamic Programming']),
('lc-climbing-stairs','Climbing Stairs','LeetCode','https://leetcode.com/problems/climbing-stairs/','Easy',array['Dynamic Programming']),
('lc-merge-intervals','Merge Intervals','LeetCode','https://leetcode.com/problems/merge-intervals/','Medium',array['Intervals']),
('lc-top-k-frequent-elements','Top K Frequent Elements','LeetCode','https://leetcode.com/problems/top-k-frequent-elements/','Medium',array['Heap','Hash Table']),
('lc-lru-cache','LRU Cache','LeetCode','https://leetcode.com/problems/lru-cache/','Medium',array['Design','Hash Table']),
('lc-median-of-two-sorted-arrays','Median of Two Sorted Arrays','LeetCode','https://leetcode.com/problems/median-of-two-sorted-arrays/','Hard',array['Binary Search'])
on conflict(id) do nothing;

-- These are transparent AlgoGym starter exercises, not asserted company interview reports.
insert into public.interview_sheet_questions(company_slug,question_id,position)
select c.slug,q.id,q.rn - 1
from public.interview_companies c
cross join (select id,row_number() over(order by id) rn from public.interview_questions where id like 'lc-%') q
where q.rn <= 20
on conflict(company_slug,question_id) do nothing;
