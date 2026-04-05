/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["localhost", "*.localhost", "127.0.0.1"],
  transpilePackages: [
    "@aws-amplify/ui-react-liveness",
    "@aws-amplify/ui",
    "@aws-amplify/ui-react",
    "aws-amplify",
    "@tensorflow/tfjs-backend-cpu",
    "@tensorflow/tfjs-backend-wasm",
    "@tensorflow/tfjs-converter",
    "@tensorflow/tfjs-core",
    "@mediapipe/face_detection",
  ],
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
