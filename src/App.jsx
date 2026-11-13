import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor from './components/CodeEditor';
import PromptLibrary from './components/PromptLibrary';
import { SNIPPETS } from './languages';
import { JUDGE0_CATALOG, runOnJudge0 } from './judge0';
import {
  buildPreviewHtml,
  buildTree,
  createFile,
  createFolder,
  defaultProject,
  getActiveFile,
  languageForFile,
  loadProjects,
  normalizeProject,
  pickEntry,
  removePath,
  saveProjects,
  updateFileContent,
} from './projectStore';

const SNIPPET_COUNT = Object.keys(SNIPPETS).length;

function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.3-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="16" rx="3" />
      <path d="m7 9 3 3-3 3M13 15h4" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h3.6l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

// 递归渲染文件树：文件夹可展开 / 收起，文件点击切换，右侧为删除
function FileTree({ node, depth, activePath, collapsed, onToggle, onSelect, onRemove }) {
  const indent = 6 + depth * 12;
  return (
    <>
      {[...node.folders.values()].map((folder) => (
        <div key={folder.path}>
          <div className="file-row folder" style={{ paddingLeft: indent }}>
            <button
              type="button"
              className="file-main"
              onClick={() => onToggle(folder.path)}
              title={folder.path}
            >
              <span className="tree-caret">{collapsed.has(folder.path) ? '▸' : '▾'}</span>
              <FolderIcon />
              <span className="file-label">{folder.name}</span>
            </button>
            <button
              type="button"
              className="file-del"
              aria-label={`删除文件夹 ${folder.path}`}
              onClick={() => onRemove(folder.path)}
            >
              ×
            </button>
          </div>
          {!collapsed.has(folder.path) && (
            <FileTree
              node={folder}
              depth={depth + 1}
              activePath={activePath}
              collapsed={collapsed}
              onToggle={onToggle}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          )}
        </div>
      ))}
      {node.files.map((file) => (
        <div
          key={file.path}
          className={`file-row${file.path === activePath ? ' active' : ''}`}
          style={{ paddingLeft: indent + 12 }}
        >
          <button
            type="button"
            className="file-main"
            onClick={() => onSelect(file.path)}
            title={file.path}
          >
            <FileIcon />
            <span className="file-label">{file.name}</span>
          </button>
          <button
            type="button"
            className="file-del"
            aria-label={`删除文件 ${file.path}`}
            onClick={() => onRemove(file.path)}
          >
            ×
          </button>
        </div>
      ))}
    </>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 16 10 24l8 8M30 16l8 8-8 8M27 12l-6 24" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState('code');
  const [catalog, setCatalog] = useState([]);
  const [status, setStatus] = useState('loading');
  // engine: server = 本机后端执行服务；judge0 = 纯静态部署时浏览器直连公共执行 API
  const [engine, setEngine] = useState('server');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeId, setActiveId] = useState('javascript');
  const [projects, setProjects] = useState(loadProjects);
  const [railTab, setRailTab] = useState('lang');
  const [creating, setCreating] = useState(null);
  const [draftPath, setDraftPath] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState(() => new Set());
  const fileInputRef = useRef(null);
  const [stdin, setStdin] = useState('');
  const stdinRef = useRef(null);
  const railListRef = useRef(null);
  const [lineInput, setLineInput] = useState('');
  const sessionRef = useRef(null);
  const judge0AbortRef = useRef(null);
  const runTokenRef = useRef(0);
  const outputRef = useRef(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [toast, setToast] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [sharing, setSharing] = useState(false);
  const [railEdge, setRailEdge] = useState({ left: false, right: false });
  const [zenOpen, setZenOpen] = useState(false);

  const project = projects[activeId] || defaultProject(activeId);
  const activeFile = getActiveFile(project);
  const activePath = activeFile?.path || '';
  const activeCode = activeFile?.content || '';
  const editorLanguage = languageForFile(activePath, activeId);
  const entryPath = pickEntry(project, activeId);
  const tree = useMemo(() => buildTree(project), [project]);
  const hasContent = project.files.some((file) => file.content.trim());

  const activeMeta = useMemo(
    () => catalog.find((item) => item.id === activeId) || null,
    [catalog, activeId]
  );
  const availableCount = catalog.filter((item) => item.available).length;
  const activeIsPreview = Boolean(activeMeta?.preview);
  const expectsStdin = useMemo(
    () =>
      /(\binput\s*\(|\bscanf\s*\(|\bcin\s*>>|\bScanner\b|sys\.stdin|\bgets\b|readline\s*\(|Console\.ReadLine)/.test(
        project.files.map((file) => file.content).join('\n')
      ),
    [project]
  );
  const canRun =
    status === 'ready' && Boolean(activeMeta?.available) && !running && hasContent;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch('/api/languages')
      .then((res) => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCatalog(Array.isArray(data.languages) ? data.languages : []);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        // 没有后端（例如 GitHub Pages）时退回到浏览器直连公共执行 API
        setEngine('judge0');
        setCatalog(JUDGE0_CATALOG);
        setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => saveProjects(projects), 250);
    return () => clearTimeout(timer);
  }, [projects]);

  // 新建文件 / 文件夹时自动聚焦输入框
  useEffect(() => {
    if (creating) fileInputRef.current?.focus();
  }, [creating]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  // 移动端页面会整页滚动，切换视图时回到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  }, [view]);

  // 移动端语言栏是横向滚动，切换语言后把选中项滚到可见位置
  useEffect(() => {
    const list = railListRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const item = list.querySelector('.rail-item.active');
    if (!item) return;
    const target = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeId, catalog]);

  // 横向语言栏是否还能向左 / 向右滑动（控制左右箭头状态）
  const updateRailEdge = useCallback(() => {
    const list = railListRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth - 2;
    if (max <= 2) {
      setRailEdge((prev) => (prev.left || prev.right ? { left: false, right: false } : prev));
      return;
    }
    const next = { left: list.scrollLeft > 2, right: list.scrollLeft < max };
    setRailEdge((prev) =>
      prev.left === next.left && prev.right === next.right ? prev : next
    );
  }, []);

  useEffect(() => {
    const list = railListRef.current;
    if (!list) return undefined;
    updateRailEdge();
    list.addEventListener('scroll', updateRailEdge, { passive: true });
    window.addEventListener('resize', updateRailEdge);
    return () => {
      list.removeEventListener('scroll', updateRailEdge);
      window.removeEventListener('resize', updateRailEdge);
    };
  }, [updateRailEdge, catalog]);

  const scrollRail = (direction) => {
    const list = railListRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction * Math.max(180, list.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  // HTML 预览空间：Esc 退出全屏，新窗口打开用 Blob 独立运行
  useEffect(() => {
    if (!zenOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setZenOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zenOpen]);

  // 预览被清空（切换语言 / 重新运行）时自动退出全屏
  useEffect(() => {
    if (!result?.preview) setZenOpen(false);
  }, [result]);

  const openPreviewWindow = () => {
    const html = result?.preview;
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const node = outputRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [result?.stdout, result?.stderr]);

  const updateCode = useCallback(
    (next) => {
      if (!activePath) return;
      setProjects((prev) => ({
        ...prev,
        [activeId]: updateFileContent(
          prev[activeId] || defaultProject(activeId),
          activePath,
          next
        ),
      }));
    },
    [activeId, activePath]
  );

  const applyEvent = useCallback((event) => {
    setResult((prev) => {
      const base =
        prev || {
          ok: true,
          phase: 'run',
          stdout: '',
          stderr: '',
          exitCode: null,
          durationMs: 0,
          running: true,
          statusText: '',
        };

      if (event.type === 'stdout') return { ...base, stdout: base.stdout + event.text };
      if (event.type === 'stderr') return { ...base, stderr: base.stderr + event.text };
      if (event.type === 'status') return { ...base, statusText: event.text };
      if (event.type === 'exit') {
        return {
          ...base,
          ok: event.exitCode === 0 && !event.timedOut,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
          timedOut: Boolean(event.timedOut),
          truncated: Boolean(event.truncated),
          phase: event.compileFailed ? 'compile' : 'run',
          running: false,
          statusText: '',
        };
      }
      return base;
    });
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    if (!hasContent) return;

    // HTML 不需要后端执行，直接交给输出区 iframe 渲染
    if (activeIsPreview) {
      setRunning(false);
      setResult({
        ok: true,
        phase: 'preview',
        preview: buildPreviewHtml(project),
        previewKey: Date.now(),
        stdout: '',
        stderr: '',
        exitCode: 0,
        durationMs: 0,
        running: false,
        statusText: '',
      });
      return;
    }

    // 纯静态部署（无后端）：浏览器直连 Judge0 公共执行 API
    if (engine === 'judge0') {
      if (project.files.length > 1) {
        showToast('云端执行只支持单文件，请保留一个文件后再运行');
        return;
      }

      const source =
        project.files.find((file) => file.path === entryPath)?.content ?? activeCode;
      const token = ++runTokenRef.current;
      const controller = new AbortController();
      judge0AbortRef.current = controller;

      setRunning(true);
      setResult({
        ok: true,
        phase: 'run',
        stdout: '',
        stderr: '',
        exitCode: null,
        durationMs: 0,
        running: true,
        statusText: '正在云端执行…',
      });

      try {
        const outcome = await runOnJudge0(activeId, source, stdin, controller.signal);
        if (runTokenRef.current !== token) return;
        setResult({
          ok: outcome.exitCode === 0 && !outcome.timedOut,
          phase: outcome.compileFailed ? 'compile' : 'run',
          stdout: outcome.stdout,
          stderr: outcome.stderr,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          timedOut: outcome.timedOut,
          running: false,
          statusText: '',
        });
      } catch (error) {
        if (runTokenRef.current !== token) return;
        setResult({
          ok: false,
          phase: 'run',
          stdout: '',
          stderr:
            error?.name === 'AbortError'
              ? '已停止执行\n'
              : `云端执行失败：${error?.message || '未知错误'}\n`,
          exitCode: null,
          durationMs: 0,
        });
      } finally {
        if (runTokenRef.current === token) {
          judge0AbortRef.current = null;
          setRunning(false);
        }
      }
      return;
    }

    const token = ++runTokenRef.current;

    setRunning(true);
    setResult({
      ok: true,
      phase: 'run',
      stdout: '',
      stderr: '',
      exitCode: null,
      durationMs: 0,
      running: true,
      statusText: '',
    });

    try {
      const startRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: activeId,
          files: project.files,
          entry: entryPath,
          stdin,
        }),
      });
      const started = await startRes.json();
      if (!startRes.ok) throw new Error(started.error || '执行请求失败');

      sessionRef.current = started.id;
      const streamRes = await fetch(`/api/sessions/${started.id}/events`);
      if (!streamRes.ok || !streamRes.body) throw new Error('无法建立输出流');

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        // 运行已被取消（例如切换语言），忽略后续输出
        if (runTokenRef.current !== token) {
          reader.cancel().catch(() => {});
          return;
        }
        buffer += decoder.decode(value, { stream: true });

        let index = buffer.indexOf('\n');
        while (index >= 0) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (line) {
            try {
              applyEvent(JSON.parse(line));
            } catch {
              /* 忽略不完整的行 */
            }
          }
          index = buffer.indexOf('\n');
        }
      }

      // 输出流已结束但没有收到 exit 事件（例如后端重启）
      if (runTokenRef.current === token) {
        setResult((prev) =>
          prev?.running
            ? { ...prev, ok: false, running: false, stderr: prev.stderr || '执行流已中断' }
            : prev
        );
      }
    } catch (error) {
      if (runTokenRef.current !== token) return;
      setResult({
        ok: false,
        phase: 'run',
        stdout: '',
        stderr:
          error?.message === 'Failed to fetch'
            ? '无法连接到执行服务，请确认后端已启动（npm run dev）。'
            : `执行失败：${error?.message || '未知错误'}`,
        exitCode: null,
        durationMs: 0,
      });
    } finally {
      if (runTokenRef.current === token) {
        sessionRef.current = null;
        setRunning(false);
      }
    }
  }, [
    activeCode,
    activeId,
    activeIsPreview,
    applyEvent,
    engine,
    entryPath,
    hasContent,
    project,
    running,
    showToast,
    stdin,
  ]);

  const sendLine = useCallback(async () => {
    const id = sessionRef.current;
    if (!id) return;
    const text = lineInput;
    setLineInput('');
    try {
      const res = await fetch(`/api/sessions/${id}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: `${text}\n` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || '发送输入失败');
      }
    } catch {
      showToast('发送失败，执行服务可能已断开');
    }
  }, [lineInput, showToast]);

  const stopRun = useCallback(async () => {
    judge0AbortRef.current?.abort();
    const id = sessionRef.current;
    if (!id) return;
    try {
      await fetch(`/api/sessions/${id}/stop`, { method: 'POST' });
    } catch {
      /* ignore */
    }
  }, []);

  // 切换语言时中断上一次运行，避免旧程序的输出串到新语言
  const cancelRun = useCallback(() => {
    if (!sessionRef.current && !judge0AbortRef.current) return;
    runTokenRef.current += 1;
    stopRun();
    sessionRef.current = null;
    judge0AbortRef.current = null;
    setRunning(false);
    setResult(null);
  }, [stopRun]);

  // 文件树操作：新建文件 / 文件夹、切换文件、删除
  const startCreate = (kind) => {
    setRailTab('files');
    setCreating(kind);
    setDraftPath('');
  };

  const submitCreate = (event) => {
    event.preventDefault();
    const value = draftPath.trim();
    if (!value) {
      setCreating(null);
      return;
    }
    const result =
      creating === 'folder' ? createFolder(project, value) : createFile(project, value);
    if (result.error) {
      showToast(result.error);
      return;
    }
    setProjects((prev) => ({ ...prev, [activeId]: result.project }));
    setCreating(null);
    setDraftPath('');
    showToast(creating === 'folder' ? '已新建文件夹' : '已新建文件');
  };

  const toggleFolder = (target) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
  };

  const selectFile = (target) => {
    if (target === activePath) return;
    cancelRun();
    setProjects((prev) => {
      const base = prev[activeId] || defaultProject(activeId);
      return { ...prev, [activeId]: { ...base, active: target } };
    });
  };

  const removeEntry = (target) => {
    const next = removePath(project, target);
    if (next === project) {
      showToast('至少保留一个文件');
      return;
    }
    if (!window.confirm(`确定删除 ${target} 吗？`)) return;
    if (target === activePath || activePath.startsWith(`${target}/`)) {
      cancelRun();
      setResult(null);
    }
    setProjects((prev) => ({ ...prev, [activeId]: next }));
  };

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: activeId,
          files: project.files,
          entry: entryPath,
          stdin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成分享链接失败');

      const link = `${window.location.origin}${data.path}`;
      setShareLink(link);
      setShareOpen(true);
      try {
        await navigator.clipboard.writeText(link);
        showToast('分享链接已复制');
      } catch {
        /* 弹窗内可手动复制 */
      }
    } catch (error) {
      showToast(error?.message || '生成分享链接失败');
    } finally {
      setSharing(false);
    }
  }, [activeId, entryPath, project, sharing, showToast, stdin]);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showToast('分享链接已复制');
    } catch {
      showToast('复制失败，请手动选择链接');
    }
  }, [shareLink, showToast]);

  // 打开 /s/<id> 分享链接时载入对应代码
  useEffect(() => {
    const match = window.location.pathname.match(/^\/s\/([A-Za-z0-9]+)\/?$/);
    if (!match) return undefined;

    let cancelled = false;
    fetch(`/api/shares/${match[1]}`)
      .then((res) => {
        if (!res.ok) throw new Error('分享链接不存在或已失效');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const languageId = data.language;
        const filePath = defaultProject(languageId).files[0].path;
        setActiveId(languageId);
        setProjects((prev) => {
          if (Array.isArray(data.files) && data.files.length) {
            return {
              ...prev,
              [languageId]: normalizeProject(
                { files: data.files, folders: [], active: data.entry },
                languageId
              ),
            };
          }
          if (typeof data.code === 'string') {
            return {
              ...prev,
              [languageId]: normalizeProject(
                {
                  files: [{ path: filePath, content: data.code }],
                  folders: [],
                  active: filePath,
                },
                languageId
              ),
            };
          }
          return prev;
        });
        setStdin(typeof data.stdin === 'string' ? data.stdin : '');
        setResult(null);
        window.history.replaceState({}, '', '/');
        showToast('已载入分享的代码');
      })
      .catch((error) => {
        if (!cancelled) showToast(error?.message || '载入分享代码失败');
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleReset = () => {
    const hasExtra = project.files.length > 1 || project.folders.length > 0;
    if (hasExtra && !window.confirm('重置会删除当前语言的其它文件，确定继续？')) return;
    cancelRun();
    setProjects((prev) => ({ ...prev, [activeId]: defaultProject(activeId) }));
    setResetToken((token) => token + 1);
    showToast('已恢复示例项目');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      showToast('代码已复制');
    } catch {
      showToast('复制失败，请手动选择代码');
    }
  };

  const activeColor = activeMeta?.color || '#6d8bff';

  return (
    <div className="app">
      <div className="aurora" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <div className="brand-text">
            <h1>PolyCode</h1>
            <p>多语言在线运行台</p>
          </div>
        </div>

        <nav className="view-switch" aria-label="功能切换">
          <button
            type="button"
            className={`view-btn${view === 'code' ? ' active' : ''}`}
            onClick={() => setView('code')}
          >
            代码运行
          </button>
          <button
            type="button"
            className={`view-btn${view === 'prompts' ? ' active' : ''}`}
            onClick={() => setView('prompts')}
          >
            提示词库
          </button>
        </nav>

        <div className="topbar-right">
          {status === 'offline' ? (
            <button className="status-pill offline" onClick={() => setReloadKey((key) => key + 1)}>
              <span className="dot" />
              执行服务未连接 · 点击重试
            </button>
          ) : (
            <span className={`status-pill ${status}`}>
              <span className="dot" />
              {status === 'loading'
                ? '正在连接执行服务…'
                : `${availableCount} / ${catalog.length} 个运行时就绪`}
            </span>
          )}
        </div>
      </header>

      {view === 'code' ? (
        <main className={`workspace${activeIsPreview ? ' html-mode' : ''}`}>
        <aside className="card rail">
          <div className="rail-tabs" role="tablist" aria-label="侧栏切换">
            <button
              type="button"
              role="tab"
              aria-selected={railTab === 'lang'}
              className={`rail-tab${railTab === 'lang' ? ' active' : ''}`}
              onClick={() => setRailTab('lang')}
            >
              语言
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={railTab === 'files'}
              className={`rail-tab${railTab === 'files' ? ' active' : ''}`}
              onClick={() => setRailTab('files')}
            >
              文件 <span className="rail-count">{project.files.length}</span>
            </button>
          </div>

          {railTab === 'lang' ? (
            <>
              <div className="rail-head">
                <span>语言</span>
                <span className="rail-head-right">
                  <span className="rail-count">{catalog.length || SNIPPET_COUNT}</span>
                  <span className="rail-nav">
                    <button
                      type="button"
                      aria-label="向左滚动语言列表"
                      disabled={!railEdge.left}
                      onClick={() => scrollRail(-1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="向右滚动语言列表"
                      disabled={!railEdge.right}
                      onClick={() => scrollRail(1)}
                    >
                      ›
                    </button>
                  </span>
                </span>
              </div>
              <div className="rail-list" ref={railListRef}>
                {catalog.length === 0
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div className="rail-skeleton" key={index} />
                    ))
                  : catalog.map((lang) => {
                      const selected = lang.id === activeId;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          className={`rail-item${selected ? ' active' : ''}${
                            lang.available ? '' : ' unavailable'
                          }`}
                          style={{ '--lang': lang.color }}
                          onClick={() => {
                            cancelRun();
                            setActiveId(lang.id);
                            setResult(null);
                          }}
                          title={
                            lang.available
                              ? `${lang.name} ${lang.version || ''}`
                              : lang.reason || '本机未安装该运行时'
                          }
                        >
                          <span className="monogram">{lang.monogram}</span>
                          <span className="rail-meta">
                            <span className="rail-name">{lang.name}</span>
                            <span className="rail-version">
                              {lang.available ? lang.version || '已安装' : '未安装'}
                            </span>
                          </span>
                          <span className={`avail-dot${lang.available ? ' on' : ''}`} />
                        </button>
                      );
                    })}
              </div>
              <div className="rail-foot">
                <span className="ping" />
                {engine === 'judge0' ? '浏览器直连云端执行' : '代码在云端服务器执行'}
              </div>
            </>
          ) : (
            <>
              <div className="rail-head">
                <span>文件</span>
                <span className="rail-head-right">
                  <button
                    type="button"
                    className="rail-add"
                    onClick={() => startCreate('file')}
                    title="新建文件"
                  >
                    新建文件
                  </button>
                  <button
                    type="button"
                    className="rail-add"
                    onClick={() => startCreate('folder')}
                    title="新建文件夹"
                  >
                    新建文件夹
                  </button>
                </span>
              </div>

              {creating && (
                <form className="file-create" onSubmit={submitCreate}>
                  <input
                    ref={fileInputRef}
                    value={draftPath}
                    onChange={(event) => setDraftPath(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setCreating(null);
                        setDraftPath('');
                      }
                    }}
                    placeholder={
                      creating === 'folder'
                        ? '文件夹名，例如 src'
                        : '文件名，例如 src/utils.js'
                    }
                    spellCheck={false}
                    aria-label={creating === 'folder' ? '文件夹路径' : '文件路径'}
                  />
                  <button type="submit" className="ghost-btn">
                    确定
                  </button>
                </form>
              )}

              <div className="rail-list file-list">
                <FileTree
                  node={tree}
                  depth={0}
                  activePath={activePath}
                  collapsed={collapsedFolders}
                  onToggle={toggleFolder}
                  onSelect={selectFile}
                  onRemove={removeEntry}
                />
              </div>

              <div className="rail-foot">
                <span className="ping" />
                {project.files.length} 个文件 · {project.folders.length} 个文件夹
              </div>
            </>
          )}
        </aside>

        <section className="card editor-card">
          <div className="pane-head">
            <div className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span className="file-name" title={activePath || activeMeta?.fileName || 'main'}>
              {activePath || activeMeta?.fileName || 'main'}
            </span>
            {activeMeta && (
              <span className="lang-chip" style={{ '--lang': activeColor }}>
                {activeMeta.name}
              </span>
            )}
            <span className="spacer" />
            <button
              type="button"
              className="ghost-btn"
              onClick={handleShare}
              disabled={sharing || !hasContent}
            >
              {sharing ? '生成中…' : '分享'}
            </button>
            <button type="button" className="ghost-btn" onClick={handleCopy}>
              复制
            </button>
            <button type="button" className="ghost-btn" onClick={handleReset}>
              重置示例
            </button>
          </div>

          <CodeEditor
            key={`${activeId}-${activePath}-${resetToken}`}
            languageId={editorLanguage}
            initialCode={activeCode}
            onChange={updateCode}
            onRun={run}
          />

          <div className="editor-foot">
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
                清空输出
              </button>
              <button type="button" className="run-btn" onClick={run} disabled={!canRun}>
                {running ? <span className="spinner" /> : <PlayIcon />}
                {running ? '运行中…' : '运行代码'}
              </button>
            </div>
          </div>
        </section>

        <aside className="io-col">
          {!activeIsPreview && (
            <section className="card stdin-card">
              <div className="card-head">
                <span className="card-title">标准输入</span>
                {expectsStdin ? (
                  <span className="card-warn">运行中可在输出区实时输入</span>
                ) : (
                  <span className="card-hint">stdin · 可选</span>
                )}
              </div>
              <textarea
                ref={stdinRef}
                className="stdin-area"
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                placeholder={
                  expectsStdin
                    ? '可预先填写输入内容（每行一个），运行时会自动送入程序…\n例如：\n70\n1.75'
                    : '程序运行时会读取这里的内容…\n例如：\n5 3\n1 2 3 4 5'
                }
                spellCheck={false}
                aria-label="标准输入"
              />
            </section>
          )}

          <section className="card output-card">
            <div className="card-head">
              <span className="card-title">{activeIsPreview ? 'HTML 运行空间' : '输出'}</span>
              <span className="spacer" />
              {running ? (
                <button type="button" className="ghost-btn danger" onClick={stopRun}>
                  终止
                </button>
              ) : (
                result &&
                (result.preview ? (
                  <div className="preview-actions">
                    <span className="chip good">浏览器渲染</span>
                    <button
                      type="button"
                      className="icon-btn"
                      title="在新窗口独立运行"
                      aria-label="在新窗口独立运行"
                      onClick={openPreviewWindow}
                    >
                      <ExternalIcon />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="全屏预览"
                      aria-label="全屏预览"
                      onClick={() => setZenOpen(true)}
                    >
                      <ExpandIcon />
                    </button>
                  </div>
                ) : (
                  <div className="meta-chips">
                    <span className={`chip ${result.ok ? 'good' : 'bad'}`}>
                      退出码 {result.exitCode === null ? '—' : result.exitCode}
                    </span>
                    <span className="chip">耗时 {formatDuration(result.durationMs)}</span>
                  </div>
                ))
              )}
            </div>

            <div className={`output-body${result?.preview ? ' previewing' : ''}`} ref={outputRef}>
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
                  <p>{activeIsPreview ? '点击「运行代码」预览页面' : '点击「运行代码」查看结果'}</p>
                  <span>
                    {availableCount > 0
                      ? `${availableCount} 个运行时可用 · 支持 ${SNIPPET_COUNT} 种语言`
                      : '正在检测本机可用的语言运行时'}
                  </span>
                </div>
              )}

              {running && !result?.stdout && !result?.stderr && (
                <div className="run-state">
                  <span className="spinner large" />
                  <span>{result?.statusText || '正在编译并执行…'}</span>
                </div>
              )}

              {result && !running && result.timedOut && (
                <div className="banner warn">
                  程序超过 30 秒没有响应，已被终止（如需输入，请在运行中直接键入）
                </div>
              )}
              {result && !running && result.truncated && (
                <div className="banner warn">输出内容过多，已被截断</div>
              )}
              {result && !running && result.phase === 'compile' && (
                <div className="banner error">编译未通过，请检查上方代码</div>
              )}

              {result?.stdout && <pre className="stream out">{result.stdout}</pre>}
              {result?.stderr && <pre className="stream err">{result.stderr}</pre>}

              {!running && result && !result.preview && !result.stdout && !result.stderr && !result.timedOut && (
                <div className="no-output">（程序没有产生输出）</div>
              )}
            </div>

            {running && (
              <form
                className="term-input"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendLine();
                }}
              >
                <span className="term-caret">›</span>
                <input
                  className="term-field"
                  value={lineInput}
                  onChange={(event) => setLineInput(event.target.value)}
                  placeholder="程序等待输入时，在这里键入并回车"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  aria-label="实时标准输入"
                />
                <button type="submit" className="term-send">
                  发送
                </button>
              </form>
            )}
          </section>
        </aside>
        </main>
      ) : (
        <PromptLibrary onToast={showToast} />
      )}

      {zenOpen && result?.preview && (
        <div className="preview-zen" role="dialog" aria-modal="true" aria-label="HTML 全屏预览">
          <div className="preview-zen-bar">
            <span className="file-name">{project.files.find((file) => /\.html?$/i.test(file.path))?.path || 'index.html'}</span>
            <span className="chip good">独立预览</span>
            <span className="spacer" />
            <button type="button" className="ghost-btn" onClick={openPreviewWindow}>
              新窗口
            </button>
            <button type="button" className="ghost-btn" onClick={() => setZenOpen(false)}>
              退出全屏
            </button>
          </div>
          <iframe
            key={`zen-${result.previewKey}`}
            className="preview-zen-frame"
            title="HTML 全屏预览"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            srcDoc={result.preview}
          />
        </div>
      )}

      {shareOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShareOpen(false);
          }}
        >
          <div className="prompt-dialog share-dialog">
            <div className="dialog-head">
              <h3>分享代码</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShareOpen(false)}
                aria-label="关闭"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="dialog-body">
              <label className="field">
                <span>分享链接</span>
                <input
                  value={shareLink}
                  readOnly
                  onFocus={(event) => event.target.select()}
                  aria-label="分享链接"
                />
              </label>
              <p className="share-tip">
                打开链接即可载入 {activeMeta?.name || '该语言'} 的代码与标准输入。
              </p>
            </div>
            <div className="dialog-foot">
              <span className="dialog-hint">
                {activeMeta?.name || '代码'} · {project.files.length} 个文件 ·{' '}
                {project.files.reduce((sum, file) => sum + file.content.length, 0)} 字符
              </span>
              <div className="dialog-actions">
                <button type="button" className="ghost-btn" onClick={() => setShareOpen(false)}>
                  关闭
                </button>
                <button type="button" className="run-btn" onClick={copyShareLink}>
                  复制链接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
