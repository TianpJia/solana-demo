import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import axios from "axios";

// Pump.fun API 端点
const PUMP_API = "https://api.pump.fun";

export default function PumpSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // 状态管理
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState("");
  const [txHistory, setTxHistory] = useState<any[]>([]);

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!tokenAddress) return;

    try {
      setStatus("获取代币信息...");
      const response = await axios.get(`${PUMP_API}/tokens/${tokenAddress}`);
      setTokenInfo(response.data);
      setPrice(response.data.price);
      setStatus("");
    } catch (error) {
      setStatus("获取代币信息失败");
      console.error(error);
    }
  };

  // 获取交易历史
  const fetchTxHistory = async () => {
    if (!tokenAddress) return;

    try {
      const response = await axios.get(`${PUMP_API}/history/${tokenAddress}`);
      setTxHistory(response.data.slice(0, 5));
    } catch (error) {
      console.error("获取历史失败:", error);
    }
  };

  // 执行交易
  const executeTrade = async () => {
    if (!publicKey || !signTransaction || !tokenAddress || !amount) return;

    try {
      setStatus("准备交易...");

      // 1. 获取最新交易参数
      const { data: quote } = await axios.post(`${PUMP_API}/quote`, {
        tokenAddress,
        action,
        amount: parseFloat(amount),
        userAddress: publicKey.toBase58(),
      });

      // 2. 构建交易
      const transaction = Transaction.from(
        Buffer.from(quote.transaction, "base64")
      );

      setStatus("签名交易...");
      const signedTx = await signTransaction(transaction);

      setStatus("发送交易...");
      const txid = await connection.sendRawTransaction(signedTx.serialize());

      setStatus("确认中...");
      await connection.confirmTransaction(txid);

      setStatus(`${action === "buy" ? "购买" : "出售"}成功!`);
      fetchTokenInfo(); // 刷新信息
      fetchTxHistory(); // 刷新历史
    } catch (error) {
      console.error("交易失败:", error);
      setStatus(`错误: ${error instanceof Error ? error.message : "交易失败"}`);
    }
  };

  // 自动获取信息
  useEffect(() => {
    fetchTokenInfo();
    fetchTxHistory();
  }, [tokenAddress]);

  return (
    <div className="pump-swap-container">
      <h2>Pump.fun 交易</h2>

      <div className="input-group">
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="输入代币地址"
        />
        <button onClick={fetchTokenInfo}>查询</button>
      </div>

      {tokenInfo && (
        <div className="token-info">
          <h3>
            {tokenInfo.name} ({tokenInfo.symbol})
          </h3>
          <p>价格: {price} SOL</p>
          <p>市值: {tokenInfo.marketCap} SOL</p>
          <p>流动性: {tokenInfo.liquidity} SOL</p>
        </div>
      )}

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
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`输入要${action === "buy" ? "购买" : "出售"}的数量`}
        />

        <button
          onClick={executeTrade}
          disabled={!tokenAddress || !amount || !publicKey || !!status}
          className="trade-button"
        >
          {status || `${action === "buy" ? "购买" : "出售"}代币`}
        </button>

        {action === "buy" && amount && price && (
          <p className="estimate">
            预计支付: {(parseFloat(amount) * price).toFixed(6)} SOL
          </p>
        )}
      </div>

      {txHistory.length > 0 && (
        <div className="tx-history">
          <h4>最近交易</h4>
          <ul>
            {txHistory.map((tx, i) => (
              <li key={i}>
                <span className={tx.action}>{tx.action}</span>
                {tx.amount} {tokenInfo?.symbol} @ {tx.price} SOL
                <a
                  href={`https://solscan.io/tx/${tx.txid}?cluster=devnet`}
                  target="_blank"
                  rel="noopener"
                >
                  查看
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

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
