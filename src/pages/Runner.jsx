import { useCallback, useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import LiveShare from '../components/LiveShare';
import SiteHeader from '../components/SiteHeader';
import { ExternalIcon, PlayIcon, ShareIcon, StopIcon, TerminalIcon } from '../components/icons';
import { COMPILER_LANGUAGES, FRONTEND_LANGUAGES } from '../data/languages';
import { fakeDecrypt, fakeEncrypt } from '../lib/armor';
import { runOnJudge0 } from '../lib/judge0';
import { toolHref } from '../lib/router';
import { createRoomId, readRoomFromUrl, removeRoomFromUrl } from '../lib/share';

function formatTime(value) {
  if (value === null || value === undefined) return '—';
  return value >= 1 ? `${value.toFixed(2)} s` : `${Math.round(value * 1000)} ms`;
}

function fileNameOf(language) {
  return language.id === 'html' ? 'index.html' : `main.${language.fileext}`;
}

export default function Runner({ language }) {
  const storageKey = `polycode:code:${language.id}`;
  const [code, setCode] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return language.snippet;
      // 兼容旧版本留下的明文缓存
      return stored.startsWith('PC1.') ? fakeDecrypt(stored) : stored;
    } catch {
      return language.snippet;
    }
  });
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [toast, setToast] = useState('');
  const [shareSession, setShareSession] = useState(() => {
    const roomId = readRoomFromUrl();
    return roomId ? { role: 'guest', roomId } : null;
  });
  const [shareOpen, setShareOpen] = useState(() => Boolean(readRoomFromUrl()));
  const abortRef = useRef(null);

  useEffect(() => {
    document.title = `${language.name} 在线运行 · PolyCode`;
  }, [language]);

  // 代码自动保存在浏览器本地
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, fakeEncrypt(code));
      } catch {
        /* 隐私模式下可能不可用 */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [code, storageKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const showToast = useCallback((message) => setToast(message), []);

  const run = useCallback(async () => {
    if (running) return;
    if (!code.trim()) {
      showToast('请先输入代码');
      return;
    }

    // HTML 直接在浏览器中渲染，不经过云端
    if (language.preview) {
      setResult({ preview: code, previewKey: Date.now() });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setResult(null);

    try {
      const outcome = await runOnJudge0({
        language,
        source: code,
        stdin,
        signal: controller.signal,
      });
      setResult(outcome);
    } catch (error) {
      if (error?.name === 'AbortError') {
        setResult({ output: '', errors: '已停止运行', exitCode: null, aborted: true });
      } else {
        setResult({
          output: '',
          errors: error?.message || '执行失败，请稍后重试',
          exitCode: null,
        });
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [code, language, running, showToast, stdin]);

  const stop = () => {
    abortRef.current?.abort();
  };

  const reset = () => {
    setCode(language.snippet);
    setStdin('');
    setResult(null);
    setResetKey((key) => key + 1);
    showToast('已恢复示例代码');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('代码已复制');
    } catch {
      showToast('复制失败，请手动选择代码');
    }
  };

  const openPreviewWindow = () => {
    if (!result?.preview) return;
    const url = URL.createObjectURL(new Blob([result.preview], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const switchLanguage = (event) => {
    window.location.href = toolHref(event.target.value);
  };

  const openShare = () => {
    setShareSession((current) => current || { role: 'host', roomId: createRoomId() });
    setShareOpen(true);
  };

  const closeShare = () => setShareOpen(false);

  const stopShare = () => {
    setShareSession(null);
    setShareOpen(false);
  };

  const exitShare = () => {
    removeRoomFromUrl();
    setShareSession(null);
    setShareOpen(false);
  };

  const ok = Boolean(
    result &&
      !result.preview &&
      !result.timedOut &&
      !result.compileFailed &&
      !result.aborted &&
      result.exitCode === 0
  );

  return (
    <>
      <SiteHeader back />

      <main className="runner">
        <div className="runner-head">
          <div className="runner-title">
            <span className="monogram-tile" style={{ '--lang': language.color }}>
              {language.monogram}
            </span>
            <div>
              <h1>{language.name} 在线运行</h1>
              <p>
                {language.tagline} · {language.version}
              </p>
            </div>
          </div>

          <div className="runner-actions">
            <button
              type="button"
              className={`ghost-btn share-trigger${shareSession ? ' active' : ''}`}
              onClick={openShare}
            >
              <ShareIcon />
              {shareSession
                ? shareSession.role === 'host'
                  ? '共享中'
                  : '查看共享代码'
                : '共享代码'}
            </button>

            <label className="lang-select">
              <span>切换语言</span>
              <select value={language.id} onChange={switchLanguage} aria-label="切换语言">
                <optgroup label="编译工具">
                  {COMPILER_LANGUAGES.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="前端编辑器">
                  {FRONTEND_LANGUAGES.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>
        </div>

        <div className="runner-grid">
          <section className="card editor-card">
            <div className="pane-head">
              <div className="window-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <span className="file-name">{fileNameOf(language)}</span>
              <span className="lang-chip" style={{ '--lang': language.color }}>
                {language.name}
              </span>
              <span className="spacer" />
              <button type="button" className="ghost-btn" onClick={copyCode}>
                复制
              </button>
              <button type="button" className="ghost-btn" onClick={reset}>
                恢复示例
              </button>
            </div>

            <CodeEditor
              key={`${language.id}-${resetKey}`}
              languageId={language.editor}
              initialCode={code}
              onChange={setCode}
              onRun={run}
            />

            <div className="pane-foot">
              <span className="shortcut">
                <kbd>Ctrl</kbd>
                <span>/</span>
                <kbd>⌘</kbd>
                <span>+</span>
                <kbd>Enter</kbd>
                <span className="shortcut-label">运行</span>
              </span>
              <div className="foot-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setResult(null)}
                  disabled={!result}
                >
                  清空结果
                </button>
                {running ? (
                  <button type="button" className="stop-btn" onClick={stop}>
                    <StopIcon />
                    停止
                  </button>
                ) : (
                  <button type="button" className="run-btn" onClick={run}>
                    <PlayIcon />
                    运行代码
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside className="runner-side">
            <section className="card stdin-card">
              <div className="card-head">
                <span className="card-title">标准输入 (stdin)</span>
                <span className="card-hint">运行前填写 · 可选</span>
              </div>
              <textarea
                className="stdin-area"
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                placeholder={'程序需要读取输入时，在这里按行填写，例如：\n5 3\n1 2 3 4 5'}
                spellCheck={false}
                aria-label="标准输入"
              />
            </section>

            <section className="card output-card">
              <div className="card-head">
                <span className="card-title">{language.preview ? '预览结果' : '运行结果'}</span>
                <span className="spacer" />
                {result?.preview ? (
                  <div className="preview-actions">
                    <span className="chip good">浏览器渲染</span>
                    <button
                      type="button"
                      className="icon-btn"
                      title="在新窗口打开"
                      aria-label="在新窗口打开"
                      onClick={openPreviewWindow}
                    >
                      <ExternalIcon />
                    </button>
                  </div>
                ) : (
                  result &&
                  !running && (
                    <div className="meta-chips">
                      <span className={`chip ${ok ? 'good' : 'bad'}`}>
                        {result.status || (ok ? 'Accepted' : '运行失败')}
                      </span>
                      {result.time !== null && result.time !== undefined && (
                        <span className="chip">{formatTime(result.time)}</span>
                      )}
                      {result.memory ? (
                        <span className="chip">{(result.memory / 1024).toFixed(1)} MB</span>
                      ) : null}
                    </div>
                  )
                )}
              </div>

              <div className={`output-body${result?.preview ? ' previewing' : ''}`}>
                {result?.preview && (
                  <iframe
                    key={result.previewKey}
                    className="preview-frame"
                    title="HTML 预览"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    srcDoc={result.preview}
                  />
                )}

                {!result && !running && (
                  <div className="empty-state">
                    <TerminalIcon />
                    <p>{language.preview ? '点击「运行代码」渲染页面' : '点击「运行代码」查看输出'}</p>
                    <span>
                      {language.preview
                        ? 'HTML 在本地浏览器中直接渲染'
                        : '云端沙箱执行 · 支持标准输入 · 输出上限约 64 KB'}
                    </span>
                  </div>
                )}

                {running && (
                  <div className="run-state">
                    <span className="spinner large" />
                    <span>正在云端编译执行…</span>
                  </div>
                )}

                {result && !running && !result.preview && (
                  <>
                    {result.timedOut && (
                      <div className="banner warn">程序运行超时，已被执行服务终止</div>
                    )}
                    {result.compileFailed && (
                      <div className="banner error">编译未通过，请检查代码</div>
                    )}
                    {result.aborted && <div className="banner warn">已停止等待本次运行结果</div>}
                    {result.output ? <pre className="stream out">{result.output}</pre> : null}
                    {result.errors ? (
                      <pre className={`stream err${ok ? ' soft' : ''}`} title="stderr / 编译器输出">
                        {result.errors}
                      </pre>
                    ) : null}
                    {!result.output && !result.errors && (
                      <div className="no-output">（程序没有产生输出）</div>
                    )}
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>

        <p className="runner-note">
          代码在 Judge0 CE 公共沙箱中执行，公共接口有频率限制；请勿在代码或输入中填写密码、密钥等敏感信息。
        </p>
      </main>

      {shareSession && (
        <LiveShare
          open={shareOpen}
          role={shareSession.role}
          roomId={shareSession.roomId}
          code={code}
          language={language}
          onClose={closeShare}
          onStop={stopShare}
          onExit={exitShare}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
