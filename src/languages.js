export const SNIPPETS = {
  html: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PolyCode · HTML 预览</title>
    <style>
      * {
        box-sizing: border-box;
      }
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at 30% 20%, #1b2a5a, #05070f 70%);
        color: #e9eefc;
        font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
      }
      .card {
        width: min(420px, 86vw);
        padding: 28px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(140, 170, 255, 0.22);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        text-align: center;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 22px;
      }
      p {
        margin: 0 0 18px;
        font-size: 14px;
        color: #a9b6d6;
        line-height: 1.7;
      }
      button {
        padding: 10px 22px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(100deg, #6d8bff, #2ee6c8);
        color: #06101f;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>你好，PolyCode</h1>
      <p>这是直接由浏览器渲染的 HTML 页面，<br />修改代码后点击「运行代码」即可刷新预览。</p>
      <button id="btn">点我 +1</button>
      <p>点击次数：<span id="count">0</span></p>
    </main>

    <script>
      let count = 0;
      const output = document.getElementById('count');
      document.getElementById('btn').addEventListener('click', () => {
        count += 1;
        output.textContent = count;
      });
    </script>
  </body>
</html>
`,

  javascript: `// 点击「运行代码」或按 Ctrl / Cmd + Enter
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

const values = Array.from({ length: 12 }, (_, i) => fib(i));
console.log('斐波那契数列：');
console.log(values.join('  '));

const squares = values
  .filter((x) => x % 2 === 0)
  .map((x) => x * x);

console.log('其中偶数的平方：', squares.join(', '));
`,

  typescript: `interface Point {
  x: number;
  y: number;
}

const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const points: Point[] = [
  { x: 0, y: 0 },
  { x: 3, y: 4 },
  { x: 8, y: 6 },
];

points.slice(1).forEach((point, index) => {
  console.log(\`距离 \${index + 1}：\${distance(points[0], point).toFixed(2)}\`);
});
`,

  python: `from collections import Counter

text = "the quick brown fox jumps over the lazy dog"
counts = Counter(text.replace(" ", ""))

print("字符出现频率 Top 6：")
for char, times in counts.most_common(6):
    bar = "█" * times
    print(f"  {char}  {bar} {times}")

print("\\n最长单词：", max(text.split(), key=len))
`,

  c: `#include <stdio.h>

int is_prime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

int main(void) {
    int found = 0;
    printf("前 10 个质数：");
    for (int n = 2; found < 10; n++) {
        if (is_prime(n)) {
            printf("%d ", n);
            found++;
        }
    }
    printf("\\n");
    return 0;
}
`,

  cpp: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums{42, 7, 19, 88, 3, 56, 21};

    std::sort(nums.begin(), nums.end());

    std::cout << "升序排列：";
    for (int n : nums) std::cout << n << ' ';
    std::cout << "\\n最大值：" << nums.back() << std::endl;

    return 0;
}
`,

  rust: `fn is_prime(n: u64) -> bool {
    n >= 2 && (2..=((n as f64).sqrt() as u64)).all(|d| n % d != 0)
}

fn main() {
    let primes: Vec<u64> = (2..)
        .filter(|n| is_prime(*n))
        .take(10)
        .collect();

    println!("前 10 个质数：{:?}", primes);
    println!("它们的和：{}", primes.iter().sum::<u64>());
}
`,

  java: `public class Main {
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        StringBuilder result = new StringBuilder();
        int found = 0;
        for (int n = 2; found < 10; n++) {
            if (isPrime(n)) {
                result.append(n).append(' ');
                found++;
            }
        }
        System.out.println("前 10 个质数：" + result);
    }
}
`,

  go: `package main

import (
	"fmt"
	"strings"
)

func main() {
	languages := []string{"go", "rust", "java", "python"}

	upper := make([]string, len(languages))
	for i, name := range languages {
		upper[i] = strings.ToUpper(name)
	}

	fmt.Println("语言列表：", strings.Join(upper, " | "))
	fmt.Printf("共 %d 种\\n", len(upper))
}
`,

  php: `<?php
$scores = [
    'Alice' => 92,
    'Bob'   => 78,
    'Carol' => 85,
    'Dave'  => 96,
];

arsort($scores);

echo "成绩排名：\\n";
$rank = 1;
foreach ($scores as $name => $score) {
    printf("  %d. %-6s %d\\n", $rank++, $name, $score);
}
`,

  ruby: `words = %w[ruby python javascript rust go]

groups = words.group_by(&:length).sort

groups.each do |length, list|
  puts "#{length} 个字母：#{list.join(', ')}"
end

puts "平均长度：#{words.sum(&:length).to_f / words.size}"
`,
};

export const DEFAULT_CODE =
  '# 在此输入程序的标准输入（可选）\n# 例如：输入多行数据后，程序可通过 stdin 读取\n';

// 纯静态托管（如 GitHub Pages）没有执行服务时使用的内置语言目录
export const LANGUAGE_CATALOG = [
  { id: 'html', name: 'HTML', monogram: 'HTML', color: '#e34f26', fileName: 'index.html', preview: true, available: true, version: '浏览器预览', reason: null },
  { id: 'javascript', name: 'JavaScript', monogram: 'JS', color: '#f7df1e', fileName: 'main.js', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'typescript', name: 'TypeScript', monogram: 'TS', color: '#3178c6', fileName: 'main.ts', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'python', name: 'Python', monogram: 'PY', color: '#3776ab', fileName: 'main.py', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'c', name: 'C', monogram: 'C', color: '#5c6bc0', fileName: 'main.c', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'cpp', name: 'C++', monogram: 'C++', color: '#00599c', fileName: 'main.cpp', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'rust', name: 'Rust', monogram: 'RS', color: '#dea584', fileName: 'main.rs', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'java', name: 'Java', monogram: 'JV', color: '#e76f00', fileName: 'Main.java', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'go', name: 'Go', monogram: 'GO', color: '#00add8', fileName: 'main.go', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'php', name: 'PHP', monogram: 'PHP', color: '#777bb4', fileName: 'main.php', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
  { id: 'ruby', name: 'Ruby', monogram: 'RB', color: '#cc342d', fileName: 'main.rb', preview: false, available: false, version: null, reason: '静态部署未连接执行服务' },
];
