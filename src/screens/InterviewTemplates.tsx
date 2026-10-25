"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Mail,
  Search,
} from "lucide-react";

type Template = {
  slug: string;
  title: string;
  group: string;
  summary: string;
  subject: string;
  body: string;
  tips: string[];
};

const templates: Template[] = [
  {
    slug: "referral-request",
    title: "Referral request",
    group: "Finding a role",
    summary: "Ask someone whose work you know about a specific opening.",
    subject: "Question about [role] at [company]",
    body: "Hi [name],\n\nI enjoyed your recent work on [specific project or topic]. I’m applying for the [role] opening at [company], and my [relevant project] involved [concrete result].\n\nIf you think my background fits the team, would you be comfortable referring me? Here is the role link: [job link], and my resume: [resume link]. I understand if you can’t.\n\nThank you for your time,\n[your name]",
    tips: [
      "Name the exact role and include its link.",
      "Show one relevant result before asking.",
      "Make it easy to decline.",
    ],
  },
  {
    slug: "internship-introduction",
    title: "Internship introduction",
    group: "Finding a role",
    summary: "Introduce your work to a team with an internship opening.",
    subject: "Internship interest — [team]",
    body: "Hi [name],\n\nI’m a [year] student at [college] interested in the [team] internship at [company]. I recently built [project], where I [specific technical contribution and outcome].\n\nI’d be grateful if you could point me to the best application route. My resume is here: [resume link], and the project is here: [project link].\n\nThanks for considering it,\n[your name]",
    tips: [
      "Lead with a real project.",
      "Keep links accessible without attachments.",
      "Ask for guidance when no referral path is known.",
    ],
  },
  {
    slug: "recruiter-follow-up",
    title: "Recruiter follow-up",
    group: "Finding a role",
    summary:
      "Follow up after an application without repeating your entire resume.",
    subject: "Following up on [role] application",
    body: "Hi [name],\n\nI applied for the [role] position on [date] and wanted to follow up. My experience with [relevant skill] aligns with [specific requirement], particularly through [brief evidence].\n\nPlease let me know if I can provide anything useful for the review. Thank you for your time.\n\nBest,\n[your name]",
    tips: [
      "Wait a reasonable interval after applying.",
      "Use the correct job title and date.",
      "One follow-up is usually enough.",
    ],
  },
  {
    slug: "alumni-conversation",
    title: "Alumni conversation",
    group: "Building connections",
    summary: "Ask a college alumnus for a brief perspective on their work.",
    subject: "[college] student curious about [team]",
    body: "Hi [name],\n\nI’m studying [subject] at [college] and noticed we share an alumni connection. I’m exploring [area] and found your work on [specific topic] interesting.\n\nCould I ask you two questions about how you entered this field? A short reply would already be helpful.\n\nThank you,\n[your name]",
    tips: [
      "Mention the real shared connection.",
      "Ask a narrow question.",
      "Do not assume the person can refer you.",
    ],
  },
  {
    slug: "mentor-request",
    title: "Mentor request",
    group: "Building connections",
    summary: "Seek targeted advice from an engineer you respect.",
    subject: "A question about [technical area]",
    body: "Hi [name],\n\nYour explanation of [article, talk, or project] helped me understand [specific insight]. I’m working on [project or learning goal] and have one question: [focused question].\n\nIf you have a moment to share your view, I’d appreciate it. No call is needed unless that is easier for you.\n\nBest,\n[your name]",
    tips: [
      "Read their work first.",
      "Ask one answerable question.",
      "Respect their time and preferred format.",
    ],
  },
  {
    slug: "event-follow-up",
    title: "Event follow-up",
    group: "Building connections",
    summary: "Continue a conversation after a meetup or conference.",
    subject: "Great meeting you at [event]",
    body: "Hi [name],\n\nIt was great speaking with you at [event] about [specific topic]. I looked into [thing you discussed] afterward and found [brief observation].\n\nI’d like to stay in touch as I keep exploring [area]. Here is the resource I mentioned: [link].\n\nBest,\n[your name]",
    tips: [
      "Follow up while the conversation is fresh.",
      "Recall one real detail.",
      "Offer the resource you promised.",
    ],
  },
  {
    slug: "open-source-introduction",
    title: "Open-source contribution",
    group: "Working together",
    summary: "Approach a maintainer with a specific contribution plan.",
    subject: "Contribution idea for [repository]",
    body: "Hi [name],\n\nI’ve been using [repository] for [purpose] and noticed [specific issue or opportunity]. I’d like to contribute a small change that [proposed outcome].\n\nBefore I open a pull request, is [approach] aligned with the project’s direction? I’ve read the contribution guide and can share a short draft.\n\nThanks,\n[your name]",
    tips: [
      "Read the project guidelines.",
      "Describe a small, concrete change.",
      "Do not promise work you cannot complete.",
    ],
  },
  {
    slug: "project-collaboration",
    title: "Project collaboration",
    group: "Working together",
    summary: "Suggest a small shared project with a clear next step.",
    subject: "A small collaboration on [topic]",
    body: "Hi [name],\n\nI liked your work on [specific project]. I’m exploring [related problem] and think a small collaboration could be useful: [one-sentence idea].\n\nI can build [concrete first part] this week. Would you be interested in reviewing a short outline before deciding?\n\nBest,\n[your name]",
    tips: [
      "Explain why this person is a good fit.",
      "Make the first commitment yours.",
      "Give them an easy decision.",
    ],
  },
];

const roleOutreach: Array<[string,string,string,string]> = [
  ["mern-referral","MERN Stack Developer","Tech Stack Specific","A deployed MongoDB, Express, React, and Node project"],
  ["react-referral","React Developer","Tech Stack Specific","An accessible React interface with measured improvements"],
  ["node-referral","Node.js Backend Developer","Tech Stack Specific","A Node.js API with tests, observability, and reliable data handling"],
  ["fullstack-referral","Full Stack Developer","Tech Stack Specific","An end-to-end feature from schema to user interface"],
  ["vue-referral","Vue.js Developer","Tech Stack Specific","A Vue component system or production feature"],
  ["angular-referral","Angular Developer","Tech Stack Specific","An Angular workflow with typed state and robust forms"],
  ["django-referral","Python/Django Developer","Tech Stack Specific","A Django service with clear models and secured endpoints"],
  ["devops-referral","DevOps Engineer","Cloud & DevOps","A delivery pipeline or deployment reliability improvement"],
  ["aws-referral","AWS Cloud Engineer","Cloud & DevOps","An AWS architecture with documented cost and recovery choices"],
  ["data-referral","Data Engineer","Data & AI/ML","A validated data pipeline with quality checks"],
  ["ml-referral","ML/AI Engineer","Data & AI/ML","An evaluated model with an honest baseline and deployment plan"],
  ["react-native-referral","React Native Developer","Mobile Development","A tested cross-platform mobile feature"],
  ["flutter-referral","Flutter Developer","Mobile Development","A Flutter application with responsive state and accessibility"],
  ["android-referral","Android Developer","Mobile Development","An Android feature built with lifecycle-aware components"],
];
const technicalTemplates: Template[] = roleOutreach.map(([slug,role,group,evidence]) => ({
  slug,title:`${role} — referral request`,group,
  summary:`A focused note about your ${role.toLowerCase()} work and a specific opening.`,
  subject:`${role} opening at [company] — [your name]`,
  body:`Hi [name],\n\nI saw the ${role} opening on [team] and was interested in [specific product or technical challenge]. I recently worked on [project]: ${evidence.toLowerCase()}, resulting in [measurable outcome].\n\nWould you be open to reviewing my fit for this role or pointing me toward the right person? The posting is [job link], and my work is at [portfolio link]. I understand if a referral is not possible.\n\nThank you,\n[your name]`,
  tips:["Replace the project claim with work you actually completed.","Name the exact team and posting.","Keep the request optional and easy to answer."],
}));
const contactTemplates: Template[] = [
  ["startup-founder","Startup founder","Mention a product decision that caught your attention","one concrete way your engineering work could help the current team"],
  ["company-ceo","Company CEO","Refer to a public product milestone","a short question about the company’s hiring priorities"],
  ["engineering-manager","Engineering manager","Identify a challenge from the team's published work","a relevant delivery or mentoring example"],
  ["vp-engineering","VP of Engineering","Reference an engineering strategy or scale challenge","a concise staff-level impact story"],
  ["founding-engineer","Founding engineer","Acknowledge the product's early trade-offs","a small scoped contribution you can make"],
  ["tech-lead","Tech lead","Mention a technical talk, repository, or article","one thoughtful technical question"],
].map(([slug,person,opening,ask])=>({slug,title:`Reaching out to a ${person}`,group:"By Seniority Level",summary:`A respectful introduction to a ${person.toLowerCase()}.`,subject:`Question about [team] at [company]`,body:`Hi [name],\n\n${opening} at [company] prompted me to reach out. I work on [relevant domain], where I recently [specific outcome].\n\nI would appreciate ${ask}. If your schedule is full, a short reply or a pointer to the right resource would still be helpful.\n\nBest,\n[your name]`,tips:["Research the person before writing.","Ask for a specific, bounded response.","Do not make claims you cannot substantiate."]}));
const scenarioTemplates: Template[] = [
  {slug:"alumni-referral",title:"College alumni referral",group:"By Relationship",summary:"Connect through a real shared institution before asking about a role.",subject:"[college] alumnus — question about [team]",body:"Hi [name],\n\nI am a [year] student at [college] and found your work on [team/project] while researching [role]. My [project] relates to [specific requirement], and I would value your perspective on what the team looks for.\n\nIf you think my work is relevant, would you be comfortable sharing the best application path? I have included [role link] and [portfolio link].\n\nThank you,\n[your name]",tips:["Name the shared college truthfully.","Lead with a question before a referral request."]},
  {slug:"linkedin-follow-up",title:"After a LinkedIn discussion",group:"By Relationship",summary:"Continue a public technical exchange without pretending familiarity.",subject:"Following up on your post about [topic]",body:"Hi [name],\n\nYour post on [topic] raised a useful point about [specific detail]. I tried applying that idea to [project] and found [brief result or question].\n\nWould you recommend a resource for understanding [narrow issue] better? No meeting is needed; a pointer would be appreciated.\n\nBest,\n[your name]",tips:["Refer to a real post.","Do not turn a first message into an immediate job request."]},
  {slug:"rejection-feedback",title:"Feedback after rejection",group:"Unique Scenarios",summary:"Ask for one actionable observation after a completed process.",subject:"Thank you for the [role] interview",body:"Hi [name],\n\nThank you for the opportunity to interview for [role]. I appreciated learning about [specific team problem]. Although I was not selected, I would welcome one area I could strengthen for future roles, if sharing feedback is possible under your policy.\n\nThank you again for your time,\n[your name]",tips:["Send once and accept a no-feedback policy.","Keep the tone appreciative."]},
  {slug:"career-transition",title:"Career transition introduction",group:"Unique Scenarios",summary:"Connect transferable evidence to a new engineering role.",subject:"Transitioning from [field] to [role]",body:"Hi [name],\n\nI am moving from [previous field] toward [role] after building [relevant project]. My earlier work taught me [transferable skill], which I applied to [specific technical result].\n\nI am interested in [team] because [concrete reason]. Would you suggest the most useful gap to close before applying?\n\nBest,\n[your name]",tips:["Show evidence of the new skill.","Do not apologize for your earlier career."]},
  {slug:"funding-congratulations",title:"After a funding announcement",group:"Unique Scenarios",summary:"Make a relevant connection without treating news as an invitation.",subject:"Congratulations on [company]’s milestone",body:"Hi [name],\n\nCongratulations on [specific public milestone]. I was interested in how [product or technical challenge] may evolve as the team grows. I have worked on [related outcome] and would be glad to share a short example if it is useful.\n\nIf your team is hiring for [role], where is the best place to follow openings?\n\nBest,\n[your name]",tips:["Confirm the announcement is public.","Do not assume the company is hiring."]},
  {slug:"open-opportunities",title:"Exploring opportunities",group:"Job Related",summary:"Start a conversation when no relevant role is posted.",subject:"Interest in [team] engineering work",body:"Hi [name],\n\nI have been following [company]'s work on [specific product]. My recent [project] involved [relevant contribution and result].\n\nI could not find an open role that fits [focus area]. Is there a public place to watch for future opportunities, or a skill you would suggest prioritizing?\n\nThank you,\n[your name]",tips:["Do not claim an opening exists.","Link to evidence, not a long attachment."]},
  {slug:"freelance-inquiry",title:"Freelance project inquiry",group:"Job Related",summary:"Offer a small, defined project with a clear deliverable.",subject:"Proposal for [specific project]",body:"Hi [name],\n\nI noticed [specific public problem or opportunity] in [product]. I have delivered [related work] and could help by [scoped deliverable] over [realistic period].\n\nIf that would be useful, I can send a one-page scope with assumptions, timeline, and price. My comparable work is here: [portfolio link].\n\nBest,\n[your name]",tips:["Do not imply a security issue without evidence.","Define scope before pricing."]},
  {slug:"portfolio-feedback",title:"Portfolio feedback request",group:"Job Related",summary:"Ask for feedback on one narrow aspect of your portfolio.",subject:"Could I ask one question about [project]?",body:"Hi [name],\n\nI admire your work on [specific project or article]. I am refining my [portfolio project], and I am uncertain whether [one precise design or engineering decision] is clear to a reviewer.\n\nIf you have a moment, could you glance at [link] and tell me what you would question first? I understand if you cannot.\n\nThank you,\n[your name]",tips:["Ask one narrow question.","Respect a no-response outcome."]},
];
const allTemplates=[...templates,...technicalTemplates,...contactTemplates,...scenarioTemplates];
const groups=["Finding a role","Tech Stack Specific","Cloud & DevOps","Data & AI/ML","Mobile Development","By Seniority Level","By Relationship","Unique Scenarios","Job Related","Building connections","Working together"];

export default function InterviewTemplates({ slug }: { slug?: string }) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const selected = allTemplates.find((template) => template.slug === slug);
  const [editedSubject, setEditedSubject] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");

  if (slug && !selected)
    return (
      <div className="ip-empty">
        Template not found.{" "}
        <Link href="/interview-preparations/cold-email-templates">
          Browse templates
        </Link>
      </div>
    );

  if (selected) {
    const subject = editedSubject ?? selected.subject;
    const body = editedBody ?? selected.body;
    const copy = async () => {
      const value = `Subject: ${subject}\n\n${body}`;
      const legacyCopy = () => {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Copy failed");
      };
      try {
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(value);
          } catch {
            legacyCopy();
          }
        } else {
          legacyCopy();
        }
        setCopied(true);
        setCopyError("");
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopyError(
          "Clipboard access is unavailable. Select the text and copy it manually.",
        );
      }
    };
    return (
      <>
        <div className="ip-crumb">
          <Link href="/interview-preparations/cold-email-templates">
            Cold Email Templates
          </Link>
          <ChevronRight size={13} />
          {selected.title}
        </div>
        <Link
          className="ip-template-back"
          href="/interview-preparations/cold-email-templates"
        >
          <ArrowLeft size={16} /> Back to templates
        </Link>
        <div className="ip-page-heading">
          <h1>{selected.title}</h1>
          <p>{selected.summary}</p>
        </div>
        <div className="ip-template-meta">
          <Mail size={16} />
          {selected.group}
        </div>
        <section
          className="ip-template-editor"
          aria-label="Editable email template"
        >
          <label htmlFor="ip-template-subject">Subject</label>
          <input
            id="ip-template-subject"
            value={subject}
            onChange={(event) => setEditedSubject(event.target.value)}
          />
          <div className="ip-template-body-head">
            <label htmlFor="ip-template-body">Email body</label>
            <button type="button" onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
              {copied ? "Copied" : "Copy email"}
            </button>
          </div>
          <textarea
            id="ip-template-body"
            value={body}
            onChange={(event) => setEditedBody(event.target.value)}
            rows={15}
          />
          {copyError && (
            <p className="ip-error" role="alert">
              {copyError}
            </p>
          )}
        </section>
        <section className="ip-template-tips">
          <h2>Make it yours</h2>
          <ul>
            {selected.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </>
    );
  }

  const term = search.trim().toLowerCase();
  const filtered = allTemplates.filter((template) =>
    `${template.title} ${template.summary} ${template.group}`
      .toLowerCase()
      .includes(term),
  );
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> Cold Email Templates
      </div>
      <div className="ip-page-heading">
        <h1>Cold Email Templates</h1>
        <p>
          Start with a clear structure, then add the details only you can
          provide.
        </p>
      </div>
      <div className="ip-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search templates (e.g., referral, alumni, internship...)"
          aria-label="Search email templates"
        />
      </div>
      {filtered.length ? (
        groups.map((group) => {
          const entries = filtered.filter(
            (template) => template.group === group,
          );
          return entries.length ? (
            <section className="ip-template-group" key={group}>
              <h2>{group}</h2>
              <div className="ip-template-grid">
                {entries.map((template) => (
                  <Link
                    key={template.slug}
                    href={`/interview-preparations/cold-email-templates/${template.slug}`}
                    className="ip-template-card"
                  >
                    <span className="ip-template-icon">
                      <Mail size={19} />
                    </span>
                    <strong>{template.title}</strong>
                    <p>{template.summary}</p>
                    <div>
                      <span>{group}</span>
                      <ArrowUpRight size={15} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null;
        })
      ) : (
        <div className="ip-empty">
          No templates match “{search}”. Try a different word.
        </div>
      )}
    </>
  );
}
