import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  getMint,
} from "@solana/spl-token";

export default function TokenTransfer() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // 状态管理
  const [tokenMint, setTokenMint] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(9);
  const [status, setStatus] = useState("");
  const [txSignature, setTxSignature] = useState("");

  // 获取代币余额
  const fetchTokenBalance = useCallback(async () => {
    if (!publicKey || !tokenMint) return;

    try {
      setStatus("获取余额中...");
      const mintPublicKey = new PublicKey(tokenMint);
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      const [accountInfo, mintInfo] = await Promise.all([
        getAccount(connection, tokenAccountAddress).catch(() => null),
        getMint(connection, mintPublicKey),
      ]);

      setTokenDecimals(mintInfo.decimals);
      setBalance(
        accountInfo ? Number(accountInfo.amount) / 10 ** mintInfo.decimals : 0
      );
      setStatus("");
    } catch (error) {
      console.error("获取余额失败:", error);
      setStatus("获取余额失败");
    }
  }, [publicKey, tokenMint, connection]);

  // 转账代币
  const transferTokens = async () => {
    if (!publicKey || !signTransaction || !tokenMint || !recipient || !amount)
      return;

    try {
      setStatus("准备交易...");
      const mintPublicKey = new PublicKey(tokenMint);
      const recipientPublicKey = new PublicKey(recipient);

      // 1. 获取关联Token账户地址
      const sourceAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      const destAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
      );

      // 2. 创建转账指令
      const transferAmount = Number(amount) * 10 ** tokenDecimals;
      const transferInstruction = createTransferInstruction(
        sourceAccount,
        destAccount,
        publicKey,
        transferAmount
      );

      // 3. 构建并发送交易
      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = publicKey;

      setStatus("获取最新区块哈希...");
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      setStatus("签名交易...");
      const signedTx = await signTransaction(transaction);

      setStatus("发送交易...");
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      setTxSignature(signature);

      // 4. 确认交易
      setStatus("确认交易中...");
      await connection.confirmTransaction(signature, "confirmed");

      setStatus("转账成功!");
      fetchTokenBalance(); // 刷新余额
    } catch (error) {
      console.error("转账失败:", error);
      setStatus(`错误: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  // 代币余额自动刷新
  useEffect(() => {
    fetchTokenBalance();
  }, [fetchTokenBalance]);

  // 常用代币列表
  const popularTokens = [
    { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC" },
    { mint: "So11111111111111111111111111111111111111112", symbol: "SOL" },
    { mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL" },
  ];

  return (
    <div className="token-transfer-container">
      <h2>代币转账</h2>

      {publicKey && (
        <div className="form-container">
          {/* 代币选择 */}
          <div className="form-group">
            <label>代币合约地址</label>
            <div className="token-selector">
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                placeholder="输入代币Mint地址"
              />
              <div className="popular-tokens">
                {popularTokens.map((token) => (
                  <button
                    key={token.mint}
                    onClick={() => setTokenMint(token.mint)}
                    className="token-chip"
                  >
                    {token.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 余额显示 */}
          {balance !== null && (
            <div className="balance-info">
              当前余额: {balance.toFixed(tokenDecimals)} {tokenMint.slice(0, 4)}
              ...{tokenMint.slice(-4)}
            </div>
          )}

          {/* 收款地址 */}
          <div className="form-group">
            <label>收款地址</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="输入收款人Solana地址"
            />
          </div>

          {/* 转账金额 */}
          <div className="form-group">
            <label>转账数量</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="any"
            />
          </div>

          {/* 操作按钮 */}
          <button
            onClick={transferTokens}
            disabled={!tokenMint || !recipient || !amount || !!status}
            className="transfer-button"
          >
            {status || "确认转账"}
          </button>

          {/* 交易结果 */}
          {txSignature && (
            <div className="transaction-result">
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                查看交易详情
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        .token-transfer-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 8px;
          background: #1e1e1e;
          color: white;
        }
        .form-container {
          margin-top: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2d2d2d;
          color: white;
        }
        .token-selector {
          position: relative;
        }
        .popular-tokens {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .token-chip {
          padding: 4px 8px;
          background: #333;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          border: none;
          color: white;
        }
        .token-chip:hover {
          background: #444;
        }
        .balance-info {
          margin: 10px 0;
          font-size: 14px;
          color: #aaa;
        }
        .transfer-button {
          width: 100%;
          padding: 12px;
          background: #14f195;
          color: black;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
        }
        .transfer-button:disabled {
          background: #555;
          cursor: not-allowed;
        }
        .transaction-result {
          margin-top: 15px;
          text-align: center;
        }
        .transaction-result a {
          color: #14f195;
        }
      `}</style>
    </div>
  );
}
