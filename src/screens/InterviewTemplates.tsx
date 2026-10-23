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

const groups = ["Finding a role", "Building connections", "Working together"];

export default function InterviewTemplates({ slug }: { slug?: string }) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const selected = templates.find((template) => template.slug === slug);
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
  const filtered = templates.filter((template) =>
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
