export {};

declare global {
	interface Env {
		DB: D1Database;
		STRIPE_SECRET_KEY: string;
		STRIPE_WEBHOOK_SECRET: string;
		STRIPE_PRICE_SIDE_HUSTLE_SELECTION_KIT: string;
	}
}
