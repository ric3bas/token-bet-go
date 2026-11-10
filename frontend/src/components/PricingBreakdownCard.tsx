'use client';

import React from 'react';
import { Calculator, Zap } from 'lucide-react';
import { CardSpotlight } from './ui/CardSpotlight';
import { useLocale } from '@/context/LocaleContext';
import { useDeployment } from '@/context/DeploymentContext';

interface PricingBreakdownProps {
  revokeMint: boolean;
  revokeFreeze: boolean;
}

export const PricingBreakdownCard: React.FC<PricingBreakdownProps> = ({
  revokeMint,
  revokeFreeze,
}) => {
  const { t } = useLocale();
  const { network } = useDeployment();
  const BASE_FEE = 0.03;
  const REVOKE_MINT_FEE = 0.05;
  const REVOKE_FREEZE_FEE = 0.05;
  const GAS_ESTIMATE = 0.005;

  const isDevnet = network === 'devnet';
  const totalServiceFee = isDevnet
    ? 0
    : BASE_FEE +
      (revokeMint ? REVOKE_MINT_FEE : 0) +
      (revokeFreeze ? REVOKE_FREEZE_FEE : 0);

  const totalWithGas = totalServiceFee + GAS_ESTIMATE;

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
            ~{GAS_ESTIMATE.toFixed(3)} SOL
          </span>
        </div>
      </div>

      {/* Aceternity Total Cost Box */}
      <div className="pt-4">
        <div className="flex items-center justify-between gap-3">

          <div className="relative z-10">
            <div className="text-xs font-medium text-neutral-400">{t('estimatedTotal')}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xl font-bold font-mono tracking-tight text-white">
              {totalWithGas.toFixed(3)} SOL
            </div>
          </div>
        </div>
        {isDevnet && (
          <a
            href="https://faucet.solana.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-[11px] font-medium text-[#64b5ff] hover:text-white"
          >
            Get dev SOL from Solana Faucet →
          </a>
        )}
      </div>
    </CardSpotlight>
  );
};
