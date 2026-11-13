import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import {
  acceptCompletion,
  autocompletion,
  clearSnippet,
  completionKeymap,
  completionStatus,
  nextSnippetField,
  prevSnippetField,
} from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { buildCompletionSource } from '../completions';
import { languageExtension, polySyntax, polyTheme } from '../editorTheme';

export default function CodeEditor({ languageId, initialCode, onChange, onRun }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onRunRef = useRef(onRun);
  const onChangeRef = useRef(onChange);

  onRunRef.current = onRun;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const completionSource = buildCompletionSource(languageId);

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        indentOnInput(),
        indentUnit.of('    '),
        history(),
        autocompletion({
          override: completionSource ? [completionSource] : [],
          activateOnTyping: true,
          maxRenderedOptions: 12,
        }),
        keymap.of([
          {
            key: 'Tab',
            run: (view) => {
              // 语法模板占位符之间跳转
              if (nextSnippetField(view)) return true;
              // 补全列表打开时用 Tab 采纳候选
              if (completionStatus(view.state) === 'active') return acceptCompletion(view);
              return indentMore(view);
            },
          },
          {
            key: 'Shift-Tab',
            run: (view) => (prevSnippetField(view) ? true : indentLess(view)),
          },
          ...completionKeymap,
          {
            key: 'Escape',
            run: (view) => clearSnippet(view),
          },
          {
            key: 'Mod-Enter',
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        languageExtension(languageId),
        polyTheme,
        polySyntax,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    // 移动端不自动聚焦，避免切换语言时立刻弹出软键盘
    const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 640;
    if (!isTouch) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // 仅在语言切换或主动重置（key 变化）时重建编辑器
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageId]);

  return <div className="editor-host" ref={hostRef} />;
}
