// 纯静态部署（如 GitHub Pages）没有后端服务时，浏览器直连 Judge0 公共执行 API
const JUDGE0_ENDPOINT = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
const JUDGE0_TIMEOUT = 60_000;

const JUDGE0_LANGUAGES = {
  javascript: { id: 102, version: 'Node.js 22' },
  typescript: { id: 101, version: 'TypeScript 5.6' },
  python: { id: 100, version: 'Python 3.12' },
  c: { id: 103, version: 'GCC 14' },
  cpp: { id: 105, version: 'GCC 14' },
  rust: { id: 108, version: 'Rust 1.85' },
  java: { id: 62, version: 'OpenJDK 13' },
  go: { id: 107, version: 'Go 1.23' },
  php: { id: 98, version: 'PHP 8.3' },
  ruby: { id: 72, version: 'Ruby 2.7' },
};

// 无后端时使用的语言目录，available 表示能否通过 Judge0 执行
export const JUDGE0_CATALOG = [
  { id: 'html', name: 'HTML', monogram: 'HTML', color: '#e34f26', fileName: 'index.html', preview: true, available: true, version: '浏览器预览', reason: null },
  { id: 'javascript', name: 'JavaScript', monogram: 'JS', color: '#f7df1e', fileName: 'main.js', preview: false, available: true, version: JUDGE0_LANGUAGES.javascript.version, reason: null },
  { id: 'typescript', name: 'TypeScript', monogram: 'TS', color: '#3178c6', fileName: 'main.ts', preview: false, available: true, version: JUDGE0_LANGUAGES.typescript.version, reason: null },
  { id: 'python', name: 'Python', monogram: 'PY', color: '#3776ab', fileName: 'main.py', preview: false, available: true, version: JUDGE0_LANGUAGES.python.version, reason: null },
  { id: 'c', name: 'C', monogram: 'C', color: '#5c6bc0', fileName: 'main.c', preview: false, available: true, version: JUDGE0_LANGUAGES.c.version, reason: null },
  { id: 'cpp', name: 'C++', monogram: 'C++', color: '#00599c', fileName: 'main.cpp', preview: false, available: true, version: JUDGE0_LANGUAGES.cpp.version, reason: null },
  { id: 'rust', name: 'Rust', monogram: 'RS', color: '#dea584', fileName: 'main.rs', preview: false, available: true, version: JUDGE0_LANGUAGES.rust.version, reason: null },
  { id: 'java', name: 'Java', monogram: 'JV', color: '#e76f00', fileName: 'Main.java', preview: false, available: true, version: JUDGE0_LANGUAGES.java.version, reason: null },
  { id: 'go', name: 'Go', monogram: 'GO', color: '#00add8', fileName: 'main.go', preview: false, available: true, version: JUDGE0_LANGUAGES.go.version, reason: null },
  { id: 'php', name: 'PHP', monogram: 'PHP', color: '#777bb4', fileName: 'main.php', preview: false, available: true, version: JUDGE0_LANGUAGES.php.version, reason: null },
  { id: 'ruby', name: 'Ruby', monogram: 'RB', color: '#cc342d', fileName: 'main.rb', preview: false, available: true, version: JUDGE0_LANGUAGES.ruby.version, reason: null },
];

export async function runOnJudge0(languageId, code, stdin = '', signal = null) {
  const language = JUDGE0_LANGUAGES[languageId];
  if (!language) throw new Error('该语言暂不支持云端执行');

  const controller = signal ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort(), JUDGE0_TIMEOUT) : null;
  const started = Date.now();

  try {
    const response = await fetch(JUDGE0_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: String(code ?? ''),
        language_id: language.id,
        stdin: String(stdin ?? ''),
      }),
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
      throw new Error(data?.message || `公共执行服务返回 HTTP ${response.status}`);
    }

    const statusId = data.status?.id;
    const stderr = [data.stderr, data.compile_output, data.message]
      .filter((part) => typeof part === 'string' && part.trim())
      .join('\n');

    return {
      stdout: data.stdout || '',
      stderr,
      // Judge0 状态 3 = Accepted，6 = 编译错误，5 = 超时
      exitCode: statusId === 3 ? 0 : data.exit_code ?? 1,
      compileFailed: statusId === 6,
      timedOut: statusId === 5,
      durationMs: Date.now() - started,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
