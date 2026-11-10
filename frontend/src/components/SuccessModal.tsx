'use client';

import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, X, Sparkles, Coins } from 'lucide-react';
import { CreatedTokenResult } from '@/types/token';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenResult: CreatedTokenResult | null;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  tokenResult,
}) => {
  const [copiedMint, setCopiedMint] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  if (!isOpen || !tokenResult) return null;

  const handleCopy = (text: string, type: 'mint' | 'tx') => {
    navigator.clipboard.writeText(text);
    if (type === 'mint') {
      setCopiedMint(true);
      setTimeout(() => setCopiedMint(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const networkParam = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0c101c]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Aceternity ambient spotlights behind modal */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-[#14F195]/20 via-[#9945FF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#14F195] to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Content */}
        <div className="text-center pt-2 pb-6">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9945FF]/20 to-[#14F195]/20 border border-[#14F195]/40 flex items-center justify-center mx-auto mb-4 text-[#14F195] shadow-[0_0_30px_rgba(20,241,149,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
            <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            Token Successfully Created!
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
            Your SPL token is officially minted on Solana and ready for trading & liquidity.
          </p>
        </div>

        {/* Token Specs Preview */}
        <div className="bg-black/50 border border-white/[0.08] rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs text-neutral-400">Token Identity</span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              {tokenResult.name} <span className="text-purple-400">({tokenResult.symbol})</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs text-neutral-400">Genesis Supply</span>
            <span className="text-sm font-mono font-bold text-[#14F195]">
              {Number(tokenResult.supply).toLocaleString('en-US')} {tokenResult.symbol}
            </span>
          </div>

          {/* Mint Address with Copy */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Mint Address
              </span>
              <button
                onClick={() => handleCopy(tokenResult.mintAddress, 'mint')}
                className="flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
              >
                {copiedMint ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14F195]" />
                    <span className="text-[#14F195] font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Mint</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#05070f] px-3.5 py-2.5 rounded-xl font-mono text-xs text-neutral-200 border border-white/[0.08] break-all select-all shadow-inner">
              {tokenResult.mintAddress}
            </div>
          </div>

          {/* Tx Hash */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Transaction Hash
              </span>
              <button
                onClick={() => handleCopy(tokenResult.txHash, 'tx')}
                className="flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
              >
                {copiedTx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14F195]" />
                    <span className="text-[#14F195] font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#05070f] px-3.5 py-2.5 rounded-xl font-mono text-xs text-neutral-400 border border-white/[0.08] truncate shadow-inner">
              {tokenResult.txHash}
            </div>
          </div>
        </div>

        {/* Explorers Links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href={`https://solscan.io/token/${tokenResult.mintAddress}${networkParam}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 text-xs font-medium border border-white/[0.08] hover:border-purple-500/40 transition duration-200 group"
          >
            <span>View on Solscan</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-400 transition" />
          </a>

          <a
            href={`https://explorer.solana.com/address/${tokenResult.mintAddress}${networkParam}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-200 text-xs font-medium border border-white/[0.08] hover:border-[#14F195]/40 transition duration-200 group"
          >
            <span>Solana Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#14F195] transition" />
          </a>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black hover:opacity-95 transition-all duration-200 shadow-[0_0_30px_rgba(153,69,255,0.4)] active:scale-95"
        >
          Create Another Token
        </button>
      </div>
    </div>
  );
};
