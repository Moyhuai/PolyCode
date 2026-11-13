const STORAGE_KEY = 'polycode.prompts.v1';
const DAY = 86_400_000;
const SEED_BASE = Date.now();

export const PROMPT_CATEGORIES = ['代码生成', '调试排查', '重构优化', '学习解释', '文档写作'];

export const DEFAULT_PROMPTS = [
  {
    id: 'seed-unit-test',
    title: '为函数补充单元测试',
    category: '代码生成',
    tags: ['单元测试', '边界值'],
    favorite: true,
    updatedAt: SEED_BASE - DAY,
    content: `你是一名资深测试工程师。请阅读下面的函数，并为它编写单元测试：
1. 覆盖正常路径、边界值和异常输入；
2. 使用项目已有的测试框架与断言风格；
3. 每个用例用一句话说明测试意图；
4. 不要修改被测代码。

函数代码：
`,
  },
  {
    id: 'seed-debug-runtime',
    title: '定位并修复运行时错误',
    category: '调试排查',
    tags: ['报错', '根因分析'],
    favorite: false,
    updatedAt: SEED_BASE - 2 * DAY,
    content: `我在运行程序时遇到下面的错误，请帮我定位根因并给出最小修复：

【错误信息】
【相关代码】
【运行环境】
【已尝试的方法】

要求：
1. 先解释错误产生的机制，再给出修复方案；
2. 指出可能被忽略的边界情况；
3. 如果需要更多信息，先列出需要确认的问题。
`,
  },
  {
    id: 'seed-explain-code',
    title: '逐行解释陌生代码',
    category: '学习解释',
    tags: ['代码阅读', '入门'],
    favorite: false,
    updatedAt: SEED_BASE - 3 * DAY,
    content: `请以教学口吻解释下面这段代码：
1. 先用三句话概括整体作用；
2. 再按逻辑分块说明关键步骤；
3. 标出容易出错的语法或设计点；
4. 最后给一个可以动手修改的小练习。

代码：
`,
  },
  {
    id: 'seed-refactor',
    title: '重构为更易读的实现',
    category: '重构优化',
    tags: ['可读性', '重构'],
    favorite: true,
    updatedAt: SEED_BASE - 4 * DAY,
    content: `请在不改变外部行为的前提下重构下面的代码：
1. 消除重复逻辑，控制函数长度；
2. 使用更清晰的命名与数据流；
3. 保留原有错误处理语义；
4. 给出重构前后的关键差异说明和风险点。

代码：
`,
  },
  {
    id: 'seed-rest-api',
    title: '生成 REST API 实现',
    category: '代码生成',
    tags: ['API', '后端'],
    favorite: false,
    updatedAt: SEED_BASE - 5 * DAY,
    content: `请按下面的需求实现一组 REST API：
- 资源：
- 需要的接口与方法：
- 技术栈：
- 鉴权方式：

要求：
1. 给出路由、参数校验、错误码约定；
2. 数据访问层与业务逻辑分离；
3. 提供请求/响应示例；
4. 补充关键路径的测试用例。
`,
  },
  {
    id: 'seed-slow-query',
    title: '优化慢查询与索引',
    category: '重构优化',
    tags: ['SQL', '性能'],
    favorite: false,
    updatedAt: SEED_BASE - 6 * DAY,
    content: `下面的查询在生产环境很慢，请帮我优化：
【表结构与索引】
【SQL 语句】
【数据量级】
【执行计划】

请输出：
1. 慢的原因分析（扫描行数、回表、排序等）；
2. 改写后的 SQL 与建议新增的索引；
3. 预估收益与潜在副作用。
`,
  },
  {
    id: 'seed-api-doc',
    title: '生成接口文档',
    category: '文档写作',
    tags: ['文档', '接口'],
    favorite: false,
    updatedAt: SEED_BASE - 7 * DAY,
    content: `请根据下面的代码生成接口文档，包含：
1. 接口地址、请求方法与用途；
2. 请求参数表（名称、类型、必填、说明）；
3. 响应结构与字段说明；
4. 错误码与示例；
5. 一段 curl 调用示例。

代码或接口定义：
`,
  },
  {
    id: 'seed-debug-plan',
    title: '制定分步调试计划',
    category: '调试排查',
    tags: ['调试', '方法论'],
    favorite: false,
    updatedAt: SEED_BASE - 8 * DAY,
    content: `我遇到一个难以复现的问题，请帮我制定调试计划：
【现象】
【复现步骤】
【日志与线索】

要求按「假设 → 验证手段 → 预期结果」的形式列出 3～5 个可执行的排查步骤，
并标注每一步的优先级和需要采集的运行时证据。
`,
  },
];

export function loadPrompts() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* 忽略损坏的本地数据 */
  }
  return DEFAULT_PROMPTS;
}

export function savePrompts(prompts) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch {
    /* 忽略存储异常 */
  }
}

export function createPrompt() {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    category: PROMPT_CATEGORIES[0],
    tags: [],
    content: '',
    favorite: false,
    updatedAt: Date.now(),
  };
}
