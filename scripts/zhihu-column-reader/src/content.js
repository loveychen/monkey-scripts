/* ==========================================================================
   知乎专栏沉浸阅读 — content script
   目标页面：https://zhuanlan.zhihu.com/p/<id>
   思路：不克隆、不改写正文 DOM，而是把「正文节点所在的祖先链」之外的
        兄弟节点全部隐藏，再对正文做排版增强。保留代码、图片、公式等节点；
        页面脚本与动态灯箱交互是否正常，需在真实页面另行验证。
   ========================================================================== */
(() => {
  'use strict';

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

  const STORE = (() => {
    try {
      return chrome.storage && chrome.storage.local ? chrome.storage.local : null;
    } catch (_) {
      return null;
    }
  })();

  const settings = { ...DEFAULTS };
  const state = {
    active: false,
    article: null,
    hidden: [],
    pathMarked: [],
    lastRouteKey: location.origin + location.pathname,
    ui: null,
    launcher: null,
    raf: 0,
    autoSuppressed: false,
    positions: {}, positionTimer: null, writeQueue: Promise.resolve(),
    userNavigated: false, resumeObserver: null, resumeTimer: null,
    viewer: null, comments: [], commentPath: [], commentReturn: null, articleKey: null,
    headings: [], tocOpen: false, statusTimer: null,
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
      STORE.set({ [SETTINGS_KEY]: { ...settings } });
    } catch (_) {
      /* 扩展被重新加载时 chrome.* 可能失效，忽略即可 */
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
    if (!/^\/p\/[^/]+\/?$/.test(location.pathname)) return null;
    const titleEl =
      document.querySelector('article.Post-Main h1.Post-Title') ||
      document.querySelector('h1.Post-Title');
    const richEl =
      document.querySelector('.Post-RichTextContainer .RichText') ||
      document.querySelector('article.Post-Main .RichText') ||
      document.querySelector('.RichText.Post-RichText');
    if (!titleEl || !richEl || !richEl.isConnected) return null;
    if (richEl.closest('.Post-Editor, .RichText--editable')) return null;

    // Fail safely on unknown markup rather than hiding the title/author as
    // siblings of an overly narrow rich-text root.
    const articleEl = richEl.closest('article.Post-Main');
    if (!articleEl || !articleEl.contains(titleEl)) return null;

    const textLength = (richEl.innerText || '').replace(/\s+/g, '').length;
    if (!textLength && !richEl.querySelector('img, video, pre, svg')) return null;
    const waiting = state.routeWait;
    if (waiting?.key === routeKey() && articleEl === waiting.root && richEl === waiting.rich && richEl.textContent === waiting.text) return null;
    if (waiting?.key === routeKey()) state.routeWait = null;
    if (routeKey() === state.lastRouteKey) rememberRouteArticle({ rootEl: articleEl, richEl });

    return { titleEl, richEl, rootEl: articleEl, textLength };
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
      node.setAttribute('data-zr-path', '');
      state.pathMarked.push(node);
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
  }

  /* ---------------------------------------------------------- 阅读位置 */

  function captureReadingPosition(article = state.article) {
    const fallbackY = window.scrollY;
    if (fallbackY <= 2) return { atTop: true, fallbackY };
    if (!article || !article.richEl.isConnected) return { fallbackY };
    const readingLine = Math.min(48, window.innerHeight / 3);
    const blocks = [article.titleEl, ...article.richEl.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,figure,table')];
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
      return /^https?:\/\/[^/]+\/p\/[^/?#]+\/?$/.test(url) && p && typeof p === 'object' &&
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
    const blocks = Array.from(state.article.richEl.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,figure,table'));
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
    const headings = Array.from(state.article.richEl.querySelectorAll('h1,h2,h3,h4')).filter(el => el.textContent.trim());
    const changed = headings.length !== state.headings.length || headings.some((el, i) => el !== state.headings[i]?.el || el.textContent !== state.headings[i]?.text);
    if (!changed) return;
    const list = state.ui.toc.querySelector('.zr-toc-list'); list.replaceChildren();
    state.headings = headings.map(el => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = el.textContent.trim(); button.style.paddingLeft = (12 + (Number(el.tagName.slice(1)) - 1) * 12) + 'px';
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
    if (!image || !state.article.richEl.contains(image) || image.getBoundingClientRect().width < 48 || image.classList.contains('ztext-math')) return;
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

  const TOOLBAR_HTML = `
    <button class="zr-btn zr-toolbar__handle" type="button" data-zr-act="settings" title="阅读设置 · 悬停或点击展开" aria-label="阅读设置" aria-controls="zr-controls" aria-expanded="false">${ICONS.book}</button>
    <div class="zr-toolbar__controls" id="zr-controls" hidden>
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
    document.body.append(toolbar, progress, toc);

    const handle = toolbar.querySelector('[data-zr-act="settings"]');
    const controls = toolbar.querySelector('#zr-controls');
    let pinned = false;
    const expand = (open) => {
      controls.hidden = !open;
      handle.setAttribute('aria-expanded', String(open));
      toolbar.classList.toggle('zr-toolbar--expanded', open);
      positionTOC();
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
      else if (act === 'comments') toggleComments();
      else if (act === 'start') readFromStart();
      else if (act === 'exit') exitReader();
    });

    state.ui = { toolbar, progress, fill, toc };
    refreshTOC();
  }

  function destroyUI() {
    if (!state.ui) return;
    state.ui.toolbar.remove();
    state.ui.progress.remove();
    state.ui.toc.remove();
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
    const ratio = articleProgress();
    state.ui.fill.style.transform = `scaleX(${ratio.toFixed(4)})`;
    state.ui.progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    state.ui.progress.title = '正文阅读进度 ' + Math.round(ratio * 100) + '%';
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
    if (target?.closest?.(DIALOGS) && !target.closest('#zr-image-viewer')) return;
    if (state.viewer && event.key !== 'Escape') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (state.viewer) { closeImageViewer(); return; }
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
    saveReadingPosition(); stopResumeTracking(); closeImageViewer();
    const position = preservePosition ? captureReadingPosition() : null;
    state.active = false;
    state.autoSuppressed = suppressAuto;

    unbindActiveListeners();
    clearCommentMarkers(); state.commentReturn = null;
    destroyUI();
    restorePage();
    HTML.removeAttribute(ACTIVE_ATTR);
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
    return location.origin + location.pathname;
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
        return !el?.closest('#zr-toolbar, #zr-progress, #zr-launcher, #zr-toc, #zr-image-viewer, #zr-status');
      });
      if (!relevant || pending !== null) return;
      // Throttle rather than debounce: continuous page updates cannot starve entry.
      pending = setTimeout(() => {
        pending = null;
        handleRouteChange();
        if (state.active) hideNonArticle(state.article.rootEl);
        if (state.active && hasCriticalDialog()) {
          exitReader(); showStatus('已恢复原页面，请先完成登录或验证。'); return;
        }
        if (state.active && state.article?.rootEl.isConnected && state.article.richEl.isConnected) {
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

  function bindMessaging() {
    if (!chrome || !chrome.runtime || !chrome.runtime.onMessage) return;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message !== 'object') return;
      switch (message.type) {
        case 'ZR_GET_STATE':
          sendResponse({
            ok: true,
            active: state.active,
            hasArticle: Boolean(findArticle()),
            settings: { ...settings },
            url: location.href
          });
          return;
        case 'ZR_TOGGLE': {
          const ok = state.active ? (exitReader(), true) : enterReader();
          sendResponse({ ok, active: state.active, hasArticle: Boolean(findArticle()) });
          return;
        }
        case 'ZR_SETTINGS':
          Object.assign(settings, sanitize({ ...settings, ...message.settings }));
          if (state.active) applySettings();
          saveSettings();
          sendResponse({ ok: true, settings: { ...settings } });
          return;
        case 'ZR_SET_THEME':
          setTheme(message.theme);
          sendResponse({ ok: true, theme: settings.theme });
          return;
        default:
          break;
      }
    });

    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes[SETTINGS_KEY]) return;
        Object.assign(settings, sanitize(changes[SETTINGS_KEY].newValue));
        if (state.active) applySettings();
      });
    }
  }

  /* --------------------------------------------------------------- 启动 */

  async function init() {
    await Promise.all([loadSettings(), loadPositions()]);
    bindSystemTheme();
    bindMessaging();
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
