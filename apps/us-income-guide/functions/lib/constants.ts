/** HttpOnly cookie tying this browser to Stripe Checkout metadata (UUID). */
export const BUYER_SESSION_COOKIE = 'us_inc_buyer_sid';

export const PRODUCT_SIDE_HUSTLE_SELECTION_KIT = 'side-hustle-selection-kit';

export const JSON_HEADERS = {
	'Content-Type': 'application/json; charset=utf-8',
	'Cache-Control': 'no-store',
} as const;
