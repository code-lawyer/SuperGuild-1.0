'use client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi'
import { config } from './config';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

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

export default function Web3Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#137fec',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
          showRecentTransactions={true}
        >
          <SyncProfileWrapper>
            {children}
          </SyncProfileWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
