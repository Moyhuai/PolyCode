// 在线工具目录：结构与菜鸟教程工具站（cainiaojc.com/tool）保持一致
// 每种语言对应一个独立运行页：/tool/<id>/

export const CATEGORIES = [
  {
    id: 'compiler',
    title: '编译工具',
    subtitle: '覆盖主流后端、脚本与函数式语言，云端沙箱执行，无需安装任何运行环境。',
  },
  {
    id: 'frontend',
    title: '前端编辑器',
    subtitle: '直接在浏览器中渲染 HTML / CSS / JavaScript，边写边看效果。',
  },
];

export const LANGUAGES = [
  {
    id: 'php',
    name: 'PHP',
    monogram: 'PHP',
    color: '#777bb4',
    fileext: 'php',
    judge0Id: 98,
    version: '8.3.11',
    tagline: '在线运行、编译调试 PHP 代码',
    editor: 'php',
    category: 'compiler',
    snippet: `<?php
echo "Hello, PolyCode!\\n";

for ($i = 1; $i <= 5; $i++) {
    echo $i . " 的平方是 " . ($i * $i) . "\\n";
}
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monogram: 'TS',
    color: '#3178c6',
    fileext: 'ts',
    judge0Id: 101,
    version: '5.6.2',
    tagline: '在线运行、编译调试 TypeScript 代码',
    editor: 'typescript',
    category: 'compiler',
    snippet: `interface Language {
  name: string;
  year: number;
}

const languages: Language[] = [
  { name: 'TypeScript', year: 2012 },
  { name: 'Rust', year: 2010 },
  { name: 'Go', year: 2009 },
];

languages
  .sort((a, b) => a.year - b.year)
  .forEach((item) => console.log(item.name + ' · ' + item.year));
`,
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    monogram: 'Kt',
    color: '#7f52ff',
    fileext: 'kt',
    judge0Id: 111,
    version: '2.1.10',
    tagline: '在线运行、编译调试 Kotlin 代码',
    editor: 'kotlin',
    category: 'compiler',
    snippet: `fun main() {
    println("Hello, PolyCode!")

    for (i in 1..5) {
        println("\$i 的平方是 \${i * i}")
    }
}
`,
  },
  {
    id: 'pascal',
    name: 'Pascal',
    monogram: 'Pas',
    color: '#3b6ea5',
    fileext: 'pas',
    judge0Id: 67,
    version: 'FPC 3.0.4',
    tagline: '在线运行、编译调试 Pascal 代码',
    editor: 'pascal',
    category: 'compiler',
    snippet: `program Hello;

var
  i: Integer;

begin
  writeln('Hello, PolyCode!');

  for i := 1 to 5 do
    writeln(i, ' 的平方是 ', i * i);
end.
`,
  },
  {
    id: 'lua',
    name: 'Lua',
    monogram: 'Lua',
    color: '#2c2d72',
    fileext: 'lua',
    judge0Id: 64,
    version: '5.3.5',
    tagline: '在线运行、编译调试 Lua 代码',
    editor: 'lua',
    category: 'compiler',
    snippet: `print("Hello, PolyCode!")

for i = 1, 5 do
  print(i .. " 的平方是 " .. i * i)
end
`,
  },
  {
    id: 'node',
    name: 'Node.js',
    monogram: 'JS',
    color: '#84cc16',
    fileext: 'js',
    judge0Id: 102,
    version: '22.08.0',
    tagline: '在线运行、编译调试 Node.js 代码',
    editor: 'javascript',
    category: 'compiler',
    snippet: `console.log('Hello, PolyCode!');

const langs = ['JavaScript', 'Python', 'Rust', 'Go'];
langs.forEach((name, index) => {
  console.log(\`\${index + 1}. \${name}\`);
});
`,
  },
  {
    id: 'go',
    name: 'Golang',
    monogram: 'Go',
    color: '#00add8',
    fileext: 'go',
    judge0Id: 107,
    version: '1.23.5',
    tagline: '在线运行、编译调试 Golang 代码',
    editor: 'go',
    category: 'compiler',
    snippet: `package main

import "fmt"

func main() {
	fmt.Println("Hello, PolyCode!")

	for i := 1; i <= 5; i++ {
		fmt.Printf("%d 的平方是 %d\\n", i, i*i)
	}
}
`,
  },
  {
    id: 'swift',
    name: 'Swift',
    monogram: 'Sw',
    color: '#f05138',
    fileext: 'swift',
    judge0Id: 83,
    version: '5.2.3',
    tagline: '在线运行、编译调试 Swift 代码',
    editor: 'swift',
    category: 'compiler',
    snippet: `print("Hello, PolyCode!")

for i in 1...5 {
    print("\\(i) 的平方是 \\(i * i)")
}
`,
  },
  {
    id: 'rust',
    name: 'Rust',
    monogram: 'Rs',
    color: '#dea584',
    fileext: 'rs',
    judge0Id: 108,
    version: '1.85.0',
    tagline: '在线运行、编译调试 Rust 代码',
    editor: 'rust',
    category: 'compiler',
    snippet: `fn main() {
    println!("Hello, PolyCode!");

    for i in 1..=5 {
        println!("{} 的平方是 {}", i, i * i);
    }
}
`,
  },
  {
    id: 'bash',
    name: 'Bash',
    monogram: 'Sh',
    color: '#4eaa25',
    fileext: 'sh',
    judge0Id: 46,
    version: '5.0.0',
    tagline: '在线运行、编译调试 Bash 脚本',
    editor: 'bash',
    category: 'compiler',
    snippet: `#!/bin/bash
echo "Hello, PolyCode!"

for i in 1 2 3 4 5; do
  echo "$i 的平方是 $((i * i))"
done
`,
  },
  {
    id: 'perl',
    name: 'Perl',
    monogram: 'Pl',
    color: '#39457e',
    fileext: 'pl',
    judge0Id: 85,
    version: '5.28.1',
    tagline: '在线运行、编译调试 Perl 代码',
    editor: 'perl',
    category: 'compiler',
    snippet: `use strict;
use warnings;

print "Hello, PolyCode!\\n";

for my $i (1..5) {
    print "$i 的平方是 " . ($i * $i) . "\\n";
}
`,
  },
  {
    id: 'erlang',
    name: 'Erlang',
    monogram: 'Er',
    color: '#a90533',
    fileext: 'erl',
    judge0Id: 58,
    version: 'OTP 22.2',
    tagline: '在线运行、编译调试 Erlang 代码',
    editor: 'erlang',
    category: 'compiler',
    snippet: `-module(main).
-export([main/1]).

main(_Args) ->
    io:setopts(standard_io, [{encoding, unicode}]),
    io:format("Hello, PolyCode!~n"),
    [io:format("~p 的平方是 ~p~n", [I, I * I]) || I <- lists:seq(1, 5)].
`,
  },
  {
    id: 'scala',
    name: 'Scala',
    monogram: 'Sc',
    color: '#dc322f',
    fileext: 'scala',
    judge0Id: 112,
    version: '3.4.2',
    tagline: '在线运行、编译调试 Scala 代码',
    editor: 'scala',
    category: 'compiler',
    snippet: `object Main extends App {
  println("Hello, PolyCode!")

  for (i <- 1 to 5) {
    println(s"\$i 的平方是 \${i * i}")
  }
}
`,
  },
  {
    id: 'csharp',
    name: 'C#',
    monogram: 'C#',
    color: '#68217a',
    fileext: 'cs',
    judge0Id: 51,
    version: 'Mono 6.6',
    tagline: '在线运行、编译调试 C# 代码',
    editor: 'csharp',
    category: 'compiler',
    snippet: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, PolyCode!");

        for (int i = 1; i <= 5; i++) {
            Console.WriteLine(\$"{i} 的平方是 {i * i}");
        }
    }
}
`,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    monogram: 'Rb',
    color: '#cc342d',
    fileext: 'rb',
    judge0Id: 72,
    version: '2.7.0',
    tagline: '在线运行、编译调试 Ruby 代码',
    editor: 'ruby',
    category: 'compiler',
    snippet: `puts "Hello, PolyCode!"

(1..5).each do |i|
  puts "#{i} 的平方是 #{i * i}"
end
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    monogram: 'C++',
    color: '#00599c',
    fileext: 'cpp',
    judge0Id: 105,
    version: 'GCC 14.1.0',
    tagline: '在线运行、编译调试 C++ 代码',
    editor: 'cpp',
    category: 'compiler',
    snippet: `#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello, PolyCode!" << std::endl;

    std::vector<int> nums{1, 2, 3, 4, 5};
    for (int n : nums) {
        std::cout << n << " 的平方是 " << n * n << std::endl;
    }

    return 0;
}
`,
  },
  {
    id: 'c',
    name: 'C 语言',
    monogram: 'C',
    color: '#5c6bc0',
    fileext: 'c',
    judge0Id: 103,
    version: 'GCC 14.1.0',
    tagline: '在线运行、编译调试 C 语言代码',
    editor: 'c',
    category: 'compiler',
    snippet: `#include <stdio.h>

int main(void) {
    printf("Hello, PolyCode!\\n");

    for (int i = 1; i <= 5; i++) {
        printf("%d 的平方是 %d\\n", i, i * i);
    }

    return 0;
}
`,
  },
  {
    id: 'java',
    name: 'Java',
    monogram: 'Jv',
    color: '#e76f00',
    fileext: 'java',
    judge0Id: 91,
    version: 'JDK 17.0.6',
    tagline: '在线运行、编译调试 Java 代码',
    editor: 'java',
    category: 'compiler',
    snippet: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, PolyCode!");

        for (int i = 1; i <= 5; i++) {
            System.out.println(i + " 的平方是 " + (i * i));
        }
    }
}
`,
  },
  {
    id: 'python',
    name: 'Python 3',
    monogram: 'Py',
    color: '#3776ab',
    fileext: 'py',
    judge0Id: 100,
    version: '3.12.5',
    tagline: '在线运行、编译调试 Python 代码',
    editor: 'python',
    category: 'compiler',
    snippet: `print("Hello, PolyCode!")

for i in range(1, 6):
    print(f"{i} 的平方是 {i * i}")
`,
  },
  {
    id: 'd',
    name: 'D 语言',
    monogram: 'D',
    color: '#b03931',
    fileext: 'd',
    judge0Id: 56,
    version: 'DMD 2.089.1',
    tagline: '在线运行、编译调试 D 语言代码',
    editor: 'd',
    category: 'compiler',
    snippet: `import std.stdio;

void main() {
    writeln("Hello, PolyCode!");

    foreach (i; 1 .. 6) {
        writeln(i, " 的平方是 ", i * i);
    }
}
`,
  },
  {
    id: 'dart',
    name: 'Dart',
    monogram: 'Da',
    color: '#0175c2',
    fileext: 'dart',
    judge0Id: 90,
    version: '2.19.2',
    tagline: '在线运行、编译调试 Dart 代码',
    editor: 'dart',
    category: 'compiler',
    snippet: `void main() {
  print('Hello, PolyCode!');

  for (var i = 1; i <= 5; i++) {
    print('\$i 的平方是 \${i * i}');
  }
}
`,
  },
  {
    id: 'octave',
    name: 'MATLAB/Octave',
    monogram: 'Oct',
    color: '#0790c0',
    fileext: 'm',
    judge0Id: 66,
    version: 'Octave 5.1.0',
    tagline: '在线运行、编译调试 MATLAB/Octave 代码',
    editor: 'octave',
    category: 'compiler',
    snippet: `disp("Hello, PolyCode!");

for i = 1:5
  fprintf("%d 的平方是 %d\\n", i, i * i);
end
`,
  },
  {
    id: 'groovy',
    name: 'Groovy',
    monogram: 'Grv',
    color: '#4298b8',
    fileext: 'groovy',
    judge0Id: 88,
    version: '3.0.3',
    tagline: '在线运行、编译调试 Groovy 代码',
    editor: 'groovy',
    category: 'compiler',
    snippet: `println 'Hello, PolyCode!'

(1..5).each { i ->
    println "\$i 的平方是 \${i * i}"
}
`,
  },
  {
    id: 'haskell',
    name: 'Haskell',
    monogram: 'Hs',
    color: '#5d4f85',
    fileext: 'hs',
    judge0Id: 61,
    version: 'GHC 8.8.1',
    tagline: '在线运行、编译调试 Haskell 代码',
    editor: 'haskell',
    category: 'compiler',
    snippet: `main :: IO ()
main = do
  putStrLn "Hello, PolyCode!"
  mapM_ (\\i -> putStrLn (show i ++ " 的平方是 " ++ show (i * i))) [1 .. 5]
`,
  },
  {
    id: 'fsharp',
    name: 'F#',
    monogram: 'F#',
    color: '#378bba',
    fileext: 'fs',
    judge0Id: 87,
    version: '.NET Core 3.1',
    tagline: '在线运行、编译调试 F# 代码',
    editor: 'fsharp',
    category: 'compiler',
    snippet: `printfn "Hello, PolyCode!"

for i in 1..5 do
    printfn "%d 的平方是 %d" i (i * i)
`,
  },
  {
    id: 'ocaml',
    name: 'OCaml',
    monogram: 'ML',
    color: '#ec6813',
    fileext: 'ml',
    judge0Id: 65,
    version: '4.09.0',
    tagline: '在线运行、编译调试 OCaml 代码',
    editor: 'ocaml',
    category: 'compiler',
    snippet: `print_endline "Hello, PolyCode!";;

for i = 1 to 5 do
  Printf.printf "%d 的平方是 %d\\n" i (i * i)
done;;
`,
  },
  {
    id: 'lisp',
    name: 'Common Lisp',
    monogram: 'Lisp',
    color: '#3f7f5f',
    fileext: 'lisp',
    judge0Id: 55,
    version: 'SBCL 2.0.0',
    tagline: '在线运行、编译调试 Common Lisp 代码',
    editor: 'lisp',
    category: 'compiler',
    snippet: `(format t "Hello, PolyCode!~%")

(loop for i from 1 to 5
      do (format t "~d 的平方是 ~d~%" i (* i i)))
`,
  },
  {
    id: 'clojure',
    name: 'Clojure',
    monogram: 'Cj',
    color: '#5881d8',
    fileext: 'clj',
    judge0Id: 86,
    version: '1.10.1',
    tagline: '在线运行、编译调试 Clojure 代码',
    editor: 'clojure',
    category: 'compiler',
    snippet: `(println "Hello, PolyCode!")

(doseq [i (range 1 6)]
  (println i "的平方是" (* i i)))
`,
  },
  {
    id: 'elixir',
    name: 'Elixir',
    monogram: 'Ex',
    color: '#6e4a7e',
    fileext: 'ex',
    judge0Id: 57,
    version: '1.9.4',
    tagline: '在线运行、编译调试 Elixir 代码',
    editor: 'elixir',
    category: 'compiler',
    snippet: `IO.puts("Hello, PolyCode!")

for i <- 1..5 do
  IO.puts("#{i} 的平方是 #{i * i}")
end
`,
  },
  {
    id: 'fortran',
    name: 'Fortran',
    monogram: 'Ftn',
    color: '#734f96',
    fileext: 'f90',
    judge0Id: 59,
    version: 'GFortran 9.2.0',
    tagline: '在线运行、编译调试 Fortran 代码',
    editor: 'fortran',
    category: 'compiler',
    snippet: `program hello
  implicit none
  integer :: i

  print *, 'Hello, PolyCode!'

  do i = 1, 5
    print *, i, ' 的平方是 ', i * i
  end do
end program hello
`,
  },
  {
    id: 'prolog',
    name: 'Prolog',
    monogram: 'Plg',
    color: '#742b2b',
    fileext: 'pl',
    judge0Id: 69,
    version: 'GNU Prolog 1.4.5',
    tagline: '在线运行、编译调试 Prolog 代码',
    editor: 'prolog',
    category: 'compiler',
    snippet: `:- initialization(main).

main :-
    write('Hello, PolyCode!'), nl,
    forall(between(1, 5, I),
           (write(I), write(' 的平方是 '), S is I * I, write(S), nl)).
`,
  },
  {
    id: 'sql',
    name: 'SQLite',
    monogram: 'SQL',
    color: '#003b57',
    fileext: 'sql',
    judge0Id: 82,
    version: 'SQLite 3.27.2',
    tagline: '在线运行 SQLite 查询语句',
    editor: 'sql',
    category: 'compiler',
    snippet: `SELECT 'Hello, PolyCode!' AS greeting;

SELECT value, value * value AS square
FROM (
  SELECT 1 AS value
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
  UNION ALL SELECT 5
);
`,
  },
  {
    id: 'html',
    name: 'HTML5',
    monogram: '</>',
    color: '#e34f26',
    fileext: 'html',
    version: '浏览器预览',
    tagline: '在线编写并实时预览 HTML / CSS / JavaScript',
    editor: 'html',
    category: 'frontend',
    preview: true,
    snippet: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PolyCode · HTML 预览</title>
    <style>
      * { box-sizing: border-box; }
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
      h1 { margin: 0 0 10px; font-size: 22px; }
      p { margin: 0 0 18px; font-size: 14px; color: #a9b6d6; line-height: 1.7; }
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
  },
];

export const COMPILER_LANGUAGES = LANGUAGES.filter((item) => item.category === 'compiler');
export const FRONTEND_LANGUAGES = LANGUAGES.filter((item) => item.category === 'frontend');
export const LANGUAGE_COUNT = LANGUAGES.length;

export function getLanguage(id) {
  return LANGUAGES.find((item) => item.id === id) || null;
}

export function languagesOf(categoryId) {
  return LANGUAGES.filter((item) => item.category === categoryId);
}
