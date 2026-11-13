import express from 'express';
import cors from 'cors';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const PORT = Number(process.env.PORT || 8787);
const MAX_CODE_BYTES = 200_000;
const MAX_OUTPUT = 120_000;
const RUN_TIMEOUT = 10_000;
const COMPILE_TIMEOUT = 30_000;
const SESSION_IDLE_TIMEOUT = 30_000;
const SESSION_MAX_TIMEOUT = 120_000;
const MAX_SHARES = 500;
const exeName = isWin ? 'main.exe' : 'main';

// C/C++ 的 stdout 在管道下默认全缓冲，交互式提示会看不到，这里强制关闭缓冲
const C_UNBUFFER_HEADER = `#ifndef POLYCODE_IO_H
#define POLYCODE_IO_H
#include <stdio.h>
__attribute__((constructor)) static void __polycode_unbuffer(void) {
  setvbuf(stdout, NULL, _IONBF, 0);
  setvbuf(stderr, NULL, _IONBF, 0);
}
#endif
`;

function safeRelPath(raw) {
  const value = String(raw || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!value || value.includes('\0')) return null;
  const parts = value.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return null;
  return parts.join('/');
}

async function prepareSource(dir, def, files, entry) {
  const list = Array.isArray(files) && files.length ? files : [{ path: def.fileName, content: '' }];
  const written = [];

  for (const file of list) {
    const rel = safeRelPath(file?.path);
    if (!rel) throw new Error('文件名不合法');
    const abs = path.resolve(dir, rel);
    if (abs !== dir && !abs.startsWith(dir + path.sep)) throw new Error('文件名不合法');
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, String(file?.content ?? ''), 'utf8');
    written.push(rel);
  }

  if (def.id === 'c' || def.id === 'cpp') {
    await fs.writeFile(path.join(dir, 'polycode_io.h'), C_UNBUFFER_HEADER, 'utf8');
  }

  const fallback =
    written.find((item) => item === entry) ||
    written.find((item) => item.toLowerCase() === def.fileName.toLowerCase()) ||
    written[0];

  return { files: written, entry: fallback };
}

function pickSources(files, extensions) {
  return files.filter((file) => extensions.some((ext) => file.toLowerCase().endsWith(ext)));
}

function topLevelGoFiles(files) {
  const list = files.filter((file) => file.endsWith('.go') && !file.includes('/'));
  return list.length ? list : files.filter((file) => file.endsWith('.go'));
}

/* ------------------------------------------------------------------ */
/* 语言注册表                                                          */
/* ------------------------------------------------------------------ */

const LANG_DEFS = [
  {
    id: 'html',
    name: 'HTML',
    monogram: 'HTML',
    color: '#e34f26',
    fileName: 'index.html',
    preview: true,
    detect: [],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    monogram: 'JS',
    color: '#f7df1e',
    fileName: 'main.js',
    detect: [{ command: 'node', args: ['--version'] }],
    run: ({ entry }) => ({ command: 'node', args: [entry] }),
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monogram: 'TS',
    color: '#3178c6',
    fileName: 'main.ts',
    detect: [{ command: 'node', args: ['--version'] }],
    run: ({ entry }) => ({ command: 'node', args: [entry] }),
  },
  {
    id: 'python',
    name: 'Python',
    monogram: 'PY',
    color: '#3776ab',
    fileName: 'main.py',
    detect: [
      { command: 'python', args: ['--version'] },
      { command: 'py', args: ['-3', '--version'] },
    ],
    run: ({ runtime, entry }) => ({ command: runtime.command, args: [entry] }),
    env: { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  },
  {
    id: 'c',
    name: 'C',
    monogram: 'C',
    color: '#5c6bc0',
    fileName: 'main.c',
    detect: [{ command: 'gcc', args: ['--version'] }],
    compile: ({ files }) => {
      const sources = pickSources(files, ['.c']);
      return {
        command: 'gcc',
        args: [
          ...(sources.length ? sources : ['main.c']),
          '-O2',
          '-Wall',
          '-include',
          'polycode_io.h',
          '-o',
          exeName,
        ],
      };
    },
    run: ({ dir }) => ({ command: path.join(dir, exeName), args: [] }),
  },
  {
    id: 'cpp',
    name: 'C++',
    monogram: 'C++',
    color: '#00599c',
    fileName: 'main.cpp',
    detect: [{ command: 'g++', args: ['--version'] }],
    compile: ({ files }) => {
      const sources = pickSources(files, ['.cpp', '.cc', '.cxx']);
      return {
        command: 'g++',
        args: [
          ...(sources.length ? sources : ['main.cpp']),
          '-O2',
          '-std=c++17',
          '-Wall',
          '-include',
          'polycode_io.h',
          '-o',
          exeName,
        ],
      };
    },
    run: ({ dir }) => ({ command: path.join(dir, exeName), args: [] }),
  },
  {
    id: 'rust',
    name: 'Rust',
    monogram: 'RS',
    color: '#dea584',
    fileName: 'main.rs',
    detect: [{ command: 'rustc', args: ['--version'] }],
    compile: ({ runtime, entry }) =>
      runtime?.rustToolchain
        ? {
            command: 'rustup',
            args: ['run', runtime.rustToolchain, 'rustc', '-O', entry, '-o', exeName],
          }
        : { command: 'rustc', args: ['-O', entry, '-o', exeName] },
    run: ({ dir }) => ({ command: path.join(dir, exeName), args: [] }),
  },
  {
    id: 'java',
    name: 'Java',
    monogram: 'JV',
    color: '#e76f00',
    fileName: 'Main.java',
    detect: [{ command: 'java', args: ['-version'] }],
    compile: ({ dir, files }) => {
      const sources = pickSources(files, ['.java']);
      return {
        command: 'javac',
        args: ['-encoding', 'UTF-8', '-d', dir, ...(sources.length ? sources : ['Main.java'])],
      };
    },
    run: ({ dir, entry }) => ({
      command: 'java',
      args: [
        '-Dfile.encoding=UTF-8',
        '-Dstdout.encoding=UTF-8',
        '-Dstderr.encoding=UTF-8',
        '-cp',
        dir,
        path.basename(entry, '.java'),
      ],
    }),
  },
  {
    id: 'go',
    name: 'Go',
    monogram: 'GO',
    color: '#00add8',
    fileName: 'main.go',
    detect: [{ command: 'go', args: ['version'] }],
    compile: ({ files }) => {
      const sources = topLevelGoFiles(files);
      return {
        command: 'go',
        args: ['build', '-o', exeName, ...(sources.length ? sources : ['main.go'])],
      };
    },
    run: ({ dir }) => ({ command: path.join(dir, exeName), args: [] }),
  },
  {
    id: 'php',
    name: 'PHP',
    monogram: 'PHP',
    color: '#777bb4',
    fileName: 'main.php',
    detect: [{ command: 'php', args: ['--version'] }],
    run: ({ entry }) => ({ command: 'php', args: [entry] }),
  },
  {
    id: 'ruby',
    name: 'Ruby',
    monogram: 'RB',
    color: '#cc342d',
    fileName: 'main.rb',
    detect: [{ command: 'ruby', args: ['--version'] }],
    run: ({ entry }) => ({ command: 'ruby', args: [entry] }),
  },
];

/* ------------------------------------------------------------------ */
/* 进程执行                                                            */
/* ------------------------------------------------------------------ */

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (isWin) {
    try {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
      });
      killer.on('error', () => {});
    } catch {
      /* ignore */
    }
  } else {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }
}

function runProcess(command, args, options = {}) {
  const { cwd, input = '', timeout = RUN_TIMEOUT, env = {} } = options;

  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let captured = 0;
    let timedOut = false;
    let truncated = false;
    let finished = false;

    const finish = (exitCode, extra = {}) => {
      if (finished) return;
      finished = true;
      resolve({
        exitCode,
        stdout,
        stderr,
        timedOut,
        truncated,
        durationMs: Date.now() - started,
        ...extra,
      });
    };

    let child;
    try {
      child = spawn(command, args, {
        cwd,
        windowsHide: true,
        detached: !isWin,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      finish(null, { spawnError: error.message });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeout);

    const append = (target, chunk) => {
      const text = chunk.toString('utf8');
      if (captured >= MAX_OUTPUT) {
        truncated = true;
        return;
      }
      const room = MAX_OUTPUT - captured;
      const slice = text.length > room ? text.slice(0, room) : text;
      captured += slice.length;
      if (target === 'stdout') stdout += slice;
      else stderr += slice;
      if (captured >= MAX_OUTPUT) {
        truncated = true;
        killTree(child);
      }
    };

    child.stdout?.on('data', (chunk) => append('stdout', chunk));
    child.stderr?.on('data', (chunk) => append('stderr', chunk));

    child.on('error', (error) => {
      clearTimeout(timer);
      finish(null, { spawnError: error.message });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (truncated) stderr += '\n[输出超过上限，进程已被终止]';
      finish(code);
    });

    try {
      child.stdin?.end(input);
    } catch {
      /* ignore */
    }
  });
}

/* ------------------------------------------------------------------ */
/* 运行时探测                                                          */
/* ------------------------------------------------------------------ */

const runtimes = new Map();

function pickVersion(raw) {
  const match = raw.match(/\d+\.\d+(?:\.\d+)?/);
  return match ? match[0] : raw.split(/\s+/).slice(0, 3).join(' ');
}

async function detectRuntime(def) {
  for (const candidate of def.detect) {
    const result = await runProcess(candidate.command, candidate.args, {
      timeout: 6000,
    });
    if (!result.spawnError && result.exitCode === 0) {
      const raw = `${result.stdout}\n${result.stderr}`.trim().split('\n')[0] || '';
      return {
        available: true,
        command: candidate.command,
        version: pickVersion(raw),
        raw,
      };
    }
  }
  return { available: false, command: null, version: null };
}

async function detectAll() {
  await Promise.all(
    LANG_DEFS.map(async (def) => {
      // HTML 由浏览器直接预览，不依赖本机运行时
      if (def.preview) {
        runtimes.set(def.id, { available: true, command: null, version: '浏览器预览' });
        return;
      }

      const detected = await detectRuntime(def);
      if (def.id === 'typescript' && detected.available) {
        const major = Number((detected.raw.match(/v(\d+)/) || [])[1] || 0);
        if (major < 23) {
          runtimes.set(def.id, {
            available: false,
            command: null,
            version: null,
            reason: '需要 Node.js 23+ 才支持直接运行 TypeScript',
          });
          return;
        }
        detected.version = `${detected.version} · 类型剥离`;
      }

      // Windows 上默认的 MSVC 目标需要 link.exe，若存在 GNU 工具链则优先使用
      if (def.id === 'rust' && detected.available && isWin) {
        const toolchains = await runProcess('rustup', ['toolchain', 'list'], { timeout: 8000 });
        if (!toolchains.spawnError && toolchains.exitCode === 0) {
          const gnu = toolchains.stdout
            .split('\n')
            .map((line) => line.trim())
            .find((line) => line.includes('windows-gnu'));
          if (gnu) {
            detected.rustToolchain = gnu.split(/\s+/)[0];
            detected.version = `${detected.version} · GNU`;
          }
        }
      }

      runtimes.set(def.id, detected);
    })
  );
}

function publicCatalog() {
  return LANG_DEFS.map((def) => {
    const runtime = runtimes.get(def.id) || {};
    return {
      id: def.id,
      name: def.name,
      monogram: def.monogram,
      color: def.color,
      fileName: def.fileName,
      preview: Boolean(def.preview),
      available: Boolean(runtime.available),
      version: runtime.version || null,
      reason: runtime.reason || null,
    };
  });
}

/* ------------------------------------------------------------------ */
/* HTTP 服务                                                           */
/* ------------------------------------------------------------------ */

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/languages', (_req, res) => {
  res.json({ languages: publicCatalog() });
});

/* ------------------------------------------------------------------ */
/* 交互式会话：保持 stdin 打开，支持运行时实时输入                      */
/* ------------------------------------------------------------------ */

const sessions = new Map();

function emit(session, event) {
  session.events.push(event);
  for (const client of session.clients) {
    try {
      client.res.write(`${JSON.stringify(event)}\n`);
    } catch {
      session.clients.delete(client);
    }
  }
}

function touch(session) {
  session.lastActivity = Date.now();
}

function finishSession(session, exitCode) {
  if (session.closed) return;
  session.closed = true;
  clearInterval(session.ticker);
  emit(session, {
    type: 'exit',
    exitCode,
    durationMs: Date.now() - session.started,
    timedOut: session.timedOut,
    truncated: session.truncated,
    compileFailed: session.compileFailed,
    compileMs: session.compileMs,
  });
  for (const client of session.clients) {
    try {
      client.res.end();
    } catch {
      /* ignore */
    }
  }
  session.clients.clear();
  setTimeout(() => {
    sessions.delete(session.id);
    fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
  }, 8000);
}

async function startSession(session) {
  const { def, dir, runtime, files, entry, initialStdin } = session;
  const env = { ...(def.env || {}) };
  let prepared;

  try {
    prepared = await prepareSource(dir, def, files, entry);
  } catch (error) {
    emit(session, { type: 'stderr', text: `写入源代码失败：${error.message}\n` });
    finishSession(session, null);
    return;
  }
  session.entry = prepared.entry;
  session.files = prepared.files;

  if (def.compile) {
    emit(session, { type: 'status', text: '正在编译…' });
    const compile = def.compile({ dir, runtime, entry: prepared.entry, files: prepared.files });
    const compiled = await runProcess(compile.command, compile.args, {
      cwd: dir,
      timeout: COMPILE_TIMEOUT,
      env,
    });
    session.compileMs = compiled.durationMs;
    if (compiled.stdout) emit(session, { type: 'stdout', text: compiled.stdout });
    if (compiled.stderr) emit(session, { type: 'stderr', text: compiled.stderr });

    if (compiled.spawnError || compiled.timedOut || compiled.exitCode !== 0) {
      emit(session, {
        type: 'stderr',
        text: compiled.spawnError
          ? `无法启动编译器：${compiled.spawnError}\n`
          : compiled.timedOut
            ? '\n[编译超时（30 秒）]\n'
            : '',
      });
      session.compileFailed = true;
      finishSession(session, compiled.exitCode);
      return;
    }
  }

  const command = def.run({ dir, runtime, entry: prepared.entry, files: prepared.files });
  let child;
  try {
    child = spawn(command.command, command.args, {
      cwd: dir,
      windowsHide: true,
      detached: !isWin,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    emit(session, { type: 'stderr', text: `无法启动运行时：${error.message}\n` });
    finishSession(session, null);
    return;
  }

  session.child = child;
  touch(session);

  const push = (type, chunk) => {
    const text = chunk.toString('utf8');
    if (session.truncated) return;
    const room = MAX_OUTPUT - session.captured;
    const slice = text.length > room ? text.slice(0, room) : text;
    session.captured += slice.length;
    if (slice) emit(session, { type, text: slice });
    if (session.captured >= MAX_OUTPUT) {
      session.truncated = true;
      emit(session, { type: 'stderr', text: '\n[输出超过上限，进程已被终止]\n' });
      killTree(child);
    }
  };

  child.stdout?.on('data', (chunk) => {
    touch(session);
    push('stdout', chunk);
  });
  child.stderr?.on('data', (chunk) => {
    touch(session);
    push('stderr', chunk);
  });

  child.on('error', (error) => {
    emit(session, { type: 'stderr', text: `无法启动运行时：${error.message}\n` });
    finishSession(session, null);
  });

  child.on('close', (code) => {
    finishSession(session, code);
  });

  // 预置输入：补一个换行，保证 input()/readline 能立即读到整行；随后保持 stdin 打开等待实时输入
  try {
    if (initialStdin) {
      const payload = initialStdin.endsWith('\n') ? initialStdin : `${initialStdin}\n`;
      child.stdin.write(payload);
    }
  } catch {
    /* ignore */
  }

  session.ticker = setInterval(() => {
    if (session.closed || session.timedOut) return;
    const now = Date.now();
    const idle = now - session.lastActivity;
    if (idle > SESSION_IDLE_TIMEOUT || now - session.started > SESSION_MAX_TIMEOUT) {
      session.timedOut = true;
      emit(session, {
        type: 'stderr',
        text: `\n[程序超过 ${Math.round(SESSION_IDLE_TIMEOUT / 1000)} 秒没有响应，已被终止]\n`,
      });
      killTree(child);
    }
  }, 500);
}

app.post('/api/sessions', async (req, res) => {
  const { language, code, files, entry, stdin = '' } = req.body || {};
  const def = LANG_DEFS.find((item) => item.id === language);

  if (!def) {
    res.status(400).json({ error: '不支持的语言' });
    return;
  }
  if (def.preview) {
    res.status(400).json({ error: 'HTML 直接在浏览器中预览，无需执行' });
    return;
  }

  let projectFiles;
  if (Array.isArray(files) && files.length) {
    projectFiles = [];
    let total = 0;
    for (const file of files) {
      const rel = safeRelPath(file?.path);
      if (!rel || typeof file?.content !== 'string') {
        res.status(400).json({ error: '存在不合法的文件' });
        return;
      }
      total += Buffer.byteLength(file.content, 'utf8');
      projectFiles.push({ path: rel, content: file.content });
    }
    if (total > MAX_CODE_BYTES * 5) {
      res.status(413).json({ error: '项目文件过大，上限 1MB' });
      return;
    }
  } else {
    if (typeof code !== 'string' || code.trim() === '') {
      res.status(400).json({ error: '代码内容不能为空' });
      return;
    }
    if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
      res.status(413).json({ error: '代码过大，上限 200KB' });
      return;
    }
    projectFiles = [{ path: def.fileName, content: code }];
  }

  const entryPath = safeRelPath(entry) || def.fileName;
  const runtime = runtimes.get(def.id);
  if (!runtime?.available) {
    res.status(400).json({ error: `${def.name} 运行时未安装，无法执行` });
    return;
  }

  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'polycode-'));
  } catch (error) {
    res.status(500).json({ error: `创建临时目录失败：${error.message}` });
    return;
  }

  const session = {
    id: randomUUID(),
    def,
    dir,
    runtime,
    files: projectFiles,
    entry: entryPath,
    initialStdin: typeof stdin === 'string' ? stdin : '',
    events: [],
    clients: new Set(),
    started: Date.now(),
    lastActivity: Date.now(),
    captured: 0,
    truncated: false,
    timedOut: false,
    compileMs: 0,
    compileFailed: false,
    closed: false,
    child: null,
    ticker: null,
  };

  sessions.set(session.id, session);
  res.json({ id: session.id });
  startSession(session).catch((error) => {
    emit(session, { type: 'stderr', text: `执行失败：${error.message}\n` });
    finishSession(session, null);
  });
});

app.get('/api/sessions/:id/events', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: '会话不存在或已结束' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  for (const event of session.events) res.write(`${JSON.stringify(event)}\n`);

  if (session.closed) {
    res.end();
    return;
  }

  const client = { res };
  session.clients.add(client);
  const cleanup = () => session.clients.delete(client);
  req.on('close', cleanup);
  req.on('error', cleanup);
});

app.post('/api/sessions/:id/input', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: '会话不存在或已结束' });
    return;
  }
  if (session.closed || !session.child) {
    res.status(409).json({ error: '程序已结束，无法继续输入' });
    return;
  }

  const data = String(req.body?.data ?? '');
  try {
    session.child.stdin.write(data);
    touch(session);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: `写入标准输入失败：${error.message}` });
  }
});

app.post('/api/sessions/:id/stop', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: '会话不存在或已结束' });
    return;
  }
  emit(session, { type: 'status', text: '正在终止…' });
  if (session.child) killTree(session.child);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* 代码分享                                                            */
/* ------------------------------------------------------------------ */

const shareDir = path.join(projectRoot, '.data');
const shareFile = path.join(shareDir, 'shares.json');
const shareIdChars = 'abcdefghijkmnpqrstuvwxyz23456789';
const shares = new Map();
let shareSaveTimer = null;

async function loadShares() {
  try {
    const raw = await fs.readFile(shareFile, 'utf8');
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      for (const item of list) {
        if (
          item &&
          typeof item.id === 'string' &&
          (typeof item.code === 'string' || Array.isArray(item.files))
        ) {
          shares.set(item.id, item);
        }
      }
    }
  } catch {
    /* 首次运行时还没有历史分享 */
  }
}

function persistShares() {
  if (shareSaveTimer) clearTimeout(shareSaveTimer);
  shareSaveTimer = setTimeout(() => {
    fs.mkdir(shareDir, { recursive: true })
      .then(() => fs.writeFile(shareFile, JSON.stringify([...shares.values()]), 'utf8'))
      .catch(() => {});
  }, 200);
}

function createShareId() {
  for (;;) {
    const bytes = randomBytes(8);
    let id = '';
    for (const byte of bytes) id += shareIdChars[byte % shareIdChars.length];
    if (!shares.has(id)) return id;
  }
}

app.post('/api/shares', (req, res) => {
  const { language, code, files, entry, stdin = '' } = req.body || {};
  const def = LANG_DEFS.find((item) => item.id === language);

  if (!def) {
    res.status(400).json({ error: '不支持的语言' });
    return;
  }

  let payload;
  if (Array.isArray(files) && files.length) {
    const projectFiles = [];
    let total = 0;
    for (const file of files) {
      const rel = safeRelPath(file?.path);
      if (!rel || typeof file?.content !== 'string') {
        res.status(400).json({ error: '存在不合法的文件' });
        return;
      }
      total += Buffer.byteLength(file.content, 'utf8');
      projectFiles.push({ path: rel, content: file.content });
    }
    if (total > MAX_CODE_BYTES * 5) {
      res.status(413).json({ error: '项目文件过大，上限 1MB' });
      return;
    }
    payload = { files: projectFiles, entry: safeRelPath(entry) || projectFiles[0].path };
  } else {
    if (typeof code !== 'string' || code.trim() === '') {
      res.status(400).json({ error: '代码内容不能为空' });
      return;
    }
    if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
      res.status(413).json({ error: '代码过大，上限 200KB' });
      return;
    }
    payload = { code };
  }

  const share = {
    id: createShareId(),
    language: def.id,
    ...payload,
    stdin: typeof stdin === 'string' ? stdin : '',
    createdAt: Date.now(),
  };
  shares.set(share.id, share);

  if (shares.size > MAX_SHARES) {
    const oldest = [...shares.values()].sort((a, b) => a.createdAt - b.createdAt);
    for (const item of oldest.slice(0, shares.size - MAX_SHARES)) shares.delete(item.id);
  }

  persistShares();
  res.json({ id: share.id, path: `/s/${share.id}` });
});

app.get('/api/shares/:id', (req, res) => {
  const share = shares.get(req.params.id);
  if (!share) {
    res.status(404).json({ error: '分享链接不存在或已失效' });
    return;
  }
  res.json(share);
});

app.post('/api/run', async (req, res) => {
  const { language, code, stdin = '' } = req.body || {};
  const def = LANG_DEFS.find((item) => item.id === language);

  if (!def) {
    res.status(400).json({ error: '不支持的语言' });
    return;
  }
  if (typeof code !== 'string' || code.trim() === '') {
    res.status(400).json({ error: '代码内容不能为空' });
    return;
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    res.status(413).json({ error: '代码过大，上限 200KB' });
    return;
  }

  const runtime = runtimes.get(def.id);
  if (!runtime?.available) {
    res.status(400).json({ error: `${def.name} 运行时未安装，无法执行` });
    return;
  }

  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'polycode-'));
    const prepared = await prepareSource(dir, def, [{ path: def.fileName, content: code }], def.fileName);

    const env = {
      ...(def.env || {}),
    };

    let compileDuration = 0;
    if (def.compile) {
      const compile = def.compile({
        dir,
        runtime,
        entry: prepared.entry,
        files: prepared.files,
      });
      const compiled = await runProcess(compile.command, compile.args, {
        cwd: dir,
        timeout: COMPILE_TIMEOUT,
        env,
      });
      compileDuration = compiled.durationMs;

      if (compiled.spawnError) {
        res.json({
          ok: false,
          phase: 'compile',
          stdout: compiled.stdout,
          stderr: `无法启动编译器：${compiled.spawnError}`,
          exitCode: null,
          durationMs: compiled.durationMs,
        });
        return;
      }
      if (compiled.timedOut) {
        res.json({
          ok: false,
          phase: 'compile',
          stdout: compiled.stdout,
          stderr: '编译超时（30 秒）',
          exitCode: compiled.exitCode,
          timedOut: true,
          durationMs: compiled.durationMs,
        });
        return;
      }
      if (compiled.exitCode !== 0) {
        res.json({
          ok: false,
          phase: 'compile',
          stdout: compiled.stdout,
          stderr: compiled.stderr || '编译失败',
          exitCode: compiled.exitCode,
          durationMs: compiled.durationMs,
        });
        return;
      }
    }

    const command = def.run({
      dir,
      runtime,
      entry: prepared.entry,
      files: prepared.files,
    });
    const result = await runProcess(command.command, command.args, {
      cwd: dir,
      input: typeof stdin === 'string' ? stdin : '',
      timeout: RUN_TIMEOUT,
      env,
    });

    const stderr = result.spawnError
      ? `无法启动运行时：${result.spawnError}`
      : result.stderr;
    const stdinEmpty = typeof stdin !== 'string' || stdin.trim() === '';
    const stdinHint =
      stdinEmpty && /EOFError|EOF when reading a line|NoSuchElementException/i.test(stderr);

    res.json({
      ok: result.exitCode === 0 && !result.timedOut,
      phase: 'run',
      stdout: result.stdout,
      stderr,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      truncated: result.truncated,
      durationMs: result.durationMs,
      compileMs: compileDuration,
      stdinHint,
    });
  } catch (error) {
    res.status(500).json({ error: `执行失败：${error.message}` });
  } finally {
    if (dir) {
      fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

// 生产模式下直接托管构建产物
const distDir = path.join(projectRoot, 'dist');
app.use(express.static(distDir));
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) next();
  });
});

async function bootstrap() {
  await loadShares();
  await detectAll().catch((error) => console.error('[polycode] 运行时探测失败：', error));
  app.listen(PORT, () => {
    const ready = [...runtimes.values()].filter((item) => item.available).length;
    console.log(`[polycode] 服务已启动：http://127.0.0.1:${PORT}`);
    console.log(`[polycode] 可用运行时：${ready}/${LANG_DEFS.length}`);
  });
}

bootstrap();
