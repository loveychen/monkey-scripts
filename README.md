# Monkey Scripts

浏览器用户脚本集合。每份脚本在独立目录中维护自己的源码、版本、使用说明和发布产物，可分别安装与更新。

## 脚本列表

| 脚本 | 作用范围与功能 | 安装 | 源码与说明 |
| --- | --- | --- | --- |
| 知乎专栏 · 沉浸阅读 | 知乎专栏文章；主题、阅读宽度、断点续读、目录与图片查看 | [Greasy Fork](https://greasyfork.org/zh-CN/scripts/603576) | [scripts/zhihu-column-reader](scripts/zhihu-column-reader/) |

建议从 Greasy Fork 安装，各脚本的安装要求和使用方法见对应目录。仓库中的 `.user.js` 是完整安装文件，`.meta.js` 仅包含元信息。

## 开发

需要 Node.js 20 或以上。当前项目没有第三方构建依赖，无需先运行 `npm install`。

```bash
npm run build
npm run check
```

只操作知乎脚本时使用 `npm run build:zhihu` 和 `npm run check:zhihu`。

构建命令生成完整脚本和元信息文件；检查命令验证 JavaScript 语法。页面交互需要另在浏览器中验证，语法检查不能代替实际阅读体验验收。

## 目录约定

```text
scripts/
  zhihu-column-reader/
    src/                         # 开发源码与样式
    build-userscript.mjs          # 生成单文件脚本
    release.json                 # 本脚本的版本与发布入口
    release/                     # 发布说明与更新摘要
    zhihu-column-reader.user.js   # 可安装文件，也是 Greasy Fork 同步对象
    zhihu-column-reader.meta.js   # 元信息
    README.md
    LICENSE
docs/
  publishing.md                  # GitHub 与 Greasy Fork 同步说明
```

新增脚本时，在 `scripts/<脚本标识>/` 下独立维护，并更新本页索引。需要构建时再添加对应命令，各脚本独立升级版本。各目录的 `LICENSE` 决定该脚本的许可。

## 发布

稳定版本提交到 `main`，开发中的修改使用其他分支。Greasy Fork 配置同步后，向同步分支推送新的完整脚本会进入对外发布流程。

操作步骤和本仓库的同步地址见 [发布说明](docs/publishing.md)。本仓库不会自动配置 Greasy Fork 或 Webhook。
