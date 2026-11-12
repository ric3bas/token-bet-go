'use client';

import React from 'react';
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
            <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.05em] text-white sm:text-[42px]">
              {t('heading')}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-neutral-400">
              {t('intro')}
            </p>
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
