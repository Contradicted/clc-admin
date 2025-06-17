/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
      {
        hostname: "4bi0b9l01c.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
