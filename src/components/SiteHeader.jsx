import { ArrowLeftIcon, BrandMark, GithubIcon } from './icons';
import { homeHref } from '../lib/router';

export default function SiteHeader({ back = false }) {
  return (
    <header className="site-head">
      <div className="site-head-left">
        {back && (
          <a className="back-link" href={homeHref()}>
            <ArrowLeftIcon />
            <span>全部工具</span>
          </a>
        )}
        <a className="brand" href={homeHref()}>
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-name">PolyCode</span>
          <span className="brand-sub">在线工具</span>
        </a>
      </div>

      <nav className="site-nav" aria-label="站点导航">
        {!back && (
          <>
            <a href="#compiler">编译工具</a>
            <a href="#frontend">前端编辑器</a>
          </>
        )}
        <a
          className="gh-link"
          href="https://github.com/Moyhuai/PolyCode"
          target="_blank"
          rel="noreferrer"
        >
          <GithubIcon />
          <span>GitHub</span>
        </a>
      </nav>
    </header>
  );
}
