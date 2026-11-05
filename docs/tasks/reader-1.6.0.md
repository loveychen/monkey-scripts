# 1.6.0：X Articles 支持

日期：2026-11-05。目标：现有阅读脚本支持 X/Twitter 原生 Article，沿用低打扰、目录、图片、续读、引用和摘录体验。示例为 `https://x.com/addyosmani/article/2117512471930167377`。保留原脚本名称、命名空间、文件路径和 Greasy Fork 条目，兼容既有安装与偏好。

当前基线为 main `a95da0e` / 1.5.0，工作区开始时干净。

实现选择：按站点识别正文，用临时 data 属性共用排版；只在文章路径且完整标题/正文被识别时进入。X 普通时间线和普通推文不进入阅读。X 全站匹配用于 SPA 导航；新增 x.com/twitter.com 匹配，不新增 GM API 权限。引用不将 ID 时间或嵌入推文作者当成文章元信息。

## 证据与当前限制

- 浏览器工具初始化连续超时；用户已打开示例，但工具仍未成功连接。网页读取示例返回 403，尚未读取示例实际 DOM。
- 已直接核对维护者的原始实现：[x2markdown content-x.js](https://github.com/RuochenLyu/x2markdown/blob/main/content-x.js) 和 [web-extract 站点规则](https://github.com/seyeeL/web-extract/blob/main/src/site-rules.js)。共同使用 twitterArticleReadView、twitter-article-title、twitterArticleRichTextView；后者另记录未登录 .x-article-body 与 h1。仅作为 DOM 合同来源，不等于示例已验证；不复制其业务实现，也不采用从 snowflake 推断发布日期的做法。

## 下一步

当前为本地候选，尚未发布：站点适配、语义排版标记、跨站 URL/引用/续读与 Draft 段落支持均已实现。新增 x.com、twitter.com 匹配；X 回复入口目前提示退出后使用原页，不宣称保留知乎的评论容器能力。

独立只读审查指出的三项问题已修订：恢复知乎 article 内纯 RichText 回退；npm test 接入全部测试文件；活动观察器在隐藏兄弟前重新识别正文，处理旧 React 根保留但被 hidden/aria-hidden 隐藏的情况。

构建及语法通过。标准 npm test 共 23 项：21 项通过、2 项跳过。站点/引用控制 DOM 样本和完整生成脚本的进入/退出模拟通过；矩形、GM、媒体查询等是声明的 Node 环境适配，不能证明真实布局、滚动或已安装脚本。测试开发依赖为锁定的 linkedom 0.18.15，执行测试需 npm ci，构建及用户安装无新增运行依赖。

完整 React 替换链路的 Node DOM 模拟未收敛，原因尚未确定，该项及其后的多窗口主页模拟已明确跳过，未当成通过；适配器层旧根排除用例通过。需要在真实浏览器中复查观察器链路，不能直接归因于模拟库或认定线上故障。

用户打开文章后仍发生 getTab 连接超时；网络修复后再次尝试 60 秒仍返回“js execution timed out; kernel reset”。没有循环重试，没有访问浏览器凭据或采用其他自动化旁路。示例实际 DOM、显示、退出、图片及 SPA 回归仍未验证。

下一步：浏览器工具恢复后，读取示例真实结构，验证并修复完整 React 替换链路、标题/正文/作者/时间、图片/目录/引用、样式和退出；随后更新发布说明、核对构建及测试、推送并回读 Greasy Fork。当前不推送候选到发布分支，远端继续保留已发布的 1.5.0。
