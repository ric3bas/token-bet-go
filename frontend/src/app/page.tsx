'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { TokenCreatorForm } from '@/components/TokenCreatorForm';
import { AuthModal } from '@/components/AuthModal';
import { useLocale } from '@/context/LocaleContext';

export default function HomePage() {
  const { t } = useLocale();
  return (
    <div className="app-shell">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <section className="py-5 lg:py-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              {t('deployment')}
            </div>
            <h1 className="mt-3 text-3xl leading-[1.1] font-semibold tracking-[-0.05em] text-white sm:text-[42px]">
              {t('heading')}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-neutral-400">
              {t('intro')}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-[#30d158]" />
              {t('walletSigns')}
            </div>
          </div>

          <section aria-label="Token creation form" className="form-container min-w-0 mt-5">
            <TokenCreatorForm />
          </section>
        </section>
      </main>
      <AuthModal />
    </div>
  );
}
