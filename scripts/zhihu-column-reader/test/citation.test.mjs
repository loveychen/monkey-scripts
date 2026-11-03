import test from 'node:test';
import assert from 'node:assert/strict';
import { citationDate, citationMetadataDate, citationURL, citationKey, escapeBibTeX, buildBibTeX, buildExcerpt } from '../src/citation.mjs';

const article = {
  title: 'Super-agent 设计探索：迈向更自主的 Agent 系统', author: 'DeepSeek', authorLiteral: true,
  published: '2026-10-31', accessed: '2026-11-03',
  url: 'https://zhuanlan.zhihu.com/p/2099987320443237060?utm_source=test#heading', key: 'zhihu2099987320443237060'
};

test('webpage citation keeps organization, Chinese title, publication and access dates distinct', () => {
  const bib = buildBibTeX(article);
  assert.match(bib, /^@online\{zhihu2099987320443237060,/);
  assert.match(bib, /author\s+= \{\{DeepSeek\}\}/);
  assert.match(bib, /title\s+= \{\{Super-agent 设计探索：迈向更自主的 Agent 系统\}\}/);
  assert.match(bib, /date\s+= \{2026-10-31\}/);
  assert.match(bib, /urldate\s+= \{2026-11-03\}/);
  assert.match(bib, /url\s+= \{https:\/\/zhuanlan.zhihu.com\/p\/2099987320443237060\}/);
  assert.doesNotMatch(bib, /journal|doi|utm_source|#heading/);
});

test('missing author and publication date are omitted, never inferred from access date', () => {
  const bib = buildBibTeX({ ...article, author: '', published: '' });
  assert.doesNotMatch(bib, /^\s+(?:author|date|year)\s+=/m);
  assert.match(bib, /urldate\s+= \{2026-11-03\}/);
});

test('traditional BibTeX uses misc, year and url command, without online-only dates', () => {
  const bib = buildBibTeX(article, 'misc');
  assert.match(bib, /^@misc\{/);
  assert.match(bib, /year\s+= \{2026\}/);
  assert.match(bib, /howpublished\s+= \{\\url\{https:\/\/zhuanlan.zhihu.com\/p\/2099987320443237060\}\}/);
  assert.match(bib, /Published: 2026-10-31; Accessed: 2026-11-03/);
  assert.doesNotMatch(bib, /^\s+(?:date|urldate)\s+=/m);
});

test('literal and person author modes differ without splitting account names', () => {
  assert.match(buildBibTeX({ ...article, author: 'Research and Development' }), /\{\{Research and Development\}\}/);
  const bib = buildBibTeX({ ...article, author: 'Doe, Jane and 王明', authorLiteral: false });
  assert.match(bib, /author\s+= \{Doe, Jane and 王明\}/);
});

test('TeX special characters are escaped once and Unicode remains readable', () => {
  assert.equal(escapeBibTeX('A&B 50% $x_1$ # {组} \\ ~ ^'), 'A\\&B 50\\% \\$x\\_1\\$ \\# \\{组\\} \\textbackslash{} \\textasciitilde{} \\textasciicircum{}');
  assert.match(buildBibTeX({ ...article, title: 'A&B_{测试} 50%' }), /A\\&B\\_\\\{测试\\\} 50\\%/);
});

test('publication parsing rejects impossible dates and preserves the source calendar day', () => {
  assert.equal(citationDate('2024-02-29T23:30:00-08:00'), '2024-02-29');
  assert.equal(citationDate('2026年11月3日'), '2026-11-03');
  for (const value of ['2026-02-29', '2026-13-01', '2026-04-31', '昨天', '2026']) assert.equal(citationDate(value), '');
  assert.throws(() => buildBibTeX({ ...article, published: '2026-02-29' }), /发布日期/);
});

test('timestamp metadata uses the Zhihu publication calendar rather than the UTC date prefix', () => {
  assert.equal(citationMetadataDate('2026-10-31T17:30:00.000Z'), '2026-11-01');
  assert.equal(citationMetadataDate('2024-02-29T23:00:00-08:00'), '2024-03-01');
  assert.equal(citationMetadataDate('2026-10-31'), '2026-10-31');
  assert.equal(citationMetadataDate('2026-02-29T17:30:00Z'), '');
  assert.equal(citationMetadataDate('2026-10-31Tnot-a-time'), '');
});

test('unsafe URLs and invalid keys are rejected; Zhihu keys do not depend on titles', () => {
  for (const url of ['javascript:alert(1)', 'data:text/plain,hello', 'https://name:secret@example.com/p/1', 'https://example.com/a\nb']) assert.throws(() => citationURL(url));
  assert.equal(citationKey(article.url), 'zhihu2099987320443237060');
  assert.equal(citationURL('https://example.com/a_b?x=1&tag=%20'), 'https://example.com/a_b?x=1&tag=%20');
  assert.throws(() => buildBibTeX({ ...article, key: 'bad,key' }), /引用键/);
  assert.throws(() => buildBibTeX({ ...article, title: '' }), /文章标题/);
});

test('excerpt keeps line breaks, quotes only selected text and appends traceable source', () => {
  const quote = buildExcerpt(article, '第一段原文\n\n第二段原文');
  assert.ok(quote.startsWith('> 第一段原文\n> \n> 第二段原文\n\n'));
  assert.match(quote, /DeepSeek/);
  assert.match(quote, /来源：<https:\/\/zhuanlan.zhihu.com\/p\/2099987320443237060>/);
  assert.match(quote, /发布：2026-10-31；访问：2026-11-03/);
  assert.throws(() => buildExcerpt(article, ''), /先在正文/);
  assert.throws(() => buildExcerpt(article, '字'.repeat(50001)), /50000/);
});
