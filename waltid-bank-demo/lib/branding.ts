// Branding configuration for the bank demo
// Edit these values to customize the demo for different banks

export const branding = {
  // Bank name and identity
  name: "Demo Bank",
  tagline: "Your Digital Bank",
  description: "Banking with trust and innovation. Open an account, apply for loans, and more.",
  
  // Logo configuration
  logo: "/bank-logo.svg",
  logoAlt: "Demo Bank",
  logoWidth: 200,
  logoHeight: 56,
  
  // Footer content
  copyright: "Demo Bank",
  
  // Contact information
  contact: {
    name: "Demo Bank",
  },
  
  // Page metadata
  metadata: {
    title: "Demo Bank - Your Digital Bank",
    description: "Banking with trust and innovation. Open an account, apply for loans, and more.",
  },
};

export type Branding = typeof branding;
