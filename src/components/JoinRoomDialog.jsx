import { useEffect, useState } from 'react';
import { parseRoomInput } from '../lib/share';
import { CloseIcon, ShareIcon } from './icons';

export default function JoinRoomDialog({ open, onClose, onJoin }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setValue('');
    setError('');
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const room = parseRoomInput(value);
    if (!room) {
      setError('请输入 5 位房间号（字母或数字），或粘贴共享链接');
      return;
    }
    setError('');
    onJoin(room);
  };

  return (
    <div
      className="share-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="share-modal join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
        <header className="share-head">
          <div className="share-heading">
            <span className="share-icon">
              <ShareIcon />
            </span>
            <div>
              <h2 id="join-title">加入房间</h2>
              <p>输入对方提供的 5 位房间号，或粘贴共享链接。</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </header>

        <form className="share-field" onSubmit={submit}>
          <span className="share-label">房间号</span>
          <div className="share-link-row">
            <input
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError('');
              }}
              placeholder="例如 zh8pq，或粘贴共享链接"
              spellCheck={false}
              aria-label="房间号"
            />
            <button type="submit" className="run-btn share-copy">
              加入
            </button>
          </div>
          {error ? <p className="share-error">{error}</p> : null}
        </form>

        <p className="share-hint">加入后将以只读方式查看对方的代码，可一键复制。</p>
      </section>
    </div>
  );
}
