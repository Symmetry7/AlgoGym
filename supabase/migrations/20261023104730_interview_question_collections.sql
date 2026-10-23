-- Original AlgoGym study prompts linked to public learning references. The
-- completion checkbox records self-assessed review, not a judged submission.
insert into public.interview_questions(id,title,source,url,difficulty,tags) values
('sd-url-shortener','How would you design a URL shortener?','System Design Primer','https://github.com/donnemartin/system-design-primer','Medium',array['APIs','Storage']),
('sd-rate-limiter','How would you design an API rate limiter?','System Design Primer','https://github.com/donnemartin/system-design-primer','Medium',array['Caching','Distributed Systems']),
('sd-feed','How would you design a personalized activity feed?','System Design Primer','https://github.com/donnemartin/system-design-primer','Hard',array['Feeds','Caching']),
('sd-chat','How would you design a realtime messaging service?','System Design Primer','https://github.com/donnemartin/system-design-primer','Hard',array['Realtime','Storage']),
('sd-file-storage','How would you design a cloud file store?','System Design Primer','https://github.com/donnemartin/system-design-primer','Hard',array['Storage','Reliability']),
('sd-search-autocomplete','How would you design search autocomplete?','System Design Primer','https://github.com/donnemartin/system-design-primer','Medium',array['Search','Caching']),
('sd-notifications','How would you design a notification service?','System Design Primer','https://github.com/donnemartin/system-design-primer','Medium',array['Queues','Reliability']),
('sd-metrics','How would you design a metrics collection pipeline?','System Design Primer','https://github.com/donnemartin/system-design-primer','Hard',array['Queues','Storage']),
('sd-leaderboard','How would you design a realtime leaderboard?','System Design Primer','https://github.com/donnemartin/system-design-primer','Medium',array['Ranking','Caching']),
('sd-checkout','How would you design an idempotent checkout API?','System Design Primer','https://github.com/donnemartin/system-design-primer','Hard',array['APIs','Consistency']),
('hr-introduction','How would you introduce yourself in two minutes?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Introduction']),
('hr-project','Which project best shows your contribution?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Projects']),
('hr-conflict','Describe a disagreement and how you resolved it.','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Teamwork']),
('hr-failure','Describe a mistake you made and what changed afterward.','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Reflection']),
('hr-feedback','How have you acted on difficult feedback?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Growth']),
('hr-priorities','Tell me about competing deadlines and your priorities.','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Planning']),
('hr-ownership','When did you take ownership beyond your assigned task?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Ownership']),
('hr-collaboration','Tell me about helping a teammate succeed.','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Teamwork']),
('hr-motivation','Why are you interested in this role and team?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Motivation']),
('hr-questions','What would you ask your interviewer at the end?','CareerOneStop','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx',null,array['Preparation']),
('iq-complexity','How do you explain the time and space cost of an algorithm?','MIT OpenCourseWare','https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/','Easy',array['Algorithms']),
('iq-hash-collision','What happens when hash-table keys collide?','MIT OpenCourseWare','https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/','Medium',array['Data Structures']),
('iq-index','When does a database index help or hurt?','PostgreSQL','https://www.postgresql.org/docs/current/indexes.html','Medium',array['Databases']),
('iq-transaction','What do database transactions guarantee?','PostgreSQL','https://www.postgresql.org/docs/current/tutorial-transactions.html','Medium',array['Databases']),
('iq-http-cache','How does HTTP caching affect an API?','MDN','https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching','Medium',array['Web','APIs']),
('iq-event-loop','How does JavaScript schedule asynchronous work?','MDN','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop','Medium',array['JavaScript']),
('iq-authn-authz','What is the difference between authentication and authorization?','OWASP','https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html','Easy',array['Security']),
('iq-retries','How can retries make a distributed request unsafe?','AWS','https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html','Hard',array['Distributed Systems'])
on conflict(id) do nothing;

insert into public.interview_category_questions(category_slug,question_id,position)
select case when id like 'sd-%' then 'system-design' when id like 'hr-%' then 'hr-questions' else 'interview-questions' end,
       id,
       row_number() over(partition by case when id like 'sd-%' then 'system-design' when id like 'hr-%' then 'hr-questions' else 'interview-questions' end order by id)::integer - 1
from public.interview_questions
where id like 'sd-%' or id like 'hr-%' or id like 'iq-%'
on conflict(category_slug,question_id) do nothing;
