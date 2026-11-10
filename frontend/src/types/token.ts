export interface TokenFormData {
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  description: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  revokeMint: boolean;
  revokeFreeze: boolean;
  immutableMetadata: boolean;
}

export type CreationStep =
  | 'idle'
  | 'validating'
  | 'uploading_image'
  | 'uploading_metadata'
  | 'building_transaction'
  | 'awaiting_signature'
  | 'confirming'
  | 'success'
  | 'error';

export interface CreationStatus {
  step: CreationStep;
  message: string;
  txHash?: string;
  mintAddress?: string;
  error?: string;
}

export interface PricingDetails {
  baseFee: number;
  revokeMintFee: number;
  revokeFreezeFee: number;
  gasEstimate: number;
  totalServiceFee: number;
  totalWithGas: number;
}

export interface CreatedTokenResult {
  mintAddress: string;
  txHash: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  metadataUri?: string;
  explorerUrl: string;
  solscanUrl: string;
}
