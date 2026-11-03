// Pure citation formatting. The builder embeds these functions in the reader closure.
export function citationLine(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f\s]+/g, ' ').trim();
}

export function citationDate(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{4})(?:-(\d{1,2})-(\d{1,2})(?=$|T|\s)|年(\d{1,2})月(\d{1,2})日)/);
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[2] || match[4]), day = Number(match[3] || match[5]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function citationMetadataDate(value) {
  const text = String(value ?? '').trim(), calendar = citationDate(text);
  if (!calendar) return '';
  if (text.includes('T') && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(text)) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    const instant = new Date(text);
    if (!Number.isFinite(instant.getTime())) return '';
    // Zhihu timestamps use UTC in metadata; its publication calendar is China time.
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  return calendar;
}

export function citationURL(value) {
  const raw = String(value ?? '').trim();
  if (/[\u0000-\u0020\u007f]/.test(raw)) throw new Error('来源链接不能包含空白或控制字符。');
  let url;
  try { url = new URL(raw); } catch (_) { throw new Error('请填写有效的来源链接。'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('来源链接仅支持不含账号密码的 HTTP(S) 地址。');
  if (url.hostname === 'zhuanlan.zhihu.com' && /^\/p\/\d+\/?$/.test(url.pathname)) {
    url.search = ''; url.hash = ''; url.pathname = url.pathname.replace(/\/$/, '');
  }
  return url.href.replace(/[{}]/g, char => encodeURIComponent(char));
}

export function citationKey(url) {
  const id = new URL(citationURL(url)).pathname.match(/^\/p\/(\d+)\/?$/)?.[1];
  if (id) return 'zhihu' + id;
  let hash = 2166136261;
  for (const char of url) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  return 'web' + (hash >>> 0).toString(16);
}

export function escapeBibTeX(value) {
  const escaped = { '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };
  return citationLine(value).replace(/[\\{}&%$#_~^]/g, char => escaped[char]);
}

export function normalizedCitation(raw) {
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

export function buildBibTeX(raw, format = 'online') {
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

export function buildExcerpt(raw, text) {
  const data = normalizedCitation(raw);
  const excerpt = String(text ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!excerpt) throw new Error('请先在正文中选中文字再打开引用，或在摘录框中粘贴原文。');
  if (excerpt.length > 50000) throw new Error('单次摘录超过 50000 个字符，请缩小选区后重试。');
  const markdown = value => value.replace(/([\\`*_[\]<>])/g, '\\$1');
  const source = `${data.author ? markdown(data.author) + '，' : ''}《${markdown(data.title)}》`;
  const dates = [data.published && '发布：' + data.published, data.accessed && '访问：' + data.accessed].filter(Boolean).join('；');
  return `${excerpt.split('\n').map(line => '> ' + line).join('\n')}\n\n— ${source}\n来源：<${data.url}>${dates ? '\n' + dates : ''}\n`;
}

export function readCitationMetadata(doc, article, currentURL, now = new Date()) {
  const url = citationURL(currentURL), title = citationLine(article.titleEl.textContent);
  const sameArticle = value => {
    try {
      const candidate = citationURL(new URL(value, currentURL).href);
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
  const author = citationLine(authorElement?.textContent) || structuredAuthors.map(item => citationLine(typeof item === 'string' ? item : item?.name)).filter(Boolean).join(' and ') || (headMatches ? citationLine(headMeta('author')) : '');
  const elementDate = name => {
    const el = article.rootEl.querySelector(`[itemprop~="${name}"]`);
    return el ? citationMetadataDate(el.getAttribute('datetime') || el.getAttribute('content') || el.textContent) : '';
  };
  const timeElement = article.rootEl.querySelector('.ContentItem-time');
  const timeText = timeElement ? [timeElement.textContent, timeElement.getAttribute('title'), timeElement.getAttribute('aria-label'), timeElement.getAttribute('data-tooltip')].filter(Boolean).join(' ') : '';
  const labeledDate = label => citationDate(timeText.match(new RegExp(`(?:${label})\\s*(\\d{4}(?:-\\d{1,2}-\\d{1,2}|年\\d{1,2}月\\d{1,2}日))`))?.[1]);
  const published = labeledDate('发布于|发表于') || elementDate('datePublished') || citationMetadataDate(structured?.datePublished) || (headMatches ? citationMetadataDate(headMeta('article:published_time') || headMeta('datePublished')) : '');
  const modified = labeledDate('编辑于|更新于') || elementDate('dateModified') || citationMetadataDate(structured?.dateModified) || (headMatches ? citationMetadataDate(headMeta('article:modified_time') || headMeta('dateModified')) : '');
  const accessed = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { title, author, authorLiteral: true, published, modified, accessed, url, key: citationKey(url) };
}
