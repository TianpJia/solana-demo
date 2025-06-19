import { useWallet } from "@solana/wallet-adapter-react";
import { getCpmmPool } from "./raydiumService";
import { raydiumCpmmSwap } from "./swap";
import { useEffect, useState } from "react";
import { initSdk } from "../config";

export const RaydiumSwap = () => {
  const { publicKey, signAllTransactions } = useWallet();
  const [amount, setAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [cpmmPoolId, setCpmmPoolId] = useState("");

  const swapToken = async (action: "buy" | "sell") => {
    const inputAmount = action === "buy" ? amount : sellAmount;
    if (!cpmmPoolId || !Number(inputAmount)) {
      console.info("Empty pool address or empty amount");
      return;
    }
    raydiumCpmmSwap(cpmmPoolId, 0.001, Number(inputAmount), action);
  };

  const fetchPoolInfo = () => {
    if (!cpmmPoolId) {
      console.info("Invalid pool address");
      return;
    }
    getCpmmPool(cpmmPoolId);
  };

  useEffect(() => {
    if (!publicKey || !signAllTransactions) {
      return;
    }
    initSdk({
      loadToken: true,
      publicKey,
      signAllTransactions,
    });
  }, [publicKey, signAllTransactions]);

  return (
    <>
      <div className="token-transfer-container">
        <h2>代币转账</h2>

        {publicKey && (
          <div className="form-container">
            {/* 收款地址 */}
            <div className="form-group">
              <label
                onClick={() => {
                  fetchPoolInfo();
                }}
              >
                <a> Cpmm Pool Address</a>
              </label>
              <input
                type="text"
                value={cpmmPoolId}
                onChange={(e) => setCpmmPoolId(e.target.value)}
                placeholder="输入cpmm池子地址"
              />
            </div>

            <div className="form-group">
              <label>Amout to buy in SOL</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <button
              onClick={() => {
                swapToken("buy");
              }}
              className="transfer-button"
              disabled={!publicKey}
            >
              Buy
            </button>

            <div className="form-group">
              <label>Amout to sell in SOL</label>
              <input
                type="text"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <button
              onClick={() => {
                swapToken("sell");
              }}
              className="transfer-button"
              disabled={!publicKey}
            >
              Sell
            </button>
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
          button{
          margin-left:5px;
          }
          input {
          width: 90%;
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
    </>
  );
};
