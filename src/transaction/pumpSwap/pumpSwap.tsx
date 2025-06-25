import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import axios from "axios";
import BN from "bn.js";
import { PumpAmmSdk } from "@pump-fun/pump-swap-sdk";

// Pump.fun API 端点
const PUMP_API = "https://api.pump.fun";

export default function PumpSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const pumpAmmSdk = new PumpAmmSdk(connection);
  // 状态管理
  const [tokenAddress, setTokenAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState("");
  const [txHistory, setTxHistory] = useState<any[]>([]);

  const buy = () => {
    if (!amount || !poolAddress) {
      console.info("无效输入");
      return;
    }
    const qutoeAmout = Number(amount) * LAMPORTS_PER_SOL;
    pumpAmmSwap(new PublicKey(poolAddress), new BN(qutoeAmout));
  };

  const fetchPumpPool = async () => {
    const info = await pumpAmmSdk.fetchPool(new PublicKey(poolAddress));
    console.info(info);
  };

  const pumpAmmSwap = async (
    pool: PublicKey,
    quoteAmount: BN,
    slippage = 5
  ) => {
    if (!publicKey || !signTransaction) return;
    try {
      const baseAmout = await pumpAmmSdk.swapAutocompleteBaseFromQuote(
        pool,
        quoteAmount,
        slippage,
        "quoteToBase"
      );
      const swapInstructions = await pumpAmmSdk.swapBaseInstructions(
        pool,
        baseAmout,
        slippage,
        "quoteToBase",
        publicKey
      );
      const transaction = new Transaction().add(...swapInstructions);
      transaction.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      console.info("交易成功");
    } catch (error) {
      console.info("交易失败", error);
    }
  };

  return (
    <div className="pump-swap-container">
      <h2>Pump.fun 交易</h2>

      <div className="input-group">
        <input
          type="text"
          value={poolAddress}
          onChange={(e) => setPoolAddress(e.target.value)}
          placeholder="输入流动池地址"
        />
        <button onClick={() => fetchPumpPool()}>查询</button>
      </div>

      <div className="trade-panel">
        <div className="action-selector">
          <button
            className={action === "buy" ? "active" : ""}
            onClick={() => setAction("buy")}
          >
            买入
          </button>
          <button
            className={action === "sell" ? "active" : ""}
            onClick={() => setAction("sell")}
          >
            卖出
          </button>
        </div>

        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`输入要${action === "buy" ? "购买" : "出售"}的数量`}
        />

        <button
          onClick={() => {
            buy();
          }}
          className="trade-button"
        >
          {status || `${action === "buy" ? "购买" : "出售"}代币`}
        </button>
      </div>

      <style>{`
        .pump-swap-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          background: #1e1e1e;
          color: white;
          border-radius: 8px;
        }
        .input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .input-group input {
          flex: 1;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2d2d2d;
          color: white;
        }
        .input-group button {
          padding: 0 15px;
          background: #333;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }
        .token-info {
          background: #252525;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .trade-panel {
          background: #252525;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .action-selector {
          display: flex;
          margin-bottom: 15px;
        }
        .action-selector button {
          flex: 1;
          padding: 10px;
          border: none;
          background: #333;
          color: white;
          cursor: pointer;
        }
        .action-selector button.active {
          background: #14f195;
          color: black;
          font-weight: bold;
        }
        .trade-panel input {
          width: 100%;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2d2d2d;
          color: white;
        }
        .trade-button {
          width: 100%;
          padding: 12px;
          background: #14f195;
          color: black;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
        }
        .trade-button:disabled {
          background: #555;
          cursor: not-allowed;
        }
        .estimate {
          margin-top: 10px;
          font-size: 14px;
          color: #aaa;
          text-align: center;
        }
        .tx-history {
          background: #252525;
          padding: 15px;
          border-radius: 6px;
        }
        .tx-history ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .tx-history li {
          padding: 8px 0;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tx-history li span {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .tx-history li span.buy {
          background: rgba(20, 241, 149, 0.2);
          color: #14f195;
        }
        .tx-history li span.sell {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }
        .tx-history li a {
          color: #14f195;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
