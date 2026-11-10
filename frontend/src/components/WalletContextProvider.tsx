'use client';

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { DeploymentProvider, useDeployment } from '@/context/DeploymentContext';

interface Props {
  children: ReactNode;
}

const WalletProviders: FC<Props> = ({ children }) => {
  const { network: selectedNetwork } = useDeployment();
  const network = selectedNetwork === 'devnet' ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    return selectedNetwork === 'devnet'
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network)
      : process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // Wallet Standard detecta automaticamente Phantom, Solflare, Backpack e todas as extensões instaladas
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ThemeProvider><LocaleProvider><AuthProvider>{children}</AuthProvider></LocaleProvider></ThemeProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const WalletContextProvider: FC<Props> = ({ children }) => <DeploymentProvider><WalletProviders>{children}</WalletProviders></DeploymentProvider>;
