/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public buckets
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Mixkit hero videos referenced in ASF_LAUNCH_PRD.md
      {
        protocol: "https",
        hostname: "assets.mixkit.co",
      },
    ],
  },
};

export default nextConfig;
