# GitHub 与 Greasy Fork 发布

本仓库是脚本集合，每份脚本独立版本、独立 Greasy Fork 条目、独立同步地址。开发分支用于未完成修改，`main` 用于已经验证的版本。

2026-11-03 已为本仓库配置 GitHub push Webhook（application/json、Active、SSL 校验开启）。配置与实测状态见 [同步记录](webhook-sync-status.md)。新增脚本仍需在对应 Greasy Fork 条目绑定自己的完整脚本 Raw 链接，不要重复创建同一仓库的相同钩子。

## 知乎专栏 · 沉浸阅读

- 现有条目：https://greasyfork.org/zh-CN/scripts/603576
- 源代码同步设置：https://greasyfork.org/zh-CN/scripts/603576/admin
- 版本来源：`scripts/zhihu-column-reader/release.json`
- 安装文件：`scripts/zhihu-column-reader/zhihu-column-reader.user.js`

管理页“源代码同步”的脚本链接填写：

```text
https://raw.githubusercontent.com/loveychen/monkey-scripts/main/scripts/zhihu-column-reader/zhihu-column-reader.user.js
```

同步方式可选“自动”（定期检查）或“手动”。保存设置的“更新设置并立即同步”会立即抓取代码，应在仓库文件可访问后执行。直接使用现有条目，无需新建脚本。

“默认附加信息”可填写以下链接，并选择 HTML：

```text
https://raw.githubusercontent.com/loveychen/monkey-scripts/main/scripts/zhihu-column-reader/release/description.html
```

同步完整 `.user.js`，不要使用 GitHub 的 `blob` 页面或 `.meta.js`；Greasy Fork 不负责运行构建。`@updateURL` 和 `@downloadURL` 保留原 Greasy Fork 安装地址，现有用户继续通过该条目更新。

## 可选：推送触发同步

先完成脚本链接同步，再参考 [Greasy Fork 官方 Webhook 说明](https://greasyfork.org/zh-CN/users/webhook-info)：

1. 从说明页取得本账号对应的 Payload URL 和 Secret。
2. GitHub 仓库进入 Settings → Webhooks → Add webhook。
3. 按说明填写 Payload URL 和 Secret，Content type 选择 `application/json`，事件选择 `Just the push event`，保持 Active。
4. 后续推送同步分支上的完整脚本，并核对 GitHub 的投递结果及 Greasy Fork 实际代码与版本。

Webhook 的账号专属配置不放进仓库。开启后，对 `main` 的相关推送会进入发布流程；若需要保留逐次确认，则使用手动同步。

## 日常更新

1. 在开发分支修改源码；修改对应脚本 `release.json` 的版本，并新增更新摘要。
2. 在仓库根目录运行 `npm run build:zhihu` 和 `npm run check:zhihu`。
3. 在浏览器检查实际功能和受影响的既有行为。
4. 将源码、版本配置、生成的 `.user.js`、`.meta.js` 及必要说明一起提交，合入 `main` 后推送。
5. 确认 Greasy Fork 同步出新版本；在脚本管理器检查更新后刷新文章。

修改源码却不提交生成文件不会更新安装包。只修改内容而不升级版本，也不能作为现有用户正常升级的可靠发布方式。

本次仓库初始化保留已有 1.3.0，不修改 Greasy Fork 同步设置。后续维护以本仓库为代码来源，避免同时修改旧独立目录与集合目录而产生分叉。
