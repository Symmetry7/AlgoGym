-- Keep the package practice list progressive even without a filter.
with ordered as (
  select p.question_id,
    row_number() over(order by case q.difficulty when 'Easy' then 1 when 'Medium' then 2 else 3 end, q.title, q.id)::integer as position
  from public.interview_category_questions p
  join public.interview_questions q on q.id=p.question_id
  where p.category_slug='package-wise'
)
update public.interview_category_questions p set position=ordered.position
from ordered where p.category_slug='package-wise' and p.question_id=ordered.question_id;
