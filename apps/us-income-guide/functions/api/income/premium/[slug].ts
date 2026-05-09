import { readBuyerSessionId } from '../../../lib/cookies';
import { JSON_HEADERS } from '../../../lib/constants';
import { getPremiumPayload } from '../../../lib/premium-body';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function onRequestGet(context: { request: Request; env: Env; params: { slug?: string } }): Promise<Response> {
	const slug = context.params.slug ?? '';
	if (!slug || !SLUG_RE.test(slug)) {
		return json({ error: 'invalid_slug' }, 400);
	}

	const payloadTemplate = getPremiumPayload(slug);
	if (!payloadTemplate) {
		return json({ error: 'not_found' }, 404);
	}

	const buyerSession = readBuyerSessionId(context.request);
	if (!buyerSession) {
		return json({ entitled: false as const }, 200);
	}

	const row = await context.env.DB.prepare(
		`SELECT 1 AS ok FROM entitlements WHERE buyer_session_id = ? AND product_slug = ? LIMIT 1`,
	)
		.bind(buyerSession, slug)
		.first<{ ok: number }>();

	if (!row) {
		return json({ entitled: false as const }, 200);
	}

	return json({
		entitled: true as const,
		slug: payloadTemplate.slug,
		title: payloadTemplate.title,
		sections: payloadTemplate.sections,
		disclaimerHtml: payloadTemplate.disclaimerHtml,
	});
}
