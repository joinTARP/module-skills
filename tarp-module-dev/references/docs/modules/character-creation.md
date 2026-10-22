<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/character-creation.md; sha256: 2036b8eb8d446bf82a9d02f80bdbc482b475ade78dbb37bcb41427ddb707bf7b -->

# 阶段式建卡

自建角色使用角色类型中的 `creationFlow.workbench`。建卡按明确配置的任务生成角色，不依赖模型，也不从规则正文或 Markdown 表格推断建卡步骤。角色类型必须声明 `designation = "character"`，对应[开局方案](game-starts.md)须允许自建。

## 先确定生成规则

先列出确认角色时必须存在的原始值，再决定哪些由玩家输入、选择、随机或固定授予。任务只生成普通输入和初始事实；派生上限、阈值与汇总留给[计算字段](compute.md)。`mutable` 约束运行中更新，不阻止建卡填写只读初值。

身份和名字用输入，固定选项用 `choice`，已有职业或背景资料用 `reference`；独立骰式用 `roll`，成组随机条目用 `table`；需要展开所选资料中的任务时用 `document`，固定初值或复制已生成值用 `grant`，预算与数量选择用 `purchase`。规则正文里的骰表和物品清单不会自动成为任务。

任务按依赖排序：先选择来源，再读取来源；先产生基础值，再复制初值。平台按稳定任务 ID 保存答案和随机历史，作者修改标题时应保留 ID，不通过改 ID 强制重掷。建卡已经授予的初始资源，不应在开场初始化指令中再次授予。

逐条检查分支：是否补齐必填字段、是否存在写入冲突，列表授予应使用 `append` 还是整体 `set`，以及数字累加是否重复。秘密任务的私密配置属于建卡协议，不能据此推断整个冒险具有按玩家分别揭露的资料权限。

## 一份可用的工作台

在最小模组的副本中试做：将 `.types/character.fields.toml` 换成下面这份完整的 `.types/character.fields.json`，同名 TOML 文件不要继续留在模组内。若已经配置角色布局，先移除这份练习副本中的 `character.layout.*`，避免它引用本例没有定义的职业等字段。其他字段规则见[文档类型与字段](doc-types.md)。

```json
{
  "designation": "character",
  "fields": {
    "age": { "type": "number", "label": "年龄", "required": true },
    "background": { "type": "text", "label": "背景" },
    "prepared": { "type": "boolean", "label": "已做好准备" },
    "hp": {
      "type": "number",
      "label": "生命值",
      "required": true,
      "mutable": true
    }
  },
  "creationFlow": {
    "workbench": {
      "stages": [
        {
          "id": "identity",
          "title": "身份",
          "tasks": [
            {
              "id": "name",
              "title": "你的名字",
              "kind": "input",
              "bind": "name"
            },
            { "id": "age", "title": "年龄", "kind": "input", "bind": "age" },
            {
              "id": "background",
              "title": "背景",
              "kind": "input",
              "bind": "background",
              "required": false
            },
            {
              "id": "prepared",
              "title": "已做好准备",
              "kind": "input",
              "bind": "prepared"
            }
          ]
        },
        {
          "id": "resources",
          "title": "初始资源",
          "tasks": [
            {
              "id": "hp",
              "title": "初始生命",
              "kind": "roll",
              "bind": "hp",
              "dice": { "count": 1, "sides": 6, "modifier": 2 }
            }
          ]
        }
      ]
    }
  }
}
```

保留阿青这名预设角色时，需要在 `character/阿青.toml` 的顶层补上 `age = 20`，以满足新定义的必填字段；其他可选字段可以省略。然后把现有开局的 `allowCreate` 改为 `true`，保留 `"characterTypeIds": ["character"]`。

开发者手动验收：新建冒险，在选角处进入自建，应出现“身份”和“初始资源”两个阶段。填写姓名、年龄和准备状态，生成生命值后核对角色卡；生命值应为 3–8，确认后新角色可以进入冒险。

至少配置一个阶段。阶段有唯一且稳定的 `id`、非空中文 `title` 和任务列表 `tasks`；同一任务列表里的任务 ID 不能重复。调整标题无需改变 ID，随机记录和答案仍按任务 ID 保存。

## 八类任务

每个任务需要 `id`、`title` 和 `kind`。字段路径用 `attributes.strength` 这样的点路径。

| `kind`      | 配置与行为                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `input`     | 必须有 `bind`；控件类型、枚举选项、对象和列表结构来自目标字段定义                                                                   |
| `choice`    | 必须有 `bind`，目标为文本或枚举；用非空无重复 `options`，或用 `source` 读取已选文档的 `creation.options`                            |
| `reference` | 用 `optionTypeId` 选择已有文档；`bind` 必须是允许该类型的引用字段                                                                   |
| `roll`      | 必须绑定数字字段，配置 `dice.count`、`dice.sides` 和可选 `dice.modifier`                                                            |
| `table`     | `table` 引用随机表文档；均匀掷一枚与条目数相同面数的骰子，选中 `creation.entries` 条目，再执行其任务；可选 `bind` 保存条目的 `text` |
| `document`  | `source` 指向角色上已选引用字段，展开该文档的 `creation.tasks`                                                                      |
| `grant`     | 必须有 `bind`；用 `value` 指定值，或用 `source` 复制当前角色字段值                                                                  |
| `purchase`  | 用 `table` 引用采购表、`budget` 给出预算，根据数量重复执行购买条目的任务                                                            |

`mode` 默认 `set`，直接赋值；`add` 只用于数字累加，缺省初值按 0 处理；`append` 只用于向列表追加一个元素，任务值须符合列表元素类型。需要写入结果的任务应明确配置 `bind`。姓名、简介可用 `name`、`description`；其余字段必须声明，计算字段及计算父字段不能作为写入目标。

`required` 默认 `true`，非必填任务可以跳过。输入按原生值保存，数字不会变成文本，布尔 `false` 和空列表都是有效输入；对象只接受已声明的可输入字段。`mutable` 管游戏中的修改权限，不阻止建卡填写初始值。

掷骰数量为 1–20，面数为 2–1000，修正值为整数，默认 0。引用选择类型须有有效文档；字符串选项写入枚举时必须属于目标枚举。

## 文档里的建卡资料

普通内容文档可声明顶层 `creation` 对象，只包含以下资料：

| 属性      | 用途                                                       |
| --------- | ---------------------------------------------------------- |
| `tasks`   | `document` 任务展开的显式任务列表                          |
| `options` | `choice` 任务读取的非空字符串选项                          |
| `entries` | 随机表或采购表；每项含 `text`、可选非负 `price` 和 `tasks` |

`creation` 及其结构仍须在该文档类型的 `fields` 中声明。任务列表定义了应用生成角色的步骤，应设置 `visibility = "gm"`：分别设置 `creation.tasks` 和 `creation.entries` 条目中的 `tasks`。也可以将父字段整体设为主持可见。公开任务列表会使建卡配置被拒绝；`options`、条目 `text` 和 `price` 可以公开。工作台仍会让所属玩家看到对应任务与结果。

例如，一份只授予银币的背景资料类型 `.types/background.fields.json`：

```json
{
  "fields": {
    "creation": {
      "type": "object",
      "fields": {
        "tasks": {
          "type": "list",
          "visibility": "gm",
          "item": {
            "type": "object",
            "fields": {
              "id": { "type": "text", "required": true },
              "title": { "type": "text", "required": true },
              "kind": {
                "type": "enum",
                "options": ["grant"],
                "required": true
              },
              "bind": { "type": "text", "required": true },
              "mode": {
                "type": "enum",
                "options": ["set", "add"],
                "required": true
              },
              "value": { "type": "number", "required": true }
            }
          }
        }
      }
    }
  }
}
```

对应 `background/旅人.json`：

```json
{
  "name": "旅人",
  "creation": {
    "tasks": [
      {
        "id": "coins",
        "title": "初始银币",
        "kind": "grant",
        "bind": "silver",
        "mode": "add",
        "value": 10
      }
    ]
  }
}
```

接下来扩展本页的角色定义。在 `.types/character.fields.json` 的 `fields` 对象中合并以下两个字段，保留原有字段；`origin` 专门记录背景资料引用，原来的 `background` 文本仍用于自由描述：

```json
{
  "silver": { "type": "number", "label": "银币" },
  "origin": {
    "type": "reference",
    "label": "背景资料",
    "targets": ["background"]
  }
}
```

将下面两个任务追加到“身份”阶段的 `tasks` 数组末尾，放在姓名等原任务之后。这些任务先让玩家选择资料，再读取资料并授予资源；这是一组追加任务，不要替换整个阶段或角色文件：

```json
[
  {
    "id": "origin",
    "title": "选择背景",
    "kind": "reference",
    "bind": "origin",
    "optionTypeId": "background"
  },
  {
    "id": "origin-tasks",
    "title": "背景给予的资源",
    "kind": "document",
    "source": "origin"
  }
]
```

开发者手动验收：保存并新建冒险，自建角色选中“旅人”后，核对页应显示 10 枚银币；返回浏览或重复生成不应再次加到 20。

任务列表结构按你的模组声明：上例只接受数值授予任务。若添加骰子、物品对象或输入任务，也要在来源类型中补全对应字段。物品本身的资料通过引用关联，数量和使用次数放在角色持有状态中，见[展示布局](layout.md)。

随机表每次选择一个条目，先将 `text` 写入可选的 `bind`（文本或枚举），再执行条目任务。嵌套表会继续生成，玩家需要填写或选择的部分留待玩家完成。循环引用会被拒绝。

## 采购与余款

下面是单个采购任务的片段，可加入阶段的 `tasks` 数组。使用前须创建 `random_table/市场用品` 文档，并按上一节为其 `creation.entries` 声明字段；它不是可独立运行的完整示例。

```json
{
  "id": "supplies",
  "title": "采购用品",
  "kind": "purchase",
  "table": "random_table/市场用品",
  "budget": 20,
  "currency": "银币"
}
```

采购表须有非空 `creation.entries`，每项提供非负 `price` 和授予物品的 `tasks`。玩家每项选择 0–100 件，平台检查总价不超过预算；默认可以保留余款，要求正好花完时设置 `spendAll: true`。`currency` 只显示单位，不参与换算。采购不会自动将余款写入某个货币字段，角色货币和授予规则须由模组显式定义。

## 秘密结果、交换与确认

读取非公开来源或写入非公开目标的任务必须设置 `private: true`。秘密结果不能写入公开字段；公开对象里的私密子字段应通过独立任务绑定子路径。秘密任务的属性会传给嵌套任务，所属玩家可以在自己的工作台查看，其他玩家不会收到秘密值或进度。

`workbench.swap` 可以列出允许互换的数字字段，例如 `["attributes.strength", "attributes.dexterity"]`。路径须指向已声明的非计算数字字段，不能重复；确认前最多选择一对互换，也可以恢复原顺序。

点击生成时，只会补齐当前阶段缺失的随机结果；重复生成、返回浏览和重新打开不会重掷已有骰值。更改文档选择会重新结算当前分支，原分支随机历史仍保留。确认时重新按任务计算角色原始值，[计算字段](compute.md)由公式生成，派生结果不写回角色。

建卡预览和核对共用[详情布局](layout.md)。修改模组后先做[CLI 校验](cli.md)，再由开发者手动新建冒险，检查每个选择分支、生成、返回、采购与确认。条件能力、战斗结算和运行中的状态不要在建卡时提前结算。
