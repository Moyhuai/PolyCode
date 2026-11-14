import { toolHref } from './router';

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{6,40}$/;
const ROOM_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

// 生成带前缀的随机房间号，避免与 PeerJS 上其他用户冲突
export function createRoomId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let id = '';
  bytes.forEach((byte) => {
    id += ROOM_ALPHABET[byte % ROOM_ALPHABET.length];
  });
  return `pc-${id}`;
}

export function isRoomId(value) {
  return typeof value === 'string' && ROOM_PATTERN.test(value);
}

export function readRoomFromUrl() {
  try {
    const room = new URLSearchParams(window.location.search).get('room');
    return isRoomId(room) ? room : null;
  } catch {
    return null;
  }
}

export function removeRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function buildShareLink(roomId, languageId) {
  const url = new URL(toolHref(languageId), window.location.origin);
  url.searchParams.set('room', roomId);
  return url.toString();
}

export function describeShareError(error) {
  switch (error?.type) {
    case 'peer-unavailable':
      return '房间不存在，或对方已停止共享';
    case 'unavailable-id':
      return '房间号被占用，请关闭后重新创建';
    case 'network':
      return '网络连接失败，请检查网络后重试';
    case 'server-error':
      return '信令服务器暂时不可用，请稍后重试';
    case 'browser-incompatible':
      return '当前浏览器不支持实时共享';
    default:
      return error?.message || '连接失败，请稍后重试';
  }
}

export async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
