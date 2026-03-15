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
    // eslint-config-next@15.0.0-rc.0 bundles a canary eslint-plugin-react-hooks
    // that crashes with "a.getScope is not a function" on ESLint 9.x.
    // The rule is overridden to "warn" in .eslintrc.json so it won't block CI.
    // Fix: upgrade eslint-config-next to 15.x stable when available.
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Google Fonts CSS is loaded from googleapis.com
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://cdn.img2ipfs.com https://s2.loli.net https://*.supabase.co",
              // connect-src: explicit whitelist for all known external services.
              // Supabase (REST + Realtime WS), Alchemy RPC/NFT, WalletConnect signaling,
              // Arbitrum + Ethereum public RPCs, sm.ms image upload API.
              [
                "connect-src",
                "'self'",
                "blob:",
                // Supabase REST + Realtime WebSocket
                "https://*.supabase.co",
                "wss://*.supabase.co",
                // Alchemy RPC + NFT API
                "https://*.g.alchemy.com",
                "wss://*.g.alchemy.com",
                "https://*.alchemyapi.io",
                // WalletConnect signaling + verify
                "https://*.walletconnect.com",
                "wss://*.walletconnect.com",
                "https://*.walletconnect.org",
                "wss://*.walletconnect.org",
                // Arbitrum public RPCs
                "https://sepolia-rollup.arbitrum.io",
                "https://arb1.arbitrum.io",
                // Ethereum / Sepolia public RPCs
                "https://rpc.sepolia.org",
                "https://ethereum.publicnode.com",
                // Infura (used by some wallet providers internally)
                "https://*.infura.io",
                "wss://*.infura.io",
                // sm.ms image upload API
                "https://sm.ms",
                // Google Fonts
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
              ].join(' '),
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
