import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

// Original AlgoGym rehearsal prompts. These are not copied from Hynts, and
// the shared external URL is explicitly labelled a general guide, not an answer.
const groups = [
  ["Background", "Easy", [
    "Which experience first made software engineering interesting to you?",
    "How has your area of study shaped the way you solve problems?",
    "Which skill have you improved most during the last year?",
    "What part of your background would not be obvious from your resume?",
    "Which class or course changed how you approach a technical challenge?",
    "How do you explain your current work to someone outside technology?",
    "What have you learned from a nontechnical experience?",
    "Which accomplishment are you most proud of, and what was your contribution?",
    "What would a former teammate say you do especially well?",
    "How has your career direction changed since you began studying?",
  ]],
  ["Motivation", "Easy", [
    "What specific problem in this role would you be excited to work on?",
    "What would you like to learn in your first six months here?",
    "How did you decide which companies to apply to?",
    "Which part of our product would you want to understand first?",
    "What does a successful first year in this role look like to you?",
    "Which kind of engineering team helps you do your best work?",
    "Why are you considering a change from your current path?",
    "What makes this opportunity different from the others you are considering?",
    "Which company value connects most clearly to your own experience?",
    "How would you decide whether an offer is right for you?",
  ]],
  ["Projects", "Medium", [
    "Tell me about a project where the requirements changed halfway through.",
    "What was the hardest trade-off in a project you owned?",
    "Which project decision would you revisit with what you know now?",
    "How did you verify that a feature you built solved the user problem?",
    "Describe a project where you had to learn an unfamiliar tool quickly.",
    "What part of a team project was specifically your responsibility?",
    "How did you recover when a project milestone slipped?",
    "What evidence shows that your project had an impact?",
    "When did you choose a simpler implementation over an ambitious one?",
    "How would you explain a failed project to a new teammate?",
  ]],
  ["Teamwork", "Medium", [
    "Describe a time you helped unblock someone else's work.",
    "How did you share credit for a result that several people produced?",
    "When did you adapt your communication style for another teammate?",
    "How do you keep remote teammates informed without overwhelming them?",
    "What did you do when a teammate needed more support than expected?",
    "How did you make a technical decision with people from different disciplines?",
    "Describe a time you asked for help earlier than you usually would.",
    "How have you helped a new teammate become effective?",
    "What do you do when a team member misses an agreed deadline?",
    "How do you make sure a quiet teammate can contribute to a discussion?",
  ]],
  ["Feedback", "Medium", [
    "What feedback initially surprised you, and how did you respond?",
    "When have you changed your mind after a code review?",
    "How do you give critical feedback to a peer respectfully?",
    "Describe a time you had to clarify feedback before acting on it.",
    "What recurring feedback have you worked to address?",
    "When did you recognize that your feedback was not useful?",
    "How did you handle disagreement about the quality of your work?",
    "What feedback have you requested proactively?",
    "How do you separate a critique of your idea from a critique of yourself?",
    "What did you learn from a mentor that changed your work habits?",
  ]],
  ["Ownership", "Medium", [
    "When did you notice a problem nobody had assigned to you?",
    "How did you make progress when your manager was unavailable?",
    "Describe a time you documented a decision for people who came later.",
    "What did you do when a task had no clear owner?",
    "How do you decide when to escalate a risk?",
    "When did you simplify a process that others had accepted as normal?",
    "How have you protected quality under a tight deadline?",
    "When did you follow through after a feature was shipped?",
    "What responsibility have you taken that was outside your formal role?",
    "How do you balance independence with keeping stakeholders informed?",
  ]],
  ["Priorities", "Medium", [
    "How do you choose between two urgent requests from different people?",
    "Describe a time you cut scope while preserving the main outcome.",
    "When did new information force you to change your plan?",
    "How do you estimate work you have never done before?",
    "What do you do when a deadline and a quality concern conflict?",
    "How have you handled an interruption during focused work?",
    "What signal tells you that you should stop polishing a task?",
    "When did you have to explain a delay before it became a surprise?",
    "How do you prioritize maintenance against new features?",
    "What would you do if you had only one day to improve a troubled project?",
  ]],
  ["Growth", "Easy", [
    "What have you taught yourself outside a formal course?",
    "How do you check whether you really understand a new concept?",
    "What technical habit have you changed recently?",
    "Which challenge currently stretches you most?",
    "How do you choose what to learn next?",
    "What have you learned from someone with less experience than you?",
    "How do you turn a mistake into a repeatable improvement?",
    "What would you like colleagues to teach you?",
    "How do you keep up with tools without chasing every new trend?",
    "What would you do differently in your next internship or project?",
  ]],
  ["Judgment", "Hard", [
    "What would you do if a teammate asked you to hide a production incident?",
    "How would you respond if a manager asked you to skip a security review?",
    "When would you challenge a decision made by a more senior engineer?",
    "How would you handle discovering that a metric you reported was wrong?",
    "What would you do if a customer request conflicted with user privacy?",
    "How would you address repeated unkind behavior from a high-performing teammate?",
    "What would you do if your code caused a costly outage?",
    "How would you handle pressure to claim credit for another person's work?",
    "When might you decline a task even though it was assigned to you?",
    "How would you respond if an interview question revealed confidential information?",
  ]],
];
const prompts = groups.flatMap(([topic, difficulty, titles]) => titles.map((title) => ({ topic, difficulty, title })));
assert.equal(prompts.length, 90);
assert.equal(new Set(prompts.map((prompt) => prompt.title.toLowerCase())).size, 90);
const esc = (value) => String(value).replaceAll("'", "''");
const rows = prompts.map((prompt, index) => ({ ...prompt, id: `hr-original-${String(index + 1).padStart(3, "0")}` }));
const sql = [
  "-- Original AlgoGym interview rehearsal prompts. Shared external link is a general guide, not a per-question answer.",
  "insert into public.interview_questions(id,title,source,url,difficulty,tags) values",
  rows.map((prompt) => `('${prompt.id}','${esc(prompt.title)}','General interview guide','https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx','${prompt.difficulty}',array['${prompt.topic}'])`).join(",\n") + "\non conflict(id) do nothing;",
  "update public.interview_questions set source='General interview guide', difficulty=case when id in ('hr-introduction','hr-motivation','hr-questions') then 'Easy' when id in ('hr-conflict','hr-failure') then 'Hard' else 'Medium' end where id in ('hr-introduction','hr-project','hr-conflict','hr-failure','hr-feedback','hr-priorities','hr-ownership','hr-collaboration','hr-motivation','hr-questions');",
  "insert into public.interview_category_questions(category_slug,question_id,position) values",
  rows.map((prompt, index) => `('hr-questions','${prompt.id}',${index + 10})`).join(",\n") + "\non conflict(category_slug,question_id) do nothing;",
].join("\n");
writeFileSync("supabase/migrations/20261024201000_interview_hr_original_prompts.sql", sql + "\n");
writeFileSync("docs/interview-hr-original-manifest.json", JSON.stringify({ authoredAt: "2026-10-24", author: "AlgoGym", note: "Original rehearsal prompts; general guide is not a per-question answer", prompts: rows }, null, 2) + "\n");
console.log(`Wrote ${rows.length} original prompts; existing 10 remain.`);
