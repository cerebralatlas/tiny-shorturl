/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  // External packages for server components
  serverExternalPackages: ['@vercel/kv'],
  
  // Optimize for production builds
  compress: true,
  
  // Enable strict mode for better error catching
  reactStrictMode: true,
  
  // Optimize images (not needed for this project but good practice)
  images: {
    domains: [],
  },
  
  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      // Add any permanent redirects here if needed
    ];
  },
};

module.exports = nextConfig; 