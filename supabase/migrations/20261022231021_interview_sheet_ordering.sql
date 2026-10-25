-- Editorial ordering can be changed without a transient unique-position collision.
alter table public.interview_sheet_questions
  drop constraint if exists interview_sheet_questions_company_slug_position_key;
create index if not exists interview_sheet_order_idx
  on public.interview_sheet_questions(company_slug,position,question_id);
update public.interview_sheet_questions s
set position=case s.question_id
  when 'lc-two-sum' then 0
  when 'lc-valid-parentheses' then 1
  when 'lc-contains-duplicate' then 2
  when 'lc-best-time-to-buy-and-sell-stock' then 3
  when 'lc-reverse-linked-list' then 4
  when 'lc-binary-search' then 5
  when 'lc-merge-two-sorted-lists' then 6
  when 'lc-climbing-stairs' then 7
  when 'lc-maximum-subarray' then 8
  when 'lc-product-of-array-except-self' then 9
  when 'lc-3sum' then 10
  when 'lc-longest-substring-without-repeating-characters' then 11
  when 'lc-number-of-islands' then 12
  when 'lc-course-schedule' then 13
  when 'lc-search-in-rotated-sorted-array' then 14
  when 'lc-coin-change' then 15
  when 'lc-merge-intervals' then 16
  when 'lc-top-k-frequent-elements' then 17
  when 'lc-lru-cache' then 18
  when 'lc-median-of-two-sorted-arrays' then 19
  else s.position end
where s.position between 0 and 19;
