select l.status, count(*) as lessons
from public.ai_learning_lessons l
group by l.status
order by l.status;

select p.title as course, m.title as module, l.title as lesson, l.status
from public.ai_learning_lessons l
join public.ai_learning_modules m on m.id=l.module_id
join public.ai_learning_paths p on p.id=m.path_id
where l.status='failed'
order by l.updated_at desc
limit 3;
