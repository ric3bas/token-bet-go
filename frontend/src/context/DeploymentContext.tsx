'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TokenFormData } from '@/types/token';

export type DeploymentNetwork = 'devnet' | 'mainnet-beta';

type ValidatedTest = { wallet: string; fingerprint: string; mintAddress: string; txHash: string; validatedAt: string };
type DeploymentContextValue = {
  network: DeploymentNetwork;
  setNetwork: (network: DeploymentNetwork) => void;
  canDeployMainnet: (formData: TokenFormData, wallet?: string) => boolean;
  validatedTest: ValidatedTest | null;
  markDevnetValidated: (formData: TokenFormData, wallet: string, mintAddress: string, txHash: string) => void;
};

const DeploymentContext = createContext<DeploymentContextValue | undefined>(undefined);
const storageKey = 'tokenbet-validated-devnet-deployment';

export function tokenFingerprint(formData: TokenFormData) {
  return JSON.stringify({
    name: formData.name.trim(), symbol: formData.symbol.trim().toUpperCase(), decimals: Number(formData.decimals),
    supply: formData.supply.replace(/,/g, ''), description: formData.description.trim(),
    revokeMint: Boolean(formData.revokeMint), revokeFreeze: Boolean(formData.revokeFreeze), immutableMetadata: Boolean(formData.immutableMetadata),
  });
}

export function DeploymentProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<DeploymentNetwork>('devnet');
  const [validatedTest, setValidatedTest] = useState<ValidatedTest | null>(null);
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) { try { setValidatedTest(JSON.parse(stored)); } catch { window.localStorage.removeItem(storageKey); } }
  }, []);
  const markDevnetValidated = useCallback((formData: TokenFormData, wallet: string, mintAddress: string, txHash: string) => {
    const next = { wallet, fingerprint: tokenFingerprint(formData), mintAddress, txHash, validatedAt: new Date().toISOString() };
    setValidatedTest(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }, []);
  const value = useMemo(() => ({ network, setNetwork, validatedTest, markDevnetValidated, canDeployMainnet: (formData: TokenFormData, wallet?: string) => Boolean(wallet && validatedTest && validatedTest.wallet === wallet && validatedTest.fingerprint === tokenFingerprint(formData)) }), [network, validatedTest, markDevnetValidated]);
  return <DeploymentContext.Provider value={value}>{children}</DeploymentContext.Provider>;
}

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (!context) throw new Error('useDeployment deve ser usado dentro de DeploymentProvider');
  return context;
}
