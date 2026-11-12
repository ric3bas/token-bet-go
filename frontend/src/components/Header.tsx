'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, ChevronDown, Coins, Copy, LogOut, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeployment } from '@/context/DeploymentContext';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const Header: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { locale, setLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { network } = useDeployment();
  const networkLabel = network === 'mainnet-beta' ? 'Mainnet' : 'Devnet';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const closeMenusOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!languageMenuRef.current?.contains(target)) setLanguageMenuOpen(false);
      if (!walletMenuRef.current?.contains(target)) setWalletMenuOpen(false);
    };

    document.addEventListener('mousedown', closeMenusOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeMenusOnOutsideClick);
  }, []);

  const copyAddress = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="app-nav sticky top-0 z-50 w-full border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#7d6bff] to-[#0a84ff] shadow-[0_6px_18px_rgba(10,132,255,0.28)]">
            <Coins className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">{t('appName')}</span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-neutral-300">{networkLabel}</span>
            </div>
            <p className="hidden sm:block text-[11px] text-neutral-500">{t('tagline')}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div ref={languageMenuRef} className="relative hidden sm:block">
            <button type="button" onClick={() => { setLanguageMenuOpen((open) => !open); setWalletMenuOpen(false); }} aria-label="Selecionar idioma" aria-expanded={languageMenuOpen} className="app-select flex items-center gap-1.5">{locale.toUpperCase()}<ChevronDown className="h-3.5 w-3.5" /></button>
            {languageMenuOpen && <div className="app-language-menu absolute right-0 top-[44px] z-[60] w-32 p-1">
              {([['pt', 'Português'], ['es', 'Español'], ['en', 'English']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setLocale(value); setLanguageMenuOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${locale === value ? 'bg-[#0a84ff] text-white' : 'text-neutral-300 hover:bg-white/[0.08]'}`}>{label}</button>)}
            </div>}
          </div>
          <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} className="app-icon-button">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-400"><ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" /><span>{t('selfCustody')}</span></div>
          {mounted ? connected && publicKey ? (
            <div ref={walletMenuRef} className="relative">
              <button type="button" onClick={() => setWalletMenuOpen((open) => !open)} className="wallet-adapter-button flex items-center gap-2"><span>{`${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`}</span><ChevronDown className="h-3.5 w-3.5" /></button>
              {walletMenuOpen && <div className="absolute right-0 top-[46px] z-[60] w-44 overflow-hidden rounded-xl border border-white/[0.12] bg-[#2b2c31] p-1 shadow-xl">
                <button type="button" onClick={copyAddress} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white hover:bg-white/[0.08]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? t('copied') : t('copyAddress')}</button>
                <button type="button" onClick={() => { setWalletMenuOpen(false); setVisible(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white hover:bg-white/[0.08]"><Coins className="h-3.5 w-3.5" />{t('changeWallet')}</button>
                <button type="button" onClick={() => { setWalletMenuOpen(false); disconnect(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white hover:bg-white/[0.08]"><LogOut className="h-3.5 w-3.5" />{t('disconnect')}</button>
              </div>}
            </div>
          ) : <WalletMultiButton /> : <div className="h-[38px] w-28 bg-white/[0.07] rounded-xl" />}
        </div>
      </div>
    </header>
  );
};
