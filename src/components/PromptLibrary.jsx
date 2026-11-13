import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PROMPT_CATEGORIES,
  createPrompt,
  loadPrompts,
  savePrompts,
} from '../promptStore';

function StarIcon({ filled = false, size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9L12 3.5Z" />
    </svg>
  );
}

function SearchIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2.5 2.5 0 0 0-2.5 2.5V13A2.5 2.5 0 0 0 6 15.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 6.5 3 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12h9.4l.8-12" />
    </svg>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  } catch {
    return '';
  }
}

export default function PromptLibrary({ onToast }) {
  const [prompts, setPrompts] = useState(loadPrompts);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部');
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);

  useEffect(() => {
    if (!confirmId) return undefined;
    const timer = setTimeout(() => setConfirmId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmId]);

  const counts = useMemo(() => {
    const map = { 全部: prompts.length, 收藏: prompts.filter((item) => item.favorite).length };
    PROMPT_CATEGORIES.forEach((category) => {
      map[category] = prompts.filter((item) => item.category === category).length;
    });
    return map;
  }, [prompts]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return prompts
      .filter((item) => {
        if (filter === '全部') return true;
        if (filter === '收藏') return item.favorite;
        return item.category === filter;
      })
      .filter((item) => {
        if (!keyword) return true;
        const haystack = [item.title, item.content, item.category, ...(item.tags || [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
  }, [prompts, query, filter]);

  const toggleFavorite = (id) => {
    setPrompts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  };

  const copyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      onToast?.('提示词已复制');
    } catch {
      onToast?.('复制失败，请手动选择文本');
    }
  };

  const handleSave = (draft) => {
    setPrompts((prev) =>
      prev.some((item) => item.id === draft.id)
        ? prev.map((item) => (item.id === draft.id ? draft : item))
        : [draft, ...prev]
    );
    setEditing(null);
    onToast?.('提示词已保存');
  };

  const handleDelete = (id) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setPrompts((prev) => prev.filter((item) => item.id !== id));
    setConfirmId(null);
    onToast?.('提示词已删除');
  };

  const filters = ['全部', '收藏', ...PROMPT_CATEGORIES];

  return (
    <div className="prompt-view">
      <div className="prompt-toolbar">
        <div className="prompt-heading">
          <h2>提示词库</h2>
          <p>沉淀常用提示词，一键复制到任意 AI 工具</p>
        </div>
        <div className="prompt-tools">
          <label className="prompt-search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、内容或标签"
              aria-label="搜索提示词"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="清空搜索"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </label>
          <button
            type="button"
            className="run-btn prompt-new"
            onClick={() => setEditing(createPrompt())}
          >
            <PlusIcon />
            新建提示词
          </button>
        </div>
      </div>

      <div className="prompt-filters">
        {filters.map((key) => (
          <button
            key={key}
            type="button"
            className={`filter-chip${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === '收藏' && <StarIcon filled={filter === '收藏'} size={12} />}
            {key}
            <span className="filter-count">{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="prompt-empty">
          <div className="prompt-empty-icon">
            <SearchIcon size={26} />
          </div>
          <p>{prompts.length === 0 ? '还没有提示词' : '没有匹配的提示词'}</p>
          <span>
            {prompts.length === 0 ? '创建第一条提示词，沉淀你的常用指令' : '换个关键词或分类试试'}
          </span>
          {prompts.length === 0 && (
            <button
              type="button"
              className="run-btn"
              onClick={() => setEditing(createPrompt())}
            >
              <PlusIcon />
              新建提示词
            </button>
          )}
        </div>
      ) : (
        <div className="prompt-grid">
          {visible.map((prompt) => (
            <article className="prompt-card" key={prompt.id}>
              <div className="prompt-card-head">
                <span className="prompt-category">{prompt.category}</span>
                <button
                  type="button"
                  className={`star-btn${prompt.favorite ? ' on' : ''}`}
                  onClick={() => toggleFavorite(prompt.id)}
                  title={prompt.favorite ? '取消收藏' : '收藏'}
                  aria-label={prompt.favorite ? '取消收藏' : '收藏'}
                >
                  <StarIcon filled={prompt.favorite} />
                </button>
              </div>
              <h3 className="prompt-title">{prompt.title || '未命名提示词'}</h3>
              <p className="prompt-preview">{prompt.content || '（暂无内容）'}</p>
              {prompt.tags?.length > 0 && (
                <div className="prompt-tags">
                  {prompt.tags.map((tag) => (
                    <span className="prompt-tag" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="prompt-card-foot">
                <span className="prompt-date">{formatDate(prompt.updatedAt)}</span>
                <div className="prompt-actions">
                  <button type="button" onClick={() => copyPrompt(prompt)}>
                    <CopyIcon />
                    复制
                  </button>
                  <button type="button" onClick={() => setEditing(prompt)}>
                    <EditIcon />
                    编辑
                  </button>
                  <button
                    type="button"
                    className={confirmId === prompt.id ? 'danger' : ''}
                    onClick={() => handleDelete(prompt.id)}
                  >
                    <TrashIcon />
                    {confirmId === prompt.id ? '确认删除' : '删除'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <PromptDialog
          key={editing.id}
          prompt={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function PromptDialog({ prompt, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...prompt,
    tagsText: (prompt.tags || []).join(', '),
  }));
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const tags = form.tagsText
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
  const valid = Boolean(form.title.trim() && form.content.trim());

  const submit = (event) => {
    event.preventDefault();
    if (!valid) return;
    onSave({
      ...prompt,
      title: form.title.trim(),
      category: form.category,
      tags,
      content: form.content.trim(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="prompt-dialog" onSubmit={submit}>
        <div className="dialog-head">
          <h3>{prompt.title ? '编辑提示词' : '新建提示词'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </div>
        <div className="dialog-body">
          <div className="field-row">
            <label className="field">
              <span>标题</span>
              <input
                value={form.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="例如：为函数补充单元测试"
                maxLength={60}
              />
            </label>
            <label className="field category-field">
              <span>分类</span>
              <select
                value={form.category}
                onChange={(event) => update({ category: event.target.value })}
              >
                {PROMPT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>
              标签 <em>用逗号分隔，最多 6 个</em>
            </span>
            <input
              value={form.tagsText}
              onChange={(event) => update({ tagsText: event.target.value })}
              placeholder="单元测试, 边界值"
            />
          </label>
          <label className="field content-field">
            <span>提示词内容</span>
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={(event) => update({ content: event.target.value })}
              placeholder="在这里写下你的提示词…"
              spellCheck={false}
            />
          </label>
        </div>
        <div className="dialog-foot">
          <span className="dialog-hint">
            {tags.length > 0 ? `已识别 ${tags.length} 个标签` : ''}
          </span>
          <div className="dialog-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="run-btn" disabled={!valid}>
              保存提示词
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
