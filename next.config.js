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
  // تجاهل أخطاء ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },
  // تجاهل أخطاء TypeScript أثناء البناء
  typescript: {
    ignoreBuildErrors: true,
  },
  // تكوين الصفحات الثابتة
  output: 'export', // تم إعادة تفعيله لإنشاء موقع ثابت
  // تكوين المسارات الديناميكية
  trailingSlash: true,
  // تكوين الصور
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
