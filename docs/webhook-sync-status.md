# GitHub → Greasy Fork 同步状态

日期：2026-11-03。状态：已完成 Webhook 配置，并通过真实 main 推送验证代码同步；用户端已观察到阅读百分比功能，未验证自动安装过程。

## 配置

- 仓库：`loveychen/monkey-scripts`；稳定分支：`main`。
- [GitHub Webhook 706904144](https://github.com/loveychen/monkey-scripts/settings/hooks/706904144)：仅 push、application/json、Active、SSL 校验开启，已配置 Secret。创建前列表为空，没有重复创建钩子。
- [Greasy Fork 条目 603576](https://greasyfork.org/zh-CN/scripts/603576/admin)：代码同步链接为 `https://raw.githubusercontent.com/loveychen/monkey-scripts/main/scripts/zhihu-column-reader/zhihu-column-reader.user.js`。
- 管理页回读确认同步方式为 Webhook；发布说明的 Raw HTML 链接保留，格式已从 Markdown 修正为 HTML。
- 用户完成 GitHub sudo mode 验证，并明确同意生成 Secret；Secret 仅在官方配置页与 GitHub 配置表单之间传递，没有写入本地文件、仓库或聊天。

## 本次真实推送验证

1. 1.4.0 功能提交为 `2c30fb1a09605b1163a2b8a363e8eaa670a107b4`。创建 Webhook 前，Greasy Fork 已显示 1.4.0，因此已有版本号不能证明本次 Webhook 生效。
2. 配置后正常推送 [656acd7](https://github.com/loveychen/monkey-scripts/commit/656acd7293c2ad32458e45eb1477ab2aaeeeb378)，在保留 1.4.0 功能版本的同时，将元信息描述补充为包含“正文进度百分比”。构建及语法检查通过，未增加权限。
3. [Recent Deliveries](https://github.com/loveychen/monkey-scripts/settings/hooks/706904144?tab=deliveries) 中的 push ID 为 `97f97120-d78f-11f1-919e-12189b58e459`，界面显示时间为 2026-11-03 22:05:17。
4. Request 中的 `after` 为完整提交 `656acd7293c2ad32458e45eb1477ab2aaeeeb378`，`ref` 为 `refs/heads/main`，修改列表包含完整 `.user.js` 文件。
5. Response 为 HTTP 200；正文 `updated_scripts` 包含条目 603576，`updated_failed` 为空。
6. 回读 [Greasy Fork 实际代码](https://greasyfork.org/zh-CN/scripts/603576/code)：版本仍为 1.4.0，新增描述已出现，包含阅读百分比控件。随后回读管理页确认 Webhook 已选中。
7. 只读检查当前知乎文章页，脚本已激活，存在百分比、宽度和目录控件，百分比文本为“已读 21%”。这支持用户端已运行新增功能；本轮没有执行安装、刷新或核验其自动更新过程。

## 后续维护

修改源码后构建，并将生成的完整 `.user.js` 随稳定版本一起提交到 main。正常推送会触发该 Webhook；无需手动点击 Greasy Fork“立即同步”。正式功能更新继续升级 `release.json` 的版本，确保已有安装能够正常检查更新。

若异常，分别检查 GitHub 提交、Webhook 投递响应、Greasy Fork 实际代码和用户端安装，不将 HTTP 200 或已有版本号单独作为整条链路完成的证据。账号 Secret 不放进仓库；未来新增脚本要绑定自己的 Raw 链接。
