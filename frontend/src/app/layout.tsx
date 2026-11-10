import { WalletContextProvider } from '@/components/WalletContextProvider';
import './globals.css';

export const metadata = {
  title: 'Solana Token Creator | Create SPL Token in Seconds',
  description: 'Deploy Solana SPL tokens without code. Built for high speed, low fees, Raydium DEX compatibility, and security authority management.',
  keywords: ['Solana', 'SPL Token', 'Token Creator', 'Solana Token Maker', 'Crypto', 'DeFi'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-[#9945FF] selection:text-white">
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
