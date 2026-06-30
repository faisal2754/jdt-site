// Load env BEFORE importing anything that touches lib/db. The neon() client
// runs at module-load time and reads process.env.DATABASE_URL, so .env.local
// must be populated first (Phase 1 confirmed this ordering quirk).
//
// ESM hoists `import` statements above any top-level code, so the trick is to
// (a) load .env.local with an explicit config() call here, and (b) import
// anything that touches lib/db LAZILY via dynamic import() inside seed(), which
// runs well after this config() has populated process.env. The static imports
// below are either pure data (creators/projects/services) or type-only, so they
// never trigger the neon() client at module-load time.
import { config } from 'dotenv'
import { resolve } from 'node:path'

const envResult = config({ path: resolve(process.cwd(), '.env.local') })
if (envResult.error) {
  console.error('Failed to load .env.local:', envResult.error)
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing after loading .env.local')
  process.exit(1)
}

// Type-only import: erased at compile time, so it does NOT run lib/db's
// module side-effects (the neon() client). The schema module itself is pure
// table defs, but importing the types keeps the runtime import lazy below.
import type {
  NewBrand,
  NewCreator,
  NewProject,
  NewServiceCategory,
} from '../lib/db/schema'

// Pure data (no lib/db side-effects), so a normal static import is safe here.
import { seedBrands } from '../lib/data/brands'

// ---------------------------------------------------------------------------
// Source-of-truth seed data.
//
// The public site now reads everything from the database via lib/queries/*; the
// raw arrays below are the parity data that seeds those tables. They use the
// original public-site shapes (note `image`, which maps to the schema's
// `imageUrl` in the row builders further down).
// ---------------------------------------------------------------------------

type CreatorSeed = {
  slug: string
  name: string
  category: string
  location: string
  image: string
  bio: string[]
  stats: { value: string; label: string }[]
  socials: { label: string; href: string; handle?: string }[]
}

type ProjectSeed = {
  slug: string
  title: string
  client: string
  category: string
  industry: string
  year: string
  image: string
  summary: string
}

type ServiceSeed = {
  slug: string
  label: string
  tagline: string
  description: string
  image: string
  services: {
    name: string
    description: string
    audience?: 'brands' | 'influencers'
  }[]
}

const creatorData: CreatorSeed[] = [
  {
    slug: "marcus-cole",
    name: "Marcus Cole",
    category: "Athletes",
    location: "Johannesburg, ZA",
    image: "/images/creators/marcus.png",
    bio: [
      "Marcus Cole is a professional footballer turned content creator whose energy on and off the pitch has built a loyal following across the continent. Known for his matchday vlogs and training breakdowns, he brings authenticity to every brand he works with.",
      "As part of the JDT roster, Marcus partners with sportswear, nutrition and lifestyle brands, blending elite athleticism with relatable storytelling that resonates with a young, active audience.",
    ],
    stats: [
      { value: "1.8M", label: "Instagram" },
      { value: "2.4M", label: "TikTok" },
      { value: "640K", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "elena-frost",
    name: "Elena Frost",
    category: "Long Form",
    location: "Cape Town, ZA",
    image: "/images/creators/elena.png",
    bio: [
      "Elena Frost is a lifestyle and travel creator whose cinematic vlogs and honest reviews have made her one of the most trusted voices in her niche. Her audience tunes in for genuine recommendations and beautifully shot stories.",
      "With JDT, Elena collaborates with travel, tech and lifestyle brands, delivering polished campaigns that feel personal rather than promotional.",
    ],
    stats: [
      { value: "920K", label: "Instagram" },
      { value: "1.5M", label: "TikTok" },
      { value: "410K", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "dineo-mokoena",
    name: "Dineo Mokoena",
    category: "Models",
    location: "Durban, ZA",
    image: "/images/creators/dineo.png",
    bio: [
      "Dineo Mokoena is a fashion model and creative whose striking presence has graced campaigns for some of the region's boldest brands. Her eye for styling and confident delivery make her a natural fit for fashion and beauty partnerships.",
      "Through JDT, Dineo works with fashion houses, beauty labels and editorial teams, bringing both runway polish and digital-native content skills to every shoot.",
    ],
    stats: [
      { value: "740K", label: "Instagram" },
      { value: "510K", label: "TikTok" },
      { value: "180K", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "jay-rivers",
    name: "Jay Rivers",
    category: "Streamers",
    location: "Pretoria, ZA",
    image: "/images/creators/jay.png",
    bio: [
      "Jay Rivers is a gaming streamer and personality whose high-energy broadcasts and community-first approach have grown a dedicated fanbase. From live tournaments to reaction content, Jay keeps audiences engaged for hours.",
      "As a JDT creator, Jay partners with gaming, tech and energy brands, offering authentic integrations that land with a hard-to-reach Gen Z audience.",
    ],
    stats: [
      { value: "560K", label: "Twitch" },
      { value: "1.1M", label: "TikTok" },
      { value: "880K", label: "YouTube" },
    ],
    socials: [
      { label: "Twitch", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "tariq-bello",
    name: "Tariq Bello",
    category: "Athletes",
    location: "Lagos, NG",
    image: "/images/creators/tariq.png",
    bio: [
      "Tariq Bello is a football freestyler whose jaw-dropping skills have earned him viral fame and collaborations with major sports brands. His content blends technical mastery with infectious charisma.",
      "With JDT, Tariq creates branded skill content, appears at activations and headlines campaigns that demand real athletic credibility.",
    ],
    stats: [
      { value: "2.1M", label: "Instagram" },
      { value: "3.6M", label: "TikTok" },
      { value: "1.2M", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "sofia-vance",
    name: "Sofia Vance",
    category: "Short Form",
    location: "Cape Town, ZA",
    image: "/images/creators/sofia.png",
    bio: [
      "Sofia Vance is a beauty and lifestyle influencer known for her warm, approachable content and trusted product reviews. Her followers rely on her honest takes across skincare, fashion and wellness.",
      "Through JDT, Sofia leads beauty launches, runs long-term ambassador deals and produces UGC that consistently outperforms for brand partners.",
    ],
    stats: [
      { value: "1.3M", label: "Instagram" },
      { value: "990K", label: "TikTok" },
      { value: "320K", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "kai-mensah",
    name: "Kai Mensah",
    category: "Photographers",
    location: "Accra, GH",
    image: "/images/creators/kai.png",
    bio: [
      "Kai Mensah is a photographer and visual storyteller whose distinctive style has defined campaigns for fashion, music and lifestyle brands. Behind the lens or in front of it, Kai shapes culture.",
      "As part of the JDT roster, Kai directs shoots, produces branded photo series and mentors emerging creators across the network.",
    ],
    stats: [
      { value: "480K", label: "Instagram" },
      { value: "260K", label: "TikTok" },
      { value: "95K", label: "Behance" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "Behance", href: "#" },
    ],
  },
  {
    slug: "amara-johnson",
    name: "Amara Johnson",
    category: "Hosts",
    location: "Johannesburg, ZA",
    image: "/images/creators/amara.png",
    bio: [
      "Amara Johnson is a television and event host whose confident delivery and quick wit make her a favourite for live broadcasts, brand events and red carpets. She commands a room and a camera with ease.",
      "With JDT, Amara fronts brand campaigns, hosts activations and lends her trusted voice to partnerships across entertainment and lifestyle.",
    ],
    stats: [
      { value: "650K", label: "Instagram" },
      { value: "430K", label: "TikTok" },
      { value: "210K", label: "YouTube" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "leo-hart",
    name: "Leo Hart",
    category: "Videographers",
    location: "Cape Town, ZA",
    image: "/images/creators/leo.png",
    bio: [
      "Leo Hart is a videographer and director whose cinematic eye has shaped commercials, music videos and brand films across the continent. He turns briefs into stories that move, with a craft honed on set after set.",
      "As part of the JDT roster, Leo leads end-to-end production, from concept and shoot to the final grade, delivering broadcast-quality films for brands that want to be remembered.",
    ],
    stats: [
      { value: "120+", label: "Productions" },
      { value: "38", label: "Brand Films" },
      { value: "9", label: "Awards" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Vimeo", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  {
    slug: "nadia-khan",
    name: "Nadia Khan",
    category: "Animators",
    location: "Durban, ZA",
    image: "/images/creators/nadia.png",
    bio: [
      "Nadia Khan is a motion designer and animator who brings brands to life through 2D and 3D animation, title sequences and explainer content. Her work balances technical polish with a real sense of play.",
      "Through JDT, Nadia produces motion graphics for campaigns, social and broadcast, translating complex ideas into frames that feel effortless.",
    ],
    stats: [
      { value: "260+", label: "Projects" },
      { value: "45", label: "Brands" },
      { value: "12", label: "Years" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Behance", href: "#" },
      { label: "Dribbble", href: "#" },
    ],
  },
  {
    slug: "theo-banks",
    name: "Theo Banks",
    category: "Illustrators",
    location: "Johannesburg, ZA",
    image: "/images/creators/theo.png",
    bio: [
      "Theo Banks is an illustrator and digital artist whose bold, characterful style has defined packaging, editorial and campaign work for culture-forward brands. Every piece carries a distinct point of view.",
      "With JDT, Theo creates custom illustration systems, key art and brand worlds that give partners an instantly recognisable visual identity.",
    ],
    stats: [
      { value: "300+", label: "Commissions" },
      { value: "60", label: "Brands" },
      { value: "150K", label: "Behance" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Behance", href: "#" },
      { label: "Dribbble", href: "#" },
    ],
  },
  {
    slug: "maya-lindt",
    name: "Maya Lindt",
    category: "Copywriters",
    location: "Cape Town, ZA",
    image: "/images/creators/maya.png",
    bio: [
      "Maya Lindt is a copywriter and brand strategist who turns positioning into language people actually remember. From taglines to long-form campaigns, she finds the line that makes a brand click.",
      "As part of the JDT roster, Maya shapes brand voice, writes launch campaigns and crafts the words behind activations, scripts and social.",
    ],
    stats: [
      { value: "200+", label: "Campaigns" },
      { value: "70", label: "Brands" },
      { value: "11", label: "Years" },
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
      { label: "Portfolio", href: "#" },
    ],
  },
]

const projectData: ProjectSeed[] = [
  {
    slug: "campaign-print-suite",
    title: "Campaign Print Suite",
    client: "Meridian Group",
    category: "Printing & Design",
    industry: "Retail",
    year: "2024",
    image: "/images/work-print-1.png",
    summary: "A full print campaign spanning flyers, brochures and in-store collateral for a national retail launch.",
  },
  {
    slug: "studio-talent-shoot",
    title: "Studio Talent Shoot",
    client: "NovaTech",
    category: "Influencer Marketing",
    industry: "Technology",
    year: "2024",
    image: "/images/work-talent-1.png",
    summary: "Casting, direction and production for a flagship brand campaign featuring our managed talent roster.",
  },
  {
    slug: "ecommerce-platform",
    title: "E-Commerce Platform",
    client: "Apex Retail",
    category: "Software Development",
    industry: "E-commerce",
    year: "2025",
    image: "/images/work-ai-1.png",
    summary: "A custom storefront with AI-powered product recommendations and a headless content backend.",
  },
  {
    slug: "retail-packaging-line",
    title: "Retail Packaging Line",
    client: "Lumière Beauty",
    category: "Printing & Design",
    industry: "Beauty",
    year: "2024",
    image: "/images/work-print-2.png",
    summary: "End-to-end packaging design and production for a premium beauty product range.",
  },
  {
    slug: "live-brand-activation",
    title: "Live Brand Activation",
    client: "Pulse Fitness",
    category: "Influencer Marketing",
    industry: "Fitness",
    year: "2025",
    image: "/images/work-talent-2.png",
    summary: "Brand ambassadors and event talent for a high-energy nationwide activation tour.",
  },
  {
    slug: "customer-mobile-app",
    title: "Customer Mobile App",
    client: "Orion Logistics",
    category: "Software Development",
    industry: "Logistics",
    year: "2025",
    image: "/images/work-ai-2.png",
    summary: "A cross-platform mobile app with real-time tracking and an AI support assistant.",
  },
  {
    slug: "editorial-magazine",
    title: "Editorial Magazine",
    client: "Vanguard Media",
    category: "Printing & Design",
    industry: "Publishing",
    year: "2023",
    image: "/images/work-print-3.png",
    summary: "Art direction, layout and print production for a quarterly premium editorial title.",
  },
  {
    slug: "tv-commercial-production",
    title: "TV Commercial Production",
    client: "Solstice Hotels",
    category: "Influencer Marketing",
    industry: "Hospitality",
    year: "2024",
    image: "/images/work-talent-3.png",
    summary: "Talent casting and on-set management for a national television commercial campaign.",
  },
  {
    slug: "analytics-dashboard",
    title: "Analytics Dashboard",
    client: "Bluepeak Finance",
    category: "Software Development",
    industry: "Finance",
    year: "2025",
    image: "/images/work-ai-3.png",
    summary: "A real-time analytics dashboard with predictive AI insights for financial decision-making.",
  },
]

const serviceData: ServiceSeed[] = [
  {
    slug: "printing-and-design",
    label: "Design, Print & Media",
    tagline: "From concept to print-ready, we make your brand impossible to ignore.",
    description:
      "The greatest brands deserve flawless execution. From a single brochure to complete brand deployments, we manage the process from concept to completion, where every asset is pixel perfect.",
    image: "/images/showcase-print.png",
    services: [
      { name: "Brand Identity & Logo Design", description: "Logos, guidelines and full identity systems" },
      { name: "Litho & Large Format Printing", description: "Posters, banners and signage" },
      { name: "Videography, Photography, Animation & Post-Production", description: "Directing, sound, VFX and storytelling" },
      { name: "Bespoke Apparel & Merchandise", description: "Pattern engineering, custom garments and countless branding methods" },
      { name: "Social Media & Digital Design", description: "End-to-end social: 2D, 3D, motion graphics, posting and copy" },
      { name: "Bespoke Packaging, Labels & Stickers", description: "Boxes, bags, cartons and stickers" },
      { name: "Brochures, Catalogues & Publications", description: "Leaflets, magazines, menus and catalogues" },
      { name: "Custom Corporate Gifts", description: "Branded gifts and boxes that don't end up in a drawer" },
      { name: "Event Branding & Activations", description: "Shop-fits, exhibitions and activations" },
      { name: "Laser Cutting & Engraving", description: "Cutting, engraving and marking in steel, brass, acrylic and wood" },
      { name: "Vehicle Branding", description: "Luxury Vehicle PPF, Custom Wraps and Decals" },
      { name: "Luxury Print & Finishing", description: "Foiling, embossing, debossing, finishes that leave an impression" },
    ],
  },
  {
    slug: "influencer-marketing",
    label: "Influencer Marketing",
    tagline: "The right faces and voices for your brand, managed end to end.",
    description:
      "We represent and manage a roster of creators, models, athletes and presenters, and we match them to brands that fit. We handle contracts, logistics and campaign delivery so all collaborations run smoothly.",
    image: "/images/showcase-talent.png",
    services: [
      // For Brands
      { name: "Influencer Marketing", description: "We brief, coordinate and negotiate, so you don't have to", audience: "brands" },
      { name: "Model & Talent Booking", description: "Models, presenters and actors for any brief", audience: "brands" },
      { name: "UGC Content", description: "Concept, caption, post", audience: "brands" },
      { name: "Campaign Planning", description: "Audience analysis and brand matching", audience: "brands" },
      { name: "Statistic Reporting", description: "Impressions to conversions, receipts included", audience: "brands" },
      // For Influencers
      { name: "Negotiations & Sourcing", description: "We find the right brands and negotiate the deal for you", audience: "influencers" },
      { name: "Invoicing & Payments", description: "Invoices sent, payments chased, you get paid", audience: "influencers" },
      { name: "Scheduling & Logistics", description: "Managing of shoots, deadlines and travel", audience: "influencers" },
      { name: "Talent Development", description: "Coaching and growth for talent on the up", audience: "influencers" },
      { name: "Contract Management", description: "NDAs, contracts, compliance, all the dull stuff", audience: "influencers" },
    ],
  },
  {
    slug: "software-development",
    label: "Software Development",
    tagline: "Modern builds and workflows that outpace your competitors.",
    description:
      "We build digital products that run modern brands, websites, apps, custom software and AI. We design around real people, and keep everything secure, stable and online long after launch.",
    image: "/images/showcase-ai.png",
    services: [
      { name: "Web Design & Development", description: "Fast, good-looking websites built to convert" },
      { name: "E-commerce Stores", description: "Online shops that are easy to run and built to scale" },
      { name: "Mobile Apps", description: "iOS and Android apps your customers love" },
      { name: "AI Development & Chatbots", description: "Customer support that never sleeps" },
      { name: "AI Automation & Consulting", description: "Workflows that save you hours every week" },
      { name: "AI Image & Video Generation", description: "On-brand visuals at the speed of AI" },
      { name: "Web3 & Blockchain", description: "Smart contracts, audits, dApps and token launches" },
      { name: "Custom Software", description: "Tools built for you, and only you" },
      { name: "SEO & Analytics", description: "Get found, then measure what matters" },
      { name: "Hosting & Maintenance", description: "Kept fast, secure and online" },
    ],
  },
]

async function seed() {
  // Lazy imports: env is guaranteed loaded by the time these run.
  const { db } = await import('../lib/db')
  const { brands, creators, projects, serviceCategories } = await import(
    '../lib/db/schema'
  )

  // ---------------------------------------------------------------------------
  // Map the static public-site arrays to DB rows. The public types use `image`;
  // the schema uses `image_url` (imageUrl). bio/stats/socials/services copy
  // as-is into jsonb. sort_order = array index. (No FKs between these tables.)
  // ---------------------------------------------------------------------------

  const creatorRows: NewCreator[] = creatorData.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    category: c.category,
    location: c.location,
    imageUrl: c.image,
    bio: c.bio,
    stats: c.stats,
    socials: c.socials,
    sortOrder: i,
    published: true,
  }))

  const projectRows: NewProject[] = projectData.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    client: p.client,
    category: p.category,
    industry: p.industry,
    year: p.year,
    imageUrl: p.image,
    summary: p.summary,
    featured: i < 3, // first 3 by array order
    sortOrder: i,
    published: true,
  }))

  const serviceRows: NewServiceCategory[] = serviceData.map((s, i) => ({
    // static string `id` is intentionally dropped; the uuid default replaces it
    slug: s.slug,
    label: s.label,
    tagline: s.tagline,
    description: s.description,
    imageUrl: s.image,
    services: s.services,
    sortOrder: i,
  }))

  const brandRows: NewBrand[] = seedBrands.map((b, i) => ({
    name: b.name,
    logoUrl: b.logoUrl,
    sortOrder: i,
  }))

  // ---------------------------------------------------------------------------
  // Idempotent: delete-all-then-insert per table, so re-running is safe.
  // ---------------------------------------------------------------------------
  await db.delete(creators)
  await db.delete(projects)
  await db.delete(serviceCategories)
  await db.delete(brands)

  const insertedCreators = await db
    .insert(creators)
    .values(creatorRows)
    .returning({ id: creators.id })
  const insertedProjects = await db
    .insert(projects)
    .values(projectRows)
    .returning({ id: projects.id })
  const insertedServices = await db
    .insert(serviceCategories)
    .values(serviceRows)
    .returning({ id: serviceCategories.id })
  const insertedBrands = await db
    .insert(brands)
    .values(brandRows)
    .returning({ id: brands.id })

  console.log('Seed complete. Inserted rows:')
  console.log(`  creators:           ${insertedCreators.length} (source ${creatorData.length})`)
  console.log(`  projects:           ${insertedProjects.length} (source ${projectData.length})`)
  console.log(`  service_categories: ${insertedServices.length} (source ${serviceData.length})`)
  console.log(`  brands:             ${insertedBrands.length} (source ${seedBrands.length})`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
