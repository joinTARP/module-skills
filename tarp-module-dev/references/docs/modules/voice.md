<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/voice.md; sha256: 8dd68dadc09e73636baaecf2f5a95492a11701be15036c225d25fca044f446cf -->

# 模组音色

模组可以在 `module.toml` 或 `module.json` 中预设声音。玩家仍需在应用连接语音服务商，设置方法见[语音朗读](../play/voice.md)。目前由 MiMo VoiceDesign 根据音色描述生成声音；音色不会参与文字剧情生成，角色性格与主持风格仍应写在角色资料、`aiCompanions` 和 `hostPrompt` 中。

## 声音配置

沿用[最小模组](structure.md)中的 `character/阿青.toml`，将以下片段追加到 `module.toml` 末尾；保留原有模组信息和开局。已有 `tts` 配置时合并对应说话人，避免重复声明同一张 TOML 表：

```toml
[tts.host]
description = "阅历丰富的说书人，声音低沉、温暖，普通话清晰。"
instructions = "旁白语速舒缓，遇到危险时略微压低声音。"

[tts.characters."character/阿青.toml"]
description = "年轻女性，声线清亮，语尾轻微上扬。"
instructions = "像熟悉的旅伴自然地说话。"
```

每项至少填写非空的 `description` 或 `instructions`，各自最长 1000 字符。有 `description` 时使用 `mimo-v2.5-tts-voicedesign`；只有 `instructions` 时继承当前冒险的默认模型与音色，覆盖讲述要求；AI 队友若有加入时保存的模板兜底声音，则沿用该兜底音色。

| 配置             | 匹配对象                                      |
| ---------------- | --------------------------------------------- |
| `tts.host`       | 主持旁白                                      |
| `tts.characters` | 角色文档标识，统一用于 NPC、AI 队友和预写台词 |

`tts.characters` 的键从模组根目录出发，保留目录和类型，例如 `character/阿青`，不能填运行时队友 UUID。也接受带 `.json/.toml/.md` 的写法，匹配时忽略格式扩展名；改文档格式或创建冒险时转成 JSON，音色仍然匹配。同一角色不能用不同扩展名配置多份音色。

预写开场与 AI 回复中的 NPC 使用 `<message npc path="character/阿青">` 指定文档身份，公开称呼不会影响声音匹配。下面的 beat 可以追加到现有方案最后一条 `beats` 之后，并保持它属于同一个 `[[gameStarts]]`：

```toml
[[gameStarts.opening.beats]]
text = '''
<message npc path="character/阿青">
河上的雾就快散了。
</message>
'''
```

完整的旁白与 NPC 分段规则见[序章与开局](game-starts.md#旁白与-npc-台词)。

## 继承与验证

模组预设在当前冒险的声音配置上生效；主持或队友的个人覆盖优先，队友还可使用入队时保存的模板兜底声音。完整继承顺序见[给主持和队友换声音](../play/voice.md#给主持和队友换声音)。应用默认值只在创建冒险时复制，之后单独修改不会改变已有冒险。临时创建而没有模组来源路径的角色不会命中 `tts.characters`。

消息完成后按实际说话人分段朗读，主持回复中的 NPC 台词使用对应 NPC 声音；手动朗读使用同样的映射。玩家可以覆盖当前冒险的主持或队友声音，模组原件不会被修改。

创建冒险时会复制一份模组资料，调整音色原件后，已有冒险需[同步模组](../getting-started/first-adventure.md#同步已有冒险的模组)才能采用；新冒险直接使用最新配置。检查配置后，由开发者手动新建冒险，分别试听旁白、NPC、AI 队友和预写台词，确认角色文档路径和声音描述正确。音色校验不能判断实际听感，需要在连接有效语音服务后试听。
