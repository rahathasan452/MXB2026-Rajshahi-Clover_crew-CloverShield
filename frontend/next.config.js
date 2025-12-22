const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ML_API_URL: process.env.NEXT_PUBLIC_ML_API_URL,
  },
  webpack: (config, { defaultLoaders }) => {
    // Ensure the root directory is resolved correctly
    const rootPath = path.resolve(__dirname)
    
    // Configure alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': rootPath,
    }
    
    // Also add to modules for better resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      rootPath,
      'node_modules',
    ]
    
    return config
  },
}

module.exports = nextConfig

