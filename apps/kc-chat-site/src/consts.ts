export const SITE_TITLE = 'KC Chat — Turn Cursor into a coordinated AI dev team';
export const SITE_DESCRIPTION =
  'A Cursor extension that runs multiple specialized AI agents in parallel — architect, frontend, backend, QA — with an autopilot orchestrator and a live KC Flow progress tracker. Pay once, no subscription.';
export const SITE_URL = 'https://h540.com';

// Single source of truth for external links — keep these consistent everywhere.
// NOTE: confirm the real GitHub repo before launch (header/footer and contact page
// previously pointed at two different repos).
export const GITHUB_URL = 'https://github.com/nicekate/KC-Chat';
export const CONTACT_EMAIL = 'support@h540.com';
export const TWITTER_URL = 'https://x.com/h540com';

export const NAV_LINKS = [
  { label: 'How it works', href: '/tutorial' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'Features',     href: '/features' },
  { label: 'Activate',     href: '/activate' },
  { label: 'Docs',         href: '/docs' },
  { label: 'Changelog',    href: '/changelog' },
] as const;
