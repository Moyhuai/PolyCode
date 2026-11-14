import { useCallback, useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';
import { buildShareLink, copyText, describeShareError } from '../lib/share';
import { CloseIcon, ShareIcon } from './icons';

export default function LiveShare({
  open,
  role,
  roomId,
  code,
  language,
  onClose,
  onStop,
  onExit,
}) {
  const isHost = role === 'host';
  const [status, setStatus] = useState('connecting');
  const [viewers, setViewers] = useState(0);
  const [remoteCode, setRemoteCode] = useState('');
  const [remoteLanguage, setRemoteLanguage] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [copyState, setCopyState] = useState('');
  const peerRef = useRef(null);
  const connsRef = useRef([]);
  const codeRef = useRef(code);

  codeRef.current = code;

  // 建立连接：房主创建房间，访客加入房间
  useEffect(() => {
    if (!roomId) return undefined;

    setStatus('connecting');
    setError('');
    setViewers(0);
    connsRef.current = [];

    let disposed = false;
    let peer = null;

    // 延迟创建，避开 StrictMode 下开发环境的重复挂载
    const timer = window.setTimeout(() => {
      if (disposed) return;

      peer = isHost ? new Peer(roomId) : new Peer();
      peerRef.current = peer;

      if (isHost) {
        const refreshViewers = () => {
          const count = connsRef.current.filter((item) => item.open).length;
          setViewers(count);
          setStatus(count > 0 ? 'connected' : 'waiting');
        };

        peer.on('open', refreshViewers);
        peer.on('connection', (conn) => {
          connsRef.current = [...connsRef.current, conn];
          conn.on('open', () => {
            conn.send({ type: 'code', code: codeRef.current, language: language.name });
            refreshViewers();
          });
          const drop = () => {
            connsRef.current = connsRef.current.filter((item) => item !== conn);
            refreshViewers();
          };
          conn.on('close', drop);
          conn.on('error', drop);
        });
      } else {
        peer.on('open', () => {
          if (disposed) return;
          const conn = peer.connect(roomId, { reliable: true });
          conn.on('open', () => setStatus('connected'));
          conn.on('data', (data) => {
            if (!data || data.type !== 'code') return;
            if (typeof data.code === 'string') setRemoteCode(data.code);
            if (typeof data.language === 'string') setRemoteLanguage(data.language);
          });
          conn.on('close', () => setStatus('closed'));
          conn.on('error', (err) => {
            setStatus('error');
            setError(describeShareError(err));
          });
        });
      }

      peer.on('disconnected', () => {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on('error', (err) => {
        setStatus('error');
        setError(describeShareError(err));
      });
    }, 60);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (peer) peer.destroy();
      peerRef.current = null;
      connsRef.current = [];
    };
  }, [isHost, roomId, language.name, attempt]);

  // 房主代码变化时同步给所有访客
  useEffect(() => {
    if (!isHost) return undefined;
    const timer = window.setTimeout(() => {
      connsRef.current.forEach((conn) => {
        if (conn.open) conn.send({ type: 'code', code, language: language.name });
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [code, isHost, language.name]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const copy = useCallback(async (text, key) => {
    const ok = await copyText(text);
    setCopyState(ok ? `${key}:ok` : `${key}:fail`);
    window.setTimeout(() => setCopyState(''), 1800);
  }, []);

  if (!open) return null;

  const link = buildShareLink(roomId, language.id);
  let statusText = '正在准备…';
  if (status === 'error') {
    statusText = error;
  } else if (isHost) {
    statusText =
      {
        connecting: '正在创建房间…',
        waiting: '等待对方加入…',
        connected: `${viewers} 人正在查看`,
        closed: '共享已停止',
      }[status] || statusText;
  } else {
    statusText =
      {
        connecting: '正在连接房间…',
        connected: '已连接，代码实时同步',
        closed: '连接已断开，可重新连接',
      }[status] || statusText;
  }

  const hostLinkState = copyState === 'link:ok' ? '已复制' : copyState === 'link:fail' ? '复制失败' : '复制链接';
  const guestCodeState = copyState === 'code:ok' ? '已复制' : copyState === 'code:fail' ? '复制失败' : '复制代码';

  return (
    <div
      className="share-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <header className="share-head">
          <div className="share-heading">
            <span className="share-icon">
              <ShareIcon />
            </span>
            <div>
              <h2 id="share-title">{isHost ? '共享代码' : '查看共享代码'}</h2>
              <p>
                {isHost
                  ? '对方打开链接即可实时查看并复制你的代码，无法修改。'
                  : '对方更新代码后会实时同步到这里。'}
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </header>

        <div className={`share-status ${status}`}>
          <span className="status-dot" />
          <span>{statusText}</span>
          {!isHost && remoteLanguage ? <span className="chip">{remoteLanguage}</span> : null}
        </div>

        {isHost ? (
          <>
            <div className="share-field">
              <span className="share-label">房间号</span>
              <code className="share-room">{roomId}</code>
            </div>

            <div className="share-field">
              <span className="share-label">共享链接</span>
              <div className="share-link-row">
                <input readOnly value={link} onFocus={(event) => event.target.select()} aria-label="共享链接" />
                <button type="button" className="run-btn share-copy" onClick={() => copy(link, 'link')}>
                  {hostLinkState}
                </button>
              </div>
            </div>

            <p className="share-hint">任何拿到链接的人都能查看代码，请勿共享密码、密钥等敏感内容。</p>

            <div className="share-actions">
              <button type="button" className="ghost-btn" onClick={onClose}>
                收起窗口
              </button>
              <button type="button" className="stop-btn" onClick={onStop}>
                停止共享
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="share-code-wrap">
              {remoteCode ? (
                <pre className="share-code">
                  <code>{remoteCode}</code>
                </pre>
              ) : (
                <div className="share-empty">
                  {status === 'error' || status === 'closed' ? '暂时无法获取对方的代码' : '等待对方发送代码…'}
                </div>
              )}
            </div>

            <div className="share-actions">
              {status === 'error' || status === 'closed' ? (
                <button type="button" className="ghost-btn" onClick={() => setAttempt((value) => value + 1)}>
                  重新连接
                </button>
              ) : null}
              <button type="button" className="ghost-btn" onClick={onExit}>
                退出共享
              </button>
              <button
                type="button"
                className="run-btn"
                onClick={() => copy(remoteCode, 'code')}
                disabled={!remoteCode}
              >
                {guestCodeState}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
