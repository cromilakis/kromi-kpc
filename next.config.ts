import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Wiring next-intl (overlay kromi single-locale): la request config vive en
// i18n/request.ts y sirve messages/es.json a los server components.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
