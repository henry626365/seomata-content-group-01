/**
 * One-time maintenance: copies seo/public/blog-images into medspa-guide and
 * rewrites frontmatter heroPhoto on each blog .md using seo/src/content/blogImages.ts slug map.
 *
 * Usage (from repo root or medspa-guide):
 *   node apps/medspa-guide/scripts/copy-blog-static-from-seo.mjs [absolute-or-relative-path-to-seo-repo]
 *
 * Default seo path: ../../../seo (from this file: group/apps/medspa-guide/scripts → ../../../../seo ??)
 *
 * Scripts lives at: group/apps/medspa-guide/scripts
 * parent 3× → group → need 4× to wwwroot → ../../../../seo
 */
import { cpSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MEDSPA_ROOT = resolve(HERE, '..');
const BLOG_SRC = resolve(MEDSPA_ROOT, 'src/content/blog');
const PUBLIC_IMAGES_DST = resolve(MEDSPA_ROOT, 'public/blog-images');

const seoRootArg = process.argv[2]?.trim();
const SEO_ROOT_DEFAULT = resolve(HERE, '../../../../seo');

function parseSlugMap(tsPath) {
	const text = readFileSync(tsPath, 'utf8');
	const map = Object.create(null);
	const re = /'([\w-]+)': '\/blog-images\/([^']+)\?v=/g;
	let m = re.exec(text);
	while (m) {
		map[m[1]] = `/blog-images/${m[2]}`;
		m = re.exec(text);
	}
	return map;
}

function patchMarkdownFrontmatter(content, heroUrl) {
	const lines = content.split(/\r?\n/);
	const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
	if (end <= 1 || lines[0].trim() !== '---') {
		throw new Error('Missing YAML frontmatter');
	}
	const bodyStart = end + 1;
	const fm = lines.slice(1, end);
	const nextFm = [];
	let hasPhoto = false;
	for (const line of fm) {
		if (/^heroImage:/.test(line)) continue;
		if (/^heroPhoto:/.test(line)) {
			nextFm.push(`heroPhoto: ${JSON.stringify(heroUrl)}`);
			hasPhoto = true;
			continue;
		}
		nextFm.push(line);
	}
	if (!hasPhoto) {
		const authorIdx = nextFm.findIndex((l) => /^author:/.test(l));
		const insertAt = authorIdx >= 0 ? authorIdx + 1 : nextFm.length;
		nextFm.splice(insertAt, 0, `heroPhoto: ${JSON.stringify(heroUrl)}`);
	}
	return ['---', ...nextFm, '---', ...lines.slice(bodyStart)].join('\n');
}

function main() {
	const SEO_ROOT = seoRootArg ? resolve(seoRootArg) : SEO_ROOT_DEFAULT;
	const blogImagesTs = join(SEO_ROOT, 'src/content/blogImages.ts');
	const blogImagesSrcDir = join(SEO_ROOT, 'public/blog-images');

	const entries = readdirSync(BLOG_SRC).filter((f) => f.endsWith('.md'));
	const slugMap = parseSlugMap(blogImagesTs);

	cpSync(blogImagesSrcDir, PUBLIC_IMAGES_DST, { recursive: true });
	console.log(`Copied blog images → ${PUBLIC_IMAGES_DST}`);

	let patched = 0;
	for (const file of entries) {
		const slug = file.replace(/\.md$/, '');
		const heroUrl = slugMap[slug];
		if (!heroUrl) {
			console.warn(`No blogImages mapping for ${slug}, skip frontmatter patch`);
			continue;
		}
		const mdPath = join(BLOG_SRC, file);
		const raw = readFileSync(mdPath, 'utf8');
		writeFileSync(mdPath, patchMarkdownFrontmatter(raw, heroUrl), 'utf8');
		patched++;
	}
	console.log(`Patched heroPhoto on ${patched} markdown files.`);
}

main();
