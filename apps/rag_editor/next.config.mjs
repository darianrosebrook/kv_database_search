/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*",
      },
      {
        source: "/search",
        destination: "http://localhost:3002/search",
      },
      {
        source: "/chat",
        destination: "http://localhost:3002/chat",
      },
      {
        source: "/health",
        destination: "http://localhost:3002/health",
      },
    ];
  },
};

export default nextConfig;
