'use client';

import React from 'react';
import { Calculator, Zap } from 'lucide-react';
import { CardSpotlight } from './ui/CardSpotlight';
import { useLocale } from '@/context/LocaleContext';
import { useDeployment } from '@/context/DeploymentContext';

export const PricingBreakdownCard: React.FC = () => {
  const { t, locale } = useLocale();
  const { network } = useDeployment();
  const PLATFORM_TEST_FEE = 0.001;
  const NETWORK_ESTIMATE = 0.018;

  const isDevnet = network === 'devnet';
  const totalWithGas = PLATFORM_TEST_FEE + NETWORK_ESTIMATE;
  const platformFeeHint = locale === 'pt'
    ? 'Inclui 0,001 SOL de taxa de validação da plataforma.'
    : locale === 'es'
      ? 'Incluye 0,001 SOL de tarifa de validación de la plataforma.'
      : 'Includes a 0.001 SOL platform validation fee.';

  return (
    <CardSpotlight
      spotlightColor="rgba(0, 194, 255, 0.12)"
      className="app-card-static"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0a84ff]/15 border border-[#0a84ff]/25 text-[#64b5ff]">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-[-0.02em]">{t('costSummary')}</h2>
          <p className="text-xs text-neutral-400">
            {t('costHint')}
          </p>
        </div>
      </div>

      {/* Fee Items List */}
      <div className="space-y-2 pb-4 border-b border-white/[0.08]">
        <div className="cost-row flex items-center justify-between gap-3 text-sm py-1">
          <div className="flex min-w-0 items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_rgba(20,241,149,0.8)]" />
            <span className="text-neutral-300">{t('metadataInscription')}</span>
          </div>
          <span className="font-mono font-bold text-[#14F195] text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(20,241,149,0.2)]">
            FREE
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDevnet ? 'Devnet rent & gas (dev SOL)' : t('networkCost')}</span>
          </div>
          <span className="font-mono text-neutral-400">
            ~{NETWORK_ESTIMATE.toFixed(3)} SOL
          </span>
        </div>
      </div>

      {/* Aceternity Total Cost Box */}
      <div className="pt-4">
        <div className="flex items-center justify-between gap-3">

          <div className="relative z-10">
            <div className="text-xs font-medium text-neutral-400">
              {isDevnet
                ? locale === 'pt' ? 'Estimativa para Mainnet' : locale === 'es' ? 'Estimaci\u00f3n para Mainnet' : 'Mainnet estimate'
                : t('estimatedTotal')}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xl font-bold font-mono tracking-tight text-white">
              {totalWithGas.toFixed(3)} SOL
            </div>
          </div>
        </div>
        {!isDevnet && <p className="mt-1.5 text-[10px] text-neutral-500">{platformFeeHint}</p>}
      </div>
    </CardSpotlight>
  );
};
