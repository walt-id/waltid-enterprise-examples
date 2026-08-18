// Branding configuration for Acme credential-based authentication demo

export const branding = {
  name: "Acme",
  tagline: "Identity-Based Authentication",
  description: "Secure authentication using verifiable credentials for identity verification.",

  logo: "/acme-logo.png",
  logoAlt: "Acme",
  logoWidth: 160,
  logoHeight: 40,

  copyright: "Acme",

  contact: {
    name: "Acme Support",
  },

  metadata: {
    title: "Acme - Identity-Based Authentication",
    description: "Secure authentication using verifiable credentials for identity verification.",
  },
};

export type Branding = typeof branding;
