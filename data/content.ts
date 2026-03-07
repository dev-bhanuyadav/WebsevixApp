export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
] as const;

export const heroContent = {
  badge: "Professional Web Development",
  headline: "Chat With Us. We Build Your Web.",
  subheadline:
    "Share your idea over live chat. We understand what you need, build your website, and deliver. No runaround — just a clear conversation and a site you'll love.",
  ctaPrimary: "Chat with us",
  ctaSecondary: "How it works",
} as const;

export const howItWorksSteps = [
  {
    number: 1,
    title: "Share Your Idea",
    description: "Tell us what you need over live chat. We listen and understand your vision.",
    icon: "MessageSquare",
  },
  {
    number: 2,
    title: "Align & Confirm",
    description: "We share a clear plan. When you're ready, we confirm next steps. No surprises.",
    icon: "Handshake",
  },
  {
    number: 3,
    title: "We Build, You Stay in the Loop",
    description: "We build your site. You get updates over chat and your site delivered. Just us.",
    icon: "Wrench",
  },
] as const;

export const categories = [
  { id: "web-dev", title: "Web Development", icon: "Globe" },
  { id: "ui-ux", title: "UI/UX Design", icon: "Palette" },
  { id: "ecommerce", title: "E-commerce", icon: "ShoppingCart" },
  { id: "saas", title: "SaaS Development", icon: "Layers" },
  { id: "mobile", title: "Mobile Apps", icon: "Smartphone" },
  { id: "api", title: "API & Integrations", icon: "Plug" },
] as const;

export const whyChooseUsFeatures = [
  { title: "Razorpay Payments", description: "Pay securely with UPI, card, or net banking.", icon: "CreditCard" },
  { title: "Live Chat", description: "Chat with us in real time. Share files, get updates.", icon: "MessageSquare" },
  { title: "We Build for You", description: "We take your order and build your website ourselves.", icon: "Wrench" },
  { title: "Clear Deliverables", description: "Agreed scope and phases. You know what you're getting.", icon: "FileCheck" },
  { title: "Support When You Need", description: "Reach out on live chat. We're here to help.", icon: "Headphones" },
] as const;

export const ctaContent = {
  headline: "Let's build your web. Chat with us.",
  subheadline: "Share your idea on live chat. We'll understand what you need and build your site. No pressure.",
  buttonText: "Chat with us",
} as const;

export const footerLinks = {
  product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Services", href: "#services" },
    { label: "Pricing", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
  social: [
    { label: "Twitter", href: "#", icon: "Twitter" },
    { label: "LinkedIn", href: "#", icon: "Linkedin" },
    { label: "GitHub", href: "#", icon: "Github" },
  ],
} as const;
