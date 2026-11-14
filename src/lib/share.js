import { toolHref } from './router';

const ROOM_PATTERN = /^[a-z0-9]{5}$/;
const ROOM_LETTERS = 'abcdefghjkmnpqrstuvwxyz';
const ROOM_DIGITS = '23456789';
const ROOM_ALPHABET = ROOM_LETTERS + ROOM_DIGITS;

// 生成 5 位字母数字房间号，避免易混淆字符
export function createRoomId() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]);
  // 保证房间号同时包含字母和数字
  if (!chars.some((char) => ROOM_LETTERS.includes(char))) {
    chars[0] = ROOM_LETTERS[bytes[0] % ROOM_LETTERS.length];
  }
  if (!chars.some((char) => ROOM_DIGITS.includes(char))) {
    chars[1] = ROOM_DIGITS[bytes[1] % ROOM_DIGITS.length];
  }
  return chars.join('');
}

export function isRoomId(value) {
  return typeof value === 'string' && ROOM_PATTERN.test(value);
}

export function readRoomFromUrl() {
  try {
    const room = new URLSearchParams(window.location.search).get('room')?.trim().toLowerCase();
    return isRoomId(room) ? room : null;
  } catch {
    return null;
  }
}

// 支持直接输入房间号，或粘贴完整的共享链接
export function parseRoomInput(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (isRoomId(text)) return text;
  try {
    const url = new URL(text, window.location.origin);
    const room = url.searchParams.get('room')?.trim().toLowerCase();
    return isRoomId(room) ? room : null;
  } catch {
    return null;
  }
}

export function setRoomInUrl(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function removeRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

// ICE 服务器：STUN 用于发现公网地址，TURN 在双方无法直连时中继
export const PEER_OPTIONS = {
  config: {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'stun:stun.qq.com:3478' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  },
};

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
