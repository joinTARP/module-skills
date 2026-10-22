<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/doc-types.md; sha256: a8250f31c26513f5a71bb5800abf257eadcb0af3e64eb1c964ede7b73cbfae32 -->

# 文档类型与字段

先完成[最小模组](structure.md)，再用本页扩展角色、地点等文档。类型定义告诉应用，一份文档有哪些字段、值应当是什么格式、游戏中能否修改。你可以按模组需要命名类型，例如角色、地点、物品或线索；平台不预设某套规则的字段。选择数据归属、原始值与计算方式时，先看[字段建模与计算选择](field-modeling.md)。

## 类型名和文件名

`.types/character.fields.toml` 定义的类型标识是 `character`。类型里的 `name` 是显示名称，可以省略，也可以与文件名不同。本文示例统一使用英文类型 ID；类型 ID 和对应目录名不限于英文，也可以使用中文等名称，只需与类型定义及引用保持一致。游戏文档的一级文件夹必须使用已定义的类型标识，类型由一级目录决定，文件名不再重复类型：

```text
character/阿青.toml
character/阿青.json
character/阿青.md
```

这三行是同一份文档的三种可选写法，只能保留其中一份。同一类型下的其他文档可以使用不同格式，例如阿青用 TOML、另一名角色用 Markdown。

类型目录内允许继续嵌套分组，所有子目录中的文档仍属于一级目录对应的类型。例如 `rule/探险规则/时间与并行.md` 和 `rule/战斗规则/伤害.md` 都属于 `rule` 类型，探险规则与战斗规则只是分组。不同分组可以存在同名文档，引用时必须带上完整分组路径。

游戏文档不能直接放在模组根目录，也不能放在未定义类型的一级目录中。`.types/`、模组配置、阅读页和图片等附件按各自规则组织，不从所在目录推导文档类型。

类型定义和布局接受 JSON 或 TOML。内容文档接受 JSON、TOML 和 Markdown，格式由扩展名决定；内容中不要重复填写 `doc_type`。

## 七种字段

| `type`      | 保存的值                        | 需要补充的定义                           |
| ----------- | ------------------------------- | ---------------------------------------- |
| `text`      | 字符串，如 `"1d6+3"` 或一段说明 | 无                                       |
| `number`    | 有限数值，如 `6`、`1.5`         | 无                                       |
| `boolean`   | `true` 或 `false`               | 无                                       |
| `enum`      | 固定选项中的一个字符串          | 非空且无重复的 `options`                 |
| `reference` | 一份文档的引用标识              | 非空且无重复的 `targets`，目标类型须存在 |
| `list`      | 相同元素类型的数组              | `item` 指定元素类型                      |
| `object`    | 一组命名子字段                  | 非空的 `fields`                          |

`list.item` 可以是前五种类型或 `object`。列表不能直接套列表；需要更复杂的结构时，在对象条目中定义子列表。`object` 的子字段可以继续嵌套对象或列表。

下面是一份完整的 `.types/character.fields.toml`，可替换[模组结构](structure.md)中的角色定义。它用到了七种字段，引用的地点类型沿用最小模组中的定义。

```toml
designation = "character"
name = "角色"

[fields.hp]
type = "number"
label = "生命值"
required = true
mutable = true

[fields.notes]
type = "text"
label = "随身记事"
mutable = true

[fields.torchLit]
type = "boolean"
label = "火把已点燃"
mutable = true

[fields.profession]
type = "enum"
label = "职业"
options = ["摆渡人", "药师", "旅人"]

[fields.hometown]
type = "reference"
label = "故乡"
targets = ["location"]

[fields.tags]
type = "list"
label = "特点"
item = { type = "text" }

[fields.attributes]
type = "object"
label = "属性"

[fields.attributes.fields.strength]
type = "number"
label = "力量"
required = true
mutable = true

[fields.gm_notes]
type = "text"
label = "主持备注"
visibility = "gm"
```

对应的 `character/阿青.toml`：

```toml
name = "阿青"
description = "熟悉河道的年轻摆渡人。"
hp = 6
notes = "渡口的绳子是新割断的。"
torchLit = false
profession = "摆渡人"
hometown = "location/河岸"
tags = ["熟悉水路", "会修船"]
gm_notes = "阿青见过失踪船夫离开渡口，但不知道他的去向。"

[attributes]
strength = 9
```

类型中的 `label` 决定属性的显示名称，省略时显示字段键。字段键仍用于文档数据、公式和更新路径；改标签不会改数据的键。

## 主持按需查阅类型定义

主持读取 `.types/*.fields.json` 或 `.toml` 时，得到解析后的结构化定义。只需确认某个字段时，可以使用 `fields` 选择定义中的 JSON Pointer，例如 `/fields/equipment`；嵌套定义路径保留实际的 `fields`、`item` 层级。返回的 `content` 按指针列出所选定义，`constraints` 补充必要的祖先字段约束，例如列表修改权限和实例绑定，不重复附带祖先的全部子字段。省略 `fields` 仍可读取完整定义，类型定义始终只读。

资料索引按类型和目录分组，目录下列出相对文件名；读取时用上方目录拼接文件名，根目录的文件直接使用文件名。文件名保留类型与扩展名。

批量查阅时，主持优先选择相关状态字段，并在脚本内筛选、计算，只输出裁定所需的依据、结果和路径；必要原值与修改约束仍须保留。未知规则允许完整查阅。角色行装中的实例状态与引用物品中的机制、实例字段定义分别按需读取，不能相互替代。

## 必填、可修改和可见性

`required` 默认是 `false`。设置为 `true` 后，文档必须提供该字段；必填文本也不能只有空白。可选字段没有值时直接省略，不用空字符串或 `null` 占位。上例的 `attributes` 可省略，但一旦填写，里面的 `strength` 必须存在。

`mutable` 默认是 `false`。显式设为 `true`，主持的 `update` 和 `batch_update` 工具才能在游戏中修改它。这个标记只限制游戏中的更新，作者编写预设资料或玩家建卡时仍可填写初始值。对象容器与子字段各自有标记：上例允许更新 `attributes.strength`，没有开放整组 `attributes` 的替换。

主持更新使用 JSON Patch 的 `add`、`replace`、`remove`、`test` 操作，仍须遵守字段权限；数组插入或删除需要列表本身可修改，不能仅凭某个列表子字段可修改就改变列表结构。关联的多份已有文档可用 `batch_update` 共同校验；创建新文档仍使用 `write`。

冒险中的游戏文档统一保存为 JSON。读取、更新及按文件搜索时，`location/河岸`、`location/河岸.md`、`.toml` 和 `.json` 都按同一文档标识解析；一级类型目录和完整分组路径不能省略。同一文档不能通过不同扩展名重复创建或在同一批更新中出现多次。`write` 接收字段对象，正文使用 `body`，即使输入路径带 `.md` 或 `.toml`，也保存为 `.json`；目录、字段定义及 `find` 搜索模式仍使用实际文件名。

`visibility` 默认是 `public`，玩家能看到。`gm` 字段供主持读取，普通游戏视图会过滤掉；房主可以在调试模式中查看原始资料。嵌套字段也遵循这一规则，父对象隐藏后，其子字段也不会公开。

`hideWhenEmpty` 默认是 `false`。设为 `true` 后，字段值为数字 `0`、空字符串 `""`、`null`、缺省值或空列表 `[]` 时，角色卡、详情和摘要会隐藏该字段的标题与内容；有值时自动显示。布尔值 `false`、空对象 `{}`、空白字符串和包含元素的列表不属于这里的空值。对象和对象列表的子字段也支持此配置；表格保留列结构，隐藏对应单元格的值。

```toml
[fields.effects]
type = "list"
label = "状态效果"
mutable = true
hideWhenEmpty = true

[fields.effects.item]
type = "text"
```

该配置只影响展示，不删除原始值、不改变计算结果，也不放宽必填、类型或修改权限校验，可以与 `mutable` 或 `compute` 一起使用。普通字段仍不能用 `null` 代替合法类型值；计算字段返回 `null` 时也遵循 `hideWhenEmpty`：未配置或设为 `false` 时保留字段并显示“暂无数据”，只有设为 `true` 才隐藏。 该配置只处理合法空值；公式失败时显示“计算失败”，不受空值隐藏配置影响，错误详情可展开查看。

名称、简介、图片、头像和正文使用系统内置的文本字段，默认公开，也可在 `fields` 中声明计算和可见性。

类型用途 `designation` 可省略，`character` 用于选角和建卡，`world_state` 用于世界状态卡，可标记多个类型，每个类型也可提供多份文档；状态建模见[自定义游戏状态](state.md)。

不要把尚未揭示的秘密直接放在公开字段中；需要逐步公开信息时，可以保留计算字段的同名原值，或用主持字段保存独立事实，再通过[计算字段](compute.md)决定公开值。没有列入布局的字段仍然保留在数据里，字段权限要在类型定义中声明。

文档顶层 `computed` 和 `instance` 均为配置保留字段，不能在类型中声明为业务字段。`computed` 是公式覆盖区；嵌套业务对象中的同名字段不受影响。它可以为当前文档的已声明只读字段提供公式，优先于类型默认 `compute`，并继续使用原类型和可见性校验。路径、三种格式与嵌套字段的写法见[单份文档公式覆盖](compute.md#在单份文档中覆盖公式)。

## 角色用途与数据归属

`designation: "character"` 声明的是平台角色用途，不是某套规则的职业，也不代表该角色已经被选择或入场。角色类型可以叫“调查员”“冒险者”或其他名称；目录名和文档正文里的“角色”字样不会赋予这一用途。

实体需要参与选角或建卡、由玩家或 AI 队友控制时，其类型需要 `character` 用途。其他 NPC、怪物或同行者可以使用普通类型，其位置和参与关系由模组字段定义，不需要为了场景归属注册角色用途。

角色文档保存能力、个人资源、持有物、效果和经历；世界文档保存全局进度与场景，地点和其他实体保存自身变化。不要把角色数值再复制到世界文档，也不要为角色卡另建第二份角色数据。角色卡通过[展示布局](layout.md#自定义布局与游戏卡片)读取同一文档。

玩家绑定、运行时角色 ID、版本及来源路径由平台管理，不需要在模组中仿造 `playerId`、`sourcePath` 或其他运行时记录。玩家是否控制角色以本局确认和占用记录为准；角色在何处、是否参与当前事件则由模组状态解释，不把所有预设角色自动当作队员。

## 整份文档是否显示

类型顶层可配置 `displayWhen` 表达式，返回 `true` 显示、`false` 隐藏；省略时默认显示。条件只接受布尔值。结果无效时，界面会隐藏文档，校验和写入则会报错并拒绝操作。该条件控制游戏中的整份资料入口，模组库和主持读取仍提供完整资料。

字段 `visibility` 控制公开范围，`compute` 返回 `null` 并配置 `hideWhenEmpty = true` 可以隐藏单个字段；整份资料的显示条件、引用链揭露示例与错误规则见[计算字段](compute.md#整份文档的显示条件)。

## 引用一份文档

引用使用从模组根目录出发、带类型名的路径，推荐省略文件扩展名：

```text
location/河岸
item/火把
```

也支持带 `.json`、`.toml` 或 `.md` 扩展名的写法，例如 `location/河岸.json`。引擎按去除格式扩展名后的文档标识解析引用，两种写法可以互通；默认推荐省略扩展名。

`targets = ["location"]` 表示该字段允许引用地点类型。可以列出多个类型，但它们都必须在同一 `.types/` 中定义。文档值的基础校验只要求引用为非空字符串，仍需检查目标是否存在、类型是否匹配；失效引用不会自动按标题寻找替代文件。

对象和对象列表也能包含引用。下面是角色字段定义中可追加的一个完整字段片段；使用前还需创建 `.types/item.fields.toml` 和对应物品文档。

```toml
[fields.equipment]
type = "list"
label = "随身物品"
mutable = true

[fields.equipment.item]
type = "object"

[fields.equipment.item.fields.item]
type = "reference"
targets = ["item"]
required = true

[fields.equipment.item.fields.quantity]
type = "number"
label = "数量"
required = true
mutable = true
```

在 `character/阿青.toml` 末尾追加以下顶层列表。如果已有 `equipment` 条目，直接更新原条目，避免重复记录：

```toml
[[equipment]]
item = "item/火把"
quantity = 2
```

同一物品的规则写在物品文档，角色上的条目记录本角色携带的数量。背包、装备槽和字段表格的展示写法见[展示布局](layout.md)。

图片风格、明暗主题适配、素材制作、路径组织与验收见[图片资源](images.md)。

## 正文与三种格式

每份文档支持五个内置文本字段：`name`、`description`、`image`、`avatar`、`body`。默认不必声明；需要计算、可见性或修改规则时，可以像普通字段一样在 `fields` 中定义。`name` 省略会使用文件名中的名称。声明 `compute` 后，文档仍可保存原始名称，公式通过 `$raw.name` 读取它，游戏展示使用计算结果。普通计算字段同样允许保存原值，仍不能同时标记 `mutable`。

`description` 是可选简介。省略时，卡片、目录表格的简介列和悬浮预览使用正文的纯文本摘要；短正文无需再填写一份相同的简介。填写后则优先显示简介。详情页只展示实际填写的简介，是否显示由作者的详情布局控制，不会把正文再作为简介重复显示。`image` 是封面路径，`avatar` 是专用头像路径。手填 `name`、`description`、`image`、`avatar` 时必须为非空文本；聊天头像优先用 `avatar`，缺少或无法解析时回退到 `image`，详情和预览仍用 `image`。图片可填模组内相对路径或 HTTP(S) 地址。

Markdown 把属性写在开头的 YAML 属性区（frontmatter），把正文写在分隔线之后。下面是阿青的 Markdown 写法；换用它时，删除同名的 TOML 文档。

```markdown
---
name: 阿青
description: 熟悉河道的年轻摆渡人。
hp: 6
profession: 摆渡人
hometown: location/河岸
attributes:
  strength: 9
---

# 阿青

他小时候就在[[location/河岸]]帮人撑船。
```

frontmatter 可以省略，前提是类型没有要求必填字段。Markdown 正文会作为 `body` 读取，不要在 frontmatter 里另写一份 `body`。正文支持双链 `[[location/河岸]]`，也支持标准链接 `[河岸](location/河岸)`；匹配到模组内文档后，悬浮可预览，点击可打开详情。

JSON 和 TOML 把正文写在顶层 `body`。TOML 的普通键属于当前表，`name`、`hp`、`body` 等顶层字段应写在 `[attributes]` 这类表头之前。例如，下面是顶层字段片段：

```toml
body = '''
# 阿青

他小时候就在[[location/河岸]]帮人撑船。
'''
```

开发者手动验收：保存后打开阿青的详情，应看到生命值和职业，正文中的河岸引用可以打开地点资料。

三种格式使用相同的字段校验、计算和修改权限。源文档中的字段设为 `mutable = true` 后，主持可在游戏中更新对应字段；冒险中的文档统一保存为 JSON，不写回源 Markdown 的 frontmatter。正文可通过显式声明 `fields.body.mutable = true` 开放修改；计算正文可以保存原始正文，但不能在游戏中直接修改，变化通过独立状态字段驱动。TOML 不支持 `null`；需要省略可选字段时，直接移除该项即可。

## 值校验与格式限制

字段类型不会自动转换：`number` 必须是有限数值，`boolean` 必须是布尔值，`enum` 必须属于选项，引用必须为非空字符串。字符串 `"6"` 不是数字 `6`。普通可选字段可以缺省，`null` 不是上述字段类型的通用空值；计算展示字段允许返回合法空结果 `null`，是否隐藏由 `hideWhenEmpty` 决定，见[计算字段](compute.md)。

普通内容文档目前保留未声明的顶层字段和对象子字段，不会因未知字段而整体拒绝；这些字段的类型、权限和展示方式都未定义。应把实际使用的字段写进类型定义，不依靠未知字段隐藏秘密。计算字段可以在预设文档中保存符合声明类型的同名原值，通过 `$raw` 读取；建卡对象输入只接受已声明的普通字段。模组元配置、字段定义、布局与任务配置会拒绝不认识的配置键，拼写错误应修正，而不是等待应用猜测。

TOML 与 JSON 共享字段规则，但写法有以下限制：

- TOML 没有 `null`；可选值缺省时移除字段，需要保存其他允许空值的原始资料时选用 JSON。运行中的更新可以删除可选字段。
- 中文键及含 `/`、`.` 等字符的键用引号，例如 `[computed."skills.hard"]`。
- 日期时间使用带引号的字符串，不使用 TOML 日期对象；`inf`、`nan` 和原型污染相关危险键会被拒绝。
- `[attributes]` 后面的普通键属于该表，顶层名称、正文等放在表头前；多行文本的首尾换行属于正文内容。
- 运行中的修改保存在当前冒险的资料覆盖中，不重写源模组。本局新建文档统一保存为 JSON，源 TOML 的排版与注释不会作为运行中的文档格式保留；作者维护的模组元配置由应用读取。

需要系统检查引用、布局和完整开局时，用[模组 CLI](cli.md)。

## 引用定义与实例状态

同类物品拥有不同的状态结构时，由具体物品文档声明顶层 `instance`，角色只保存持有记录。平台不预设燃料、耐久或使用次数。

例如 `item/计时器.json`：

```json
{
  "name": "计时器",
  "slots": 1,
  "instance": {
    "fields": {
      "remaining": {
        "type": "number",
        "required": true,
        "mutable": true,
        "label": "剩余分钟"
      },
      "occupied": {
        "type": "number",
        "compute": "$definition.slots",
        "label": "占格"
      }
    },
    "display": ["remaining", "occupied"]
  }
}
```

`instance.fields` 复用普通字段的类型、必填、可修改、可见性、嵌套结构、空值隐藏与 `compute`。它属于具体引用文档，不放在角色类型或物品类型的字段集合中。`instance.display` 按顺序列出公开的文本、数字、布尔或枚举字段，最多 8 个，作为行装摘要；可以为空。

在角色类型中配置对象列表绑定：

```json
{
  "fields": {
    "equipment": {
      "type": "list",
      "mutable": true,
      "item": {
        "type": "object",
        "instance": { "referenceField": "item", "stateField": "state" },
        "fields": {
          "item": {
            "type": "reference",
            "targets": ["item"],
            "required": true
          },
          "quantity": { "type": "number", "mutable": true },
          "location": { "type": "text", "mutable": true }
        }
      }
    }
  }
}
```

`referenceField` 指向必填且没有公式的引用子字段；`stateField` 指定平台按引用定义解析的状态容器，不在 `item.fields` 中重复声明。绑定列表及其祖先必须是原始字段，不能由公式生成。每条记录显式提供 `state`：

```json
{
  "equipment": [
    {
      "item": "item/计时器",
      "location": "随身",
      "state": { "remaining": 20 }
    },
    {
      "item": "item/计时器",
      "location": "随身",
      "state": { "remaining": 45 }
    }
  ]
}
```

两条记录共享物品定义，各自保存独立状态。没有原始状态字段的定义也要写 `"instance": { "fields": {}, "display": [] }`，持有条目写 `"state": {}`。所有必需初值由作者或主持显式填写；平台不自动初始化。

状态严格校验：未知字段、必填缺失、错误引用、缺少实例定义均报错；计算字段不得出现在原始 `state` 中，也不能运行时更新。普通更新、批量更新、JSON Patch 和容器替换都检查实例字段权限。已有实例中的只读状态不能通过整体替换覆盖；结构化实例字段及需要修改的子字段都应声明 `mutable = true`。玩家不能改主持字段或整体覆盖实例容器。

第一版不支持独立实例文档、逐实例公式覆盖和在实例定义内再次绑定实例。没有 `item.instance` 的引用保持普通引用行为。公式上下文见[计算字段](compute.md#物品实例的公式上下文)，行装摘要见[引用集合](layout.md#实例摘要)。

## 类型介绍与主持索引

类型顶层的 `description` 用一句简短文字介绍用途，例如“玩家角色的能力、行装与当前状态”。它会完整进入主持的常驻资料索引，没有硬性长度限制，也不会自动截断或摘要。详细裁定、字段维护及对象专属机制应放入可查阅的主持手册或对应游戏资料，按情境查阅的入口统一写在模组 `hostPrompt` 中。类型介绍随公开类型数据传输，不用于保存幕后秘密。这里的类型介绍与文档自身的简介、正文是不同内容。
