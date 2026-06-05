// Branding configuration for the government services portal.
// All customer-specific values live here; the UI components read from this
// object and from the CSS variables in globals.css — nothing else should be
// hardcoded in component files.

export const branding = {
  // ── Identity ──────────────────────────────────────────────────────────────
  name: "DigiGovSA",

  // ── Header / logo ─────────────────────────────────────────────────────────
  logo: "/digigov-logo.png",
  logoAlt: "DigiGovSA",
  logoWidth: 160,
  logoHeight: 40,

  // ── Hero section ──────────────────────────────────────────────────────────
  // heroImage is the primary background; heroFallbackImage is shown while it
  // loads or if the primary format is unsupported.
  heroImage: "/hero-bg.jpg",
  heroFallbackImage: "/hero-bg.svg",

  // Optional decorative element rendered on the right-hand side of the hero.
  // Set to null/undefined to disable.
  heroDecoration: "/hero-flag.svg",

  // Short pill-badge text displayed above the headline.
  heroBadge: "Trusted credential issuance",

  // Main headline — two lines; the second renders in the accent colour.
  tagline: "Issue with Confidence.",
  headlineAccent: "Verify with Trust.",

  // Subheading beneath the headline.
  description: "Enabling secure verifiable and trusted credentials issuance across government.",

  // ── Action cards (hero) ───────────────────────────────────────────────────
  issueCard: {
    description: "Generate and manage your digital credentials securely.",
    buttonLabel: "Get Started",
  },
  verifyCard: {
    description: "Securely verify credentials to confirm your identity.",
    buttonLabel: "Verify Now",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  copyright: "Republic of South Africa",

  contact: {
    name: "DigiGovSA Support",
  },

  // ── <head> metadata ───────────────────────────────────────────────────────
  metadata: {
    title: "DigiGovSA - Issue with Confidence, Verify with Trust",
    description: "Enabling secure verifiable and trusted credentials issuance across government.",
  },
};

export type Branding = typeof branding;
