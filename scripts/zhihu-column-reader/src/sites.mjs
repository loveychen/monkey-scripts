// Platform DOM contracts are kept separate from reading state and rendering.
export function articlePath(pathname) {
  let match = pathname.match(/^\/p\/([^/]+)\/?$/);
  if (match) return { site: 'zhihu', id: match[1] };
  match = pathname.match(/^\/([A-Za-z0-9_]{1,15})\/article\/(\d+)\/?$/);
  return match ? { site: 'x', handle: match[1].toLowerCase(), id: match[2] } : null;
}

export function articleBlocks(rich) {
  const nodes = [...rich.querySelectorAll('h1,h2,h3,h4,p,li,pre,blockquote,figure,table,[data-block="true"],.longform-unstyled,.longform-unstyled-narrow')];
  return nodes.filter((node, i) => !nodes.slice(0, i).some(parent => parent.contains(node) && parent.textContent.trim() === node.textContent.trim()));
}

export function articleHeadings(rich) {
  return [...rich.querySelectorAll('h1,h2,h3,h4,[role="heading"][aria-level],.longform-header-one,.longform-header-one-narrow,.longform-header-two,.longform-header-two-narrow')]
    .filter((node, i, nodes) => node.textContent.trim() && !nodes.slice(0, i).some(parent => parent.contains(node)));
}

export function headingLevel(node) {
  const semantic = /^H[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : Number(node.getAttribute('aria-level'));
  if (semantic >= 1 && semantic <= 6) return semantic;
  return /longform-header-one/.test(node.className) ? 1 : 2;
}

export function findSiteArticle(doc, currentURL) {
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
