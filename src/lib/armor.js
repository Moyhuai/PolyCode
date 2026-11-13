// 伪加密 / 反爬混淆层
// 注意：这是纯前端的“障眼法”，只能提高脚本直接复制接口与本地数据的成本，
// 不能替代服务端鉴权，也不构成真正的安全边界。

const SALT = 0x5f3a;
const KEY_STREAM = [0x37, 0x6d, 0x8b, 0xff, 0x2e, 0xe6, 0xc8, 0x19];
const MAGIC = 0xa7;
const HEADER = 'PC1.';

function rotate8(value, shift) {
  return ((value << shift) | (value >>> (8 - shift))) & 0xff;
}

function toBase64(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function fromBase64(payload) {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function fakeEncrypt(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  const sealed = new Uint8Array(bytes.length + 1);
  sealed[0] = MAGIC;
  let state = SALT & 0xff;
  for (let index = 0; index < bytes.length; index += 1) {
    state = rotate8((state + KEY_STREAM[index % KEY_STREAM.length] + index) & 0xff, 3);
    sealed[index + 1] = bytes[index] ^ state;
  }
  return HEADER + toBase64(sealed);
}

export function fakeDecrypt(payload) {
  if (typeof payload !== 'string' || !payload.startsWith(HEADER)) {
    throw new Error('无效的载荷');
  }
  const sealed = fromBase64(payload.slice(HEADER.length));
  if (sealed[0] !== MAGIC) {
    throw new Error('载荷校验失败');
  }
  const output = new Uint8Array(sealed.length - 1);
  let state = SALT & 0xff;
  for (let index = 0; index < output.length; index += 1) {
    state = rotate8((state + KEY_STREAM[index % KEY_STREAM.length] + index) & 0xff, 3);
    output[index] = sealed[index + 1] ^ state;
  }
  return new TextDecoder().decode(output);
}

function reverse(value) {
  return Array.from(value).reverse().join('');
}

// 执行接口地址拆散倒序存放，避免被简单正则直接命中
const ORIGIN = reverse('moc.0egduj.ec//:sptth');
const PATH = reverse('snoissimbus/');

// 伪签名：让请求看起来像带有时间戳与签名的私有接口
export function createSignature(text) {
  const sealed = fakeEncrypt(text);
  let hash = 0x811c9dc5;
  for (let index = 0; index < sealed.length; index += 1) {
    hash ^= sealed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const ts = Date.now().toString(36);
  const nonce = Math.random().toString(36).slice(2, 10);
  const sig = (hash ^ parseInt(ts, 36) ^ SALT).toString(36);
  return { ts, nonce, sig };
}

export function buildExecutionUrl(signature) {
  const url = new URL(`${ORIGIN}${PATH}`);
  url.searchParams.set('base64_encoded', 'true');
  url.searchParams.set('wait', 'true');
  url.searchParams.set('pc_ts', signature.ts);
  url.searchParams.set('pc_nonce', signature.nonce);
  url.searchParams.set('pc_sig', signature.sig);
  return url.toString();
}
