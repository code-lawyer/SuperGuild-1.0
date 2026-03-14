/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.img2ipfs.com",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "s2.loli.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Known react-hooks/rules-of-hooks ESLint plugin crash (a.getScope is not a function)
    // Re-enable after upgrading eslint-plugin-react-hooks
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: force HTTPS for 1 year (enable once confirmed HTTPS-only in production)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // CSP: block object/plugin injection and base-tag hijacking.
          // script-src allows 'unsafe-eval'/'unsafe-inline' required by wagmi/RainbowKit/Three.js.
          // connect-src: https:/wss: wildcard covers all RPC endpoints without enumeration.
          // Tighten connect-src to specific domains before mainnet.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Google Fonts CSS is loaded from googleapis.com
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://cdn.img2ipfs.com https://s2.loli.net https://*.supabase.co",
              "connect-src 'self' blob: https: wss:",
              // Material Symbols / Google Fonts files served from gstatic.com
              "font-src 'self' data: https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-src 'self' https://verify.walletconnect.com https://secure.walletconnect.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
