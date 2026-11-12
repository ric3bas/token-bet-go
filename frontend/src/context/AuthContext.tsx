'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  walletAddress?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithWallet: () => Promise<boolean>;
  loginWithGoogleIdToken: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5236';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { publicKey, signMessage, connected } = useWallet();

  // 1. Tentar recuperar sessão ativa via Refresh Token (Cookie HttpOnly)
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Envia cookie HttpOnly de refresh_token
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.accessToken);
        setUser(data.user);
        return true;
      }
    } catch {
      // A ausência do backend ou de um cookie de sessão é esperada na primeira visita.
    }
    return false;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshSession]);

  // 2. Login com Carteira Solana (SIWS - Sign In With Solana)
  const loginWithWallet = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      if (!publicKey || !signMessage) {
        throw new Error('Conecte sua carteira Solana antes de autenticar.');
      }

      const walletAddress = publicKey.toBase58();

      // Passo 1: Obter desafio criptográfico do backend
      const challengeRes = await fetch(`${API_BASE}/api/auth/solana/challenge?wallet=${walletAddress}`);
      if (!challengeRes.ok) {
        throw new Error('Falha ao obter desafio de assinatura do servidor.');
      }
      const { message } = await challengeRes.json();

      // Passo 2: Assinar a mensagem com a chave privada da carteira (sem gastar taxa de rede)
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signatureBytes);

      // Passo 3: Enviar para verificação Ed25519 e receber AccessToken + Cookie
      const verifyRes = await fetch(`${API_BASE}/api/auth/solana/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          walletAddress,
          signature: signatureBase58,
          message,
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error || 'Falha ao validar assinatura no servidor.');
      }

      const authData = await verifyRes.json();
      setToken(authData.accessToken);
      setUser(authData.user);
      setIsAuthModalOpen(false);
      return true;
    } catch (err: any) {
      console.error('Erro no login via carteira Solana:', err);
      setAuthError(err.message || 'Erro inesperado ao conectar via carteira Solana.');
      return false;
    }
  };

  // 3. Login com Google via IdToken
  const loginWithGoogleIdToken = async (idToken: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao autenticar com o Google.');
      }

      const data = await res.json();
      setToken(data.accessToken);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return true;
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setAuthError(err.message || 'Erro ao autenticar com o Google.');
      return false;
    }
  };

  // 4. Logout
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Erro ao efetuar logout no servidor:', e);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithWallet,
        loginWithGoogleIdToken,
        logout,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

