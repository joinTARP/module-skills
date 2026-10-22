# TARP 模组技能（module-skills）

供 Agent 创建、维护和校验 TARP 模组的独立 Git 仓库。

## 技能

| 技能                                        | 用途                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| [tarp-module-dev](tarp-module-dev/SKILL.md) | 设计、改编和改善模组体验，编写内容与配置，使用 Node.js CLI 校验，通过客户端 MCP 临时局预演并提供结果与验收清单。 |

技能入口保持简短。模组设计与配置正文统一维护在官网的 `src/content/docs/`，通过同步脚本生成到 `tarp-module-dev/references/docs/`；[模组设计指导](tarp-module-dev/references/docs/modules/design.md) 等参考按任务读取。原创最小模板放在 `assets/module/`，技能不复制桌面应用或 CLI 实现。

## 安装与使用

使用 [skills.sh](https://skills.sh/) 的 Skills CLI 安装，需要 Node.js 与 npm：

```sh
npx skills add joinTARP/module-skills --skill tarp-module-dev
```

默认安装到当前项目，按提示选择使用的 Agent；添加 `-g` 可安装到全局。查看仓库中的可用技能：

```sh
npx skills add joinTARP/module-skills --list
```

命令参数见 [Skills CLI 官方说明](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)。技能包含所需参考文档和最小模板，使用者无需克隆官网仓库。

也可以将 `tarp-module-dev/` 整个目录放入所用 Agent 支持的技能目录，保留 `SKILL.md`、`references/`、`assets/` 和 `agents/` 的相对位置。`agents/openai.yaml` 提供界面名称与简介，其余内容以 `SKILL.md` 为入口。

请求示例：

> 使用模组开发技能，在当前仓库的 module/ 创建一个两人探索模组，提供预设角色，使用现有 CLI 校验，并由模组定义位置和状态展示。

模组校验使用 Node.js CLI：

```sh
tarp --version
tarp module validate ./module --json
tarp module preview ./module
```

CLI 需事先可用；预览还需要桌面应用。npm 发布状态和实际包名以 CLI 发布信息为准，本技能不假设包已经上架。使用本地 TARP 源码构建的 CLI 时，也可以直接运行 `node <tarp目录>/packages/module-cli/out/index.js`。

## 维护

后续待办：改为通过 GitHub Actions 自动执行官网文档到技能参考的同步与一致性检查，不再依赖本地手动触发。触发条件和跨仓库更新方式后续确定；当前暂不实施，保留现有同步脚本。

修改设计方法、格式或能力说明时，更新官网对应源文档，再从本仓库执行：

```sh
node scripts/sync-module-docs.mjs --source ../website
node scripts/sync-module-docs.mjs --source ../website --check
```

`--source` 显式指定官网仓库，不要求技能使用者安装官网源码。脚本导出模组创作文档及其引用的其他文档，转换本地链接，保留代码示例，并用 `.sources.json` 记录源文件 SHA-256。生成资料不手工修改；`--check` 不写文件，资料缺失、变动或存在过期生成文件时返回非零。分发前运行同步与检查，整个技能目录可独立复制安装；官网构建不依赖技能仓库。

每次修改格式说明或模板，用当前 CLI 校验 `tarp-module-dev/assets/module/`。校验模板内容时传入 `module/`，不要把技能仓库根目录当作模组导入。

保持现行格式，不保留迁移过程文档、失效兼容写法或另一份手工维护的应用手册。新增技能按实际用途单独建目录，不预建空技能。

## 许可证

技能说明和原创模板采用 [MIT 许可证](LICENSE)。用户提供或引用的第三方剧情、规则和图片遵循各自的授权。
