'use client';

import React, { useState } from 'react';
import { CheckCircle2, Info, Lock, Shield, Snowflake, X } from 'lucide-react';
import { TokenFormData } from '@/types/token';
import { CardSpotlight } from './ui/CardSpotlight';
import { useLocale } from '@/context/LocaleContext';

interface SecurityOptionsCardProps {
  formData: TokenFormData;
  onChange: (field: keyof TokenFormData, value: boolean) => void;
  disabled?: boolean;
}

type OptionKey = 'mint' | 'freeze' | 'metadata';

export const SecurityOptionsCard: React.FC<SecurityOptionsCardProps> = ({ formData, onChange, disabled = false }) => {
  const [mobileInfo, setMobileInfo] = useState<OptionKey | null>(null);
  const { t } = useLocale();

  const options = [
    { key: 'mint' as const, field: 'revokeMint' as const, title: t('revokeMint'), fee: '+0.05 SOL', icon: Lock, active: formData.revokeMint, accent: 'purple' },
    { key: 'freeze' as const, field: 'revokeFreeze' as const, title: t('revokeFreeze'), fee: '+0.05 SOL', icon: Snowflake, active: formData.revokeFreeze, accent: 'cyan' },
    { key: 'metadata' as const, field: 'immutableMetadata' as const, title: t('immutableMetadata'), fee: 'FREE', icon: CheckCircle2, active: formData.immutableMetadata, accent: 'green' },
  ];

  const toggle = (field: keyof TokenFormData, current: boolean) => {
    if (!disabled) onChange(field, !current);
  };

  const openInfo = (event: React.MouseEvent, key: OptionKey) => {
    event.stopPropagation();
    if (window.matchMedia('(max-width: 767px)').matches) setMobileInfo(key);
  };

  return (
    <CardSpotlight className="app-card-static">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#30d158]/25 bg-[#30d158]/15 text-[#30d158]"><Shield className="h-4 w-4" /></div>
        <div><h2 className="text-base font-semibold tracking-[-0.02em] text-white sm:text-lg">{t('permissions')}</h2><p className="text-xs text-neutral-400">{t('permissionsHint')}</p></div>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const activeStyle = option.accent === 'green' ? 'border-emerald-500/60 bg-emerald-950/20' : option.accent === 'cyan' ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-purple-500/60 bg-purple-950/20';
          const iconStyle = option.accent === 'green' ? 'text-[#14F195]' : option.accent === 'cyan' ? 'text-cyan-400' : 'text-purple-400';
          return (
            <div key={option.key} onClick={() => toggle(option.field, option.active)} className={`flex min-h-[64px] cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${option.active ? activeStyle : 'border-white/[0.08] bg-white/[0.02]'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ${iconStyle}`}><Icon className="h-5 w-5" /></div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-white">{option.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${option.accent === 'green' ? 'border-emerald-500/40 bg-emerald-500/20 text-[#14F195]' : option.accent === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300' : 'border-purple-500/30 bg-purple-500/15 text-purple-300'}`}>{option.fee}</span>
                  {option.key === 'metadata' && <span className="text-[10px] text-neutral-400">{t('recommended')}</span>}
                  <div className="group relative hidden md:block">
                    <button type="button" aria-label={`Explain ${option.title}`} onClick={(event) => openInfo(event, option.key)} className="text-neutral-500 hover:text-white"><Info className="h-3.5 w-3.5" /></button>
                    <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-white/[0.12] bg-[#17191f] px-3 py-2 text-xs leading-5 text-neutral-200 shadow-xl group-hover:block">{option.key === 'mint' ? t('mintInfo') : option.key === 'freeze' ? t('freezeInfo') : t('metadataInfo')}</div>
                  </div>
                  <button type="button" aria-label={`Explain ${option.title}`} onClick={(event) => openInfo(event, option.key)} className="text-neutral-500 md:hidden"><Info className="h-4 w-4" /></button>
                </div>
              </div>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${option.active ? 'border-[#30d158] bg-[#30d158] text-black' : 'border-white/[0.22] bg-white/[0.03]'}`}>{option.active && <CheckCircle2 className="h-4 w-4" />}</div>
            </div>
          );
        })}
      </div>

      {mobileInfo && <div className="fixed inset-0 z-[60] flex items-end bg-black/60 p-4 md:hidden" onClick={() => setMobileInfo(null)}><div role="dialog" aria-modal="true" className="app-card w-full p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-semibold text-white">{t('permissionDetails')}</h3><p className="mt-2 text-sm leading-6 text-neutral-300">{mobileInfo === 'mint' ? t('mintInfo') : mobileInfo === 'freeze' ? t('freezeInfo') : t('metadataInfo')}</p></div><button type="button" aria-label={t('close')} onClick={() => setMobileInfo(null)} className="text-neutral-400"><X className="h-5 w-5" /></button></div></div></div>}
    </CardSpotlight>
  );
};
