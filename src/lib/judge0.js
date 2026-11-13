// 浏览器直连云端执行服务
// 统一使用 base64 传输，避免各语言运行时输出非 UTF-8 字符导致接口报错
// 接口地址与请求参数经过伪加密/混淆处理，返回结构对齐菜鸟工具：{ output, errors }

import { buildExecutionUrl, createSignature } from './armor';

const JUDGE0_TIMEOUT = 65_000;

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(text) {
  if (!text) return '';
  const binary = atob(text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export async function runOnJudge0({ language, source, stdin = '', signal }) {
  if (!language?.judge0Id) throw new Error('该语言暂不支持云端执行');

  const controller = signal ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), JUDGE0_TIMEOUT) : null;
  const started = Date.now();

  try {
    const payload = JSON.stringify({
      source_code: encodeBase64(source),
      language_id: language.judge0Id,
      stdin: encodeBase64(stdin),
    });

    const response = await fetch(buildExecutionUrl(createSignature(payload)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: signal || controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      /* 非 JSON 响应，统一按错误处理 */
    }

    if (!response.ok || !data) {
      if (response.status === 429) {
        throw new Error('公共执行服务请求过于频繁，请稍后再试');
      }
      throw new Error(data?.message || data?.error || `执行服务返回 HTTP ${response.status}`);
    }

    const statusId = data.status?.id ?? null;
    const errors = [
      decodeBase64(data.compile_output),
      decodeBase64(data.stderr),
      decodeBase64(data.message),
    ]
      .filter((part) => part.trim())
      .join('\n');

    return {
      output: decodeBase64(data.stdout),
      errors,
      status: data.status?.description || '未知状态',
      exitCode: data.exit_code ?? (statusId === 3 ? 0 : 1),
      compileFailed: statusId === 6,
      timedOut: statusId === 5,
      time: data.time ? Number(data.time) : null,
      memory: typeof data.memory === 'number' ? data.memory : null,
      durationMs: Date.now() - started,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
