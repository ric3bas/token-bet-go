using System.Text;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using SimpleBase;

namespace TokenBet.Infrastructure.Services.Auth;

public static class SolanaSignatureVerifier
{
    /// <summary>
    /// Valida uma assinatura criptográfica Ed25519 emitida por uma carteira Solana (Phantom, Solflare, Coinbase, etc.)
    /// </summary>
    /// <param name="walletAddress">Chave pública Base58 da carteira (32 bytes decodificados)</param>
    /// <param name="signatureBase58">Assinatura em Base58 (64 bytes decodificados)</param>
    /// <param name="message">A mensagem UTF-8 em texto puro que foi assinada</param>
    /// <returns>True se a assinatura for matematicamente autêntica; caso contrário, False.</returns>
    public static bool VerifySignature(string walletAddress, string signatureBase58, string message)
    {
        if (string.IsNullOrWhiteSpace(walletAddress) || 
            string.IsNullOrWhiteSpace(signatureBase58) || 
            string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        try
        {
            var pubKeyBytes = Base58.Bitcoin.Decode(walletAddress).ToArray();
            if (pubKeyBytes.Length != 32)
            {
                return false;
            }

            var sigBytes = Base58.Bitcoin.Decode(signatureBase58).ToArray();
            if (sigBytes.Length != 64)
            {
                return false;
            }

            var messageBytes = Encoding.UTF8.GetBytes(message);

            var publicKeyParams = new Ed25519PublicKeyParameters(pubKeyBytes, 0);
            var signer = new Ed25519Signer();
            signer.Init(false, publicKeyParams);
            signer.BlockUpdate(messageBytes, 0, messageBytes.Length);

            return signer.VerifySignature(sigBytes);
        }
        catch
        {
            return false;
        }
    }
}

