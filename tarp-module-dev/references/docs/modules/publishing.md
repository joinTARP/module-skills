<!-- 由 scripts/sync-module-docs.mjs 自动生成；请修改官网源文档后重新同步。 -->
<!-- source: src/content/docs/modules/publishing.md; sha256: 0a6dc4e04e78689271b4f42a478af9fbbd3fa194a2c46aec3d5f0d6ad0467243 -->

# 发布模组

完成模组后，可以把完整文件上传到公开 GitHub 仓库，添加 `tarp-module` Topic，让玩家通过官网的「寻找模组」入口发现它。玩家可以从 Git 仓库导入，也可以下载你提供的 ZIP。官网入口跳转到 GitHub 搜索，Topic 由作者自行添加，不代表 TARP 审核或推荐。

## 整理发布目录

每个 Git 仓库提供一个模组，模组内容固定放在 `module/`，仓库 README、许可证和其他创作说明放在外面：

```text
river-crossing/
├── README.md
├── LICENSE
└── module/
    ├── module.toml
    ├── .types/
    ├── character/
    ├── location/
    └── 图片/
```

`LICENSE` 按实际授权安排准备；使用第三方素材时，在仓库说明中列出来源和各自的使用条件。分享的内容应为原创或已获得相应分发许可。

`module/` 必须包含完整的配置、类型定义、内容文档和引用素材。只上传 `module.toml` 不能组成可用模组。文件格式见[模组结构](structure.md)，模组内阅读页的处理见[封面和阅读页](structure.md#加入封面和阅读页)。

在模组信息中填写作者和版本，便于玩家辨认；`version` 只是展示信息，不会自动创建 Git 标签。公开前清除个人配置、API 密钥和测试存档，内部文件使用普通文件和目录；Git 导入不支持符号链接，也不会初始化 Git 子模块。

## 校验并测试开局

开发者需要在桌面应用中检查文档，再新建测试冒险，完成选角或建卡、序章和正式开场。用到自定义状态、声音等功能时，也检查实际游玩中的表现。编程助手完成文件检查、CLI 校验及已有模组测试，并提供这些手动验收步骤，实际冒险操作由开发者完成。

已有 CLI 命令入口时，可以在仓库根目录运行：

```sh
tarp module validate "./module"
```

命令的获取方式、校验范围和桌面预览见[模组 CLI](cli.md)。校验通过后仍需测试开局。已有冒险使用自己的模组副本，未同步时不能据此确认源文件的修改；[同步模组](../getting-started/first-adventure.md#同步已有冒险的模组)后可继续验证资料和规则。完整序章、选角、建卡与开场仍需用新冒险验收。

## 提交前检查

在独立模组仓库的根目录操作 Git，先确认仓库根目录、当前分支、远程地址和已有改动。不要在 `module/` 中另建嵌套仓库，也不要把本地组织项目的父目录当作发布仓库。

```sh
git rev-parse --show-toplevel
git status --short
git branch --show-current
git remote -v
```

只暂存本次发布需要的文件，并检查暂存差异与已跟踪清单。`.types/`、本地图片、阅读页和其他引用资源必须实际进入提交；本机存在但未跟踪或被忽略的文件不会随 Git 发布。图片的来源与检查见[图片资源](images.md)。

```sh
git diff --cached --stat
git diff --cached
git ls-files -- module/
```

准备发布时核对模组版本、README 导入说明、素材来源和本次 CLI 结果，提供开发者的开局及展示验收清单。公开仓库中的主持资料也能被直接读取，字段可见性不提供仓库访问隔离；个人配置、凭据和测试存档不应进入发布提交。

委托编程助手时，创建或修改模组不自动包含 Git 提交、远程推送或公开发布。用户已经明确指定发布范围、目标仓库与分支时，沿用该授权；仅缺少会影响发布的目标或可见性信息时再澄清。先完成可检查的文件、校验与发布准备，不为已经授权的步骤重复询问。

## 上传到 GitHub

1. 在 GitHub 点击 **New repository**，填写仓库名，例如 `river-crossing`，选择 **Public**。按下面命令上传本地文件时，创建一个空仓库，不预先生成 README 或许可证。
2. 在本地准备上面的发布目录，写好 `README.md`，把完整模组放入 `module/`。
3. 在发布目录执行下面的命令。把远程地址中的 `<你的账号>` 和仓库名替换为自己的值；推送时使用本机已配置的 GitHub 登录凭据。

```sh
git init -b main
git add README.md module
git diff --cached --stat
git diff --cached
git commit -m "发布小河渡口模组"
git remote add origin https://github.com/<你的账号>/river-crossing.git
git push -u origin main
```

上面的命令用于尚未初始化的本地目录和空的远程仓库。准备了 `LICENSE` 或素材来源说明等额外文件时，在提交前一并用 `git add` 加入。也可以使用 Git 客户端上传，确认 `.types/` 等隐藏目录已包含在提交中。初始化、关联远程与推送的说明见 [GitHub 官方文档](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)。

### 已有仓库的更新

已有仓库沿用当前历史、远程和约定的发布分支，不重新执行 `git init` 或覆盖 `origin`。下面假设当前工作分支为 `main`，已确认发布目标是 `origin` 的 `main`，并已按本次范围检查文件；实际目标不同时替换为已有约定，核对待发布提交确实位于该分支：

```sh
git add -- README.md module/
git diff --cached --stat
git diff --cached
git commit -m "更新小河渡口模组"
git push origin main
```

示例中的暂存范围适合发布整份模组；仓库含无关修改或已有暂存内容时，按实际路径或改动片段选择，保留用户其他工作。推送前核对将发布的提交，不仅检查最后一条提交。远程已有新提交或推送被拒绝时，先读取并协调双方改动，不用强推覆盖历史，也不删除本地改动绕过冲突。

### README 要写什么

至少说明模组内容、使用条件、测试过的 TARP 版本，以及玩家导入时要填写的仓库地址、分支／标签，并说明模组内容位于固定的 `module/`。可以参考下面的模板，替换其中的示例值和占位文字：

```markdown
# 小河渡口

一份适用于 TARP 的冒险模组：渡船迟迟未归，旅人沿河寻找船夫。

## 导入

在 TARP 首页或模组库点击「导入模组」，选择「Git」：

- 仓库地址：https://github.com/<你的账号>/river-crossing.git
- 分支／标签：main

测试使用的 TARP 版本：<填写实际测试版本>。

## 使用条件与素材来源

<填写模组的使用条件、许可证及第三方素材来源；不同素材适用不同授权时分别说明。>
```

分享的是仓库克隆地址，不要把 GitHub 的 `/tree/main/module` 页面地址当成仓库地址。应用保留完整仓库并固定读取 `module/`，无需填写子目录；仓库根目录不要再放另一份模组清单。

## 添加发现标记

1. 打开 GitHub 仓库主页，点击右侧 **About** 旁的齿轮按钮。
2. 在 **Topics** 中输入 `tarp-module` 并添加。
3. 点击 **Save changes** 保存。

设置方法见 [GitHub 官方说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)。标记设置在 GitHub 仓库上，模组配置里的 `tags` 或 README 中的同名关键词不能替代 Topic。

保存后可以打开 [Topic 仓库搜索](https://github.com/search?q=topic%3Atarp-module&type=repositories)检查结果。未添加标记的仓库不会出现在这个搜索中；添加标记不会把文件上传到 TARP 官网。

## 提供版本和 ZIP 下载

分支适合持续更新，正式交付建议提供指向已验收提交的版本标签，例如 `v0.1.0`。模组配置的 `version`、README 和 Release 说明应与这次内容一致；修改 `version` 不会创建标签，创建本地标签也不会自动发布到远程。

确认当前提交就是待发布版本后，可以创建附注标签并单独推送该标签。下面的版本号与远程名称是示例，应使用已确定的实际值：

```sh
git log -1 --oneline
git tag -a v0.1.0 -m "发布小河渡口 v0.1.0"
git push origin refs/tags/v0.1.0
```

标签应指向包含完整模组和验收后修改内容的提交，不能靠未提交的本地文件补齐。只推送本次标签，不批量推送无关标签；已发布版本需要修正时，发布新版本，不覆盖已有标签。附注标签的用法见 [Git 官方文档](https://git-scm.com/docs/git-tag)。

在 GitHub 的 **Releases → Draft a new release** 中选择这个标签，再填写标题和版本说明；也可以在那里创建标签，但要核对实际目标提交。分支若在验收后发生变化，不应直接把最新提交当作已验收版本。玩家从 Git 导入固定版本时，分支／标签填 `v0.1.0`，模组仍须放在 `module/` 中。Git 标签与 Release 分别管理，标签存在不代表 Release 已发布。

也可以把 `module/` 的完整内容打成一个 ZIP，并作为 Release 附件上传，例如 `小河渡口-v0.1.0.zip`。打包时保留 `.types/` 和引用素材，可以直接打包模组内容，也可以保留一层模组文件夹；一份 ZIP 只放一个模组。大小和条目限制见[导入模组](../getting-started/first-adventure.md#导入模组)。

发布前检查打包后的 ZIP，确认内容完整并测试导入；准备好后点击 **Publish release**。Release 的操作说明见 [GitHub 官方文档](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)。

## 从玩家角度验证

开发者需要使用公开仓库地址、指定标签或实际下载的 ZIP，按[第一次冒险](../getting-started/first-adventure.md#导入模组)重新导入并创建测试冒险，确认玩家拿到的文件能够使用。可以在设置中切换到空的测试模组保存目录，避免同名目录导致重复导入失败。导入不会自动同步仓库后续提交；分支导入保留 Git 更新能力，可以在导入的仓库根目录手动执行 `git pull --ff-only`，操作见[手动更新 Git 模组](../getting-started/first-adventure.md#手动更新-git-模组)。发布后仍需用实际导入或更新后的文件创建新冒险验证。开发过程中也可以[同步已有冒险的模组](../getting-started/first-adventure.md#同步已有冒险的模组)，保留当前进度继续测试；已有冒险副本不会自动随源仓库更新。
