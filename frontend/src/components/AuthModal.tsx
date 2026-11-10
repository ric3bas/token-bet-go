'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { 
  X, 
  Mail, 
  ArrowRight, 
  Smartphone, 
  Info, 
  Wallet, 
  ChevronRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithWallet, authError, setAuthError } = useAuth();
  const { select, wallets, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [emailInput, setEmailInput] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const handleGoogleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Redireciona para o fluxo OAuth 2.0 do Google no backend
    window.location.href = `${apiBase}/api/auth/google`;
  };

  const handleWalletSelect = async (walletName?: string) => {
    setAuthError(null);
    setIsSigning(true);
    try {
      if (walletName) {
        const targetWallet = wallets.find(
          (w) => w.adapter.name.toLowerCase() === walletName.toLowerCase()
        );
        if (targetWallet) {
          select(targetWallet.adapter.name);
        }
      }

      if (connected) {
        await loginWithWallet();
      } else {
        // Se ainda não estiver conectada, abre a modal de seleção
        setWalletModalVisible(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao conectar e assinar com a carteira.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-[#111216] border border-gray-800/80 rounded-3xl p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar X */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícone de Pílula verde */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center shadow-inner">
            <div className="w-6 h-6 rotate-45 rounded-full border-2 border-emerald-400 flex items-center justify-center overflow-hidden">
              <div className="w-full h-1/2 bg-emerald-400 self-start" />
              <div className="w-full h-1/2 bg-transparent self-end" />
            </div>
          </div>
        </div>

        {/* Cabeçalho */}
        <h2 className="text-2xl font-bold text-center tracking-tight">Welcome back</h2>
        <p className="text-gray-400 text-xs text-center mt-1 mb-5">
          Sign in to start trading.
        </p>

        {authError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Botão Continue with Google */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-md active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm">Continue with Google</span>
        </button>

        {/* Linha de botões Apple & GitHub */}
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <button
            type="button"
            onClick={() => setAuthError('Login com Apple estará disponível em breve.')}
            className="bg-[#18191f] hover:bg-[#20222a] border border-gray-800 py-2.5 rounded-xl flex items-center justify-center text-white transition"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-6.53-9.98-11.66-21.43-15.38-34.34-3.73-12.92-5.59-25.04-5.59-36.37 0-14.54 3.44-26.68 10.33-36.42 6.89-9.74 15.65-14.7 26.27-14.89 4.35 0 9.28 1.16 14.79 3.47 5.51 2.31 9.4 3.52 11.67 3.63 1.85 0 5.92-1.32 12.22-3.95 6.3-2.64 11.75-3.79 16.36-3.47 12.19.85 21.94 5.37 29.25 13.56-10.66 6.44-15.88 15.35-15.66 26.73.22 9.01 3.69 16.59 10.42 22.75 6.73 6.16 14.65 9.74 23.77 10.74-2.17 6.74-4.78 13.68-7.84 20.82zM119.22 33.15c0-7.36 2.65-14.18 7.95-20.46 5.3-6.28 11.85-10.23 19.65-11.85 0 .98.05 1.96.16 2.94.11.98.16 1.86.16 2.64 0 7.37-2.75 14.28-8.25 20.73-5.5 6.45-12.19 10.34-20.08 11.67-.11-1.3-.23-2.52-.35-3.66-.11-1.15-.17-2.18-.17-3.08l-.07-1.07v-.07z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setAuthError('Login com GitHub estará disponível em breve.')}
            className="bg-[#18191f] hover:bg-[#20222a] border border-gray-800 py-2.5 rounded-xl flex items-center justify-center text-white transition"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </button>
        </div>

        {/* Input de Email */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#18191f] border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setAuthError('Login via link de email direto será habilitado em breve.')}
            className="p-2.5 bg-[#18191f] hover:bg-[#22242c] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card Informativo 1 - Pump App */}
        <div className="mt-3.5 bg-[#18191f] border border-gray-800/80 rounded-2xl p-3 text-left">
          <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
            <span>Already using the app?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400">
            Sign in above with the same method you use in the app and your app wallet comes with you — there&apos;s nothing to import.
          </p>
        </div>

        {/* Card Informativo 2 - External Wallet Notice */}
        <div className="mt-2 bg-[#18191f] border border-gray-800/80 rounded-2xl p-3 text-left">
          <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span>External wallet sign-in notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-400">
            You can sign in directly using Phantom, Coinbase or Solflare. Authenticating with your wallet uses a cryptographic zero-cost signature (SIWS).
          </p>
          <a href="#" className="text-[11px] font-bold text-white underline mt-1.5 block">
            Learn more
          </a>
        </div>

        {/* Divisor "or connect a wallet" */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <span className="relative bg-[#111216] px-3 text-[11px] text-gray-500 font-medium">
            or connect a wallet
          </span>
        </div>

        {/* Lista de Opções de Carteiras */}
        <div className="space-y-2">
          {/* Phantom */}
          <button
            type="button"
            disabled={isSigning}
            onClick={() => handleWalletSelect('phantom')}
            className="w-full bg-[#18191f] hover:bg-[#20222a] border border-gray-800/90 rounded-2xl p-3 flex items-center justify-between transition group active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#AB9FF2]/20 border border-[#AB9FF2]/30 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 128 128" fill="none">
                  <path
                    d="M110.584 64.912c-.065-22.183-17.766-40.09-39.774-40.165-21.782-.074-40.23 18.23-40.23 40.165 0 7.55 2.11 14.62 5.753 20.655l-9.155 9.156c-1.344 1.343-1.344 3.522 0 4.866.672.671 1.552 1.008 2.433 1.008.88 0 1.761-.337 2.433-1.008l8.262-8.262c5.935 4.966 13.565 8.016 21.905 8.163 1.258.022 2.518.022 3.777 0 21.782-.074 44.596-12.404 44.596-34.578zm-51.71 0c-3.134 0-5.674-2.54-5.674-5.673 0-3.134 2.54-5.674 5.674-5.674 3.134 0 5.674 2.54 5.674 5.674 0 3.133-2.54 5.673-5.674 5.673zm24.167 0c-3.134 0-5.674-2.54-5.674-5.673 0-3.134 2.54-5.674 5.674-5.674 3.134 0 5.674 2.54 5.674 5.674 0 3.133-2.54 5.673-5.674 5.673z"
                    fill="#AB9FF2"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white">Phantom</span>
            </div>
            <span className="bg-[#2b2512] text-[#eab308] text-[9px] font-bold px-2 py-0.5 rounded-full border border-yellow-700/50">
              ENDS NOV 30
            </span>
          </button>

          {/* Coinbase Wallet */}
          <button
            type="button"
            disabled={isSigning}
            onClick={() => handleWalletSelect('coinbase wallet')}
            className="w-full bg-[#18191f] hover:bg-[#20222a] border border-gray-800/90 rounded-2xl p-3 flex items-center justify-between transition group active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#0052FF]/20 border border-[#0052FF]/40 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#0052FF] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                </div>
              </div>
              <span className="text-xs font-semibold text-white">Coinbase Wallet</span>
            </div>
            <span className="bg-[#2b2512] text-[#eab308] text-[9px] font-bold px-2 py-0.5 rounded-full border border-yellow-700/50">
              ENDS NOV 30
            </span>
          </button>

          {/* More Wallets */}
          <button
            type="button"
            disabled={isSigning}
            onClick={() => handleWalletSelect()}
            className="w-full bg-[#18191f] hover:bg-[#20222a] border border-gray-800/90 rounded-2xl p-3 flex items-center justify-between transition group active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <span className="text-xs font-semibold text-white">More wallets</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {isSigning && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Assinando autenticação na carteira...</span>
          </div>
        )}
      </div>
    </div>
  );
};

