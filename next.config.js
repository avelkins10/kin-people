const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Resolve SignNow SDK v3 subpaths directly for Vercel compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      '@signnow/api-client-v3/dist/core/index': path.resolve(__dirname, 'vendor/signnow-sdk-v3/dist/core/index.js'),
      '@signnow/api-client-v3/dist/api/template/index': path.resolve(__dirname, 'vendor/signnow-sdk-v3/dist/api/template/index.js'),
      '@signnow/api-client-v3/dist/api/document/index': path.resolve(__dirname, 'vendor/signnow-sdk-v3/dist/api/document/index.js'),
      '@signnow/api-client-v3/dist/api/documentInvite/index': path.resolve(__dirname, 'vendor/signnow-sdk-v3/dist/api/documentInvite/index.js'),
    };
    return config;
  },
}

module.exports = nextConfig
