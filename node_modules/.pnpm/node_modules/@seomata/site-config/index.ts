export const sites = {
  massageGrowth: {
    id: "massage-growth",
    name: "Massage Business Growth",
    domain: "https://massage-growth.pages.dev",
    niche: "Massage Business Marketing",
    description:
      "SEO, Google Maps, and booking growth resources for massage clinics.",
    primaryColor: "#0B3A53",
    accentColor: "#2F80ED",
    targetServiceUrl: "https://www.seomata.com/massage-seo-services",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/blog" },
      { label: "About", href: "/about" }
    ]
  },
  medspaGuide: {
    id: "medspa-guide",
    name: "Med Spa Marketing Guide",
    domain: "https://medspa-guide.pages.dev",
    niche: "Med Spa Marketing",
    description:
      "SEO, local search, and patient acquisition resources for med spas and aesthetic clinics.",
    primaryColor: "#213A5C",
    accentColor: "#D74F45",
    targetServiceUrl: "https://www.seomata.com/med-spa-seo-services",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/blog" },
      { label: "About", href: "/about" }
    ]
  },
  dentalVisibility: {
    id: "dental-visibility",
    name: "Dental Visibility Guide",
    domain: "https://dental-visibility.pages.dev",
    niche: "Dental SEO and Local Marketing",
    description:
      "SEO, Google Maps, and patient growth resources for dental practices.",
    primaryColor: "#174A7C",
    accentColor: "#2FA7B3",
    targetServiceUrl: "https://www.seomata.com/dental-seo-services",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/blog" },
      { label: "About", href: "/about" }
    ]
  },
  chiropractorMarketing: {
    id: "chiropractor-marketing",
    name: "Chiropractor Marketing Hub",
    domain: "https://chiropractor-marketing.pages.dev",
    niche: "Chiropractor Marketing",
    description:
      "Local SEO, website conversion, and patient acquisition resources for chiropractors.",
    primaryColor: "#1E4D3A",
    accentColor: "#E08A3E",
    targetServiceUrl: "https://www.seomata.com/chiropractor-seo-services",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/blog" },
      { label: "About", href: "/about" }
    ]
  },
  localServiceGrowth: {
    id: "local-service-growth",
    name: "Local Service Growth",
    domain: "https://local-service-growth.pages.dev",
    niche: "Local Service Business Growth",
    description:
      "SEO, Google Business Profile, and lead generation resources for local service businesses.",
    primaryColor: "#1F2937",
    accentColor: "#2563EB",
    targetServiceUrl: "https://www.seomata.com/local-seo-services",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Guides", href: "/blog" },
      { label: "About", href: "/about" }
    ]
  }
} as const;

export type SiteKey = keyof typeof sites;
export type SiteConfig = (typeof sites)[SiteKey];
