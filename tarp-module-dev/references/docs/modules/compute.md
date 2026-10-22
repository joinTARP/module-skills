<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/compute.md; sha256: ddbc12bb111bea56877203322e3019ba3bc18820edfd1c8b4d28617ce521db1a -->

# 计算字段

计算字段保存一条 `compute` 表达式，读取文档时根据当前数据求值。它适合生命上限、技能阈值、物品汇总或玩家已经查明的信息。类型定义中的公式作为默认规则；单份文档可以通过顶层 `computed` 覆盖自己的公式。派生结果不写回原始文档。共用公式、参数和单份文档公式的选择方法见[字段建模与计算选择](field-modeling.md)。

## 从属性算生命上限

本节是独立练习：在最小模组的副本中，用下面的完整文件替换 `.types/character.fields.toml`，并用随后给出的角色文档替换阿青；先移除副本中引用旧字段的角色布局。它使用 `CON`、`SIZ` 两项属性，与前一页的 `strength` 示例不同。实际模组中可以合并需要的字段，但所有角色都要补齐新增的必填值。

```toml
designation = "character"

[fields.hp]
type = "number"
label = "当前生命值"
required = true
mutable = true

[fields.attributes]
type = "object"
required = true

[fields.attributes.fields.CON]
type = "number"
label = "体质"
required = true
mutable = true

[fields.attributes.fields.SIZ]
type = "number"
label = "体型"
required = true
mutable = true

[fields.max_hp]
type = "number"
label = "最大生命值"
compute = "floor(($self.attributes.CON + $self.attributes.SIZ) / 10)"
```

配套完整文档 `character/阿青.toml`：

```toml
name = "阿青"
hp = 8

[attributes]
CON = 50
SIZ = 60
```

开发者手动验收：保存后打开阿青的详情，应显示当前生命值 8 和最大生命值 11。

`$self` 指当前文档的字段，`floor()` 向下取整，所以最大生命值是 11。体质改为 70 后，上限变成 13，当前生命值仍为 8。公式只负责算上限，治疗或扣血仍要更新 `hp`。

计算字段不填写 `required` 或 `mutable`。可以省略原值，也可以在文档中保存符合字段类型的同名原值，通过 `$raw` 读取；上例的生命上限完全由公式生成，不需要填写 `max_hp`。计算结果必须符合声明类型，数字字段返回字符串 `"11"` 时，该字段及依赖结果会失效并单独显示“计算失败”；模组校验和状态提交仍会拒绝这种类型错误。

## 在单份文档中覆盖公式

同一类型的物品可以有不同的计算规则。类型继续声明字段类型、可修改权限和可见性，文档顶层 `computed` 按字段路径指定该文档的公式。文档公式优先于类型的默认 `compute`，未覆盖的字段沿用默认公式；没有任何公式的字段使用普通原值。

例如，新建完整类型文件 `.types/weapon.fields.toml`：

```toml
[fields.baseAttack]
type = "number"
required = true
mutable = true

[fields.attack]
type = "number"
compute = "$self.baseAttack"
```

普通武器 `weapon/铁剑.toml` 沿用默认公式，攻击力为 10：

```toml
name = "铁剑"
baseAttack = 10
```

`weapon/夜刃.toml` 覆盖自己的攻击力公式，攻击力为 15：

```toml
name = "夜刃"
baseAttack = 10

[computed]
attack = "$self.baseAttack + 5"
```

JSON 格式的对应文件如下。换用 JSON 时删除对应的 TOML 文件，避免重复文档：

```json
{
  "name": "夜刃",
  "baseAttack": 10,
  "computed": {
    "attack": "$self.baseAttack + 5"
  }
}
```

Markdown 将相同的 `computed` 映射放进 YAML frontmatter。多行 TOML 公式可以使用三引号字符串。

路径也支持已声明的对象子字段和对象列表子字段。下面是覆盖路径的写法示意，使用前须在类型中声明相应字段和容器：

```toml
[computed]
"attributes.modifier" = "floor(($item.strength - 10) / 2)"
"skills.hard" = "floor($item.value / 2)"
```

TOML 中带点的路径键必须加引号。`skills.hard` 覆盖列表中每个条目的 `hard`，`$item` 指当前条目；不使用 `skills.0.hard` 为单个下标定义公式。对象和列表需要原始容器数据，或由父字段公式生成。业务对象内的 `compute`、`computed` 仍可作为普通字段；文档顶层 `computed` 是公式覆盖区，`instance` 则是实例定义保留区，均不能声明为顶层业务字段。

覆盖目标必须在类型中声明，包括需要覆盖的 `name`、`body` 等内置字段；目标不能标记 `mutable = true`。普通必填字段被文档公式生成时可以省略原值，其他未覆盖的必填字段仍要填写。计算结果继续遵守原字段类型和可见性；文档不能新增未声明的计算属性，不能绕过通用字段权限或实例原始状态约束。

每条公式最多 2048 个字符，空公式、无效路径和可写字段覆盖会被校验拒绝。语法错误、错误返回类型和循环依赖沿用本页的计算失败规则。公式覆盖配置不会出现在 `$self`、`$raw` 或普通属性展示；需要检查时，通过文件系统用编辑器打开对应文档。

文档公式也能使用 `load()`，读取目标时采用目标自己的有效公式。若武器已经声明了 `world` 引用，且目标世界状态有 `period` 字段，可以将该武器的公式写为 `$self.baseAttack + (load($self.world)?.period === '夜晚' ? 5 : 0)`。引用仍须填写在原始文档中，并符合类型的 `reference` 声明。

已有房间的 `update` 不能修改 `computed` 配置或直接写入计算结果；主持创建本局新文档时可以携带配置。作者修改模组源文件中的公式后可重新预览；已有冒险需[同步模组](../getting-started/first-adventure.md#同步已有冒险的模组)，或新建冒险才能采用修改。开发者需核对采用新公式后的实际结果。在当前冒险中修改普通可写字段后，相关计算结果会刷新；修改模组库中的源字段不会自动影响已有冒险。

## 列表条目用 `$item`

根字段、对象子字段和对象列表里的子字段都能计算。`$self` 始终指整份文档，`$item` 指公式所在的当前对象；在列表里，用它读取这一条的数据。

例如，向角色类型追加以下字段片段：

```toml
[fields.skills]
type = "list"
label = "技能"

[fields.skills.item]
type = "object"

[fields.skills.item.fields.name]
type = "text"
required = true

[fields.skills.item.fields.value]
type = "number"
required = true

[fields.skills.item.fields.hard]
type = "number"
label = "困难阈值"
compute = "floor($item.value / 2)"
```

角色文档中加入一个顶层列表条目：

```toml
[[skills]]
name = "攀爬"
value = 55
```

这一条的 `hard` 为 27。其他条目各自计算，不用为每个技能重复写公式。列表字段本身也能派生列表，返回的元素仍需符合 `item` 定义。

## 按调查进度公开线索

完整名称、含义和正文直接保存在文档中，游戏中由公式决定显示哪些已公开的内容。下面是一份完整的 `.types/clue.fields.toml`：

```toml
[fields.found]
type = "boolean"
required = true
mutable = true
visibility = "gm"

[fields.understood]
type = "boolean"
required = true
mutable = true
visibility = "gm"

[fields.meaning]
type = "text"
label = "含义"
compute = "$self.found && $self.understood ? $raw.meaning : null"
hideWhenEmpty = true

[fields.name]
type = "text"
compute = "$self.found ? $raw.name : '墙上的痕迹'"

[fields.body]
type = "text"
compute = "$self.found && $self.understood ? $raw.body : null"
hideWhenEmpty = true
```

`clue/箭头.toml`：

```toml
name = "林舟的箭头"
found = false
understood = false
meaning = "林舟留下的指路记号，指向古塔。"
body = '''
林舟用刀刻下箭头。墙后的窄道通向古塔，可以绕开河岸的守卫。
'''
```

开始时，玩家看到“墙上的痕迹”，含义和正文隐藏。主持更新 `found` 后显示真实名称；同时查明含义、将 `understood` 改为 `true`，才公开解释与正文。文档一直保留在资料列表中，玩家能读到的内容随状态改变。

`$raw` 是整份原始文档的只读视图，所有公式都可使用，嵌套条目中的 `$raw` 仍指文档根。`$self` 和 `$item` 读取计算后的字段；字段读取自身原值时用 `$raw`，例如名称公式中的 `$raw.name`，避免通过 `$self.name` 形成循环依赖。原始名称省略时使用文件名中的名称，其他缺省原值由公式用 `??` 等方式处理。

`name`、`description`、`image`、`avatar`、`body` 是通用界面使用的内置文本字段，可以和业务字段一样声明 `compute` 并保存同名原值。名称应返回非空文本；其余计算字段均可返回合法空结果 `null`。字段是否隐藏统一由 `hideWhenEmpty` 决定：未配置或设为 `false` 时保留字段并显示“暂无数据”，设为 `true` 时隐藏。公式可以通过 `$self`、`$item` 或 `load()` 正常读取 `null`，也可以用 `??` 提供默认值；显示配置不改变计算依赖。公式报错、返回 `undefined` 或不符合声明类型的值时，对应字段及实际依赖字段失效，单独显示“计算失败”，不受 `hideWhenEmpty` 影响；其他正常字段继续显示；名称失败统一显示“未公开资料”，不回退原始名称。原值依然按声明类型校验，计算结果不会写回原始文件。

公式返回 `NaN`、`Infinity` 或 `-Infinity` 时属于计算错误，包括返回的对象和列表中包含这些值的情况。失败字段及其依赖字段单独显示“计算失败”，模组校验和状态提交拒绝；不会把非有限数当成合法返回 `null` 的空结果。原始文档中的数字也要求为有限值。

计算字段不能同时配置 `mutable`。需要临时加成、手动覆盖或动态观察记录时，将这些状态保存到独立的可修改字段，再由公式读取。Markdown 的 `body` 可以同时有原始正文和计算公式；原始正文直接写在 frontmatter 分隔线后，不需要搬到额外的来源字段。

模组库和游戏共用同一份展示布局。模组库优先展示原值，没有原值的派生字段补充公式结果，因此可查看完整名称、图片、正文和布局指定的主持字段。游戏中仍按公式和可见性展示。需要查看完整原始数据、未列入布局的字段或公式覆盖配置时，通过文件系统用任意编辑器打开模组文件。

配置完成后，由开发者手动在普通游戏视图检查未发现、已发现、已查明三种状态，确认名称、简介、图片和正文都没有提前透露内容。

## 整份文档的显示条件

需要让尚未揭露的资料完全退出玩家文档列表时，在类型定义的顶层配置 `displayWhen`。它是一条最多 2048 个字符的表达式，只接受布尔结果：`true` 显示，`false` 合法隐藏。省略时默认显示。`null`、`undefined`、错误类型或报错会使界面隐藏文档，模组校验和状态提交则会报错并拒绝操作。

`displayWhen` 使用当前文档的 `$self`、`$raw` 和声明引用，与字段计算共用求值上下文。它不保存到文档字段中。普通计算字段可返回 `null` 并配置 `"hideWhenEmpty": true` 隐藏，用于文档已公开但某个属性尚未查明的情况；合法 `null` 可以在显示条件中正常读取，字段的 `hideWhenEmpty` 不改变整份文档的显示条件。

例如，场景公开后，关联陷阱与物品顺带公开。以下是三份独立类型定义；放入模组时，类型名分别为“场景”“陷阱”“物品”。示例中的“场景”是模组自定的资料类型，当前角色位置仍由[世界状态](state.md)管理。

`.types/scene.fields.toml`：

```toml
displayWhen = "$self.revealed === true"

[fields.revealed]
type = "boolean"
required = true
mutable = true
visibility = "gm"
```

`.types/trap.fields.toml`：

```toml
displayWhen = "$self.revealed === true"

[fields.scene]
type = "reference"
targets = [ "scene" ]
required = true

[fields.revealed]
type = "boolean"
visibility = "gm"
compute = "load($self.scene)?.revealed === true"
```

`.types/item.fields.toml`：

```toml
displayWhen = "$self.revealed === true"

[fields.trap]
type = "reference"
targets = [ "trap" ]
required = true

[fields.revealed]
type = "boolean"
visibility = "gm"
compute = "load($self.trap)?.revealed === true"
```

配套文档分别为：

```toml
# scene/古墓.toml
name = "古墓"
revealed = false
```

```toml
# trap/机关.toml
name = "机关"
scene = "scene/古墓"
```

```toml
# item/宝珠.toml
name = "宝珠"
trap = "trap/机关"
```

古墓的 `revealed` 为 `true` 时，机关和宝珠通过引用链公开；为 `false` 时隐藏。陷阱和物品的派生状态不保存为独立可写数据，不能同时标记为 `mutable`。

隐藏资料不进入玩家的目录、搜索、引用集合和数量统计，不能从引用预览或详情打开。装备槽保留槽位，但不展示隐藏装备的内容；装备状态、数量和计算效果仍保留。普通正文中手写的秘密和独立图片不会自动跟随文档隐藏，需由作者安排公开内容。

模组库不受整份文档显示条件的限制，仍使用完整布局；主持工具与调试视图仍能读取完整资料。显示条件只控制玩家界面，不是传输层的秘密隔离机制，也不提供按玩家分别揭露。条件为 `false` 不会免除被修改文档自身的计算校验。

## 通过引用读取另一份资料

`load()` 只能读取原始文档里已填写、且在类型中声明为 `reference` 的引用目标，包括对象或对象列表里的引用。引用和 `load()` 参数都支持带 `.json`、`.toml`、`.md` 扩展名的路径，并与省略扩展名的文档标识互通，推荐使用省略扩展名的写法；正文中的双链、计算后产生的引用都不会自动成为加载依赖。把一个路径直接写进公式，也不能凭空加载未声明的依赖。

下面是独立的跨文档示例，新增“场景”和“武器”两种普通文档类型及两份文档；保留原有角色、地点与开局配置。示例中的“场景”是模组自定的资料类型，当前角色位置仍由[世界状态](state.md)管理。

`.types/scene.fields.toml`：

```toml
[fields.dark]
type = "boolean"
label = "黑暗"
required = true
mutable = true
```

`.types/weapon.fields.toml`：

```toml
[fields.scene]
type = "reference"
label = "关联场景"
targets = ["scene"]
required = true
mutable = true

[fields.base_damage]
type = "text"
label = "基础伤害"
required = true

[fields.damage]
type = "text"
label = "伤害"
compute = "$self.base_damage + (load($self.scene)?.dark ? ' + 5' : '')"
```

`scene/石室.toml`：

```toml
dark = false
```

`weapon/夜刃.toml`：

```toml
base_damage = "1d6"
scene = "scene/石室"
```

场景明亮时，结果是 `1d6`；把 `dark` 改为 `true` 后，结果是 `1d6 + 5`。这是伤害表达式文本，实际结算还需要[掷骰](../play/dice.md)。`scene` 由模组维护，不会自动跟随角色所在的地点。

`load()` 返回目标的只读计算视图，包括 `name`、`description`、`image`、`avatar`、`body`；实际读取某个字段时才计算它，无关字段不会提前求值。可选字段暂无数据时可能缺省，公式可用 `??` 提供默认值。引用缺失、目标不存在或类型不匹配时返回 `null`；上例用 `?.` 处理这种情况，暂不加成。若规则要求引用必须有效，可以在公式中明确报错，避免把资料缺失当成正常情况。

目标公式可以继续调用 `load()`，读取目标自身声明的引用；每一层都只能访问当前所属文档原值中声明的引用。计算目标字段时，`$self`、`$raw`、`$item` 切换为该字段所属文档及对象。文档可以互相引用，但实际字段计算形成循环时会失败。`load()` 不应用目标的整份显示条件，因此未公开的资料仍能参与内部规则计算。

游戏读取会复用已经计算的资料。当前文档或它直接、间接声明引用的目标发生变化时，相关结果在下次读取时重新计算；更换装备等引用变更也会更新关系。即使公式当前没有访问某个声明引用，该目标变化仍会使相关结果重新计算。需要随时间或随机事件变化的结果，应由主持行动写入普通字段，再由公式读取。

## 表达式与错误检查

公式使用 JavaScript 风格的运算、条件、字符串和数组方法。常用函数包括：

| 用途           | 函数                                  |
| -------------- | ------------------------------------- |
| 取整、绝对值   | `floor`、`ceil`、`round`、`abs`       |
| 比较和限制范围 | `min`、`max`、`clamp(值, 下限, 上限)` |
| 数学运算       | `sqrt`、`pow`                         |
| 汇总数组       | `sum`、`avg`、`count`                 |

例如 `sum($self.equipment ?? [], row => row.quantity)` 汇总数量，前提是角色类型已经声明相应的物品列表和数值字段。空数组的 `sum` 为 0，`avg` 为 `null`；数值型计算字段使用平均值时，要处理空列表。

`$self`、`$item` 和引用值都只读，公式用于产生结果。派生字段可以依赖其他派生字段，循环依赖会报错。每条表达式最多 2048 个字符。

游戏界面的文档、角色卡、名称及草稿计算在客户端本地 Web Worker 中完成，使用 SES 隔离公式，不经过房主服务或桌面 RPC 请求计算。公式可以使用标准 JavaScript 数据处理与计算辅助函数，不能访问 DOM、文件系统、`fetch`、`Worker`、`process` 等宿主能力。客户端不授予系统时钟或随机源，调用 `Date.now()`、无参数 `new Date()` 或 `Math.random()` 会失败；需要的游戏时间和随机结果应先写入普通字段。每次根文档求值使用独立环境，不能依赖上一批公式写入的全局状态；`$self` 链式依赖及 `load()` 在同一批次内同步解析。

单次客户端文档求值超过 1 秒会终止计算环境并报告错误，后续读取可从最新原始快照重建；当前失败任务不会自动重跑。平台不提供独立堆硬限额，公式仍应避免无限循环和无界分配。主进程的权威读取、提交校验、模组库与 CLI 继续使用原生 JavaScript 执行可信模组公式，计算规则和字段校验共用；客户端沙箱不代表所有模组代码或所有校验入口均已隔离。只运行你信任的模组。

计算失败使本字段及实际读取失败字段的其他计算字段失效，界面显示“计算失败”，原因可展开查看；其他资料继续显示。对失败字段使用 `??` 或在公式里捕获异常，不能恢复失效结果；合法返回的 `null` 可以正常使用 `??`，不传播计算失败。直接复用或展开对象、列表计算视图可以保留合法 `null` 子字段；实际读取失败字段时，派生字段也会失效。

展示与写入共用同一个计算器。出错的字段及其依赖另行记录错误，界面显示“计算失败”，不会被 `hideWhenEmpty` 隐藏；模组校验、创建冒险和状态提交仍严格检查公式错误，失败时拒绝写入，原始类型、引用和修改权限的规则保持不变。返回合法空结果 `null` 不属于错误，也不自动隐藏字段。 模组库提供作者所需的完整诊断，普通游戏视图只显示公开字段的错误及通用处理提示，避免把内部公式或主持资料带入玩家界面。

检查时核对字段类型、依赖和声明的引用，或运行模组校验查看具体错误。修正公式后，在模组库重新读取资料，再由开发者手动新建测试冒险验证规则涉及的状态。

## 物品实例的公式上下文

[实例绑定](doc-types.md#引用定义与实例状态)的公式由引用物品的 `instance.fields` 声明：

| 名称              | 实例公式中的含义                                                     |
| ----------------- | -------------------------------------------------------------------- |
| `$item`           | 当前实例状态的计算视图；进入嵌套对象或对象列表时，沿用当前对象的规则 |
| `$self`           | 持有者文档的计算视图                                                 |
| `$definition`     | 引用物品定义的计算视图                                               |
| `$raw`            | 持有者文档的原始字段                                                 |
| `load(reference)` | 从当前持有者已声明的引用或实例状态已声明的引用读取目标               |

例如，角色声明 `world_state` 引用，世界文档保存或计算 `elapsed_minutes`。限时光源可在自己的实例定义中声明：

```json
{
  "instance": {
    "fields": {
      "remaining_minutes": {
        "type": "number",
        "required": true,
        "mutable": true
      },
      "ends_at_minutes": { "type": "number", "mutable": true },
      "available_minutes": {
        "type": "number",
        "compute": "$item.ends_at_minutes == null ? $item.remaining_minutes : max(0, $item.ends_at_minutes - load($self.world_state).elapsed_minutes)"
      }
    },
    "display": ["available_minutes"]
  }
}
```

未点燃时省略 `ends_at_minutes`，不能填 `null`。点燃时把结束时刻设为当前游戏分钟加可用余量；熄灭时把当前计算余量保存到 `remaining_minutes`，并在同次更新中移除结束时刻。时间推进只改变计算视图，不重复扣除原始资源；重燃沿用保存的余量，转交在同一批次移动完整原始条目并保留结束时刻。

这些字段和结算方式只是模组示例，平台没有内置光源规则。实例引用参与依赖追踪，持有者、引用定义或相关世界状态变化时，计算视图随之刷新。多个实例复用定义公式，各自读取自己的状态；嵌套公式保留循环检测和逐字段错误隔离。公式与摘要均不写入存档。
