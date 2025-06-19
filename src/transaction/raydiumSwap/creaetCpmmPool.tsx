import { useWallet } from "@solana/wallet-adapter-react";

import { useState } from "react";
import { createPool } from "./createCpmmPool";
import { NATIVE_MINT } from "@solana/spl-token";

export const CreatePoolComponent = () => {
  const { publicKey, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const createCpmmPool = async () => {
    if (!publicKey || !signAllTransactions) {
      return;
    }
    if (!token) {
      console.info("Empty token address");
      return;
    }
    setLoading(true);
    try {
      const txid = await createPool(
        publicKey,
        signAllTransactions,
        token,
        NATIVE_MINT.toBase58()
      );
      setTxId(txid);
    } catch (error) {
      console.error("创建池失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="form-group">
        <label>Token Address</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Input token address"
        />
      </div>
      <button onClick={() => createCpmmPool()} disabled={!publicKey || loading}>
        {loading ? "Inprogress..." : "Create Cpmm Pool"}
      </button>
      {txId && (
        <p>
          交易成功！查看:{" "}
          <a
            href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Solana Explorer
          </a>
        </p>
      )}
    </div>
  );
};
