const RUN_URL = process.env.REMOTE_RUN_URL || 'https://www.cainiaojc.com/tool/r.php';

export const REMOTE_RUN_TIMEOUT = Number(process.env.REMOTE_RUN_TIMEOUT || 60_000);
export const REMOTE_MAX_CODE_BYTES = 100 * 1024;
export const REMOTE_MAX_STDIN_BYTES = 10 * 1024;

// 与 cainiaojc 在线运行页面提交的 fileext / lan 保持一致
export const REMOTE_LANGUAGES = Object.freeze({
  javascript: { fileext: 'node.html', lan: 'nodejs' },
  typescript: { fileext: 'vb', lan: 'typescript' },
  python: { fileext: 'py', lan: 'python' },
  c: { fileext: 'c', lan: 'c' },
  cpp: { fileext: 'cpp', lan: 'cpp' },
  rust: { fileext: 'rs', lan: 'rust' },
  java: { fileext: 'java', lan: 'java' },
  go: { fileext: 'go', lan: 'go' },
  php: { fileext: 'php', lan: 'php' },
  ruby: { fileext: 'rb', lan: 'ruby' },
});

export function parseRemoteResult(data) {
  const rawOutput = typeof data?.output === 'string' ? data.output : '';
  const rawErrors = data?.errors;
  const stderr =
    typeof rawErrors === 'string' ? rawErrors : rawErrors ? JSON.stringify(rawErrors) : '';

  const status = rawOutput.match(
    /\[(Execution complete|Compilation failed) with exit code (-?\d+)\]\s*$/
  );
  const exitCode = status ? Number(status[2]) : 0;
  const compileFailed = status?.[1] === 'Compilation failed';
  const stdout = (status ? rawOutput.slice(0, status.index) : rawOutput).replace(/\s+$/, '');

  return { stdout, stderr, exitCode, compileFailed };
}

export async function runRemote(language, code, stdin = '', signal = null) {
  const remote = REMOTE_LANGUAGES[language];
  if (!remote) throw new Error('该语言暂不支持云端执行');

  const controller = signal ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), REMOTE_RUN_TIMEOUT) : null;

  try {
    const response = await fetch(RUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Referer: 'https://www.cainiaojc.com/tool/',
        Origin: 'https://www.cainiaojc.com',
      },
      body: new URLSearchParams({
        runcode: '1',
        code: String(code ?? ''),
        fileext: remote.fileext,
        lan: remote.lan,
        stdin: String(stdin ?? ''),
      }),
      signal: signal || controller.signal,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`云端执行服务返回异常（HTTP ${response.status}）`);
    }

    if (!response.ok) {
      throw new Error(data?.errors || `云端执行服务返回 HTTP ${response.status}`);
    }

    return parseRemoteResult(data);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
