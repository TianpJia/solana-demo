import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useState, type FC } from "react";
import styles from "./index.module.css";

export const CreateAssociatedToken: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [mintAddress, setMintAddress] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  const handleCreateATA = async () => {
    if (!connection || !wallet.publicKey || !mintAddress || !ownerAddress)
      return;
    try {
      const transaction = new Transaction();
      const mintPubKey = new PublicKey(mintAddress);
      const ownerPubKey = new PublicKey(ownerAddress);

      //get ATA address
      const ata = await getAssociatedTokenAddress(mintPubKey, ownerPubKey);

      //create ata tx
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          ata,
          ownerPubKey,
          mintPubKey
        )
      );
      const sig = await wallet.sendTransaction(transaction, connection);
      const block = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: block.blockhash,
        lastValidBlockHeight: block.lastValidBlockHeight,
      });
      console.info("Create ATA success");
      setMintAddress("");
      setOwnerAddress("");
    } catch (error) {}
  };
  return (
    <div className={styles.container}>
      <h3>Create ATA</h3>
      <input
        value={mintAddress}
        onChange={(e) => setMintAddress(e.target.value)}
        placeholder="mint address"
      />
      <input
        value={ownerAddress}
        onChange={(e) => setOwnerAddress(e.target.value)}
        placeholder="owner address"
      />
      <button onClick={handleCreateATA}>Create ATA</button>
    </div>
  );
};
