import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { articlePath, findSiteArticle, articleBlocks, articleHeadings, headingLevel } from '../src/sites.mjs';
import { citationURL, citationKey, readCitationMetadata, buildBibTeX, buildExcerpt } from '../src/citation.mjs';

const id = '2117512471930167377';
const url = `https://x.com/addyosmani/article/${id}`;
// Synthetic DOM contracts from maintained original extractors; this is not the example's captured HTML.
function xDOM(kind = 'react') {
  const body = `<div data-block="true"><p>First paragraph with evidence.</p></div><h2 class="longform-header-two">A section</h2><div class="longform-unstyled">Draft paragraph</div><article data-testid="tweet"><a href="/quoted">Quoted author</a><meta itemprop="datePublished" content="2001-01-01"><a href="/quoted/status/999"><time datetime="2001-01-01T00:00:00Z">Old date</time></a><p>Embedded quotation</p></article>`;
  const article = kind === 'react'
    ? `<article data-testid="twitterArticleReadView"><div data-testid="twitter-article-title">Synthetic X Article &amp; code</div><div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/cover.jpg"></div><div data-testid="twitterArticleRichTextView">${body}</div></article>`
    : `<h1>Synthetic X Article &amp; code</h1><div class="x-article-body">${body}</div>`;
  return parseHTML(`<html><head><title>Synthetic X Article &amp; code</title></head><body><nav>Site navigation</nav><main><article data-testid="tweet"><div data-testid="User-Name"><a href="/addyosmani">Addy Osmani</a><a href="/addyosmani">@addyosmani</a></div><a href="/addyosmani/status/${id}"><time datetime="2026-11-03T23:30:00Z">Publication</time></a>${article}</article><aside>Recommendations</aside></main></body></html>`).document;
}

test('only article routes qualify; ordinary X timelines and posts do not', () => {
  assert.deepEqual(articlePath(`/addyosmani/article/${id}`), { site: 'x', id, handle: 'addyosmani' });
  for (const path of ['/home', '/addyosmani', `/addyosmani/status/${id}`, '/search', '/i/flow/login']) assert.equal(articlePath(path), null);
  assert.equal(findSiteArticle(xDOM(), 'https://x.com/home'), null);
});

test('React article title/body/cover are recognized without collecting quoted authors and times', () => {
  const article = findSiteArticle(xDOM(), url);
  assert.equal(article.site, 'x'); assert.equal(article.authorName, 'Addy Osmani');
  assert.equal(article.titleEl.textContent, 'Synthetic X Article & code');
  assert.equal(article.timeEl.getAttribute('datetime'), '2026-11-03T23:30:00Z');
  assert.equal(article.coverEl.getAttribute('src'), 'https://pbs.twimg.com/media/cover.jpg');
  assert.ok(article.richEl.textContent.includes('Embedded quotation'));
});

test('signed-out article uses explicit body and title rather than arbitrary main text', () => {
  const doc = xDOM('signed-out'), article = findSiteArticle(doc, url);
  assert.equal(article.site, 'x'); assert.equal(article.richEl.className, 'x-article-body');
  doc.querySelector('.x-article-body').remove(); assert.equal(findSiteArticle(doc, url), null);
});

test('hidden, editor and mismatched article identities fail safely', () => {
  const doc = xDOM(); doc.querySelector('[data-testid="twitterArticleReadView"]').hidden = true;
  assert.equal(findSiteArticle(doc, url), null);
  const other = xDOM(); assert.equal(findSiteArticle(other, 'https://x.com/addyosmani/article/123'), null);
  const editor = xDOM(); editor.querySelector('[data-testid="twitterArticleRichTextView"]').setAttribute('contenteditable', 'true');
  assert.equal(findSiteArticle(editor, url), null);
});

test('body must be inside its reader root and not used as the article title', () => {
  const doc = xDOM(); doc.querySelector('[data-testid="twitter-article-title"]').remove();
  doc.querySelector('[data-testid="twitterArticleRichTextView"]').innerHTML = '<h1>A section, not the article title</h1><p>Body</p>';
  assert.equal(findSiteArticle(doc, url), null);
});

test('X aliases and share parameters normalize while keys remain distinct from Zhihu', () => {
  assert.equal(citationURL(`https://twitter.com/AddyOsmani/article/${id}/?s=20#top`), url);
  assert.equal(citationKey(url), 'x' + id);
  assert.notEqual(citationKey(url), citationKey('https://zhuanlan.zhihu.com/p/' + id));
});

test('X citations use the bound author/date and supplied display timezone, not a quoted post or snowflake', () => {
  const doc = xDOM(), article = findSiteArticle(doc, url); article.timeZone = 'America/Los_Angeles';
  const data = readCitationMetadata(doc, article, url, new Date('2026-11-05T12:00:00Z'));
  assert.equal(data.author, 'Addy Osmani'); assert.equal(data.published, '2026-11-03'); assert.equal(data.modified, '');
  assert.equal(data.key, 'x' + id); assert.match(buildBibTeX(data), /@online\{x2117512471930167377/);
  assert.ok(buildExcerpt(data, 'Selected evidence.').includes('来源：<' + url + '>'));
  doc.querySelector('time[datetime]').remove();
  const noDate = findSiteArticle(doc, url);
  assert.equal(readCitationMetadata(doc, noDate, url).published, '');
});

test('Draft blocks can resume without duplicate paragraph matches and headings keep levels', () => {
  const article = findSiteArticle(xDOM(), url);
  assert.equal(articleBlocks(article.richEl).filter(el => el.textContent === 'First paragraph with evidence.').length, 1);
  const headings = articleHeadings(article.richEl);
  assert.equal(headings.length, 1); assert.equal(headingLevel(headings[0]), 2);
});

test('Zhihu remains recognized and its publication calendar stays Shanghai', () => {
  const doc = parseHTML('<html><head><title>知乎标题</title></head><body><article class="Post-Main"><meta itemprop="datePublished" content="2026-11-03T17:00:00Z"><header class="Post-Header"><h1 class="Post-Title">知乎标题</h1><div class="Post-Author"><a href="/org/team">测试机构</a></div></header><div class="Post-RichTextContainer"><div class="RichText Post-RichText"><h2>章节</h2><p>正文</p></div></div></article></body></html>').document;
  const article = findSiteArticle(doc, 'https://zhuanlan.zhihu.com/p/123');
  assert.equal(article.site, 'zhihu');
  assert.equal(readCitationMetadata(doc, article, 'https://zhuanlan.zhihu.com/p/123').published, '2026-11-04');
});

test('Zhihu retains its plain RichText fallback inside the validated article', () => {
  const doc = parseHTML('<html><body><article class="Post-Main"><h1 class="Post-Title">旧结构标题</h1><div class="RichText"><p>旧结构正文</p></div></article></body></html>').document;
  assert.equal(findSiteArticle(doc, 'https://zhuanlan.zhihu.com/p/123').richEl.className, 'RichText');
});

test('same-route hidden React roots are excluded in favor of their replacement', () => {
  const doc = xDOM(), oldRoot = doc.querySelector('[data-testid="twitterArticleReadView"]');
  const replacement = oldRoot.cloneNode(true);
  replacement.querySelector('[data-testid="twitterArticleRichTextView"]').textContent = 'Replacement body';
  oldRoot.setAttribute('aria-hidden', 'true'); oldRoot.parentElement.append(replacement);
  const current = findSiteArticle(doc, url);
  assert.equal(current.rootEl, replacement);
  assert.equal(current.richEl.textContent, 'Replacement body');
});
