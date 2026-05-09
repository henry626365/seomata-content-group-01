/** Editorial hub page copy for topic landing routes. */

export type HubCard = {
	href: string;
	title: string;
	description: string;
	/** If set, resolves hero thumbnail from blog post id when available. */
	postId?: string;
	fallbackImage: string;
	imageAlt: string;
	category?: string;
};

export type DiagnosticItem = {
	label: string;
	body: string;
};

export type TopicHubDefinition = {
	seoTitle: string;
	seoDescription: string;
	pageTitle: string;
	kicker: string;
	summary: string;
	editorialNote: string;
	scenariosTitle: string;
	scenarios: string[];
	diagnosticsTitle: string;
	diagnostics: DiagnosticItem[];
	workflowTitle: string;
	workflow: string[];
	redFlagsTitle: string;
	redFlags: string[];
	cardsTitle: string;
	cardsIntro: string;
	faqs: { question: string; answer: string }[];
	cards: HubCard[];
};

export const topicHubs: Record<string, TopicHubDefinition> = {
	'local-seo': {
		seoTitle: 'Med Spa Local SEO Field Guide | Med Spa Marketing Guide',
		seoDescription:
			'A practical local SEO diagnostic for aesthetic practices: GBP, city intent, service pages, reviews, and consultation routes.',
		pageTitle: 'Med Spa Local SEO',
		kicker: 'Local visibility diagnostic',
		summary:
			'Local SEO for a med spa is not one trick in Google Maps. It is the fit between how patients search, how Google understands the business, and whether the website gives enough proof to make a consultation feel worth the next step.',
		editorialNote:
			'Use this hub when a clinic is not showing up consistently for high-intent local searches, or when traffic exists but does not turn into calls, forms, or bookings.',
		scenariosTitle: 'When this hub is useful',
		scenarios: [
			'A single-location clinic wants to compete with larger groups in the same city.',
			'A multi-location brand has duplicate pages, uneven GBP profiles, or inconsistent service naming.',
			'A practice has good providers and reviews, but the site does not explain treatments in the same language patients use.',
		],
		diagnosticsTitle: 'What to check first',
		diagnostics: [
			{
				label: 'Business entity clarity',
				body: 'Name, address, phone, categories, hours, and website links should match across GBP, the website, directories, and appointment tools.',
			},
			{
				label: 'Service-to-page alignment',
				body: 'Core services in GBP should point toward real service pages, not generic menu blocks or thin pages with swapped city names.',
			},
			{
				label: 'Local proof',
				body: 'Photos, provider bios, neighborhood references, review language, and consultation details should make the clinic feel physically real.',
			},
			{
				label: 'Consultation route',
				body: 'Every local landing path should make calling, booking, or asking a question obvious on mobile without hiding important expectations.',
			},
		],
		workflowTitle: 'A practical order of work',
		workflow: [
			'Fix GBP categories, service labels, hours, booking links, and photo cadence before writing more pages.',
			'Map each money service to one strong page, then decide whether nearby city pages have enough unique substance to exist.',
			'Add trust blocks: provider credentials, consultation expectations, review excerpts, location logistics, and clear next steps.',
			'Track calls, forms, and booked consultations separately so rankings do not become the only success metric.',
		],
		redFlagsTitle: 'Signs the work still feels thin',
		redFlags: [
			'City pages differ only by location name.',
			'GBP services use names that do not appear on the website.',
			'The page promises ranking gains but does not explain operational follow-through.',
			'Reviews are mentioned as a ranking lever but not as patient trust evidence.',
		],
		cardsTitle: 'Start with these local SEO guides',
		cardsIntro:
			'These pieces are ordered for diagnosis first, expansion second. Do not build more pages until the basic entity and service signals are clean.',
		faqs: [
			{
				question: 'Should every nearby city get its own page?',
				answer:
					'Only if the page can say something materially different: provider coverage, parking, travel time, consultation patterns, service mix, or local proof. Otherwise it reads like a search-engine page, not a patient page.',
			},
			{
				question: 'Is Google Maps separate from local SEO?',
				answer:
					'It is one part of the same system. Maps visibility, onsite service pages, reviews, and conversion paths all shape whether a local search becomes a real inquiry.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-local-seo-checklist/',
				title: 'Med Spa Local SEO Checklist',
				description: 'A field checklist for GBP, service pages, reviews, and consultation paths.',
				postId: 'med-spa-local-seo-checklist',
				fallbackImage: '/images/med-spa-seo-checklist-preview.svg',
				imageAlt: 'Checklist visualization for local SEO',
				category: 'Checklist',
			},
			{
				href: '/blog/med-spa-location-page-seo/',
				title: 'Med Spa Location Page SEO',
				description: 'How to decide when a city or location page deserves to exist.',
				postId: 'med-spa-location-page-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Map discovery layers',
				category: 'Page strategy',
			},
			{
				href: '/blog/multi-location-med-spa-seo/',
				title: 'Multi-Location Med Spa SEO',
				description: 'A structure for scaling visibility without cloning weak local pages.',
				postId: 'multi-location-med-spa-seo',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Multi-location page structure',
				category: 'Multi-location',
			},
		],
	},
	'google-maps': {
		seoTitle: 'Google Maps for Med Spas | GBP Operations Guide',
		seoDescription:
			'Google Business Profile guidance for med spas: categories, services, photos, reviews, Q&A, tracking, and trust signals.',
		pageTitle: 'Google Maps for Med Spas',
		kicker: 'GBP operations guide',
		summary:
			'Patients often meet a med spa first in Google Maps, where the decision is fast and comparative. A profile has to prove the clinic is real, current, nearby, and credible before the website gets a chance to persuade.',
		editorialNote:
			'This hub is for profile maintenance and local discovery work. It avoids ranking guarantees and focuses on the daily details that make a profile believable.',
		scenariosTitle: 'Typical profile problems',
		scenarios: [
			'The clinic added new treatments but the profile still lists old or vague services.',
			'Photos are sparse, dated, overproduced, or disconnected from the actual patient experience.',
			'Reviews mention specific services, but those services are not reflected in GBP or onsite pages.',
		],
		diagnosticsTitle: 'GBP fields that deserve attention',
		diagnostics: [
			{
				label: 'Categories',
				body: 'Primary and secondary categories should reflect the actual business model, not every service the clinic wishes to rank for.',
			},
			{
				label: 'Services',
				body: 'Modeled services should use patient-friendly names and connect to website pages that explain expectations, candidacy, and next steps.',
			},
			{
				label: 'Photos',
				body: 'A useful photo set shows exterior, interior, provider context, treatment rooms, equipment, and brand tone without implying outcomes.',
			},
			{
				label: 'Q&A and updates',
				body: 'Profile content should answer real pre-booking questions: parking, consults, deposits, booking windows, and treatment boundaries.',
			},
		],
		workflowTitle: 'Monthly GBP maintenance rhythm',
		workflow: [
			'Verify hours, booking links, phone numbers, and tracking URLs after any campaign or seasonal change.',
			'Refresh photos in small batches so the profile feels active rather than staged once a year.',
			'Review service labels against website navigation and paid landing pages.',
			'Summarize new review themes and decide whether the website needs clearer service explanations.',
		],
		redFlagsTitle: 'What makes a profile feel neglected',
		redFlags: [
			'Stock-like photos that do not show the clinic environment.',
			'Service names that are either too broad or too clinical for patient search behavior.',
			'No clear appointment route from the profile to the right onsite page.',
			'Owner replies that sound copied, defensive, or too specific about patient care.',
		],
		cardsTitle: 'Recommended Maps resources',
		cardsIntro:
			'Start with profile hygiene, then connect the profile to service-page and image strategy.',
		faqs: [
			{
				question: 'Will more photos improve rankings by themselves?',
				answer:
					'Photos can improve trust and engagement, but they are not a magic ranking lever. Their value depends on accuracy, relevance, recency, and how well the rest of the profile and website support the same story.',
			},
			{
				question: 'Should every treatment be listed as a GBP service?',
				answer:
					'List important services, but keep the profile readable. If a service is listed, the website should explain it clearly enough for a patient to continue.',
			},
		],
		cards: [
			{
				href: '/blog/google-business-profile-med-spa-seo/',
				title: 'Google Business Profile Optimization',
				description: 'How categories, services, photos, and profile links work together.',
				postId: 'google-business-profile-med-spa-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Google Maps visibility illustration',
				category: 'GBP',
			},
			{
				href: '/blog/med-spa-seo-audit/',
				title: 'Med Spa SEO Audit Playbook',
				description: 'A broader audit before assuming a Maps-only problem.',
				postId: 'med-spa-seo-audit',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Local audit layers',
				category: 'Audit',
			},
			{
				href: '/blog/med-spa-image-seo/',
				title: 'Med Spa Image SEO',
				description: 'Photo decisions for trust, accessibility, and page performance.',
				postId: 'med-spa-image-seo',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Image strategy motif',
				category: 'Visual trust',
			},
		],
	},
	'patient-reviews': {
		seoTitle: 'Patient Reviews & Reputation for Med Spas',
		seoDescription:
			'Review strategy for med spas: ethical requests, response tone, onsite trust signals, and reputation operations.',
		pageTitle: 'Patient Reviews & Reputation',
		kicker: 'Trust and response system',
		summary:
			'Reviews are not just social proof. For aesthetic practices, they are a public record of tone, expectations, service clarity, and whether patients felt understood before and after a visit.',
		editorialNote:
			'This hub treats reviews as a patient-experience system. It does not recommend incentives, private health disclosures, or manipulative request flows.',
		scenariosTitle: 'When reputation work matters most',
		scenarios: [
			'The clinic has good ratings but vague review language that does not help treatment-specific searches.',
			'Staff reply quickly, but responses sound generic or expose too much context.',
			'The website claims trust, yet does not surface provider proof, review themes, or consultation expectations.',
		],
		diagnosticsTitle: 'Review system checkpoints',
		diagnostics: [
			{
				label: 'Request timing',
				body: 'Ask at a moment that feels natural to the patient experience, not only when the team needs more reviews.',
			},
			{
				label: 'Response boundaries',
				body: 'Replies should be warm and specific enough to feel human while avoiding treatment details or patient identifiers.',
			},
			{
				label: 'Theme analysis',
				body: 'Recurring review language can reveal what patients value: consultation clarity, provider manner, wait time, results expectations, or front desk support.',
			},
			{
				label: 'Onsite echo',
				body: 'If reviews praise consultation style or provider education, service pages should make those strengths visible before booking.',
			},
		],
		workflowTitle: 'A humane reputation workflow',
		workflow: [
			'Define who asks for reviews, when they ask, and what language is approved.',
			'Create response examples for praise, confusion, delays, pricing concerns, and negative experiences.',
			'Review monthly themes and decide which website sections need stronger expectation setting.',
			'Keep legal and compliance review close to the workflow, especially for sensitive services.',
		],
		redFlagsTitle: 'Review practices to avoid',
		redFlags: [
			'Offering compensation or discounts for positive reviews.',
			'Replying with treatment details, visit dates, or patient-specific context.',
			'Using the same response sentence for every review.',
			'Treating reviews as a ranking tactic while ignoring the operational feedback inside them.',
		],
		cardsTitle: 'Reputation resources',
		cardsIntro:
			'These guides connect public feedback, FAQ planning, and onsite expertise signals.',
		faqs: [
			{
				question: 'Can review replies mention the treatment?',
				answer:
					'Be careful. Many clinics keep replies general and appreciative to avoid disclosing or confirming patient details. Final language should follow platform rules and counsel guidance.',
			},
			{
				question: 'How do reviews support SEO?',
				answer:
					'They can influence local trust, click behavior, and patient confidence. The bigger opportunity is using review themes to improve pages, FAQs, and consultation messaging.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-review-seo/',
				title: 'Med Spa Review SEO',
				description: 'How review quality, recency, and replies support patient trust.',
				postId: 'med-spa-review-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Review communication workflow',
				category: 'Reviews',
			},
			{
				href: '/blog/med-spa-faq-seo/',
				title: 'Med Spa FAQ SEO',
				description: 'Turn repeated patient questions into clearer pages and safer expectations.',
				postId: 'med-spa-faq-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'FAQ planning diagram',
				category: 'FAQ',
			},
			{
				href: '/blog/med-spa-eeat-seo/',
				title: 'E-E-A-T for Med Spa Websites',
				description: 'Provider proof, editorial standards, and trust signals for treatment content.',
				postId: 'med-spa-eeat-seo',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Expertise signal workflow',
				category: 'Trust',
			},
		],
	},
	'website-conversion': {
		seoTitle: 'Med Spa Website Conversion Playbook',
		seoDescription:
			'Consultation conversion guidance for med spa websites: routing, CTAs, forms, pricing, proof, and mobile booking paths.',
		pageTitle: 'Med Spa Website Conversion',
		kicker: 'Consultation path audit',
		summary:
			'A med spa website can rank and still fail if the visitor cannot decide what to do next. Conversion work is about reducing uncertainty while respecting the emotional and medical boundaries of aesthetic decisions.',
		editorialNote:
			'Use this hub when organic traffic exists, paid campaigns are active, or the clinic suspects the site is losing motivated patients between service research and consultation.',
		scenariosTitle: 'Common conversion gaps',
		scenarios: [
			'Service pages explain treatments but bury booking options below long generic copy.',
			'The site has forms, calls, and schedulers, but each path sets different expectations.',
			'Paid landing pages, GBP links, and organic pages make different promises.',
		],
		diagnosticsTitle: 'What to inspect on the page',
		diagnostics: [
			{
				label: 'First-screen clarity',
				body: 'A visitor should know the service, clinic location, next step, and whether a consultation is required without scrolling forever.',
			},
			{
				label: 'CTA fit',
				body: 'A Botox visitor, a laser visitor, and a weight-loss visitor may need different CTA language, friction, and expectation setting.',
			},
			{
				label: 'Proof placement',
				body: 'Provider credentials, review themes, before-and-after policies, equipment notes, and safety boundaries should appear before the ask feels too aggressive.',
			},
			{
				label: 'Tracking truth',
				body: 'Calls, forms, online bookings, and abandoned forms should be measured separately enough to diagnose the actual leak.',
			},
		],
		workflowTitle: 'Conversion work in order',
		workflow: [
			'Choose one high-intent route, such as Botox, filler, or laser hair removal, and audit it from search result to booking confirmation.',
			'Fix the primary CTA, mobile tap targets, trust blocks, and consult expectations before changing colors or button copy.',
			'Align paid ads, GBP links, and organic page promises so patients do not feel switched between channels.',
			'Review form quality, not just form volume. A smaller number of serious consults can be healthier than vague leads.',
		],
		redFlagsTitle: 'Signals the page is asking too soon',
		redFlags: [
			'The first CTA appears before the visitor understands candidacy or process.',
			'Pricing language is either absent, evasive, or presented without context.',
			'The page uses urgency language for an elective treatment decision.',
			'The form asks for too much information before establishing trust.',
		],
		cardsTitle: 'Conversion resources',
		cardsIntro:
			'These guides are best read after choosing one important booking path to improve.',
		faqs: [
			{
				question: 'Should every service page have online booking?',
				answer:
					'Not always. Some services need a consultation-first path. The key is to make the next step clear and honest rather than forcing every visitor into the same booking flow.',
			},
			{
				question: 'Is pricing transparency always better?',
				answer:
					'It depends on market, service complexity, and compliance expectations. Many pages can still reduce uncertainty by explaining consult fees, ranges, or what affects price.',
			},
		],
		cards: [
			{
				href: '/blog/med-spa-seo-conversion-rate/',
				title: 'Med Spa SEO Conversion Strategy',
				description: 'A practical bridge between search intent, trust blocks, and consultation requests.',
				postId: 'med-spa-seo-conversion-rate',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Consultation conversion funnel',
				category: 'Conversion',
			},
			{
				href: '/blog/med-spa-blog-strategy/',
				title: 'Med Spa Blog Strategy',
				description: 'How educational articles should lead readers toward the right next step.',
				postId: 'med-spa-blog-strategy',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Editorial CTA workflow',
				category: 'Content',
			},
			{
				href: '/blog/med-spa-seo-pricing-roi/',
				title: 'Med Spa SEO Pricing & ROI',
				description: 'How to talk about investment, payback, and appointment value responsibly.',
				postId: 'med-spa-seo-pricing-roi',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'ROI planning schematic',
				category: 'ROI',
			},
		],
	},
	'service-pages': {
		seoTitle: 'Aesthetic Service Page SEO | Treatment Page Structure',
		seoDescription:
			'How to structure aesthetic treatment pages for med spas: candidacy, expectations, provider proof, FAQs, internal links, and CTAs.',
		pageTitle: 'Aesthetic Service Page SEO',
		kicker: 'Treatment page teardown',
		summary:
			'A strong service page does more than mention a treatment keyword. It helps a patient understand whether the service fits their concern, what a consultation will clarify, and why this clinic is a credible place to ask.',
		editorialNote:
			'This hub is about marketing structure and patient education. Clinical claims, contraindications, and treatment guidance need licensed oversight.',
		scenariosTitle: 'Where service pages usually break',
		scenarios: [
			'The page describes the treatment but not the type of patient question it answers.',
			'Every service page uses the same intro, same CTA, and same FAQ shape.',
			'Provider expertise is hidden on a separate bio page instead of supporting the treatment decision.',
		],
		diagnosticsTitle: 'Sections worth building deliberately',
		diagnostics: [
			{
				label: 'Patient concern',
				body: 'Open with the concern or goal patients recognize, then connect it to the service without overpromising outcomes.',
			},
			{
				label: 'Candidacy and boundaries',
				body: 'Explain who typically asks about the service, what a consultation determines, and where medical review is required.',
			},
			{
				label: 'Process and expectations',
				body: 'Clarify appointment flow, typical timing, follow-up expectations, and what the clinic will discuss before treatment.',
			},
			{
				label: 'Decision support',
				body: 'Use FAQs, related services, review themes, provider proof, and visual policies to help patients compare options responsibly.',
			},
		],
		workflowTitle: 'A service page editing pass',
		workflow: [
			'Choose one flagship service and identify the patient questions it must answer before a consultation.',
			'Rewrite the page around concern, candidacy, process, proof, FAQs, related services, and next step.',
			'Add internal links to adjacent services only where the comparison is genuinely useful.',
			'Ask a clinician or qualified reviewer to check claims, boundaries, and omitted risk context.',
		],
		redFlagsTitle: 'What makes a treatment page feel mass-produced',
		redFlags: [
			'The same FAQ set appears on every treatment page.',
			'The page talks about benefits but never discusses suitability or consultation boundaries.',
			'All provider proof lives in the footer or About page.',
			'Related services are linked because of keywords, not because patients compare them.',
		],
		cardsTitle: 'Service page resources',
		cardsIntro:
			'Start with one treatment family and make it excellent before scaling the pattern.',
		faqs: [
			{
				question: 'Can one page cover several related treatments?',
				answer:
					'Sometimes. If patients compare the services together and the clinic explains the differences clearly, one hub can work. If intent, candidacy, and consultation path differ, separate pages may serve patients better.',
			},
			{
				question: 'How medical should the content be?',
				answer:
					'Enough to set expectations and boundaries, not enough to diagnose or prescribe. The page should encourage appropriate consultation rather than replace it.',
			},
		],
		cards: [
			{
				href: '/blog/botox-seo-strategy/',
				title: 'Botox SEO Strategy',
				description: 'A neuromodulator page structure focused on trust and consultation intent.',
				postId: 'botox-seo-strategy',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Botox service page structure',
				category: 'Injectables',
			},
			{
				href: '/blog/filler-seo-med-spas/',
				title: 'Filler SEO for Med Spas',
				description: 'How to explain filler services without flattening every concern into one page.',
				postId: 'filler-seo-med-spas',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Filler page structure',
				category: 'Injectables',
			},
			{
				href: '/blog/med-spa-service-page-seo/',
				title: 'Med Spa Service Page SEO',
				description: 'A broader editing guide for treatment pages that need to rank and convert.',
				postId: 'med-spa-service-page-seo',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Service page wireframe',
				category: 'Page structure',
			},
		],
	},
	templates: {
		seoTitle: 'Med Spa Marketing Templates & Checklists',
		seoDescription:
			'Practical planning templates for med spa SEO, Google Business Profile reviews, service pages, and consultation CTAs.',
		pageTitle: 'Med Spa Marketing Templates',
		kicker: 'Planning tools',
		summary:
			'Templates are useful when they make a team more specific. A good worksheet should expose missing decisions, not hide them behind polished formatting.',
		editorialNote:
			'These templates are planning aids for marketing and operations teams. They still need clinic-specific review, compliance input, and local adaptation.',
		scenariosTitle: 'Best uses for these templates',
		scenarios: [
			'Preparing a quarterly SEO or GBP review with a small team.',
			'Handing service-page briefs to writers, clinicians, or agency partners.',
			'Standardizing CTA and review-response language before a campaign launch.',
		],
		diagnosticsTitle: 'What a useful template should capture',
		diagnostics: [
			{
				label: 'Owner',
				body: 'Every checklist item should have a person responsible for updating or approving it.',
			},
			{
				label: 'Evidence',
				body: 'The worksheet should ask what source supports the decision: GBP, analytics, call logs, reviews, clinician input, or page audit.',
			},
			{
				label: 'Risk',
				body: 'Medical, advertising, privacy, and platform-policy risks should be visible before copy goes live.',
			},
			{
				label: 'Next action',
				body: 'A template that ends in notes is weaker than one that ends in assigned edits, review dates, or experiments.',
			},
		],
		workflowTitle: 'How to use the library',
		workflow: [
			'Pick one workflow rather than downloading everything.',
			'Fill the first pass with current reality, not aspirational answers.',
			'Flag any compliance-sensitive copy before it reaches a live page or profile.',
			'Review the template again after 30 days and record what changed.',
		],
		redFlagsTitle: 'Template traps',
		redFlags: [
			'Using a worksheet as proof that the work is complete.',
			'Copying sample CTA language across every treatment.',
			'Letting SEO fields override clinical or brand review.',
			'Keeping filled templates separate from actual page updates.',
		],
		cardsTitle: 'Template library',
		cardsIntro:
			'Each template is meant to create a specific decision, not just another document.',
		faqs: [
			{
				question: 'Are these legal or medical templates?',
				answer:
					'No. They are marketing planning tools. Any public-facing claim, review response, or service description should be reviewed through the clinic’s normal compliance process.',
			},
			{
				question: 'Should agencies use the same template for every clinic?',
				answer:
					'Use the structure consistently, but fill it with clinic-specific evidence. Otherwise the output will feel generic very quickly.',
			},
		],
		cards: [
			{
				href: '/templates/med-spa-seo-checklist/',
				title: 'Med Spa SEO Checklist Template',
				description: 'A recurring audit worksheet for local visibility and treatment-page quality.',
				fallbackImage: '/images/med-spa-seo-checklist-preview.svg',
				imageAlt: 'SEO checklist preview',
				category: 'Checklist',
			},
			{
				href: '/templates/consultation-cta-examples/',
				title: 'Consultation CTA Examples',
				description: 'CTA patterns for different levels of patient certainty and service complexity.',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'CTA planning preview',
				category: 'CTA',
			},
			{
				href: '/templates/med-spa-service-page-template/',
				title: 'Service Page Skeleton',
				description: 'A section-by-section treatment page brief for writers and reviewers.',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Service page skeleton preview',
				category: 'Brief',
			},
		],
	},
	'case-breakdowns': {
		seoTitle: 'Med Spa Marketing Breakdowns | Editorial Teardowns',
		seoDescription:
			'Editorial breakdowns for med spa marketing problems: traffic without consults, weak Maps visibility, and treatment-page trust gaps.',
		pageTitle: 'Med Spa Marketing Breakdowns',
		kicker: 'Editorial teardown format',
		summary:
			'Breakdowns are useful when they separate observation from interpretation. The goal is not to invent dramatic case studies, but to show how an editor or strategist would reason through a messy marketing problem.',
		editorialNote:
			'These are educational scenarios, not anonymized client results. No traffic figures, rankings, or conversion rates should be read as benchmarks.',
		scenariosTitle: 'What the breakdowns teach',
		scenarios: [
			'How to inspect a page before proposing a redesign.',
			'How to avoid blaming Google Maps when the issue is entity clarity or trust.',
			'How to turn a vague “not enough leads” complaint into testable hypotheses.',
		],
		diagnosticsTitle: 'Breakdown lens',
		diagnostics: [
			{
				label: 'Observation',
				body: 'What is visible on the page, profile, or path without guessing intent?',
			},
			{
				label: 'Likely friction',
				body: 'Where might a patient hesitate, lose trust, or choose a competitor?',
			},
			{
				label: 'Evidence needed',
				body: 'What data, screenshots, call notes, or review themes would confirm the hypothesis?',
			},
			{
				label: 'Small experiment',
				body: 'What change can be tested without rebuilding the entire site?',
			},
		],
		workflowTitle: 'How to read a teardown',
		workflow: [
			'Identify the problem statement and what is actually known.',
			'Separate copy issues, structure issues, tracking issues, and trust issues.',
			'Choose one or two edits that would change patient understanding quickly.',
			'Decide what metric or qualitative signal would make the edit worth keeping.',
		],
		redFlagsTitle: 'What weak case content does',
		redFlags: [
			'Claims results without showing method or context.',
			'Uses fake screenshots or fabricated clinic identities as proof.',
			'Confuses ranking, traffic, lead quality, and bookings.',
			'Prescribes a redesign when the issue may be copy, routing, or measurement.',
		],
		cardsTitle: 'Available breakdowns',
		cardsIntro:
			'Read these as reasoning examples, then adapt the inspection process to a real clinic.',
		faqs: [
			{
				question: 'Are these real client case studies?',
				answer:
					'No. They are editorial scenarios designed to teach diagnosis without implying confidential performance data.',
			},
			{
				question: 'Why avoid benchmark numbers?',
				answer:
					'Without a transparent data source and sampling method, benchmark numbers can mislead clinic owners. These breakdowns focus on inspection and decision quality instead.',
			},
		],
		cards: [
			{
				href: '/case-breakdowns/med-spa-website-conversion-breakdown/',
				title: 'Traffic Without Consultations',
				description: 'How to inspect a site path when visits do not become serious inquiries.',
				fallbackImage: '/images/med-spa-consultation-funnel.svg',
				imageAlt: 'Conversion teardown',
				category: 'Conversion',
			},
			{
				href: '/case-breakdowns/botox-service-page-breakdown/',
				title: 'Botox Service Page Trust Gaps',
				description: 'A section-level look at proof, expectations, and CTA placement.',
				fallbackImage: '/images/med-spa-service-page-wireframe.svg',
				imageAlt: 'Botox page teardown',
				category: 'Service page',
			},
			{
				href: '/case-breakdowns/google-maps-visibility-breakdown/',
				title: 'Weak Google Maps Visibility',
				description: 'A diagnosis path before assuming a penalty or algorithm problem.',
				fallbackImage: '/images/med-spa-google-maps-visibility.svg',
				imageAlt: 'Maps visibility teardown',
				category: 'Maps',
			},
		],
	},
	reports: {
		seoTitle: 'Med Spa Local Search Reports & Method Notes',
		seoDescription:
			'Method notes and report frameworks for med spa local visibility, reputation, service-page quality, and consultation conversion.',
		pageTitle: 'Med Spa Local Search Reports',
		kicker: 'Method notes',
		summary:
			'The report section is for slower, more careful thinking: definitions, worksheets, and methodology notes that help a clinic describe its local visibility before making big claims.',
		editorialNote:
			'Reports here are not market leaderboards. They should explain what is being measured, what is unknown, and what decisions the report can responsibly support.',
		scenariosTitle: 'Useful report situations',
		scenarios: [
			'A leadership team needs a shared definition of local search visibility.',
			'An agency wants a transparent framework before presenting recommendations.',
			'A clinic wants to track qualitative improvements without inventing benchmarks.',
		],
		diagnosticsTitle: 'Report quality checks',
		diagnostics: [
			{
				label: 'Definitions',
				body: 'Terms such as visibility, inquiry quality, booking value, and review quality should be defined before analysis starts.',
			},
			{
				label: 'Sources',
				body: 'A report should say whether it uses GBP data, analytics, call logs, surveys, manual review, or third-party research.',
			},
			{
				label: 'Limits',
				body: 'Sampling limits, missing data, and interpretation boundaries should be visible rather than buried.',
			},
			{
				label: 'Decisions',
				body: 'The report should support prioritization, not just produce a polished document.',
			},
		],
		workflowTitle: 'How to approach a report',
		workflow: [
			'Start with a question the clinic actually needs to answer.',
			'Define the data sources and what each source can and cannot prove.',
			'Separate observation, interpretation, and recommendation in the final notes.',
			'Schedule a follow-up review so the report becomes part of operations.',
		],
		redFlagsTitle: 'Report credibility risks',
		redFlags: [
			'Unsourced national averages presented as facts.',
			'Charts without definitions or sampling notes.',
			'Claims about rankings or revenue without access to the underlying data.',
			'Recommendations that do not connect back to observed evidence.',
		],
		cardsTitle: 'Current report notes',
		cardsIntro:
			'The first report is a framework for evaluating local visibility without pretending to have more data than the clinic actually has.',
		faqs: [
			{
				question: 'Do these reports include industry benchmarks?',
				answer:
					'Only when a source and methodology are clear. Otherwise the reports focus on repeatable definitions, worksheets, and internal trend analysis.',
			},
			{
				question: 'Can this replace analytics or call tracking?',
				answer:
					'No. It helps organize interpretation, but clinics still need reliable measurement for calls, forms, bookings, and lead quality.',
			},
		],
		cards: [
			{
				href: '/reports/med-spa-local-search-visibility-report/',
				title: 'Local Search Visibility Method Note',
				description: 'A worksheet-style framework for describing local exposure, trust, and inquiry paths.',
				fallbackImage: '/images/med-spa-local-search-system.svg',
				imageAlt: 'Local visibility report framework',
				category: 'Method note',
			},
		],
	},
};
