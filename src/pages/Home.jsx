import { useEffect, useMemo, useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import { ArrowRightIcon, SearchIcon } from '../components/icons';
import { CATEGORIES, LANGUAGE_COUNT, languagesOf } from '../data/languages';
import { toolHref } from '../lib/router';

function ToolCard({ item }) {
  return (
    <a className="tool-card" href={toolHref(item.id)} style={{ '--lang': item.color }}>
      <span className="tool-monogram">{item.monogram}</span>
      <span className="tool-body">
        <span className="tool-name">{item.name}</span>
        <span className="tool-desc">{item.tagline}</span>
      </span>
      <span className="tool-side">
        <span className="tool-version">{item.version}</span>
        <span className="tool-arrow">
          <ArrowRightIcon />
        </span>
      </span>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'PolyCode · 多语言在线运行平台';
  }, []);

  const keyword = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        items: languagesOf(category.id).filter((item) =>
          keyword
            ? `${item.name} ${item.id} ${item.tagline} ${item.version}`
                .toLowerCase()
                .includes(keyword)
            : true
        ),
      })),
    [keyword]
  );
  const matched = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <SiteHeader />

      <main className="home">
        <section className="hero">
          <span className="eyebrow">ONLINE COMPILER · 在线工具</span>
          <h1>
            多语言<span>在线运行</span>平台
          </h1>
          <p className="hero-desc">
            打开网页就能写代码、点一下就能跑。覆盖编译型、脚本、函数式语言与前端预览，
            全部在云端沙箱中执行，无需安装任何环境。
          </p>
          <div className="hero-stats">
            <span>
              <b>{LANGUAGE_COUNT}</b> 种语言
            </span>
            <span>
              <b>0</b> 安装
            </span>
            <span>
              <b>浏览器</b> 直连
            </span>
          </div>

          <label className="search-box">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索语言，例如 Python / Rust / Kotlin"
              spellCheck={false}
              aria-label="搜索语言"
            />
            {keyword && <span className="search-count">{matched} 个结果</span>}
          </label>
        </section>

        {groups.map((group) => (
          <section className="tool-section" id={group.id} key={group.id}>
            <div className="section-head">
              <div>
                <h2>{group.title}</h2>
                <p>{group.subtitle}</p>
              </div>
              <span className="section-count">{group.items.length} 个工具</span>
            </div>

            {group.items.length > 0 ? (
              <div className="tool-grid">
                {group.items.map((item) => (
                  <ToolCard item={item} key={item.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <p>没有找到匹配「{query.trim()}」的语言</p>
              </div>
            )}
          </section>
        ))}

        <section className="home-note">
          <div>
            <h3>云端沙箱执行</h3>
            <p>代码通过 Judge0 CE 公共接口在隔离容器中运行，支持标准输入，输出实时回传。</p>
          </div>
          <div>
            <h3>纯静态部署</h3>
            <p>站点托管在 GitHub Pages，不含任何自建后端，打开链接即可使用。</p>
          </div>
          <div>
            <h3>代码本地留存</h3>
            <p>编辑内容自动保存在浏览器本地，刷新或下次打开都能继续编辑。</p>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <span>PolyCode · 多语言在线运行平台</span>
        <span>公共执行接口有频率限制，请勿提交敏感代码或数据</span>
      </footer>
    </>
  );
}
