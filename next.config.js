/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // تعطيل ذاكرة التخزين المؤقت تمامًا لتجنب المشاكل
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
