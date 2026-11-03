import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://' + request.headers.host);
  response.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/responsive') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end('<!doctype html><meta charset="utf-8"><title>390px 布局验证</title><h1 style="font:16px system-ui">390px 独立布局视口</h1><iframe id="citation-responsive" title="390px 阅读器" style="width:390px;height:740px;border:1px solid #aaa" src="/p/1501?mode=structured"></iframe>');
    return;
  }
  if (url.pathname === '/reader.js' || url.pathname === '/fixture.js') {
    response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    response.end(readFileSync(new URL(url.pathname === '/reader.js' ? 'zhihu-column-reader.user.js' : 'test/citation-fixture.js', root)));
    return;
  }
  if (!/^\/p\/\d+$/.test(url.pathname)) { response.writeHead(404); response.end(); return; }
  const mode = url.searchParams.get('mode');
  const title = mode === 'zhihu-meta' ? 'Super-agent 设计探索：迈向更自主的 Agent 系统' : '引用导出验证：A&B_{测试} 50%';
  const canonical = url.origin + url.pathname;
  const metadata = mode === 'structured'
    ? `<link rel="canonical" href="${canonical}"><meta property="og:title" content="${escape(title)}"><script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'Article', headline: title, url: url.origin + '/p/999', datePublished: '2001-01-01', author: { name: '错误作者' } }, { '@type': 'BlogPosting', headline: title, url: canonical, datePublished: '2024-02-29T23:00:00-08:00', dateModified: '2026-11-01', author: { '@type': 'Organization', name: 'Research and Development' } }] })}</script>`
    : mode === 'stale'
      ? `<link rel="canonical" href="${url.origin}/p/999"><meta property="og:title" content="旧文章标题"><meta property="article:published_time" content="2020-01-01">`
      : `<link rel="canonical" href="${canonical}"><meta property="og:title" content="${escape(title)}">`;
  const author = ['missing', 'structured'].includes(mode) ? '' : mode === 'zhihu-meta' ? '<div class="Post-Author"><a class="UserLink-link" href="//www.zhihu.com/org/deepseek-75">DeepSeek</a></div>' : '<div class="Post-Author"><a class="AuthorInfo-name" href="/org/test">测试机构 A&amp;B</a></div>';
  const time = ['missing', 'structured', 'stale', 'zhihu-meta', 'utc-boundary'].includes(mode) ? '编辑于 2026-11-01' : '发布于 2026-10-31 22:55，编辑于 2026-11-01 10:43';
  const rootMetadata = ['zhihu-meta', 'utc-boundary'].includes(mode) ? `<meta itemprop="datePublished" content="${mode === 'zhihu-meta' ? '2026-10-31T14:55:38.000Z' : '2026-10-31T17:30:00.000Z'}"><meta itemprop="dateModified" content="2026-11-01T02:43:28.000Z">` : '';
  const paragraphs = Array.from({ length: 20 }, (_, index) => `<p>第 ${index + 2} 段。${'用于观察进度、选区和面板位置，不包含外部资源。'.repeat(6)}</p>`).join('');
  const values = { TITLE: escape(title), METADATA: metadata, ROOTMETA: rootMetadata, AUTHOR: author, TIME: time, PARAGRAPHS: paragraphs };
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(readFileSync(new URL('test/citation-fixture.html', root), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]));
});
server.listen(Number(process.env.ZR_CITATION_FIXTURE_PORT) || 0, '127.0.0.1', () => console.log(`http://127.0.0.1:${server.address().port}/p/1501`));
