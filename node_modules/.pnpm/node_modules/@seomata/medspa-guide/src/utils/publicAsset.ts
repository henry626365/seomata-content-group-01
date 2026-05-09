/**
 * Normalize public/ URLs with correct percent-encoding per path segment,
 * plus import.meta.env.BASE_URL for subdirectory deployments.
 */
export function encodePublicAssetPath(rel: string): string {
	if (/^https?:\/\//i.test(rel)) {
		return rel;
	}
	const trimmed = rel.replace(/^\/+/, '').replace(/\\/g, '/');
	const suffix = trimmed
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	const rawBase = import.meta.env.BASE_URL;
	const base =
		rawBase === '/' ? '' : (rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase);
	const pathSlash = suffix ? `/${suffix}` : '/';
	return base ? `${base}${pathSlash}` : pathSlash;
}

/** List/card thumbnails: Astro `heroImage.src` as-is; `heroPhoto` and fallbacks under `public/` get encoded. */
export function resolveHeroThumbnail(
	heroImageSrc: string | undefined,
	heroPhoto: string | undefined,
	fallback: string,
): string {
	if (heroImageSrc) {
		return heroImageSrc;
	}
	const raw = heroPhoto ?? fallback;
	return encodePublicAssetPath(raw);
}
