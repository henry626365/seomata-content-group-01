import type { Stripe } from 'stripe';
import { JSON_HEADERS, PRODUCT_SIDE_HUSTLE_SELECTION_KIT } from '../../lib/constants';
import { getStripe } from '../../lib/stripe-client';

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
	const { request, env } = context;
	const secret = env.STRIPE_WEBHOOK_SECRET;
	const stripeKey = env.STRIPE_SECRET_KEY;
	if (!secret || !stripeKey) {
		return new Response('Webhook not configured', { status: 503 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return new Response('Missing signature', { status: 400 });
	}

	const rawBody = await request.text();
	const stripe = getStripe(stripeKey);

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, signature, secret);
	} catch (e) {
		console.error('stripe-webhook verify failed:', e);
		return new Response('Invalid signature', { status: 400 });
	}

	const eventInsert = await env.DB.prepare('INSERT OR IGNORE INTO stripe_webhook_events (id) VALUES (?)')
		.bind(event.id)
		.run();
	if (!eventInsert.success || (eventInsert.meta?.changes ?? 0) === 0) {
		return json({ received: true, duplicate: true });
	}

	if (event.type !== 'checkout.session.completed') {
		return json({ received: true, ignored: event.type });
	}

	const session = event.data.object as Stripe.Checkout.Session;
	if (session.payment_status !== 'paid') {
		return json({ received: true, skipped: 'unpaid' });
	}

	const buyerSessionId = session.metadata?.buyer_session_id?.trim() ?? '';
	const productSlug = session.metadata?.product_slug?.trim() ?? '';
	const sessionId = session.id;

	if (!buyerSessionId || !sessionId || productSlug !== PRODUCT_SIDE_HUSTLE_SELECTION_KIT) {
		return json({ received: true, skipped: 'metadata' });
	}

	const email = session.customer_details?.email ?? null;

	try {
		await env.DB.prepare(
			`INSERT INTO entitlements (buyer_session_id, product_slug, stripe_checkout_session_id, customer_email)
       VALUES (?, ?, ?, ?)`,
		)
			.bind(buyerSessionId, productSlug, sessionId, email)
			.run();
	} catch (e) {
		// Session id unique: duplicate fulfillment is OK
		console.error('entitlement insert:', e);
	}

	return json({ received: true, stored: true });
}
