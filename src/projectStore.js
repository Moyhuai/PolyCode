import { SNIPPETS } from './languages.js';

const STORAGE_KEY = 'polycode.projects.v2';
const LEGACY_KEY = 'polycode.codes.v1';

export const ENTRY_FILES = {
  html: 'index.html',
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  c: 'main.c',
  cpp: 'main.cpp',
  rust: 'main.rs',
  java: 'Main.java',
  go: 'main.go',
  php: 'main.php',
  ruby: 'main.rb',
};

const EXTENSION_LANG = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  rs: 'rust',
  java: 'java',
  go: 'go',
  php: 'php',
  rb: 'ruby',
};

export function languageForFile(filePath, fallback) {
  const ext = String(filePath || '').split('.').pop().toLowerCase();
  return EXTENSION_LANG[ext] || fallback;
}

export function normalizePath(raw) {
  const value = String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const parts = value.split('/').filter((part) => part && part !== '.');
  if (!parts.length || parts.some((part) => part === '..')) return null;
  if (parts.some((part) => /[<>:"|?*\u0000]/.test(part))) return null;
  return parts.join('/');
}

export function defaultProject(languageId) {
  const filePath = ENTRY_FILES[languageId] || 'main.txt';
  return {
    files: [{ path: filePath, content: SNIPPETS[languageId] || '' }],
    folders: [],
    active: filePath,
  };
}

export function normalizeProject(project, languageId) {
  if (!project || !Array.isArray(project.files) || !project.files.length) {
    return defaultProject(languageId);
  }

  const files = [];
  const seen = new Set();
  for (const file of project.files) {
    const rel = normalizePath(file?.path);
    if (!rel || typeof file?.content !== 'string' || seen.has(rel)) continue;
    seen.add(rel);
    files.push({ path: rel, content: file.content });
  }
  if (!files.length) return defaultProject(languageId);

  const folders = Array.isArray(project.folders)
    ? [...new Set(project.folders.map(normalizePath).filter(Boolean))]
    : [];

  const active = files.some((file) => file.path === project.active)
    ? project.active
    : files[0].path;

  return { files, folders, active };
}

export function loadProjects() {
  let saved = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    saved = {};
  }

  // 兼容旧版单文件存储
  if (!Object.keys(saved).length) {
    try {
      const legacy = JSON.parse(window.localStorage.getItem(LEGACY_KEY) || '{}') || {};
      for (const [id, code] of Object.entries(legacy)) {
        if (typeof code !== 'string') continue;
        const filePath = ENTRY_FILES[id] || 'main.txt';
        saved[id] = { files: [{ path: filePath, content: code }], folders: [], active: filePath };
      }
    } catch {
      /* ignore */
    }
  }

  return Object.fromEntries(
    Object.keys(SNIPPETS).map((id) => [id, normalizeProject(saved[id], id)])
  );
}

export function saveProjects(projects) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* 存储空间不足时忽略 */
  }
}

export function getActiveFile(project) {
  if (!project?.files?.length) return null;
  return project.files.find((file) => file.path === project.active) || project.files[0];
}

// 运行入口：优先默认入口文件，其次同语言扩展名，最后第一个文件
export function pickEntry(project, languageId) {
  const expected = ENTRY_FILES[languageId] || 'main.txt';
  const files = project?.files || [];
  const byName = files.find(
    (file) => file.path === expected || file.path.endsWith(`/${expected}`)
  );
  if (byName) return byName.path;
  const byLanguage = files.find((file) => languageForFile(file.path) === languageId);
  return (byLanguage || files[0])?.path || expected;
}

export function updateFileContent(project, filePath, content) {
  return {
    ...project,
    files: project.files.map((file) =>
      file.path === filePath ? { ...file, content } : file
    ),
  };
}

export function createFile(project, rawPath) {
  const rel = normalizePath(rawPath);
  if (!rel) return { error: '文件名不合法' };
  if (project.files.some((file) => file.path === rel) || project.folders.includes(rel)) {
    return { error: '同名文件已存在' };
  }
  return {
    project: {
      ...project,
      files: [...project.files, { path: rel, content: '' }],
      active: rel,
    },
  };
}

export function createFolder(project, rawPath) {
  const rel = normalizePath(rawPath);
  if (!rel) return { error: '文件夹名不合法' };
  if (project.files.some((file) => file.path === rel) || project.folders.includes(rel)) {
    return { error: '同名文件夹已存在' };
  }
  return { project: { ...project, folders: [...project.folders, rel] } };
}

export function removePath(project, target) {
  const files = project.files.filter(
    (file) => file.path !== target && !file.path.startsWith(`${target}/`)
  );
  if (!files.length) return project;
  const folders = project.folders.filter(
    (folder) => folder !== target && !folder.startsWith(`${target}/`)
  );
  const active = files.some((file) => file.path === project.active)
    ? project.active
    : files[0].path;
  return { files, folders, active };
}

export function buildTree(project) {
  const root = { name: '', path: '', folders: new Map(), files: [] };

  const ensure = (parts) => {
    let node = root;
    let prefix = '';
    for (const part of parts) {
      prefix = prefix ? `${prefix}/${part}` : part;
      if (!node.folders.has(part)) {
        node.folders.set(part, { name: part, path: prefix, folders: new Map(), files: [] });
      }
      node = node.folders.get(part);
    }
    return node;
  };

  for (const folder of project.folders) ensure(folder.split('/'));
  for (const file of project.files) {
    const parts = file.path.split('/');
    const name = parts.pop();
    ensure(parts).files.push({ name, path: file.path });
  }
  return root;
}

function resolveRelative(entryPath, target) {
  const base = entryPath.split('/').slice(0, -1);
  for (const part of String(target).replace(/^\.\//, '').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') base.pop();
    else base.push(part);
  }
  return base.join('/');
}

// 把 HTML 项目里的相对 <link> / <script src> 内联，方便在 sandbox iframe 中预览
export function buildPreviewHtml(project) {
  const entry =
    project.files.find((file) => file.path === project.active && /\.html?$/i.test(file.path)) ||
    project.files.find((file) => /\.html?$/i.test(file.path));

  if (!entry) {
    return getActiveFile(project)?.content || '';
  }

  let html = entry.content;

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href || /^(https?:|data:|\/\/)/i.test(href)) return tag;
    const target = resolveRelative(entry.path, href);
    const css = project.files.find((file) => file.path === target);
    return css ? `<style>\n${css.content}\n</style>` : tag;
  });

  html = html.replace(
    /<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (tag, before, src, after) => {
      if (/^(https?:|data:|\/\/)/i.test(src)) return tag;
      const target = resolveRelative(entry.path, src);
      const js = project.files.find((file) => file.path === target);
      if (!js) return tag;
      const type = `${before} ${after}`.match(/type\s*=\s*["']([^"']+)["']/i)?.[1];
      return `<script${type ? ` type="${type}"` : ''}>\n${js.content}\n</script>`;
    }
  );

  return html;
}
