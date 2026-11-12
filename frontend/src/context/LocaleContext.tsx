'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'pt' | 'es' | 'en';

const messages = {
  pt: {
    appName: 'Token Bet Go', tagline: 'Crie e gerencie tokens SPL', selfCustody: 'Autocustódia', signIn: 'Entrar', signing: 'Assinando', signOut: 'Sair',
    deployment: 'Criação de token Solana', heading: 'Lance seu token com confiança.', intro: 'Defina o token, escolha as permissões e revise o custo antes de assinar.', walletSigns: 'Sua carteira assina cada transação.',
    tokenDetails: 'Detalhes do token', tokenDetailsHint: 'Defina a identidade e o fornecimento inicial.', tokenName: 'Nome do token *', symbol: 'Símbolo / ticker *', decimals: 'Decimais', supply: 'Fornecimento inicial *', defaultDecimals: 'Padrão: 9 (SPL)', tokens: 'tokens', description: 'Descrição (opcional)',
    permissions: 'Permissões', permissionsHint: 'Escolha quais controles o token mantém após o lançamento.', revokeMint: 'Revogar autoridade de mint', revokeFreeze: 'Revogar autoridade de freeze', immutableMetadata: 'Metadados imutáveis', recommended: 'Recomendado',
    mintInfo: 'Desativa permanentemente a criação de novos tokens e fixa o fornecimento.', freezeInfo: 'Impede que a autoridade de freeze bloqueie carteiras. Necessário para pools AMM da Raydium.', metadataInfo: 'Sela permanentemente o nome, símbolo, logo e descrição do token.', permissionDetails: 'Detalhes da permissão', close: 'Fechar',
    costSummary: 'Resumo de custos', costHint: 'Revise os custos estimados antes de abrir a carteira.', metadataInscription: 'Inscrição permanente de metadados', networkCost: 'Aluguel e taxa estimada da rede Solana', estimatedTotal: 'Total estimado',
    connectWallet: 'Conecte sua carteira para continuar', createToken: 'Criar token Solana', creating: 'Criando token...', transactionNotice: 'As transações são montadas na sua carteira, sem custódia.',
    logo: 'Logo do token', chooseLogo: 'Clique para escolher ou arraste o logo', logoHint: 'Recomendado: PNG ou WebP quadrado, até 5 MB', change: 'Alterar', remove: 'Remover', pinned: 'Armazenado no IPFS', copyAddress: 'Copiar endereço', copied: 'Copiado', changeWallet: 'Trocar carteira', disconnect: 'Desconectar',
  },
  es: {
    appName: 'Token Bet Go', tagline: 'Crea y administra tokens SPL', selfCustody: 'Autocustodia', signIn: 'Ingresar', signing: 'Firmando', signOut: 'Salir',
    deployment: 'Creación de token Solana', heading: 'Lanza tu token con confianza.', intro: 'Define el token, elige los permisos y revisa el costo antes de firmar.', walletSigns: 'Tu billetera firma cada transacción.',
    tokenDetails: 'Detalles del token', tokenDetailsHint: 'Define la identidad y el suministro inicial.', tokenName: 'Nombre del token *', symbol: 'Símbolo / ticker *', decimals: 'Decimales', supply: 'Suministro inicial *', defaultDecimals: 'Predeterminado: 9 (SPL)', tokens: 'tokens', description: 'Descripción (opcional)',
    permissions: 'Permisos', permissionsHint: 'Elige qué controles conserva el token tras el lanzamiento.', revokeMint: 'Revocar autoridad de mint', revokeFreeze: 'Revocar autoridad de freeze', immutableMetadata: 'Metadatos inmutables', recommended: 'Recomendado',
    mintInfo: 'Desactiva permanentemente la creación de nuevos tokens y fija el suministro.', freezeInfo: 'Evita que la autoridad de freeze bloquee billeteras. Necesario para pools AMM de Raydium.', metadataInfo: 'Sella permanentemente el nombre, símbolo, logo y descripción del token.', permissionDetails: 'Detalles del permiso', close: 'Cerrar',
    costSummary: 'Resumen de costos', costHint: 'Revisa los costos estimados antes de abrir la billetera.', metadataInscription: 'Inscripción permanente de metadatos', networkCost: 'Alquiler y tarifa estimada de la red Solana', estimatedTotal: 'Total estimado',
    connectWallet: 'Conecta tu billetera para continuar', createToken: 'Crear token Solana', creating: 'Creando token...', transactionNotice: 'Las transacciones se preparan en tu billetera, sin custodia.',
    logo: 'Logo del token', chooseLogo: 'Haz clic para elegir o arrastra el logo', logoHint: 'Recomendado: PNG o WebP cuadrado, hasta 5 MB', change: 'Cambiar', remove: 'Eliminar', pinned: 'Almacenado en IPFS', copyAddress: 'Copiar dirección', copied: 'Copiado', changeWallet: 'Cambiar billetera', disconnect: 'Desconectar',
  },
  en: {
    appName: 'Token Bet Go', tagline: 'Create and manage SPL tokens', selfCustody: 'Self-custody', signIn: 'Sign in', signing: 'Signing', signOut: 'Sign out',
    deployment: 'Solana token deployment', heading: 'Launch your token with confidence.', intro: 'Define the token, choose its permissions, and review the cost before signing.', walletSigns: 'Your wallet signs every transaction.',
    tokenDetails: 'Token details', tokenDetailsHint: 'Define the identity and initial supply.', tokenName: 'Token name *', symbol: 'Symbol / ticker *', decimals: 'Decimals', supply: 'Initial supply *', defaultDecimals: 'Default: 9 (SPL)', tokens: 'tokens', description: 'Description (optional)',
    permissions: 'Permissions', permissionsHint: 'Choose which controls your token keeps after launch.', revokeMint: 'Revoke Mint Authority', revokeFreeze: 'Revoke Freeze Authority', immutableMetadata: 'Immutable Metadata', recommended: 'Recommended',
    mintInfo: 'Permanently disables further token creation and fixes the token supply.', freezeInfo: 'Prevents the freeze authority from blocking holder wallets. Required for Raydium AMM pools.', metadataInfo: 'Permanently seals the token name, symbol, logo, and description.', permissionDetails: 'Permission details', close: 'Close',
    costSummary: 'Cost summary', costHint: 'Review estimated costs before opening your wallet.', metadataInscription: 'Permanent Metadata Inscription', networkCost: 'Estimated Solana Network Rent & Gas', estimatedTotal: 'Estimated total',
    connectWallet: 'Connect wallet to continue', createToken: 'Create Solana Token', creating: 'Creating token...', transactionNotice: 'Transactions are assembled in your wallet with zero custody.',
    logo: 'Token logo', chooseLogo: 'Click to choose or drag the logo', logoHint: 'Recommended: square PNG or WebP, up to 5 MB', change: 'Change', remove: 'Remove', pinned: 'Stored on IPFS', copyAddress: 'Copy address', copied: 'Copied', changeWallet: 'Change wallet', disconnect: 'Disconnect',
  },
} as const;

type MessageKey = keyof typeof messages.pt;
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('pt');
  useEffect(() => {
    const saved = window.localStorage.getItem('tokenbet-locale');
    if (saved === 'pt' || saved === 'es' || saved === 'en') setLocale(saved);
  }, []);
  const value = useMemo(() => ({ locale, setLocale: (next: Locale) => { setLocale(next); window.localStorage.setItem('tokenbet-locale', next); }, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale deve ser usado dentro de LocaleProvider');
  return context;
}
