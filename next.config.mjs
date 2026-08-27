/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@ant-design/pro-components'],
};

export default nextConfig;
