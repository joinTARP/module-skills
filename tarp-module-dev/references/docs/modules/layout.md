<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/layout.md; sha256: acdc8287714afee40348e2bec314f20869f4d49479d4fabf3fe5dbe9467b52ab -->

# 展示布局

字段定义决定数据的含义，布局决定读者在哪里看到它。每种类型可以提供一份 `.types/类型.layout.toml` 或 `.layout.json`，可以与字段定义使用不同格式。省略布局时，应用按类型定义展示已有字段。

本页先使用[文档类型与字段](doc-types.md)中阿青的完整定义，再逐步加入物品和装备。开发者手动验收时，每次替换布局后重新打开阿青详情，就能检查该步骤的展示结果。

布局文件的根级包含 `detail`、`list`、`card`、`reference`、`hover`、`sheet` 和 `displayFields`。各部分均可省略；未配置 `detail` 时使用默认详情。

## 按使用目的选择展示

| 需要呈现的内容         | 选择                                          | 需要明确的边界                                                    |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| 简短属性与说明         | 普通 `grid`，长正文较多时用 `split`           | 布局引用已声明的事实，不复制数据                                  |
| 当前资源与上限         | Handlebars 模板中的 `<meter>` 或 `<progress>` | 明确配对公开数字，资源条不自动治疗、扣值或限制上限                |
| 可查阅的物品或能力集合 | `ReferenceCollection`                         | 纯引用适合只关联资料，数量和余量需要对象条目                      |
| 多列技能、持有物或记录 | `FieldTable`                                  | 需要稳定且唯一的 `rowKey`，名称或列表下标不适合作为会变化的行身份 |
| 固定穿戴部位           | `EquipmentSlots`                              | 部位字段记录装备，组件不执行换装或背包同步                        |

只要普通展示足够清楚，就可以省略专用组件。用格子展示背包不意味着格数就是规则容量，装备图标也不意味着平台会裁定穿戴限制。容量、负重、数量、消耗和换装条件仍由字段与模组规则表达。

## 详情、列表和卡片各配各的

以下是完整的 `.types/character.layout.toml`，使用[文档类型与字段](doc-types.md)中的角色定义：

```toml
[detail]
type = "split"
columns = 2
imageAspect = "portrait"
fields = [ "hp", "profession", "torchLit", "attributes.strength" ]
contentFields = [ "notes" ]
order = [ "description", "fields", "body" ]

[list]
type = "table"
fields = [ "profession", "hp" ]
description = true

[card]
image = "cover"
imageAspect = "2:3"
fields = [ "profession", "hp" ]

[reference]
style = "link"

[hover]
enabled = true
width = "md"
image = "thumbnail"
imageAspect = "square"
columns = 2
fields = [ "hp", "attributes.strength" ]
```

`detail.type` 设为 `"split"` 把短属性放在左栏，长内容放在右栏。`fields` 是左栏字段，`contentFields` 是右栏字段；右栏的 `order` 中，`fields` 代表 `contentFields`。名称和图片来自文档元数据，随左栏内容滚动；右栏内容纵向展开，左右栏分别滚动，窄窗口上下排列。双栏详情的 `imageAspect` 控制图片区比例；详情、卡片和悬浮预览各自配置，规则见[图片比例由布局决定](#图片比例由布局决定)。

普通详情用 `grid`。若更适合把属性、简介和正文依次排下来，可将整个布局文件换成：

```toml
[detail]
type = "grid"
columns = 2
fields = ["hp", "profession", "attributes.strength", "notes"]
order = ["fields", "description", "body"]
```

`columns` 支持 1–4，默认 2，控制普通详情的属性列数或双栏左侧的属性列数；双栏右侧始终纵向排列。普通详情的图片、名称和正文一起滚动，不提供固定标题栏；自定义节点布局自行安排名称和图片的位置。`order` 用来安排字段、简介和正文，只写需要展示的区块，不能重复。`fields` 至少要有一项；双栏的 `contentFields` 可为空。`order` 默认 `["fields", "description", "body"]`。

指定布局后，只显示其中列出的字段；字段缺失时也不会补上其他字段。路径支持 `attributes.strength` 这样的对象子字段。路径必须存在，详情左右栏之间也不能重复指定同一字段。

## 图片比例由布局决定

`imageAspect` 控制图片区的宽高比，不规定整张卡片的比例，也不修改图片文件。同一类型可以按展示用途分别设置：

| 配置位置                               | 生效位置                              | 默认值   |
| -------------------------------------- | ------------------------------------- | -------- |
| `detail.imageAspect`                   | `split` 双栏详情中的主图              | `square` |
| `card.imageAspect`                     | 文档目录、选角等列表卡片的封面        | `square` |
| `hover.imageAspect`                    | 悬浮预览的封面或缩略图                | `square` |
| `detail.fieldViews.<字段>.imageAspect` | `ReferenceCollection` 的 `cards` 模式 | `"4:3"`  |

这些位置使用同一组比例规则：

| 写法               | 比例               | 适用构图示例                       |
| ------------------ | ------------------ | ---------------------------------- |
| `"square"`         | 1:1                | 方形人物立绘、物品图、头像式缩略图 |
| `"portrait"`       | 4:5                | 竖幅人像与角色形象                 |
| `"landscape"`      | 3:2                | 场景和环境插画                     |
| `"2:3"`、`"3:4"`   | 自定义竖幅         | 较长的角色立绘或海报               |
| `"16:9"`、`"9:16"` | 自定义宽幅或窄竖幅 | 横向原画或加载卡式人物图           |

自定义比例写成 `"宽:高"`，宽、高均须为 **1–9999 的整数**，例如 `"185:100"` 表示 1.85:1。不能使用零、负数、小数、`"16/9"` 或 `"auto"`。

下面是上方完整示例中的三个图片设置，可以分别替换对应部分的 `imageAspect`，替换对应配置，不要追加重复的 TOML 表：

```toml
[detail]
type = "split"
imageAspect = "2:3"
fields = [ "hp" ]

[card]
image = "cover"
imageAspect = "16:9"

[hover]
image = "thumbnail"
imageAspect = "square"
```

图片区随可用宽度按比例调整高度，不再使用固定封面高度。图片在框内等比完整展示，保持原图比例、不拉伸、不裁切；源图与展示框比例不同会留白。需要强调人物或环境时，先设计素材构图，再选择对应的展示比例。尺寸与构图建议见[图片资源](images.md#按用途选择图片)。

`card.image` 或 `hover.image` 设为 `"none"` 时不显示图片区。`ReferenceCollection` 的 `list` 模式保留紧凑方形缩略图，`slots` 模式保留方形格子；聊天头像及装备部位图也不受上述比例设置影响。

## 预览配置的范围

| 部分        | 控制什么               | 常用配置                                                                                                                     |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `list`      | 文档目录页             | `type` 为 `cards` 或 `table`；表格附加字段最多 8 项；`description` 控制简介列                                                |
| `card`      | 文档卡片               | `image` 为 `cover` 或 `none`；`imageAspect` 控制图片比例；简介显示 0–4 行；字段最多 6 项                                     |
| `reference` | 结构化字段里的引用入口 | `style` 为 `link` 或 `badge`                                                                                                 |
| `hover`     | 引用的悬浮预览         | 可关闭；宽度为 `sm`、`md`、`lg`；图片为 `none`、`thumbnail`、`cover`；`imageAspect` 控制图片比例；简介 0–6 行；字段最多 8 项 |

Markdown 正文中的双链和文档链接统一显示为普通文字链接，不受 `reference.style` 影响；点击查看详情和悬浮预览继续可用。`reference.style` 只控制结构化字段里的引用入口。

未配置预览字段时，卡片和悬浮预览只显示名称、类型、可选图片与简介，不会复制详情中的字段。目录表格始终有名称列，未配置附加字段时仍可显示简介。

预览优先使用文档的 `description`；省略时使用 `body` 的纯文本摘要，去掉 Markdown 格式标记与链接地址。卡片默认最多显示 2 行简介，悬浮预览默认最多显示 5 行；大多数模组可省略 `card`、`hover` 或其中的 `descriptionLines`，需要调整时再显式配置。两者按各自的 `descriptionLines` 限制行数；设为 `0` 会同时关闭简介和正文摘要。目录表格用 `list.description` 控制这一列。详情页由 `detail.order` 或自定义描述节点控制，只展示实际填写的简介，不使用正文兜底。

省略设置时，各部分使用以下默认值：

- `list`：`"type": "cards"`，`"description": true`。
- `card`：`"image": "cover"`，`"imageAspect": "square"`，`"descriptionLines": 2`。
- `reference`：`"style": "link"`。
- `hover`：`"enabled": true`，`"width": "md"`，`"image": "thumbnail"`，`"imageAspect": "square"`，`"descriptionLines": 5`，`"columns": 2`。

悬浮宽度 `sm`、`md`、`lg` 对应 256、320、384 像素并受视口限制，列数支持 1 或 2。三个预览场景的附加字段默认都是空列表。目录按配置固定展示方式，界面不提供切换按钮。

预览字段提供简短的纯文本摘要，长值会截断，对象和列表显示数量。同一处展示中不能重复列出字段，列表、卡片和悬浮预览之间可以复用，也可以配置主持字段。模组库按同一布局展示完整资料，游戏只展示自身和父级均为公开的字段；空值仅在字段配置 `"hideWhenEmpty": true` 时隐藏；未配置时，计算结果为 `null` 的字段保留标题并显示“暂无数据”。计算失败显示独立提示，错误详情按需展开，不受空值隐藏配置影响。详情同样遵循当前查看范围，布局不会授予运行时修改权限。

整份资料的显示由类型定义中的 `displayWhen` 控制，布局不另配显示条件。游戏目录、卡片和引用先确认文档可见，再应用布局；模组库共用这份布局并显示完整资料。条件规则与引用链揭露示例见[计算字段](compute.md#整份文档的显示条件)。

### 自定义卡片与悬浮内容

`card.content` 和 `hover.content` 可以各自配置 Handlebars 模板，与 `detail`、`sheet` 独立。未配置 `content` 时使用默认摘要。

```json
{
  "card": {
    "content": {
      "type": "handlebars",
      "templateFile": ".types/物品卡片.hbs",
      "styleFile": ".types/物品卡片.css"
    }
  },
  "hover": {
    "enabled": true,
    "width": "lg",
    "content": {
      "type": "handlebars",
      "template": "<h3>{{name}}</h3><p>{{description}}</p>"
    }
  }
}
```

两处 `content` 与[Handlebars 模板](#handlebars-模板)使用相同的数据、文件来源、partial、CSS 和组件绑定规则。配置模板后，它负责内部内容；默认摘要的 `image/imageAspect/descriptionLines/fields/columns` 不会额外插入模板。未引用或条件隐藏的字段计算错误仍由平台提供诊断。

列表卡片的排列、外框、打开详情或选角行为由平台维护；模板内部的链接、图片预览等操作不会同时触发外层卡片。模板需要的标题和说明由作者自己编排。

悬浮框容器始终由平台提供，包括背景、边框、阴影、宽度、定位、延迟、滚动区域和关闭行为。`hover.enabled` 与 `hover.width` 对自定义内容仍有效，模板只替换框内内容。模板在打开悬浮框时挂载，关闭后卸载。物品实例的额外摘要继续在模板之后显示，不需要模板重复声明。

## 把物品列表显示为背包

`detail.fieldViews` 可以给某个字段指定展示组件。字段先要列入 `detail.fields` 或双栏的 `contentFields`，自身及父级也都要公开。

下面沿用角色类型，为随身物品定义带数量和位置的条目。用这个片段替换已有的 `fields.equipment` 定义：

```toml
[fields.equipment]
type = "list"
label = "随身物品"
mutable = true

[fields.equipment.item]
type = "object"

[fields.equipment.item.fields.id]
type = "text"
required = true

[fields.equipment.item.fields.item]
type = "reference"
targets = ["item"]
required = true

[fields.equipment.item.fields.quantity]
type = "number"
label = "数量"
required = true
mutable = true

[fields.equipment.item.fields.location]
type = "enum"
label = "位置"
options = ["背包", "穿戴"]
mutable = true
```

物品类型也需要存在。最小的 `.types/item.fields.toml` 可以写 `name = "物品"`，再创建 `item/火把.md`：

```markdown
# 火把

照亮附近，遇水容易熄灭。
```

在 `character/阿青.toml` 中，用下面条目替换前一页的原有 `equipment` 条目，保留其他角色字段。这里补上了唯一 `id`，供后面的表格识别行：

```toml
[[equipment]]
id = "torch"
item = "item/火把"
quantity = 2
location = "背包"
```

用下面这份完整 `.types/character.layout.toml` 替换本页开头的布局。保存后应看到生命值和 20 格背包，其中一格显示火把，数量为 2：

```toml
[detail]
type = "grid"
fields = ["hp", "equipment"]

[detail.fieldViews.equipment]
type = "ReferenceCollection"
referenceField = "item"
display = "slots"
slotCount = 20
quantityField = "quantity"
filterField = "location"

[[detail.fieldViews.equipment.metadata]]
field = "quantity"
label = "数量"

[[detail.fieldViews.equipment.metadata]]
field = "location"
label = "位置"
```

`ReferenceCollection` 支持 `slots` 物品格、`cards` 资料卡、`list` 列表和 `sheets` 嵌入文档卡片，默认 `cards`。嵌入卡片的配置见[嵌入文档卡片](#嵌入文档卡片)。搜索和视图切换默认开启，可用 `searchable`、`switchable` 关闭。`filterField` 按条目的值生成分类按钮，`metadata` 按顺序显示附加字段，最多 8 项。

对象条目中的 `referenceField` 必须是公开引用字段，`quantityField` 必须是公开数字字段，分类和附加字段只能是公开的文本、数字、布尔或枚举。纯引用列表也能用这个组件，此时省略 `referenceField`、`quantityField`、`filterField` 和 `metadata`。

物品格一条记录占一格，数量显示在角落。`slotCount` 范围是 1–200，默认 20；超出时仍会显示所有条目。格数用于展示，负重和规则上的占格需要另外定义。搜索、筛选和切换不会写入存档。筛选时隐藏空槽，清除筛选后恢复。模组库中的失效引用保留条目与附加值并提示不可用；游戏中未取得当前版本结果的引用暂不展示，目标明确不可用时显示通用提示。集合字段支持对象点路径，条目配置只接受直接子字段名。

游戏中的隐藏目标不参与集合搜索、分类和数量统计，也不展示条目附加值。固定物品格仍保留配置的展示容量；隐藏不删除真实记录，也不改变数量、负重或装备效果。

## 装备部位

用 `EquipmentSlots` 可以列出主手、副手等固定部位。部位绑定对象中的公开引用子字段。给角色类型追加：

```toml
[fields.equipped]
type = "object"
label = "装备"

[fields.equipped.fields.mainHand]
type = "reference"
targets = ["item"]
mutable = true

[fields.equipped.fields.offHand]
type = "reference"
targets = ["item"]
mutable = true
```

在角色文档的开头、任何 `[attributes]` 或 `[[equipment]]` 表头之前填写 `equipped = { mainHand = "item/火把" }`，未使用的部位省略。在本页的背包布局中，将 `detail.fields` 改成 `["hp", "equipment", "equipped"]`；使用其他布局时将 `equipped` 加入 `fields` 或 `contentFields`。向该布局追加以下片段：

```toml
[detail.fieldViews.equipped]
type = "EquipmentSlots"

[[detail.fieldViews.equipped.slots]]
field = "mainHand"
label = "主手"
icon = "hand"

[[detail.fieldViews.equipped.slots]]
field = "offHand"
label = "副手"
icon = "shield"
```

`slots` 按顺序定义 1–24 个部位，同一子字段不能重复。图标支持 `head`、`body`、`feet`、`hand`、`shield`、`accessory`，默认 `accessory`；图标只影响外观，穿戴限制由模组规则处理。

空部位显示“未装备”，有物品时显示名称和图片，点击可查看资料。装备区和背包可以同时显示，各自读取绑定字段。组件目前不提供拖拽、换装或消耗操作，背包数量与装备部位也不会自动同步。

如果装备目标被 `displayWhen` 隐藏，只保留部位标签和图标，不显示名称、图片或详情入口，也不标为“未装备”；真实装备状态保持不变。

## 技能或物品表格

`FieldTable` 适合对象列表中的多列数据。将前面的 `equipment` 展示配置整体替换为以下片段，即可按表格查看物品。保留 `detail` 和其他字段组件，只替换 `equipment` 原来的 `ReferenceCollection` 表及其 `metadata`：

```toml
[detail.fieldViews.equipment]
type = "FieldTable"
rowKey = "id"
searchable = true

[[detail.fieldViews.equipment.columns]]
field = "item"
label = "物品"

[[detail.fieldViews.equipment.columns]]
field = "quantity"
label = "数量"

[[detail.fieldViews.equipment.columns]]
field = "location"
label = "位置"
```

保存后，背包应变成含“物品”“数量”“位置”三列的表格，火把显示在同一行；点击物品引用仍可查看火把资料。

`rowKey` 必须是条目的公开文本、数字或引用字段，每行提供非空且唯一的值；数字 `0` 有效，数字 `0` 与文本 `"0"` 视为重复。表格接受 1–8 列公开的标量或引用字段，禁止重复列，省略列标签时使用字段标签。需要默认折叠一组条目时，可配置 `collapsedGroup`，用公开布尔字段把值为 `false` 的条目归入折叠组。搜索默认关闭，设置 `"searchable": true` 后仅搜索可见列，命中折叠组时展开结果。

例如，先在角色字段定义中给每条物品记录增加公开布尔字段：

```toml
[fields.equipment.item.fields.trained]
type = "boolean"
label = "已掌握用法"
```

角色的每条 `equipment` 记录填写 `trained = true` 或 `false`，然后在上面的表格布局追加：

```toml
[detail.fieldViews.equipment.collapsedGroup]
field = "trained"
label = "尚未掌握用法的物品"
```

`field` 和 `label` 都必填；标签描述值为 `false` 的折叠组，技能表也可按相同写法区分已训练和未训练技能。

## 嵌入文档卡片

纯引用列表可通过 `ReferenceCollection` 的 `display: "sheets"` 展示目标文档自己的 `sheet`。它适用于作者自定义的怪物状态、目标进度或其他需要常驻完整布局的资料，不要求目标文档是角色类型。

例如已在世界类型声明 `opponents` 为公开引用列表，可在 `.types/世界.layout.toml` 中配置世界卡（文件名应与实际类型标识一致）：

```toml
[sheet]
type = "handlebars"
template = '''
<section>
  <h2>当前对手</h2>
  {{#each values.opponents}}
    <tarp-reference value="{{this}}" display="sheet"></tarp-reference>
  {{/each}}
</section>
'''
```

普通 `grid/split` 详情可在 `detail.fieldViews.opponents` 配置 `ReferenceCollection`，设置 `display = "sheets"`；世界卡则使用上面的 Handlebars 模板逐项嵌入。

`opponents` 只是示例字段名，不是平台绑定。列表内容和更新时机由模组规则及主持维护；需要按场景或阶段筛选时，可以用计算字段生成引用列表。目标状态继续保存在目标文档，不需要拷贝到世界文档。目标未配置 `sheet` 时，按其详情字段生成布局。

每张嵌入卡片提供详情入口，显示内容遵守目标文档的字段权限与显示条件，并读取本局当前值。隐藏目标会撤下；循环引用和超过四层的嵌入会折叠为详情入口，避免无限展开。

嵌入卡片模式只接受纯引用列表；包含数量、持有状态等条目实例的对象列表继续使用原有卡片、列表或物品格展示。`switchable` 开启时可以在文档卡片和列表之间切换。

## 自定义布局与游戏卡片

角色卡与世界状态卡使用根级 `sheet`，详情使用 `detail`。两者共用字段和展示组件，分别选择展示内容，卡片字段不必先列入详情。字段定义控制公开性，布局不授予读取或修改权限。

普通详情继续使用前文的 `grid/split` 配置。需要自由排版时，将 `detail` 或 `sheet` 直接配置为 `type: "handlebars"`，使用 HTML、CSS 和模板条件编排内容。排版不使用递归 JSON 容器、`root` 或 `tabs`。

角色类型未配置 `sheet` 时按详情字段顺序生成默认卡片。`designation = "world_state"` 类型配置 `sheet` 后在游戏侧栏显示世界卡；可提供多份状态文档，分别以文档名称展示并独立折叠。未配置面板或当前不可见的世界文档不显示。嵌入卡片使用目标文档自己的 `sheet`，没有配置时使用默认卡片。列表、卡片与引用悬浮预览继续使用各自的简短字段配置。

### 文档详情弹窗宽度

`detail.width` 指定详情弹窗的期望外部宽度，单位为像素，支持 240–1600 的整数。`grid`、`split` 和 `handlebars` 详情均可配置。省略时普通详情最大宽度为 800 像素，双栏详情为 1000 像素；显式配置后以作者宽度为准，同时保留窗口两侧留白，避免弹窗超出窗口。

```json
{
  "detail": {
    "type": "handlebars",
    "width": 420,
    "templateFile": ".types/物品详情.hbs"
  }
}
```

配置式详情也可以直接在 `detail` 下填写 `width`，无需编写 HBS。宽度仅控制打开文档时的弹窗，不固定嵌入页面中的详情宽度，也不改变角色卡、列表卡片或悬浮预览的容器。模板内部仍按实际可用宽度布局。

### 角色卡侧栏与抽屉宽度

`sheet.width` 指定游戏中角色卡宿主的期望外部宽度，单位为像素，取 240–960 的整数；省略时使用 360。包含侧栏自身的内边距，模板内部应按容器宽度布局。

```json
{
  "sheet": {
    "type": "handlebars",
    "width": 420,
    "templateFile": ".types/角色.hbs"
  }
}
```

窗口有足够空间时，角色卡以固定宽度的侧栏展示；不足以同时保留聊天区域时，平台改为右侧抽屉。抽屉按作者声明的宽度展示，但不会超过窗口宽度。平台提供关闭按钮、遮罩和 Esc 关闭，不支持拖动调整宽度。切换角色类型后使用对应类型的宽度。

宽度仅控制游戏角色卡宿主，不改变普通详情、摘要卡片、悬浮框或嵌入文档卡片的容器。

### Handlebars 模板

详情、角色卡、世界卡与嵌入文档面板都可以使用 Handlebars 模板。平台通过 Web Component 承载 HBS 渲染器，作者继续编写模板，无需定义组件类或编写 JavaScript。详情和面板各自选择模板。

例如，给已有角色类型的 `.layout.json` 配置模板：

```json
{
  "detail": {
    "type": "handlebars",
    "templateFile": ".types/角色.hbs",
    "styleFile": ".types/角色.css"
  },
  "sheet": {
    "type": "handlebars",
    "templateFile": ".types/角色.hbs",
    "styleFile": ".types/角色.css"
  }
}
```

`.types/角色.hbs` 内容如下，类型需先声明数字 `hp`、`max_hp` 和文本列表 `effects`：

```handlebars
<section class='character'>
  <h2>{{name}}</h2>
  {{#if description}}<p class='summary'>{{description}}</p>{{/if}}
  <p>生命 {{values.hp}} / {{values.max_hp}}</p>
  <meter min='0' max='{{values.max_hp}}' value='{{values.hp}}'></meter>
  {{#if values.effects.length}}
    <ul>{{#each values.effects}}<li>{{this}}</li>{{/each}}</ul>
  {{/if}}
</section>
```

`.types/角色.css` 可以自由使用 CSS 排版和主题变量：

```css
.character {
  display: grid;
  gap: 12px;
}
h2 {
  margin: 0;
  text-align: center;
  color: var(--foreground);
}
.summary {
  margin: 0;
  text-align: center;
  color: var(--muted-foreground);
}
```

每个模板的样式独立封装，不会改变其他文档或应用页面。应用主题变量（如 `--foreground`、`--background`、`--muted-foreground`、`--border`）可直接使用，暗色主题会同步。模板内部已有 TARP 组件的应用样式也会保留。状态更新后模板及组件读取新投影重新展示。

#### 模板来源与数据

| 配置                         | 用途                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `template` 或 `templateFile` | 二选一：内联 Handlebars 文本，或模组根目录内的 `.hbs/.handlebars/.html` 相对路径 |
| `css` 或 `styleFile`         | 可选二选一：内联 CSS，或模组根目录内的 `.css` 相对路径                           |
| `partials`                   | 局部模板名称与内联文本映射                                                       |
| `partialFiles`               | 局部模板名称与模板文件路径映射，不能与 partials 重复命名                         |

文件路径从模组根目录开始，不能使用绝对路径、父目录跳转或指向模组外的符号链接。加载时将文件内容编入布局；已有冒险仍使用自己的模组副本，修改源模板后需同步模组或新建冒险。

模板提供以下数据：

- `name`、`description`、`body`、`image`、`avatar`：当前文档公开的基础属性。
- `values`：当前文档公开、已计算的模组字段，例如 `{{values.hp}}`，也可通过 `{{#each values.items}}` 遍历列表。
- `display`：已声明的展示计算结果，例如 `{{display.summary}}`。
- `errors`、`displayErrors`：字段和展示计算的错误通道。失败源值为空，不回退旧值；页面同时保留字段错误诊断。

普通游戏展示沿对象和列表子字段过滤非公开内容；模组库预览沿用作者可查看完整资料的规则。模板不能直接读取其他文档、原始数据或修改游戏状态。

支持 Handlebars 的 `if/unless/each/with/lookup`、`@index`、`@root`、partial 和 HTML 自动转义。额外提供 `eq` 比较 helper，例如 `{{#if (eq values.hp 0)}}已失能{{/if}}`；`{{field "hp"}}` 通过现有字段展示规则取值，读取失败时显示“计算失败”。复杂规则继续写在业务或展示计算中。

局部模板使用 `{{> summary}}` 引用，仅在当前节点生效，不会注册到其他模组或面板。引用不存在的 partial、模板语法错误或动态 HTML 错误会在该模板处显示诊断，不保留旧内容。

#### 普通数据与宿主组件

普通字段直接使用 `{{values.strength}}`，展示计算使用 `{{display.strengthHint}}`。标签、单位、小字、标题、分组和统计全部由模板表达；布尔值可用 `if/else` 转换文案，列表使用 `each`。字段错误仍由平台统一提供诊断，失败值在模板数据中为空，不回退原始值。不要依赖普通插值区分空值和错误，可使用 `errors` 与 `displayErrors` 判断。

```handlebars
<div class='stat' title='用于攀爬与推举'>
  <span>力量</span>
  <strong>{{values.strength}}</strong>
  <small>{{display.strengthHint}}</small>
</div>
```

需要媒体解析或文档交互时，直接使用组件标签和属性，无需命名 slot 或 JSON `components`：

| 标签             | 参数与能力                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tarp-reference` | `field` 绑定引用字段，或 `value` 传入引用路径，二选一；可选 `label`，默认解析文档名；`display="sheet"` 嵌入目标卡片，默认 `link` 提供悬浮及详情入口       |
| `tarp-item-grid` | `field` 绑定引用列表或对象列表；可选 `reference-field`、`quantity-field` 绑定公开子字段；`capacity` 指定展示槽位数量，默认 0；可选 `label` 提供无障碍名称 |
| `tarp-image`     | `field` 绑定图片文本字段；可选 `image-aspect`、`alt`，提供媒体解析与图片预览                                                                              |
| `tarp-markdown`  | `field` 绑定正文或其他文本字段，保留 Markdown 文档引用与图片能力                                                                                          |

```handlebars
<tarp-reference field='weapon'></tarp-reference>
{{#each values.spells}}
  <tarp-reference value='{{this}}'></tarp-reference>
{{/each}}
<section>
  <h3>行装</h3>
  <p>{{values.usedSlots}} / {{values.capacity}} 格</p>
  <tarp-item-grid
    field='inventory'
    reference-field='item'
    quantity-field='quantity'
    capacity='{{values.capacity}}'
    label='行装'
  ></tarp-item-grid>
</section>
<tarp-markdown field='body'></tarp-markdown>
```

上例需声明 `weapon` 引用字段、`spells` 引用列表、`usedSlots/capacity` 数字字段，以及包含公开引用子字段 `item`、数字子字段 `quantity` 的 `inventory` 对象列表。`capacity` 范围为 0–200，仅控制空槽展示；超出时保留全部条目，不代表规则容量限制。引用列表不配置 `reference-field/quantity-field`。

物品格只提供物品、空槽、图片、数量、悬浮和详情交互，不输出行装标题、占格计数、搜索栏或视图切换。规则占格、负重、装备部位及单位由模组定义；可通过多个引用组件自行编排装备位置。物品实例附加摘要继续在对应物品的悬浮中展示。引用隐藏目标时不会补出目标名称；嵌入卡片仍有循环与深度限制。

属性使用 HTML 字符串，数字属性由渲染器校验转换；复杂数据通过字段路径绑定，不在属性中塞 JSON。组件运行前校验字段类型和公开性。通用 `class/style/id/title` 修饰外层，标签都需显式闭合。组件内部不接受任意第三方 JavaScript。

自由排版使用 CSS Grid、Flex 或容器查询；标题居中可写 `<h2 class="name">{{name}}</h2>`，配合 `.name { text-align: center; }`。折叠使用 `<details><summary>标题</summary>…</details>`。资源条可以使用原生 `<meter>` 或自行编写 HTML/CSS。显式模板只显示作者声明的内容。

普通 `<img src="{{image}}">` 同样经过文档媒体解析。CSS 相对 `url()` 不经过该解析，模组图片应使用图片标签。外部 HTTP(S) 链接沿用应用外链行为，文档引用使用 `tarp-reference` 或 Markdown 组件。模板拒绝脚本、事件属性、iframe、表单及内联 SVG、MathML；SVG 素材应通过 `<tarp-image>` 或 `<img>` 引用模组图片文件。`srcset` 及 `data:`、`file:` 媒体地址也不接受。普通输入控件不会修改游戏数据。三花括号不能绕过输出检查。

## 临时展示字段

layout 根级 `displayFields` 定义仅供展示的计算，不新增角色事实。配置式布局使用 `$display.名称` 引用，例如 `detail.fields = ["$display.packSummary"]`；Handlebars 模板使用 `{{display.packSummary}}`。可用于详情、角色卡、列表、卡片和悬浮预览。名称使用英文字母或下划线开头，后续允许数字。

```toml
[displayFields.packSummary]
type = "text"
label = "行装摘要"
compute = 'self => `金币 ${self.gold ?? 0} · 行装 ${self.current_slots ?? 0}/10 格`'
hideWhenEmpty = true

[sheet]
type = "handlebars"
template = '<p>{{display.packSummary}}</p>'
```

类型须声明示例读取的金币及占格字段。仅需拼接已有值时可直接使用模板插值；需要复用格式化结果时，再定义展示计算函数。

`type` 支持 `text/number/boolean`，`label` 与 `compute` 必填。函数接收当前文档的公开字段及已完成的业务计算结果，返回相应类型或 `null`；数字必须有限。元数据通过 `self.name`、`self.description` 等读取，也遵循公开设置。

游戏界面的展示函数与业务计算一起在客户端本地 Web Worker 的 SES 环境执行，不能访问 DOM、文件系统、网络及其他宿主能力，也不继承上一批计算的全局状态。输入只读，平台不向函数注入引用读取、其他展示字段或原始业务公式。单次文档求值的执行期限覆盖展示函数；超时会终止整个计算环境，后续读取可重建，不提供独立堆硬限额。主进程与 CLI 的校验及模组库入口仍按可信代码原生执行，边界见[计算字段](compute.md)。代码长度最多 2048 字符。结果与错误独立于业务字段，不写入文档、角色存档或编辑表单，不能作为规则或主持人工具可修改字段使用。

函数错误或返回类型不匹配只影响该展示字段。读取失败的业务字段会导致对应展示失败，即使函数捕获异常也不能伪装成正常值。文档版本变化后重新求值；界面渲染不重复执行函数。涉及跨文档规则计算时，先在类型中定义[业务计算字段](compute.md)，展示只读取最终结果。

## 正文引用与图片

标准链接 `[阿青](character/阿青)` 显示自定标签，双链 `[[character/阿青]]` 显示文档名称；模组内路径相对于根目录，只匹配已有文档，不按同名标题猜测。两种链接都支持带 `.json`、`.toml` 或 `.md` 扩展名的路径，例如 `[阿青](character/阿青.json)`；结构化引用、装备图片与正文入口使用同一文档标识解析。悬浮或键盘聚焦显示预览，点击打开详情。普通外链、页内锚点和未匹配的标准链接保持原行为。

游戏中，引用目标隐藏时不展示对应引用标签、预览或详情入口；已打开的详情在撤销公开后关闭。聊天正文已经显示过的引用称呼在当前显示期间保持稳定，资料刷新、隐藏或失效时保留为正文文字，暂停预览和详情入口，避免文字反复消失、恢复而改变段落位置。尚未显示过的隐藏资料不会从原始索引补出名称。普通正文文字和独立图片不会自动隐藏，需由作者安排可见内容。

详情封面与 Markdown 图片支持点击放大、缩放、拖动、同组图片方向键切换和 Esc 关闭。文档 `image` 与 `avatar` 的用途见[文档类型与字段](doc-types.md)。布局不为价格等字段自动附加单位，单位写在字段标签或规则里；建卡任务也不会因名叫 `creation` 就自动展开。

建卡预览与确认页共用详情布局，确认页显示解析引用和计算后的值；角色卡使用独立配置的共享布局组件。保存后用[CLI](cli.md)检查路径和权限，再由开发者手动新建冒险验证实际展示。

## 实例摘要

绑定 `item.instance` 的行装列表使用 `ReferenceCollection` 时，组件自动读取引用定义的 `instance.display`。`cards` 和 `list` 视图在条目中直接显示摘要；`slots` 视图保留方形物品格，鼠标悬浮时在资料卡中显示当前条目的摘要。同一物品的多个实例分别显示各自的状态，例如这一支火把已燃尽、剩余燃料为 0。悬浮资料卡仍由物品类型的 `layout.hover.enabled` 控制。角色布局只配置数量、位置等通用信息，不重复列出燃料、耐久或消耗次数。

```json
{
  "type": "ReferenceCollection",
  "referenceField": "item",
  "display": "slots",
  "slotCount": 10,
  "quantityField": "quantity",
  "metadata": [
    { "field": "quantity", "label": "数量" },
    { "field": "location", "label": "位置" }
  ]
}
```

摘要按物品定义的顺序显示，使用实例字段的标签和 `hideWhenEmpty`；不同物品可显示不同内容。实例状态、公开摘要与字段计算来自同一份计算结果，同步和恢复后保持一致。玩家展示过滤主持字段、公式配置与内部诊断。定义、绑定和初值规则见[引用定义与实例状态](doc-types.md#引用定义与实例状态)。
