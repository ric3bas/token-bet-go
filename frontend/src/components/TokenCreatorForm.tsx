'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { TokenFormData } from '@/types/token';
import { TokenDetailsCard } from './TokenDetailsCard';
import { SecurityOptionsCard } from './SecurityOptionsCard';
import { PricingBreakdownCard } from './PricingBreakdownCard';
import { SuccessModal } from './SuccessModal';
import { useCreateToken } from '@/hooks/useCreateToken';
import { useLocale } from '@/context/LocaleContext';
import { useDeployment } from '@/context/DeploymentContext';
import { 
  Rocket, 
  Wallet, 
  Loader2, 
  AlertCircle, 
  CloudUpload, 
  FileText, 
  Cpu, 
  PenTool, 
  Send,
  Sparkles 
} from 'lucide-react';

const initialFormData: TokenFormData = {
  name: '',
  symbol: '',
  decimals: 9,
  supply: '1000000000',
  description: '',
  imageFile: null,
  imagePreviewUrl: null,
  revokeMint: false,
  revokeFreeze: false,
  immutableMetadata: true,
};

export const TokenCreatorForm: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<TokenFormData>(initialFormData);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const { createToken, status, createdToken, resetStatus, isCreating } = useCreateToken();
  const { t, locale } = useLocale();
  const { network, setNetwork } = useDeployment();
  const productionMessage = locale === 'pt' ? 'A Mainnet cria um novo mint permanente com SOL real.' : locale === 'es' ? 'Mainnet crea un mint nuevo y permanente con SOL real.' : 'Mainnet creates a new permanent mint with real SOL.';
  const deploymentCopy = locale === 'pt'
    ? { devnet: 'Devnet (teste)', mainnet: 'Mainnet (produção)', testing: 'Crie e valide um mint de teste usando dev SOL.', locked: 'Conclua o teste no Devnet com esta mesma configuração para liberar a Mainnet.', ready: 'Teste Devnet validado. A Mainnet criará um novo mint permanente.', testAction: 'Validar no Devnet', liveAction: 'Publicar na Mainnet' }
    : locale === 'es'
      ? { devnet: 'Devnet (prueba)', mainnet: 'Mainnet (producción)', testing: 'Crea y valida un mint de prueba usando dev SOL.', locked: 'Completa la prueba en Devnet con esta misma configuración para habilitar Mainnet.', ready: 'Prueba Devnet validada. Mainnet creará un mint nuevo y permanente.', testAction: 'Validar en Devnet', liveAction: 'Publicar en Mainnet' }
      : { devnet: 'Devnet (test)', mainnet: 'Mainnet (production)', testing: 'Create and validate a test mint using dev SOL.', locked: 'Complete the Devnet test with this exact configuration to unlock Mainnet.', ready: 'Devnet test validated. Mainnet will create a new permanent mint.', testAction: 'Validate on Devnet', liveAction: 'Publish on Mainnet' };
  const faucetLabel = locale === 'pt' ? 'Obter dev SOL no faucet' : locale === 'es' ? 'Obtener dev SOL del faucet' : 'Get dev SOL from faucet';

  // Wallet adapters can restore an extension connection before hydration. Keep
  // the server and the first client render identical, then reflect that state.
  useEffect(() => {
    setMounted(true);
  }, []);

  const isWalletConnected = mounted && connected;

  const handleFieldChange = (field: keyof TokenFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationError) {
      setValidationError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setValidationError('Please enter a Token Name.');
      return false;
    }
    if (!formData.symbol.trim()) {
      setValidationError('Please enter a Token Symbol / Ticker.');
      return false;
    }
    if (formData.symbol.length > 10) {
      setValidationError('Token Symbol cannot exceed 10 characters.');
      return false;
    }
    if (!formData.supply || Number(formData.supply) <= 0) {
      setValidationError('Please specify a valid Initial Supply greater than 0.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected) {
      setVisible(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    const result = await createToken(formData);
    if (result) {
      setIsSuccessModalOpen(true);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    resetStatus();
    setIsSuccessModalOpen(false);
  };

  const renderStepFeedback = () => {
    switch (status.step) {
      case 'uploading_image':
        return (
          <div className="flex items-center space-x-2 text-purple-400 animate-pulse text-xs sm:text-sm">
            <CloudUpload className="w-4 h-4" />
            <span>Pinning token logo to decentralized IPFS...</span>
          </div>
        );
      case 'uploading_metadata':
        return (
          <div className="flex items-center space-x-2 text-purple-300 animate-pulse text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            <span>Publishing Metaplex Metadata standard JSON...</span>
          </div>
        );
      case 'building_transaction':
        return (
          <div className="flex items-center space-x-2 text-cyan-400 animate-pulse text-xs sm:text-sm">
            <Cpu className="w-4 h-4" />
            <span>Assembling atomic Solana instructions...</span>
          </div>
        );
      case 'awaiting_signature':
        return (
          <div className="flex items-center space-x-2 text-amber-400 animate-bounce text-xs sm:text-sm">
            <PenTool className="w-4 h-4" />
            <span>Waiting for signature confirmation in wallet...</span>
          </div>
        );
      case 'confirming':
        return (
          <div className="flex items-center space-x-2 text-[#14F195] animate-pulse text-xs sm:text-sm">
            <Send className="w-4 h-4" />
            <span>Broadcasting to validator cluster and confirming...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="app-card deployment-selector p-3 sm:p-4" aria-label="Deployment environment">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-xl border border-white/[0.10] bg-black/10 p-1" role="group" aria-label="Solana network">
              <button type="button" onClick={() => setNetwork('devnet')} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${network === 'devnet' ? 'bg-[#0a84ff] text-white' : 'text-neutral-400 hover:text-white'}`}>{deploymentCopy.devnet}</button>
              <button type="button" onClick={() => setNetwork('mainnet-beta')} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${network === 'mainnet-beta' ? 'bg-[#30d158] text-[#07130c]' : 'text-neutral-400 hover:text-white'}`}>{deploymentCopy.mainnet}</button>
            </div>
            {network === 'devnet' ? (
              <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#64b5ff] hover:text-white sm:text-right">
                {faucetLabel}
              </a>
            ) : (
              <p className="text-xs leading-relaxed text-[#30d158] sm:max-w-[58%] sm:text-right">{productionMessage}</p>
            )}
          </div>
        </section>
        <div className="form-layout grid items-stretch gap-5">
          <TokenDetailsCard
            formData={formData}
            onChange={handleFieldChange}
            disabled={isCreating}
          />

          <div className="form-side flex flex-col gap-5">
            <SecurityOptionsCard
              formData={formData}
              onChange={handleFieldChange}
              disabled={isCreating}
            />

            <PricingBreakdownCard />
          </div>
        </div>

        {/* Validation or Error Alert */}
        {(validationError || status.step === 'error') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 backdrop-blur-xl flex items-start space-x-3.5 text-rose-300 text-sm shadow-[0_0_25px_rgba(244,63,94,0.15)] animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Notice</p>
              <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">
                {validationError || status.message}
              </p>
            </div>
          </div>
        )}

        {/* Active Step Progress Indicator */}
        {isCreating && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0c101c]/90 border border-white/[0.1] backdrop-blur-xl flex items-center justify-between shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-[#14F195] animate-spin" />
              {renderStepFeedback()}
            </div>
            <span className="text-xs font-mono text-neutral-500 hidden sm:inline">Broadcasting...</span>
          </div>
        )}

        {/* Action Button Container */}
        <div className="pt-2">
          {!isWalletConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="w-full h-12 rounded-xl bg-[#0a84ff] text-white font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 transition-colors hover:bg-[#409cff] active:scale-[0.99] shadow-[0_8px_20px_rgba(10,132,255,0.25)]"
              >
                <Wallet className="w-[18px] h-[18px]" />
                <span>{t('connectWallet')}</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                type="submit"
                disabled={isCreating}
                className={`w-full h-12 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 transition-colors active:scale-[0.99] ${
                  isCreating
                    ? 'bg-white/[0.10] text-neutral-500 cursor-not-allowed'
                    : 'bg-[#0a84ff] text-white hover:bg-[#409cff] shadow-[0_8px_20px_rgba(10,132,255,0.25)]'
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-neutral-300">{t('creating')}</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>{network === 'mainnet-beta' ? deploymentCopy.liveAction : deploymentCopy.testAction}</span>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-neutral-500 mt-4 font-normal">
            {t('transactionNotice')}
          </p>
        </div>
      </form>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleReset}
        tokenResult={createdToken}
      />
    </>
  );
};
