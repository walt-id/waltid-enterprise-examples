// Branding configuration for JPMorgan credential-based authentication demo

export const branding = {
  name: "JPMorgan",
  tagline: "Identity-Based Authentication",
  description: "Secure authentication using verifiable credentials for identity verification.",

  logo: "/JPMC_Logo.png",
  logoAlt: "JPMorgan",
  logoWidth: 160,
  logoHeight: 40,

  copyright: "JPMorgan",

  contact: {
    name: "JPMorgan Support",
  },

  metadata: {
    title: "JPMorgan - Identity-Based Authentication",
    description: "Secure authentication using verifiable credentials for identity verification.",
  },
};

export type Branding = typeof branding;
