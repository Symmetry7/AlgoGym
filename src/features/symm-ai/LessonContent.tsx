"use client";
import { Children, isValidElement, useState, type ReactElement } from "react";
import { Check, Copy } from "lucide-react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "./lesson-content.css";
const codeLanguage = (value?: string) => {
  const normalized = (value ?? "").toLowerCase().replace(/[\s.]/g, "");
  if (["cpp", "c++", "c++17"].includes(normalized)) return "cpp";
  if (["java", "java17"].includes(normalized)) return "java";
  if (["python", "python3", "py"].includes(normalized)) return "python";
  return normalized;
};

export function RichText({ children }: { children: string }) {
  return (
    <div className="lesson-rich-text">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{
        pre({ children }) {
          const child = Children.toArray(children).find(isValidElement) as ReactElement<{ children?: string; className?: string }> | undefined;
          return <CodeExample code={String(child?.props.children ?? "").replace(/\n$/, "")} language={child?.props.className?.replace(/^language-/, "")} />;
        },
        table({ children }) { return <div className="lesson-table-scroll"><table>{children}</table></div>; },
      }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function CodeExample({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const supported = [
    "javascript",
    "typescript",
    "python",
    "java",
    "cpp",
    "c",
    "go",
    "rust",
    "sql",
    "bash",
  ];
  const normalized = codeLanguage(language) || "text";
  return (
    <div className="lesson-code my-5 overflow-hidden rounded-xl border border-[#34343f] bg-[#121218]">
      <div className="flex items-center justify-between border-b border-[#34343f] px-4 py-2 text-[11px] text-[#aaa8ba]">
        <span className="font-mono uppercase tracking-wide">
          {language || "Code"}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4]"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Highlight
        theme={themes.vsDark}
        code={code.trim()}
        language={
          (supported.includes(normalized) ? normalized : "markup") as Language
        }
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="max-w-full overflow-x-auto p-4 font-mono text-[12px] leading-6">
            <code>
              {tokens.map((line, index) => (
                <span
                  key={index}
                  {...getLineProps({ line })}
                  className="table-row"
                >
                  <span aria-hidden="true" className="table-cell select-none pr-5 text-right text-[#767485]">
                    {index + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
