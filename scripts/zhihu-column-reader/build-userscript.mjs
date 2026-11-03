import { readFileSync, writeFileSync } from 'node:fs';
const base = new URL('./', import.meta.url);
const release = JSON.parse(readFileSync(new URL('release.json', base), 'utf8'));
for (const key of ['homepage', 'support', 'download']) {
  const url = new URL(release[key]);
  if (url.protocol !== 'https:' || url.username || url.password || /[\r\n]/.test(release[key])) throw new Error('Invalid release URL: ' + key);
}
if (!/^\d+\.\d+\.\d+$/.test(release.version)) throw new Error('Invalid release version');
let source = readFileSync(new URL('src/content.js', base), 'utf8');
const css = readFileSync(new URL('src/reader.css', base), 'utf8');
const citation = readFileSync(new URL('src/citation.mjs', base), 'utf8').replace(/^export /gm, '');
function replaceOnce(pattern, replacement) {
  if (!pattern.test(source)) throw new Error(`Missing build marker: ${pattern}`);
  source = source.replace(pattern, () => replacement);
}
replaceOnce(/  \/\/ Citation helpers are embedded here by build-userscript\.mjs\./, `  const Citation = (() => {\n${citation}\nreturn { readCitationMetadata, buildBibTeX, buildExcerpt };\n})();`);
replaceOnce(/  const STORE = \(\(\) => \{[\s\S]*?\n  \}\)\(\);/, `  const STORE = {
    async get(key) { return { [key]: await GM_getValue(key, null) }; },
    async set(values) {
      for (const [key, value] of Object.entries(values)) await GM_setValue(key, value);
    }
  };`);
replaceOnce(/  function bindMessaging\(\) \{[\s\S]*?(?=  \/\* -+ 启动 \*\/)/, '');
replaceOnce(/  async function init\(\) \{/, `  function toggleReader() {
    if (state.active) exitReader();
    else { state.userNavigated = false; enterReader(); }
  }

  async function init() {`);
replaceOnce(/    bindMessaging\(\);/, `    GM_registerMenuCommand('切换沉浸阅读（' + SHORTCUT + '）', toggleReader);
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
    GM_registerMenuCommand('版本 ${release.version} · 使用说明与更新', () => window.open(${JSON.stringify(release.homepage)}, '_blank', 'noopener,noreferrer'));
    document.addEventListener('keydown', (event) => {
      if (!event.defaultPrevented && !event.repeat && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === 'KeyR') {
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        toggleReader();
      }
    });`);
// Store.set returns a promise in both target environments.
replaceOnce(/      STORE.set\(\{ \[SETTINGS_KEY\]: \{ \.\.\.settings \} \}\);/, '      STORE.set({ [SETTINGS_KEY]: { ...settings } }).catch(() => {});');
source = source.replace('扩展被重新加载时 chrome.* 可能失效，忽略即可', '脚本管理器的存储不可用时忽略，当前页面仍可使用');
const metadata = `// ==UserScript==
// @name         知乎专栏 · 沉浸阅读
// @namespace    local.zhihu-column-reader
// @version      ${release.version}
// @description  知乎专栏沉浸阅读，支持系统主题、目录、图片放大、断点续读、引用预览、BibTeX 导出和摘录带出处。
// @homepageURL  ${release.homepage}
// @supportURL   ${release.support}
// @updateURL    ${release.download}
// @downloadURL  ${release.download}
// @match        https://zhuanlan.zhihu.com/p/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @license      MIT
// ==/UserScript==

`;
writeFileSync(new URL('zhihu-column-reader.user.js', base), metadata + 'GM_addStyle(' + JSON.stringify(css) + ');\n\n' + source);
writeFileSync(new URL('zhihu-column-reader.meta.js', base), metadata);
console.log('Built zhihu-column-reader.user.js');
