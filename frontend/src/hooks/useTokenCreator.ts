'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
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
} from '@solana/spl-token';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  DataV2,
} from '@metaplex-foundation/mpl-token-metadata';

// Metaplex Token Metadata Program ID canônico
const METAPLEX_PROGRAM_ID = new PublicKey(
  TOKEN_METADATA_PROGRAM_ID ? TOKEN_METADATA_PROGRAM_ID.toBase58() : 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Endereço de carteira da empresa para recebimento de taxas da plataforma
export const COMPANY_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_COMPANY_WALLET ||
  process.env.NEXT_PUBLIC_TREASURY_WALLET ||
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

// Tabela de taxas de serviço em SOL (custo zero para o servidor)
export const PLATFORM_FEES = {
  CREATE_TOKEN_SOL: 0.03, // Ação 1: Taxa de criação do Token
  REVOKE_MINT_SOL: 0.05,  // Ação 2: Taxa de revogação de Mint
  REVOKE_FREEZE_SOL: 0.05, // Ação 3: Taxa de revogação de Freeze
};

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals?: number;
  supply: string | number;
  metadataUri: string;
  revokeMint?: boolean;
  revokeFreeze?: boolean;
  immutableMetadata?: boolean;
}

export interface TokenExecutionResult {
  signature: string;
  mintAddress: string;
  explorerUrl: string;
  solscanUrl: string;
}

/**
 * Converte o valor de fornecimento (supply) em BigInt com precisão decimal exata,
 * evitando imprecisão de ponto flutuante do JavaScript para suprimentos gigantescos.
 */
function parseSupplyToBigInt(supply: string | number, decimals: number): bigint {
  const supplyStr = supply.toString().replace(/,/g, '').trim();
  const parts = supplyStr.split('.');
  const integerPart = parts[0] || '0';
  const fractionalPart = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
  const fullAmountStr = `${integerPart}${fractionalPart}`.replace(/^0+/, '') || '0';
  return BigInt(fullAmountStr);
}

export function useTokenCreator() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const getCompanyPublicKey = useCallback((): PublicKey => {
    try {
      return new PublicKey(COMPANY_WALLET_ADDRESS);
    } catch {
      throw new Error(`Endereço de carteira da empresa inválido: ${COMPANY_WALLET_ADDRESS}`);
    }
  }, []);

  /**
   * Valida se a carteira do usuário possui saldo de SOL suficiente
   * para cobrir a taxa da plataforma + rent exemption de contas + taxas de rede da Solana.
   */
  const validateUserBalance = useCallback(
    async (requiredFeeSol: number, estimatedRentLamports: bigint = BigInt(0)) => {
      if (!publicKey) throw new Error('Carteira não conectada.');

      const userBalanceLamports = await connection.getBalance(publicKey, 'confirmed');
      const requiredFeeLamports = BigInt(Math.round(requiredFeeSol * LAMPORTS_PER_SOL));
      const estimatedGasLamports = BigInt(Math.round(0.005 * LAMPORTS_PER_SOL)); // ~0.005 SOL para gas seguro

      const totalRequired = requiredFeeLamports + estimatedRentLamports + estimatedGasLamports;

      if (BigInt(userBalanceLamports) < totalRequired) {
        const currentSol = (userBalanceLamports / LAMPORTS_PER_SOL).toFixed(4);
        const neededSol = (Number(totalRequired) / LAMPORTS_PER_SOL).toFixed(4);
        throw new Error(
          `Saldo insuficiente. Seu saldo é de ${currentSol} SOL, mas são necessários aproximadamente ${neededSol} SOL para cobrir a taxa do serviço (${requiredFeeSol.toFixed(2)} SOL) + custos de rede Solana.`
        );
      }
    },
    [connection, publicKey]
  );

  /**
   * Assina e transmite uma transação atômica na Solana.
   * Regra de Ouro: o usuário é o ÚNICO feePayer. A VPS nunca assina ou paga nada.
   */
  const executeTransaction = useCallback(
    async (transaction: Transaction, extraSigners: Keypair[] = []): Promise<string> => {
      if (!publicKey || !signTransaction) {
        throw new Error('Por favor, conecte uma carteira compatível com Solana.');
      }

      transaction.feePayer = publicKey;
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;

      // Chaves parciais geradas localmente (ex: MintKeypair)
      if (extraSigners.length > 0) {
        transaction.partialSign(...extraSigners);
      }

      setStatusMessage('Solicitando aprovação e assinatura na sua carteira...');
      const signedTx = await signTransaction(transaction);

      setStatusMessage('Transmitindo e confirmando transação na rede Solana...');
      const rawTx = signedTx.serialize();
      const txSignature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      const confirmation = await connection.confirmTransaction(
        {
          signature: txSignature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Falha na confirmação da transação: ${JSON.stringify(confirmation.value.err)}`);
      }

      return txSignature;
    },
    [connection, publicKey, signTransaction]
  );

  /**
   * AÇÃO 1: Criação de Token SPL Completa
   * - Criação da conta Mint e Rent Exemption
   * - Inicialização do Mint
   * - Criação da ATA do usuário
   * - Mintagem dos tokens de fornecimento inicial
   * - Adição de Metadados Metaplex V3 (Nome, Símbolo, URI)
   * - Transferência embutida de 0.03 SOL para a carteira da empresa (NEXT_PUBLIC_COMPANY_WALLET)
   * - Opcionalmente anula autoridade de Mint (+0.05 SOL) e Freeze (+0.05 SOL) na mesma transação atômica
   */
  const createToken = useCallback(
    async (params: CreateTokenParams): Promise<TokenExecutionResult> => {
      if (!publicKey) throw new Error('Conecte sua carteira Solana antes de continuar.');

      setLoading(true);
      setStatusMessage('Preparando instruções atômicas de criação de Token...');

      try {
        const companyWallet = getCompanyPublicKey();
        const decimals = params.decimals ?? 9;
        const mintKeypair = Keypair.generate();

        // 1. Cálculo de Taxa Base + Taxas Opcionais
        let totalFeeSol = PLATFORM_FEES.CREATE_TOKEN_SOL; // 0.03 SOL base
        if (params.revokeMint) totalFeeSol += PLATFORM_FEES.REVOKE_MINT_SOL; // +0.05 SOL
        if (params.revokeFreeze) totalFeeSol += PLATFORM_FEES.REVOKE_FREEZE_SOL; // +0.05 SOL

        // 2. Cálculo de Rent Exemption para o Mint
        const mintRentLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        // 3. Validação preventiva de saldo do usuário
        await validateUserBalance(totalFeeSol, BigInt(mintRentLamports));

        const transaction = new Transaction();

        // [Instrução 1] Criação de conta para o Mint
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: mintRentLamports,
            programId: TOKEN_PROGRAM_ID,
          })
        );

        // [Instrução 2] Inicialização do Mint
        transaction.add(
          createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            publicKey, // Mint Authority inicial
            publicKey, // Freeze Authority inicial
            TOKEN_PROGRAM_ID
          )
        );

        // [Instrução 3] Obtenção e criação da Associated Token Account (ATA) do usuário
        const userAta = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // Payer
            userAta,   // Endereço ATA
            publicKey, // Dono do Token
            mintKeypair.publicKey, // Endereço do Mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        // [Instrução 4] Mint dos tokens de Initial Supply para o ATA do usuário
        const rawSupply = parseSupplyToBigInt(params.supply, decimals);
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            userAta,
            publicKey, // Mint Authority
            rawSupply,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // [Instrução 5] Criação de Metadados Metaplex V3 (Nome, Símbolo, URI do IPFS)
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            METAPLEX_PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          METAPLEX_PROGRAM_ID
        );

        const metadataData: DataV2 = {
          name: params.name.trim(),
          symbol: params.symbol.trim().toUpperCase(),
          uri: params.metadataUri.trim(),
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
              data: metadataData,
              isMutable: params.immutableMetadata === false, // se marcado Immutable, isMutable = false
              collectionDetails: null,
            },
          },
          METAPLEX_PROGRAM_ID
        );
        transaction.add(createMetadataIx);

        // [Instrução 6 - Taxa da Plataforma]: Transferência de 0.03 SOL da taxa base
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: companyWallet,
            lamports: Math.round(PLATFORM_FEES.CREATE_TOKEN_SOL * LAMPORTS_PER_SOL),
          })
        );

        // [Instrução Opcional]: Revogar Mint Authority (+0.05 SOL embutidos)
        if (params.revokeMint) {
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
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: companyWallet,
              lamports: Math.round(PLATFORM_FEES.REVOKE_MINT_SOL * LAMPORTS_PER_SOL),
            })
          );
        }

        // [Instrução Opcional]: Revogar Freeze Authority (+0.05 SOL embutidos)
        if (params.revokeFreeze) {
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
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: companyWallet,
              lamports: Math.round(PLATFORM_FEES.REVOKE_FREEZE_SOL * LAMPORTS_PER_SOL),
            })
          );
        }

        // Execução atômica assinada pelo Mint Keypair e pelo usuário
        const signature = await executeTransaction(transaction, [mintKeypair]);

        const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
        const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
        const mintAddress = mintKeypair.publicKey.toBase58();

        setStatusMessage('Token emitido com sucesso na Solana!');
        return {
          signature,
          mintAddress,
          explorerUrl: `https://explorer.solana.com/address/${mintAddress}${clusterParam}`,
          solscanUrl: `https://solscan.io/token/${mintAddress}${clusterParam}`,
        };
      } finally {
        setLoading(false);
      }
    },
    [connection, publicKey, executeTransaction, getCompanyPublicKey, validateUserBalance]
  );

  /**
   * AÇÃO 2: Revogar Mint Authority Individualmente
   * - Instrução createSetAuthorityInstruction (MintTokens para nulo)
   * - Transferência embutida de 0.05 SOL para a carteira da empresa
   */
  const revokeMintAuthority = useCallback(
    async (mintAddressInput: string | PublicKey): Promise<string> => {
      if (!publicKey) throw new Error('Carteira não conectada.');

      setLoading(true);
      setStatusMessage('Construindo transação de revogação de Mint Authority...');

      try {
        const companyWallet = getCompanyPublicKey();
        const mintPubkey = typeof mintAddressInput === 'string' ? new PublicKey(mintAddressInput) : mintAddressInput;

        await validateUserBalance(PLATFORM_FEES.REVOKE_MINT_SOL);

        const transaction = new Transaction();

        // 1. Anula autoridade de Mint
        transaction.add(
          createSetAuthorityInstruction(
            mintPubkey,
            publicKey,
            AuthorityType.MintTokens,
            null,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // 2. Taxa de 0.05 SOL para a carteira da empresa
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: companyWallet,
            lamports: Math.round(PLATFORM_FEES.REVOKE_MINT_SOL * LAMPORTS_PER_SOL),
          })
        );

        const signature = await executeTransaction(transaction);
        setStatusMessage('Mint Authority revogada com sucesso!');
        return signature;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, executeTransaction, getCompanyPublicKey, validateUserBalance]
  );

  /**
   * AÇÃO 3: Revogar Freeze Authority Individualmente
   * - Instrução createSetAuthorityInstruction (FreezeAccount para nulo)
   * - Transferência embutida de 0.05 SOL para a carteira da empresa
   */
  const revokeFreezeAuthority = useCallback(
    async (mintAddressInput: string | PublicKey): Promise<string> => {
      if (!publicKey) throw new Error('Carteira não conectada.');

      setLoading(true);
      setStatusMessage('Construindo transação de revogação de Freeze Authority...');

      try {
        const companyWallet = getCompanyPublicKey();
        const mintPubkey = typeof mintAddressInput === 'string' ? new PublicKey(mintAddressInput) : mintAddressInput;

        await validateUserBalance(PLATFORM_FEES.REVOKE_FREEZE_SOL);

        const transaction = new Transaction();

        // 1. Anula autoridade de Freeze
        transaction.add(
          createSetAuthorityInstruction(
            mintPubkey,
            publicKey,
            AuthorityType.FreezeAccount,
            null,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        // 2. Taxa de 0.05 SOL para a carteira da empresa
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: companyWallet,
            lamports: Math.round(PLATFORM_FEES.REVOKE_FREEZE_SOL * LAMPORTS_PER_SOL),
          })
        );

        const signature = await executeTransaction(transaction);
        setStatusMessage('Freeze Authority revogada com sucesso!');
        return signature;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, executeTransaction, getCompanyPublicKey, validateUserBalance]
  );

  return {
    createToken,
    revokeMintAuthority,
    revokeFreezeAuthority,
    loading,
    statusMessage,
  };
}
