/** Hub page copy for topic landing routes (English UI). */

export type HubCard = {
	href: string;
	title: string;
	description: string;
	/** If set, resolves hero thumbnail from blog post id when available */
	postId?: string;
	fallbackImage: string;
	imageAlt: string;
	category?: string;
};

export type TopicHubDefinition = {
	seoTitle: string;
	seoDescription: string;
	pageTitle: string;
	summary: string;
	whoFor: string[];
	readingPath: string[];
	faqs: { question: string; answer: string }[];
	cards: HubCard[];
};

export const topicHubs: Record<string, TopicHubDefinition> = {
	'local-seo': {
		seoTitle: 'Med Spa Local SEO Resources | Med Spa Marketing Guide',
		seoDescription:
			'Local SEO hubs, city pages, and service intent mapping for aesthetic practices competing in localized search.',
		pageTitle: 'Med Spa Local SEO',
		summary:
			'A practical starting point if you compete for “near me” intent alongside injectables and energy-based aesthetics. Strong local SEO is less about hacks and more about consistent entity signals, coherent service taxonomy, and pages that mirror how patients browse.',
		whoFor: [
			'Practice operators who own website + GBP upkeep',
			'Growth leads balancing paid media with evergreen pages',
			'Agencies onboarding med spa clients needing a calm sitemap roadmap',
		],
		readingPath: [
			'Audit your Google Business Profile for category + service coherence',
			'Align GBP services with flagship treatment pages',
			'Treat neighborhood/city adjunct pages as clarification—not keyword stuffing',
		],
		faqs: [
			{
				question: 'Do you guarantee rankings?',
				answer:
					'No—this hub shares educational workflows. Performance depends on market competition, geography, adherence, compliance constraints, and how well your site aligns with searcher intent.',
			},
			{
				question: 'Should we duplicate pages for nearby cities?',
				answer:
					'Prefer unique, materially different pages tied to staffing, modalities, logistics, or patient education needs—avoid templated swaps that hurt trust and quality.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-local-seo-checklist/',
				title: 'Med Spa Local SEO Checklist',
				description: 'A recurring audit cadence tying GBP, flagship pages, and conversion paths together.',
				postId: 'med-spa-local-seo-checklist',
				fallbackImage: '/images/med-spa-seo-checklist-preview.svg',
				imageAlt: 'Illustrative checklist visualization',
				category: 'Hub resource',
			},
			{
				href: '/blog/med-spa-location-page-seo/',
				title: 'Med Spa Location Page SEO',
				description: 'When city pages deserve to exist—and what should differ between them.',
				postId: 'med-spa-location-page-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Illustrative map discovery layers',
				category: 'Hub resource',
			},
			{
				href: '/blog/multi-location-med-spa-seo/',
				title: 'Multi-Location Med Spa SEO',
				description: 'Scaling local visibility without duplicating thin city templates.',
				postId: 'multi-location-med-spa-seo',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Illustrative wireframe motif',
				category: 'Hub resource',
			},
		],
	},
	'google-maps': {
		seoTitle: 'Google Maps for Med Spas | GBP Education Hub',
		seoDescription:
			'Google Business Profile realities for aesthetics: categories, treatments, visuals, messaging, and local discovery—without implying guaranteed prominence.',
		pageTitle: 'Google Maps for Med Spas',
		summary:
			'Aesthetic shoppers often discover practices through proximity and comparative signals—not a single headline promise. GBP work is iterative: accurate services, cohesive photos, sane hours, credible provider signals, and a review cadence grounded in ethics.',
		whoFor: [
			'Treatment coordinators helping providers keep listings accurate',
			'Regional multi-location aesthetics brands',
			'Marketers modernizing GBP after rebrands or modality additions',
		],
		readingPath: [
			'Normalize category + modeled services before expanding photo sets',
			'Align names between GBP treatments and onsite service pages',
			'Operationalize proactive review solicitation as a respectful patient UX moment',
		],
		faqs: [
			{
				question: 'Will adding more photos fix rankings?',
				answer:
					'Photos influence trust and CTR, but uplift is contingent on relevance, completeness, moderation, competitor density, and many off-site factors—never deterministic.',
			},
			{
				question: 'Can we cite exact ranking positions here?',
				answer:
					'We intentionally avoid implying precision metrics; focus on repeatable operational hygiene instead.',
			},
		],
		cards: [
			{
				href: '/blog/google-business-profile-med-spa-seo/',
				title: 'Google Business Profile Optimization for Med Spas',
				description: 'Category signals, modeled services, credibility placement, expectation clarity.',
				postId: 'google-business-profile-med-spa-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Discovery illustration',
				category: 'Maps / GBP',
			},
			{
				href: '/blog/med-spa-seo-audit/',
				title: 'Med Spa SEO Audit Playbook',
				description: 'Common structural gaps before blaming Maps—entity hygiene first.',
				postId: 'med-spa-seo-audit',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Diagrammatic locality abstraction',
				category: 'Maps / GBP',
			},
			{
				href: '/blog/med-spa-image-seo/',
				title: 'Med Spa Image SEO',
				description: 'What to prioritize in visual storytelling without implying clinical outcomes.',
				postId: 'med-spa-image-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Photo collage abstraction',
				category: 'Maps / GBP',
			},
		],
	},
	'patient-reviews': {
		seoTitle: 'Patient Reviews & Reputation for Aesthetic Practices',
		seoDescription:
			'Ethically earn, respond to, and operationalize aesthetic practice reviews—with emphasis on trust, boundaries, and non-manipulative systems.',
		pageTitle: 'Patient Reviews & Reputation',
		summary:
			'Aesthetic consultations carry emotional weight; review strategy must align with HIPAA-aware communication norms and provider professionalism. Aim for operational consistency, humane response templates, and realistic expectation framing.',
		whoFor: [
			'Front-office leaders coordinating omnichannel outreach',
			'Brand managers protecting tone across clinicians',
			'Boutique med spas consolidating reputation operations',
		],
		readingPath: [
			'Establish review moments patients actually welcome',
			'Train scripted empathy first—legal review second—before publishing',
			'Pair reviews changes with onsite trust updates (bios, modality clarity)',
		],
		faqs: [
			{
				question: 'Do templates replace legal/compliance vetting?',
				answer:
					'Absolutely not—they accelerate drafting; your HIPAA + advertising counsel should bless final touchpoints.',
			},
			{
				question: 'Should we incentivize reviews?',
				answer:
					'Most platforms disallow compensation-for-reviews schemas; prioritize ethical timing and experiential excellence instead.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-review-seo/',
				title: 'Med Spa Review SEO',
				description: 'How reviews influence local prominence and structured patient feedback.',
				postId: 'med-spa-review-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Communication abstraction',
				category: 'Reputation',
			},
			{
				href: '/blog/med-spa-faq-seo/',
				title: 'Med Spa FAQ SEO',
				description: 'FAQ patterns patients search before booking—paired with compliant responses.',
				postId: 'med-spa-faq-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Conversation arcs abstraction',
				category: 'Reputation',
			},
			{
				href: '/blog/med-spa-eeat-seo/',
				title: 'E-E-A-T for Med Spa Websites',
				description: 'Provider proof, citations, and trust signals reviewers expect to see echoed online.',
				postId: 'med-spa-eeat-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Operational workflow schematic',
				category: 'Reputation',
			},
		],
	},
	'website-conversion': {
		seoTitle: 'Med Spa Website Conversion Playbooks',
		seoDescription:
			'Improve consultation requests with landing clarity, modality routing, persuasive-yet-compliant story arcs, pricing transparency guardrails.',
		pageTitle: 'Med Spa Website Conversion',
		summary:
			'Elevated aesthetics brands win when informational architecture reduces cognitive load among injectables candidates and laser clientele alike. Optimize pathing, modality cross-links, and mobile tap targets before chasing microcopy hacks.',
		whoFor: [
			'in-house marketer owning WordPress/Webflow/CMS releases',
			'Fractional ops leaders tightening consult capture',
			'Design partners integrating provider credibility blocks',
		],
		readingPath: [
			'Instrumentation first: quantify consult form drop-offs + call tracking blind spots',
			'Rebuild top routes (Botox landing, resurfacing hubs) separately then interconnect',
			'Sync paid landing promises with GBP + onsite proof points',
		],
		faqs: [
			{
				question: 'What about AI chat?',
				answer:
					'Discuss vendor due diligence separately—prioritize disclaimers clarifying chats do not diagnose or prescribe.',
			},
			{
				question: 'Should price go on the site?',
				answer:
					'Model trade-offs (transparency vs consult-first); never fabricate anchors—align with compliant regional norms.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-seo-conversion-rate/',
				title: 'Med Spa SEO Conversion Strategy',
				description: 'Bridging modality discovery, trust blocks, and consult workflow.',
				postId: 'med-spa-seo-conversion-rate',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Consult funnel abstraction',
				category: 'Conversion',
			},
			{
				href: '/blog/med-spa-blog-strategy/',
				title: 'Med Spa Blog Strategy',
				description: 'Editorial pacing, internal links, and CTA hygiene for elective patients.',
				postId: 'med-spa-blog-strategy',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'CTA illustration',
				category: 'Conversion',
			},
			{
				href: '/blog/med-spa-seo-pricing-roi/',
				title: 'Med Spa SEO Pricing & ROI',
				description: 'How to discuss investment ranges responsibly while aligning with funnel math.',
				postId: 'med-spa-seo-pricing-roi',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Pricing schematic',
				category: 'Conversion',
			},
		],
	},
	'service-pages': {
		seoTitle: 'Aesthetic Service Page SEO Strategies',
		seoDescription:
			'Earn consideration on Botox®, laser hair removal, facials + injectables service templates—without diagnosing or implying guaranteed outcomes.',
		pageTitle: 'Aesthetic Service Page SEO',
		summary:
			'Earned discovery on treatment pages merges clinical clarity (who treats, modality scope), emotional resonance (education around expectations), and structured internal linking powering topical authority.',
		whoFor: [
			'Clinical marketing hybrid roles moderating clinician voice vs compliance',
			'SEO partners needing structured briefs clinicians will respect',
			'Boutiques expanding mix of toxins + resurfacing combos',
		],
		readingPath: [
			'Establish modular sections per modality family',
			'Cross-link adjunct safety education without fearmongering',
			'Maintain proof-of-expertise snippets that stop short of medical directives',
		],
		faqs: [
			{
				question: 'Do we prescribe treatment language?',
				answer:
					'No—guides discuss marketing structure; prescribing language flows through licensed clinician oversight.',
			},
			{
				question: 'How do disclaimers coexist with aspiration narratives?',
				answer:
					'Pair aspirational brand voice with conspicuous educational disclaimers and evidence tone alignment.',
			},
		],
		cards: [
			{
				href: '/blog/botox-seo-strategy/',
				title: 'Botox SEO Strategy',
				description: 'Neuromodulator landing architecture and consult paths—not dosing advice.',
				postId: 'botox-seo-strategy',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Wire abstraction',
				category: 'Service SEO',
			},
			{
				href: '/blog/filler-seo-med-spas/',
				title: 'Filler SEO for Med Spas',
				description: 'Silo interplay between toxins, fillers, and supporting consult education.',
				postId: 'filler-seo-med-spas',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Structural diagram',
				category: 'Service SEO',
			},
			{
				href: '/blog/med-spa-service-page-seo/',
				title: 'Med Spa Service Page SEO',
				description: 'When to merge vs differentiate overlapping modality URLs.',
				postId: 'med-spa-service-page-seo',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Menu illustration',
				category: 'Service SEO',
			},
		],
	},
	templates: {
		seoTitle: 'Med Spa Marketing Templates & Checklists',
		seoDescription:
			'Downloadable scaffolding for SEO reviews, GBP sweeps, CTA overlays, templated workflows—education only.',
		pageTitle: 'Med Spa Marketing Templates',
		summary:
			'Templates compress repeated planning patterns into shareable canvases—not legal substitutes. Customize per market, modality mix, and counsel guidance.',
		whoFor: [
			'Operators standardizing repeatable launch prep',
			'Agencies scaling multi-practice onboarding',
			'Training leads upskilling front desk ambassadors',
		],
		readingPath: [
			'Baseline asset inventory (brand decks, disclaimers backlog)',
			'Layer templates into QA + HIPAA review checkpoints',
			'Pair templates with KPI reviews (calls, submits, completions)',
		],
		faqs: [
			{
				question: 'Are these legal documents?',
				answer:
					'No—they are planning aids; HIPAA and advertising disclaimers belong to jurisdiction-specific counsel.',
			},
			{
				question: 'Localization?',
				answer:
					'Adjust examples for state-dependent scope-of-practice + marketing truth cadence.',
			},
		],
		cards: [
			{
				href: '/templates/med-spa-seo-checklist/',
				title: 'Med Spa SEO Checklist Template',
				description: 'Recurring visibility + topical integrity checks.',
				fallbackImage: '/images/med-spa-seo-checklist-preview.svg',
				imageAlt: 'Checklist schematic',
				category: 'Template',
			},
			{
				href: '/templates/consultation-cta-examples/',
				title: 'Consultation CTA Examples',
				description: 'CTA pattern library scaffold.',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Funnel schematic',
				category: 'Template',
			},
			{
				href: '/templates/med-spa-service-page-template/',
				title: 'Service Page Skeleton',
				description: 'Section ordering with compliance-minded prompts.',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Wireframe motif',
				category: 'Template',
			},
		],
	},
	'case-breakdowns': {
		seoTitle: 'Med Spa Marketing Breakdowns (Educational Hypotheticals)',
		seoDescription:
			'Hypothesis-driven teardowns illuminating operational reasoning—explicitly NOT client case studies with metrics.',
		pageTitle: 'Med Spa Marketing Breakdowns',
		summary:
			'Each breakdown frames realistic dilemmas clinicians face digitally—without asserting proprietary benchmarks. Use them teaching teams how to dissect mixed signals.',
		whoFor: [
			'Training managers orienting juniors to marketing critiques',
			'Operators preparing leadership reviews',
			'Students mapping consult funnel theory to practice workflows',
		],
		readingPath: [
			'Separate observation vs inference vs action plan',
			'Cross-check disclaimers referencing hypothetical basis',
			'Pair teardown with prioritized validation experiments',
		],
		faqs: [
			{
				question: 'Are these real anonymized clinics?',
				answer:
					'No synthetic patient nor clinic identities—purely illustrative reasoning paths.',
			},
			{
				question: 'Can screenshots appear?',
				answer:
					'Avoid scraped SERP implying placement—stick to illustrative wireframes/icons.',
			},
		],
		cards: [
			{
				href: '/case-breakdowns/med-spa-website-conversion-breakdown/',
				title: 'Traffic vs consultations tension',
				description: 'Narrative dissection emphasizing friction hypotheses.',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Funnel illustration',
				category: 'Breakdown',
			},
			{
				href: '/case-breakdowns/botox-service-page-breakdown/',
				title: 'Injectables credibility gaps',
				description: 'Page-level trust rebuild strategies.',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Structural illustration',
				category: 'Breakdown',
			},
			{
				href: '/case-breakdowns/google-maps-visibility-breakdown/',
				title: 'Maps visibility skepticism teardown',
				description: 'Systematic checks before rebranding blaming maps.',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Map motif',
				category: 'Breakdown',
			},
		],
	},
	reports: {
		seoTitle: 'Med Spa Local Search Reports & Method Docs',
		seoDescription:
			'Evidence-light methodology dossiers—no fabricated benchmark tables—centering introspection questionnaires.',
		pageTitle: 'Med Spa Local Search Reports',
		summary:
			'A single Phase-1 dossier outlining how teams can characterize local demand signals without implying numeric promises. Subsequent iterations may layering optional survey hooks—never scraped competitor espionage narratives.',
		whoFor: [
			'Distributed leadership aligning cross-functional KPI language',
			'Investor-readiness rehearsals needing measured tone',
			'Internal rev ops prepping quarterly planning retreats',
		],
		readingPath: [
			'Establish internal definitions of inquiry quality',
			'Pair qualitative call logs with directional web analytics trendlines',
			'Document experiments with falsifiable hypotheses—not vanity metrics alone',
		],
		faqs: [
			{
				question: 'Do you publish leaderboard stats?',
				answer:
					'No—we avoid asserting national med spa ranking distributions without transparent sampling frames.',
			},
			{
				question: 'Can benchmarks ever appear?',
				answer:
					'Only sourced, licensed third-party aggregates with methodological footnotes—not invented medians.',
			},
		],
		cards: [
			{
				href: '/reports/med-spa-local-search-visibility-report/',
				title: 'Local Search Visibility Methodology',
				description: 'Narrative + reflective worksheet structure.',
				fallbackImage: '/images/med-spa-local-search-system.svg',
				imageAlt: 'System schematic',
				category: 'Report',
			},
		],
	},
};
