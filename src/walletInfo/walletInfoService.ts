// services/walletService.ts
import { Connection, PublicKey } from "@solana/web3.js";

export const fetchWalletInfo = async (address: string) => {
  const connection = new Connection("https://api.devnet.solana.com");
  const publicKey = new PublicKey(address);

  try {
    const [balance, accountInfo] = await Promise.all([
      connection.getBalance(publicKey),
      connection.getAccountInfo(publicKey),
    ]);

    return {
      address: publicKey.toBase58(),
      balance: balance / 10 ** 9, // 转换为SOL单位
      executable: accountInfo?.executable || false,
      owner: accountInfo?.owner.toBase58() || "",
      lamports: balance,
    };
  } catch (error) {
    throw new Error("Invalid wallet address");
  }
};

export const fetchTransactionHistory = async (address: string, limit = 5) => {
  const connection = new Connection("https://api.devnet.solana.com");
  const publicKey = new PublicKey(address);

  const signatures = await connection.getConfirmedSignaturesForAddress2(
    publicKey,
    { limit }
  );

  return signatures.map((tx) => ({
    signature: tx.signature,
    blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
    status: tx.confirmationStatus,
  }));
};
