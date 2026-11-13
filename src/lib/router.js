const BASE = import.meta.env.BASE_URL || '/';

export function toolHref(id) {
  return `${BASE}tool/${id}/`;
}

export function homeHref() {
  return BASE;
}

// GitHub Pages 会用 404.html 兜底到 index.html，这里根据路径判断页面
export function matchRoute(pathname = window.location.pathname) {
  const base = BASE.replace(/\/$/, '');
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  path = path.replace(/^\/+|\/+$/g, '');

  const match = path.match(/^tool\/([^/]+)$/);
  if (match) return { page: 'tool', id: decodeURIComponent(match[1]) };
  return { page: 'home' };
}
