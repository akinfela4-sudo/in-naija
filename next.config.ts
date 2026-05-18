import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/elections",
        destination: "/",
        permanent: true,
      },
      {
        source: "/polls",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
