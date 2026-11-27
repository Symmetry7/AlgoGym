"use client";

import Editor, { loader, type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

// Monaco loads from a pinned CDN build, only on the workspace route (DECISIONS.md 2026-11-27).
loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

const defineTheme: BeforeMount = (monaco) => {
  // DESIGN.md §6.6: surface-1 background, faint line numbers, subtle current line, neutral selection and cursor.
  monaco.editor.defineTheme("algogym", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "84848D", fontStyle: "italic" },
      { token: "keyword", foreground: "C4C4CC" },
      { token: "string", foreground: "A7D7B5" },
      { token: "number", foreground: "E5C890" },
    ],
    colors: {
      "editor.background": "#0B0B0D",
      "editorGutter.background": "#0B0B0D",
      "editorLineNumber.foreground": "#84848D", // --ag-text-faint (WCAG AA)
      "editorLineNumber.activeForeground": "#F5F5F7",
      "editor.lineHighlightBackground": "#FFFFFF08",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#FFFFFF1A",
      "editor.inactiveSelectionBackground": "#FFFFFF10",
      "editorCursor.foreground": "#F5F5F7",
      "editorIndentGuide.background1": "#FFFFFF0D",
      "editorWidget.background": "#121214",
      "focusBorder": "#22C55E",
    },
  });
};

export default function CodeEditor({ value, language, label, onChange, onRun, onSubmit }: {
  value: string;
  language: string;
  label: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
}) {
  // Monaco registers commands once; refs keep them calling the latest handlers.
  const run = useRef(onRun);
  const submit = useRef(onSubmit);
  useEffect(() => {
    run.current = onRun;
    submit.current = onSubmit;
  });

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run.current());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submit.current());
  };

  const mono = typeof window === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
  return (
    <Editor
      value={value}
      language={language}
      theme="algogym"
      beforeMount={defineTheme}
      onMount={onMount}
      onChange={(v) => onChange(v ?? "")}
      loading={<p className="p-4 text-sm text-ag-text-faint">Loading editor…</p>}
      options={{
        ariaLabel: label,
        minimap: { enabled: false },
        fontFamily: `${mono ? `${mono}, ` : ""}ui-monospace, Consolas, monospace`,
        fontSize: 14,
        lineHeight: 22,
        renderLineHighlight: "line",
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        tabSize: 4,
        automaticLayout: true,
        smoothScrolling: true,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}
