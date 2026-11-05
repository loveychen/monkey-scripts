// ==UserScript==
// @name         知乎专栏 · 沉浸阅读
// @namespace    local.zhihu-column-reader
// @version      1.6.0
// @description  知乎专栏与 X Articles 沉浸阅读，支持主题、目录、图片、断点续读、引用预览、BibTeX 和摘录出处。
// @homepageURL  https://greasyfork.org/zh-CN/scripts/603576
// @supportURL   https://greasyfork.org/zh-CN/scripts/603576/feedback
// @updateURL    https://update.greasyfork.org/scripts/603576/%E7%9F%A5%E4%B9%8E%E4%B8%93%E6%A0%8F%20%C2%B7%20%E6%B2%89%E6%B5%B8%E9%98%85%E8%AF%BB.user.js
// @downloadURL  https://update.greasyfork.org/scripts/603576/%E7%9F%A5%E4%B9%8E%E4%B8%93%E6%A0%8F%20%C2%B7%20%E6%B2%89%E6%B5%B8%E9%98%85%E8%AF%BB.user.js
// @match        https://zhuanlan.zhihu.com/p/*
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @license      MIT
// ==/UserScript==

GM_addStyle("/* All page overrides are scoped to the explicitly activated reader. */\nhtml[data-zr-active=\"on\"] {\n  --zr-bg: #fff; --zr-text: #292c32; --zr-title: #15181d;\n  --zr-muted: #737985; --zr-rule: #e9ebef; --zr-soft: #f5f6f8; --zr-link: #1769d4;\n  --zr-ui: rgba(255,255,255,.94); --zr-font-family: -apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif;\n  background: var(--zr-bg) !important; color-scheme: light;\n  scroll-padding-top: 36px;\n}\nhtml[data-zr-active=\"on\"][data-zr-theme=\"sepia\"] {\n  --zr-bg: #f5efe2; --zr-text: #453e32; --zr-title: #30291f;\n  --zr-muted: #847762; --zr-rule: #e0d6c5; --zr-soft: #ece3d1; --zr-link: #865e2e; --zr-ui: rgba(245,239,226,.95);\n}\nhtml[data-zr-active=\"on\"][data-zr-theme=\"dark\"] {\n  --zr-bg: #16191e; --zr-text: #d3d8e0; --zr-title: #f0f3f7;\n  --zr-muted: #929aa8; --zr-rule: #303641; --zr-soft: #21262f; --zr-link: #80b4ff; --zr-ui: rgba(30,35,43,.95);\n  color-scheme: dark;\n}\nhtml[data-zr-active=\"on\"][data-zr-font=\"serif\"] { --zr-font-family: \"Songti SC\",\"Noto Serif SC\",Georgia,serif; }\nhtml[data-zr-active=\"on\"] body {\n  background: var(--zr-bg) !important; color: var(--zr-text) !important;\n  overflow: auto !important; height: auto !important; min-width: 0 !important;\n}\nhtml[data-zr-active=\"on\"] [data-zr-hidden] { display: none !important; }\nhtml[data-zr-active=\"on\"] [data-zr-path] {\n  display: block !important; width: auto !important; max-width: none !important; min-width: 0 !important;\n  height: auto !important; margin: 0 !important; padding: 0 !important;\n  position: static !important; float: none !important; transform: none !important;\n  background: transparent !important; border: 0 !important; box-shadow: none !important;\n  overflow: visible !important;\n}\nhtml[data-zr-active=\"on\"] :is(article.Post-Main, [data-zr-role=\"article\"])[data-zr-path] {\n  box-sizing: border-box !important; width: 100% !important;\n  max-width: calc(var(--zr-width,720px) + 48px) !important;\n  margin: 0 auto !important; padding: 52px 24px 80px !important;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-Title, [data-zr-role=\"title\"]) {\n  color: var(--zr-title) !important; font-size: clamp(28px,3vw,40px) !important;\n  line-height: 1.4 !important; letter-spacing: -.025em !important;\n  margin: 0 0 24px !important; font-weight: 700 !important;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-Header, [data-zr-role=\"header\"]) { margin-bottom: 36px !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-Author, [data-zr-role=\"author\"]) { margin-bottom: 20px !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-Author, [data-zr-role=\"author\"]) a { color: var(--zr-text) !important; }\nhtml[data-zr-active=\"on\"] .Post-Header > div:not(.Post-Author),\nhtml[data-zr-active=\"on\"] .Post-Header > span,\nhtml[data-zr-active=\"on\"] .ContentItem-actions { display: none !important; }\nhtml[data-zr-active=\"on\"] .Post-RichTextContainer { margin: 0 !important; padding: 0 !important; }\n/* Native table of contents contains fixed-width wrappers; headings stay available in the article. */\nhtml[data-zr-active=\"on\"] .Post-RichTextContainer .Catalog { display: none !important; }\nhtml[data-zr-active=\"on\"] .Post-RichTextContainer > div { width: auto !important; max-width: none !important; }\nhtml[data-zr-active=\"on\"] :is(.RichText.Post-RichText, [data-zr-role=\"content\"]) {\n  width: 100% !important; max-width: none !important; padding: 0 !important;\n  font-family: var(--zr-font-family) !important; font-size: var(--zr-font-size,19px) !important;\n  line-height: 1.95 !important; letter-spacing: .015em; color: var(--zr-text) !important;\n  overflow-wrap: anywhere;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) p { margin: 0 0 1.35em !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h1,\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h2,\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h3,\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h4 {\n  color: var(--zr-title) !important; line-height: 1.5 !important; margin: 2.1em 0 .85em !important;\n  scroll-margin-top: 36px;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h2 { font-size: 1.45em !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) h3 { font-size: 1.18em !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) a { color: var(--zr-link) !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) ul,\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) ol { padding-left: 1.6em !important; margin: 1em 0 1.6em !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) li { margin: .45em 0 !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) blockquote {\n  color: var(--zr-muted) !important; background: var(--zr-soft) !important;\n  border-left: 3px solid var(--zr-link) !important; padding: 18px 22px !important;\n  margin: 1.5em 0 !important; border-radius: 0 8px 8px 0;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) blockquote p:last-child { margin-bottom: 0 !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) figure { margin: 2em auto !important; max-width: 100% !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) img { max-width: 100% !important; height: auto !important; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) img:not(.ztext-math) { cursor: zoom-in; }\nhtml[data-zr-active=\"on\"][data-zr-theme=\"dark\"][data-zr-image-dim=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) img:not(.ztext-math) { filter: brightness(.82); }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) figcaption {\n  color: var(--zr-muted) !important; font-size: .78em !important; line-height: 1.65 !important;\n  text-align: center; margin-top: 12px !important;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) pre {\n  background: var(--zr-soft) !important; color: var(--zr-text) !important; padding: 20px !important;\n  border-radius: 10px; overflow-x: auto !important; font-size: .85em !important; line-height: 1.7 !important;\n}\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) code { background: var(--zr-soft); color: inherit; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) td,\nhtml[data-zr-active=\"on\"] :is(.Post-RichText, [data-zr-role=\"content\"]) th { border-color: var(--zr-rule) !important; }\nhtml[data-zr-active=\"on\"] :is(.ContentItem-time, [data-zr-role=\"time\"]) { color: var(--zr-muted) !important; margin-top: 40px; }\n#zr-launcher, #zr-toolbar, #zr-toolbar *, #zr-launcher * { box-sizing: border-box; }\n/* X applies its own text styles to nested spans and Draft blocks. */\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] { display: block !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] :is(span,[data-block=\"true\"],.public-DraftStyleDefault-block) { font-size: inherit !important; line-height: inherit !important; color: inherit !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] :is(.longform-unstyled,.longform-unstyled-narrow) { margin-bottom: 1.35em !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] :is([role=\"heading\"],.longform-header-one,.longform-header-one-narrow,.longform-header-two,.longform-header-two-narrow) { color: var(--zr-title) !important; font-weight: 700 !important; margin: 2.1em 0 .85em !important; scroll-margin-top: 36px; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] :is([role=\"heading\"][aria-level=\"2\"],.longform-header-two,.longform-header-two-narrow) { font-size: 1.45em !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] [data-zr-role=\"content\"] :is([role=\"heading\"][aria-level=\"1\"],.longform-header-one,.longform-header-one-narrow) { font-size: 1.6em !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] :is([data-zr-role=\"cover\"],[data-testid=\"tweetPhoto\"]) { max-width: 100% !important; }\nhtml[data-zr-active=\"on\"][data-zr-site=\"x\"] :is([data-zr-role=\"author\"],[data-zr-role=\"time\"]) { display: block; color: var(--zr-muted) !important; font-size: 14px; }\n#zr-launcher {\n  position: fixed; right: 24px; bottom: 132px; z-index: 2147483645;\n  display: flex; align-items: center; gap: 9px; border: 1px solid #d9e5fa;\n  border-radius: 30px; padding: 12px 17px; background: #fff; color: #1769d4;\n  font: 600 14px/1.2 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif;\n  box-shadow: 0 6px 24px #172b4d1f; cursor: pointer;\n  opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .15s;\n}\n#zr-launcher.zr-launcher--visible { opacity: 1; visibility: visible; pointer-events: auto; }\n#zr-launcher:hover { background: #f1f6ff; }\n#zr-launcher svg { width: 18px; height: 18px; }\n#zr-launcher kbd { font: 10px/1 monospace; color: #8b9ab0; margin-left: 3px; }\n#zr-toolbar {\n  position: fixed; z-index: 2147483646; top: 16px; right: 20px;\n  display: flex; align-items: center; max-width: calc(100vw - 24px);\n  padding: 5px; border: 1px solid var(--zr-rule); border-radius: 24px;\n  color: var(--zr-text); background: var(--zr-ui); backdrop-filter: blur(16px);\n  box-shadow: 0 5px 25px #0000000c;\n  font: 500 13px/1.2 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif;\n  opacity: .55; transition: opacity .15s;\n}\n#zr-toolbar:hover, #zr-toolbar:focus-within, #zr-toolbar.zr-toolbar--expanded { opacity: 1; }\n#zr-toolbar .zr-toolbar__handle { order: 1; flex-shrink: 0; }\n#zr-toolbar .zr-toolbar__controls { display: flex; align-items: center; gap: 3px; }\n#zr-toolbar .zr-toolbar__controls[hidden] { display: none !important; }\n#zr-toolbar .zr-progress-text { padding: 0 8px; white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--zr-muted); }\n#zr-toolbar svg { width: 18px; height: 18px; display: block; }\n#zr-toolbar .zr-toolbar__sep { height: 18px; width: 1px; background: var(--zr-rule); margin: 0 5px; }\n#zr-toolbar .zr-btn {\n  display: flex; justify-content: center; align-items: center; gap: 5px;\n  min-width: 32px; height: 32px; padding: 6px; border: 0; border-radius: 50%;\n  background: transparent; color: inherit; cursor: pointer; font: inherit;\n}\n#zr-toolbar .zr-btn:hover { background: var(--zr-soft); color: var(--zr-link); }\n#zr-toolbar .zr-theme-select {\n  height: 32px; max-width: 112px; padding: 4px 6px; border: 0; border-radius: 16px;\n  background: var(--zr-soft); color: var(--zr-text); font: inherit; cursor: pointer;\n}\n#zr-toolbar .zr-btn--exit { border-radius: 20px; padding-right: 10px; }\n#zr-toolbar .zr-btn--text { border-radius: 16px; padding: 6px 9px; white-space: nowrap; }\n#zr-toolbar .zr-image-dim-label { display: flex; align-items: center; gap: 4px; white-space: nowrap; padding: 0 8px; }\n#zr-toolbar input { margin: 0; accent-color: var(--zr-link); }\n#zr-toolbar button:disabled { opacity: .45; cursor: default; }\n#zr-toolbar .zr-btn__aa { font-size: 16px; font-family: Georgia,serif; }\n#zr-toolbar sup { position: static; font-size: 12px; vertical-align: super; }\nhtml[data-zr-font=\"serif\"] #zr-toolbar [data-zr-act=\"serif\"],\nhtml[style*=\"--zr-width: 960px\"] #zr-toolbar [data-zr-act=\"width\"] { color: var(--zr-link); background: var(--zr-soft); }\n#zr-progress { position: fixed; inset: 0 0 auto; height: 3px; z-index: 2147483647; pointer-events: none; }\n#zr-progress[hidden] { display: none; }\n#zr-progress-fill { height: 100%; width: 100%; background: var(--zr-link); transform: scaleX(0); transform-origin: left; }\n#zr-toc {\n  position: fixed; top: 72px; right: 20px; width: min(320px, calc(100vw - 32px));\n  z-index: 2147483645; max-height: calc(100vh - 100px); border: 1px solid var(--zr-rule);\n  background: var(--zr-ui); color: var(--zr-text); border-radius: 14px;\n  box-shadow: 0 12px 40px #0002; padding: 12px; font: 14px/1.6 system-ui;\n  display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden;\n}\n#zr-toc[hidden] { display: none !important; }\n.zr-toc-header { display: flex; align-items: center; justify-content: space-between; padding: 0 5px 9px; flex-shrink: 0; }\n#zr-toc button { color: inherit; font: inherit; border: 0; border-radius: 6px; background: transparent; cursor: pointer; }\n.zr-toc-list { min-height: 0; overflow-y: auto; flex: 1; }\n.zr-toc-list button { display: block; width: 100%; text-align: left; padding: 7px 10px; }\n#zr-toc button:hover, #zr-toc button[aria-current] { background: var(--zr-soft); color: var(--zr-link); }\n#zr-citation {\n  position: fixed; top: 72px; right: 20px; z-index: 2147483645;\n  width: min(540px, calc(100vw - 32px)); max-height: calc(100vh - 100px);\n  display: flex; flex-direction: column; box-sizing: border-box;\n  border: 1px solid var(--zr-rule); border-radius: 14px;\n  background: var(--zr-bg); color: var(--zr-text); box-shadow: 0 12px 40px #0002;\n  font: 13px/1.6 -apple-system, BlinkMacSystemFont, \"PingFang SC\", sans-serif;\n}\n#zr-citation[hidden], #zr-citation [hidden] { display: none !important; }\n#zr-citation * { box-sizing: border-box; }\n.zr-cite-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--zr-rule); flex-shrink: 0; }\n.zr-cite-body { padding: 12px 16px 16px; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }\n#zr-citation label { display: block; margin: 0 0 10px; }\n#zr-citation input:not([type=\"checkbox\"]), #zr-citation select, #zr-citation textarea {\n  display: block; width: 100%; min-width: 0; margin: 4px 0 0; padding: 7px 9px;\n  border: 1px solid var(--zr-rule); border-radius: 7px;\n  background: var(--zr-bg); color: var(--zr-text); font: inherit;\n}\n#zr-citation textarea { resize: vertical; max-height: 240px; }\n#zr-citation textarea[name=\"preview\"] { font: 12px/1.6 ui-monospace, Menlo, monospace; }\n#zr-citation .zr-cite-checkbox { display: flex; align-items: center; gap: 7px; }\n#zr-citation input[type=\"checkbox\"] { accent-color: var(--zr-link); margin: 0; }\n.zr-cite-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }\n#zr-citation button { padding: 6px 11px; border: 1px solid var(--zr-rule); border-radius: 7px; background: var(--zr-soft); color: var(--zr-text); cursor: pointer; font: inherit; }\n#zr-citation button:hover { color: var(--zr-link); }\n#zr-citation button:disabled { opacity: .45; cursor: default; }\n#zr-citation :is(button,input,textarea,select,summary):focus-visible { outline: 2px solid var(--zr-link); outline-offset: 2px; }\n.zr-cite-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }\n.zr-cite-excerpt summary { cursor: pointer; margin: 0 0 10px; }\n.zr-cite-modified, .zr-cite-status { color: var(--zr-muted); font-size: 12px; margin: 0 0 10px; overflow-wrap: anywhere; }\n.zr-cite-modified:empty { display: none; }\n.zr-cite-status { margin-top: 12px; margin-bottom: 0; }\nhtml[data-zr-active=\"on\"] [data-zr-comments] {\n  box-sizing: border-box !important; max-width: calc(var(--zr-width,720px) + 48px) !important;\n  margin: 16px auto 60px !important; padding: 24px !important; border-top: 1px solid var(--zr-rule) !important;\n  color: var(--zr-text) !important; background: var(--zr-bg) !important;\n}\n#zr-status {\n  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2147483647;\n  max-width: min(560px, calc(100vw - 48px)); border-radius: 10px; padding: 12px 18px;\n  background: var(--zr-ui, #fff); color: var(--zr-text, #292c32); box-shadow: 0 4px 24px #0003;\n  font: 14px/1.6 system-ui; pointer-events: none;\n}\n#zr-image-viewer {\n  position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center;\n  overflow: auto; background: #101217ed; padding: 64px 24px 24px; box-sizing: border-box;\n}\n#zr-image-viewer button { position: fixed; top: 16px; right: 24px; color: #fff; background: #30343d; border: 1px solid #68717e; border-radius: 20px; padding: 8px 14px; cursor: pointer; font: 14px system-ui; }\n#zr-image-viewer img { width: 94vw; height: calc(100vh - 100px); max-width: 94vw; max-height: calc(100vh - 100px); object-fit: contain; filter: none !important; cursor: zoom-in; flex-shrink: 0; }\n#zr-image-viewer.zr-image-zoomed { align-items: flex-start; justify-content: flex-start; }\n#zr-image-viewer img.zr-image-original { width: auto; height: auto; max-width: none; max-height: none; cursor: zoom-out; }\n#zr-toolbar button:focus-visible, #zr-toolbar select:focus-visible, #zr-launcher:focus-visible { outline: 2px solid #1772f6; outline-offset: 3px; }\n@media (max-width: 600px) {\n  #zr-toolbar { right: 12px; top: 12px; gap: 0; padding: 5px; }\n  #zr-toolbar { align-items: flex-start; }\n  #zr-toolbar .zr-toolbar__controls { gap: 0; flex-wrap: wrap; max-width: calc(100vw - 80px); }\n  #zr-toolbar .zr-toolbar__sep { margin: 0 2px; }\n  html[data-zr-active=\"on\"] :is(article.Post-Main, [data-zr-role=\"article\"])[data-zr-path] { padding: 48px 20px 70px !important; }\n}\n@media (prefers-reduced-motion: reduce) { #zr-launcher, #zr-toolbar { transition: none; } }\n@media print { #zr-launcher, #zr-toolbar, #zr-progress, #zr-toc, #zr-citation, #zr-status, #zr-image-viewer { display: none !important; } }\n");

/* ==========================================================================
   知乎专栏沉浸阅读 — content script
   目标页面：https://zhuanlan.zhihu.com/p/<id>
   思路：不克隆、不改写正文 DOM，而是把「正文节点所在的祖先链」之外的
        兄弟节点全部隐藏，再对正文做排版增强。保留代码、图片、公式等节点；
        页面脚本与动态灯箱交互是否正常，需在真实页面另行验证。
   ========================================================================== */
(() => {
  'use strict';

  const Citation = (() => {
// Pure citation formatting. The builder embeds these functions in the reader closure.
function citationLine(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim();
}

function citationDate(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{4})(?:-(\d{1,2})-(\d{1,2})(?=$|T|\s)|年(\d{1,2})月(\d{1,2})日)/);
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[2] || match[4]), day = Number(match[3] || match[5]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function citationMetadataDate(value, timeZone = 'Asia/Shanghai') {
  const text = String(value ?? '').trim(), calendar = citationDate(text);
  if (!calendar) return '';
  if (text.includes('T') && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(text)) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    const instant = new Date(text);
    if (!Number.isFinite(instant.getTime())) return '';
    // Zhihu uses its China publication calendar; other adapters supply their display timezone.
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  return calendar;
}

function citationURL(value) {
  const raw = String(value ?? '').trim();
  if (/[\u0000-\u0020\u007f]/.test(raw)) throw new Error('来源链接不能包含空白或控制字符。');
  let url;
  try { url = new URL(raw); } catch (_) { throw new Error('请填写有效的来源链接。'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('来源链接仅支持不含账号密码的 HTTP(S) 地址。');
  if (url.hostname === 'zhuanlan.zhihu.com' && /^\/p\/\d+\/?$/.test(url.pathname)) {
    url.search = ''; url.hash = ''; url.pathname = url.pathname.replace(/\/$/, '');
  }
  if (/^(?:www\.)?(?:x|twitter)\.com$/.test(url.hostname) && /^\/[A-Za-z0-9_]{1,15}\/article\/\d+\/?$/.test(url.pathname)) {
    url.hostname = 'x.com'; url.protocol = 'https:'; url.port = '';
    url.pathname = url.pathname.toLowerCase().replace(/\/$/, ''); url.search = ''; url.hash = '';
  }
  return url.href.replace(/[{}]/g, char => encodeURIComponent(char));
}

function canonicalArticleURL(value) { return citationURL(value); }

function citationKey(url) {
  const parsed = new URL(citationURL(url));
  const xId = parsed.hostname === 'x.com' && parsed.pathname.match(/^\/[^/]+\/article\/(\d+)$/)?.[1];
  if (xId) return 'x' + xId;
  const id = parsed.pathname.match(/^\/p\/(\d+)\/?$/)?.[1];
  if (id) return 'zhihu' + id;
  let hash = 2166136261;
  for (const char of url) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  return 'web' + (hash >>> 0).toString(16);
}

function escapeBibTeX(value) {
  const escaped = { '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };
  return citationLine(value).replace(/[\\{}&%$#_~^]/g, char => escaped[char]);
}

function normalizedCitation(raw) {
  const data = {
    title: citationLine(raw.title), author: citationLine(raw.author),
    authorLiteral: raw.authorLiteral !== false, url: citationURL(raw.url),
    key: citationLine(raw.key), published: '', accessed: ''
  };
  if (!data.title) throw new Error('请填写文章标题。');
  if (!/^[A-Za-z][A-Za-z0-9_.:-]{0,95}$/.test(data.key)) throw new Error('引用键须以英文字母开头，仅含字母、数字、点、下划线、冒号或短横线，最多 96 个字符。');
  for (const [field, label] of [['published', '发布日期'], ['accessed', '访问日期']]) {
    if (String(raw[field] ?? '').trim()) {
      data[field] = citationDate(raw[field]);
      if (!data[field]) throw new Error(`${label}须为有效日期，格式为 YYYY-MM-DD。`);
    }
  }
  return data;
}

function buildBibTeX(raw, format = 'online') {
  if (!['online', 'misc'].includes(format)) throw new Error('请选择支持的 BibTeX 格式。');
  const data = normalizedCitation(raw), fields = [];
  const field = (name, value) => fields.push(`  ${name.padEnd(12)} = {${value}}`);
  if (data.author) field('author', data.authorLiteral ? `{${escapeBibTeX(data.author)}}` : escapeBibTeX(data.author));
  field('title', `{${escapeBibTeX(data.title)}}`);
  if (format === 'online') {
    if (data.published) field('date', data.published);
    field('url', data.url);
    if (data.accessed) field('urldate', data.accessed);
  } else {
    if (data.published) field('year', data.published.slice(0, 4));
    field('howpublished', `\\url{${data.url}}`);
    field('url', data.url);
    const notes = [];
    if (data.published) notes.push('Published: ' + data.published);
    if (data.accessed) notes.push('Accessed: ' + data.accessed);
    if (notes.length) field('note', notes.join('; '));
  }
  return `@${format}{${data.key},\n${fields.join(',\n')}\n}\n`;
}

function buildExcerpt(raw, text) {
  const data = normalizedCitation(raw);
  const excerpt = String(text ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!excerpt) throw new Error('请先在正文中选中文字再打开引用，或在摘录框中粘贴原文。');
  if (excerpt.length > 50000) throw new Error('单次摘录超过 50000 个字符，请缩小选区后重试。');
  const markdown = value => value.replace(/([\\`*_[\]<>])/g, '\\$1');
  const source = `${data.author ? markdown(data.author) + '，' : ''}《${markdown(data.title)}》`;
  const dates = [data.published && '发布：' + data.published, data.accessed && '访问：' + data.accessed].filter(Boolean).join('；');
  return `${excerpt.split('\n').map(line => '> ' + line).join('\n')}\n\n— ${source}\n来源：<${data.url}>${dates ? '\n' + dates : ''}\n`;
}

function readCitationMetadata(doc, article, currentURL, now = new Date()) {
  const url = citationURL(currentURL), title = citationLine(article.titleEl.textContent);
  const zone = article.site === 'x' ? article.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Shanghai';
  const metadataDate = value => citationMetadataDate(value, zone);
  const xIdentity = value => {
    const item = new URL(value);
    return /^(?:www\.)?(?:x|twitter)\.com$/.test(item.hostname) ? item.pathname.match(/^\/[^/]+\/(?:article|status)\/(\d+)\/?$/)?.[1] : null;
  };
  const sameArticle = value => {
    try {
      const candidate = citationURL(new URL(value, currentURL).href);
      if (xIdentity(url) && xIdentity(candidate)) return xIdentity(url) === xIdentity(candidate);
      return new URL(candidate).pathname.replace(/\/$/, '') === new URL(url).pathname.replace(/\/$/, '') && new URL(candidate).origin === new URL(url).origin;
    } catch (_) { return false; }
  };
  const headMeta = name => [...(doc.head?.querySelectorAll('meta') || [])].find(el => [el.getAttribute('property'), el.getAttribute('name'), el.getAttribute('itemprop')].includes(name))?.getAttribute('content') || '';
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const headTitle = citationLine(headMeta('og:title'));
  const headMatches = (!canonical || sameArticle(canonical)) && (headTitle ? headTitle === title : String(doc.title).includes(title));
  let structured = null;
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    if (script.textContent.length > 262144) continue;
    let nodes;
    try { nodes = [JSON.parse(script.textContent)]; } catch (_) { continue; }
    for (let visited = 0; nodes.length && visited < 100; visited++) {
      const item = nodes.shift();
      if (Array.isArray(item)) { nodes.push(...item.slice(0, 100)); continue; }
      if (!item || typeof item !== 'object') continue;
      if (item['@graph']) nodes.push(item['@graph']);
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      if (!types.some(type => ['Article', 'NewsArticle', 'BlogPosting'].includes(type))) continue;
      const candidateURL = item.url || item.mainEntityOfPage?.['@id'] || (typeof item.mainEntityOfPage === 'string' && item.mainEntityOfPage) || item['@id'];
      const headline = citationLine(item.headline || item.name);
      if (candidateURL ? sameArticle(candidateURL) && (!headline || headline === title) : headMatches && headline === title) { structured = item; break; }
    }
    if (structured) break;
  }
  const authorElement = article.rootEl.querySelector('.Post-Author .AuthorInfo-name, .Post-Author [itemprop="name"], .Post-Author a[href*="/people/"], .Post-Author a[href*="/org/"]');
  const structuredAuthors = structured?.author ? (Array.isArray(structured.author) ? structured.author : [structured.author]) : [];
  const directAuthor = article.site === 'x' ? citationLine(article.authorName || article.authorEl?.textContent) : citationLine(authorElement?.textContent);
  const headAuthor = headMatches ? citationLine(headMeta('author')) : '';
  const author = directAuthor || structuredAuthors.map(item => citationLine(typeof item === 'string' ? item : item?.name)).filter(Boolean).join(' and ') || (/^https?:\/\//i.test(headAuthor) ? '' : headAuthor);
  const elementDate = name => {
    const el = [...article.rootEl.querySelectorAll(`[itemprop~="${name}"]`)].find(node => article.site !== 'x' || !article.richEl.contains(node));
    return el ? metadataDate(el.getAttribute('datetime') || el.getAttribute('content') || el.textContent) : '';
  };
  const timeElement = article.rootEl.querySelector('.ContentItem-time');
  const timeText = timeElement ? [timeElement.textContent, timeElement.getAttribute('title'), timeElement.getAttribute('aria-label'), timeElement.getAttribute('data-tooltip')].filter(Boolean).join(' ') : '';
  const labeledDate = label => citationDate(timeText.match(new RegExp(`(?:${label})\\s*(\\d{4}(?:-\\d{1,2}-\\d{1,2}|年\\d{1,2}月\\d{1,2}日))`))?.[1]);
  const published = (article.site === 'x' ? metadataDate(article.timeEl?.getAttribute('datetime')) : labeledDate('发布于|发表于')) || elementDate('datePublished') || metadataDate(structured?.datePublished) || (headMatches ? metadataDate(headMeta('article:published_time') || headMeta('datePublished')) : '');
  const modified = (article.site === 'x' ? '' : labeledDate('编辑于|更新于')) || elementDate('dateModified') || metadataDate(structured?.dateModified) || (headMatches ? metadataDate(headMeta('article:modified_time') || headMeta('dateModified')) : '');
  const accessed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { title, author, authorLiteral: true, published, modified, accessed, url, key: citationKey(url) };
}

return { readCitationMetadata, buildBibTeX, buildExcerpt, canonicalArticleURL };
})();
  const Sites = (() => {
// Platform DOM contracts are kept separate from reading state and rendering.
function articlePath(pathname) {
  let match = pathname.match(/^\/p\/([^/]+)\/?$/);
  if (match) return { site: 'zhihu', id: match[1] };
  match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/article\/(\d+)\/?$/);
  return match ? { site: 'x', handle: match[1].toLowerCase(), id: match[2] } : null;
}

function articleBlocks(rich) {
  const nodes = [...rich.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,figure,table,[data-block="true"],.longform-unstyled,.longform-unstyled-narrow')];
  return nodes.filter((node, i) => !nodes.slice(0, i).some(parent => parent.contains(node) && parent.textContent.trim() === node.textContent.trim()));
}

function articleHeadings(rich) {
  return [...rich.querySelectorAll('h1,h2,h3,h4,[role="heading"][aria-level],.longform-header-one,.longform-header-one-narrow,.longform-header-two,.longform-header-two-narrow')]
    .filter((node, i, nodes) => node.textContent.trim() && !nodes.slice(0, i).some(parent => parent.contains(node)));
}

function headingLevel(node) {
  const semantic = /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : Number(node.getAttribute('aria-level'));
  if (semantic >= 1 && semantic <= 6) return semantic;
  return /longform-header-one/.test(node.className) ? 1 : 2;
}

function findSiteArticle(doc, currentURL) {
  const route = articlePath(new URL(currentURL).pathname);
  if (!route) return null;
  if (route.site === 'zhihu') {
    const rootEl = doc.querySelector('article.Post-Main');
    const titleEl = rootEl?.querySelector('h1.Post-Title');
    const richEl = rootEl?.querySelector('.Post-RichTextContainer .RichText, .RichText.Post-RichText') || rootEl?.querySelector('.RichText');
    if (!rootEl || !titleEl || !richEl || richEl.closest('.Post-Editor, .RichText--editable')) return null;
    return { site: 'zhihu', rootEl, titleEl, richEl,
      headerEl: rootEl.querySelector('.Post-Header'), authorEl: rootEl.querySelector('.Post-Author'),
      timeEl: rootEl.querySelector('.ContentItem-time'), timeZone: 'Asia/Shanghai' };
  }
  const available = node => !node.closest('[hidden],[aria-hidden="true"]') && node.getAttribute('contenteditable') !== 'true';
  const readViews = [...doc.querySelectorAll('[data-testid="twitterArticleReadView"]')].filter(node => available(node) && !node.parentElement?.closest('[data-testid="twitterArticleReadView"]'));
  const candidates = [];
  for (const rootEl of readViews) {
    const richEl = rootEl.querySelector('[data-testid="twitterArticleRichTextView"], [data-testid="longformRichTextComponent"]');
    const titleEl = rootEl.querySelector('[data-testid="twitter-article-title"]') || [...rootEl.querySelectorAll('h1')].find(el => !richEl?.contains(el));
    if (richEl && titleEl && !richEl.contains(titleEl) && available(richEl)) candidates.push({ rootEl, richEl, titleEl });
  }
  if (!candidates.length) {
    for (const richEl of doc.querySelectorAll('.x-article-body')) {
      if (!available(richEl)) continue;
      const rootEl = richEl.closest('article') || richEl.closest('main');
      const titleEl = rootEl && [...rootEl.querySelectorAll('h1')].find(el => !richEl.contains(el));
      if (rootEl && titleEl) candidates.push({ rootEl, richEl, titleEl });
    }
  }
  const scopeFor = item => item.rootEl.closest('article[data-testid="tweet"]') || item.rootEl.parentElement?.closest('article[data-testid="tweet"]') || item.rootEl;
  const linkedIds = item => [...scopeFor(item).querySelectorAll('a[href]')].filter(link => !item.richEl.contains(link)).map(link => {
    try { return new URL(link.getAttribute('href'), currentURL).pathname.match(/^\/[^/]+\/(?:status|article)\/(\d+)\/?$/)?.[1]; } catch (_) { return null; }
  }).filter(Boolean);
  const bound = candidates.filter(item => linkedIds(item).includes(route.id));
  const eligible = bound.length ? bound : candidates.filter(item => linkedIds(item).length === 0);
  if (eligible.length !== 1) return null;
  const article = eligible[0];
  const scope = scopeFor(article);
  const outsideBody = node => !article.richEl.contains(node) && !node.closest('[role="dialog"],[role="tooltip"]');
  const profiles = [...scope.querySelectorAll('a[href]')].filter(link => {
    if (!outsideBody(link) || !link.textContent.trim()) return false;
    try {
      const url = new URL(link.getAttribute('href'), currentURL);
      return /^(?:www\.)?(?:x|twitter)\.com$/.test(url.hostname) && url.pathname.toLowerCase().replace(/\/$/, '') === '/' + route.handle;
    } catch (_) { return false; }
  });
  const authorEl = profiles.find(link => !link.textContent.trim().startsWith('@')) || profiles[0] || null;
  const authorName = authorEl?.textContent.replace(new RegExp(`\\s*@${route.handle}$`, 'i'), '').trim() || '';
  const times = [...scope.querySelectorAll('time[datetime]')].filter(outsideBody);
  const timeEl = times.find(time => {
    const href = time.closest('a[href]')?.getAttribute('href');
    try { return href && new RegExp(`^/[^/]+/(?:status|article)/${route.id}/?$`).test(new URL(href, currentURL).pathname); } catch (_) { return false; }
  }) || (times.length === 1 && scope === article.rootEl ? times[0] : null);
  return { ...article, site: 'x', authorEl, authorName, timeEl, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    coverEl: [...article.rootEl.querySelectorAll('[data-testid="tweetPhoto"] img')].find(img => !article.richEl.contains(img)) || null };
}

return { articlePath, findSiteArticle, articleBlocks, articleHeadings, headingLevel };
})();

  if (window.__ZR_READER_LOADED__) return;
  window.__ZR_READER_LOADED__ = true;

  let HTML = document.documentElement;
  const ACTIVE_ATTR = 'data-zr-active';
  const SETTINGS_KEY = 'zr-settings';
  const POSITIONS_KEY = 'zr-reading-positions-v1';
  const POSITION_LIMIT = 100;
  const POSITION_TTL = 90 * 24 * 60 * 60 * 1000;
  const THEMES = ['system', 'light', 'sepia', 'dark'];
  const SYSTEM_THEME = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const FONT_MIN = 16;
  const FONT_MAX = 28;
  const WIDTHS = ['auto', 720, 960, 'full'];
  const SHORTCUT = /Mac/.test(navigator.platform) ? '⌥R' : 'Alt+R';
  const DEFAULTS = Object.freeze({
    fontSize: 19,
    theme: 'system',
    width: 'auto',
    serif: false,
    progress: true,
    auto: true,
    imageDim: false
  });

  const STORE = {
    async get(key) { return { [key]: await GM_getValue(key, null) }; },
    async set(values) {
      for (const [key, value] of Object.entries(values)) await GM_setValue(key, value);
    }
  };

  const settings = { ...DEFAULTS };
  const state = {
    active: false,
    article: null,
    hidden: [],
    pathMarked: [],
    lastRouteKey: routeKey(),
    ui: null,
    launcher: null,
    raf: 0,
    autoSuppressed: false,
    positions: {}, positionTimer: null, writeQueue: Promise.resolve(),
    userNavigated: false, resumeObserver: null, resumeTimer: null,
    viewer: null, comments: [], commentPath: [], commentReturn: null, articleKey: null,
    headings: [], tocOpen: false, statusTimer: null,
    citationOpen: false, citationFocus: null, citationEpoch: 0, roleMarked: [],
    resumePending: false, resumePendingTimer: null, resumeAttempted: false, routeWait: null, routeSnapshot: null
  };

  /* ------------------------------------------------------------------ 工具 */

  const raf = (fn) => requestAnimationFrame(fn);

  const ICONS = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    sepia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8.5 7.5h7M8.5 11h5"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    width: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/><path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    serif: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19V5h6.5a4 4 0 0 1 0 8H5"/><path d="M14.5 12l4.5 7M19 12l-4.5 7"/></svg>'
  };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function sanitize(raw) {
    const out = { ...DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) };
    out.fontSize = clamp(Math.round(Number(out.fontSize) || DEFAULTS.fontSize), FONT_MIN, FONT_MAX);
    out.width = WIDTHS.includes(out.width) ? out.width : WIDTHS.includes(Number(out.width)) ? Number(out.width) : DEFAULTS.width;
    out.theme = THEMES.includes(out.theme) ? out.theme : DEFAULTS.theme;
    out.serif = Boolean(out.serif);
    out.progress = out.progress !== false;
    out.auto = Boolean(out.auto);
    out.imageDim = Boolean(out.imageDim);
    return out;
  }

  function saveSettings() {
    if (!STORE) return;
    try {
      STORE.set({ [SETTINGS_KEY]: { ...settings } }).catch(() => {});
    } catch (_) {
      /* 脚本管理器的存储不可用时忽略，当前页面仍可使用 */
    }
  }

  async function loadSettings() {
    if (!STORE) return;
    try {
      const res = await STORE.get(SETTINGS_KEY);
      Object.assign(settings, sanitize(res && res[SETTINGS_KEY]));
    } catch (_) {
      /* 使用默认值 */
    }
  }

  function showStatus(message) {
    let status = document.getElementById('zr-status');
    if (!status) {
      status = document.createElement('div'); status.id = 'zr-status';
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      document.body.append(status);
    }
    status.textContent = message;
    clearTimeout(state.statusTimer);
    state.statusTimer = setTimeout(() => status.remove(), 4500);
  }

  /* -------------------------------------------------------------- 正文定位 */

  function findArticle() {
    const article = Sites.findSiteArticle(document, location.href);
    if (!article) return null;
    const { titleEl, richEl, rootEl: articleEl } = article;
    if (!richEl.isConnected || !titleEl.textContent.trim()) return null;

    const textLength = (richEl.innerText || '').replace(/\s+/g, '').length;
    if (!textLength && !richEl.querySelector('img, video, pre, svg')) return null;
    const waiting = state.routeWait;
    if (waiting?.key === routeKey() && articleEl === waiting.root && richEl === waiting.rich && richEl.textContent === waiting.text) return null;
    if (waiting?.key === routeKey()) state.routeWait = null;
    if (routeKey() === state.lastRouteKey) rememberRouteArticle({ rootEl: articleEl, richEl });

    return { ...article, textLength };
  }

  function rememberRouteArticle(article) {
    if (article?.rootEl.isConnected && article.richEl.isConnected && routeKey() === state.lastRouteKey && !state.routeWait) {
      state.routeSnapshot = { key: state.lastRouteKey, root: article.rootEl, rich: article.richEl, text: article.richEl.textContent };
    }
  }

  /* -------------------------------------------------------- 隐藏非正文内容 */

  function snapshotStyle(el) {
    return { el, cssText: el.getAttribute('style') };
  }

  function hideElement(el) {
    if (!(el instanceof HTMLElement)) return;
    if (el.id && el.id.startsWith('zr-')) return;
    if (containsDialog(el) || state.comments.some(root => el.contains(root))) return;
    if (el.hasAttribute('data-zr-hidden')) return;
    state.hidden.push(snapshotStyle(el));
    el.setAttribute('data-zr-hidden', '');
    el.style.setProperty('display', 'none', 'important');
  }

  const DIALOGS = '[role="dialog"], [aria-modal="true"], .Modal-wrapper, .SignFlow, iframe[src*="captcha"]';

  function containsDialog(el) {
    return el.matches(DIALOGS) || Boolean(el.querySelector(DIALOGS));
  }

  function hasCriticalDialog() {
    return Array.from(document.querySelectorAll(DIALOGS)).some(el => {
      if (el.closest('[id^="zr-"]')) return false;
      const authentication = el.matches('.SignFlow, iframe[src*="captcha"]') || /登录|验证码|安全验证|身份验证|sign in|log in|captcha/i.test(el.textContent || '');
      if (!authentication) return false;
      const style = getComputedStyle(el);
      return el.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
  }

  function releaseHidden(el) {
    const index = state.hidden.findIndex(item => item.el === el);
    if (index < 0) return;
    const item = state.hidden.splice(index, 1)[0];
    if (item.cssText === null) el.removeAttribute('style');
    else el.setAttribute('style', item.cssText);
    el.removeAttribute('data-zr-hidden');
  }

  /**
   * 从正文节点向上走到 #root，把每一层「不在正文链上」的兄弟节点全部隐藏。
   * 不依赖知乎会频繁变化的 css-xxxx 哈希类名。
   */
  function hideNonArticle(rootEl) {
    // A late dialog may have appeared inside a previously hidden site wrapper.
    for (const item of [...state.hidden]) {
      if (containsDialog(item.el) || state.comments.some(root => item.el.contains(root))) releaseHidden(item.el);
    }
    let node = rootEl;
    while (node && node.parentElement && node !== document.body) {
      const parent = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if ([state.article?.authorEl, state.article?.timeEl].some(kept => kept && sibling.contains(kept))) continue;
        // Unknown portals outside the site root remain available, including
        // native lightboxes and accessibility/verification interfaces.
        if (sibling !== node && (parent !== document.body || sibling.matches('.AppHeader, .Post-Sub, .Comments-container'))) hideElement(sibling);
      }
      node = parent;
    }

  }

  function markPath(rootEl) {
    let node = rootEl;
    while (node && node !== document.body && node !== HTML) {
      if (!node.hasAttribute('data-zr-path')) { node.setAttribute('data-zr-path', ''); state.pathMarked.push(node); }
      node = node.parentElement;
    }
  }

  function restorePage() {
    for (const item of state.hidden) {
      if (!item.el || !item.el.isConnected) continue;
      if (item.cssText === null) item.el.removeAttribute('style');
      else item.el.setAttribute('style', item.cssText);
      item.el.removeAttribute('data-zr-hidden');
    }
    state.hidden = [];

    for (const el of state.pathMarked) {
      if (el && el.isConnected) el.removeAttribute('data-zr-path');
    }
    state.pathMarked = [];
    for (const { el, value } of state.roleMarked) {
      if (value === null) el.removeAttribute('data-zr-role'); else el.setAttribute('data-zr-role', value);
    }
    state.roleMarked = [];
  }

  function markArticleRoles(article) {
    for (const [role, el] of [['article', article.rootEl], ['title', article.titleEl], ['content', article.richEl], ['header', article.headerEl], ['author', article.authorEl], ['time', article.timeEl], ['cover', article.coverEl]]) {
      if (!el) continue;
      state.roleMarked.push({ el, value: el.getAttribute('data-zr-role') }); el.setAttribute('data-zr-role', role);
    }
    if (article.site === 'x') {
      markPath(article.richEl.parentElement);
      if (article.authorEl) markPath(article.authorEl.parentElement);
      if (article.timeEl) markPath(article.timeEl.parentElement);
    }
    HTML.setAttribute('data-zr-site', article.site);
  }

  /* ---------------------------------------------------------- 阅读位置 */

  function captureReadingPosition(article = state.article) {
    const fallbackY = window.scrollY;
    if (fallbackY <= 2) return { atTop: true, fallbackY };
    if (!article || !article.richEl.isConnected) return { fallbackY };
    const readingLine = Math.min(48, window.innerHeight / 3);
    const blocks = [article.titleEl, ...Sites.articleBlocks(article.richEl)];
    for (const el of blocks) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || rect.height <= 0 || rect.bottom <= readingLine || rect.top >= window.innerHeight) continue;
      return {
        el, fallbackY,
        fraction: rect.top < 0 ? clamp(-rect.top / rect.height, 0, 1) : 0,
        offset: Math.max(0, rect.top)
      };
    }
    return { fallbackY };
  }

  function restoreReadingPosition(position) {
    if (!position) return;
    let top = position.atTop ? 0 : position.fallbackY;
    if (position.el && position.el.isConnected) {
      const rect = position.el.getBoundingClientRect();
      top = window.scrollY + rect.top + rect.height * position.fraction - position.offset;
    }
    // A page may set scroll-behavior:smooth; restoration must finish before paint.
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }

  /* -------------------------------------------------------- 本地断点续读 */

  function cleanPositions(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([url, p]) => {
      let articleURL;
      try { articleURL = new URL(url); } catch (_) { return false; }
      return ['http:', 'https:'].includes(articleURL.protocol) && !articleURL.search && !articleURL.hash && Sites.articlePath(articleURL.pathname) && p && typeof p === 'object' &&
        Number.isFinite(p.updatedAt) && p.updatedAt > Date.now() - POSITION_TTL &&
        typeof p.text === 'string' && p.text.length <= 120 && typeof p.id === 'string' && p.id.length <= 200 &&
        Number.isFinite(p.fraction) && p.fraction >= 0 && p.fraction <= 1 &&
        Number.isFinite(p.offset) && p.offset >= 0 && p.offset <= 2000;
    }).sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, POSITION_LIMIT));
  }

  async function loadPositions() {
    try { state.positions = cleanPositions((await STORE?.get(POSITIONS_KEY))?.[POSITIONS_KEY]); }
    catch (_) { state.positions = {}; }
  }

  function writePosition(url, position, clearAll = false) {
    if (!STORE) return Promise.resolve(false);
    if (clearAll) state.positions = {};
    else if (position) state.positions[url] = position;
    else delete state.positions[url];
    state.writeQueue = state.writeQueue.catch(() => {}).then(async () => {
      const fresh = clearAll ? {} : cleanPositions((await STORE.get(POSITIONS_KEY))?.[POSITIONS_KEY]);
      if (!clearAll) {
        if (position) fresh[url] = position;
        else delete fresh[url];
      }
      state.positions = cleanPositions(fresh);
      await STORE.set({ [POSITIONS_KEY]: state.positions });
      return true;
    }).catch(() => false);
    return state.writeQueue;
  }

  function articleProgress() {
    if (!state.article?.richEl.isConnected) return 0;
    const rect = state.article.richEl.getBoundingClientRect();
    const span = rect.height - window.innerHeight + 36;
    return span > 4 ? clamp((36 - rect.top) / span, 0, 1) : (rect.bottom <= window.innerHeight ? 1 : 0);
  }

  function saveReadingPosition() {
    if (!state.active || state.comments.length || !state.userNavigated || state.viewer) return;
    if (!state.article?.richEl.isConnected) return;
    const key = state.articleKey;
    const position = captureReadingPosition();
    if (position.atTop || articleProgress() >= 0.999) { writePosition(key, null); return; }
    if (!position.el || !state.article.richEl.contains(position.el)) return;
    writePosition(key, {
      id: (position.el.id || '').slice(0, 200),
      text: (position.el.textContent || '').trim().slice(0, 120),
      fraction: position.fraction, offset: position.offset,
      title: (state.article.titleEl.textContent || '').slice(0, 200), updatedAt: Date.now()
    });
  }

  function stopResumeTracking() {
    state.resumeObserver?.disconnect(); state.resumeObserver = null;
    clearTimeout(state.resumeTimer);
    clearTimeout(state.resumePendingTimer);
    state.resumePending = false; state.resumeAttempted = true;
  }

  function markUserNavigation(event) {
    if (event.type === 'pointerdown' && event.target.closest?.('#zr-launcher')) return;
    if (event.type === 'keydown' && !['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) return;
    state.userNavigated = true;
    stopResumeTracking();
  }

  function resumeReading() {
    if (state.resumeAttempted) return;
    if (state.userNavigated || location.hash || window.scrollY > 2) { stopResumeTracking(); return; }
    const saved = state.positions[routeKey()];
    if (!saved) { state.resumeAttempted = true; return; }
    const blocks = Sites.articleBlocks(state.article.richEl);
    const sameText = el => (el.textContent || '').trim().slice(0, 120) === saved.text;
    const byId = saved.id && document.getElementById(saved.id);
    const matches = blocks.filter(sameText);
    const el = byId && state.article.richEl.contains(byId) && sameText(byId) ? byId : (matches.length === 1 ? matches[0] : null);
    if (!el) {
      if (!state.resumePending) {
        state.resumePending = true;
        state.resumePendingTimer = setTimeout(() => {
          const notify = state.active && !state.userNavigated;
          stopResumeTracking();
          if (notify) showStatus('未找到旧的阅读段落，已保留当前页面位置。');
        }, 5000);
      }
      return;
    }
    stopResumeTracking();
    const position = { el, fraction: saved.fraction, offset: saved.offset, fallbackY: 0 };
    restoreReadingPosition(position);
    if (typeof ResizeObserver === 'function') {
      state.resumeObserver = new ResizeObserver(() => {
        if (state.active && !state.userNavigated && el.isConnected) restoreReadingPosition(position);
      });
      state.resumeObserver.observe(state.article.richEl);
      state.resumeTimer = setTimeout(stopResumeTracking, 3000);
    }
  }

  function readFromStart() {
    stopResumeTracking();
    clearTimeout(state.positionTimer);
    state.positionTimer = null;
    writePosition(routeKey(), null).then(ok => { if (!ok) showStatus('已回到文章开头，但未能清除旧的本地进度。'); });
    state.userNavigated = false;
    if (state.comments.length) toggleComments();
    window.scrollTo({ top: 0, behavior: 'instant' });
    updateProgress(); showStatus('已回到文章开头。');
  }

  function clearReadingPositions() {
    stopResumeTracking(); clearTimeout(state.positionTimer);
    state.positionTimer = null;
    state.userNavigated = false;
    return writePosition('', null, true).then(ok => showStatus(ok
      ? '已清除本地阅读进度，阅读设置保持不变。'
      : '未能清除本地阅读进度，请检查脚本管理器存储后重试。'));
  }

  /* -------------------------------------------------------- 目录与评论 */

  function refreshTOC() {
    if (!state.ui || !state.article) return;
    const headings = Sites.articleHeadings(state.article.richEl);
    const changed = headings.length !== state.headings.length || headings.some((el, i) => el !== state.headings[i]?.el || el.textContent !== state.headings[i]?.text);
    if (!changed) return;
    const list = state.ui.toc.querySelector('.zr-toc-list'); list.replaceChildren();
    state.headings = headings.map(el => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = el.textContent.trim(); button.style.paddingLeft = (12 + (Sites.headingLevel(el) - 1) * 12) + 'px';
      button.addEventListener('click', () => {
        if (state.comments.length) toggleComments();
        state.userNavigated = true; stopResumeTracking();
        el.scrollIntoView({ block: 'start', behavior: 'instant' }); updateProgress();
      });
      list.append(button); return { el, button, text: el.textContent };
    });
    state.ui.toolbar.querySelector('[data-zr-act="toc"]').disabled = !headings.length;
    state.ui.toc.querySelector('.zr-toc-empty').hidden = Boolean(headings.length);
  }

  function toggleTOC(force) {
    if (!state.ui) return;
    if (force !== false && !state.tocOpen) closeCitation(false);
    state.tocOpen = typeof force === 'boolean' ? force : !state.tocOpen;
    state.ui.toc.hidden = !state.tocOpen;
    state.ui.toolbar.querySelector('[data-zr-act="toc"]').setAttribute('aria-expanded', String(state.tocOpen));
    updateProgress();
  }

  function positionTOC() {
    if (!state.ui || !state.tocOpen) return;
    const top = Math.ceil(state.ui.toolbar.getBoundingClientRect().bottom + 12);
    state.ui.toc.style.top = top + 'px';
    state.ui.toc.style.maxHeight = `calc(100vh - ${top + 16}px)`;
  }

  function clearCommentMarkers() {
    for (const root of state.comments) root.removeAttribute('data-zr-comments');
    for (const el of state.commentPath) el.removeAttribute('data-zr-path');
    state.comments = []; state.commentPath = [];
  }

  function toggleComments() {
    if (!state.ui || !state.article) return;
    if (state.article.site === 'x') { showStatus('请退出阅读，使用 X 原页的回复入口。'); return; }
    const button = state.ui.toolbar.querySelector('[data-zr-act="comments"]');
    if (state.comments.length) {
      clearCommentMarkers(); hideNonArticle(state.article.rootEl);
      restoreReadingPosition(state.commentReturn); state.commentReturn = null;
      button.textContent = '评论'; button.setAttribute('aria-pressed', 'false'); return;
    }
    const roots = Array.from(document.querySelectorAll('.Comments-container, .Post-Comments')).filter(el => !state.article.richEl.contains(el));
    const root = roots.find(el => !roots.some(other => other !== el && other.contains(el)));
    if (!root) { showStatus('当前页面尚未加载评论，请点“退出”后使用原站评论入口。'); return; }
    state.commentReturn = captureReadingPosition(); state.comments = [root];
    let node = root;
    while (node && node !== document.body) {
      releaseHidden(node);
      if (!node.hasAttribute('data-zr-path')) { node.setAttribute('data-zr-path', ''); state.commentPath.push(node); }
      node = node.parentElement;
    }
    root.setAttribute('data-zr-comments', '');
    button.textContent = '返回正文'; button.setAttribute('aria-pressed', 'true');
    stopResumeTracking();
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  /* -------------------------------------------------------- 图片查看 */

  function closeImageViewer() {
    if (!state.viewer) return;
    const { overlay, previousFocus } = state.viewer; state.viewer = null; overlay.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function onArticleImage(event) {
    if (!state.active || state.viewer || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const image = event.target.closest('img');
    if (!image || (!state.article.richEl.contains(image) && image !== state.article.coverEl) || image.getBoundingClientRect().width < 48 || image.classList.contains('ztext-math') || image.src.includes('/profile_images/')) return;
    const source = image.currentSrc || image.src;
    if (!source || !/^(https?:|data:image\/|blob:)/i.test(source)) return;
    event.preventDefault(); event.stopPropagation(); stopResumeTracking();
    const overlay = document.createElement('div'); overlay.id = 'zr-image-viewer';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', '图片放大查看');
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭（Esc）'; close.setAttribute('aria-label', '关闭图片');
    const full = document.createElement('img'); full.src = source; full.alt = image.alt || '文章图片';
    full.title = '点击切换原尺寸'; full.addEventListener('click', () => {
      overlay.classList.toggle('zr-image-zoomed', full.classList.toggle('zr-image-original'));
    });
    overlay.append(close, full); document.body.append(overlay);
    state.viewer = { overlay, previousFocus: document.activeElement };
    close.addEventListener('click', closeImageViewer);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeImageViewer(); });
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeImageViewer(); }
      else if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
    });
    close.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ 设置与主题 */

  function applySettings(preservePosition = true) {
    const position = preservePosition && state.active ? captureReadingPosition() : null;
    HTML.style.setProperty('--zr-font-size', settings.fontSize + 'px');
    HTML.style.setProperty('--zr-width', settings.width === 'auto' ? 'min(88vw, 1440px)' : settings.width === 'full' ? 'calc(100vw - 80px)' : settings.width + 'px');
    const theme = settings.theme === 'system'
      ? (SYSTEM_THEME?.matches ? 'dark' : 'light') : settings.theme;
    HTML.setAttribute('data-zr-theme', theme);
    HTML.setAttribute('data-zr-theme-mode', settings.theme);
    HTML.setAttribute('data-zr-font', settings.serif ? 'serif' : 'sans');
    HTML.setAttribute('data-zr-image-dim', settings.imageDim ? 'on' : 'off');
    if (state.ui && state.ui.progress) {
      state.ui.progress.hidden = !settings.progress;
      state.ui.progressText.hidden = !settings.progress;
    }
    if (state.ui) {
      state.ui.toolbar.querySelector('#zr-theme').value = settings.theme;
      state.ui.toolbar.querySelector('#zr-image-dim').checked = settings.imageDim;
      state.ui.toolbar.querySelector('#zr-width').value = String(settings.width);
    }
    restoreReadingPosition(position);
  }

  function bindSystemTheme() {
    const onChange = () => {
      if (state.active && settings.theme === 'system') applySettings();
    };
    if (SYSTEM_THEME?.addEventListener) SYSTEM_THEME.addEventListener('change', onChange);
    else if (SYSTEM_THEME?.addListener) SYSTEM_THEME.addListener(onChange);
  }

  function changeFont(delta) {
    settings.fontSize = clamp(settings.fontSize + delta, FONT_MIN, FONT_MAX);
    applySettings();
    saveSettings();
    if (state.ui) {
      state.ui.toolbar.style.setProperty('--zr-flash', '1');
      raf(() => raf(() => state.ui && state.ui.toolbar.style.removeProperty('--zr-flash')));
    }
  }

  function cycleTheme() {
    const index = THEMES.indexOf(settings.theme);
    settings.theme = THEMES[(index + 1) % THEMES.length];
    applySettings();
    saveSettings();
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    settings.theme = theme;
    applySettings();
    saveSettings();
  }

  function toggleWidth() {
    settings.width = WIDTHS[(WIDTHS.indexOf(settings.width) + 1) % WIDTHS.length];
    applySettings();
    saveSettings();
  }

  function selectWidth(value) {
    const width = ['auto', 'full'].includes(value) ? value : Number(value);
    if (!WIDTHS.includes(width)) return;
    settings.width = width; applySettings(); saveSettings();
  }

  function toggleSerif() {
    settings.serif = !settings.serif;
    applySettings();
    saveSettings();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await HTML.requestFullscreen();
    } catch (_) {
      showStatus('浏览器未允许全屏，请使用浏览器菜单进入全屏。');
    }
  }

  /* -------------------------------------------------------------------- UI */

  function selectedArticleText() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1 || !state.article) return '';
    const range = selection.getRangeAt(0), rich = state.article.richEl;
    if (!rich.contains(range.startContainer) || !rich.contains(range.endContainer)) return '';
    return selection.toString().trim();
  }

  function citationForm() {
    if (!state.active || routeKey() !== state.articleKey) throw new Error('文章已切换，请重新打开引用。');
    const panel = state.ui.citation;
    const value = name => panel.querySelector(`[name="${name}"]`).value;
    return {
      title: value('title'), author: value('author'), url: value('url'),
      key: value('key'), published: value('published'), accessed: value('accessed'),
      authorLiteral: panel.querySelector('[name="authorLiteral"]').checked
    };
  }

  function citationStatus(message) {
    const status = state.ui?.citation.querySelector('.zr-cite-status');
    if (status && status.textContent !== message) status.textContent = message;
  }

  function refreshCitationPreview() {
    const panel = state.ui.citation, preview = panel.querySelector('[name="preview"]');
    try {
      const data = citationForm();
      preview.value = Citation.buildBibTeX(data, panel.querySelector('[name="format"]').value);
      panel.querySelector('[data-zr-cite-action="copy"]').disabled = false;
      panel.querySelector('[data-zr-cite-action="download"]').disabled = false;
      panel.querySelector('[data-zr-cite-action="excerpt"]').disabled = !panel.querySelector('[name="excerpt"]').value.trim();
      const hints = [];
      if (!data.author.trim()) hints.push('未找到作者，导出时将省略作者字段，可手动补充。');
      if (!data.published.trim()) hints.push('未注明发布日期，导出时将省略，编辑日期不会代替发布日期。');
      if (panel.querySelector('[name="format"]').value === 'misc') hints.push('传统 BibTeX 的链接显示需要 LaTeX 项目加载 url 或 hyperref。');
      citationStatus(hints.join(' ') || '请核对署名与日期。修改仅用于本次导出。');
    } catch (error) {
      preview.value = '';
      for (const action of ['copy', 'download', 'excerpt']) panel.querySelector(`[data-zr-cite-action="${action}"]`).disabled = true;
      citationStatus(error.message);
    }
  }

  function positionCitation() {
    if (!state.ui || !state.citationOpen) return;
    const top = Math.ceil(state.ui.toolbar.getBoundingClientRect().bottom + 12);
    state.ui.citation.style.top = top + 'px';
    state.ui.citation.style.maxHeight = `calc(100vh - ${top + 16}px)`;
  }

  function closeCitation(restoreFocus = true) {
    if (!state.ui || !state.citationOpen) return;
    state.citationOpen = false; state.citationEpoch++; state.ui.citation.hidden = true;
    state.ui.toolbar.querySelector('[data-zr-act="cite"]').setAttribute('aria-expanded', 'false');
    const focus = state.citationFocus; state.citationFocus = null;
    // Excerpts and edited metadata are temporary, never stored in GM storage.
    for (const input of state.ui.citation.querySelectorAll('input:not([type="checkbox"]),textarea')) input.value = '';
    state.ui.citation.querySelector('.zr-cite-manual').hidden = true;
    if (restoreFocus) {
      const target = focus?.isConnected && focus.getClientRects().length && focus.matches('button,a[href],input,select,textarea,[tabindex]')
        ? focus : state.ui.toolbar.querySelector('.zr-toolbar__handle');
      target.focus({ preventScroll: true });
    }
  }

  function toggleCitation(excerpt = '') {
    if (state.citationOpen) { closeCitation(); return; }
    if (!state.ui || !state.article || routeKey() !== state.articleKey) return;
    const panel = state.ui.citation;
    let data;
    try { data = Citation.readCitationMetadata(document, state.article, routeKey()); }
    catch (error) { showStatus(error.message); return; }
    for (const name of ['title', 'author', 'published', 'accessed', 'url', 'key']) panel.querySelector(`[name="${name}"]`).value = data[name];
    panel.querySelector('[name="authorLiteral"]').checked = true;
    panel.querySelector('[name="format"]').value = 'online';
    panel.querySelector('[name="excerpt"]').value = excerpt;
    panel.querySelector('.zr-cite-excerpt').open = Boolean(excerpt);
    panel.querySelector('.zr-cite-modified').textContent = data.modified ? '页面编辑日期：' + data.modified + '（不会作为发布日期）' : '';
    state.citationFocus = document.activeElement;
    toggleTOC(false); state.citationOpen = true; state.citationEpoch++; panel.hidden = false;
    state.ui.toolbar.querySelector('[data-zr-act="cite"]').setAttribute('aria-expanded', 'true');
    refreshCitationPreview(); positionCitation();
    panel.querySelector('[data-zr-cite-action="close"]').focus({ preventScroll: true });
  }

  async function copyCitationText(text) {
    const panel = state.ui.citation, epoch = state.citationEpoch;
    panel.querySelector('.zr-cite-manual').hidden = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (panel.isConnected && !panel.hidden && state.citationEpoch === epoch) citationStatus('已复制。');
    } catch (_) {
      if (!panel.isConnected || panel.hidden || state.citationEpoch !== epoch) return;
      const manual = panel.querySelector('.zr-cite-manual'); manual.hidden = false;
      const input = manual.querySelector('textarea'); input.value = text;
      input.focus({ preventScroll: true }); input.select();
      citationStatus('浏览器未允许自动复制，内容已选中，请按 ' + (/Mac/.test(navigator.platform) ? '⌘C' : 'Ctrl+C') + ' 手动复制。');
    }
  }

  function buildCitationPanel() {
    const panel = document.createElement('aside'); panel.id = 'zr-citation'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-label', '引用与摘录');
    panel.innerHTML = `<div class="zr-cite-header"><strong>引用与摘录</strong><button type="button" data-zr-cite-action="close" aria-label="关闭引用">关闭</button></div>
      <div class="zr-cite-body">
      <label>文章标题<input name="title" type="text"></label>
      <label>作者／页面署名<input name="author" type="text" placeholder="未注明时可留空"></label>
      <label class="zr-cite-checkbox"><input name="authorLiteral" type="checkbox" checked>按机构或账号署名原样保留</label>
      <div class="zr-cite-grid"><label>发布日期<input name="published" type="date"></label><label>访问日期<input name="accessed" type="date"></label></div>
      <p class="zr-cite-modified"></p>
      <label>来源链接<input name="url" type="url" spellcheck="false"></label>
      <div class="zr-cite-grid"><label>引用键<input name="key" type="text" spellcheck="false"></label><label>导出格式<select name="format"><option value="online">BibLaTeX · @online</option><option value="misc">传统 BibTeX · @misc</option></select></label></div>
      <label>BibTeX 预览<textarea name="preview" rows="6" wrap="off" readonly spellcheck="false"></textarea></label>
      <div class="zr-cite-actions"><button type="button" data-zr-cite-action="copy">复制 BibTeX</button><button type="button" data-zr-cite-action="download">下载 .bib</button></div>
      <details class="zr-cite-excerpt"><summary>摘录带出处</summary><label>原文摘录<textarea name="excerpt" rows="3" placeholder="先选中正文再打开引用，或在此粘贴原文"></textarea></label><button type="button" data-zr-cite-action="excerpt">复制摘录与出处</button></details>
      <div class="zr-cite-manual" hidden><label>手动复制内容<textarea rows="4" readonly spellcheck="false"></textarea></label></div>
      <p class="zr-cite-status" role="status"></p>
      </div>`;
    panel.addEventListener('input', refreshCitationPreview);
    panel.addEventListener('change', refreshCitationPreview);
    panel.addEventListener('click', event => {
      const action = event.target.closest('[data-zr-cite-action]')?.dataset.zrCiteAction;
      if (!action) return;
      if (action === 'close') { closeCitation(); return; }
      try {
        const data = citationForm();
        if (action === 'excerpt') { copyCitationText(Citation.buildExcerpt(data, panel.querySelector('[name="excerpt"]').value)); return; }
        const bib = Citation.buildBibTeX(data, panel.querySelector('[name="format"]').value);
        if (action === 'copy') { copyCitationText(bib); return; }
        if (action === 'download') {
          const url = URL.createObjectURL(new Blob([bib], { type: 'application/x-bibtex;charset=utf-8' }));
          const link = document.createElement('a'); link.href = url; link.download = data.key.trim() + '.bib';
          panel.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          citationStatus('已请求下载 .bib 文件。');
        }
      } catch (error) { citationStatus(error.message); }
    });
    return panel;
  }

  const TOOLBAR_HTML = `
    <button class="zr-btn zr-toolbar__handle" type="button" data-zr-act="settings" title="阅读设置 · 悬停或点击展开" aria-label="阅读设置" aria-controls="zr-controls" aria-expanded="false">${ICONS.book}</button>
    <div class="zr-toolbar__controls" id="zr-controls" hidden>
    <span id="zr-progress-text" class="zr-progress-text" title="按正文范围计算的阅读进度" hidden>已读 0%</span>
    <button class="zr-btn" type="button" data-zr-act="font-dec" title="减小字号（-）" aria-label="减小字号"><span class="zr-btn__aa">A<sup>−</sup></span></button>
    <button class="zr-btn" type="button" data-zr-act="font-inc" title="增大字号（+）" aria-label="增大字号"><span class="zr-btn__aa">A<sup>+</sup></span></button>
    <select id="zr-theme" class="zr-theme-select" aria-label="阅读主题" title="阅读主题（T 可循环切换）">
      <option value="system">跟随系统</option>
      <option value="light">浅色</option>
      <option value="sepia">纸色</option>
      <option value="dark">深色</option>
    </select>
    <button class="zr-btn zr-btn--icon" type="button" data-zr-act="serif" title="切换衬线字体" aria-label="切换衬线字体">${ICONS.serif}</button>
    <select id="zr-width" class="zr-theme-select" aria-label="阅读宽度" title="阅读宽度（W 可循环切换）">
      <option value="auto">自适应</option><option value="720">720px</option><option value="960">960px</option><option value="full">铺满</option>
    </select>
    <button class="zr-btn zr-btn--icon" type="button" data-zr-act="fullscreen" title="浏览器全屏（F）" aria-label="浏览器全屏">${ICONS.fullscreen}</button>
    <button class="zr-btn zr-btn--text" type="button" data-zr-act="toc" aria-label="文章目录" aria-expanded="false" aria-controls="zr-toc">目录</button>
    <button class="zr-btn zr-btn--text" type="button" data-zr-act="cite" aria-label="引用与摘录" aria-expanded="false" aria-controls="zr-citation">引用</button>
    <button class="zr-btn zr-btn--text" type="button" data-zr-act="comments" aria-label="查看或收起评论" aria-pressed="false">评论</button>
    <button class="zr-btn zr-btn--text" type="button" data-zr-act="start" aria-label="从头阅读">从头</button>
    <label class="zr-image-dim-label" title="仅在深色主题下柔化正文图片；放大查看保持原色"><input id="zr-image-dim" type="checkbox">柔化图片</label>
    <span class="zr-toolbar__sep" aria-hidden="true"></span>
    <button class="zr-btn zr-btn--exit" type="button" data-zr-act="exit" title="退出阅读（Esc）" aria-label="退出阅读">${ICONS.close}<span>退出</span></button>
    </div>
  `;

  function buildUI() {
    if (state.ui) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'zr-toolbar';
    toolbar.className = 'zr-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', '沉浸阅读工具栏');
    toolbar.innerHTML = TOOLBAR_HTML;

    const progress = document.createElement('div');
    progress.id = 'zr-progress';
    progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', '正文阅读进度');
    progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100');
    const fill = document.createElement('div');
    fill.id = 'zr-progress-fill';
    progress.appendChild(fill);

    const toc = document.createElement('nav'); toc.id = 'zr-toc'; toc.hidden = true;
    toc.setAttribute('aria-label', '文章目录');
    toc.innerHTML = '<div class="zr-toc-header"><strong>文章目录</strong><button type="button" aria-label="关闭目录">关闭</button></div><p class="zr-toc-empty">正文暂无章节标题</p><div class="zr-toc-list"></div>';
    toc.querySelector('button').addEventListener('click', () => toggleTOC(false));
    const citation = buildCitationPanel();
    document.body.append(toolbar, progress, toc, citation);

    const handle = toolbar.querySelector('[data-zr-act="settings"]');
    const controls = toolbar.querySelector('#zr-controls');
    let pinned = false;
    const expand = (open) => {
      controls.hidden = !open;
      handle.setAttribute('aria-expanded', String(open));
      toolbar.classList.toggle('zr-toolbar--expanded', open);
      positionTOC();
      positionCitation();
    };
    toolbar.addEventListener('pointerenter', () => expand(true));
    toolbar.addEventListener('pointerleave', () => {
      if (!pinned && !toolbar.contains(document.activeElement)) expand(false);
    });
    toolbar.addEventListener('focusin', () => expand(true));
    toolbar.addEventListener('focusout', (event) => {
      if (!pinned && !toolbar.contains(event.relatedTarget) && !toolbar.matches(':hover')) expand(false);
    });
    toolbar.querySelector('#zr-theme').addEventListener('change', (event) => setTheme(event.target.value));
    toolbar.querySelector('#zr-width').addEventListener('change', event => selectWidth(event.target.value));
    toolbar.querySelector('#zr-image-dim').addEventListener('change', event => {
      settings.imageDim = event.target.checked; applySettings(); saveSettings();
    });

    let capturedExcerpt = '';
    toolbar.addEventListener('pointerdown', event => {
      if (event.button === 0 && event.target.closest('[data-zr-act="cite"]')) capturedExcerpt = selectedArticleText();
    });
    toolbar.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-zr-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-zr-act');
      if (act === 'settings') {
        pinned = !pinned;
        expand(pinned);
      } else if (act === 'font-dec') changeFont(-1);
      else if (act === 'font-inc') changeFont(1);
      else if (act === 'serif') toggleSerif();
      else if (act === 'width') toggleWidth();
      else if (act === 'fullscreen') toggleFullscreen();
      else if (act === 'toc') toggleTOC();
      else if (act === 'cite') { toggleCitation(event.detail ? capturedExcerpt : selectedArticleText()); capturedExcerpt = ''; }
      else if (act === 'comments') toggleComments();
      else if (act === 'start') readFromStart();
      else if (act === 'exit') exitReader();
    });

    state.ui = { toolbar, progress, fill, toc, citation, progressText: toolbar.querySelector('#zr-progress-text') };
    refreshTOC();
  }

  function destroyUI() {
    if (!state.ui) return;
    state.ui.toolbar.remove();
    state.ui.progress.remove();
    state.ui.toc.remove();
    state.ui.citation.remove(); state.citationOpen = false; state.citationFocus = null;
    state.headings = []; state.tocOpen = false;
    state.ui = null;
  }

  function ensureLauncher() {
    if (state.launcher) return state.launcher;

    const btn = document.createElement('button');
    btn.id = 'zr-launcher';
    btn.type = 'button';
    btn.className = 'zr-launcher';
    btn.title = `沉浸阅读（${SHORTCUT}）`;
    btn.setAttribute('aria-label', '进入知乎专栏沉浸阅读');
    btn.innerHTML = `${ICONS.book}<span>沉浸阅读</span><kbd>${SHORTCUT}</kbd>`;
    btn.addEventListener('click', () => { state.userNavigated = false; enterReader(); });
    document.body.appendChild(btn);
    state.launcher = btn;
    return btn;
  }

  function setLauncherVisible(visible) {
    if (!visible) {
      if (state.launcher) state.launcher.classList.remove('zr-launcher--visible');
      return;
    }
    const btn = ensureLauncher();
    btn.classList.add('zr-launcher--visible');
  }

  function refreshLauncher() {
    if (state.active || (settings.auto && !state.autoSuppressed)) {
      setLauncherVisible(false);
      return;
    }
    const found = findArticle();
    if (found) {
      const btn = ensureLauncher();
      btn.classList.add('zr-launcher--visible');
    } else if (state.launcher) {
      state.launcher.classList.remove('zr-launcher--visible');
    }
  }

  /* ---------------------------------------------------------------- 进度条 */

  function updateProgress() {
    if (!state.active || !state.ui || !state.ui.progress) return;
    positionTOC();
    positionCitation();
    const ratio = articleProgress();
    const percent = Math.round(ratio * 100);
    state.ui.fill.style.transform = `scaleX(${ratio.toFixed(4)})`;
    state.ui.progress.setAttribute('aria-valuenow', String(percent));
    state.ui.progress.title = '正文阅读进度 ' + percent + '%';
    state.ui.progressText.textContent = '已读 ' + percent + '%';
    let current = state.headings[0];
    for (const item of state.headings) { if (item.el.getBoundingClientRect().top <= 96) current = item; }
    for (const item of state.headings) {
      if (item === current) item.button.setAttribute('aria-current', 'location');
      else item.button.removeAttribute('aria-current');
    }
  }

  function onScrollOrResize() {
    if (state.raf) return;
    state.raf = raf(() => {
      state.raf = 0;
      updateProgress();
    });
  }

  function onReadingScroll() {
    onScrollOrResize();
    if (!state.positionTimer) state.positionTimer = setTimeout(() => {
      state.positionTimer = null; saveReadingPosition();
    }, 500);
  }

  /* ------------------------------------------------------------ 事件与进出 */

  function onKeyDown(event) {
    if (!state.active) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target?.closest?.(DIALOGS) && !target.closest('#zr-image-viewer, #zr-citation')) return;
    if (state.viewer && event.key !== 'Escape') return;
    if (state.citationOpen && event.key !== 'Escape' && target?.closest?.('#zr-citation')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (state.viewer) { closeImageViewer(); return; }
      if (state.citationOpen) { closeCitation(); return; }
      if (state.tocOpen) { toggleTOC(false); return; }
      if (state.comments.length) { toggleComments(); return; }
      exitReader();
      return;
    }
    if (
      target &&
      (target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ''))
    ) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        exitReader();
        break;
      case '+':
      case '=':
        event.preventDefault();
        changeFont(1);
        break;
      case '-':
      case '_':
        event.preventDefault();
        changeFont(-1);
        break;
      case 't':
      case 'T':
        cycleTheme();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'w':
      case 'W':
        toggleWidth();
        break;
      default:
        break;
    }
  }

  function onFullscreenChange() {
    if (state.ui) {
      state.ui.toolbar.classList.toggle('zr-toolbar--fullscreen', Boolean(document.fullscreenElement));
      state.ui.toolbar.querySelector('[data-zr-act="fullscreen"]').title = document.fullscreenElement ? '退出浏览器全屏（F）' : '浏览器全屏（F）';
    }
  }

  function bindActiveListeners() {
    window.addEventListener('scroll', onReadingScroll, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('click', onArticleImage, true);
  }

  function unbindActiveListeners() {
    window.removeEventListener('scroll', onReadingScroll);
    clearTimeout(state.positionTimer); state.positionTimer = null;
    window.removeEventListener('resize', onScrollOrResize);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('click', onArticleImage, true);
  }

  function enterReader() {
    if (state.active) return true;
    const found = findArticle();
    if (!found) return false;
    if (hasCriticalDialog()) {
      state.autoSuppressed = true;
      refreshLauncher(); return false;
    }

    state.article = found;
    state.articleKey = routeKey();
    state.resumeAttempted = false;
    const position = captureReadingPosition(found);

    hideNonArticle(found.rootEl);
    markPath(found.rootEl);
    markArticleRoles(found);
    HTML.setAttribute(ACTIVE_ATTR, 'on');

    state.active = true;
    applySettings(false);
    buildUI();
    applySettings(false);
    bindActiveListeners();
    setLauncherVisible(false);

    restoreReadingPosition(position);
    resumeReading();
    updateProgress();
    return true;
  }

  function exitReader({ suppressAuto = true, preservePosition = true } = {}) {
    if (!state.active) return;
    saveReadingPosition(); stopResumeTracking(); closeImageViewer(); closeCitation(false);
    const position = preservePosition ? captureReadingPosition() : null;
    state.active = false;
    state.autoSuppressed = suppressAuto;

    unbindActiveListeners();
    clearCommentMarkers(); state.commentReturn = null;
    destroyUI();
    restorePage();
    HTML.removeAttribute(ACTIVE_ATTR);
    HTML.removeAttribute('data-zr-site');
    HTML.style.removeProperty('--zr-font-size');
    HTML.style.removeProperty('--zr-width');
    HTML.removeAttribute('data-zr-theme');
    HTML.removeAttribute('data-zr-theme-mode');
    HTML.removeAttribute('data-zr-font');
    HTML.removeAttribute('data-zr-image-dim');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    state.article = null;
    state.articleKey = null;
    restoreReadingPosition(position);
    refreshLauncher();
  }

  /* ------------------------------------------------------------ 路由变化 */

  function routeKey() {
    return Citation.canonicalArticleURL(location.origin + location.pathname);
  }

  function handleRouteChange() {
    const key = routeKey();
    if (key === state.lastRouteKey) return;
    const previous = state.routeSnapshot;
    state.routeWait = previous && previous.key !== key ? { ...previous, key } : null;
    state.lastRouteKey = key;
    if (state.active) exitReader({ suppressAuto: false, preservePosition: false });
    state.autoSuppressed = false;
    state.userNavigated = false;
    maybeAutoEnter();
    refreshLauncher();
  }

  function watchNavigation() {
    const notify = () => setTimeout(handleRouteChange, 50);
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      if (typeof original !== 'function') continue;
      history[method] = function patched(...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
    }
    window.addEventListener('popstate', notify);
    window.addEventListener('hashchange', notify);
    // Content scripts live in an isolated world; page-world pushState patches
    // are not observable here. Poll the cheap route key as a reliable fallback.
    setInterval(handleRouteChange, 700);
    let pending = null;
    new MutationObserver((records) => {
      // Updating controls/progress must not reschedule the article scan itself.
      const relevant = records.some(({ target, type, attributeName }) => {
        const el = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
        if (type === 'attributes' && attributeName === 'style' && el?.hasAttribute('data-zr-hidden')) return false;
        return !el?.closest('#zr-toolbar, #zr-progress, #zr-launcher, #zr-toc, #zr-citation, #zr-image-viewer, #zr-status');
      });
      if (!relevant || pending !== null) return;
      // Throttle rather than debounce: continuous page updates cannot starve entry.
      pending = setTimeout(() => {
        pending = null;
        handleRouteChange();
        if (state.active && hasCriticalDialog()) {
          exitReader(); showStatus('已恢复原页面，请先完成登录或验证。'); return;
        }
        // React can retain a hidden old article while mounting its replacement.
        // Re-identify before hiding siblings, or the new reader could be hidden too.
        const current = state.active ? findArticle() : null;
        if (state.active && current && current.rootEl === state.article.rootEl && current.richEl === state.article.richEl && current.titleEl === state.article.titleEl) {
          hideNonArticle(state.article.rootEl);
          refreshTOC();
          if (state.resumePending) resumeReading();
          rememberRouteArticle(state.article);
        } else {
          if (state.active) exitReader({ suppressAuto: false, preservePosition: false });
          maybeAutoEnter();
          refreshLauncher();
        }
      }, 50);
    }).observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open'], subtree: true });
  }

  function maybeAutoEnter() {
    if (!settings.auto || state.active || state.autoSuppressed) return;
    if (!findArticle()) return;
    enterReader();
  }

  /* --------------------------------------------------------------- 消息 */

  /* --------------------------------------------------------------- 启动 */

  function toggleReader() {
    if (state.active) exitReader();
    else { state.userNavigated = false; enterReader(); }
  }

  async function init() {
    await Promise.all([loadSettings(), loadPositions()]);
    bindSystemTheme();
    GM_registerMenuCommand('切换沉浸阅读（' + SHORTCUT + '）', toggleReader);
    let autoMenuId;
    const updateAutoMenu = () => {
      autoMenuId = GM_registerMenuCommand('自动进入阅读：' + (settings.auto ? '开启' : '关闭') + '（点击切换）', () => {
        settings.auto = !settings.auto;
        state.autoSuppressed = false;
        saveSettings();
        updateAutoMenu();
        maybeAutoEnter();
        refreshLauncher();
      }, { id: autoMenuId });
    };
    updateAutoMenu();
    GM_registerMenuCommand('显示／隐藏阅读进度', () => {
      settings.progress = !settings.progress;
      applySettings();
      saveSettings();
    });
    GM_registerMenuCommand('清除本地阅读进度', clearReadingPositions);
    GM_registerMenuCommand('版本 1.6.0 · 使用说明与更新', () => window.open("https://greasyfork.org/zh-CN/scripts/603576", '_blank', 'noopener,noreferrer'));
    document.addEventListener('keydown', (event) => {
      if (!event.defaultPrevented && !event.repeat && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === 'KeyR') {
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        toggleReader();
      }
    });
    watchNavigation();
    maybeAutoEnter();
    refreshLauncher();
  }

  function boot() {
    HTML = document.documentElement;
    if (!HTML || !document.body) return false;
    window.addEventListener('wheel', markUserNavigation, { passive: true, capture: true });
    window.addEventListener('touchstart', markUserNavigation, { passive: true, capture: true });
    document.addEventListener('pointerdown', markUserNavigation, true);
    document.addEventListener('keydown', markUserNavigation, true);
    window.addEventListener('pagehide', saveReadingPosition);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveReadingPosition(); });
    init(); return true;
  }

  if (!boot()) {
    const observer = new MutationObserver(() => { if (boot()) observer.disconnect(); });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
