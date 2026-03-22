/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["localhost", "*.localhost", "127.0.0.1"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
