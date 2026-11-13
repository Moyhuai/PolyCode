import { EditorView } from '@codemirror/view';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { php } from '@codemirror/lang-php';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';

export function languageExtension(id) {
  switch (id) {
    case 'javascript':
      return javascript();
    case 'typescript':
      return javascript({ typescript: true });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'python':
      return python();
    case 'c':
    case 'cpp':
      return cpp();
    case 'java':
      return java();
    case 'rust':
      return rust();
    case 'go':
      return go();
    case 'php':
      return php();
    case 'ruby':
      return StreamLanguage.define(ruby);
    default:
      return [];
  }
}

export const polyTheme = EditorView.theme(
  {
    '&': {
      color: '#e8eefc',
      backgroundColor: 'transparent',
      fontSize: 'var(--code-font-size, 13.5px)',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily:
        '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
      lineHeight: '1.7',
    },
    '.cm-content': {
      padding: '18px 0 26px',
      caretColor: '#8ab4ff',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#3b4767',
      paddingLeft: '10px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#93a7d8',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(109, 139, 255, 0.055)',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(109, 139, 255, 0.26)',
    },
    '.cm-cursor': {
      borderLeftColor: '#8ab4ff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-line': {
      padding: '0 18px 0 8px',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(46, 230, 200, 0.18)',
      outline: '1px solid rgba(46, 230, 200, 0.4)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgba(109, 139, 255, 0.16)',
      border: 'none',
      color: '#9fb4ff',
    },
    '.cm-tooltip': {
      border: '1px solid rgba(132, 158, 255, 0.2)',
      borderRadius: '10px',
      background: 'rgba(12, 18, 33, 0.98)',
      boxShadow: '0 18px 44px rgba(0, 0, 0, 0.6)',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete > ul': {
      padding: '4px',
      maxHeight: '260px',
      fontSize: '12px',
    },
    '.cm-tooltip-autocomplete > ul > li': {
      padding: '5px 9px',
      borderRadius: '6px',
      color: '#c9d5f2',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      background: 'rgba(109, 139, 255, 0.24)',
      color: '#ffffff',
    },
    '.cm-completionLabel': {
      fontFamily:
        '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
    },
    '.cm-completionDetail': {
      marginLeft: '8px',
      color: '#6f7d9e',
      fontStyle: 'normal',
      fontSize: '11px',
    },
    '.cm-completionIcon': {
      paddingRight: '5px',
      opacity: '0.85',
    },
    '.cm-completionInfo': {
      padding: '8px 10px',
      maxWidth: '320px',
      border: '1px solid rgba(132, 158, 255, 0.2)',
      borderRadius: '10px',
      background: 'rgba(12, 18, 33, 0.98)',
      color: '#a9b6d6',
      fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: '11.5px',
      lineHeight: '1.6',
    },
  },
  { dark: true }
);

export const polyHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#a78bfa' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#e8eefc' },
  { tag: [t.propertyName, t.attributeName], color: '#9fd3ff' },
  { tag: [t.function(t.variableName), t.labelName], color: '#6d9bff' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#f7a35c' },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#ffcb6b' },
  { tag: [t.operator, t.operatorKeyword], color: '#67e8f9' },
  { tag: [t.regexp, t.escape, t.special(t.string)], color: '#f78c6c' },
  { tag: [t.string, t.special(t.brace)], color: '#8ee6a8' },
  { tag: [t.bool, t.null], color: '#ff8fa3' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#5b6785', fontStyle: 'italic' },
  { tag: t.tagName, color: '#ff8fa3' },
  { tag: t.heading, color: '#a78bfa', fontWeight: '700' },
  { tag: t.invalid, color: '#ff6b81' },
]);

export const polySyntax = syntaxHighlighting(polyHighlight);
