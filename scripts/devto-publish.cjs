#!/usr/bin/env node
/**
 * Dev.to Article Publisher
 * 
 * Usage:
 *   1. Get API key: https://dev.to/settings/extensions (scroll to "DEV Community API Keys")
 *   2. Export it: export DEV_TO_API_KEY=your_key
 *   3. Publish: node scripts/devto-publish.js articles/en-01-open-source-finance-app.md
 *   4. Dry run:  node scripts/devto-publish.js articles/en-01-open-source-finance-app.md --dry-run
 * 
 * The article frontmatter (title, tags, cover_image, etc.) is used directly.
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.DEV_TO_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const filePath = process.argv.find(a => a.endsWith('.md'));

if (!filePath) {
  console.error('Usage: node devto-publish.js <article.md> [--dry-run]');
  process.exit(1);
}

if (!API_KEY && !DRY_RUN) {
  console.error('❌ DEV_TO_API_KEY not set. Get one at https://dev.to/settings/extensions');
  console.error('   export DEV_TO_API_KEY=your_key');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');

// Parse frontmatter
const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
  console.error('❌ No frontmatter found in', filePath);
  process.exit(1);
}

const frontmatter = fmMatch[1];
const body = fmMatch[2].trim();

// Parse YAML-like frontmatter
const getFM = (key) => {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

const title = getFM('title');
const tags = getFM('tags')?.split(',').map(t => t.trim()).slice(0, 4) || [];
const coverImage = getFM('cover_image');
const canonicalUrl = getFM('canonical_url');
const series = getFM('series');
const description = getFM('description');

if (!title) {
  console.error('❌ No title in frontmatter');
  process.exit(1);
}

const article = {
  title,
  body_markdown: body,
  published: false, // Always create as draft first
  tags,
  ...(coverImage && { main_image: coverImage }),
  ...(canonicalUrl && { canonical_url: canonicalUrl }),
  ...(series && { series }),
  ...(description && { description }),
};

console.log('📝 Article to publish:');
console.log(`   Title: ${title}`);
console.log(`   Tags: ${tags.join(', ')}`);
console.log(`   Series: ${series || '(none)'}`);
console.log(`   Published: false (draft)`);
console.log(`   Body length: ${body.length} chars`);
console.log('');

if (DRY_RUN) {
  console.log('✅ Dry run complete. Article would be created as draft on Dev.to.');
  console.log('   Remove --dry-run to actually publish.');
  process.exit(0);
}

fetch('https://dev.to/api/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': API_KEY,
  },
  body: JSON.stringify({ article }),
})
  .then(res => {
    if (!res.ok) return res.json().then(err => { throw new Error(JSON.stringify(err)); });
    return res.json();
  })
  .then(data => {
    console.log('✅ Article created as draft!');
    console.log(`   URL: https://dev.to${data.path}`);
    console.log(`   Edit: https://dev.to${data.path}/edit`);
    console.log('');
    console.log('⚠️  Article is in DRAFT mode. Review and publish at the edit URL above.');
  })
  .catch(err => {
    console.error('❌ Failed to publish:', err.message);
    process.exit(1);
  });
