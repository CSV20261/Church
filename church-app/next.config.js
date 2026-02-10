/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// PWA configuration - uncomment when @ducanh2912/next-pwa is installed
// const withPWA = require('@ducanh2912/next-pwa').default({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
//   skipWaiting: true,
// });
// module.exports = withPWA(nextConfig);

module.exports = nextConfig;
