#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const marker =
  "<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->";
const usage =
  "node scripts/sync-module-docs.mjs --source <官网仓库> [--check] [--output <参考目录>]";
const hash = (text) => createHash("sha256").update(text).digest("hex");

async function markdownFiles(directory, prefix = "", optional = false) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (optional && error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries.sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    if (entry.name.startsWith(".")) continue;
    const relative = posix.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(
        ...(await markdownFiles(join(directory, entry.name), relative)),
      );
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative);
    else if (entry.isSymbolicLink())
      throw new Error(`文档目录不接受符号链接：${relative}`);
  }
  return files;
}

function sourceDocument(source, path) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error(`源文档缺少 frontmatter：${path}`);
  const value = frontmatter[1].match(/^title:\s*(.+)$/m)?.[1].trim();
  if (!value || value === "|" || value === ">")
    throw new Error(`源文档需要单行 title：${path}`);
  const title = value.startsWith('"')
    ? JSON.parse(value)
    : value.startsWith("'") && value.endsWith("'")
      ? value.slice(1, -1).replaceAll("''", "'")
      : value;
  return {
    title,
    body: source.slice(frontmatter[0].length).trim(),
    sha256: hash(source),
  };
}

// 只转换正文中的文档链接，保留围栏代码内的示例原样。
function documentLinks(body, replace) {
  let fence;
  return body
    .split("\n")
    .map((line) => {
      const match = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
      if (match) {
        if (!fence) fence = { marker: match[1][0], length: match[1].length };
        else if (
          match[1][0] === fence.marker &&
          match[1].length >= fence.length &&
          !match[2].trim()
        )
          fence = undefined;
        return line;
      }
      if (fence) return line;
      return line.replace(
        /\]\((\/docs\/[^)\s]+)\)/g,
        (_, href) => `](${replace(href)})`,
      );
    })
    .join("\n");
}

async function synchronize(sourceRoot, output, check) {
  const sourceBase = join(sourceRoot, "src/content/docs");
  const paths = await markdownFiles(sourceBase);
  const sources = new Map(
    await Promise.all(
      paths.map(async (path) => {
        const source = await readFile(join(sourceBase, path), "utf8");
        return [path.slice(0, -3), sourceDocument(source, path)];
      }),
    ),
  );
  const selected = new Set(
    [...sources.keys()].filter((slug) => slug.startsWith("modules/")),
  );
  if (!selected.size) throw new Error("官网没有模组创作文档");
  const queue = [...selected];
  const targetOf = (href) => {
    const [route, anchor] = href.split("#", 2);
    const slug = route.slice("/docs/".length).replace(/\/$/, "");
    if (!slug || !sources.has(slug))
      throw new Error(`官网文档链接没有对应源文件：${href}`);
    return { slug, anchor };
  };
  // 将创作文档直接或间接引用的玩家指南也纳入分发，保证本地链接完整。
  for (let index = 0; index < queue.length; index++) {
    documentLinks(sources.get(queue[index]).body, (href) => {
      const { slug } = targetOf(href);
      if (!selected.has(slug)) {
        selected.add(slug);
        queue.push(slug);
      }
      return href;
    });
  }
  const expected = new Map();
  const documents = [...selected].sort().map((slug) => {
    const source = sources.get(slug);
    const body = documentLinks(source.body, (href) => {
      const target = targetOf(href);
      const path = posix.relative(posix.dirname(slug), `${target.slug}.md`);
      return path + (target.anchor !== undefined ? `#${target.anchor}` : "");
    });
    const sourcePath = `src/content/docs/${slug}.md`;
    const outputPath = `${slug}.md`;
    expected.set(
      outputPath,
      `${marker}\n<!-- source: ${sourcePath}; sha256: ${source.sha256} -->\n\n# ${source.title}\n\n${body}\n`,
    );
    return { source: sourcePath, output: outputPath, sha256: source.sha256 };
  });
  const manifestName = ".sources.json";
  expected.set(
    manifestName,
    JSON.stringify(
      {
        schemaVersion: 1,
        sourceDirectory: "website/src/content/docs",
        documents,
      },
      null,
      2,
    ) + "\n",
  );
  const existingPaths = await markdownFiles(output, "", true);
  const changes = [];
  for (const [path, content] of expected) {
    let previous;
    try {
      previous = await readFile(join(output, path), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (
      previous !== undefined &&
      path !== manifestName &&
      !previous.startsWith(marker)
    )
      throw new Error(`目标包含非生成文件，保留原文件并停止：${path}`);
    if (previous !== content)
      changes.push({
        path,
        content,
        kind: previous === undefined ? "新增" : "更新",
      });
  }
  for (const path of existingPaths) {
    if (expected.has(path)) continue;
    const content = await readFile(join(output, path), "utf8");
    if (content.startsWith(marker)) changes.push({ path, kind: "删除" });
  }
  if (check) {
    if (changes.length) {
      console.error(
        `参考资料尚未同步：${changes.map(({ path, kind }) => `${kind} ${path}`).join("；")}`,
      );
      process.exitCode = 1;
    } else console.log(`参考资料与官网源一致：${documents.length} 篇。`);
    return;
  }
  for (const change of changes) {
    const target = join(output, change.path);
    if (change.kind === "删除") await rm(target);
    else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, change.content);
    }
  }
  console.log(
    `已同步 ${documents.length} 篇参考资料，${changes.length} 项变化。`,
  );
}

try {
  const { values } = parseArgs({
    options: {
      source: { type: "string" },
      output: { type: "string" },
      check: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help) console.log(usage);
  else {
    if (!values.source) throw new Error(`必须指定官网内容源。用法：${usage}`);
    const skillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    await synchronize(
      resolve(values.source),
      values.output
        ? resolve(values.output)
        : join(skillsRoot, "tarp-module-dev/references/docs"),
      values.check ?? false,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
