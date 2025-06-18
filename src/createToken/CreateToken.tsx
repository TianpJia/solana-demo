import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";

export default function CreateToken() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [mintAddress, setMintAddress] = useState("");
  const [decimals, setDecimals] = useState(9);

  const handleCreate = async () => {
    if (!publicKey || !connection) return;

    try {
      // Create tmp keypair to pay the fee of token creation
      const mint = Keypair.generate();
      //get mini balance for rent.
      const lamports = await getMinimumBalanceForRentExemptAccount(connection);
      //transfer rent to tmp keypair.
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mint.publicKey,
          decimals,
          publicKey,
          publicKey,
          TOKEN_PROGRAM_ID
        )
      );
      const sig = await sendTransaction(tx, connection, { signers: [mint] });
      console.info(sig, "sig");
      setMintAddress(mint.publicKey.toBase58());
    } catch (error) {
      console.info("Create Token failed.", error);
    }
  };

  return (
    <div>
      <h3>Create Token</h3>
      <input
        type="number"
        value={decimals}
        onChange={(e) => setDecimals(Number(e.target.value))}
        placeholder="小数位数"
      />
      <button onClick={handleCreate}>Create</button>
      {mintAddress && <p>代币地址: {mintAddress}</p>}
    </div>
  );
}
