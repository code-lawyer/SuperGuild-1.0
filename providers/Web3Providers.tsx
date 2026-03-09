'use client';
import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi'
import { config } from './config';
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { AuthProvider } from './AuthProvider';
import { useSyncProfile } from '@/hooks/useSyncProfile';
import ProfileGateModal from '@/components/ui/ProfileGateModal';

const queryClient = new QueryClient();

// Internal wrapper that uses the hook inside WagmiProvider context
function SyncProfileWrapper({ children }: { children: ReactNode }) {
  useSyncProfile();
  return (
    <>
      <ProfileGateModal />
      {children}
    </>
  );
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches || document.documentElement.classList.contains('dark'));
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDark;
}

const themeConfig = {
  accentColor: '#137fec',
  accentColorForeground: 'white',
  borderRadius: 'large' as const,
  fontStack: 'system' as const,
  overlayBlur: 'small' as const,
};

export default function Web3Providers({ children }: { children: ReactNode }) {
  const isDark = useIsDarkMode();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDark ? darkTheme(themeConfig) : lightTheme(themeConfig)}
          modalSize="compact"
          showRecentTransactions={true}
        >
          <AuthProvider>
            <SyncProfileWrapper>
              {children}
            </SyncProfileWrapper>
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
