# 仓库约定

- 使用中文交流和中文 Markdown 文档。
- 本仓库独立维护 TARP 模组开发技能，不属于 TARP Bun workspace。
- 每个技能目录包含 `SKILL.md`；详细说明按需放入 `references/`，生成用模板放入 `assets/`。
- 设计与模组配置正文统一维护在官网 `src/content/docs/`，使用 `scripts/sync-module-docs.mjs` 生成技能参考，不手工修改生成文件。以当前 Schema 和 CLI 验收结果为依据，格式变动同步更新官网源文档、生成参考与模板。
- 保持技能入口简短，不复制 CLI 实现、不新增重复校验器或过渡文档。
