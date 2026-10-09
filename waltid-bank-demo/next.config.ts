import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for deployment
  // output: 'export',
  // distDir: 'dist',

  // Environment variables that should be available at build time
  env: {
    PORT: process.env.PORT,
    WALTID_API_URL: process.env.WALTID_API_URL,
    WALTID_API_URL_PUBLIC: process.env.WALTID_API_URL_PUBLIC,
    WALTID_USERNAME: process.env.WALTID_USERNAME,
    WALTID_PASSWORD: process.env.WALTID_PASSWORD,
    WALTID_ISSUER_TARGET: process.env.WALTID_ISSUER_TARGET,
    WALTID_VERIFIER_TARGET: process.env.WALTID_VERIFIER_TARGET,
    ISSUER_KEY_ID: process.env.ISSUER_KEY_ID,
    ISSUER_X5C: process.env.ISSUER_X5C,
  },

  output: "standalone",
};

export default nextConfig;
