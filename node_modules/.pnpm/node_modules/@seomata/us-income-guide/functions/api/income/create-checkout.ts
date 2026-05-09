import { getOrCreateBuyerSession } from '../../lib/cookies';
import { JSON_HEADERS, PRODUCT_SIDE_HUSTLE_SELECTION_KIT } from '../../lib/constants';
import { getStripe } from '../../lib/stripe-client';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
	const { request, env } = context;
	const stripeKey = env.STRIPE_SECRET_KEY;
	const priceId = env.STRIPE_PRICE_SIDE_HUSTLE_SELECTION_KIT;
	if (!stripeKey || !priceId) {
		return json({ error: 'payments_not_configured' }, 503);
	}

	const buyer = getOrCreateBuyerSession(request);

	const stripe = getStripe(stripeKey);
	const origin = new URL(request.url).origin;

	let sessionUrl: string;
	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${origin}/premium/side-hustle-selection-kit/?checkout=success`,
			cancel_url: `${origin}/premium/side-hustle-selection-kit/?checkout=cancel`,
			metadata: {
				buyer_session_id: buyer.id,
				product_slug: PRODUCT_SIDE_HUSTLE_SELECTION_KIT,
			},
		});
		if (!session.url) {
			return json({ error: 'stripe_no_url' }, 502);
		}
		sessionUrl = session.url;
	} catch (e) {
		console.error('create-checkout Stripe error:', e);
		return json({ error: 'stripe_error' }, 502);
	}

	const headers = new Headers({ Location: sessionUrl });
	if (buyer.setCookie) headers.append('Set-Cookie', buyer.setCookie);
	return new Response(null, { status: 302, headers });
}
