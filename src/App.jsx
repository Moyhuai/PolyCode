import { Suspense, lazy, useEffect } from 'react';
import Home from './pages/Home';
import SiteHeader from './components/SiteHeader';
import { getLanguage } from './data/languages';
import { homeHref, matchRoute } from './lib/router';

// 编辑器与语言语法包体积较大，仅进入运行页时加载
const Runner = lazy(() => import('./pages/Runner'));

function NotFound() {
  useEffect(() => {
    document.title = '页面不存在 · PolyCode';
  }, []);

  return (
    <>
      <SiteHeader back />
      <main className="not-found">
        <h1>404</h1>
        <p>这个工具不存在，也许链接拼错了。</p>
        <a className="run-btn" href={homeHref()}>
          返回全部工具
        </a>
      </main>
    </>
  );
}

export default function App() {
  const route = matchRoute();
  let page = <Home />;

  if (route.page === 'tool') {
    const language = getLanguage(route.id);
    page = language ? (
      <Suspense
        fallback={
          <div className="page-loading">
            <span className="spinner large" />
            <span>正在载入编辑器…</span>
          </div>
        }
      >
        <Runner language={language} />
      </Suspense>
    ) : (
      <NotFound />
    );
  }

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />
      {page}
    </div>
  );
}
