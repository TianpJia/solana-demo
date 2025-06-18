import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddress,
  createMintToInstruction,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import styles from "./index.module.css";

export default function MintTokens() {
  const { connection } = useConnection();
  const [mintAddress, setMintAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState(1000);
  const wallet = useWallet();
  const handleMint = async () => {
    if (!wallet.publicKey || !mintAddress) return;

    try {
      const transaction = new Transaction();
      const mintPubKey = new PublicKey(mintAddress);
      const recipientPubKey = new PublicKey(recipientAddress);
      //get recipient ATA address
      const ataToken = await getAssociatedTokenAddress(
        mintPubKey,
        recipientPubKey
      );

      transaction.add(
        createMintToInstruction(
          mintPubKey,
          ataToken,
          wallet.publicKey,
          BigInt(Number(amount))
        )
      );
      const sig = await wallet.sendTransaction(transaction, connection);
      const block = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: block.blockhash,
        lastValidBlockHeight: block.lastValidBlockHeight,
      });
    } catch (error) {
      console.info(error);
    }
  };

  return (
    <div className={styles.container}>
      <h3>Mint Tokens</h3>
      <input
        value={mintAddress}
        onChange={(e) => setMintAddress(e.target.value)}
        placeholder="mint address"
      />
      <input
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        placeholder="recipient address"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="数量"
      />
      <button onClick={handleMint}>Mint</button>
    </div>
  );
}
