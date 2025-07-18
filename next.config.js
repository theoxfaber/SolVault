/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/webwallet' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/webwallet/' : '',
};

module.exports = nextConfig;
