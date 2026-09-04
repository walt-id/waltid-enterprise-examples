import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    WALTID_API_URL: process.env.WALTID_API_URL,
    WALTID_USERNAME: process.env.WALTID_USERNAME,
    WALTID_PASSWORD: process.env.WALTID_PASSWORD,
    WALTID_API_URL_PUBLIC: process.env.WALTID_API_URL_PUBLIC,
    WALTID_ORGANIZATION: process.env.WALTID_ORGANIZATION,
    GOV_ISSUER_TENANT: process.env.GOV_ISSUER_TENANT,
    GOV_ISSUER_NAME: process.env.GOV_ISSUER_NAME,
    TAX_TENANT: process.env.TAX_TENANT,
    TAX_ISSUER_NAME: process.env.TAX_ISSUER_NAME,
    TAX_VERIFIER_TARGET: process.env.TAX_VERIFIER_TARGET,
  },
  output: "standalone",
};

export default nextConfig;
