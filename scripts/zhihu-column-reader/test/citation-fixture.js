// Synthetic GM/selection/failure inputs only; reader behavior comes from reader.js.
const fixtureValues = new Map();
window.GM_getValue = (key, fallback) => fixtureValues.has(key) ? fixtureValues.get(key) : fallback;
window.GM_setValue = (key, value) => fixtureValues.set(key, value);
window.GM_addStyle = css => { const style = document.createElement('style'); style.textContent = css; document.head.append(style); };
let fixtureNextId = 0;
window.GM_registerMenuCommand = (label, handler, options = {}) => {
  const id = options.id || ++fixtureNextId;
  let button = document.getElementById('fixture-menu-' + id);
  if (!button) { button = document.createElement('button'); button.id = 'fixture-menu-' + id; document.getElementById('fixture-menus').append(button); }
  button.textContent = label; button.onclick = handler; return id;
};
const clipboardMode = new URLSearchParams(location.search).get('clipboard');
if (clipboardMode === 'deny' || clipboardMode === 'delayed-deny') {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Synthetic clipboard denial')), clipboardMode === 'deny' ? 0 : 1200))
  } });
}
function selectFixtureText(element) {
  const range = document.createRange(); range.selectNodeContents(element);
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
}
document.getElementById('fixture-select').onclick = () => {
  selectFixtureText(document.getElementById('fixture-quote'));
  document.querySelector('#fixture-controls details').open = false;
};
document.getElementById('fixture-external').onclick = () => {
  selectFixtureText(document.getElementById('fixture-outside'));
  document.querySelector('#fixture-controls details').open = false;
};
document.getElementById('fixture-clear').onclick = () => window.getSelection().removeAllRanges();
document.getElementById('fixture-route').onclick = () => {
  const article = document.createElement('article'); article.className = 'Post-Main';
  article.innerHTML = '<header class="Post-Header"><h1 class="Post-Title">换文后的第二篇</h1><div class="Post-Author"><a href="/people/second" class="AuthorInfo-name">另一作者</a></div></header><div class="Post-RichTextContainer"><div class="RichText Post-RichText"><h2>新文章</h2><p>这是第二篇文章，不应该携带上一篇的元信息或摘录。</p></div></div><div class="ContentItem-time">编辑于 2026-11-01</div>';
  document.querySelector('article.Post-Main').replaceWith(article);
  history.pushState({}, '', '/p/1502');
};
