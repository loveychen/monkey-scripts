# GitHub → Greasy Fork 同步状态

日期：2026-11-03。用户已要求配置 `loveychen/monkey-scripts` 的 GitHub push Webhook，接续知乎阅读脚本 1.4.0。

## 已确认

- 1.4.0 功能提交：`2c30fb1a09605b1163a2b8a363e8eaa670a107b4`，已在远端 main。
- Greasy Fork 条目 603576 已绑定 main 分支的完整 `.user.js` Raw 链接，同步方式为自动。
- 发布说明使用 `release/description.html` 的 Raw 链接；已将其格式从 Markdown 修正为 HTML，保存后回读确认。
- Webhook 配置前，Greasy Fork 已显示 1.4.0，不能据此证明 Webhook 生效。
- 创建前 GitHub Webhook 列表为空；已添加一个 Webhook，ID 为 `706904144`。
- GitHub 设置回读确认：仅 push、application/json、Active、SSL 校验开启，已有 Secret。
- 初始 ping 已发送，GitHub 列表显示最后一次投递成功；实际 push 和同步内容仍需后续检查。

## 当前待完成

- 用户已完成 GitHub sudo mode 身份验证，并明确同意生成和配置 Secret；已按官方账号配置完成。
- 待推送的 1.4.0 元信息补充“正文进度百分比”，用于在保留功能版本的同时核对同步内容；尚未推送。
- 分别核对 GitHub push 投递、Greasy Fork 抓取与内容变化，以及用户端实际安装。

Secret 不写入本记录、仓库或聊天。证据结论分别对应提交、投递、接收与安装，不将此前已有的版本号当作新增链路验收。
