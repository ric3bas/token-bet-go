'use client';

import React from 'react';
import { TokenFormData } from '@/types/token';
import { FileUpload } from './FileUpload';
import { Sparkles, Sliders } from 'lucide-react';
import { CardSpotlight } from './ui/CardSpotlight';
import { AceternityInput } from './ui/AceternityInput';
import { useLocale } from '@/context/LocaleContext';

interface TokenDetailsCardProps {
  formData: TokenFormData;
  onChange: (field: keyof TokenFormData, value: any) => void;
  disabled?: boolean;
}

export const TokenDetailsCard: React.FC<TokenDetailsCardProps> = ({
  formData,
  onChange,
  disabled = false,
}) => {
  const { t } = useLocale();
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9$]/g, '').slice(0, 10);
    onChange('symbol', val);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      onChange('imageFile', null);
      onChange('imagePreviewUrl', null);
      return;
    }
    const preview = URL.createObjectURL(file);
    onChange('imageFile', file);
    onChange('imagePreviewUrl', preview);
  };

  return (
    <CardSpotlight
      spotlightColor="rgba(153, 69, 255, 0.12)"
      className="app-card-static h-full"
    >
      <div className="flex items-center space-x-3 mb-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0a84ff]/15 border border-[#0a84ff]/25 text-[#64b5ff]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-[-0.02em]">{t('tokenDetails')}</h2>
          <p className="text-xs text-neutral-400">
            {t('tokenDetailsHint')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Name and Symbol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <AceternityInput
              type="text"
              name="tokenName"
              label={t('tokenName')}
              required
              disabled={disabled}
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g. Solana Diamond"
            />
          </div>

          <div className="relative">
              <span className="absolute right-3 top-1.5 z-10 text-[10px] text-neutral-500 font-mono">
                {formData.symbol.length}/10
              </span>
            <AceternityInput
              type="text"
              name="tokenSymbol"
              label={t('symbol')}
              required
              maxLength={10}
              disabled={disabled}
              value={formData.symbol}
              onChange={handleSymbolChange}
              placeholder="e.g. DIAMOND"
              className="font-mono uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Row 2: Decimals and Initial Supply */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <AceternityInput
              type="number"
              name="decimals"
              label={t('decimals')}
              min={0}
              max={18}
              disabled={disabled}
              value={formData.decimals}
              onChange={(e) => onChange('decimals', parseInt(e.target.value) || 0)}
              className="font-mono"
            />
            <p className="text-[11px] text-neutral-500 mt-1.5 flex items-center gap-1 font-mono">
              <Sliders className="w-3 h-3 text-[#14F195]" />
              {t('defaultDecimals')}
            </p>
          </div>

          <div>
            <AceternityInput
              type="text"
              name="initialSupply"
              label={t('supply')}
              required
              disabled={disabled}
              value={formData.supply}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                onChange('supply', val);
              }}
              placeholder="e.g. 1000000000"
              className="font-mono"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 font-mono truncate">
              {formData.supply
                ? `${Number(formData.supply).toLocaleString('en-US')} ${t('tokens')}`
                : 'e.g. 1,000,000,000'}
            </p>
          </div>
        </div>

        {/* Logo Upload */}
        <FileUpload
          selectedFile={formData.imageFile}
          previewUrl={formData.imagePreviewUrl}
          onFileSelect={handleFileSelect}
        />

        {/* Description */}
        <div className="relative">
          <div className="rounded-xl border border-white/[0.12] bg-black/[0.24] focus-within:border-[#0a84ff] focus-within:ring-2 focus-within:ring-[#0a84ff]/20 transition">
            <textarea
              id="token-description"
              name="description"
              rows={3}
              disabled={disabled}
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder=" "
              className="peer w-full h-[68px] bg-transparent rounded-xl px-3.5 pb-2 pt-5 text-sm text-neutral-100 focus:outline-none disabled:opacity-50 resize-none border-0"
            />
            <label htmlFor="token-description" className="pointer-events-none absolute left-3.5 top-3 text-sm text-neutral-500 transition-all peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#64b5ff] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]">{t('description')}</label>
          </div>
        </div>
      </div>
    </CardSpotlight>
  );
};
