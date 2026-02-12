/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false, // Don't auto-open browser
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize build performance
  swcMinify: true,
  // Disable during analysis to avoid EPERM errors
  eslint: {
    ignoreDuringBuilds: process.env.ANALYZE === 'true',
  },
  typescript: {
    ignoreBuildErrors: process.env.ANALYZE === 'true',
  },
}

export default withBundleAnalyzer(nextConfig);
