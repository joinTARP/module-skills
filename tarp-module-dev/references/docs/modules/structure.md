<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/structure.md; sha256: cae64a3724b64fd0e836f4bd907157c863d1024c2be0a6e0d9650e28b279f39c -->

# 模组结构

一个模组就是一个文件夹。名称、开局方案写在 `module.toml` 或 `module.json`，角色和地点各自保存为文档，文档的字段定义放在 `.types/`。游戏文档按一级类型目录保存，目录名使用类型标识；子目录可按主题或章节继续分组，文件名只写文档名称和格式扩展名。桌面应用负责读取、校验和展示这些文件；编辑内容时，用你习惯的文本编辑器或编程助手即可。

AI 主持的文件工具只允许查阅游戏文档和已注册类型的字段定义；`module.toml/json`、布局和附件不会出现在其目录查询或搜索结果中，也不能直接读取。主持按类型索引查找资料；文件较多的目录按需展开。需要主持查阅的背景和规则请保存为游戏文档。`hostPrompt` 仍由应用加载后追加，文档中的可见图片仍可在聊天中展示。

创建冒险时，应用在独立副本中将游戏文档、元配置、字段定义和布局统一保存为 JSON，Markdown 正文保存到 `body`。模组库中的作者原文件保持原样，玩家阅读页和附件保留原文件；修改作者模组不会自动改变已创建的冒险，可通过[手动同步模组](../getting-started/first-adventure.md#同步已有冒险的模组)更新独立副本。

## 先做一个能开局的小模组

先创建 `小河渡口` 文件夹，再按下面的目录保存五个完整文件。它们组成一个可开局的示例：一名预设角色、一份地点资料、一段预写开场。没有封面或自建角色流程也能使用。

```text
小河渡口/
├── module.toml
├── .types/
│   ├── character.fields.toml
│   └── location.fields.toml
├── character/
│   └── 阿青.toml
└── location/
    └── 河岸.md
```

`module.toml`：

```toml
name = "小河渡口"
description = "渡船迟迟未归，你沿着河岸寻找船夫。"

[[gameStarts]]
id = "river"
name = "河岸寻人"
characterTypeIds = ["character"]
playablePaths = ["character/阿青"]
allowCreate = false

[gameStarts.opening]
mode = "scripted"

[[gameStarts.opening.beats]]
text = "河雾渐散，渡口仍没有船。岸边的木桩上系着一条刚被割断的绳子。"
```

`.types/character.fields.toml`：

```toml
designation = "character"

[fields.hp]
type = "number"
label = "生命值"
required = true
mutable = true
```

`.types/location.fields.toml`：

```toml
name = "地点"
```

地点没有额外属性时，只写类型名称就够了。每份文档都自带名称、简介、图片和正文，无须在类型中再次声明。

`character/阿青.toml`：

```toml
name = "阿青"
description = "在河边长大的旅人，熟悉这一带的水路。"
hp = 6
```

`location/河岸.md`：

```markdown
# 河岸

木栈桥向水面伸出几步。浅泥里留着两串脚印，往上游去了。
```

开发者手动验收：把 `小河渡口` 放进设置中的模组保存目录，打开模组检查文档，再从“开始 → 新的冒险”创建并进入冒险。选定并确认阿青后，应当出现上面的开场文字。这个示例的预写开场不调用模型；之后让主持回应行动，仍需配置模型。操作步骤见[第一次冒险](../getting-started/first-adventure.md)。

## 这几条路径怎样对应

游戏文档采用 `类型/名称.格式` 或 `类型/分组/名称.格式`，例如 `character/阿青.toml`。一级目录 `character` 对应 `.types/character.fields.toml`，决定该目录下所有文档的类型。子目录只负责分组，可以继续嵌套；例如 `location/河畔/渡口.md` 仍属于地点类型。

开局配置中的文档引用从模组根目录出发，保留类型目录和分组路径，省略文件扩展名：`location/河岸`。它指向现有地点；`character/阿青` 指向现有角色。改用 JSON 或 Markdown 保存角色时，引用保持不变。

| 配置                         | 放在哪里                                  | 用途                         |
| ---------------------------- | ----------------------------------------- | ---------------------------- |
| 模组信息、序章、开局方案     | `module.toml` 或 `module.json`            | 模组卡片、开局选择和正式开场 |
| 角色字段、角色用途、建卡流程 | `.types/character.fields.toml` 或 `.json` | 校验角色、允许选角或自建     |
| 地点、角色、物品等资料       | `类型/分组/名称.toml`、`.json` 或 `.md`   | 保存属性与正文               |
| 列表、卡片和详情展示         | `.types/类型.layout.toml` 或 `.json`      | 安排该类型的展示方式，可省略 |

模组元配置、字段定义和布局接受 JSON 或 TOML，使用相同的字段校验，不同配置可以混用。同一份配置只能保留一种格式，例如不能同时存在 `module.toml` 和 `module.json`。每份内容文档也只保留一种格式，避免同一引用指向两个文件。三种文档格式的写法见[文档类型与字段](doc-types.md)。

## 扩展模组

最小示例只提供一名预设角色。需要多个方案、序章分支、AI 队友或专属开场时，见[序章与开局](game-starts.md)；开放自建角色时，先配置[阶段式建卡](character-creation.md)。

初次创作可以按“文件与字段 → 展示布局 → 开局”继续阅读，再按需要加入计算、建卡、状态和音色。

类型标记 `designation = "character"` 后可用于选角，`world_state` 用于世界状态，普通资料省略此标记。游戏状态的建模见[自定义游戏状态](state.md)。布局负责字段呈现，声音见[模组音色](voice.md)。

## 加入封面和阅读页

先让目录里的文档通过校验，再添加这些可选信息：

| 字段                                  | 内容                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| `cover`                               | 模组内图片路径，如 `图片/封面.webp`，也可用 HTTP(S) 图片地址        |
| `system`、`author`、`version`、`tags` | 规则系统、作者、版本和标签                                          |
| `host.name`、`host.avatar`            | 聊天中主持人的名字与头像                                            |
| `hostPrompt`                          | 追加给主持的模组说明，如叙事口吻、查阅顺序和裁定要求                |
| `pages`                               | 给玩家阅读的 Markdown 文件路径列表，如 `["概览.md", "玩家手册.md"]` |

`name` 和 `description` 是模组信息的必填项。`pages` 中的文件按阅读页加载，不进入文档类型，也不参与开局。普通的 `概览.md` 或 `README.md` 若放在模组内，记得在 `pages` 中列出；否则扫描器会按游戏文档检查它的文件名。

类型定义、布局和图片各有自己的位置。扫描器跳过隐藏目录、`node_modules` 和 `AGENTS.md`；图片可放在 `图片/`，不会被当作游戏文档解析。各类图片支持 `avif`、`gif`、`jpeg`、`jpg`、`png`、`svg` 和 `webp`。

图片制作前先确定统一风格，并同时考虑明亮和暗黑模式；素材来源、制作、引用与检查见[图片资源](images.md)。

## 修改后怎样检查

开发者可在桌面应用中打开模组查看每份文档的校验结果，尤其检查文件名、引用路径和必填字段。新增布局时，再看卡片、悬浮预览和详情是否显示了预期字段。对应写法见[展示布局](layout.md)和[计算字段](compute.md)。命令行校验与桌面预览见[模组 CLI](cli.md)。

每次创建冒险时，应用会复制一份模组资料。编辑源模组后，新建冒险会使用这次修改；现有冒险可手动检查并同步自己的副本，保留游戏进度继续测试。开发者手动测试开局时，重新建一次冒险，完成选角和开场，可以发现只检查文件时容易遗漏的配置问题。

## 分享到 GitHub

完成并测试模组后，可以上传到公开 GitHub 仓库，添加 `tarp-module` Topic，让玩家通过官网的「寻找模组」入口发现它。仓库目录、上传步骤、README 示例、Topic 设置和 ZIP 发布见[发布模组](publishing.md)。
