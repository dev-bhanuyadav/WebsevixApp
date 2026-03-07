/** @type {import('next').NextConfig} */
const nextConfig = {
  // VPS / self-hosted: single Node process, no serverless limit
  output: "standalone",
};

module.exports = nextConfig;
