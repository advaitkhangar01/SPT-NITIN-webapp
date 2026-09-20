/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "puppeteer", "@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
