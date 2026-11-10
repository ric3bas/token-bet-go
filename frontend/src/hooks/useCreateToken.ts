'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMint,
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';
import { TokenFormData, CreationStatus, CreatedTokenResult } from '@/types/token';
import { useDeployment } from '@/context/DeploymentContext';

// Endereço de tesouraria padrão (fallback caso a variável de ambiente não esteja configurada)
const DEFAULT_TREASURY_WALLET = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

// Metaplex Token Metadata Program ID canônico
const METAPLEX_PROGRAM_ID = new PublicKey(
  TOKEN_METADATA_PROGRAM_ID ? TOKEN_METADATA_PROGRAM_ID.toBase58() : 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Taxas da plataforma em SOL
export const PLATFORM_FEES = {
  BASE_FEE_SOL: 0.03,
  REVOKE_MINT_SOL: 0.05,
  REVOKE_FREEZE_SOL: 0.05,
};

/**
 * Converte a string de supply em BigInt com base nos decimais,
 * evitando problemas de overflow ou imprecisão de ponto flutuante do JavaScript.
 */
function parseSupplyToBigInt(supplyStr: string, decimals: number): bigint {
  const cleanSupply = supplyStr.replace(/,/g, '').trim();
  if (!cleanSupply || isNaN(Number(cleanSupply)) || Number(cleanSupply) <= 0) {
    throw new Error('O valor de fornecimento inicial (supply) deve ser um número maior que zero.');
  }

  const parts = cleanSupply.split('.');
  const integerPart = parts[0] || '0';
  const fractionalPart = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
  const fullAmountStr = `${integerPart}${fractionalPart}`.replace(/^0+/, '') || '0';
  return BigInt(fullAmountStr);
}

export function useCreateToken() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { token } = useAuth();
  const { network, canDeployMainnet, markDevnetValidated } = useDeployment();

  const [status, setStatus] = useState<CreationStatus>({
    step: 'idle',
    message: '',
  });

  const [createdToken, setCreatedToken] = useState<CreatedTokenResult | null>(null);

  const resetStatus = useCallback(() => {
    setStatus({ step: 'idle', message: '' });
    setCreatedToken(null);
  }, []);

  const createToken = useCallback(
    async (formData: TokenFormData): Promise<CreatedTokenResult | null> => {
      // 1. Validação de Conexão da Carteira
      if (!publicKey || !signTransaction) {
        setStatus({
          step: 'error',
          message: 'Carteira não conectada ou sem suporte para assinatura. Por favor, conecte sua carteira.',
          error: 'WALLET_NOT_CONNECTED',
        });
        return null;
      }

      // A Mainnet mint is a separate on-chain asset. Only unlock it after this
      // exact configuration has been created and verified on Devnet.
      if (network === 'mainnet-beta' && !canDeployMainnet(formData, publicKey.toBase58())) {
        setStatus({
          step: 'error',
          message: 'Publique primeiro esta configuração no Devnet e aguarde a validação on-chain antes de usar a Mainnet.',
          error: 'DEVNET_VALIDATION_REQUIRED',
        });
        return null;
      }

      // 2. Validação Básica dos Dados do Formulário
      const tokenName = formData.name.trim();
      const tokenSymbol = formData.symbol.trim().toUpperCase();
      const decimals = Number(formData.decimals ?? 9);

      if (!tokenName || !tokenSymbol || !formData.supply) {
        setStatus({
          step: 'error',
          message: 'Por favor, preencha todos os campos obrigatórios (Nome, Símbolo e Fornecimento Inicial).',
          error: 'VALIDATION_FAILED',
        });
        return null;
      }

      if (tokenSymbol.length > 10) {
        setStatus({
          step: 'error',
          message: 'O símbolo do token deve ter no máximo 10 caracteres.',
          error: 'SYMBOL_TOO_LONG',
        });
        return null;
      }

      if (tokenName.length > 32) {
        setStatus({
          step: 'error',
          message: 'O nome do token deve ter no máximo 32 caracteres.',
          error: 'NAME_TOO_LONG',
        });
        return null;
      }

      try {
        setStatus({
          step: 'validating',
          message: 'Validando parâmetros, taxas e saldo da carteira...',
        });

        // 3. Resolução da Carteira de Tesouraria
        const treasuryAddressString =
          process.env.NEXT_PUBLIC_TREASURY_WALLET?.trim() || DEFAULT_TREASURY_WALLET;
        let treasuryPublicKey: PublicKey;
        try {
          treasuryPublicKey = new PublicKey(treasuryAddressString);
        } catch {
          throw new Error(`Endereço de tesouraria inválido: ${treasuryAddressString}`);
        }

        // 4. Verificação das Taxas da Plataforma (Regra de Ouro)
        const shouldRevokeMint = Boolean(formData.revokeMint || (formData as any).revokeMintAuthority);
        const shouldRevokeFreeze = Boolean(formData.revokeFreeze || (formData as any).revokeFreezeAuthority);

        // Devnet is a real functional test, not a paid deployment. It needs
        // dev SOL for account rent and validator fees only; platform transfers
        // are reserved for the irreversible Mainnet deployment.
        const isDevnet = network === 'devnet';
        let platformTotalFeeSol = isDevnet ? 0 : PLATFORM_FEES.BASE_FEE_SOL;
        if (!isDevnet && shouldRevokeMint) platformTotalFeeSol += PLATFORM_FEES.REVOKE_MINT_SOL;
        if (!isDevnet && shouldRevokeFreeze) platformTotalFeeSol += PLATFORM_FEES.REVOKE_FREEZE_SOL;

        const platformTotalFeeLamports = BigInt(
          Math.round(platformTotalFeeSol * LAMPORTS_PER_SOL)
        );

        // 5. Cálculo On-chain de Rent Exemption para o Mint (MINT_SIZE = 82)
        const mintRentLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        // Estimativa segura de custos on-chain adicionais (Rent ATA + PDA Metaplex + Gas Fees)
        const estimatedNetworkFeesLamports = BigInt(Math.round(0.016 * LAMPORTS_PER_SOL));
        const requiredBalanceLamports =
          platformTotalFeeLamports + BigInt(mintRentLamports) + estimatedNetworkFeesLamports;

        // 6. Validação Prévia de Saldo de SOL do Usuário
        const userBalanceLamports = await connection.getBalance(publicKey, 'confirmed');
        if (BigInt(userBalanceLamports) < requiredBalanceLamports) {
          const userBalanceSol = (userBalanceLamports / LAMPORTS_PER_SOL).toFixed(4);
          const requiredSol = (Number(requiredBalanceLamports) / LAMPORTS_PER_SOL).toFixed(4);
          throw new Error(isDevnet
            ? `Saldo Devnet insuficiente. Sua carteira tem ${userBalanceSol} dev SOL e precisa de aproximadamente ${requiredSol} dev SOL para rent e gás. Solicite dev SOL no Solana Faucet e tente novamente.`
            : `Saldo insuficiente. Seu saldo atual é de ${userBalanceSol} SOL, mas são necessários aproximadamente ${requiredSol} SOL (Taxas da plataforma: ${platformTotalFeeSol.toFixed(2)} SOL + Rent Exemption e gás da Solana).`
          );
        }

        // 7. Upload de Metadados e Imagem para o IPFS via /api/upload
        setStatus({
          step: 'uploading_image',
          message: 'Enviando imagem e metadados para armazenamento descentralizado (IPFS)...',
        });

        const uploadFormData = new FormData();
        if (formData.imageFile) {
          uploadFormData.append('file', formData.imageFile);
        } else {
          // Criação de avatar SVG vetorial padrão caso não haja imagem selecionada
          const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><rect width="300" height="300" rx="150" fill="url(#g)"/><text x="150" y="165" font-size="64" font-weight="900" font-family="Arial, sans-serif" fill="#ffffff" text-anchor="middle">${tokenSymbol.slice(0, 4)}</text></svg>`;
          const defaultBlob = new Blob([defaultSvg], { type: 'image/svg+xml' });
          uploadFormData.append('file', defaultBlob, `${tokenSymbol.toLowerCase()}-badge.svg`);
        }

        uploadFormData.append('name', tokenName);
        uploadFormData.append('symbol', tokenSymbol);
        uploadFormData.append('description', formData.description?.trim() || `${tokenName} (${tokenSymbol}) token on Solana.`);

        setStatus({
          step: 'uploading_metadata',
          message: 'Criando manifesto de metadados no padrão Metaplex V3...',
        });

        const uploadHeaders: Record<string, string> = {};
        if (token) {
          uploadHeaders['Authorization'] = `Bearer ${token}`;
        }

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: uploadHeaders,
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json().catch(() => null);
          throw new Error(errData?.error || 'Falha no upload dos metadados para o IPFS.');
        }

        const uploadData = await uploadResponse.json();
        const metadataUri = uploadData.metadataUri || uploadData.gatewayUrl;
        if (!metadataUri) {
          throw new Error('URI de metadados não retornada pelo servidor de upload.');
        }

        // 8. Construção da Transação Atômica no Client-Side
        setStatus({
          step: 'building_transaction',
          message: 'Construindo instruções atômicas da transação Solana...',
        });

        const mintKeypair = Keypair.generate();
        const rawSupply = parseSupplyToBigInt(formData.supply, decimals);

        const transaction = new Transaction();

        // a. Rent exemption calculation para o Mint (MINT_SIZE = 82)
        // b. SystemProgram.createAccount para criar o Mint
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: mintRentLamports,
            programId: TOKEN_PROGRAM_ID,
          })
        );

        // c. createInitializeMintInstruction para inicializar o mint
        transaction.add(
          createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            publicKey, // mintAuthority inicial
            publicKey, // freezeAuthority inicial
            TOKEN_PROGRAM_ID
          )
        );

        // d. Obter o ATA do usuário
        const userAta = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // e. createAssociatedTokenAccountInstruction para criar a ATA do usuário
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            userAta,   // ata
            publicKey, // owner
            mintKeypair.publicKey, // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        // f. createMintToInstruction para mintar initialSupply * 10^decimals na ATA do usuário
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            userAta,
            publicKey, // mintAuthority
            rawSupply,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // g. Metaplex Metadata V3 Instruction
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            METAPLEX_PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          METAPLEX_PROGRAM_ID
        );

        const tokenMetadataData: DataV2 = {
          name: tokenName,
          symbol: tokenSymbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        };

        const createMetadataIx = createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPDA,
            mint: mintKeypair.publicKey,
            mintAuthority: publicKey,
            payer: publicKey,
            updateAuthority: publicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: tokenMetadataData,
              isMutable: !formData.immutableMetadata,
              collectionDetails: null,
            },
          },
          METAPLEX_PROGRAM_ID
        );
        transaction.add(createMetadataIx);

        // h. Se revokeMintAuthority for true: Revogar autoridade de Mint + Transferir 0.05 SOL para Treasury
        if (shouldRevokeMint) {
          transaction.add(
            createSetAuthorityInstruction(
              mintKeypair.publicKey,
              publicKey,
              AuthorityType.MintTokens,
              null,
              [],
              TOKEN_PROGRAM_ID
            )
          );
          if (!isDevnet) transaction.add(SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: treasuryPublicKey,
            lamports: Math.round(PLATFORM_FEES.REVOKE_MINT_SOL * LAMPORTS_PER_SOL),
          }));
        }

        // i. Se revokeFreezeAuthority for true: Revogar autoridade de Freeze + Transferir 0.05 SOL para Treasury
        if (shouldRevokeFreeze) {
          transaction.add(
            createSetAuthorityInstruction(
              mintKeypair.publicKey,
              publicKey,
              AuthorityType.FreezeAccount,
              null,
              [],
              TOKEN_PROGRAM_ID
            )
          );
          if (!isDevnet) transaction.add(SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: treasuryPublicKey,
            lamports: Math.round(PLATFORM_FEES.REVOKE_FREEZE_SOL * LAMPORTS_PER_SOL),
          }));
        }

        // j. SystemProgram.transfer de 0.03 SOL (taxa base da plataforma) para NEXT_PUBLIC_TREASURY_WALLET
        if (!isDevnet) transaction.add(SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPublicKey,
          lamports: Math.round(PLATFORM_FEES.BASE_FEE_SOL * LAMPORTS_PER_SOL),
        }));

        // 9. Configuração de Bloco Recente e Fee Payer (Regra de Ouro: Usuário é o feePayer)
        transaction.feePayer = publicKey;
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = latestBlockhash.blockhash;

        // 10. Assinatura da Chave do Mint (Keypair gerado localmente)
        transaction.partialSign(mintKeypair);

        // 11. Solicitação de Assinatura da Carteira do Usuário
        setStatus({
          step: 'awaiting_signature',
          message: 'Por favor, aprove e assine a transação em sua carteira Solana...',
        });

        const signedTx = await signTransaction(transaction);

        // 12. Envio e Confirmação On-Chain
        setStatus({
          step: 'confirming',
          message: 'Transmitindo e confirmando transação na rede Solana...',
        });

        const rawTransaction = signedTx.serialize();
        const txHash = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        const confirmation = await connection.confirmTransaction(
          {
            signature: txHash,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`A transação falhou on-chain: ${JSON.stringify(confirmation.value.err)}`);
        }

        // 13. Sucesso e Preparação do Resultado
        const verifiedMint = await getMint(connection, mintKeypair.publicKey, 'confirmed', TOKEN_PROGRAM_ID);
        const metadataAccount = await connection.getAccountInfo(metadataPDA, 'confirmed');
        const actualMintAuthority = verifiedMint.mintAuthority?.toBase58() ?? null;
        const actualFreezeAuthority = verifiedMint.freezeAuthority?.toBase58() ?? null;
        const expectedMintAuthority = shouldRevokeMint ? null : publicKey.toBase58();
        const expectedFreezeAuthority = shouldRevokeFreeze ? null : publicKey.toBase58();

        if (
          verifiedMint.decimals !== decimals ||
          verifiedMint.supply !== rawSupply ||
          actualMintAuthority !== expectedMintAuthority ||
          actualFreezeAuthority !== expectedFreezeAuthority ||
          !metadataAccount
        ) {
          throw new Error('A validação on-chain do mint ou dos metadados não corresponde à configuração informada.');
        }

        const clusterQuery = network === 'mainnet-beta' ? '' : `?cluster=${network}`;

        const mintAddress = mintKeypair.publicKey.toBase58();

        // 13. Persistência no Banco PostgreSQL via Backend .NET
        const tokenSaveHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          tokenSaveHeaders['Authorization'] = `Bearer ${token}`;
        }

        fetch('/api/tokens', {
          method: 'POST',
          headers: tokenSaveHeaders,
          body: JSON.stringify({
            mintAddress,
            name: tokenName,
            symbol: tokenSymbol,
            decimals,
            initialSupply: Number(formData.supply),
            description: formData.description,
            imageUri: uploadData.imageUri || '',
            metadataUri,
            ipfsHash: uploadData.ipfsHash || '',
            revokeMintAuthority: shouldRevokeMint,
            revokeFreezeAuthority: shouldRevokeFreeze,
            immutableMetadata: Boolean(formData.immutableMetadata),
            userWallet: publicKey.toBase58(),
            treasuryWallet: treasuryPublicKey.toBase58(),
            txSignature: txHash,
            baseFeeSol: isDevnet ? 0 : PLATFORM_FEES.BASE_FEE_SOL,
            revokeMintFeeSol: !isDevnet && shouldRevokeMint ? PLATFORM_FEES.REVOKE_MINT_SOL : 0,
            revokeFreezeFeeSol: !isDevnet && shouldRevokeFreeze ? PLATFORM_FEES.REVOKE_FREEZE_SOL : 0,
            totalPlatformFeeSol: platformTotalFeeSol,
            network,
          }),
        }).catch((err) => console.warn('Erro ao registrar no PostgreSQL:', err));

        const finalResult: CreatedTokenResult = {
          mintAddress,
          txHash,
          name: tokenName,
          symbol: tokenSymbol,
          decimals,
          supply: formData.supply,
          metadataUri,
          explorerUrl: `https://explorer.solana.com/address/${mintAddress}${clusterQuery}`,
          solscanUrl: `https://solscan.io/token/${mintAddress}${clusterQuery}`,
        };

        if (network === 'devnet') {
          markDevnetValidated(formData, publicKey.toBase58(), mintAddress, txHash);
        }

        setStatus({
          step: 'success',
          message: `Token ${tokenSymbol} criado com sucesso na rede Solana!`,
          txHash,
          mintAddress,
        });

        setCreatedToken(finalResult);
        return finalResult;
      } catch (err: any) {
        console.error('[useCreateToken Error]:', err);

        let errorMessage = 'Ocorreu um erro durante a criação do token.';
        if (err?.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        setStatus({
          step: 'error',
          message: errorMessage,
          error: String(err),
        });

        return null;
      }
    },
    [publicKey, connection, signTransaction, network, canDeployMainnet, markDevnetValidated]
  );

  return {
    createToken,
    status,
    setStatus,
    createdToken,
    resetStatus,
    isCreating:
      status.step !== 'idle' &&
      status.step !== 'success' &&
      status.step !== 'error',
  };
}
