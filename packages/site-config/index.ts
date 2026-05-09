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
  },
  usIncomeGuide: {
    id: "us-income-guide",
    name: "美国赚钱指南",
    domain: "https://us-income-guide.pages.dev",
    niche: "美国收入机会与副业指南",
    description:
      "面向在美国生活、工作、创业和寻找副业机会的人群，提供合法、现实、可执行的赚钱路径、线上收入、本地服务和防骗指南。",
    primaryColor: "#1F2937",
    accentColor: "#2563EB",
    targetServiceUrl: "",
    navigation: [
      { label: "赚钱路径", href: "/earning-paths/" },
      { label: "副业项目", href: "/side-projects/" },
      { label: "线上收入", href: "/online-income/" },
      { label: "本地服务", href: "/local-services/" },
      { label: "找工作", href: "/jobs/" },
      { label: "实用指南", href: "/guides/" },
      { label: "关于", href: "/about/" }
    ]
  }
} as const;

export type SiteKey = keyof typeof sites;
export type SiteConfig = (typeof sites)[SiteKey];
