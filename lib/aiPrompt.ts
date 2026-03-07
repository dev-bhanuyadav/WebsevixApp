// ══════════════════════════════════════════════════════════════════
// VIX — Websevix AI Project Consultant
// Deep knowledge base + context-aware response engine
// ══════════════════════════════════════════════════════════════════

export interface AIResponse {
  message: string;
  collectedData: {
    projectType?: string | null;
    description?: string | null;
    features?: string[];
    designStyle?: string | null;
    budget?: string | null;
    timeline?: string | null;
    references?: string[];
  };
  showChips?: string[] | null;
  showCheckboxes?: string[] | null;
  currentStep?: string;
  isComplete?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT CATEGORY SYSTEM
// ─────────────────────────────────────────────────────────────────

export type ProjectCategory =
  | "educational" | "ecommerce" | "restaurant" | "medical"
  | "portfolio"   | "real_estate" | "saas"   | "business"
  | "blog"        | "ngo"        | "event"   | "travel"
  | "fitness"     | "finance"    | "matrimony" | "other";

// Keywords per category (more → higher confidence)
const KEYWORDS: Record<ProjectCategory, string[]> = {
  educational: [
    "school","college","university","institute","academy","coaching","tuition",
    "course","learn","student","teacher","faculty","class","lecture","exam","quiz",
    "assignment","education","e-learning","elearning","lms","curriculum","batch",
    "degree","diploma","certificate","test","study","knowledge","training","edtech",
    "online class","homework","grades","attendance","fee","timetable","scholarship",
  ],
  ecommerce: [
    "shop","store","sell","selling","product","buy","buying","cart","checkout",
    "order","catalogue","inventory","ecommerce","e-commerce","marketplace","retail",
    "purchase","item","listing","vendor","wholesale","delivery","shipping","cod",
    "discount","coupon","wishlist","returns","refund","stock","sku","dropship",
  ],
  restaurant: [
    "restaurant","cafe","coffee","food","menu","recipe","hotel","canteen","tiffin",
    "catering","bakery","dhaba","bar","pub","pizza","biryani","delivery","dine",
    "eat","table","reservation","cloud kitchen","swiggy","zomato","kitchen","chef",
  ],
  medical: [
    "hospital","clinic","doctor","medical","health","patient","appointment","medicine",
    "pharmacy","diagnostic","lab","report","prescription","nursing","dental","eye",
    "ayurveda","healthcare","therapy","physiotherapy","mental","counselling","telemedicine",
    "blood","x-ray","scan","surgery","specialist","opd","ward","icu",
  ],
  portfolio: [
    "portfolio","resume","personal","freelance","showcase","cv","hire","designer",
    "developer","artist","photographer","writer","illustrator","model","creative",
    "work samples","my work","personal brand","about me","freelancer",
  ],
  real_estate: [
    "property","real estate","house","flat","apartment","plot","villa","office",
    "commercial","residential","rent","buy house","pg","hostel","bhk","builder",
    "broker","agent","realty","land","sqft","project","society","floor plan",
  ],
  saas: [
    "saas","software","platform","tool","dashboard","crm","erp","hrm","automation",
    "workflow","management system","tracking","subscription","b2b","api","enterprise",
    "startup","webapp","web app","system","portal","admin panel","cloud","multi-tenant",
  ],
  business: [
    "business","company","agency","corporate","firm","service","consultancy","brand",
    "professional","office","manufacturing","supplier","import","export","logistics",
    "transport","security","digital agency","it company","solutions","infrastructure",
  ],
  blog: [
    "blog","article","news","magazine","journal","media","publishing","content",
    "write","newsletter","editorial","post","author","journalism","storytelling","viral",
  ],
  ngo: [
    "ngo","charity","nonprofit","non-profit","trust","foundation","donate","donation",
    "social work","volunteer","cause","fundraising","welfare","helpline","80g",
  ],
  event: [
    "event","wedding","party","conference","seminar","concert","festival","expo",
    "meetup","ticket","booking","registration","venue","celebration","anniversary",
    "ceremony","invitation","rsvp","attendee","speaker","sponsor",
  ],
  travel: [
    "travel","tour","trip","tourism","holiday","vacation","hotel booking","flights",
    "adventure","trekking","backpacking","travel agency","pilgrimage","visa","itinerary",
    "destination","resort","cruise","safari","package tour",
  ],
  fitness: [
    "gym","fitness","yoga","workout","exercise","diet","nutrition","health club",
    "trainer","sports","cricket","football","wellness","meditation","transformation",
    "weight loss","muscle","crossfit","zumba","aerobics","personal trainer",
  ],
  finance: [
    "finance","loan","insurance","investment","mutual fund","stock","trading","bank",
    "fintech","wallet","upi","payment","accounting","tax","gst","ca","audit","wealth",
    "credit","debit","emi","financial planning",
  ],
  matrimony: [
    "matrimony","marriage","wedding","shaadi","bride","groom","rishta","match",
    "matrimonial","spouse","alliance","shaadi.com","jeevansathi",
  ],
  other: [],
};

// ─────────────────────────────────────────────────────────────────
// FEATURE DATABASE — domain-specific, curated
// ─────────────────────────────────────────────────────────────────

export const FEATURES: Record<ProjectCategory, string[]> = {
  educational: [
    "Student Login & Profiles",
    "Course / Subject Management",
    "Quiz, Tests & Assignments",
    "Progress & Grade Tracker",
    "Video Lessons (YouTube / Upload)",
    "Certificate Generation",
    "Teacher / Instructor Dashboard",
    "Discussion Forum / Doubt Section",
    "Attendance Management",
    "Notice Board & Announcements",
    "Fee Management & Receipts",
    "Parent Login & Reports",
    "Live Class Links (Zoom / Meet)",
    "Study Material Downloads",
    "Student Batch & Schedule Management",
    "Admission / Enrollment Form",
  ],
  ecommerce: [
    "Product Catalog & Search",
    "Shopping Cart & Checkout",
    "Razorpay / UPI / COD Payment",
    "Order Tracking & History",
    "Customer Accounts & Wishlist",
    "Admin Product Management",
    "Inventory & Stock Alerts",
    "Discount Codes & Offers",
    "Product Reviews & Ratings",
    "GST Invoice Generation",
    "Email / WhatsApp Order Updates",
    "Return & Refund System",
    "Related / Recommended Products",
    "Bulk / Wholesale Pricing",
    "Multi-category Navigation",
  ],
  restaurant: [
    "Online Menu with Photos & Prices",
    "Online Food Ordering",
    "Table Booking / Reservation",
    "Razorpay / UPI / COD Payment",
    "Order Tracking",
    "WhatsApp Order Integration",
    "Customer Reviews & Ratings",
    "QR Code Menu (No-contact)",
    "Admin Order Dashboard",
    "Menu / Pricing Management",
    "Home Delivery Zone Setup",
    "Loyalty / Points Program",
    "Special Offers & Combos",
  ],
  medical: [
    "Doctor Profiles & Specializations",
    "Online Appointment Booking",
    "Patient Login & Portal",
    "Medical Records & Reports",
    "Prescription Management",
    "WhatsApp Appointment Reminders",
    "Online Consultation / Telemedicine",
    "Admin / Reception Dashboard",
    "Lab Reports Download",
    "Insurance Info",
    "Emergency Contact & Helpline",
    "Blog / Health Articles",
    "Ambulance / Emergency Services",
  ],
  portfolio: [
    "Portfolio / Work Gallery",
    "About Me & Bio",
    "Contact Form & Social Links",
    "Testimonials from Clients",
    "Blog / Case Studies",
    "SEO Optimization",
    "Resume / CV Download",
    "Project Showcase with Details",
    "Skills & Experience Timeline",
    "Dark / Light Mode Toggle",
    "Hire Me / Enquiry CTA",
    "Awards & Certifications",
  ],
  real_estate: [
    "Property Listings with Photos & Price",
    "Search & Filter (Location / Type / Budget)",
    "Property Detail Page & Gallery",
    "360° Virtual Tour",
    "Contact Agent / Enquiry Form",
    "WhatsApp Chat Button",
    "EMI Calculator",
    "Property Comparison",
    "Map Integration",
    "Lead & Enquiry Management",
    "Featured & Exclusive Properties",
    "Home Loan Assistance Info",
    "Builder / Project Profile",
  ],
  saas: [
    "User Registration & Login",
    "Subscription Plans & Billing",
    "Main Dashboard & Analytics",
    "Admin Super Panel",
    "Role-based Access Control",
    "API Integration Support",
    "Email & In-app Notifications",
    "Multi-tenant Architecture",
    "Data Export (CSV / Excel / PDF)",
    "Audit Logs & Activity Tracking",
    "Two-factor Authentication",
    "Payment Gateway (Razorpay)",
    "Customer Support / Ticket System",
    "Usage Limits & Quota Management",
  ],
  business: [
    "About Company & Team",
    "Services / Products Page",
    "Contact Form & Google Maps",
    "WhatsApp Chat Button",
    "Testimonials & Client Logos",
    "Blog / News Section",
    "SEO Optimization",
    "Photo / Video Gallery",
    "Lead Generation Form",
    "Social Media Integration",
    "Careers / Job Listings",
    "Live Chat Widget",
    "Case Studies / Portfolio",
  ],
  blog: [
    "Article & Post Management",
    "Categories, Tags & Search",
    "Comment System",
    "Newsletter Subscription",
    "Social Sharing Buttons",
    "SEO & Meta Management",
    "Author Profiles",
    "Related Posts",
    "Admin CMS Panel",
    "Ad Banner Integration",
    "RSS Feed",
    "Dark Mode Support",
  ],
  ngo: [
    "Cause / Mission & Vision Page",
    "Online Donation (Razorpay)",
    "Donation Campaigns & Goals",
    "Volunteer Registration",
    "Impact Stories & Blog",
    "Transparency Reports",
    "Gallery & Events",
    "Helpline / Contact",
    "Newsletter",
    "WhatsApp Updates",
    "80G Tax Certificate",
    "Social Media Integration",
  ],
  event: [
    "Event Details & Schedule",
    "Online Ticket Booking",
    "Razorpay / UPI Payment",
    "Attendee Registration Form",
    "QR Code Entry Pass",
    "Speaker / Performer Profiles",
    "Photo Gallery & Highlights",
    "Countdown Timer",
    "Venue Map & Directions",
    "Sponsor Showcase",
    "WhatsApp & Email Invites",
    "Admin Attendee Management",
  ],
  travel: [
    "Tour Package Listings",
    "Online Booking & Payment",
    "Itinerary Builder",
    "Photo Gallery",
    "Customer Reviews & Ratings",
    "WhatsApp Enquiry Button",
    "Blog / Travel Tips",
    "Custom Trip Request Form",
    "Visa & Travel Guide Info",
    "Map Integration",
    "Admin Booking Management",
    "Seasonal Offers & Banners",
  ],
  fitness: [
    "Membership Plans & Online Enrollment",
    "Online Payment (Razorpay)",
    "Class Schedule & Timetable",
    "Trainer Profiles",
    "Transformation Gallery",
    "Diet & Nutrition Blog",
    "Member Login & Progress Tracker",
    "Attendance System",
    "WhatsApp Group Updates",
    "Video Workout Library",
    "BMI & Calorie Calculator",
    "Supplement / Product Store",
  ],
  finance: [
    "Service & Product Listings",
    "Lead / Inquiry Form",
    "EMI & Loan Calculator",
    "Client Login Portal",
    "Document Upload & Management",
    "Blog / Financial Tips",
    "WhatsApp Consultation",
    "Appointment Booking",
    "Testimonials",
    "Security & Trust Badges",
    "GST & Tax Info Pages",
  ],
  matrimony: [
    "Profile Registration",
    "Profile Search & Filters",
    "Photo Gallery per Profile",
    "Match Suggestions (AI)",
    "Kundli / Horoscope Matching",
    "Privacy Controls",
    "Premium Membership Plans",
    "Messaging / Interest System",
    "Admin Panel",
    "WhatsApp / Phone Connect (Premium)",
    "Success Stories",
  ],
  other: [
    "User Login & Registration",
    "Admin Dashboard",
    "Contact Form",
    "Photo / Video Gallery",
    "SEO Optimization",
    "WhatsApp Integration",
    "Mobile Responsive Design",
    "Blog / News Section",
    "Analytics & Reports",
    "Payment Gateway",
    "Search & Filter",
    "Email Notifications",
  ],
};

// ─────────────────────────────────────────────────────────────────
// DESIGN STYLES per category
// ─────────────────────────────────────────────────────────────────

export const DESIGNS: Record<ProjectCategory, string[]> = {
  educational: ["🎓 Clean & Academic", "🌈 Colorful & Student-Friendly", "💡 Modern & Minimal", "🎮 Fun & Interactive"],
  ecommerce:   ["🛍️ E-commerce Premium", "⚡ Bold & High-Conversion", "🎨 Minimal & Elegant", "🌟 Trendy & Youth"],
  restaurant:  ["🍽️ Elegant & Appetizing", "🔥 Bold & Vibrant", "🌿 Natural & Organic", "🎨 Modern & Minimal"],
  medical:     ["🏥 Clean & Professional", "💙 Calm & Trustworthy", "🌿 Wellness & Natural", "⚡ Modern Tech"],
  portfolio:   ["✨ Creative & Unique", "🖤 Dark & Sleek", "🎨 Minimal & White Space", "💫 Bold & Colorful"],
  real_estate: ["🏠 Premium & Luxurious", "💼 Corporate & Trusted", "🌿 Modern & Clean", "🔵 Bold & Professional"],
  saas:        ["💻 Tech / Startup", "⚡ Clean & Functional", "🌙 Dark Mode Premium", "🎯 Conversion-Focused"],
  business:    ["💼 Corporate & Professional", "🌟 Bold & Modern", "🎨 Creative Agency", "🌿 Clean & Minimal"],
  blog:        ["📰 Editorial & Clean", "🎨 Creative & Visual", "⚡ Fast & Minimal", "🌈 Colorful & Engaging"],
  ngo:         ["💚 Warm & Trustworthy", "🌟 Inspiring & Bold", "🕊️ Clean & Minimal", "🌈 Hopeful & Optimistic"],
  event:       ["🎉 Festive & Vibrant", "🖤 Dark & Premium", "✨ Elegant & Luxurious", "🌈 Energetic & Colorful"],
  travel:      ["✈️ Adventurous & Vibrant", "🌿 Natural & Fresh", "🌙 Exotic & Dark", "☀️ Bright & Tropical"],
  fitness:     ["💪 Bold & Energetic", "⚡ Dark & Intense", "🌿 Health & Wellness", "🔵 Clean & Modern"],
  finance:     ["💼 Professional & Trustworthy", "🔵 Clean & Corporate", "⚡ Modern & Minimal", "🌿 Calm & Reliable"],
  matrimony:   ["❤️ Warm & Romantic", "🌸 Elegant & Traditional", "✨ Modern & Premium", "🌺 Colorful & Festive"],
  other:       ["🎨 Modern & Minimal", "🌟 Bold & Colorful", "💼 Corporate / Professional", "💻 Tech / Startup"],
};

// ─────────────────────────────────────────────────────────────────
// CATEGORY DETECTION
// ─────────────────────────────────────────────────────────────────

export function detectCategory(text: string): ProjectCategory {
  const lower = text.toLowerCase();
  let best: ProjectCategory = "other";
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(KEYWORDS) as [ProjectCategory, string[]][]) {
    const score = kws.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────
// CONTEXT EXTRACTION — understands what user said
// ─────────────────────────────────────────────────────────────────

interface DescriptionContext {
  audience: string;      // "students", "customers", "patients", etc.
  purpose: string;       // "learn coding", "sell products", etc.
  scale: string;         // "small", "large"
  hasWho: boolean;
  hasWhat: boolean;
}

export function extractContext(desc: string, projectType?: string | null): DescriptionContext {
  const lower = desc.toLowerCase();

  // Audience detection
  const audienceMap: [string, string][] = [
    ["student",   "students"],
    ["learner",   "learners"],
    ["customer",  "customers"],
    ["patient",   "patients"],
    ["client",    "clients"],
    ["visitor",   "visitors"],
    ["user",      "users"],
    ["member",    "members"],
    ["employee",  "employees"],
    ["teacher",   "teachers"],
    ["doctor",    "doctors"],
    ["buyer",     "buyers"],
    ["seller",    "sellers"],
    ["traveller", "travellers"],
    ["children",  "children"],
    ["kid",       "kids"],
    ["parent",    "parents"],
    ["athlete",   "athletes"],
  ];

  let audience = "";
  for (const [singular, plural] of audienceMap) {
    if (lower.includes(singular)) { audience = plural; break; }
  }

  // Purpose extraction (simple keyword match)
  const purposeMap: [string, string][] = [
    ["learn",     "learning and education"],
    ["sell",      "selling products / services"],
    ["book",      "booking and reservations"],
    ["order",     "ordering online"],
    ["course",    "online courses"],
    ["appointment", "booking appointments"],
    ["donate",    "donation and fundraising"],
    ["hire",      "showcasing work and getting hired"],
    ["blog",      "publishing content"],
    ["track",     "tracking and management"],
    ["connect",   "connecting people"],
    ["manage",    "management and operations"],
    ["quiz",      "quizzes and assessments"],
    ["ticket",    "ticket booking"],
    ["register",  "registration and enrollment"],
  ];

  let purpose = "";
  for (const [kw, label] of purposeMap) {
    if (lower.includes(kw)) { purpose = label; break; }
  }

  // Scale
  const scale = (lower.includes("large") || lower.includes("enterprise") || lower.includes("many") || lower.includes("thousands"))
    ? "large" : "small";

  return {
    audience,
    purpose,
    scale,
    hasWho:  !!audience || lower.includes(" for ") || lower.includes(" who "),
    hasWhat: desc.length > 30,
  };
}

// ─────────────────────────────────────────────────────────────────
// BUDGET ADVICE
// ─────────────────────────────────────────────────────────────────

export function getBudgetAdvice(budget: string, category: ProjectCategory): string {
  const b = budget.toLowerCase();
  const label = CATEGORY_LABELS[category] ?? "website";
  if (b.includes("75,000") || b.includes("75k") || b.includes("+")) {
    return `Premium budget! 🚀 We can build a world-class ${label} with everything you need — custom design, all features, and top performance.`;
  }
  if (b.includes("35,000") || b.includes("35k")) {
    return `Solid budget! ✅ Enough for a complete, feature-rich ${label} with great design and smooth user experience.`;
  }
  if (b.includes("15,000") || b.includes("15k")) {
    return `Good range! 👍 We'll build a solid ${label} with the core features you need. We'll prioritize smartly.`;
  }
  return `That works for a clean, focused version! 💡 We'll build the most important features first — you can scale up later as you grow.`;
}

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  educational: "educational platform",
  ecommerce:   "online store",
  restaurant:  "restaurant website",
  medical:     "healthcare platform",
  portfolio:   "portfolio site",
  real_estate: "real estate platform",
  saas:        "web application",
  business:    "business website",
  blog:        "blog / content site",
  ngo:         "NGO website",
  event:       "event website",
  travel:      "travel platform",
  fitness:     "fitness website",
  finance:     "finance website",
  matrimony:   "matrimony portal",
  other:       "website",
};

// ─────────────────────────────────────────────────────────────────
// CLAUDE SYSTEM PROMPT (used when API key is set)
// ─────────────────────────────────────────────────────────────────

export const VIX_SYSTEM_PROMPT = `You are Vix, an expert and friendly project consultant for Websevix — a premium web development company in India. Your role is to help non-technical clients define their project through a smart, warm, natural conversation.

CORE BEHAVIOR:
- Think like a senior project manager + domain expert
- ALWAYS analyze what the user is actually saying — don't give generic answers
- If user described their project, reference specific details they mentioned
- Each response must feel PERSONALIZED to what this specific user said
- Never ask a question they already answered
- Keep messages SHORT (2-4 sentences) — no long paragraphs

DOMAIN INTELLIGENCE — suggest ONLY relevant features:
- Educational (school/coaching/course/lms) → student login, courses, quiz, attendance, certificates, fees, progress, notice board
- E-commerce (shop/sell/store/products) → product catalog, cart, payment, order tracking, inventory, reviews
- Restaurant (food/cafe/menu) → online menu, ordering, table booking, QR menu, WhatsApp orders
- Medical (hospital/clinic/doctor) → appointments, doctor profiles, patient portal, records, telemedicine
- Real Estate (property/house/flat) → listings, search/filter, EMI calculator, map, lead management
- SaaS/Web App (platform/tool/dashboard) → user auth, subscription, dashboard, admin panel, API
- Business (company/agency/services) → about, services, contact, WhatsApp, testimonials, SEO
- NEVER mix features across domains (no "blog" for fitness, no "cart" for education unless specifically asked)

CONVERSATION STEPS (in order):
1. Project type (show quick-reply chips with 12 categories)
2. Description — acknowledge specifically what they said, don't ask generic "who will use it" if they already told you
3. Features — show ONLY relevant checkboxes (8-10 max, domain-specific)
4. Design style — show 4 relevant options
5. Budget — give honest, specific advice for their project type
6. Timeline — show 4 chips
7. References — optional, show "Skip" option
8. Summary — show complete brief, ask to confirm

RESPONSE FORMAT — return ONLY valid JSON:
{
  "message": "Personalized, specific message based on what user actually said",
  "collectedData": {
    "projectType": "extracted type or null",
    "description": "their description or null",
    "features": ["selected features"] or [],
    "designStyle": "style or null",
    "budget": "budget or null",
    "timeline": "timeline or null",
    "references": [] or ["links"]
  },
  "showChips": ["option1"] or null,
  "showCheckboxes": ["feature1", "feature2"] or null,
  "currentStep": "project_type|description|features|design|budget|timeline|references|summary",
  "isComplete": false
}

CRITICAL: Return ONLY the JSON. Zero extra text. Zero markdown.`;

// ─────────────────────────────────────────────────────────────────
// OPENING MESSAGE
// ─────────────────────────────────────────────────────────────────

export const OPENING_MESSAGE: AIResponse = {
  message: "Hey! I'm Vix, your project consultant 👋\n\nI'll help you plan your project — takes just 3-5 minutes. Let's figure out exactly what you need!\n\nWhat kind of project are you building?",
  collectedData: {},
  showChips: [
    "📚 Educational / Coaching",
    "🛍️ Online Store / E-commerce",
    "🍽️ Restaurant / Food",
    "🏥 Medical / Healthcare",
    "🏢 Business Website",
    "💻 Web App / SaaS",
    "🌍 Portfolio / Personal",
    "🏠 Real Estate",
    "✈️ Travel / Tourism",
    "💪 Fitness / Gym",
    "🎉 Event / Wedding",
    "📰 Blog / Content",
  ],
  currentStep: "project_type",
  isComplete: false,
};
