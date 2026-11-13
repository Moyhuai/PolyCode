import { snippet } from '@codemirror/autocomplete';

/* 各语言关键字 */
const KEYWORDS = {
  html:
    'html head body title meta link style script main header footer nav section article aside h1 h2 h3 h4 h5 h6 p a img ul ol li button form input label textarea select option table thead tbody tr th td div span video audio canvas svg details summary dialog',
  javascript:
    'const let var function return if else for while do switch case default break continue class extends new this super try catch finally throw typeof instanceof in of delete void async await yield import export from static null undefined true false',
  typescript:
    'const let var function return if else for while do switch case default break continue class extends new this super try catch finally throw typeof instanceof in of delete void async await yield import export from static null undefined true false interface type enum implements readonly private public protected abstract declare namespace as satisfies keyof infer is',
  python:
    'def return if elif else for while in not and or is None True False class import from as with try except finally raise pass break continue lambda yield global nonlocal assert del async await match case',
  c:
    'int float double char void long short unsigned signed const struct typedef enum union static extern return if else for while do switch case default break continue sizeof goto volatile register inline',
  cpp:
    'int float double char void long short unsigned signed const struct typedef enum union static extern return if else for while do switch case default break continue sizeof class public private protected namespace using template typename auto nullptr new delete this virtual override final try catch throw constexpr noexcept',
  rust:
    'fn let mut const static struct enum impl trait pub use mod match if else loop while for in return break continue as ref move where dyn box self Self crate super Some None Ok Err true false unsafe async await',
  java:
    'public private protected class interface extends implements static final abstract void int long double boolean char byte short float if else for while do switch case default break continue return new try catch finally throw throws import package this super null true false enum record instanceof var',
  go:
    'package import func var const type struct interface map chan go defer select range if else for switch case default break continue return nil true false',
  php:
    'echo print if else elseif foreach as for while do switch case default break continue function return class new public private protected static abstract interface extends implements use namespace trait array list isset empty unset die exit require include try catch finally throw match fn global const',
  ruby:
    'def end if elsif else unless while until for in do then return class module require require_relative begin rescue ensure raise yield self nil true false and or not case when',
};

/* 各语言常用内置函数 / 标准库，格式：[名称, 中文说明, 签名] */
const BUILTINS = {
  html: [
    ['class', '元素样式类名', 'class="name"'],
    ['id', '元素唯一标识', 'id="name"'],
    ['style', '行内样式', 'style="color: red"'],
    ['href', '链接地址', 'href="https://example.com"'],
    ['src', '资源地址', 'src="image.png"'],
    ['alt', '图片替代文本', 'alt="描述"'],
    ['type', '元素类型', 'type="text"'],
    ['placeholder', '输入框占位提示', 'placeholder="请输入"'],
    ['value', '表单元素的初始值', 'value="text"'],
    ['data-label', '自定义数据属性', 'data-label="value"'],
    ['aria-label', '无障碍标签', 'aria-label="说明"'],
    ['target', '链接打开方式', 'target="_blank"'],
    ['rel', '链接与页面的关系', 'rel="noopener"'],
  ],
  javascript: [
    ['console.log', '输出到控制台', 'console.log(...values)'],
    ['console.error', '输出错误到控制台', 'console.error(...values)'],
    ['JSON.parse', '把 JSON 字符串解析为对象', 'JSON.parse(text)'],
    ['JSON.stringify', '把对象序列化为 JSON 字符串', 'JSON.stringify(value)'],
    ['Math.floor', '向下取整', 'Math.floor(x)'],
    ['Math.ceil', '向上取整', 'Math.ceil(x)'],
    ['Math.round', '四舍五入', 'Math.round(x)'],
    ['Math.random', '返回 0~1 的随机数', 'Math.random()'],
    ['Math.max', '取最大值', 'Math.max(a, b)'],
    ['Math.min', '取最小值', 'Math.min(a, b)'],
    ['parseInt', '字符串转整数', 'parseInt(text, radix)'],
    ['parseFloat', '字符串转浮点数', 'parseFloat(text)'],
    ['Array.from', '从可迭代对象创建数组', 'Array.from(items)'],
    ['Object.keys', '获取对象所有键', 'Object.keys(obj)'],
    ['Object.values', '获取对象所有值', 'Object.values(obj)'],
    ['setTimeout', '延时执行', 'setTimeout(fn, ms)'],
  ],
  python: [
    ['print', '输出内容到标准输出', 'print(*objects, sep=" ", end="\\n")'],
    ['input', '从标准输入读取一行', 'input(prompt="")'],
    ['len', '返回长度', 'len(obj)'],
    ['range', '生成整数序列', 'range(start, stop, step)'],
    ['int', '转换为整数', 'int(value)'],
    ['float', '转换为浮点数', 'float(value)'],
    ['str', '转换为字符串', 'str(value)'],
    ['list', '创建列表', 'list(iterable)'],
    ['dict', '创建字典', 'dict(**kwargs)'],
    ['set', '创建集合', 'set(iterable)'],
    ['sum', '求和', 'sum(iterable)'],
    ['max', '取最大值', 'max(iterable)'],
    ['min', '取最小值', 'min(iterable)'],
    ['abs', '取绝对值', 'abs(x)'],
    ['round', '四舍五入', 'round(x, ndigits)'],
    ['sorted', '返回排序后的新列表', 'sorted(iterable, reverse=False)'],
    ['enumerate', '同时取出下标与元素', 'enumerate(iterable, start=0)'],
    ['zip', '并行组合多个序列', 'zip(*iterables)'],
    ['open', '打开文件', 'open(file, mode="r")'],
    ['isinstance', '判断对象类型', 'isinstance(obj, cls)'],
  ],
  c: [
    ['printf', '格式化输出到标准输出', 'int printf(const char *format, ...)'],
    ['scanf', '格式化读取标准输入', 'int scanf(const char *format, ...)'],
    ['puts', '输出字符串并换行', 'int puts(const char *s)'],
    ['fgets', '安全地读取一行输入', 'char *fgets(char *s, int size, FILE *stream)'],
    ['malloc', '申请堆内存', 'void *malloc(size_t size)'],
    ['free', '释放堆内存', 'void free(void *ptr)'],
    ['strlen', '字符串长度', 'size_t strlen(const char *s)'],
    ['strcpy', '复制字符串', 'char *strcpy(char *dest, const char *src)'],
    ['strcmp', '比较字符串', 'int strcmp(const char *a, const char *b)'],
    ['memset', '按字节填充内存', 'void *memset(void *s, int c, size_t n)'],
    ['fopen', '打开文件', 'FILE *fopen(const char *path, const char *mode)'],
    ['fclose', '关闭文件', 'int fclose(FILE *stream)'],
    ['sprintf', '格式化到字符串', 'int sprintf(char *buf, const char *format, ...)'],
    ['sqrt', '平方根', 'double sqrt(double x)'],
    ['pow', '幂运算', 'double pow(double base, double exp)'],
    ['exit', '退出程序', 'void exit(int status)'],
  ],
  cpp: [
    ['std::cout', '标准输出流', 'std::cout << value'],
    ['std::cin', '标准输入流', 'std::cin >> value'],
    ['std::cerr', '标准错误流', 'std::cerr << value'],
    ['std::getline', '读取一整行', 'std::getline(std::cin, line)'],
    ['std::endl', '换行并刷新缓冲', 'std::cout << std::endl'],
    ['std::vector', '动态数组', 'std::vector<int> v'],
    ['std::string', '字符串类型', 'std::string s'],
    ['std::map', '有序映射（红黑树）', 'std::map<K, V> m'],
    ['std::unordered_map', '哈希映射', 'std::unordered_map<K, V> m'],
    ['std::set', '有序集合', 'std::set<int> s'],
    ['std::pair', '二元组', 'std::pair<int, int> p'],
    ['std::sort', '排序', 'std::sort(v.begin(), v.end())'],
    ['std::reverse', '反转区间', 'std::reverse(v.begin(), v.end())'],
    ['push_back', '向尾部追加元素', 'v.push_back(value)'],
    ['size', '元素个数', 'v.size()'],
    ['substr', '截取子串', 's.substr(pos, len)'],
    ['std::max', '取最大值', 'std::max(a, b)'],
    ['std::min', '取最小值', 'std::min(a, b)'],
  ],
  rust: [
    ['println!', '打印并换行', 'println!("{}", value)'],
    ['print!', '打印不换行', 'print!("{}", value)'],
    ['format!', '格式化生成字符串', 'format!("{}", value)'],
    ['eprintln!', '打印到标准错误', 'eprintln!("{}", value)'],
    ['Vec::new', '创建动态数组', 'let v: Vec<i32> = Vec::new()'],
    ['vec!', '快速创建数组', 'vec![1, 2, 3]'],
    ['String::new', '创建空字符串', 'let s = String::new()'],
    ['push', '向数组尾部追加', 'v.push(value)'],
    ['push_str', '拼接字符串', 's.push_str("text")'],
    ['len', '长度', 'v.len()'],
    ['iter', '生成迭代器', 'v.iter()'],
    ['collect', '收集为集合', 'iter.collect::<Vec<_>>()'],
    ['unwrap', '取出 Result/Option 的值', 'result.unwrap()'],
    ['expect', '取出值并附带错误信息', 'result.expect("message")'],
    ['stdin', '获取标准输入', 'std::io::stdin()'],
    ['read_line', '读取一行到字符串', 'stdin().read_line(&mut line)'],
  ],
  java: [
    ['System.out.println', '输出并换行', 'System.out.println(value)'],
    ['System.out.print', '输出不换行', 'System.out.print(value)'],
    ['System.out.printf', '格式化输出', 'System.out.printf("%d", value)'],
    ['Scanner', '读取标准输入', 'Scanner sc = new Scanner(System.in)'],
    ['nextLine', '读取一整行', 'sc.nextLine()'],
    ['nextInt', '读取整数', 'sc.nextInt()'],
    ['Math.max', '取最大值', 'Math.max(a, b)'],
    ['Math.min', '取最小值', 'Math.min(a, b)'],
    ['Math.abs', '取绝对值', 'Math.abs(x)'],
    ['Math.sqrt', '平方根', 'Math.sqrt(x)'],
    ['Math.random', '随机数', 'Math.random()'],
    ['Integer.parseInt', '字符串转整数', 'Integer.parseInt(text)'],
    ['String.valueOf', '任意值转字符串', 'String.valueOf(value)'],
    ['String.format', '格式化字符串', 'String.format("%d", value)'],
    ['ArrayList', '动态数组', 'ArrayList<Integer> list = new ArrayList<>()'],
    ['HashMap', '哈希映射', 'HashMap<String, Integer> map = new HashMap<>()'],
    ['Arrays.sort', '数组排序', 'Arrays.sort(arr)'],
    ['length', '数组/字符串长度', 'arr.length'],
  ],
  go: [
    ['fmt.Println', '输出并换行', 'fmt.Println(value)'],
    ['fmt.Printf', '格式化输出', 'fmt.Printf("%d\\n", value)'],
    ['fmt.Scan', '读取标准输入', 'fmt.Scan(&value)'],
    ['fmt.Scanln', '读取一行输入', 'fmt.Scanln(&value)'],
    ['make', '创建 slice/map/chan', 'make([]int, 0)'],
    ['len', '长度', 'len(v)'],
    ['append', '向 slice 追加元素', 'append(v, value)'],
    ['delete', '删除 map 键', 'delete(m, key)'],
    ['strconv.Atoi', '字符串转整数', 'strconv.Atoi(text)'],
    ['strconv.Itoa', '整数转字符串', 'strconv.Itoa(n)'],
    ['strings.Split', '按分隔符切分字符串', 'strings.Split(s, sep)'],
    ['strings.Join', '拼接字符串切片', 'strings.Join(parts, sep)'],
    ['sort.Ints', '整数切片排序', 'sort.Ints(v)'],
    ['time.Now', '获取当前时间', 'time.Now()'],
    ['os.Exit', '退出程序', 'os.Exit(0)'],
  ],
  php: [
    ['var_dump', '打印变量类型与值', 'var_dump($value)'],
    ['print_r', '打印变量的可读形式', 'print_r($value)'],
    ['strlen', '字符串长度', 'strlen($s)'],
    ['substr', '截取子串', 'substr($s, $start, $len)'],
    ['str_replace', '字符串替换', 'str_replace($search, $replace, $s)'],
    ['trim', '去除首尾空白', 'trim($s)'],
    ['strtolower', '转小写', 'strtolower($s)'],
    ['strtoupper', '转大写', 'strtoupper($s)'],
    ['implode', '数组拼接为字符串', 'implode(",", $arr)'],
    ['explode', '字符串切分为数组', 'explode(",", $s)'],
    ['count', '数组元素个数', 'count($arr)'],
    ['array_map', '对数组元素逐个处理', 'array_map($fn, $arr)'],
    ['array_filter', '过滤数组', 'array_filter($arr, $fn)'],
    ['in_array', '判断元素是否存在', 'in_array($needle, $arr)'],
    ['json_encode', '数组转 JSON', 'json_encode($value)'],
    ['json_decode', 'JSON 转数组', 'json_decode($text, true)'],
    ['fgets', '读取一行标准输入', 'trim(fgets(STDIN))'],
    ['sprintf', '格式化字符串', 'sprintf("%d", $value)'],
  ],
  ruby: [
    ['puts', '输出并换行', 'puts value'],
    ['print', '输出不换行', 'print value'],
    ['p', '打印对象调试信息', 'p value'],
    ['gets', '读取一行输入', 'gets'],
    ['chomp', '去掉字符串尾部换行', 'line.chomp'],
    ['each', '遍历集合', 'items.each { |item| }'],
    ['map', '映射生成新数组', 'items.map { |item| }'],
    ['select', '按条件筛选', 'items.select { |item| }'],
    ['reduce', '累积计算', 'items.reduce(0) { |sum, x| }'],
    ['to_i', '转整数', 'value.to_i'],
    ['to_f', '转浮点数', 'value.to_f'],
    ['to_s', '转字符串', 'value.to_s'],
    ['length', '长度', 'value.length'],
    ['push', '追加元素', 'array.push(value)'],
    ['join', '数组拼接', 'items.join(",")'],
    ['split', '字符串切分', 's.split(",")'],
    ['strip', '去除首尾空白', 's.strip'],
    ['rand', '随机数', 'rand(100)'],
  ],
};

/* 关键字对应的常用语法模板，选中后直接生成结构 */
const SNIPPETS = {
  html: {
    div: '<div class="${1}">\n  ${2}\n</div>',
    a: '<a href="${1:https://example.com}">${2:text}</a>',
    img: '<img src="${1:image.png}" alt="${2:描述}" />',
    button: '<button type="button">${1:text}</button>',
    input: '<input type="${1:text}" placeholder="${2}" />',
    span: '<span>${1}</span>',
    p: '<p>${1}</p>',
    ul: '<ul>\n  <li>${1}</li>\n</ul>',
    form: '<form>\n  ${1}\n</form>',
    table: '<table>\n  <tr>\n    <td>${1}</td>\n  </tr>\n</table>',
    script: '<script>\n  ${1}\n</script>',
    style: '<style>\n  ${1}\n</style>',
  },
  javascript: {
    for: 'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n  ${3}\n}',
    function: 'function ${1:name}(${2:params}) {\n  ${3}\n}',
    if: 'if (${1:condition}) {\n  ${2}\n}',
    await: 'const ${1:result} = await ${2:promise};',
    import: "import { ${1:name} } from '${2:module}';",
  },
  typescript: {
    for: 'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n  ${3}\n}',
    function: 'function ${1:name}(${2:params}): ${3:void} {\n  ${4}\n}',
    interface: 'interface ${1:Name} {\n  ${2:key}: ${3:string};\n}',
    type: 'type ${1:Name} = ${2:string};',
    if: 'if (${1:condition}) {\n  ${2}\n}',
  },
  python: {
    for: 'for ${1:item} in ${2:items}:\n    ${3:pass}',
    def: 'def ${1:name}(${2:args}):\n    ${3:pass}',
    if: 'if ${1:condition}:\n    ${2:pass}',
    class: 'class ${1:Name}:\n    def __init__(self${2:, value}):\n        ${3:pass}',
    input: 'input("${1:提示文字}")',
    match: 'match ${1:value}:\n    case ${2:pattern}:\n        ${3:pass}',
  },
  c: {
    for: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}',
    printf: 'printf("${1:%d\\n}", ${2:value});',
    scanf: 'scanf("${1:%d}", &${2:value});',
    while: 'while (${1:condition}) {\n    ${2}\n}',
    return: 'return ${1:0};',
  },
  cpp: {
    for: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n    ${3}\n}',
    while: 'while (${1:condition}) {\n    ${2}\n}',
    return: 'return ${1:0};',
    class: 'class ${1:Name} {\npublic:\n    ${1:Name}() {}\n\nprivate:\n    ${2}\n};',
    include: '#include <${1:iostream}>',
  },
  rust: {
    fn: 'fn ${1:name}(${2:args}) {\n    ${3}\n}',
    for: 'for ${1:item} in ${2:items} {\n    ${3}\n}',
    match: 'match ${1:value} {\n    ${2:pattern} => ${3:expr},\n    _ => ${4:expr},\n}',
    if: 'if ${1:condition} {\n    ${2}\n}',
    impl: 'impl ${1:Name} {\n    fn ${2:new}() -> Self {\n        ${3}\n    }\n}',
  },
  java: {
    for: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}',
    if: 'if (${1:condition}) {\n    ${2}\n}',
    while: 'while (${1:condition}) {\n    ${2}\n}',
    class: 'public class ${1:Main} {\n    public static void main(String[] args) {\n        ${2}\n    }\n}',
    return: 'return ${1:value};',
  },
  go: {
    for: 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t${3}\n}',
    range: 'for ${1:i}, ${2:v} := range ${3:items} {\n\t${4}\n}',
    if: 'if ${1:condition} {\n\t${2}\n}',
    struct: 'type ${1:Name} struct {\n\t${2:Field} ${3:string}\n}',
    func: 'func ${1:name}(${2:args}) ${3} {\n\t${4}\n}',
  },
  php: {
    foreach: 'foreach (${1:$items} as ${2:$item}) {\n    ${3}\n}',
    function: 'function ${1:name}(${2:$args}) {\n    ${3}\n}',
    if: 'if (${1:$condition}) {\n    ${2}\n}',
    for: 'for (${1:$i} = 0; ${1:$i} < ${2:$n}; ${1:$i}++) {\n    ${3}\n}',
    while: 'while (${1:$condition}) {\n    ${2}\n}',
  },
  ruby: {
    def: 'def ${1:name}(${2:args})\n  ${3}\nend',
    each: '${1:items}.each do |${2:item}|\n  ${3}\nend',
    if: 'if ${1:condition}\n  ${2}\nend',
    class: 'class ${1:Name}\n  def initialize(${2:args})\n    ${3}\n  end\nend',
    until: 'until ${1:condition}\n  ${2}\nend',
  },
};

/* 不覆盖关键字的额外片段 */
const EXTRA_SNIPPETS = {
  html: [
    {
      label: 'page',
      detail: 'HTML5 页面骨架',
      apply:
        '<!doctype html>\n<html lang="zh-CN">\n  <head>\n    <meta charset="utf-8" />\n    <title>${1:标题}</title>\n  </head>\n  <body>\n    ${2}\n  </body>\n</html>',
    },
    { label: 'css', detail: '样式规则', apply: '.${1:selector} {\n  ${2:property}: ${3:value};\n}' },
    { label: 'inline', detail: '内联脚本', apply: '<script>\n  ${1}\n</script>' },
  ],
  javascript: [
    { label: 'log', detail: '打印输出', apply: 'console.log(${1:value});' },
    { label: 'arrow', detail: '箭头函数', apply: 'const ${1:name} = (${2:params}) => {\n  ${3}\n};' },
    { label: 'readline', detail: '读取标准输入', apply: "const rl = require('node:readline').createInterface({ input: process.stdin, output: process.stdout });" },
  ],
  python: [
    { label: 'print', detail: '打印输出', apply: 'print(${1:value})' },
    { label: 'main', detail: '主函数入口', apply: "if __name__ == '__main__':\n    main()" },
    { label: 'try', detail: '异常处理', apply: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:print(e)}' },
  ],
  c: [
    { label: 'main', detail: '程序入口', apply: 'int main(void) {\n    ${1}\n    return 0;\n}' },
    { label: 'include', detail: '引入头文件', apply: '#include <${1:stdio.h}>' },
  ],
  cpp: [
    { label: 'main', detail: '程序入口', apply: 'int main() {\n    ${1}\n    return 0;\n}' },
    { label: 'cout', detail: '输出到控制台', apply: 'std::cout << ${1:value} << std::endl;' },
    { label: 'cin', detail: '读取标准输入', apply: 'std::cin >> ${1:value};' },
  ],
  java: [
    { label: 'sout', detail: '打印输出', apply: 'System.out.println(${1:value});' },
    { label: 'main', detail: '主方法', apply: 'public static void main(String[] args) {\n    ${1}\n}' },
    { label: 'scanner', detail: '读取标准输入', apply: 'Scanner ${1:sc} = new Scanner(System.in);' },
  ],
  rust: [
    { label: 'main', detail: '程序入口', apply: 'fn main() {\n    ${1}\n}' },
    { label: 'let', detail: '声明变量', apply: 'let ${1:name} = ${2:value};' },
    { label: 'mut', detail: '声明可变变量', apply: 'let mut ${1:name} = ${2:value};' },
  ],
  go: [
    { label: 'main', detail: '程序入口', apply: 'func main() {\n\t${1}\n}' },
    { label: 'scan', detail: '读取标准输入', apply: 'fmt.Scan(&${1:value})' },
    { label: 'sprint', detail: '格式化输出', apply: 'fmt.Printf("${1:%v}\\n", ${2:value})' },
  ],
  php: [
    { label: 'pr', detail: '输出调试信息', apply: 'print_r(${1:$value});' },
    { label: 'stdin', detail: '读取标准输入', apply: '$line = trim(fgets(STDIN));' },
    { label: 'foreach', detail: '遍历数组', apply: 'foreach (${1:$items} as ${2:$key} => ${3:$value}) {\n    ${4}\n}' },
  ],
  ruby: [
    { label: 'getsline', detail: '读取标准输入', apply: '${1:input} = gets.chomp' },
    { label: 'map', detail: '映射生成新数组', apply: '${1:items}.map { |${2:item}| ${3:item} }' },
  ],
};

function keywordOptions(languageId) {
  const keywords = (KEYWORDS[languageId] || '').split(/\s+/).filter(Boolean);
  const templates = SNIPPETS[languageId] || {};
  return keywords.map((label) => {
    const template = templates[label];
    return template
      ? { label, type: 'keyword', detail: '语法模板', apply: snippet(template) }
      : { label, type: 'keyword', detail: '关键字' };
  });
}

function builtinOptions(languageId) {
  return (BUILTINS[languageId] || []).map(([label, info, detail]) => ({
    label,
    type: 'function',
    detail,
    info,
  }));
}

function extraOptions(languageId) {
  return (EXTRA_SNIPPETS[languageId] || []).map((item) => ({
    label: item.label,
    type: 'text',
    detail: item.detail,
    apply: snippet(item.apply),
  }));
}

function completionOptions(languageId) {
  return [...keywordOptions(languageId), ...builtinOptions(languageId), ...extraOptions(languageId)];
}

export function buildCompletionSource(languageId) {
  // TypeScript 复用 JavaScript 的内置函数与片段
  const source =
    languageId === 'typescript'
      ? [...keywordOptions('typescript'), ...builtinOptions('javascript'), ...extraOptions('javascript')]
      : completionOptions(languageId);

  if (source.length === 0) return null;

  return (context) => {
    const word = context.matchBefore(/[\w$]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { from: word.from, options: source, validFor: /^[\w$]*$/ };
  };
}
