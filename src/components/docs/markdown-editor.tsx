"use client";

import CodeMirror, { EditorView, keymap } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useMemo } from "react";

const theme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "var(--ink)", fontSize: "0.9375rem" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-sans)", lineHeight: "1.7", overflow: "visible" },
  ".cm-content": { padding: "0 0 40vh", caretColor: "var(--ribbon-2)" },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ribbon-2)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklch, var(--ribbon) 40%, transparent) !important",
  },
  ".cm-placeholder": { color: "var(--ink-3)" },
  ".cm-activeLine": { backgroundColor: "transparent" },
});

const highlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.45em", fontWeight: "650", letterSpacing: "-0.02em" },
  { tag: t.heading2, fontSize: "1.22em", fontWeight: "650", letterSpacing: "-0.015em" },
  { tag: t.heading3, fontSize: "1.06em", fontWeight: "650" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "650" },
  { tag: t.strong, fontWeight: "650" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--ink-3)" },
  { tag: [t.link, t.url], color: "var(--cloth-3)", textDecoration: "underline" },
  { tag: t.monospace, fontFamily: "var(--font-mono)", fontSize: "0.88em", color: "var(--ink-2)" },
  { tag: [t.processingInstruction, t.meta, t.punctuation, t.contentSeparator], color: "var(--ink-3)" },
  { tag: t.quote, color: "var(--ink-2)", fontStyle: "italic" },
  { tag: t.list, color: "var(--ink-2)" },
  { tag: [t.keyword, t.operator], color: "var(--dye-plum-deep)" },
  { tag: [t.string, t.special(t.string)], color: "var(--dye-moss-deep)" },
  { tag: [t.number, t.bool], color: "var(--dye-coral-deep)" },
  { tag: t.comment, color: "var(--ink-3)", fontStyle: "italic" },
]);

export function MarkdownEditor({
  value,
  onChange,
  onSaveShortcut,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSaveShortcut: () => void;
  autoFocus?: boolean;
}) {
  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(highlight),
      theme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": "Document body", spellcheck: "true" }),
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            onSaveShortcut();
            return true;
          },
        },
      ]),
    ],
    [onSaveShortcut],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      autoFocus={autoFocus}
      placeholder="Write in markdown"
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        highlightSelectionMatches: false,
        autocompletion: false,
        searchKeymap: true,
      }}
      theme="none"
    />
  );
}
